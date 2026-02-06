// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (FIXED)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 1. SUPABASE INITIALIZATION
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24시간

// ═══════════════════════════════════════════════════
// UI CONTROL FUNCTIONS
// ═══════════════════════════════════════════════════

function showDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    if (overlay) overlay.style.display = 'flex';
    if (container) container.classList.add('content-blur');
}

function hideDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    if (overlay) overlay.style.display = 'none';
    if (container) container.classList.remove('content-blur');
}

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);
    if (verified) {
        const timestamp = parseInt(verified);
        if (Date.now() - timestamp < VERIFICATION_DURATION) {
            hideDisclaimer();
            return;
        }
    }
    showDisclaimer();
}

// ═══════════════════════════════════════════════════
// CORE LOGIC FUNCTIONS
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

        // 카테고리 클릭 이벤트 연결
        nav.querySelectorAll('.category-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadPostsByCategory(link.dataset.id);
                nav.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });
    } catch (e) { console.error('카테고리 로딩 실패:', e); }
}

// ... (loadPostsByCategory, search 로직은 기존과 동일하게 유지)

// ═══════════════════════════════════════════════════
// 8. INITIALIZATION (모든 수리의 핵심은 여기입니다)
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // A. 인증 버튼 핸들러 (반드시 DOMContentLoaded 안에 있어야 함)
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');

    if (btnYes) {
        btnYes.addEventListener('click', () => {
            localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
            hideDisclaimer();
        });
    }

    if (btnNo) {
        btnNo.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    }

    // B. 다크 모드 핸들러
    const modeToggle = document.getElementById('modeToggle');
    if (modeToggle) {
        modeToggle.addEventListener('click', () => {
            const isNight = document.body.classList.toggle('night-mode');
            localStorage.setItem('night_mode', isNight);
            modeToggle.innerHTML = isNight ? '<span>☀️</span><span>Day Mode</span>' : '<span>🌙</span><span>Night Library</span>';
        });
    }

    // C. 초기화 실행
    checkAgeVerification();
    loadCategories();
    
    // 다크모드 초기 세팅
    if (localStorage.getItem('night_mode') === 'true') {
        document.body.classList.add('night-mode');
        if (modeToggle) modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
    }
});
