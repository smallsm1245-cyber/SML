// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - UNIFIED ADMIN SCRIPT (Final)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📱 Admin system initializing...');

let supabase = null;
let isConfigReady = false;

// 1. 설정 로드 대기
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

// 2. UI 표시 제어
function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => { loginError.style.display = 'none'; }, 3000);
    }
}

// 3. 텍스트 포맷팅 (B, I, U) - 텍스트 입력 방식에 맞춰 개선
function insertFormat(type) {
    const editor = document.getElementById('contentEditor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);
    
    let formatted = "";
    if (type === 'bold') formatted = `**${selectedText}**`;
    else if (type === 'italic') formatted = `*${selectedText}*`;
    else if (type === 'underline') formatted = `_${selectedText}_`;
    
    editor.value = text.substring(0, start) + formatted + text.substring(end);
    updatePreview();
    editor.focus();
}

// 4. 실시간 미리보기 (Markdown-like 처리)
function updatePreview() {
    const editor = document.getElementById('contentEditor');
    const preview = document.getElementById('contentPreview');
    if (!editor || !preview) return;

    preview.innerHTML = editor.value
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<u>$1</u>')
        .replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" style="max-width: 100%; border-radius: 4px; margin: 10px 0;">')
        .replace(/\n/g, '<br>');
    
    // 자동 저장 (Local Storage)
    localStorage.setItem('draft_content', editor.value);
    localStorage.setItem('draft_title', document.getElementById('postTitle').value);
}

// 5. 이미지 업로드 함수
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `images/${fileName}`;
    
    const { data, error } = await supabase.storage.from('archive-images').upload(filePath, file);
    if (error) throw error;
    
    const { data: urlData } = supabase.storage.from('archive-images').getPublicUrl(filePath);
    return urlData.publicUrl;
}

// 6. 데이터 로드 (카테고리)
async function loadAdminData() {
    // 카테고리 선택 옵션 로드
    const { data: categories } = await supabase.from('categories').select('*').order('display_order');
    const select = document.getElementById('postCategory');
    const listContainer = document.getElementById('categoryList');

    if (select && categories) {
        select.innerHTML = '<option value="">카테고리 선택</option>';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    }

    if (listContainer && categories) {
        listContainer.innerHTML = categories.map(cat => `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(206, 177, 128, 0.1); border: 1px solid var(--glass-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div><strong>${cat.name}</strong> <span style="font-size:0.8rem; color: var(--text-secondary); margin-left:10px;">${cat.is_visible ? '공개' : '비공개'}</span></div>
                <button class="editor-btn" onclick="window.toggleCategoryVisibility('${cat.id}', ${cat.is_visible})">상태 변경</button>
            </div>
        `).join('');
    }
}

// 7. 메인 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    
    supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    isConfigReady = true;

    // 로그인 여부 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === window.ADMIN_EMAIL) {
        showAdminPanel();
        await loadAdminData();
    }

    // [이벤트] 로그인
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (email !== window.ADMIN_EMAIL) return showError('관리자 권한이 없습니다.');

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) showError('로그인 실패: ' + error.message);
        else location.reload();
    });

    // [이벤트] 에디터 실시간 입력
    const editor = document.getElementById('contentEditor');
    editor?.addEventListener('input', updatePreview);
    document.getElementById('postTitle')?.addEventListener('input', updatePreview);

    // [이벤트] 드래프트 복원
    const savedContent = localStorage.getItem('draft_content');
    if (savedContent && confirm('작성 중이던 임시 글이 있습니다. 불러오시겠습니까?')) {
        editor.value = savedContent;
        document.getElementById('postTitle').value = localStorage.getItem('draft_title') || '';
        updatePreview();
    }

    // [이벤트] 게시물 저장
    document.getElementById('savePostBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('postTitle').value.trim();
        const content = editor.value.trim();
        const category_id = document.getElementById('postCategory').value;

        if (!title || !content || !category_id) return alert('모든 필드를 입력해주세요.');

        const { error } = await supabase.from('archive_posts').insert([{
            title, content, category_id,
            is_private: document.getElementById('isPrivate').checked,
            origin_free: document.getElementById('originFree').checked
        }]);

        if (error) alert('저장 실패: ' + error.message);
        else {
            alert('성공적으로 저장되었습니다!');
            localStorage.removeItem('draft_content');
            localStorage.removeItem('draft_title');
            location.reload();
        }
    });

    // [이벤트] 이미지 업로드 버튼 동적 추가
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
        const imgBtn = document.createElement('button');
        imgBtn.className = 'editor-btn';
        imgBtn.textContent = '🖼️ 이미지';
        imgBtn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    imgBtn.textContent = '⌛...';
                    const url = await uploadImage(file);
                    editor.value += `\n![이미지](${url})\n`;
                    updatePreview();
                } catch (err) { alert('업로드 실패'); }
                finally { imgBtn.textContent = '🖼️ 이미지'; }
            };
            input.click();
        };
        toolbar.appendChild(imgBtn);
    }

    // [이벤트] 로그아웃
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (confirm('로그아웃하시겠습니까?')) {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        }
    });
});

// 전역 함수 등록
window.toggleCategoryVisibility = async (id, current) => {
    await supabase.from('categories').update({ is_visible: !current }).eq('id', id);
    loadAdminData();
};

window.formatText = (cmd) => insertFormat(cmd); // HTML 내 onclick과 연결
