// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - TOAST UI EDITOR INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Toast UI Admin loading...');

let supabaseClient = null;
let editor = null;
let currentPostId = null;

// ═══════════════════════════════════════════════════
// WAIT FOR CONFIG & INITIALIZATION
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
// AUTHENTICATION
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
        
        // 관리자 이메일 검증 (기본값 설정)
        const adminEmail = window.ADMIN_EMAIL || 'sml-brown@naver.com';
        if (user.email !== adminEmail) {
            console.warn('관리자 권한이 없는 계정입니다.');
            await supabaseClient.auth.signOut();
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function showDashboard() {
    console.log('📊 Showing Dashboard...');
    const loginScreen = document.getElementById('loginScreen');
    const adminDashboard = document.getElementById('adminDashboard');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminDashboard) adminDashboard.style.display = 'block';
    
    // 에디터 및 데이터 초기화
    initializeEditor();
    
    // 데이터 로딩 (에러 핸들링 추가)
    try {
        await Promise.all([
            loadPosts(),
            loadCategories(),
            loadHomeSettings()
        ]);
        
        // URL 액션 처리 (action=new 등)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('action') === 'new') showNewPostEditor();
        if (urlParams.get('action') === 'edit' && urlParams.get('id')) window.editPost(urlParams.get('id'));
        
    } catch (err) {
        console.error('데이터 로드 중 오류 발생:', err);
    }
}

// ═══════════════════════════════════════════════════
// POSTS MANAGEMENT
// ═══════════════════════════════════════════════════
async function loadPosts() {
    try {
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('id, title, is_private, updated_at, categories(name)')
            .order('updated_at', { ascending: false });
        
        if (error) throw error;

        const container = document.getElementById('postsList');
        const countBadge = document.getElementById('postCount');
        
        if (countBadge) countBadge.textContent = posts ? posts.length : 0;
        if (!container) return;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">게시물이 없습니다.</div>';
            return;
        }

        container.innerHTML = posts.map(post => `
            <div class="post-item">
                <div class="post-header">
                    <span class="post-title-link" onclick="editPost('${post.id}')">${post.title}</span>
                    <div class="post-badges">${post.is_private ? '🔴 비공개' : '🟢 공개'}</div>
                </div>
                <div class="post-meta">${post.categories?.name || '미분류'} • ${getTimeAgo(post.updated_at)}</div>
                <div class="post-actions">
                    <button class="action-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                    <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">🗑️ 삭제</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('게시글 로드 실패:', error);
        document.getElementById('postsList').innerHTML = '<div class="loading">데이터 권한 오류가 발생했습니다. (RLS 확인 필요)</div>';
    }
}

// ═══════════════════════════════════════════════════
// INITIALIZATION (이 부분이 로그인 즉시 전환을 결정합니다)
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    await waitForConfig();
    
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );

    // 1. 이미 로그인된 상태인지 확인
    if (await checkAuth()) {
        await showDashboard();
    }

    // 2. 로그인 버튼 이벤트
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!email || !password) {
                showError('정보를 입력해주세요.');
                return;
            }

            try {
                // 로그인 시도
                const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
                
                if (error) throw error;

                // 로그인 성공 시 관리자 이메일 다시 확인
                if (data.user.email !== (window.ADMIN_EMAIL || 'sml-brown@naver.com')) {
                    await supabaseClient.auth.signOut();
                    showError('관리자 권한이 없습니다.');
                    return;
                }

                // 즉시 대시보드로 전환
                await showDashboard();
                
            } catch (error) {
                showError(error.message === 'Invalid login credentials' ? '비밀번호가 틀렸습니다.' : error.message);
            }
        });
    }

    // 로그아웃 버튼
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // 섹션 전환 버튼들
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
            document.getElementById(`section-${section}`).classList.add('active');
            btn.classList.add('active');
        });
    });
});

// ... (기타 함수: initializeEditor, getTimeAgo, loadCategories 등은 기존 유지)
