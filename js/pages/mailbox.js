/**
 * 📬 SMALLSM ARCHIVE - MAILBOX SCRIPT
 * Handles anonymous message submission and viewing replies.
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    // 1. INITIALIZATION
    // ═══════════════════════════════════════════════════

    document.addEventListener('DOMContentLoaded', () => {
        console.log('📬 Mailbox Module Initializing...');

        // Initial tab setup
        switchTab('write');

        // Check if SML_CORE is ready
        if (window.SML_CORE) {
            window.SML_CORE.waitForConfig(() => {
                if (window.SML_CORE.initializeSupabase()) {
                    loadCategories();
                    loadPublicMessages();
                }
            });
        }
    });

    async function loadCategories() {
        if (!window.supabaseClient) return;
        try {
            const { data: categories } = await window.supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

            const { data: posts } = await window.supabaseClient
                .from('archive_posts')
                .select('category_id, is_private')
                .eq('is_private', false);

            const counts = {};
            if (posts) {
                posts.forEach(p => {
                    counts[p.category_id] = (counts[p.category_id] || 0) + 1;
                });
            }
            renderSidebarNav(categories || [], counts);
        } catch (e) {
            console.error('Mailbox category load failed:', e);
        }
    }

    function renderSidebarNav(categories, counts) {
        const nav = document.getElementById('categoryNav');
        if (!nav) return;

        const isDesktop = window.innerWidth >= 1024;
        const backButton = `
            <li class="mb-4">
                <a href="index.html" 
                   class="flex items-center gap-2 text-xs font-bold text-[var(--wiki-gold)] hover:text-white transition-colors uppercase tracking-widest font-mono">
                    <i data-lucide="arrow-left" class="w-3 h-3"></i> Back to Archive
                </a>
            </li>
        `;

        // Simplify for mailbox: just show back button and categories
        nav.innerHTML = `
            ${isDesktop ? backButton : ''}
            <div class="wiki-nav-header mb-4">
                <h2 class="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase font-mono">Archive Categories</h2>
            </div>
            ${categories.filter(c => !c.parent_id).map(root => `
                <li class="category-item mb-2">
                    <a href="index.html#category-${root.id}" class="text-sm text-slate-400 hover:text-[var(--wiki-gold)] transition-colors">
                        ${root.name} <span class="text-[10px] opacity-50 ml-1">(${counts[root.id] || 0})</span>
                    </a>
                </li>
            `).join('')}
        `;
        if (window.lucide) window.lucide.createIcons();
    }

    // ═══════════════════════════════════════════════════
    // 2. TAB LOGIC
    // ═══════════════════════════════════════════════════

    window.switchTab = function (tabName) {
        // Update button states
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
        });

        // Update content visibility
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabName}`);
        });

        if (tabName === 'view') {
            loadPublicMessages();
        }
    };

    // ═══════════════════════════════════════════════════
    // 3. MESSAGE SUBMISSION
    // ═══════════════════════════════════════════════════

    window.submitMessage = async function () {
        const nickname = document.getElementById('senderNickname').value.trim() || '익명';
        const content = document.getElementById('messageContent').value.trim();
        const allowPublic = document.getElementById('allowPublic').checked;
        const password = document.getElementById('msgPassword').value.trim();

        if (!content) {
            alert('이야기 내용을 입력해주세요.');
            return;
        }

        if (!password) {
            alert('수정/삭제를 위한 비밀번호를 입력해주세요.');
            return;
        }

        if (!window.supabaseClient) {
            alert('시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        const btnSend = document.querySelector('.btn-send');
        btnSend.disabled = true;
        btnSend.textContent = '보내는 중... ✉️';

        try {
            const { error } = await window.supabaseClient
                .from('anonymous_messages')
                .insert([{
                    sender_name: nickname,
                    content: content,
                    is_public: allowPublic,
                    password: password, // In a real app, hash this!
                    status: 'pending'
                }]);

            if (error) throw error;

            alert('편지가 무사히 도착했습니다. 관리자가 확인 후 답변 드릴게요. 📮');

            // Success cleanup
            document.getElementById('messageContent').value = '';
            document.getElementById('msgPassword').value = '';
            switchTab('view');

        } catch (error) {
            console.error('Submission failed:', error);
            alert('전송 중 오류가 발생했습니다: ' + error.message);
        } finally {
            btnSend.disabled = false;
            btnSend.textContent = '우표 붙여 보내기 📮';
        }
    };

    // ═══════════════════════════════════════════════════
    // 4. LOADING & VIEWING
    // ═══════════════════════════════════════════════════

    async function loadPublicMessages() {
        const container = document.getElementById('publicMessageList');
        if (!container || !window.supabaseClient) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('anonymous_messages')
                .select('*')
                .eq('is_public', true)
                .not('answer', 'is', null) // Only show answered ones publicly
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (!data || data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <p>아직 공개된 답장이 없습니다.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = data.map(msg => `
                <div class="message-item" onclick="openMessageDetail('${msg.id}')">
                    <div class="msg-item-header">
                        <span class="msg-nickname">${msg.sender_name}</span>
                        <span class="msg-date">${new Date(msg.created_at).toLocaleDateString()}</span>
                    </div>
                    <p class="msg-preview">${msg.content.substring(0, 50)}${msg.content.length > 50 ? '...' : ''}</p>
                    <div class="msg-status-tag">답변완료 💌</div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Failed to load messages:', error);
            container.innerHTML = '<p class="error-text">메시지를 불러오지 못했습니다.</p>';
        }
    }

    window.openMessageDetail = async function (msgId) {
        if (!window.supabaseClient) return;

        try {
            const { data, error } = await window.supabaseClient
                .from('anonymous_messages')
                .select('*')
                .eq('id', msgId)
                .single();

            if (error) throw error;

            document.getElementById('modalNickname').textContent = data.sender_name;
            document.getElementById('modalDate').textContent = new Date(data.created_at).toLocaleDateString();
            document.getElementById('modalQuestion').textContent = data.content;
            document.getElementById('modalAnswer').textContent = data.answer || '아직 답변이 등록되지 않았습니다.';

            const modal = document.getElementById('messageModal');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

        } catch (error) {
            console.error('Failed to load detail:', error);
        }
    };

    // Close Modal Logic
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('messageModal');
        if (e.target === modal || e.target.classList.contains('close-modal')) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

})();
