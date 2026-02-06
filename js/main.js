// ═══════════════════════════════════════════════════
// 1. SUPABASE INITIALIZATION
// ═══════════════════════════════════════════════════

const getSupabaseConfig = () => {
    // Vercel 환경 변수 우선, 없으면 window 설정 참조
    const isVercel = typeof process !== 'undefined' && process.env;
    return {
        url: isVercel ? process.env.SUPABASE_URL : (window.SUPABASE_CONFIG?.url || ''),
        anonKey: isVercel ? process.env.SUPABASE_ANON_KEY : (window.SUPABASE_CONFIG?.anonKey || ''),
        adminEmail: isVercel ? process.env.ADMIN_EMAIL : 'smallsm@naver.com'
    };
};

const config = getSupabaseConfig();

// 'Identifier already declared' 에러를 피하기 위해 window 객체에 안전하게 할당
if (!window.supabaseClient) {
    window.supabaseClient = window.supabase.createClient(config.url, config.anonKey);
}
const supabase = window.supabaseClient;

// ═══════════════════════════════════════════════════
// 2. AGE VERIFICATION SYSTEM
// ═══════════════════════════════════════════════════

const VERIFICATION_KEY = 'age_verified';

function hideDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    if (overlay) overlay.style.display = 'none';
    if (container) container.classList.remove('content-blur');
}

// DOM이 로드된 후 이벤트 리스너 연결
document.addEventListener('DOMContentLoaded', () => {
    // 기존 인증 여부 확인
    if (localStorage.getItem(VERIFICATION_KEY)) {
        hideDisclaimer();
    }

    // "예" 버튼 클릭
    document.getElementById('btnYes')?.addEventListener('click', () => {
        localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
        hideDisclaimer();
        console.log("인증 완료: 메인 콘텐츠를 불러옵니다.");
        loadCategories(); // 인증 후 카테고리 로드
    });

    // "아니오" 버튼 클릭
    document.getElementById('btnNo')?.addEventListener('click', () => {
        window.location.href = 'https://www.google.com';
    });

    // 초기 카테고리 로드 실행 (인증된 경우만)
    if (localStorage.getItem(VERIFICATION_KEY)) {
        loadCategories();
    }
});

// ═══════════════════════════════════════════════════
// 3. CATEGORY LOADING (함수 정의)
// ═══════════════════════════════════════════════════
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const nav = document.getElementById('categoryNav');
        if (!nav) return;
        nav.innerHTML = categories.map(category => `
            <li class="category-item">
                <a href="#" class="category-link" data-id="${category.id}">${category.name}</a>
            </li>
        `).join('');
    } catch (error) {
        console.error('카테고리 로딩 실패:', error);
    }
}
