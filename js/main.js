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
    // 1.5 UTILITIES
    // ═══════════════════════════════════════════════════
    function waitForConfig(callback) {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            callback();
            return;
        }
        const startTime = Date.now();
        const maxWait = 5000;
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
    // 2. SUPABASE INITIALIZATION
    // ═══════════════════════════════════════════════════
    function initializeSupabase() {
        try {
            // Check if global client already exists
            if (window.supabaseClient) {
                supabaseClient = window.supabaseClient;
                console.log('✅ Supabase reused from global instance');
                return true;
            }

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

            // Expose globally to prevent duplicate GoTrue instances
            window.supabaseClient = supabaseClient;
            window.supabaseClientInitialized = true;

            console.log('✅ Supabase initialized and set to window.supabaseClient');
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
                console.log('✅ Site Title Updated:', settings.site_title);
            }
            if (settings.site_description) {
                const descTag = document.getElementById('siteDescTag');
                if (descTag) descTag.content = settings.site_description;
                console.log('✅ Site Description Updated');
            }
            if (settings.google_site_verification) {
                const gTag = document.querySelector('meta[name="google-site-verification"]');
                if (gTag) {
                    gTag.content = settings.google_site_verification;
                    console.log('✅ Google Verification Tag Updated:', settings.google_site_verification);
                } else {
                    console.warn('⚠️ Google Meta Tag not found in HTML');
                }
            }
            if (settings.naver_verification) {
                const nTag = document.querySelector('meta[name="naver-site-verification"]');
                if (nTag) {
                    nTag.content = settings.naver_verification;
                    console.log('✅ Naver Verification Tag Updated:', settings.naver_verification);
                } else {
                    console.warn('⚠️ Naver Meta Tag not found in HTML');
                }
            }

            const title = document.getElementById('welcomeTitle');
            const subtitle = document.querySelector('.post-meta span');
            const content = document.getElementById('mainContent');

            // Restore the page-header if it was hidden by the gallery
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) pageHeader.style.display = 'block';

            if (title && settings.home_title) {
                title.textContent = settings.home_title;
                title.dataset.adminEditable = 'text';
                title.dataset.adminId = 'setting:home_title';
                title.dataset.adminField = 'value';
            }
            if (subtitle && settings.home_subtitle) {
                subtitle.textContent = settings.home_subtitle;
                subtitle.dataset.adminEditable = 'text';
                subtitle.dataset.adminId = 'setting:home_subtitle';
                subtitle.dataset.adminField = 'value';
            }
            if (content && settings.home_content) {
                content.dataset.adminEditable = 'content';
                content.dataset.adminId = 'setting:home_content';
                content.dataset.adminField = 'value';
                // Initialize Toast UI Viewer
                const Viewer = toastui.Editor;
                content.innerHTML = '';
                const viewer = Viewer.factory({
                    el: content,
                    viewer: true,
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
                .select('id, title, created_at, category_id')
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
                recentSection.className = 'recent-records-section';
                recentSection.style.marginTop = '4rem';

                // Fetch category names for the posts
                const categoryIds = [...new Set(posts.map(p => p.category_id))];
                const { data: categories } = await supabaseClient
                    .from('categories')
                    .select('id, name')
                    .in('id', categoryIds);

                const catMap = {};
                if (categories) categories.forEach(c => catMap[c.id] = c.name);

                recentSection.innerHTML = `
                    <h2 class="archive-section-title" style="font-size: 1.1rem; margin-bottom: 2rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.2em; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.8rem; font-family: var(--font-mono);">Recent Records</h2>
                    <ul class="archive-list" style="list-style: none; padding: 0;">
                        ${posts.map(post => `
                            <li style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 4px;">
                                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                                    <a href="post.html?id=${post.id}" style="color: var(--text-primary); text-decoration: none; font-size: 1.1rem; font-family: var(--font-serif); font-weight: 500;">
                                        ${post.title}
                                    </a>
                                    <span style="color: var(--text-dim); font-size: 0.8rem; font-family: var(--font-mono);">${new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div style="font-size: 0.75rem; color: var(--primary-yellow); font-family: var(--font-mono); text-transform: uppercase; opacity: 0.8;">
                                    [ ${catMap[post.category_id] || 'General'} ]
                                </div>
                            </li>
                        `).join('')}
                    </ul>
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

            // '성향 백과' 카테고리 자동 생성 (없을 경우 관리자로 로그인 시)
            const hasWiki = (categories || []).some(c => c.name === '성향 백과' && !c.parent_id);
            if (!hasWiki) {
                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user && user.email === window.ADMIN_EMAIL) {
                        const maxOrder = (categories || [])
                            .filter(c => !c.parent_id)
                            .reduce((max, c) => Math.max(max, c.display_order || 0), 0);
                        const { data: newCat } = await supabaseClient
                            .from('categories')
                            .insert({ name: '성향 백과', parent_id: null, display_order: maxOrder + 1, is_visible: true })
                            .select()
                            .single();
                        if (newCat) categories.push(newCat);
                        console.log('✅ 성향 백과 카테고리 자동 생성됨');
                    }
                } catch (e) {
                    console.warn('성향 백과 카테고리 생성 스킵:', e.message);
                }
            }

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

            const chevronSvg = `
                <svg class="chevron" viewBox="0 0 24 24">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            `;

            return `
                <li class="category-item">
                    <div class="category-header-wrap">
                        <a href="javascript:void(0);" 
                           onclick="${hasChildren ? `toggleAccordion('${root.id}')` : `filterByCategory('${root.id}', this)`}" 
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
                                        <a href="javascript:void(0);" onclick="filterByCategory('${child.id}', this)" class="submenu-link" data-id="${child.id}">
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

    window.loadCategories = loadCategories;

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
            // Check category name first
            const { data: category } = await supabaseClient
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            // 성향 백과 카테고리 클릭 시 갤러리 표시
            if (category && category.name === '성향 백과') {
                renderTendencyView();
                return;
            }

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

            // Restore the page-header if it was hidden by the gallery
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) pageHeader.style.display = 'block';

            if (!content || !title) return;

            if (posts.length === 0) {
                title.textContent = '게시물 없음';
                content.innerHTML = '<p>이 카테고리에는 아직 게시물이 없습니다.</p>';
                return;
            }

            const { data: postCategoryData } = await supabaseClient
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
                    const categoryName = postCategoryData ? postCategoryData.name : '';
                    metaDiv.innerHTML = `<span>${categoryName}</span> • <span>${dateStr}</span>`;
                }

                // Initialize Toast UI Viewer for the content
                const Viewer = toastui.Editor;
                const viewer = Viewer.factory({
                    el: content,
                    viewer: true,
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
                <div class="admin-post-item" style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border); position: relative;">
                    <h3>
                        <a href="post.html?id=${post.id}" style="color: var(--primary-yellow); text-decoration: none;" data-admin-editable="text" data-admin-id="${post.id}" data-admin-field="title">
                            ${post.title}
                            ${post.is_private ? '<span style="font-size: 0.8em; color: var(--accent-amber);"> 🔒</span>' : ''}
                        </a>
                    </h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        ${isAdmin ? `
                            <div class="admin-post-actions">
                                <button class="admin-action-btn delete" onclick="event.preventDefault(); deletePostInline('${post.id}', '${post.title.replace(/'/g, "\\'")}')" title="Delete">🗑️</button>
                                <button class="admin-action-btn edit" onclick="event.preventDefault(); window.location.href='admin.html?edit=${post.id}'" title="Full Edit">⚙️</button>
                            </div>
                        ` : ''}
                    </div>
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

        // Inject focus overlay if not exists
        if (!document.querySelector('.search-focus-overlay')) {
            const overlay = document.createElement('div');
            overlay.className = 'search-focus-overlay';
            document.body.appendChild(overlay);
        }

        searchInput.addEventListener('focus', () => {
            document.body.classList.add('search-focused');
        });

        searchInput.addEventListener('blur', () => {
            // Slight delay to allow clicking on search results without immediately dismissing
            setTimeout(() => {
                document.body.classList.remove('search-focused');
            }, 200);
        });

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
            content.innerHTML = '<div class="py-12 text-center text-slate-400 italic">검색 결과가 없습니다.</div>';
            return;
        }

        content.innerHTML = results.map((post, index) => `
            <div class="animate-slide-up bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 mb-4 hover:border-brand-primary/30 transition-colors" style="animation-delay: ${index * 0.05}s">
                <h3 class="text-xl font-bold font-serif mb-2">
                    <a href="post.html?id=${post.id}" class="text-slate-900 dark:text-slate-100 hover:text-brand-primary transition-colors">
                        ${post.title}
                    </a>
                </h3>
                <div class="flex items-center gap-3 text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    <span>${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                    <span class="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full"></span>
                    <span class="text-brand-primary/70">ARCHIVE RECORD</span>
                </div>
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

    // ═══════════════════════════════════════════════════
    // TENDENCY VIEW INTEGRATION - KINK DICTIONARY
    // ═══════════════════════════════════════════════════
    window.tendencyActiveTab = 'Top';

    async function renderTendencyView() {
        window.renderTendencyView = renderTendencyView;
        if (!supabaseClient) return;

        const mainContent = document.getElementById('mainContent');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const metaDiv = document.querySelector('.post-meta');

        if (!mainContent) return;

        if (welcomeTitle) welcomeTitle.style.display = 'none';
        if (metaDiv) metaDiv.style.display = 'none';

        mainContent.innerHTML = `<div class="loading-container"><div class="loading"></div></div>`;

        try {
            // Find "성향 백과" category ID dynamically
            const { data: categoryData, error: catError } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('name', '성향 백과')
                .single();

            if (catError) throw new Error('성향 백과 카테고리를 찾을 수 없습니다.');
            const kinkDictCategoryId = categoryData.id;

            // Fetch archive_posts under this category
            const { data: posts, error } = await supabaseClient
                .from('archive_posts')
                .select('id, title, content, created_at')
                .eq('category_id', kinkDictCategoryId)
                .order('created_at', { ascending: true }); // Using created_at or title for ordering

            // Fetch kink dictionary settings
            const { data: kinkSettings } = await supabaseClient.from('settings').select('*').in('key', ['kink_dictionary_pairs', 'kink_role_overrides', 'kink_display_order']);

            const pairData = (kinkSettings || []).find(s => s.key === 'kink_dictionary_pairs');
            const kinkPairs = pairData && pairData.value ? JSON.parse(pairData.value) : {};
            window.kinkDictionaryPairs = kinkPairs;

            const overrideData = (kinkSettings || []).find(s => s.key === 'kink_role_overrides');
            const kinkRoleOverrides = overrideData && overrideData.value ? JSON.parse(overrideData.value) : {};

            const orderData = (kinkSettings || []).find(s => s.key === 'kink_display_order');
            const kinkDisplayOrder = orderData && orderData.value ? JSON.parse(orderData.value) : [];

            // Process posts and convert them to "tendencies" format
            let tendenciesData = (posts || []).map(post => {
                // Determine type: prioritze manual override, then tag, then keyword
                let type = kinkRoleOverrides[post.id];
                if (type) type = type.toLowerCase();
                let rawTitle = post.title;

                if (!type) {
                    const tagMatch = rawTitle.match(/^\[(top|bottom|relation)\]\s*/i);
                    if (tagMatch) {
                        type = tagMatch[1].toLowerCase();
                        rawTitle = rawTitle.slice(tagMatch[0].length).trim();
                        // If it's relation, treat it as top for list categorization
                        if (type === 'relation') type = 'top';
                    } else {
                        const bottomKeywords = /매조|섭|슬레이브|프레이|마조히스트|서브미시브|바텀|bottom|submissive|브랫|brat|펫|pet|리틀|little|디그레이디|degradee/i;
                        if (bottomKeywords.test(rawTitle)) type = 'bottom';
                        else type = 'top';
                    }
                } else {
                    // If override exists, still clean title of tags for display
                    const tagMatch = rawTitle.match(/^\[(top|bottom|relation)\]\s*/i);
                    if (tagMatch) rawTitle = rawTitle.slice(tagMatch[0].length).trim();
                }

                // 3) Try to extract English sub name from parenthesis e.g. "마스터 (Master)"
                const titleMatch = rawTitle.match(/(.*?)\s*\((.*?)\)$/);
                let name = rawTitle;
                let sub_name = '';
                if (titleMatch) {
                    name = titleMatch[1].trim();
                    sub_name = titleMatch[2].trim();
                }

                // 4) Extract <!--pair: name--> tag from content for Relation tab
                let pairTarget = null;
                const pairMatch = (post.content || '').match(/<!--\s*pair:\s*(.+?)\s*-->/i);
                if (pairMatch) pairTarget = pairMatch[1].trim();

                // 5) Strip <!--pair:...--> and metadata from content before storing
                // const cleanContent = (post.content || '').replace(/<!--.*?-->/gs, '').trim(); // No longer needed as description uses full content

                return {
                    id: post.id,
                    name: name,
                    subName: sub_name,
                    description: post.content,
                    icon: null,
                    type: type,
                    pair: pairTarget
                };
            });

            // Apply custom display order if it exists
            if (kinkDisplayOrder && kinkDisplayOrder.length > 0) {
                const orderMap = {};
                kinkDisplayOrder.forEach((id, idx) => orderMap[id] = idx);

                tendenciesData.sort((a, b) => {
                    const orderA = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;
                    const orderB = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;
                    return orderA - orderB;
                });
            }

            window.tendencyData = tendenciesData;

            // Hide the legacy page-header to avoid duplicate titles
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) pageHeader.style.display = 'none';

            renderKinkDictionaryUI();

        } catch (error) {
            console.error('Gallery load failed:', error);
            mainContent.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">데이터 로딩 실패: ${error.message}</p>`;
        }
    }

    window.renderKinkDictionaryUI = function () {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const tendenciesData = window.tendencyData || [];
        const doms = tendenciesData.filter(t => t.type === 'top');
        const subs = tendenciesData.filter(t => t.type === 'bottom');

        const activeTab = window.tendencyActiveTab || 'Top';

        // Show empty state if no posts yet
        if (tendenciesData.length === 0) {
            mainContent.innerHTML = `
                <div class="kink-dict-wrapper">
                    <div class="kink-dict-header">
                        <h1 class="kink-dict-title">성향 백과</h1>
                        <p class="kink-dict-subtitle">아직 등록된 성향이 없습니다.</p>
                    </div>
                    <div style="text-align:center; padding: 3rem 1rem; color: var(--text-secondary);">
                        <p>관리자 페이지에서 게시글을 작성하고 <strong>성향 백과</strong> 카테고리를 선택하면 여기에 표시됩니다.</p>
                        <p style="margin-top:1rem; font-size:0.85rem; opacity:0.7;">제목 앞에 <code>[top]</code> 또는 <code>[bottom]</code>을 붙이면 자동 분류됩니다.<br>예: <code>[top] 마스터 (Master)</code></p>
                    </div>
                </div>
            `;
            return;
        }

        let contentHtml = '';

        if (activeTab === 'Relation') {
            console.log(`[KinkDict] Rendering Relation tab.`);
            // Build pairs: for each top, find its pair from kinkPairs setting, else fallback to name match, else fallback to index
            const buildPairs = () => {
                const tops = tendenciesData.filter(t => t.type === 'top');
                const bottoms = tendenciesData.filter(t => t.type === 'bottom');
                const pairs = [];
                const usedBottomIds = new Set();
                const kinkPairs = window.kinkDictionaryPairs || {};

                tops.forEach((top, idx) => {
                    let matched = null;

                    // 1) Use admin-defined pair if available
                    if (kinkPairs[top.id]) {
                        matched = bottoms.find(b => b.id === kinkPairs[top.id]);
                    }

                    // 2) Fallback: pair tag
                    if (!matched && top.pair) {
                        matched = bottoms.find(b =>
                            b.name.toLowerCase().includes(top.pair.toLowerCase()) ||
                            top.pair.toLowerCase().includes(b.name.toLowerCase())
                        );
                    }

                    // 3) Fallback: pair by index
                    if (!matched) {
                        matched = bottoms.filter(b => !usedBottomIds.has(b.id))[0] || null;
                    }

                    if (matched) usedBottomIds.add(matched.id);
                    pairs.push({ top, bottom: matched });
                });
                return pairs;
            };

            const pairs = buildPairs();
            contentHtml = `
                <div class="kink-relation-container">
                    <div class="kink-relation-info">
                        <p>관리자 페이지 설정 또는 Top 게시글 태그(<code>&lt;!--pair: 이름--&gt;</code>)에 따라 매칭됩니다.</p>
                    </div>
                    <div class="kink-relation-list">
            `;
            pairs.forEach(({ top, bottom }) => {
                const bottomName = bottom ? bottom.name : '?';
                contentHtml += `
                    <div class="kink-relation-item">
                        <div class="kink-relation-card top" onclick="showRoleDetail('${top.id}')" style="cursor:pointer">
                            <div class="relation-badge top-badge">TOP</div>
                            <div class="relation-name">${top.name}</div>
                        </div>
                        <div class="relation-icon"><i data-lucide="zap"></i></div>
                        <div class="kink-relation-card bottom" ${bottom ? `onclick="showRoleDetail('${bottom.id}')" style="cursor:pointer"` : ''} >
                            <div class="relation-badge bottom-badge">BOTTOM</div>
                            <div class="relation-name">${bottomName}</div>
                        </div>
                    </div>
                `;
            });
            contentHtml += `</div></div>`;
        } else {
            const listData = (activeTab === 'Top' ? doms : subs) || [];
            console.log(`[KinkDict] Rendering ${activeTab} tab. items count: ${listData.length}`);

            contentHtml = `<div class="kink-list-container">`;
            listData.forEach((item, idx) => {
                try {
                    // Create a brief summary of the markdown content for the list view
                    // IMPORTANT: Strip HTML comments FIRST (<!--...-->) before stripping tags,
                    // otherwise <!--pair:name--> loses its '>' and becomes an unclosed comment in innerHTML
                    const plainText = (item.description || '')
                        .replace(/<!--[\s\S]*?-->/g, '')   // 1) Remove HTML comments (e.g. <!--pair:...-->)
                        .replace(/<[^>]*>/g, '')            // 2) Remove all remaining HTML tags
                        .replace(/[#*_~`]/g, '')            // 3) Remove markdown syntax chars
                        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // 4) Convert markdown links to text
                        .trim();
                    const brief = plainText.length > 60 ? plainText.substring(0, 60) + '...' : plainText;

                    console.log(`[KinkDict]  - Rendering item ${idx + 1}/${listData.length}: ${item.name} (${item.id})`);

                    contentHtml += `
                        <div class="kink-list-item" onclick="showRoleDetail('${item.id}')">
                            <div class="kink-item-content">
                                <div class="kink-item-header">
                                    <h3 class="kink-item-name">${item.name}</h3>
                                    ${item.subName ? `<span class="kink-item-subname"><i data-lucide="tag"></i>${item.subName}</span>` : ''}
                                </div>
                                <p class="kink-item-desc">${brief}</p>
                            </div>
                            <div class="kink-item-arrow">
                                <i data-lucide="chevron-right"></i>
                            </div>
                        </div>
                    `;
                } catch (e) {
                    console.error(`[KinkDict] ❌ Error rendering item ${idx + 1}:`, item, e);
                }
            });
            contentHtml += `</div>`;
        }


        mainContent.innerHTML = `
            <div class="kink-dict-wrapper">
                <div class="kink-dict-header">
                    <h1 class="kink-dict-title">성향 백과</h1>
                    <p class="kink-dict-subtitle">총 ${tendenciesData.length}개의 기록이 존재합니다.</p>
                </div>

                <div class="kink-tabs-container">
                    <div class="kink-tabs">
                        <button class="kink-tab ${activeTab === 'Top' ? 'active' : ''}" onclick="switchTendencyTab('Top')">
                            <div class="kink-tab-icon"><i data-lucide="arrow-up"></i></div>
                            <span class="kink-tab-name">TOP</span>
                            <span class="kink-tab-count">${doms.length}</span>
                        </button>
                        <button class="kink-tab ${activeTab === 'Bottom' ? 'active' : ''}" onclick="switchTendencyTab('Bottom')">
                            <div class="kink-tab-icon" style="transform: rotate(180deg)"><i data-lucide="arrow-up"></i></div>
                            <span class="kink-tab-name">BOTTOM</span>
                            <span class="kink-tab-count">${subs.length}</span>
                        </button>
                        <button class="kink-tab ${activeTab === 'Relation' ? 'active' : ''}" onclick="switchTendencyTab('Relation')">
                            <div class="kink-tab-icon"><i data-lucide="users"></i></div>
                            <span class="kink-tab-name">RELATION</span>
                            <span class="kink-tab-count">${Object.keys(window.kinkDictionaryPairs || {}).length}</span>
                        </button>
                    </div>
                </div>

                <div class="kink-dict-content">
                    ${contentHtml}
                </div>

                <!-- Single Detail Modal (Backdrop Blur) -->
                <div class="role-detail-overlay" id="roleDetailOverlay" onclick="closeRoleDetail()">
                    <div class="role-detail-modal" id="roleDetailModal" onclick="event.stopPropagation()">
                        <div class="modal-accent-bar" id="modalAccentBar"></div>
                        <button class="modal-close-btn" onclick="closeRoleDetail()">✕</button>
                        <div class="modal-content">
                            <div class="modal-header">
                                <div class="modal-icon-wrapper" id="modalIconWrapper">
                                    <!-- Icon injected here -->
                                </div>
                                <div>
                                    <h3 class="modal-title" id="modalTitle">Role Name</h3>
                                    <div class="modal-subname-wrapper" id="modalSubNameWrapper">
                                        <div class="modal-subname">
                                            <i data-lucide="tag" class="subname-icon"></i>
                                            <span id="modalSubNameText">SUBNAME</span>
                                        </div>
                                    </div>
                                </div>
                                <!-- Permanent Edit/Save Buttons -->
                                <button id="kinkModalEditBtn" class="kink-admin-btn edit-btn">
                                    <i data-lucide="edit-3"></i><span>내용 수정</span>
                                </button>
                                <button id="kinkModalSaveBtn" class="kink-admin-btn save-btn">
                                    <i data-lucide="save"></i><span>저장</span>
                                </button>
                            </div>
                            <div class="modal-body">
                                <div class="description-container">
                                    <div class="role-description" id="roleDescription"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex justify-center py-20">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    window.switchTendencyTab = function (tabId) {
        window.tendencyActiveTab = tabId;
        window.renderKinkDictionaryUI();
    };

    window.showRoleDetail = function (id) {
        const item = window.tendencyData.find(t => t.id === id);
        if (!item) return;

        window.currentDetailId = id;

        const overlay = document.getElementById('roleDetailOverlay');
        const accentBar = document.getElementById('modalAccentBar');
        const iconWrapper = document.getElementById('modalIconWrapper');
        const title = document.getElementById('modalTitle');
        const subName = document.getElementById('modalSubName');
        const description = document.getElementById('roleDescription');

        const isTop = item.type === 'top';
        const themeColor = isTop ? '#ff4d4d' : '#4da6ff';

        accentBar.style.backgroundColor = themeColor;
        iconWrapper.style.color = themeColor;
        iconWrapper.innerHTML = `<i data-lucide="${(item.icon_class || 'crown').toLowerCase()}" style="width: 48px; height: 48px;"></i>`;

        const subNameWrapper = document.getElementById('modalSubNameWrapper');
        const subNameText = document.getElementById('modalSubNameText');
        const subNameValue = item.subName || item.sub_name || '';

        title.textContent = item.name;

        if (subNameValue) {
            subNameText.textContent = subNameValue;
            subNameWrapper.style.display = 'flex';
        } else {
            subNameWrapper.style.display = 'none';
        }

        // Show the modal FIRST so dimensions are correct
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (description) {
            description.innerHTML = '';

            if (window._kinkViewer) {
                try { window._kinkViewer.destroy(); } catch (e) { }
                window._kinkViewer = null;
            }

            let content = item.description || '';

            if (typeof toastui !== 'undefined' && toastui.Editor) {
                window._kinkViewer = toastui.Editor.factory({
                    el: description,
                    viewer: true,
                    initialValue: content,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                });
            } else {
                description.innerHTML = `<div class="plain-text-body">${content.replace(/\n/g, '<br>')}</div>`;
            }
        }

        if (window.lucide) window.lucide.createIcons();

        // ─── Edit Mode: 편집 버튼 및 클릭 편집 기능 ───
        const isEditMode = (typeof window.isAdminEditMode === 'function' && window.isAdminEditMode()) ||
            document.body.classList.contains('admin-edit-active');

        const editBtn = document.getElementById('kinkModalEditBtn');
        const saveBtn = document.getElementById('kinkModalSaveBtn');

        if (isEditMode && editBtn && saveBtn) {
            editBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            description.classList.add('is-editable');
            description.title = '클릭하여 내용을 수정하시겠습니까?';

            editBtn.onclick = (e) => {
                e.preventDefault();
                _openKinkEditor(item, description, editBtn, saveBtn);
            };

            saveBtn.onclick = (e) => {
                e.preventDefault();
                _saveKinkContent(item, description, editBtn, saveBtn);
            };

            description._kinkEditHandler = (e) => {
                if (editBtn.style.display !== 'none') {
                    _openKinkEditor(item, description, editBtn, saveBtn);
                }
            };
            description.addEventListener('click', description._kinkEditHandler);
        } else if (editBtn && saveBtn) {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            description.classList.remove('is-editable');
            description.title = '';
        }
    };


    // 인라인 에디터 열기 (마크다운 대신 단순 textarea 사용)
    function _openKinkEditor(item, descriptionEl, editBtn, saveBtn) {
        editBtn.style.display = 'none';
        saveBtn.style.display = 'flex';

        const originalContent = item.description || '';
        descriptionEl.innerHTML = '';
        descriptionEl.classList.remove('is-editable');

        const textarea = document.createElement('textarea');
        textarea.id = 'kinkModalTextarea';
        textarea.className = 'kink-edit-textarea';
        textarea.value = originalContent;
        textarea.placeholder = '내용을 입력하세요...';

        descriptionEl.appendChild(textarea);
        textarea.focus();

        // 텍스트 영역 높이 자동 조절
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight + 20) + 'px';
        textarea.oninput = () => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight + 20) + 'px';
        };
    }

    // 변경사항 저장
    async function _saveKinkContent(item, descriptionEl, editBtn, saveBtn) {
        const textarea = document.getElementById('kinkModalTextarea');
        if (!textarea) return;

        const newContent = textarea.value;

        try {
            if (typeof window.showToast === 'function') window.showToast('저장 중...', 'loading');

            const { error } = await window.supabaseClient
                .from('archive_posts')
                .update({ content: newContent, updated_at: new Date().toISOString() })
                .eq('id', item.id);

            if (error) throw error;

            if (typeof window.showToast === 'function') window.showToast('변경사항이 저장되었습니다.', 'success');

            item.description = newContent;
            const dataItem = (window.tendencyData || []).find(t => t.id === item.id);
            if (dataItem) dataItem.description = newContent;

            editBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            descriptionEl.classList.add('is-editable');

            // 뷰어 복구 (Toast UI 방식)
            descriptionEl.innerHTML = '';
            if (typeof toastui !== 'undefined' && toastui.Editor) {
                if (window._kinkViewer) {
                    try { window._kinkViewer.destroy(); } catch (e) { }
                }
                window._kinkViewer = toastui.Editor.factory({
                    el: descriptionEl,
                    viewer: true,
                    initialValue: newContent,
                    theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
                });
            } else {
                descriptionEl.innerHTML = `<div class="plain-text-body">${newContent.replace(/\n/g, '<br>')}</div>`;
            }

        } catch (e) {
            console.error('Save failed:', e);
            if (typeof window.showToast === 'function') window.showToast('저장 실패: ' + e.message, 'error');
        }
    }

    window.closeRoleDetail = function () {
        const overlay = document.getElementById('roleDetailOverlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';

        // 편집기 정리 (textarea는 remove되면 끝)
        window._kinkInlineEditor = null;

        // 버튼 상태 초기화 (수정 버튼 노출, 저장 버튼 숨김)
        const editBtn = document.getElementById('kinkModalEditBtn');
        const saveBtn = document.getElementById('kinkModalSaveBtn');
        if (editBtn) editBtn.style.display = '';
        if (saveBtn) saveBtn.style.display = 'none';

        const desc = document.getElementById('roleDescription');
        if (desc) {
            if (desc._kinkEditHandler) {
                desc.removeEventListener('click', desc._kinkEditHandler);
                desc._kinkEditHandler = null;
            }
            desc.classList.remove('is-editable');
            desc.style.cssText = '';
            desc.title = '';
        }
    };

    // Edit Mode가 토글될 때 admin-inline.js가 호출하는 전역 함수
    // 모달이 현재 열려 있으면 편집 UI를 즉시 주입 / 제거
    window.activateKinkModalEditMode = function (enabled) {
        const overlay = document.getElementById('roleDetailOverlay');
        const desc = document.getElementById('roleDescription');
        const editBtn = document.getElementById('kinkModalEditBtn');
        const saveBtn = document.getElementById('kinkModalSaveBtn');

        if (!overlay || !overlay.classList.contains('active') || !desc || !editBtn || !saveBtn) return;

        if (enabled) {
            const currentId = window.currentDetailId;
            if (!currentId) return;
            const item = (window.tendencyData || []).find(t => t.id === currentId);
            if (!item) return;

            editBtn.style.display = 'flex';
            saveBtn.style.display = 'none';
            desc.classList.add('is-editable');
            desc.title = '클릭하여 내용을 수정하시겠습니까?';

            editBtn.onclick = (e) => {
                e.preventDefault();
                _openKinkEditor(item, desc, editBtn, saveBtn);
            };

            saveBtn.onclick = (e) => {
                e.preventDefault();
                _saveKinkContent(item, desc, editBtn, saveBtn);
            };

            if (!desc._kinkEditHandler) {
                desc._kinkEditHandler = (e) => {
                    if (editBtn.style.display !== 'none') {
                        _openKinkEditor(item, desc, editBtn, saveBtn);
                    }
                };
                desc.addEventListener('click', desc._kinkEditHandler);
            }
        } else {
            editBtn.style.display = 'none';
            saveBtn.style.display = 'none';
            if (desc._kinkEditHandler) {
                desc.removeEventListener('click', desc._kinkEditHandler);
                desc._kinkEditHandler = null;
            }
            desc.classList.remove('is-editable');
            desc.style.cssText = '';
            desc.title = '';
        }
    };

    function initNightMode() {
        const headerToggle = document.getElementById('headerModeToggle');
        if (!headerToggle) return;

        const updateUI = (isDark) => {
            if (isDark) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        headerToggle.addEventListener('click', () => {
            const isDark = document.documentElement.classList.toggle('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
        });
    }

    function initHeaderScroll() {
        const header = document.getElementById('mainHeader');
        const progressBar = document.getElementById('readingProgress');
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

            // Header Scroll Logic (hide on scroll down, show on scroll up)
            if (Math.abs(currentScrollY - lastScrollY) < 10) return;

            if (currentScrollY > lastScrollY && currentScrollY > 64) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggleBtn');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!menuToggle || !sidebar || !overlay) return;

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
            // Small timeout to allow transition
            setTimeout(() => {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.add('opacity-100');
            }, 10);
            document.body.style.overflow = 'hidden';
        };

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (sidebar.classList.contains('-translate-x-full')) {
                openMenu();
            } else {
                closeMenu();
            }
        });

        overlay.addEventListener('click', closeMenu);

        // Close on category click
        const categoryNav = document.getElementById('categoryNav');
        if (categoryNav) {
            categoryNav.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && !link.classList.contains('has-children')) {
                    setTimeout(closeMenu, 150);
                }
            });
        }
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

        const welcomeSection = document.getElementById('welcomeSection');
        const mainContent = document.getElementById('mainContent');
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
                if (welcomeSection) welcomeSection.classList.add('hidden');
                if (mainContent) mainContent.classList.add('hidden');
                if (settingsView) settingsView.classList.remove('hidden');
                if (navSettings) navSettings.classList.add('text-brand-primary');
            } else if (view === 'home') {
                if (welcomeSection) welcomeSection.classList.remove('hidden');
                if (mainContent) mainContent.classList.remove('hidden');
                if (settingsView) settingsView.classList.add('hidden');
                if (navHome) navHome.classList.add('text-brand-primary');

                // If we were in Wiki view (gallery), we might need to reload or reset mainContent
                // But for now, let's just make sure it's visible.
            }
            window.scrollTo(0, 0);
        };

        navHome.addEventListener('click', (e) => {
            if (window.location.pathname.includes('post.html')) return;
            e.preventDefault();
            showView('home');
        });

        navSettings.addEventListener('click', (e) => {
            e.preventDefault();
            showView('settings');
        });

        if (navWiki) {
            navWiki.addEventListener('click', (e) => {
                e.preventDefault();
                resetActive();
                navWiki.classList.add('text-brand-primary');
                renderTendencyView();
                if (welcomeSection) welcomeSection.classList.add('hidden');
                if (mainContent) mainContent.classList.remove('hidden');
                if (settingsView) settingsView.classList.add('hidden');
                window.scrollTo(0, 0);
            });
        }

        if (navSearch) {
            navSearch.addEventListener('click', (e) => {
                e.preventDefault();
                resetActive();
                navSearch.classList.add('text-brand-primary');

                // Toggle Sidebar to show search
                const menuToggle = document.getElementById('menuToggleBtn');
                if (menuToggle) menuToggle.click();
            });
        }
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

        // Age Verification Buttons
        const btnYes = document.getElementById('btnYes');
        const btnNo = document.getElementById('btnNo');

        if (btnYes) {
            btnYes.addEventListener('click', () => {
                console.log('✅ Yes clicked');
                localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
                hideDisclaimer();
                initApp();
            });
        }

        if (btnNo) {
            btnNo.addEventListener('click', () => {
                console.log('❌ No clicked');
                window.location.href = 'https://www.google.com';
            });
        }

        // Shared initialization function
        function initApp() {
            waitForConfig(() => {
                if (initializeSupabase()) {
                    loadHomeSettings();
                    loadCategories();
                    initSearch();
                }
            });
        }

        // Start app if already verified
        if (checkAgeVerification()) {
            initApp();
        }

        // Initialize UI Modules
        initNightMode();
        initAdminLongPress();
        initMobileMenu();
        initHeaderScroll();
        initEmergencySystem();
        initBottomNav();

        // Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
            console.log('✨ Lucide icons created');
        }

        console.log('🎉 Initialization complete');
    });

})();
