// 1. 초기 설정 (Vercel 및 Supabase 연결)
const getSupabaseConfig = () => {
    const isVercel = typeof process !== 'undefined' && process.env;
    return {
        url: isVercel ? process.env.SUPABASE_URL : (window.SUPABASE_CONFIG?.url || ''),
        anonKey: isVercel ? process.env.SUPABASE_ANON_KEY : (window.SUPABASE_CONFIG?.anonKey || '')
    };
};

const config = getSupabaseConfig();

// 2. 중복 선언 에러 방지 (window 객체 사용)
if (!window.mySupabaseInstance) {
    window.mySupabaseInstance = window.supabase.createClient(config.url, config.anonKey);
}
const sb = window.mySupabaseInstance;

// 3. 인증 및 화면 제어
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    const VERIFICATION_KEY = 'age_verified';

    const hideOverlay = () => {
        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('content-blur');
    };

    // 기존 인증 확인
    if (localStorage.getItem(VERIFICATION_KEY)) {
        hideOverlay();
        loadCategories();
    }

    // 버튼 이벤트 연결
    document.getElementById('btnYes')?.addEventListener('click', () => {
        localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
        hideOverlay();
        loadCategories();
    });

    document.getElementById('btnNo')?.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });
});

// 4. 데이터 로드 함수
async function loadCategories() {
    try {
        const { data, error } = await sb.from('categories').select('*').eq('is_visible', true);
        if (error) throw error;
        
        const nav = document.getElementById('categoryNav');
        if (nav && data) {
            nav.innerHTML = data.map(cat => `
                <li class="category-item">
                    <a href="#" onclick="alert('${cat.name} 준비 중')">${cat.name}</a>
                </li>
            `).join('');
        }
    } catch (e) {
        console.error("데이터 로드 에러:", e.message);
    }
}
