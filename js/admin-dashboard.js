/**
 * 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD SYSTEM
 * 기능: 인증 체크, 섹션 전환, 게시글/카테고리 관리, 에디터 리다이렉트
 */

console.log('🚀 Wiki Dashboard loading...');

let supabaseClient = null;
const ADMIN_EMAIL = window.ADMIN_EMAIL || 'sml-brown@naver.com'; // 환경변수 없을 시 기본값

// ═══════════════════════════════════════════════════
// 1. CORE FUNCTIONS (Global Scope)
// ═══════════════════════════════════════════════════

// [MODIFY] 새 글 작성 버튼 클릭 시 Toast UI 전용 페이지로 리다이렉트
window.showNewPostEditor = function() {
    console.log("📝 Redirecting to Toast UI Editor Page...");
    window.location.href = 'admin-toastui.html?action=new';
};

// 섹션 전환 (사이드바 메뉴 및 빠른 작업용)
window.switchSection = function(sectionName) {
    console.log(`🔄 Switching to section: ${sectionName}`);
    
    // 메뉴 아이템 활성화 상태 변경
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.toggle('active', nav.dataset.section === sectionName);
    });

    // 컨텐츠 섹션 표시/숨김
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === `section-${sectionName}`);
    });

    // 섹션별 데이터 로드
    if (sectionName === 'posts') loadPosts();
    if (sectionName === 'categories') loadCategories();
};

// ═══════════════════════════════════════════════════
// 2. DATA LOADERS (Supabase)
// ═══════════════════════════════════════════════════

// [MODIFY] 카테고리 필터(<select>) 및 목록 로드
async function loadCategories() {
    const listContainer = document.getElementById('categoriesList');
    const filterSelect = document.getElementById('postFilterCategory');
    
    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        // 1. 게시글 관리 탭의 카테고리 필터 업데이트
        if (filterSelect) {
            let options = '<option value="">모든 카테고리</option>';
            categories.forEach(cat => {
                options += `<option value="${cat.id}">${cat.name}</option>`;
            });
            filterSelect.innerHTML = options;
        }

        // 2. 카테고리 관리 탭의 리스트 업데이트
        if (listContainer) {
            listContainer.innerHTML = categories.map(cat => `
                <div class="category-item card" style="display:flex; justify-content:space-between; margin-bottom:10px; padding:15px;">
                    <span><strong>${cat.name}</strong> (Slug: ${cat.slug})</span>
                    <button class="btn-danger" onclick="deleteCategory('${cat.id}')">삭제</button>
                </div>
            `).join('');
        }

        // 통계 업데이트
        const catCountElement = document.getElementById('statCategories');
        if (catCountElement) catCountElement.innerText = categories.length;

    } catch (error) {
        console.error('❌ Category load error:', error.message);
    }
}

// 게시글 목록 로드 (RLS 대응 강화)
async function loadPosts() {
    const container = document.getElementById('postsList');
    if (!container) return;

    try {
        console.log('📡 게시글 로딩 시도...');
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('*, categories(name)')
            .order('updated_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ 데이터 수신: ${posts.length}개`);
        
        const postCountElement = document.getElementById('postCount');
        const statTotalElement = document.getElementById('statTotalPosts');
        if (postCountElement) postCountElement.innerText = posts.length;
        if (statTotalElement) statTotalElement.innerText = posts.length;

        if (!posts || posts.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:50px; opacity:0.6;">
                    <p>등록된 게시글이 없습니다.</p>
                    <small>DB에 데이터가 있다면 Supabase RLS 설정을 확인하세요.</small>
                </div>`;
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-item card" style="display:flex; justify-content:space-between; align-items:center; padding:15px; margin-bottom:10px; border-left: 4px solid ${post.is_private ? '#ff4d4d' : '#4ade80'};">
                <div>
                    <span style="font-size:0.8rem; color:var(--admin-text-dim);">[${post.categories?.name || '미분류'}]</span>
                    <div style="font-weight:600;">${post.title}</div>
                    <div style="font-size:0.75rem; opacity:0.5;">수정일: ${new Date(post.updated_at).toLocaleString()}</div>
                </div>
                <div>
                    <button class="quick-btn" onclick="location.href='admin-toastui.html?action=edit&id=${post.id}'">✏️</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = `<p style="color:red;">에러: ${error.message}</p>`;
    }
}

// ═══════════════════════════════════════════════════
// 3. INITIALIZATION
// ═══════════════════════════════════════════════════

async function initDashboard() {
    // Supabase 설정 대기
    if (!window.SUPABASE_CONFIG) {
        setTimeout(initDashboard, 100);
        return;
    }

    // 클라이언트 초기화
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase initialized');

    // 세션 확인 (이미 로그인되어 있는지)
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (user && user.email === ADMIN_EMAIL) {
        showAdminView();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
    }
}

function showAdminView() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // 초기 데이터 로드
    loadCategories(); // 카테고리 및 필터 로드
    loadPosts();      // 게시글 로드
}

// 사이드바 네비게이션 이벤트 연결
document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
        const section = button.dataset.section;
        switchSection(section);
    });
});

// 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM ready');
    initDashboard();
});
