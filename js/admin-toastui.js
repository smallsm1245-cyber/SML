// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - ADMIN SYSTEM (FINAL FIX)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let supabaseClient = null;
let editor = null;
let currentPostId = null;

// ═══════════════════════════════════════════════════
// 1. 초기화 (설정 대기 및 이벤트 연결)
// ═══════════════════════════════════════════════════
async function initAdmin() {
    console.log('🚀 Admin system initializing...');

    // Supabase 설정 로드 대기 (config.js가 로드될 때까지 대기)
    let attempts = 0;
    while (!window.SUPABASE_CONFIG?.url && attempts < 50) {
        await new Promise(r => setTimeout(r, 100));
        attempts++;
    }

    if (!window.SUPABASE_CONFIG?.url) {
        console.error('❌ Supabase 설정을 찾을 수 없습니다.');
        return;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );

    // 이벤트 리스너 연결
    bindAdminEvents();

    // 기존 로그인 세션 확인
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
        // 관리자 이메일 일치 확인 (필요 시 수정)
        if (user.email === (window.ADMIN_EMAIL || 'sml-brown@naver.com')) {
            await showDashboard();
        }
    }
}

function bindAdminEvents() {
    // 새 글 작성 버튼
    const newPostBtn = document.getElementById('newPostBtn');
    if (newPostBtn) {
        newPostBtn.onclick = () => showNewPostEditor();
    }

    // 로그인 버튼
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = handleLogin;
    }

    // 로그아웃 버튼
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        await supabaseClient.auth.signOut();
        window.location.reload();
    });

    // 리스트로 돌아가기 버튼
    document.getElementById('backToListBtn')?.addEventListener('click', backToList);
    
    // 게시하기 버튼
    document.getElementById('publishPostBtn')?.addEventListener('click', publishPost);
}

// ═══════════════════════════════════════════════════
// 2. 에디터 제어 (initializeEditor 함수 정의 포함)
// ═══════════════════════════════════════════════════

// 에러의 원인이었던 함수를 명확히 정의합니다.
function initializeEditor() {
    const editorElement = document.getElementById('editor');
    if (!editorElement) {
        console.warn('⚠️ Editor element (#editor) not found in current view.');
        return;
    }

    // 이미 에디터 인스턴스가 있다면 새로 만들지 않음
    if (editor) return;

    try {
        editor = new toastui.Editor({
            el: editorElement,
            height: '600px',
            initialEditType: 'markdown',
            previewStyle: 'vertical',
            placeholder: '기록을 남겨주세요...',
            theme: 'dark' // CSS에서 정의한 다크 테마와 연동
        });
        console.log('✅ Toast UI Editor initialized successfully.');
    } catch (e) {
        console.error('❌ Editor initialization failed:', e);
    }
}

function showNewPostEditor() {
    currentPostId = null;
    
    // UI 섹션 전환
    const listSection = document.getElementById('postsListSection');
    const editorSection = document.getElementById('editorSection');
    
    if (listSection) listSection.style.display = 'none';
    if (editorSection) {
        editorSection.style.display = 'block';
        editorSection.classList.add('active'); // CSS 애니메이션용
    }
    
    // 제목 및 카테고리 초기화
    if (document.getElementById('postTitle')) document.getElementById('postTitle').value = '';
    
    // 에디터 생성 및 초기화
    setTimeout(() => {
        initializeEditor(); // 여기서 함수 호출
        if (editor) editor.setMarkdown('');
    }, 50);
}

// ═══════════════════════════════════════════════════
// 3. 대시보드 및 게시글 로직
// ═══════════════════════════════════════════════════

async function showDashboard() {
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('adminDashboard');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (dashboard) {
        dashboard.style.display = 'flex';
        dashboard.classList.add('active');
    }
    
    // 대시보드 진입 시 에디터를 미리 초기화할 필요가 있다면 호출
    // (보통은 '새 글 작성' 클릭 시 호출하는 것이 성능상 좋습니다.)
    loadPosts();
}

function backToList() {
    document.getElementById('editorSection').style.display = 'none';
    document.getElementById('postsListSection').style.display = 'block';
    loadPosts();
}

async function handleLogin() {
    const email = document.getElementById('loginEmail')?.value.trim();
    const password = document.getElementById('loginPassword')?.value.trim();

    if (!email || !password) {
        alert('이메일과 비밀번호를 입력하세요.');
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await showDashboard();
    } catch (error) {
        alert('로그인 실패: ' + error.message);
    }
}

// 나머지 loadPosts, publishPost 함수는 이전 로직과 동일하게 유지...
async function loadPosts() {
    console.log('📦 Loading posts...');
    // (생략된 기존 Supabase 데이터 로드 로직)
}

async function publishPost() {
    console.log('🚀 Publishing post...');
    // (생략된 기존 Supabase 데이터 저장 로직)
}

// 페이지 로드 시 시작
document.addEventListener('DOMContentLoaded', initAdmin);
