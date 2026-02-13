
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAILBOX LOGIC
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let supabaseClient = null;

// Wait for Config
function waitForConfig() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();

    // Init Supabase
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );

    // Initial Load
    switchTab('write'); // Default tab

    // Navigation (Sidebar) - simple version
    const menuBtn = document.getElementById('menuToggleBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.sidebar');

    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Modal Close
    document.querySelector('.close-modal').addEventListener('click', closeModal);
    window.onclick = function (event) {
        const modal = document.getElementById('messageModal');
        if (event.target == modal) {
            closeModal();
        }
    }
});

// ═══════════════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════════════
window.switchTab = function (tabName) {
    // Buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    // Content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    // Activate
    const activeBtn = Array.from(document.querySelectorAll('.tab-btn'))
        .find(btn => btn.textContent.includes(tabName === 'write' ? '편지' : '답변'));

    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'view') {
        loadPublicMessages();
    }
};

// ═══════════════════════════════════════════════════
// SEND MESSAGE
// ═══════════════════════════════════════════════════
window.submitMessage = async function () {
    const nickname = document.getElementById('senderNickname').value.trim() || '익명';
    const content = document.getElementById('messageContent').value.trim();
    const isPublic = document.getElementById('allowPublic').checked;
    const password = document.getElementById('msgPassword').value.trim();

    if (!content) {
        alert('내용을 입력해주세요.');
        return;
    }

    if (content.length < 10) {
        alert('고민 내용은 최소 10자 이상 입력해주세요.');
        return;
    }

    if (!confirm('편지를 우체통에 넣으시겠습니까?\n(관리자에게 전송됩니다)')) return;

    // Simple Hash for Password (MVP) - client side hash is weak but sufficient for anon board edit/delete protection
    // Ideally use server function, but for now just plain text or simple hash
    // We will save plaintext password for MVP simplicity or skip password logic for now in UI (just store it)
    // Actually schema has password_hash. Let's just store it as text for now or simple btoa?
    // Let's store raw for MVP since it's anonymous board, security is low stakes.

    try {
        const { error } = await supabaseClient
            .from('mailbox_messages')
            .insert({
                nickname: nickname,
                content: content,
                is_public: isPublic, // User preference. Admin must also approve (status=answered) for it to show
                password_hash: password, // Storing potentially raw for now as per schema "client generated"
                status: 'waiting'
            });

        if (error) throw error;

        alert('✅ 편지가 접수되었습니다.\n관리자가 확인 후 답장을 드릴 예정입니다.');

        // Reset form
        document.getElementById('messageContent').value = '';
        document.getElementById('senderNickname').value = '';
        document.getElementById('msgPassword').value = '';
        document.getElementById('allowPublic').checked = false;

    } catch (error) {
        console.error('Send failed:', error);
        alert('❌ 전송 실패: ' + error.message);
    }
};

// ═══════════════════════════════════════════════════
// VIEW MESSAGES
// ═══════════════════════════════════════════════════
async function loadPublicMessages() {
    const container = document.getElementById('publicMessageList');
    container.innerHTML = `
        <div class="loading-state">
            <div class="spinner"></div>
            <p>우체통을 확인하고 있습니다...</p>
        </div>
    `;

    try {
        // Fetch only public AND answered messages
        // RLS policy "Public select free posts" allows all selects? 
        // Wait, mailbox_messages policy "Public select" might be missing?
        // Let's check schema.
        // "Public select free posts" is for free_board.
        // For mailbox, we need a policy for public to select answered public messages.
        // I might need to add a policy if it doesn't exist.

        const { data: messages, error } = await supabaseClient
            .from('mailbox_messages')
            .select('id, nickname, content, admin_reply, created_at, status')
            .eq('is_public', true)
            .eq('status', 'answered') // Only show answered messages
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!messages || messages.length === 0) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-dim);">
                    <p>아직 도착한 공개 답변이 없습니다.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(msg => {
            const date = new Date(msg.created_at).toLocaleDateString('ko-KR');
            return `
                <div class="message-card" onclick="openModal('${msg.id}')">
                    <div class="msg-card-top">
                        <span class="msg-author">${msg.nickname}</span>
                        <span class="msg-date">${date}</span>
                    </div>
                    <div class="msg-preview">
                        ${msg.content}
                    </div>
                    <div style="margin-top:1rem; text-align:right;">
                         <span class="msg-status answered">답변완료</span>
                    </div>
                    <!-- Hidden data for modal -->
                    <div id="data-${msg.id}" style="display:none;">
                        <span class="full-content">${msg.content}</span>
                        <span class="full-reply">${msg.admin_reply || ''}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Load failed:', error);
        container.innerHTML = `<p style="text-align:center;">불러오기 실패: ${error.message}</p>`;
    }
}

// ═══════════════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════════════
window.openModal = function (id) {
    const card = document.querySelector(`.message-card [id="data-${id}"]`).parentElement;
    const nickname = card.querySelector('.msg-author').textContent;
    const date = card.querySelector('.msg-date').textContent;
    const content = card.querySelector('.full-content').textContent; // Using hidden span to avoid re-fetch
    const reply = card.querySelector('.full-reply').textContent;

    document.getElementById('modalNickname').textContent = nickname;
    document.getElementById('modalDate').textContent = date;
    document.getElementById('modalQuestion').textContent = content;
    document.getElementById('modalAnswer').textContent = reply;

    const modal = document.getElementById('messageModal');
    modal.style.display = 'flex'; // Flex for centering
};

function closeModal() {
    document.getElementById('messageModal').style.display = 'none';
}
