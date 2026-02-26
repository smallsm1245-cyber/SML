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
    // 1) First priority: already initialized global client
    if (window.supabaseClient) {
        supabaseClient = window.supabaseClient;
        console.log('✅ Supabase reused from global instance');
        return;
    }

    if (!window.supabase) {
        console.error('❌ Supabase library not loaded');
        return;
    }

    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    window.supabaseClient = supabaseClient; // Sync back
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

        // Add copy protection class if needed
        if (!post.origin_free) {
            document.getElementById('postContent').classList.add('copy-protected');
        }

        // 나무위키 스타일 후처리 (렌더링 완료 후 실행)
        setTimeout(() => initWikiLayout(post.title), 150);

    } catch (error) {
        console.error('게시물 로딩 실패:', error);
        document.getElementById('postContent').innerHTML = `<p style="color:red">오류 발생: ${error.message}</p>`;
    }
}

// ═══════════════════════════════════════════════════
// 4.5. 나무위키 스타일 레이아웃 후처리
// ═══════════════════════════════════════════════════
function initWikiLayout(postTitle) {
    const contentEl = document.getElementById('postContent');
    if (!contentEl) return;

    // Toast UI가 렌더링한 실제 콘텐츠 영역을 찾음
    const rendered = contentEl.querySelector('.toastui-editor-contents') || contentEl;

    styleInfobox(rendered, postTitle);
    const headings = buildTOC(rendered);
    if (headings.length >= 2) {
        wrapSections(rendered, headings);
    }
}

/** 첫 번째 <table>을 인포박스로 이동 */
function styleInfobox(rendered, postTitle) {
    const infoboxEl = document.getElementById('wikiInfobox');
    if (!infoboxEl) return;

    const firstTable = rendered.querySelector('table');
    if (!firstTable) return;

    // 포스트 제목을 인포박스 타이틀로 사용
    const titleDiv = document.createElement('div');
    titleDiv.className = 'wiki-infobox-title';
    titleDiv.textContent = postTitle || 'INFO';

    infoboxEl.appendChild(titleDiv);
    infoboxEl.appendChild(firstTable);
    infoboxEl.style.display = 'block';
}

/** h2/h3 헤딩을 기반으로 목차(TOC) 생성 */
function buildTOC(rendered) {
    const tocContainer = document.getElementById('tocContainer');
    if (!tocContainer) return [];

    const headings = Array.from(rendered.querySelectorAll('h2, h3'));
    if (headings.length < 2) return headings; // 헤딩이 적으면 목차 생략

    // 각 헤딩에 ID 부여
    headings.forEach((h, i) => {
        if (!h.id) h.id = `wiki-section-${i}`;
    });

    // TOC HTML 빌드
    const toc = document.createElement('div');
    toc.className = 'wiki-toc';

    const tocTitle = document.createElement('div');
    tocTitle.className = 'wiki-toc-title';
    tocTitle.textContent = '목차';
    toc.appendChild(tocTitle);

    const ol = document.createElement('ol');
    let h2Counter = 0;
    let currentLi = null;
    let currentSubOl = null;

    headings.forEach(h => {
        if (h.tagName === 'H2') {
            h2Counter++;
            currentLi = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${h.id}`;
            a.textContent = `${h.textContent}`;
            a.addEventListener('click', e => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            currentLi.appendChild(a);
            currentSubOl = null;
            ol.appendChild(currentLi);
        } else if (h.tagName === 'H3' && currentLi) {
            if (!currentSubOl) {
                currentSubOl = document.createElement('ol');
                currentSubOl.className = 'toc-sub';
                currentLi.appendChild(currentSubOl);
            }
            const subLi = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${h.id}`;
            a.textContent = h.textContent;
            a.addEventListener('click', e => {
                e.preventDefault();
                h.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            subLi.appendChild(a);
            currentSubOl.appendChild(subLi);
        }
    });

    toc.appendChild(ol);
    tocContainer.appendChild(toc);
    return headings;
}

/** h2 기준으로 각 섹션을 <details open> 아코디언으로 래핑 */
function wrapSections(rendered, headings) {
    const h2s = headings.filter(h => h.tagName === 'H2');
    if (h2s.length === 0) return;

    let sectionCounter = 0;

    h2s.forEach(h2 => {
        sectionCounter++;
        const sectionNum = sectionCounter;

        // h2부터 다음 h2까지의 노드들을 수집
        const nodes = [];
        let next = h2.nextSibling;
        while (next && !(next.tagName === 'H2')) {
            nodes.push(next);
            next = next.nextSibling;
        }

        // 아코디언 구조 생성
        const sectionWrapper = document.createElement('div');
        sectionWrapper.className = 'wiki-section';

        const details = document.createElement('details');
        details.open = true; // 기본 펼침

        const summary = document.createElement('summary');
        summary.innerHTML = `
            <svg class="section-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span class="section-number">${sectionNum}.</span>
            <span class="section-heading">${h2.textContent}</span>
        `;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'wiki-section-content';

        // 헤딩 ID를 앵커용으로 보존
        const anchor = document.createElement('span');
        anchor.id = h2.id;
        anchor.style.display = 'block';
        contentDiv.appendChild(anchor);

        nodes.forEach(node => contentDiv.appendChild(node));

        details.appendChild(summary);
        details.appendChild(contentDiv);
        sectionWrapper.appendChild(details);

        // h2를 sectionWrapper로 교체
        h2.parentNode.insertBefore(sectionWrapper, h2);
        h2.remove();
    });
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
    initHeaderScroll();
    initEmergencySystem();
    initBottomNav();
    initUtilityBar();

    if (window.lucide) window.lucide.createIcons();

    // Home Link
    const titleConfig = document.querySelector('.sidebar-header');
    if (titleConfig) {
        titleConfig.style.cursor = 'pointer';
        titleConfig.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
});
