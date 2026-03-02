// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - POST SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════
// 1. HELPERS
// ═══════════════════════════════════════════════════
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

        // Save for Wiki "Back" functionality
        window.allCategories = categories || [];
        window.allCounts = counts;

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

        const chevronSvg = `
            <svg class="chevron" viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;

        return `
            <li class="category-item">
                <div class="category-header-wrap">
                    <a href="javascript:void(0);" 
                       onclick="${hasChildren ? `toggleAccordion('${root.id}')` : `location.href='index.html#category-${root.id}'`}" 
                       class="category-link ${hasChildren ? 'has-children' : ''}" 
                       data-id="${root.id}">
                        <div class="cat-name-block">
                            ${hasChildren ? chevronSvg : ''}
                            <span class="cat-name">${root.name}</span>
                        </div>
                        <span class="cat-count">${count}</span>
                    </a>
                </div>
                ${hasChildren ? `
                    <ul class="submenu" id="sub-${root.id}">
                        ${children.map(child => {
            const childCount = counts[child.id] || 0;
            return `
                                <li class="submenu-item">
                                    <a href="index.html#category-${child.id}" class="submenu-link" data-id="${child.id}">
                                        - ${child.name} <span class="cat-count" style="float:right">${childCount}</span>
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
    const link = document.querySelector(`.category-link[data-id="${id}"]`);

    if (submenu) {
        const isActive = submenu.classList.toggle('active');
        if (link) link.classList.toggle('active', isActive);
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
        const titleEl = document.getElementById('postTitle');
        titleEl.textContent = post.title;
        titleEl.dataset.adminEditable = 'text';
        titleEl.dataset.adminId = postId;
        titleEl.dataset.adminField = 'title';

        const contentEl = document.getElementById('postContent');
        contentEl.dataset.adminEditable = 'content';
        contentEl.dataset.adminId = postId;
        contentEl.dataset.adminField = 'content';

        document.getElementById('pageTitle').textContent = `${post.title} - SMALLSM Archive`;
        document.getElementById('postCategory').textContent = post.categories ? post.categories.name : '미분류';
        document.getElementById('postDate').textContent = new Date(post.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        // Initialize Toast UI Viewer
        const Viewer = toastui.Editor;
        const viewer = Viewer.factory({
            el: document.querySelector('#postContent'),
            viewer: true,
            initialValue: post.content,
            theme: 'dark'
        });

        // Add Wiki sidebar info (Infobox & TOC)
        renderWikiInfo(post);

        // Fetch sibling posts for unified sidebar navigation
        loadWikiSiblingPosts(post.category_id);

        // Custom rendering for Callouts after viewer is ready
        setTimeout(processWikiComponents, 100);

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

function renderWikiInfo(post) {
    const infoCol = document.getElementById('wikiInfoCol');
    if (!infoCol) return;

    // Auto-generate TOC from headers
    const headers = Array.from(document.getElementById('postContent').querySelectorAll('h2, h3'));
    const tocHtml = headers.length > 0 ? `
        <div class="wiki-toc">
            <h3 class="toc-title">Contents</h3>
            <ul class="toc-list">
                ${headers.map((h, i) => {
        const id = `heading-${i}`;
        h.id = id;
        return `
                        <li class="toc-item" style="padding-left: ${h.tagName === 'H3' ? '1rem' : '0'}">
                            <a href="#${id}" class="toc-link" onclick="scrollToHeading(event, '${id}')">${h.textContent}</a>
                        </li>
                    `;
    }).join('')}
            </ul>
        </div>
    ` : '';

    const updatedDate = new Date(post.updated_at || post.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    infoCol.innerHTML = `
        <div class="wiki-infobox animate-slide-up">
            <div class="infobox-header">
                <span class="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Document Meta</span>
                <h3 class="infobox-title mt-2">${post.title}</h3>
            </div>
            <div class="infobox-data">
                <div class="infobox-row">
                    <span class="infobox-label">Classification</span>
                    <span class="infobox-value">${post.categories ? post.categories.name : 'Archive'}</span>
                </div>
                <div class="infobox-row">
                    <span class="infobox-label">Editor</span>
                    <span class="infobox-value">Archive Master</span>
                </div>
                <div class="infobox-row">
                    <span class="infobox-label">Last Modified</span>
                    <span class="infobox-value">${updatedDate}</span>
                </div>
            </div>
            ${tocHtml}
        </div>
    `;
}

async function loadWikiSiblingPosts(categoryId) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const isAdmin = user && user.email === window.ADMIN_EMAIL;

        let query = supabaseClient
            .from('archive_posts')
            .select('id, title')
            .eq('category_id', categoryId)
            .order('title', { ascending: true });

        if (!isAdmin) {
            query = query.eq('is_private', false);
        }

        const { data: posts } = await query;
        window.wikiData = posts || [];
        renderWikiNav();
    } catch (e) {
        console.error('Failed to load siblings:', e);
    }
}

function renderWikiNav() {
    const navCol = document.getElementById('wikiNavCol');
    const globalCategoryNav = document.getElementById('categoryNav');
    if (!navCol && !globalCategoryNav) return;

    const posts = window.wikiData || [];
    const isDesktop = window.innerWidth >= 1024;
    const target = isDesktop ? globalCategoryNav : navCol;
    if (!target) return;

    const urlParams = new URLSearchParams(window.location.search);
    const activeId = urlParams.get('id');

    const backButton = `
        <li class="mb-4">
            <a href="index.html" 
               class="flex items-center gap-2 text-xs font-bold text-[var(--wiki-gold)] hover:text-white transition-colors uppercase tracking-widest font-mono">
                <i data-lucide="arrow-left" class="w-3 h-3"></i> Back to Archive
            </a>
        </li>
    `;

    target.innerHTML = `
        ${isDesktop ? backButton : ''}
        <div class="relative mb-6">
            <i data-lucide="search" class="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500"></i>
            <input type="text" id="wikiSearch" placeholder="Filter documents..." 
                class="w-full bg-white/5 border border-white/10 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:border-[var(--wiki-gold)] outline-none">
        </div>
        <ul class="wiki-nav-list">
            ${posts.map(p => `
                <li class="wiki-nav-item">
                    <a href="post.html?id=${p.id}" 
                       class="wiki-nav-link ${activeId === p.id ? 'active' : ''}">
                        ${p.title}
                    </a>
                </li>
            `).join('')}
        </ul>
    `;
    if (window.lucide) window.lucide.createIcons();

    // Search listener
    const searchInput = document.getElementById('wikiSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.wiki-nav-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(term) ? 'block' : 'none';
            });
        });
    }
}

window.scrollToHeading = function (e, id) {
    if (e) e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = el.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }
};

function processWikiComponents() {
    const viewer = document.getElementById('postContent');
    if (!viewer) return;

    const blockquotes = viewer.querySelectorAll('blockquote');
    blockquotes.forEach(bq => {
        const p = bq.querySelector('p');
        if (p && p.textContent.startsWith('[!')) {
            const match = p.textContent.match(/\[!(.*?)\]/);
            const type = match ? match[1] : 'NOTE';
            const content = p.innerHTML.replace(`[!${type}]`, '').trim();

            bq.outerHTML = `
                <div class="wiki-callout">
                    <div class="wiki-callout-title">
                        <i data-lucide="info" class="w-4 h-4"></i> ${type.toUpperCase()}
                    </div>
                    <div class="wiki-callout-content">${content}</div>
                </div>
            `;
        }
    });
    if (window.lucide) window.lucide.createIcons();
}

function initNightMode() {
    const headerToggle = document.getElementById('headerModeToggle');
    if (!headerToggle) return;

    headerToggle.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
    });
}

function initHeaderScroll() {
    const header = document.getElementById('mainHeader');
    const progressBar = document.getElementById('readingProgress');
    const utilityBar = document.getElementById('utilityBar');
    if (!header) return;

    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;

        // Progress Bar Calculation
        if (progressBar && docHeight > 0) {
            const progress = (currentScrollY / docHeight) * 100;
            progressBar.style.width = `${progress}%`;
        }

        // Utility Bar Visibility (show after scrolling 300px)
        if (utilityBar) {
            if (currentScrollY > 300) {
                utilityBar.classList.remove('scale-0', 'opacity-0');
                utilityBar.classList.add('scale-100', 'opacity-100');
            } else {
                utilityBar.classList.remove('scale-100', 'opacity-100');
                utilityBar.classList.add('scale-0', 'opacity-0');
            }
        }

        // Header Scroll Logic
        if (Math.abs(currentScrollY - lastScrollY) < 10) return;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    }, { passive: true });
}

// ═══════════════════════════════════════════════════
// 9. EMERGENCY & BOTTOM NAV SYSTEM
// ═══════════════════════════════════════════════════
const EMERGENCY_URL_KEY = 'emergency_url';
const EMERGENCY_OPACITY_KEY = 'emergency_opacity';

function initEmergencySystem() {
    const fab = document.getElementById('emergencyFab');
    const urlInput = document.getElementById('escapeUrlInput');
    const opacitySlider = document.getElementById('opacitySlider');
    const opacityVal = document.getElementById('opacityVal');
    const presetBtns = document.querySelectorAll('.preset-btn');

    if (!fab) return;

    // Load settings
    const savedUrl = localStorage.getItem(EMERGENCY_URL_KEY) || 'https://www.google.com';
    const savedOpacity = localStorage.getItem(EMERGENCY_OPACITY_KEY) || '20';

    if (urlInput) urlInput.value = savedUrl;
    if (opacitySlider) opacitySlider.value = savedOpacity;
    if (opacityVal) opacityVal.textContent = savedOpacity;
    fab.style.opacity = savedOpacity / 100;

    // FAB Logic
    fab.addEventListener('click', () => {
        const url = localStorage.getItem(EMERGENCY_URL_KEY) || 'https://www.google.com';
        window.location.replace(url);
    });

    // Settings Logic
    if (urlInput) {
        urlInput.addEventListener('change', (e) => {
            let url = e.target.value;
            if (url && !url.startsWith('http')) url = 'https://' + url;
            localStorage.setItem(EMERGENCY_URL_KEY, url);
        });
    }

    if (opacitySlider) {
        opacitySlider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (opacityVal) opacityVal.textContent = val;
            fab.style.opacity = val / 100;
            localStorage.setItem(EMERGENCY_OPACITY_KEY, val);
        });
    }

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const url = btn.dataset.url;
            if (urlInput) urlInput.value = url;
            localStorage.setItem(EMERGENCY_URL_KEY, url);
        });
    });
}

function initBottomNav() {
    const navHome = document.getElementById('navHome');
    const navWiki = document.getElementById('navWiki');
    const navSearch = document.getElementById('navSearch');
    const navSettings = document.getElementById('navSettings');

    const article = document.querySelector('article');
    const settingsView = document.getElementById('settingsView');
    const navItems = [navHome, navWiki, navSearch, navSettings];

    if (!navHome) return;

    const resetActive = () => {
        navItems.forEach(item => {
            if (item) {
                item.classList.remove('text-brand-primary');
                item.classList.add('text-slate-400');
            }
        });
    };

    const showView = (view) => {
        resetActive();
        if (view === 'settings') {
            if (article) article.classList.add('hidden');
            if (settingsView) settingsView.classList.remove('hidden');
            if (navSettings) navSettings.classList.add('text-brand-primary');
        } else {
            if (article) article.classList.remove('hidden');
            if (settingsView) settingsView.classList.add('hidden');
            if (navHome) navHome.classList.add('text-slate-400'); // default
        }
        window.scrollTo(0, 0);
    };

    navSettings.addEventListener('click', (e) => {
        e.preventDefault();
        showView('settings');
    });

    // Other nav items are links to index.html with hashes, which is fine
}

function initUtilityBar() {
    const btnTextSize = document.getElementById('btnTextSize');
    const btnShare = document.getElementById('btnShare');
    const btnEmergency = document.getElementById('btnEmergency');
    const content = document.getElementById('postContent');

    if (btnTextSize && content) {
        let sizeIndex = 1;
        const sizes = ['text-base', 'text-lg', 'text-xl'];
        btnTextSize.addEventListener('click', () => {
            content.classList.remove(...sizes);
            sizeIndex = (sizeIndex + 1) % sizes.length;
            content.classList.add(sizes[sizeIndex]);
        });
    }

    if (btnShare) {
        btnShare.addEventListener('click', async () => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: document.getElementById('postTitle').textContent,
                        url: window.location.href
                    });
                } catch (err) {
                    console.log('Share failed:', err);
                }
            } else {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다.');
            }
        });
    }

    if (btnEmergency) {
        btnEmergency.addEventListener('click', () => {
            const url = localStorage.getItem(EMERGENCY_URL_KEY) || 'https://www.google.com';
            window.location.replace(url);
        });
    }
}

function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggleBtn');
    const menuToggleMobile = document.getElementById('menuToggleBtnMobile');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (!sidebar || !overlay) return;

    const closeMenu = () => {
        sidebar.classList.add('-translate-x-full');
        sidebar.classList.add('hidden');
        overlay.classList.add('hidden');
        overlay.classList.remove('opacity-100');
        document.body.style.overflow = '';
    };

    const openMenu = () => {
        sidebar.classList.remove('hidden');
        overlay.classList.remove('hidden');
        setTimeout(() => {
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.add('opacity-100');
        }, 10);
        document.body.style.overflow = 'hidden';
    };

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('-translate-x-full')) {
                openMenu();
            } else {
                closeMenu();
            }
        });
    }

    if (menuToggleMobile) {
        menuToggleMobile.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('-translate-x-full')) {
                openMenu();
            } else {
                closeMenu();
            }
        });
    }

    overlay.addEventListener('click', closeMenu);
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
    // Initialization triggered by core.js readiness
    window.SML_CORE.waitForConfig(() => {
        if (window.supabaseClient) {
            loadCategories();
            loadPost();
        }
    });

    initNightMode();
    initAdminLongPress();
    initMobileMenu();
    initHeaderScroll();
    initEmergencySystem();
    initBottomNav();
    initUtilityBar();

    // Home Link
    const titleConfig = document.querySelector('.sidebar-header');
    if (titleConfig) {
        titleConfig.style.cursor = 'pointer';
        titleConfig.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
