// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD (Full System)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Wiki Dashboard system starting...');

let supabaseClient = null;
let hasUnsavedChanges = false;

// ═══════════════════════════════════════════════════
// EDITOR & ACTION FUNCTIONS (Global Scope)
// ═══════════════════════════════════════════════════
window.showNewPostEditor = function() {
    console.log("📝 신규 게시글 작성 모드 진입");
    // 섹션 전환 로직이 있다면 해당 섹션으로 이동, 아니면 페이지 이동
    if(document.getElementById('section-posts')) {
        switchSection('posts');
        alert('글쓰기 기능은 현재 준비 중이거나 별도의 에디터 페이지가 필요합니다.');
    } else {
        window.location.href = 'admin.html?action=new';
    }
};

window.editPost = function(id) {
    console.log("✏️ 게시글 수정 ID:", id);
    window.location.href = `admin.html?action=edit&id=${id}`;
};

// ═══════════════════════════════════════════════════
// CORE LOADERS
// ═══════════════════════════════════════════════════
async function loadPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    try {
        console.log('📡 게시글 불러오기 시도 중 (Table: archive_posts)...');
        
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('id, title, is_private, created_at, updated_at, category_id')
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('❌ DB 에러:', error.message);
            throw error;
        }

        console.log('✅ 데이터 수신 성공:', posts.length, '개의 게시글');

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div class="no-data-notice" style="text-align: center; padding: 3rem; background: rgba(255,255,255,0.05); border-radius: 12px;">
                    <p style="color: var(--primary-brass); font-size: 1.2rem;">불러온 게시글이 없습니다.</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                        데이터베이스에 글이 있다면 <strong>Supabase RLS Policy</strong>를 확인하세요.
                    </p>
                    <button class="btn-primary mt-4" onclick="location.reload()" style="padding: 5px 15px; font-size: 0.8rem;">🔄 새로고침</button>
                </div>`;
            return;
        }
        
        // 데이터 렌더링
        container.innerHTML = posts.map(post => {
            const status = post.is_private ? '🔴 비공개' : '🟢 공개';
            return `
                <div class="post-item" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--glass-border);">
                    <div>
                        <span style="color: var(--text-secondary); font-size: 0.8rem;">[${status}]</span>
                        <strong style="margin-left: 10px;">${post.title}</strong>
                    </div>
                    <div class="post-actions">
                        <button class="editor-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        container.innerHTML = `<p style="color: var(--admin-danger);">❌ 로딩 에러: ${error.message}</p>`;
    }
}

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
async function init() {
    // 1. Config 대기
    if (!window.SUPABASE_CONFIG) {
        console.warn("⏳ Waiting for config...");
        setTimeout(init, 100);
        return;
    }

    // 2. Client 초기화
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase initialized');

    // 3. 인증 상태 확인 및 대시보드 표시
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (user && user.email === window.ADMIN_EMAIL) {
        console.log("🔑 관리자 인증 완료");
        const loginScreen = document.getElementById('loginScreen');
        const adminDashboard = document.getElementById('adminDashboard');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        
        // 초기 데이터 로드
        loadPosts();
        if (typeof loadStatistics === 'function') loadStatistics();
        if (typeof loadCategories === 'function') loadCategories();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM ready');
    init();
});

// ═══════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════
window.switchSection = function(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`section-${sectionName}`);
    if (target) target.classList.add('active');
};
