// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - POST SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let supabaseClient = null;

// Wait for config to load
function waitForConfig(callback) {
    const startTime = Date.now();
    const maxWait = 5000; // 5 seconds

    const interval = setInterval(() => {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            clearInterval(interval);
            callback();
        } else if (Date.now() - startTime > maxWait) {
            clearInterval(interval);
            console.error('⏱️ Config loading timeout');
        }
    }, 100);
}

// ═══════════════════════════════════════════════════
// 1. SUPABASE INITIALIZATION
// ═══════════════════════════════════════════════════
function initializeSupabase() {
    if (!window.supabase) {
        console.error('❌ Supabase library not loaded');
        return;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    console.log('✅ Supabase initialized for post');
}

// ═══════════════════════════════════════════════════
// 2. AGE VERIFICATION SYSTEM (Same as main.js)
// ═══════════════════════════════════════════════════
const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000;

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);

    if (verified) {
        const timestamp = parseInt(verified);
        const now = Date.now();

        if (now - timestamp < VERIFICATION_DURATION) {
            hideDisclaimer();
            return true;
        }
    }

    showDisclaimer();
    return false;
}

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

// ═══════════════════════════════════════════════════
// 3. LOAD CATEGORIES (Same as main.js)
// ═══════════════════════════════════════════════════
async function loadCategories() {
    if (!supabaseClient) return;

    try {
        // Fetch Categories
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        if (error) throw error;

        // Fetch Post Counts (public only)
        const { data: posts } = await supabaseClient
            .from('archive_posts')
            .select('category_id, is_private')
            .eq('is_private', false);

        const counts = {};
        if (posts) {
            posts.forEach(p => {
                counts[p.category_id] = (counts[p.category_id] || 0) + 1;
            });
        }

        renderCategories(categories || [], counts);

    } catch (error) {
        console.error('Categories loading failed:', error);
    }
}

function renderCategories(categories, counts) {
    const nav = document.getElementById('categoryNav');
    if (!nav) return;

    const roots = categories.filter(c => !c.parent_id);
    const childrenMap = {};
    categories.filter(c => c.parent_id).forEach(c => {
        if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
        childrenMap[c.parent_id].push(c);
    });

    nav.innerHTML = roots.map(root => {
        const children = childrenMap[root.id] || [];
        const hasChildren = children.length > 0;
        const count = counts[root.id] || 0;

        return `
            <li class="category-item">
                <div class="category-header-wrap">
                    <a href="javascript:void(0);" 
                       onclick="${hasChildren ? `toggleAccordion('${root.id}')` : `location.href='index.html#category-${root.id}'`}" 
                       class="category-link ${hasChildren ? 'has-children' : ''}" 
                       data-id="${root.id}">
                        <span class="cat-name">${root.name}</span>
                        <span class="cat-count">(${count})</span>
                        ${hasChildren ? '<span class="accordion-indicator" id="ind-' + root.id + '">▸</span>' : ''}
                    </a>
                </div>
                ${hasChildren ? `
                    <ul class="submenu" id="sub-${root.id}" style="display: none;">
                        ${children.map(child => {
            const childCount = counts[child.id] || 0;
            return `
                                <li class="submenu-item">
                                    <a href="index.html#category-${child.id}" class="submenu-link" data-id="${child.id}">
                                        - ${child.name} <span class="cat-count">(${childCount})</span>
                                    </a>
                                </li>
                            `;
        }).join('')}
                    </ul>
                ` : ''}
            </li>
        `;
    }).join('');
}

window.toggleAccordion = function (id) {
    const submenu = document.getElementById(`sub-${id}`);
    const indicator = document.getElementById(`ind-${id}`);
    const link = document.querySelector(`.category-link[data-id="${id}"]`);

    if (submenu) {
        const isHidden = submenu.style.display === 'none';
        submenu.style.display = isHidden ? 'block' : 'none';
        if (indicator) indicator.textContent = isHidden ? '▾' : '▸';
        if (link) link.classList.toggle('active', isHidden);
    }
};

// ═══════════════════════════════════════════════════
// 4. LOAD POST CONTENT
// ═══════════════════════════════════════════════════
async function loadPost() {
    if (!supabaseClient) return;
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        window.location.href = '404.html';
        return;
    }

    try {
        // Check if user is admin
        const { data: { user } } = await supabaseClient.auth.getUser();
        const isAdmin = user && user.email === window.ADMIN_EMAIL;

        // Fetch post
        const { data: post, error } = await supabaseClient
            .from('archive_posts')
            .select(`
                *,
                categories (name)
            `)
            .eq('id', postId)
            .single();

        if (error) throw error;

        // Security: Check if post is private and user is not admin
        if (post.is_private && !isAdmin) {
            window.location.href = '404.html';
            return;
        }

        // Display post
        document.getElementById('pageTitle').textContent = `${post.title} - SMALLSM Archive`;
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postCategory').textContent = post.categories ? post.categories.name : '미분류';
        document.getElementById('postDate').textContent = new Date(post.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Initialize Toast UI Viewer
        const Viewer = toastui.Editor;
        const viewer = new Viewer({
            el: document.querySelector('#postContent'),
            initialValue: post.content
        });

        // Add copy protection class if needed
        if (!post.origin_free) {
            document.getElementById('postContent').classList.add('copy-protected');
        }

    } catch (error) {
        console.error('게시물 로딩 실패:', error);
        // window.location.href = '404.html'; // Debugging
        document.getElementById('postContent').innerHTML = `<p style="color:red">오류 발생: ${error.message}</p>`;
    }
}

// ═══════════════════════════════════════════════════
// 5. NIGHT MODE (Same as main.js)
// ═══════════════════════════════════════════════════
const NIGHT_MODE_KEY = 'night_mode';

// ═══════════════════════════════════════════════════
// 7. LONG PRESS FOR ADMIN
// ═══════════════════════════════════════════════════
function initAdminLongPress() {
    const copyright = document.getElementById('copyrightText');
    if (!copyright) return;

    let pressTimer;
    const PRESS_DURATION = 3000; // 3 seconds

    const startPress = (e) => {
        pressTimer = setTimeout(() => {
            window.location.href = 'admin.html';
        }, PRESS_DURATION);
    };

    const cancelPress = () => {
        clearTimeout(pressTimer);
    };

    copyright.addEventListener('mousedown', startPress);
    copyright.addEventListener('mouseup', cancelPress);
    copyright.addEventListener('mouseleave', cancelPress);

    copyright.addEventListener('touchstart', startPress);
    copyright.addEventListener('touchend', cancelPress);
    copyright.addEventListener('touchcancel', cancelPress);

    copyright.style.cursor = 'default';
    copyright.style.userSelect = 'none';
    copyright.style.webkitUserSelect = 'none';
}

function initNightMode() {
    const sidebarToggle = document.getElementById('modeToggle');
    const headerToggle = document.getElementById('headerModeToggle');
    if (!sidebarToggle && !headerToggle) return;

    const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';

    const updateUI = (nightMode) => {
        document.body.classList.toggle('night-mode', nightMode);
        const icon = nightMode ? '☀️' : '🌙';
        const text = nightMode ? 'Day Mode' : 'Night Library';

        if (sidebarToggle) sidebarToggle.innerHTML = `<span>${icon}</span><span>${text}</span>`;
        if (headerToggle) headerToggle.innerHTML = `<span class="mode-icon">${icon}</span>`;
    };

    if (isNightMode) updateUI(true);

    const toggleMode = () => {
        const currentMode = document.body.classList.contains('night-mode');
        const nextMode = !currentMode;
        localStorage.setItem(NIGHT_MODE_KEY, nextMode);
        updateUI(nextMode);
    };

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleMode);
    if (headerToggle) headerToggle.addEventListener('click', toggleMode);
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggleBtn');
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!menuToggle || !sidebar || !overlay) return;

    const toggleMenu = () => {
        const isActive = sidebar.classList.toggle('active');
        overlay.classList.toggle('active', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    menuToggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close sidebar on navigation (mobile)
    const nav = document.getElementById('categoryNav');
    if (nav) {
        nav.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && (e.target.tagName === 'A' || e.target.closest('a'))) {
                toggleMenu();
            }
        });
    }
}

// ═══════════════════════════════════════════════════
// 6. COPY PROTECTION (Same as main.js)
// ═══════════════════════════════════════════════════
document.addEventListener('copy', async (e) => {
    if (!supabaseClient) return;
    const selection = window.getSelection().toString();

    if (!selection) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (postId) {
        try {
            const { data: post } = await supabaseClient
                .from('archive_posts')
                .select('origin_free')
                .eq('id', postId)
                .single();

            if (post && post.origin_free) {
                return;
            }
        } catch (error) {
            console.error('복사 보호 확인 실패:', error);
        }
    }

    const attribution = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n본 기록은 SMALLSM Archive의 자산입니다.\n출처: ${window.location.href}\n⚠️ 무단 수정 및 상업적 이용을 금합니다.\n━━━━━━━━━━━━━━━━━━━━━━━━`;

    e.clipboardData.setData('text/plain', selection + attribution);
    e.preventDefault();
});

// ═══════════════════════════════════════════════════
// 7. INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Age verification button handlers
    const btnYes = document.getElementById('btnYes');
    const btnNo = document.getElementById('btnNo');

    if (btnYes) {
        btnYes.addEventListener('click', () => {
            localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
            hideDisclaimer();
            waitForConfig(() => {
                initializeSupabase();
                loadCategories();
                loadPost();
            });
        });
    }

    if (btnNo) {
        btnNo.addEventListener('click', () => {
            window.location.href = 'https://www.google.com';
        });
    }

    if (checkAgeVerification()) {
        waitForConfig(() => {
            initializeSupabase();
            loadCategories();
            loadPost();
        });
    }

    initNightMode();
    initAdminLongPress();
    initMobileMenu();

    // Home Link
    const titleConfig = document.querySelector('.sidebar-header');
    if (titleConfig) {
        titleConfig.style.cursor = 'pointer';
        titleConfig.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
