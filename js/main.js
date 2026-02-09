// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function () {
    'use strict';

    console.log('🚀 SMALLSM Archive initializing...');

    // ═══════════════════════════════════════════════════
    // 1. GLOBALS
    // ═══════════════════════════════════════════════════
    let supabaseClient = null;
    const VERIFICATION_KEY = 'age_verified';
    const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const NIGHT_MODE_KEY = 'night_mode';

    // ═══════════════════════════════════════════════════
    // 2. SUPABASE INITIALIZATION
    // ═══════════════════════════════════════════════════
    function initializeSupabase() {
        try {
            if (!window.supabase) {
                console.error('❌ Supabase library not loaded');
                return false;
            }

            if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
                console.error('❌ Supabase config not found');
                return false;
            }

            supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );

            console.log('✅ Supabase initialized');
            return true;
        } catch (error) {
            console.error('❌ Supabase init failed:', error);
            return false;
        }
    }

    // ═══════════════════════════════════════════════════
    // 3. AGE VERIFICATION
    // ═══════════════════════════════════════════════════
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
    // 4. CATEGORY LOADING
    // ═══════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════
    // 4. HOME SETTINGS LOADING
    // ═══════════════════════════════════════════════════
    async function loadHomeSettings() {
        if (!supabaseClient) return;

        try {
            const { data, error } = await supabaseClient
                .from('settings')
                .select('*')
                .in('key', [
                    'home_title', 'home_subtitle', 'home_content', 'show_recent_posts', 'recent_posts_count',
                    'site_title', 'site_description', 'google_site_verification', 'naver_verification'
                ]);

            if (error) throw error;

            const settings = {};
            data.forEach(item => settings[item.key] = item.value);

            // Update Site SEO
            if (settings.site_title) {
                document.title = settings.site_title;
                const titleTag = document.getElementById('siteTitleTag');
                if (titleTag) titleTag.textContent = settings.site_title;
                const siteTitleEl = document.querySelector('.site-title');
                if (siteTitleEl) siteTitleEl.textContent = settings.site_title;
            }
            if (settings.site_description) {
                const descTag = document.getElementById('siteDescTag');
                if (descTag) descTag.content = settings.site_description;
            }
            if (settings.google_site_verification) {
                const gTag = document.querySelector('meta[name="google-site-verification"]');
                if (gTag) gTag.content = settings.google_site_verification;
            }
            if (settings.naver_verification) {
                const nTag = document.querySelector('meta[name="naver-site-verification"]');
                if (nTag) nTag.content = settings.naver_verification;
            }

            const title = document.getElementById('welcomeTitle');
            const subtitle = document.querySelector('.post-meta span');
            const content = document.getElementById('mainContent');

            if (title && settings.home_title) title.textContent = settings.home_title;
            if (subtitle && settings.home_subtitle) subtitle.textContent = settings.home_subtitle;
            if (content && settings.home_content) {
                // Initialize Toast UI Viewer
                const Viewer = toastui.Editor;
                // Check if viewer already exists to avoid duplicates if called multiple times (though loadHomeSettings is usually once)
                content.innerHTML = '';
                const viewer = new Viewer({
                    el: content,
                    initialValue: settings.home_content
                });
            }

            // Handle recent posts if enabled
            if (settings.show_recent_posts === 'true') {
                const count = parseInt(settings.recent_posts_count) || 3;
                await loadRecentPosts(count);
            }

            console.log('✅ Home settings loaded');

        } catch (error) {
            console.error('❌ Home settings loading failed:', error);
        }
    }

    async function loadRecentPosts(count) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const isAdmin = user && user.email === window.ADMIN_EMAIL;

            let query = supabaseClient
                .from('archive_posts')
                .select('id, title, created_at')
                .order('created_at', { ascending: false })
                .limit(count);

            if (!isAdmin) {
                query = query.eq('is_private', false);
            }

            const { data: posts, error } = await query;
            if (error) throw error;

            if (posts && posts.length > 0) {
                const content = document.getElementById('mainContent');
                const recentSection = document.createElement('div');
                recentSection.style.marginTop = '3rem';
                recentSection.innerHTML = `
                    <h2 style="font-size: 1.2rem; margin-bottom: 1.5rem; color: var(--primary-brass); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">최근 기록</h2>
                    ${posts.map(post => `
                        <div style="margin-bottom: 1rem;">
                            <a href="post.html?id=${post.id}" style="color: var(--text-primary); text-decoration: none; font-size: 0.95rem;">
                                • ${post.title} <span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: 0.5rem;">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                            </a>
                        </div>
                    `).join('')}
                `;
                content.appendChild(recentSection);
            }
        } catch (error) {
            console.error('❌ Recent posts loading failed:', error);
        }
    }

    async function loadCategories() {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase not initialized');
            return;
        }

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
                .eq('is_private', false); // Only count public posts for visitor

            // Aggregation
            const counts = {};
            if (posts) {
                posts.forEach(p => {
                    counts[p.category_id] = (counts[p.category_id] || 0) + 1;
                });
            }

            // Recursive Count Update for Parents
            // Note: This assumes a 2-level hierarchy (Parent -> Child) or ordered such that children are processed or we can iterate.
            // Since we manipulate 'counts', let's iterate to add child counts to parents.
            // A simple approach for 2-level:
            if (categories) {
                const parentIds = new Set(categories.filter(c => !c.parent_id).map(c => c.id));
                categories.forEach(c => {
                    if (c.parent_id && parentIds.has(c.parent_id)) {
                        counts[c.parent_id] = (counts[c.parent_id] || 0) + (counts[c.id] || 0);
                    }
                });
            }

            renderCategories(categories || [], counts);

            console.log('✅ Categories loaded');

        } catch (error) {
            console.error('❌ Categories loading failed:', error);
        }
    }

    function renderCategories(categories, counts) {
        const nav = document.getElementById('categoryNav');
        if (!nav) return;

        // organize into hierarchy
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

            // Accordion HTML
            return `
                <li class="category-item">
                    <div class="category-header-wrap" onclick="toggleAccordion('${root.id}')">
                        <a href="javascript:void(0);" onclick="filterByCategory('${root.id}', this)" class="category-link ${hasChildren ? 'has-children' : ''}" data-id="${root.id}">
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
                                        <a href="javascript:void(0);" onclick="filterByCategory('${child.id}', this)" class="submenu-link" data-id="${child.id}">
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

        if (submenu) {
            const isHidden = submenu.style.display === 'none';
            submenu.style.display = isHidden ? 'block' : 'none';
            if (indicator) indicator.textContent = isHidden ? '▾' : '▸';
        }
    };

    window.filterByCategory = function (categoryId, element) {
        // Remove active class
        document.querySelectorAll('.category-link, .submenu-link').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');

        loadPostsByCategory(categoryId);
    };

    // ═══════════════════════════════════════════════════
    // 5. POST LOADING BY CATEGORY (Modified for Direct View)
    // ═══════════════════════════════════════════════════
    async function loadPostsByCategory(categoryId) {
        if (!supabaseClient) return;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            const isAdmin = user && user.email === window.ADMIN_EMAIL;

            let query = supabaseClient
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

            if (!content || !title) return;

            if (posts.length === 0) {
                title.textContent = '게시물 없음';
                content.innerHTML = '<p>이 카테고리에는 아직 게시물이 없습니다.</p>';
                return;
            }

            const { data: category } = await supabaseClient
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            // Check if there is exactly ONE post
            if (posts.length === 1) {
                const post = posts[0];
                title.textContent = post.title;

                // Clear previous content
                content.innerHTML = '';

                // Add Meta Info
                const metaDiv = document.querySelector('.post-meta');
                if (metaDiv) {
                    const dateStr = new Date(post.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    const categoryName = category ? category.name : '';
                    metaDiv.innerHTML = `<span>${categoryName}</span> • <span>${dateStr}</span>`;
                }

                // Initialize Toast UI Viewer for the content
                const Viewer = toastui.Editor;
                const viewer = new Viewer({
                    el: content,
                    initialValue: post.content,
                    theme: 'dark' // Assuming dark theme is preferred or matches style
                });

                // Copy protection if needed
                if (!post.origin_free) {
                    content.classList.add('copy-protected');
                    // Re-bind copy protection if not global
                    // Note: Global copy listener in main.js handles generic copy, 
                    // but specific attribution might depend on postId. 
                    // The global listener checks `window.location.search`.
                    // Since we are in SPA mode, the URL might not have ?id=...
                    // We might need to update the global copy handler or pushState.
                    // For now, let's keep it simple.
                }

                return;
            }

            // Multiple posts - Show List
            title.textContent = category.name;
            const metaDiv = document.querySelector('.post-meta');
            if (metaDiv) metaDiv.innerHTML = `<span>총 ${posts.length}개의 게시물</span>`;

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

        } catch (error) {
            console.error('❌ Post loading failed:', error);
        }
    }

    // ═══════════════════════════════════════════════════
    // 6. SEARCH FUNCTIONALITY
    // ═══════════════════════════════════════════════════
    let searchTimeout;

    function initSearch() {
        const searchInput = document.getElementById('searchInput');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);

            searchTimeout = setTimeout(async () => {
                const query = e.target.value.trim();

                if (query.length < 2) return;

                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    const isAdmin = user && user.email === window.ADMIN_EMAIL;

                    let searchQuery = supabaseClient
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
                    console.error('❌ Search failed:', error);
                }
            }, 300);
        });
    }

    function displaySearchResults(results) {
        const content = document.getElementById('mainContent');
        const title = document.getElementById('welcomeTitle');

        if (!content || !title) return;

        title.textContent = '검색 결과';

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
    // 7. NIGHT MODE
    // ═══════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════
    // 7. LONG PRESS FOR ADMIN
    // ═══════════════════════════════════════════════════
    function initAdminLongPress() {
        const copyright = document.getElementById('copyrightText');
        if (!copyright) return;

        let pressTimer;
        const PRESS_DURATION = 3000; // 3 seconds

        const startPress = (e) => {
            // Prevent default only for touch to avoid scrolling issues
            // but we want to allow normal interaction if it's not a long press
            pressTimer = setTimeout(() => {
                window.location.href = 'admin.html';
            }, PRESS_DURATION);
        };

        const cancelPress = () => {
            clearTimeout(pressTimer);
        };

        // Mouse events
        copyright.addEventListener('mousedown', startPress);
        copyright.addEventListener('mouseup', cancelPress);
        copyright.addEventListener('mouseleave', cancelPress);

        // Touch events
        copyright.addEventListener('touchstart', startPress);
        copyright.addEventListener('touchend', cancelPress);
        copyright.addEventListener('touchcancel', cancelPress);

        // Visual feedback (optional but helpful)
        copyright.style.cursor = 'default';
        copyright.style.userSelect = 'none';
        copyright.style.webkitUserSelect = 'none';
    }

    function initNightMode() {
        const modeToggle = document.getElementById('modeToggle');
        if (!modeToggle) return;

        const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';

        if (isNightMode) {
            document.body.classList.add('night-mode');
            modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
        }

        modeToggle.addEventListener('click', () => {
            const nightMode = document.body.classList.toggle('night-mode');
            localStorage.setItem(NIGHT_MODE_KEY, nightMode);

            if (nightMode) {
                modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
            } else {
                modeToggle.innerHTML = '<span>🌙</span><span>Night Library</span>';
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // 8. INITIALIZATION
    // ═══════════════════════════════════════════════════
    function waitForConfig(callback, maxWait = 5000) {
        const startTime = Date.now();
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

    document.addEventListener('DOMContentLoaded', () => {
        console.log('📱 DOM ready');

        // Yes button
        const btnYes = document.getElementById('btnYes');
        if (btnYes) {
            btnYes.addEventListener('click', () => {
                console.log('✅ Yes clicked');
                localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
                hideDisclaimer();

                waitForConfig(() => {
                    initializeSupabase();
                    loadHomeSettings();
                    loadCategories();
                    initSearch();
                });
            });
        }

        // No button
        const btnNo = document.getElementById('btnNo');
        if (btnNo) {
            btnNo.addEventListener('click', () => {
                console.log('❌ No clicked');
                window.location.href = 'https://www.google.com';
            });
        }

        // Check verification
        if (checkAgeVerification()) {
            waitForConfig(() => {
                initializeSupabase();
                loadHomeSettings();
                loadCategories();
                initSearch();
            });
        }

        initNightMode();
        initAdminLongPress();

        console.log('🎉 Initialization complete');
    });

})();
