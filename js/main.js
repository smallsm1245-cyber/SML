// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════
// 1. SUPABASE INITIALIZATION (Vercel 환경 변수 대응)
// ═══════════════════════════════════════════════════

// 환경 변수 혹은 로컬 설정을 가져오는 함수
const getSupabaseConfig = () => {
    // Vercel 배포 환경일 경우 (process.env 사용)
    const envUrl = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_URL : null;
    const envKey = typeof process !== 'undefined' && process.env ? process.env.SUPABASE_ANON_KEY : null;
    const envEmail = typeof process !== 'undefined' && process.env ? process.env.ADMIN_EMAIL : null;

    return {
        url: envUrl || (window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG.url : ''),
        anonKey: envKey || (window.SUPABASE_CONFIG ? window.SUPABASE_CONFIG.anonKey : ''),
        adminEmail: envEmail || (window.ADMIN_EMAIL ? window.ADMIN_EMAIL : 'smallsm@naver.com')
    };
};

const config = getSupabaseConfig();
const ADMIN_EMAIL = config.adminEmail;

// Supabase 클라이언트 초기화
const supabase = window.supabase.createClient(config.url, config.anonKey);

// ═══════════════════════════════════════════════════
// 2. AGE VERIFICATION SYSTEM
// ═══════════════════════════════════════════════════
const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);
    
    if (verified) {
        const timestamp = parseInt(verified);
        const now = Date.now();
        
        if (now - timestamp < VERIFICATION_DURATION) {
            hideDisclaimer();
            return;
        }
    }
    showDisclaimer();
}

function showDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    if (overlay) overlay.style.display = 'flex';
    if (container) container.classList.add('content-blur');
    
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
}

function hideDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    if (overlay) overlay.style.display = 'none';
    if (container) container.classList.remove('content-blur');
}

// Button Handlers
document.getElementById('btnYes')?.addEventListener('click', () => {
    localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
    hideDisclaimer();
});

document.getElementById('btnNo')?.addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});

// ═══════════════════════════════════════════════════
// 3. CATEGORY LOADING
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
        nav.innerHTML = '';
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'category-item';
            
            const link = document.createElement('a');
            link.href = `#category-${category.id}`;
            link.className = 'category-link';
            link.textContent = category.name;
            link.dataset.categoryId = category.id;
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                loadPostsByCategory(category.id);
                document.querySelectorAll('.category-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
            
            li.appendChild(link);
            nav.appendChild(li);
        });
        
    } catch (error) {
        console.error('카테고리 로딩 실패:', error);
    }
}

// ═══════════════════════════════════════════════════
// 4. POST LOADING BY CATEGORY
// ═══════════════════════════════════════════════════
async function loadPostsByCategory(categoryId) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        const isAdmin = user && user.email === ADMIN_EMAIL;
        
        let query = supabase
            .from('archive_posts')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });
        
        if (!isAdmin) {
            query = query.eq('is_private', false);
        }
        
        const { data: posts, error } = await query;
        if (error) throw error;
        
        const content = document.getElementById('mainContent');
        const title = document.getElementById('welcomeTitle');
        
        if (posts.length === 0) {
            if (title) title.textContent = '게시물 없음';
            if (content) content.innerHTML = '<p>이 카테고리에는 아직 게시물이 없습니다.</p>';
            return;
        }
        
        const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', categoryId)
            .single();
        
        if (title) title.textContent = category.name;
        
        if (content) {
            content.innerHTML = posts.map(post => `
                <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
                    <h3>
                        <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
                            ${post.title}
                            ${post.is_private ? '<span style="font-size: 0.8em; color: var(--accent-amber);"> 🔒</span>' : ''}
                        </a>
                    </h3>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                        ${new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </p>
                </div>
            `).join('');
        }
        
    } catch (error) {
        console.error('게시물 로딩 실패:', error);
    }
}

// ═══════════════════════════════════════════════════
// 5. SEARCH FUNCTIONALITY
// ═══════════════════════════════════════════════════
let searchTimeout;
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
            const query = e.target.value.trim();
            if (query.length < 2) return;
            
            try {
                const { data: { user } } = await supabase.auth.getUser();
                const isAdmin = user && user.email === ADMIN_EMAIL;
                
                let searchQuery = supabase
                    .from('archive_posts')
                    .select('id, title, created_at, category_id')
                    .ilike('title', `%${query}%`)
                    .order('created_at', { ascending: false })
                    .limit(10);
                
                if (!isAdmin) searchQuery = searchQuery.eq('is_private', false);
                
                const { data: results, error } = await searchQuery;
                if (error) throw error;
                displaySearchResults(results);
            } catch (error) {
                console.error('검색 실패:', error);
            }
        }, 300);
    });
}

function displaySearchResults(results) {
    const content = document.getElementById('mainContent');
    const title = document.getElementById('welcomeTitle');
    
    if (title) title.textContent = '검색 결과';
    if (!content) return;

    if (results.length === 0) {
        content.innerHTML = '<p>검색 결과가 없습니다.</p>';
        return;
    }
    
    content.innerHTML = results.map(post => `
        <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
            <h3>
                <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
                    ${post.title}
                </a>
            </h3>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                ${new Date(post.created_at).toLocaleDateString('ko-KR')}
            </p>
        </div>
    `).join('');
}

// ═══════════════════════════════════════════════════
// 6. NIGHT MODE TOGGLE
// ═══════════════════════════════════════════════════
const modeToggle = document.getElementById('modeToggle');
const NIGHT_MODE_KEY = 'night_mode';

function loadNightMode() {
    const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';
    if (isNightMode) {
        document.body.classList.add('night-mode');
        if (modeToggle) modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
    }
}

modeToggle?.addEventListener('click', () => {
    const isNightMode = document.body.classList.toggle('night-mode');
    localStorage.setItem(NIGHT_MODE_KEY, isNightMode);
    
    if (modeToggle) {
        modeToggle.innerHTML = isNightMode 
            ? '<span>☀️</span><span>Day Mode</span>' 
            : '<span>🌙</span><span>Night Library</span>';
    }
});

// ═══════════════════════════════════════════════════
// 7. COPY PROTECTION SYSTEM
// ═══════════════════════════════════════════════════
document.addEventListener('copy', async (e) => {
    const selection = window.getSelection().toString();
    if (!selection) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        try {
            const { data: post } = await supabase
                .from('archive_posts')
                .select('origin_free')
                .eq('id', postId)
                .single();
            if (post && post.origin_free) return;
        } catch (error) {
            console.error('복사 보호 확인 실패:', error);
        }
    }
    
    const attribution = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n본 기록은 SMALLSM Archive의 자산입니다.\n출처: ${window.location.origin}\n⚠️ 무단 수정 및 상업적 이용을 금합니다.\n━━━━━━━━━━━━━━━━━━━━━━━━`;
    e.clipboardData.setData('text/plain', selection + attribution);
    e.preventDefault();
});

// ═══════════════════════════════════════════════════
// 8. INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    checkAgeVerification();
    loadCategories();
    loadNightMode();
});
