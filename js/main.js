// 1. 초기 설정 (Vercel 환경변수 대응)
const getSupabaseConfig = () => {
    const isVercel = typeof process !== 'undefined' && process.env;
    return {
        url: isVercel ? process.env.SUPABASE_URL : (window.SUPABASE_CONFIG?.url || ''),
        anonKey: isVercel ? process.env.SUPABASE_ANON_KEY : (window.SUPABASE_CONFIG?.anonKey || '')
    };
};

const config = getSupabaseConfig();

// 2. [중요] 중복 선언 에러 방지 로직
// const 대신 window 객체를 사용하여 중복 선언 에러를 원천 차단합니다.
if (!window.mySupabase) {
    window.mySupabase = window.supabase.createClient(config.url, config.anonKey);
}
const sb = window.mySupabase; 

// 3. 성인 인증 시스템
const VERIFICATION_KEY = 'age_verified';

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');

    const hideOverlay = () => {
        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('content-blur');
    };

    // 이미 인증된 경우
    if (localStorage.getItem(VERIFICATION_KEY)) {
        hideOverlay();
        loadCategories();
    }

    // "예" 버튼 클릭 시
    document.getElementById('btnYes')?.addEventListener('click', () => {
        localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
        hideOverlay();
        loadCategories(); // 버튼 누르면 카테고리 로드 시작
    });

    // "아니요" 버튼 클릭 시
    document.getElementById('btnNo')?.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
});

// 4. 카테고리 불러오기 함수
async function loadCategories() {
    try {
        const { data, error } = await sb.from('categories').select('*').eq('is_visible', true);
        if (error) throw error;
        
        const nav = document.getElementById('categoryNav');
        if (nav) {
            nav.innerHTML = data.map(cat => `<li><a href="#">${cat.name}</a></li>`).join('');
        }
    } catch (e) {
        console.error("데이터 로딩 실패:", e);
    }
}
