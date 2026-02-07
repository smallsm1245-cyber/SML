// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - UNIFIED ADMIN SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📱 Admin system initializing...');

let supabase = null;
let isConfigReady = false;

// 1. Config 및 라이브러리 로드 대기
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

// 2. UI 제어 함수
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

// 3. 인증 체크 및 데이터 로드
async function checkAuth() {
    if (!supabase) return;
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) return;

        if (user.email !== window.ADMIN_EMAIL) {
            alert('관리자 권한이 없습니다.');
            await supabase.auth.signOut();
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Admin authenticated:', user.email);
        showAdminPanel();
        await loadAllAdminData();
    } catch (e) { console.error('Auth check error:', e); }
}

async function loadAllAdminData() {
    await loadCategoryOptions();
    await loadCategoryManagement();
}

// 4. 카테고리 관리 로직
async function loadCategoryOptions() {
    const { data: categories, error } = await supabase.from('categories').select('*').order('display_order');
    if (error) return console.error('카테고리 로드 실패:', error);
    
    const select = document.getElementById('postCategory');
    if (select) {
        select.innerHTML = '<option value="">카테고리 선택</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }
}

async function loadCategoryManagement() {
    const { data: categories } = await supabase.from('categories').select('*').order('display_order');
    const container = document.getElementById('categoryList');
    if (container && categories) {
        container.innerHTML = categories.map(cat => `
            <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(206, 177, 128, 0.1); border: 1px solid var(--glass-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div><strong>${cat.name}</strong> <span style="margin-left: 10px; font-size:0.8rem; color: var(--text-secondary);">${cat.is_visible ? '공개' : '비공개'}</span></div>
                <button class="editor-btn" onclick="toggleCategoryVisibility('${cat.id}', ${cat.is_visible})">
                    ${cat.is_visible ? '비공개로 전환' : '공개로 전환'}
                </button>
            </div>
        `).join('');
    }
}

// 5. 이미지 업로드 로직
async function uploadImage(file) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `images/${fileName}`;
    
    const { data, error } = await supabase.storage.from('archive-images').upload(filePath, file);
    if (error) throw error;
    
    const { data: urlData } = supabase.storage.from('archive-images').getPublicUrl(filePath);
    return urlData.publicUrl;
}

// 6. 실시간 미리보기 기능
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
}

// 7. 메인 초기화 및 이벤트 등록
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    
    supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    isConfigReady = true;

    await checkAuth();

    // [이벤트] 로그인 버튼
    const loginBtn = document.getElementById('loginBtn');
    loginBtn?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();

        if (email !== window.ADMIN_EMAIL) {
            showError(`관리자 권한이 없습니다. (허용: ${window.ADMIN_EMAIL})`);
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = '인증 중...';

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            showError('로그인 실패: ' + error.message);
            loginBtn.disabled = false;
            loginBtn.textContent = '로그인';
        } else {
            showAdminPanel();
            await loadAllAdminData();
        }
    });

    // [이벤트] 미리보기 및 자동저장
    const editor = document.getElementById('contentEditor');
    editor?.addEventListener('input', updatePreview);

    // [이벤트] 게시물 저장
    document.getElementById('savePostBtn')?.addEventListener('click', async () => {
        const title = document.getElementById('postTitle').value.trim();
        const content = editor.value.trim();
        const category_id = document.getElementById('postCategory').value;

        if (!title || !content || !category_id) return alert('모든 항목을 입력하세요.');

        const { error } = await supabase.from('archive_posts').insert([{
            title, content, category_id,
            is_private: document.getElementById('isPrivate').checked,
            origin_free: document.getElementById('originFree').checked
        }]);

        if (error) alert('저장 실패: ' + error.message);
        else {
            alert('게시물이 저장되었습니다!');
            localStorage.removeItem('draft_content');
            location.reload();
        }
    });

    // [이벤트] 이미지 업로드 버튼 생성 및 추가
    const toolbar = document.querySelector('.editor-toolbar');
    if (toolbar) {
        const imageBtn = document.createElement('button');
        imageBtn.className = 'editor-btn';
        imageBtn.textContent = '🖼️ 이미지';
        imageBtn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                try {
                    imageBtn.textContent = '업로드 중...';
                    const url = await uploadImage(file);
                    editor.value += `\n![이미지](${url})\n`;
                    updatePreview();
                } catch (err) { alert('업로드 실패: ' + err.message); }
                finally { imageBtn.textContent = '🖼️ 이미지'; }
            };
            input.click();
        };
        toolbar.appendChild(imageBtn);
    }

    // [이벤트] 로그아웃
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (confirm('로그아웃하시겠습니까?')) {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        }
    });
});

// 전역 함수 (HTML onclick용)
window.toggleCategoryVisibility = async (id, current) => {
    const { error } = await supabase.from('categories').update({ is_visible: !current }).eq('id', id);
    if (!error) loadCategoryManagement();
};
