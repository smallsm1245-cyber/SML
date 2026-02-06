// ?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺??
// ?렗 SMALLSM ARCHIVE - MAIN SCRIPT
// ?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺??

// 以묐났 濡쒕뵫 諛⑹?
if (window.SMALLSM_LOADED) {
    console.warn('?좑툘 main.js already loaded, skipping...');
} else {
    window.SMALLSM_LOADED = true;

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 1. window.supabaseClient INITIALIZATION
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
window.supabaseClient = null;

function initializewindow.supabaseClient() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('window.supabaseClient ?쇱씠釉뚮윭由ш? 濡쒕뱶?섏? ?딆븯?듬땲??');
            return false;
        }
        
        if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url || !window.SUPABASE_CONFIG.anonKey) {
            console.error('window.supabaseClient ?ㅼ젙???щ컮瑜댁? ?딆뒿?덈떎.');
            return false;
        }
        
        window.supabaseClient = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );
        
        return true;
    } catch (error) {
        console.error('window.supabaseClient 珥덇린???ㅽ뙣:', error);
        return false;
    }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 2. AGE VERIFICATION SYSTEM
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);
    
    if (verified) {
        const timestamp = parseInt(verified);
        const now = Date.now();
        
        // Check if verification is still valid
        if (now - timestamp < VERIFICATION_DURATION) {
            hideDisclaimer();
            return;
        }
    }
    
    // Show disclaimer
    showDisclaimer();
}

function showDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    overlay.style.display = 'flex';
    container.classList.add('content-blur');
    
    // Block search engines when disclaimer is active
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);
}

function hideDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    overlay.style.display = 'none';
    container.classList.remove('content-blur');
}

// Button Handlers - Will be attached in DOMContentLoaded

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 3. CATEGORY LOADING
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
async function loadCategories() {
    if (!window.supabaseClient) {
        console.warn('window.supabaseClient媛 珥덇린?붾릺吏 ?딆븯?듬땲??');
        return;
    }
    
    try {
        const { data: categories, error } = await window.supabaseClient
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const nav = document.getElementById('categoryNav');
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
                
                // Update active state
                document.querySelectorAll('.category-link').forEach(l => {
                    l.classList.remove('active');
                });
                link.classList.add('active');
            });
            
            li.appendChild(link);
            nav.appendChild(li);
        });
        
    } catch (error) {
        console.error('移댄뀒怨좊━ 濡쒕뵫 ?ㅽ뙣:', error);
    }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 4. POST LOADING BY CATEGORY
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
async function loadPostsByCategory(categoryId) {
    try {
        // Check if user is admin
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        const isAdmin = user && user.email === window.ADMIN_EMAIL;
        
        let query = window.supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('category_id', categoryId)
            .order('created_at', { ascending: false });
        
        // Non-admin users can only see public posts
        if (!isAdmin) {
            query = query.eq('is_private', false);
        }
        
        const { data: posts, error } = await query;
        
        if (error) throw error;
        
        // Display posts in main content
        const content = document.getElementById('mainContent');
        const title = document.getElementById('welcomeTitle');
        
        if (posts.length === 0) {
            title.textContent = '寃뚯떆臾??놁쓬';
            content.innerHTML = '<p>??移댄뀒怨좊━?먮뒗 ?꾩쭅 寃뚯떆臾쇱씠 ?놁뒿?덈떎.</p>';
            return;
        }
        
        // Get category name
        const { data: category } = await window.supabaseClient
            .from('categories')
            .select('name')
            .eq('id', categoryId)
            .single();
        
        title.textContent = category.name;
        
        // Display post list
        content.innerHTML = posts.map(post => `
            <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
                <h3>
                    <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
                        ${post.title}
                        ${post.is_private ? '<span style="font-size: 0.8em; color: var(--accent-amber);"> ?뵏</span>' : ''}
                    </a>
                </h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
                    ${new Date(post.created_at).toLocaleDateString('ko-KR')}
                </p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('寃뚯떆臾?濡쒕뵫 ?ㅽ뙣:', error);
    }
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 5. SEARCH FUNCTIONALITY
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
let searchTimeout;
const searchInput = document.getElementById('searchInput');

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        const query = e.target.value.trim();
        
        if (query.length < 2) return;
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            const isAdmin = user && user.email === window.ADMIN_EMAIL;
            
            let searchQuery = window.supabaseClient
                .from('archive_posts')
                .select('id, title, created_at, category_id')
                .ilike('title', `%${query}%`)
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (!isAdmin) {
                searchQuery = searchQuery.eq('is_private', false);
            }
            
            const { data: results, error } = await searchQuery;
            
            if (error) throw error;
            
            displaySearchResults(results);
            
        } catch (error) {
            console.error('寃???ㅽ뙣:', error);
        }
    }, 300);
});

function displaySearchResults(results) {
    const content = document.getElementById('mainContent');
    const title = document.getElementById('welcomeTitle');
    
    title.textContent = '寃??寃곌낵';
    
    if (results.length === 0) {
        content.innerHTML = '<p>寃??寃곌낵媛 ?놁뒿?덈떎.</p>';
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

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 6. NIGHT MODE TOGGLE
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
const modeToggle = document.getElementById('modeToggle');
const NIGHT_MODE_KEY = 'night_mode';

function loadNightMode() {
    const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';
    
    if (isNightMode) {
        document.body.classList.add('night-mode');
        modeToggle.innerHTML = '<span>?截?/span><span>Day Mode</span>';
    }
}

modeToggle.addEventListener('click', () => {
    const isNightMode = document.body.classList.toggle('night-mode');
    localStorage.setItem(NIGHT_MODE_KEY, isNightMode);
    
    if (isNightMode) {
        modeToggle.innerHTML = '<span>?截?/span><span>Day Mode</span>';
    } else {
        modeToggle.innerHTML = '<span>?뙔</span><span>Night Library</span>';
    }
});

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 7. COPY PROTECTION SYSTEM
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
document.addEventListener('copy', async (e) => {
    const selection = window.getSelection().toString();
    
    if (!selection) return;
    
    // Check if current post has origin_free enabled
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        try {
            const { data: post } = await window.supabaseClient
                .from('archive_posts')
                .select('origin_free')
                .eq('id', postId)
                .single();
            
            if (post && post.origin_free) {
                return; // Don't add attribution
            }
        } catch (error) {
            console.error('蹂듭궗 蹂댄샇 ?뺤씤 ?ㅽ뙣:', error);
        }
    }
    
    // Add attribution
    const attribution = `\n\n?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺\n蹂?湲곕줉? SMALLSM Archive???먯궛?낅땲??\n異쒖쿂: ${window.location.origin}\n?좑툘 臾대떒 ?섏젙 諛??곸뾽???댁슜??湲덊빀?덈떎.\n?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺`;
    
    e.clipboardData.setData('text/plain', selection + attribution);
    e.preventDefault();
});

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
// 8. INITIALIZATION
// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

// ?섍꼍 蹂??濡쒕뱶瑜?湲곕떎由쎈땲??
function waitForConfig(callback, maxWait = 5000) {
    const startTime = Date.now();
    const interval = setInterval(() => {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            clearInterval(interval);
            callback();
        } else if (Date.now() - startTime > maxWait) {
            clearInterval(interval);
            console.error('?깍툘 ?섍꼍 蹂??濡쒕뱶 ??꾩븘??);
        }
    }, 100);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('?벑 DOM 濡쒕뱶 ?꾨즺');
    
    // Age verification button handlers - ??긽 癒쇱? ?깅줉
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');
    
    if (btnYes) {
        btnYes.addEventListener('click', () => {
            console.log('????踰꾪듉 ?대┃??);
            localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
            hideDisclaimer();
            
            // ?섍꼍 蹂??濡쒕뱶 ??珥덇린??
            waitForConfig(() => {
                console.log('?뵩 window.supabaseClient 珥덇린???쒖옉');
                initializewindow.supabaseClient();
                loadCategories();
            });
        });
    }

    if (btnNo) {
        btnNo.addEventListener('click', () => {
            console.log('???꾨땲??踰꾪듉 ?대┃??);
            window.location.href = 'https://www.google.com';
        });
    }
    
    // Check verification and load content
    const verified = localStorage.getItem(VERIFICATION_KEY);
    if (verified) {
        const timestamp = parseInt(verified);
        const now = Date.now();
        
        if (now - timestamp < VERIFICATION_DURATION) {
            console.log('???몄쬆 ?곹깭 ?좏슚');
            // Already verified, initialize normally
            waitForConfig(() => {
                initializewindow.supabaseClient();
                loadCategories();
            });
        }
    }
    
    checkAgeVerification();
    loadNightMode();
});

} // End of SMALLSM_LOADED check

