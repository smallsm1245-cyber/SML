// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD (Complete & Editor Fixed)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Wiki Dashboard loading...');

let supabaseClient = null;
let hasUnsavedChanges = false;

// ═══════════════════════════════════════════════════
// WAIT FOR CONFIG & INIT
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
// EDITOR FUNCTIONS (에러 해결 핵심)
// ═══════════════════════════════════════════════════
window.showNewPostEditor = function() {
    console.log("📝 새 게시글 작성 페이지로 이동");
    // 새 글 작성을 위한 admin.html (혹은 post-editor.html) 경로로 이동
    window.location.href = 'admin.html?action=new'; 
};

// 만약 현재 페이지가 글쓰기 모드라면 초기화 로직 수행
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'new' || action === 'edit') {
        console.log("🛠 에디터 모드 활성화");
        // 여기에 에디터 초기화 로직 추가 가능
    }
}

// ═══════════════════════════════════════════════════
// POSTS MANAGEMENT (0개 문제 해결을 위한 로깅 강화)
// ═══════════════════════════════════════════════════
async function loadPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    try {
        console.log('📡 게시글 데이터 요청 중...');
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;

        console.log(`✅ 수신 결과: ${posts ? posts.length : 0}개의 게시글`);

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <p>표시할 게시글이 없습니다.</p>
                    <small style="display: block; margin-top: 1rem; opacity: 0.6;">
                        (DB에 데이터가 있는데도 안 나온다면 Supabase RLS 설정을 확인하세요)
                    </small>
                </div>`;
            return;
        }
        
        // 데이터가 있을 경우 렌더링 로직 (기존과 동일)
        renderPostsList(posts);
        
    } catch (error) {
        console.error('❌ 게시글 로딩 에러:', error.message);
        container.innerHTML = `<p style="color: red;">데이터 로딩 실패: ${error.message}</p>`;
    }
}

function renderPostsList(posts) {
    const container = document.getElementById('postsList');
    container.innerHTML = posts.map(post => `
        <div class="post-item" style="border-bottom: 1px solid var(--glass-border); padding: 1rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${post.title}</strong>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${new Date(post.updated_at).toLocaleDateString()}</div>
                </div>
                <div class="post-actions">
                    <button class="action-btn" onclick="editPost('${post.id}')">✏️</button>
                    <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title}')">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ... (기존 loadStatistics, loadCategories 등 나머지 함수 유지) ...

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    
    // URL 파라미터 체크 (에디터 모드인지 확인)
    checkURLParams();

    // 로그인 체크 후 대시보드 표시
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user && user.email === window.ADMIN_EMAIL) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        
        loadPosts();
        // 나머지 데이터 로딩 함수들 호출...
    }
});
