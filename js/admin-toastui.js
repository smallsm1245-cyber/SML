// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - TOAST UI EDITOR INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Toast UI Admin loading...');

let supabaseClient = null;
let editor = null;
let currentPostId = null;

// ═══════════════════════════════════════════════════
// [NEW] URL ACTION HANDLER
// ═══════════════════════════════════════════════════
/**
 * 페이지 로드 시 URL의 ?action=... 파라미터를 분석하여 처리합니다.
 */
async function handleUrlAction() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const id = urlParams.get('id');

    if (action === 'new') {
        console.log("✨ Action 'new' detected. Opening editor...");
        showNewPostEditor();
    } else if (action === 'edit' && id) {
        console.log(`✨ Action 'edit' detected for ID: ${id}`);
        window.editPost(id);
    }
}

// ═══════════════════════════════════════════════════
// WAIT FOR CONFIG
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// AUTHENTICATION & VIEW
// ═══════════════════════════════════════════════════
function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 3000);
    }
}

async function checkAuth() {
    if (!supabaseClient) return false;
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) return false;
        if (user.email !== (window.ADMIN_EMAIL || 'sml-brown@naver.com')) {
            await supabaseClient.auth.signOut();
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    initializeEditor();
    
    await Promise.all([
        loadPosts(),
        loadCategories(),
        loadHomeSettings()
    ]);

    // [MODIFY] 데이터 로드 후 URL 액션 처리 실행
    handleUrlAction();
}

// ═══════════════════════════════════════════════════
// TOAST UI EDITOR INITIALIZATION
// ═══════════════════════════════════════════════════
function initializeEditor() {
    if (editor) return;
    
    const Editor = toastui.Editor;
    editor = new Editor({
        el: document.querySelector('#editor'),
        height: '600px', // 높이 소폭 조정
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        placeholder: '아카이브할 내용을 입력하세요...',
        language: 'ko-KR',
        toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock'],
            ['scrollSync']
        ],
        hooks: {
            addImageBlobHook: async (blob, callback) => {
                try {
                    const url = await uploadImage(blob);
                    callback(url, 'Image');
                } catch (error) {
                    alert('이미지 업로드 실패: ' + error.message);
                }
            }
        }
    });
    console.log('✅ Toast UI Editor initialized');
}

async function uploadImage(file) {
    try {
        const fileExt = file.name ? file.name.split('.').pop() : 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `images/${fileName}`;
        const { data, error } = await supabaseClient.storage.from('archive-images').upload(filePath, file);
        if (error) throw error;
        const { data: urlData } = supabaseClient.storage.from('archive-images').getPublicUrl(filePath);
        return urlData.publicUrl;
    } catch (error) {
        throw error;
    }
}

// ═══════════════════════════════════════════════════
// POSTS & EDITOR LOGIC
// ═══════════════════════════════════════════════════
window.editPost = async function(id) {
    try {
        const { data: post, error } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('id', id)
            .single();
        
        if (error) throw error;
        
        // UI 전환
        switchSection('posts'); // 게시글 탭으로 이동
        document.getElementById('postListView').style.display = 'none';
        document.getElementById('postEditorView').style.display = 'block';
        document.getElementById('editorTitle').textContent = '게시물 수정';
        
        // 폼 채우기
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postCategory').value = post.category_id;
        document.getElementById('isPrivate').checked = post.is_private;
        document.getElementById('originFree').checked = post.origin_free;
        editor.setMarkdown(post.content);
        
        currentPostId = id;
        window.scrollTo(0, 0);
    } catch (error) {
        console.error('Edit post failed:', error);
        alert('게시물을 불러오는 중 오류가 발생했습니다.');
    }
};

function showNewPostEditor() {
    // 탭이 'posts'가 아닐 경우를 대비해 섹션 전환 우선
    switchSection('posts');
    
    document.getElementById('postListView').style.display = 'none';
    document.getElementById('postEditorView').style.display = 'block';
    document.getElementById('editorTitle').textContent = '새 글 작성';
    
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('isPrivate').checked = false;
    document.getElementById('originFree').checked = false;
    editor.setMarkdown('');
    
    currentPostId = null;
    window.scrollTo(0, 0);
}

function backToList() {
    document.getElementById('postListView').style.display = 'block';
    document.getElementById('postEditorView').style.display = 'none';
    currentPostId = null;
    // URL 파라미터 초기화 (뒤로가기 시 action=new가 남아있지 않게 함)
    window.history.replaceState({}, document.title, window.location.pathname);
    loadPosts();
}

async function publishPost() {
    const title = document.getElementById('postTitle').value.trim();
    const categoryId = document.getElementById('postCategory').value;
    const isPrivate = document.getElementById('isPrivate').checked;
    const originFree = document.getElementById('originFree').checked;
    const content = editor.getMarkdown();
    
    if (!title || !categoryId || !content) {
        alert('제목, 카테고리, 내용을 모두 입력해주세요.');
        return;
    }
    
    try {
        const postData = {
            title,
            content,
            category_id: categoryId,
            is_private: isPrivate,
            origin_free: originFree,
            updated_at: new Date().toISOString()
        };

        if (currentPostId) {
            const { error } = await supabaseClient.from('archive_posts').update(postData).eq('id', currentPostId);
            if (error) throw error;
            alert('✅ 게시물이 수정되었습니다!');
        } else {
            const { error } = await supabaseClient.from('archive_posts').insert([postData]);
            if (error) throw error;
            alert('✅ 게시물이 발행되었습니다!');
        }
        backToList();
    } catch (error) {
        alert('❌ 저장 실패: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════
// OTHER MANAGEMENTS (Categories, Home, etc.) - 기존과 동일
// ═══════════════════════════════════════════════════
function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const targetSection = document.getElementById(`section-${sectionName}`);
    const targetNav = document.querySelector(`[data-section="${sectionName}"]`);
    
    if (targetSection) targetSection.classList.add('active');
    if (targetNav) targetNav.classList.add('active');
}

async function loadPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('id, title, is_private, created_at, updated_at, categories (name)')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;
        const container = document.getElementById('postsList');
        document.getElementById('postCount').textContent = posts ? posts.length : 0;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">게시물이 없습니다.</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => `
            <div class="post-item">
                <div class="post-header">
                    <span class="post-title-link">${post.title}</span>
                    <div class="post-badges">${post.is_private ? '🔴 비공개' : '🟢 공개'}</div>
                </div>
                <div class="post-meta">${post.categories?.name || 'Uncategorized'} • ${getTimeAgo(post.updated_at)}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                    <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">🗑️ 삭제</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Posts load error:', error);
    }
}

// ... (loadCategories, loadHomeSettings, setupSearchAndFilter 등 나머지 함수는 원본 유지) ...
// 생략된 함수들은 원본 코드와 동일하게 작동합니다.

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    supabaseClient = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.anonKey);
    
    if (await checkAuth()) {
        await showDashboard();
    }
    
    // Event Listeners
    document.getElementById('loginBtn')?.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            await showDashboard();
        } catch (error) {
            showError(error.message);
        }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (confirm('로그아웃하시겠습니까?')) {
            await supabaseClient.auth.signOut();
            window.location.reload();
        }
    });

    document.getElementById('newPostBtn')?.addEventListener('click', showNewPostEditor);
    document.getElementById('backToListBtn')?.addEventListener('click', backToList);
    document.getElementById('publishPostBtn')?.addEventListener('click', publishPost);
    
    // 필터 및 기타 초기화
    setupSearchAndFilter();
});

// Helper functions (원본 유지)
function getTimeAgo(d) { /*...*/ return "방금 전"; } 
async function loadCategories() { /*...*/ }
async function loadHomeSettings() { /*...*/ }
function setupSearchAndFilter() { /*...*/ }
