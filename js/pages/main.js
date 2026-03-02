// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════
    // 1. GLOBALS
    // ═══════════════════════════════════════════════════
    // ═══════════════════════════════════════════════════
    // 1. HELPERS
    // ═══════════════════════════════════════════════════
    function hideDisclaimer() {
        const overlay = document.getElementById('disclaimerOverlay');
        const container = document.getElementById('appContainer');
        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('content-blur');
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
            // Fetch Categories (all, to check for existing ones before auto-creation)
            const { data: allCategories, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            let categories = allCategories || [];

            // '성향 백과' 카테고리 자동 생성 (없을 경우 관리자로 로그인 시)
            const hasWiki = categories.some(c => c.name === '성향 백과' && !c.parent_id);
            if (!hasWiki) {
                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user && user.email === window.ADMIN_EMAIL) {
                        const maxOrder = categories
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

            // 'BDSM 궁합표' 카테고리 자동 생성
            const hasBdsm = categories.some(c => c.name === 'BDSM 궁합표' && !c.parent_id);
            if (!hasBdsm) {
                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user && user.email === window.ADMIN_EMAIL) {
                        const maxOrder = categories
                            .filter(c => !c.parent_id)
                            .reduce((max, c) => Math.max(max, c.display_order || 0), 0);
                        const { data: newCat } = await supabaseClient
                            .from('categories')
                            .insert({ name: 'BDSM 궁합표', parent_id: null, display_order: maxOrder + 1, is_visible: true })
                            .select()
                            .single();
                        if (newCat) categories.push(newCat);
                        console.log('✅ BDSM 궁합표 카테고리 자동 생성됨');
                    }
                } catch (e) {
                    console.warn('BDSM 궁합표 카테고리 생성 스킵:', e.message);
                }
            }

            // '검증테스트' 카테고리 자동 생성
            const hasVerification = categories.some(c => c.name === '검증테스트' && !c.parent_id);
            if (!hasVerification) {
                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user && user.email === window.ADMIN_EMAIL) {
                        const maxOrder = categories
                            .filter(c => !c.parent_id)
                            .reduce((max, c) => Math.max(max, c.display_order || 0), 0);
                        const { data: newCat } = await supabaseClient
                            .from('categories')
                            .insert({ name: '검증테스트', parent_id: null, display_order: maxOrder + 1, is_visible: true })
                            .select()
                            .single();
                        if (newCat) categories.push(newCat);
                        console.log('✅ 검증테스트 카테고리 자동 생성됨');
                    }
                } catch (e) {
                    console.warn('검증테스트 카테고리 생성 스킵:', e.message);
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
            const parentIds = new Set(categories.filter(c => !c.parent_id).map(c => c.id));
            categories.forEach(c => {
                if (c.parent_id && parentIds.has(c.parent_id)) {
                    counts[c.parent_id] = (counts[c.parent_id] || 0) + (counts[c.id] || 0);
                }
            });

            // CRITICAL: Filter for display (only visible ones)
            const visibleCategories = categories.filter(c => c.is_visible);
            renderCategories(visibleCategories, counts);

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
                        <a href="${root.name === 'BDSM 궁합표' ? 'bdsm-chart.html' : 'javascript:void(0);'}" 
                           ${root.name === 'BDSM 궁합표' ? '' : `onclick="${hasChildren ? `toggleAccordion('${root.id}')` : `filterByCategory('${root.id}', this)`}"`}
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
                                        <a href="${child.name === 'BDSM 궁합표' ? 'bdsm-chart.html' : 'javascript:void(0);'}" 
                                           ${child.name === 'BDSM 궁합표' ? '' : `onclick="filterByCategory('${child.id}', this)"`}
                                           class="submenu-link" data-id="${child.id}">
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
        // Check if we are on the main page (index.html)
        const isMainPage = window.location.pathname.endsWith('index.html') ||
            window.location.pathname === '/' ||
            window.location.pathname.endsWith('/');

        if (!isMainPage) {
            // Redirect to index.html with category parameter
            window.location.href = `index.html?category=${categoryId}`;
            return;
        }

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

            // 검증테스트 카테고리 클릭 시 프로토콜 표시
            if (category && category.name === '검증테스트') {
                renderVerificationTestView();
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

                <!-- Refined Immersive Detail View -->
                <div class="role-detail-overlay" id="roleDetailOverlay" onclick="closeRoleDetail()">
                    <div class="role-detail-modal" id="roleDetailModal" onclick="event.stopPropagation()">
                        <!-- Centered Header based on Reference -->
                        <div class="modal-header">
                            <button class="modal-back-btn" onclick="closeRoleDetail()" title="뒤로가기">
                                <i data-lucide="chevron-left"></i>
                            </button>
                            <div class="modal-header-info">
                                <span class="modal-tag" id="modalTag">CATEGORY</span>
                                <h3 class="modal-title" id="modalTitle">Role Name</h3>
                            </div>
                            <div class="modal-admin-actions" style="position: absolute; right: 4.5rem; display: flex; gap: 0.5rem;">
                                <button id="kinkModalEditBtn" class="kink-admin-btn edit-btn" style="display:none;">
                                    <i data-lucide="edit-3"></i><span>내용 수정</span>
                                </button>
                                <button id="kinkModalSaveBtn" class="kink-admin-btn save-btn" style="display:none;">
                                    <i data-lucide="save"></i><span>저장</span>
                                </button>
                            </div>
                            <button class="modal-close-btn" onclick="closeRoleDetail()" title="닫기">
                                <i data-lucide="x"></i>
                            </button>
                        </div>

                        <div class="modal-content" id="modalScrollContent">
                            <div class="flex justify-center mb-10">
                                <div class="modal-icon-wrapper" id="modalIconWrapper" style="background: rgba(255,255,255,0.05); padding: 2rem; border-radius: 32px; border: 1px solid rgba(255,255,255,0.1);">
                                    <!-- Icon injected here -->
                                </div>
                            </div>

                            <section class="mb-12">
                                <h2 class="principles-title">
                                    <i data-lucide="book-open" style="width:16px; height:16px;"></i> 개념 정의
                                </h2>
                                <p class="text-2xl font-bold leading-tight mb-6 text-white" id="modalDefinition" style="word-break: keep-all;">
                                    "Definition Text Here"
                                </p>
                                <div class="role-description" id="roleDescription" style="color: var(--text-secondary); font-size: 1.05rem; line-height: 1.8;">
                                    <!-- Description injected here -->
                                </div>
                            </section>

                            <!-- Bottom Nav -->
                            <div class="kink-detail-nav">
                                <div class="nav-buttons">
                                    <button id="prevKinkBtn" class="nav-btn">
                                        <i data-lucide="chevron-left"></i>
                                        <span>이전 성향</span>
                                    </button>
                                    <button id="nextKinkBtn" class="nav-btn">
                                        <span>다음 성향</span>
                                        <i data-lucide="chevron-right"></i>
                                    </button>
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
        const iconWrapper = document.getElementById('modalIconWrapper');
        const title = document.getElementById('modalTitle');
        const tag = document.getElementById('modalTag');
        const definition = document.getElementById('modalDefinition');
        const description = document.getElementById('roleDescription');
        const scrollContent = document.getElementById('modalScrollContent');

        const isTop = item.type === 'top';
        const themeColor = isTop ? '#ff4d4d' : '#4da6ff';

        if (tag) {
            tag.textContent = isTop ? 'TOP' : 'BOTTOM';
            tag.style.color = themeColor;
        }

        if (iconWrapper) {
            iconWrapper.style.color = themeColor;
            iconWrapper.style.borderColor = `${themeColor}20`; // subtle tinted border
            iconWrapper.innerHTML = `<i data-lucide="${(item.icon_class || (isTop ? 'zap' : 'heart')).toLowerCase()}" style="width: 48px; height: 48px;"></i>`;
        }

        if (title) title.textContent = item.name;

        // Extract definition from content (first line or quoted text)
        let content = item.description || '';
        let defText = "";
        const defMatch = content.match(/^"(.*?)"/m) || content.match(/^(.*?)\n/m);
        if (defMatch) {
            defText = defMatch[0];
            content = content.replace(defMatch[0], "").trim();
        } else {
            defText = `"${item.name}"`;
        }
        if (definition) definition.textContent = defText;
        if (definition) definition.style.color = '#fff';

        // Update Prev/Next Buttons
        const currentIndex = window.tendencyData.findIndex(t => t.id === id);
        const prevBtn = document.getElementById('prevKinkBtn');
        const nextBtn = document.getElementById('nextKinkBtn');

        if (prevBtn) {
            prevBtn.disabled = currentIndex === 0;
            prevBtn.onclick = () => showRoleDetail(window.tendencyData[currentIndex - 1].id);
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex === window.tendencyData.length - 1;
            nextBtn.onclick = () => showRoleDetail(window.tendencyData[currentIndex + 1].id);
        }

        // Show the modal FIRST
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        if (scrollContent) scrollContent.scrollTop = 0;

        if (description) {
            description.innerHTML = '';
            if (window._kinkViewer) {
                try { window._kinkViewer.destroy(); } catch (e) { }
                window._kinkViewer = null;
            }

            if (typeof toastui !== 'undefined' && toastui.Editor) {
                window._kinkViewer = toastui.Editor.factory({
                    el: description,
                    viewer: true,
                    initialValue: content,
                    theme: 'dark'
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

    // ═══════════════════════════════════════════════════
    // VERIFICATION TEST VIEW (BDSM Authenticity Protocol)
    // ═══════════════════════════════════════════════════
    window.renderVerificationTestView = async function () {
        const mainContent = document.getElementById('mainContent');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const metaDiv = document.querySelector('.post-meta');

        if (!mainContent) return;

        if (welcomeTitle) welcomeTitle.style.display = 'none';
        if (metaDiv) metaDiv.style.display = 'none';

        mainContent.innerHTML = `<div class="loading-container"><div class="loading"></div></div>`;

        try {
            // Fetch protocol data from Supabase
            const { data: settings } = await supabaseClient
                .from('settings')
                .select('value')
                .eq('key', 'verification_protocol_data')
                .single();

            let protocolItems = [];
            if (settings && settings.value) {
                protocolItems = JSON.parse(settings.value);
            } else {
                // Default fallback data
                protocolItems = [
                    { id: 1, section: 1, weight: 5, title: '장기 활동 계정 여부', desc: '생성 6개월 이상의 계정이며 성향 관련 일관된 기록이 존재하는가?' },
                    { id: 2, section: 1, weight: 5, title: '블랙리스트 조회 무결성', desc: '성향 커뮤니티 내 피해 사례나 블랙리스트에 언급된 적이 없는가?' },
                    { id: 3, section: 1, weight: 4, title: 'SNS/블로그 철학 기록', desc: '자신만의 성향관이나 일상을 기록한 외부 채널이 존재하는가?' },
                    { id: 4, section: 1, weight: 3, title: '신원 정보의 항상성', desc: '나이, 직업 등 신상 정보가 대화 중 모순 없이 일관되는가?' },
                    { id: 5, section: 1, weight: 4, title: '공식 본인 인증', desc: '이용 중인 플랫폼에서 성인 및 본인 인증을 완료했는가?' },
                    { id: 6, section: 1, weight: 3, title: '도용 의심 사진 부재', desc: '제공한 사진이 타인의 것이거나 도용된 흔적이 없는가?' },
                    { id: 7, section: 1, weight: 3, title: '사회적 신분 증명', desc: '직업이나 신원 확인 요청에 대해 납득 가능한 증빙이 가능한가?' },
                    { id: 11, section: 2, weight: 5, title: '성적 조급함 부재', desc: '초기에 노골적인 성적 대화나 사진 요구를 하지 않는가?' },
                    { id: 12, section: 2, weight: 5, title: '강제적 호칭 요구 부재', desc: '관계 합의 전 "주인님/노예" 등 극단적 호칭을 강요하지 않는가?' },
                    { id: 13, section: 2, weight: 5, title: '거절에 대한 방어기제 부재', desc: '나의 거절을 성향 부족이나 죄책감으로 연결(가스라이팅)하지 않는가?' },
                    { id: 14, section: 2, weight: 4, title: '만남 장소의 개방성', desc: '첫 만남으로 카페 등 공개된 장소를 당연하게 수용하는가?' },
                    { id: 15, section: 2, weight: 4, title: '고립화 시도 부재', desc: '커뮤니티 활동이나 타인과의 소통을 "비밀"을 빌미로 금지하지 않는가?' },
                    { id: 16, section: 2, weight: 5, title: '리미트 존중 태도', desc: '나의 한계를 "극복할 장애물"이 아닌 "지켜야 할 선"으로 인지하는가?' },
                    { id: 17, section: 2, weight: 4, title: '안정적 정서 상태', desc: '대화 중 감정 기복이 심하거나 권위주의적 위협을 가하지 않는가?' },
                    { id: 21, section: 3, weight: 5, title: 'SSC/RACK 프레임워크 인지', desc: '안전 원칙의 차이를 설명하고 자신만의 안전 매뉴얼이 있는가?' },
                    { id: 22, section: 3, weight: 5, title: '세이프워드 우선 원칙', desc: '세이프워드 발동 시 즉각적인 플레이 중단과 조치를 약속하는가?' },
                    { id: 23, section: 3, weight: 5, title: '리스크 사전 고지(RACK)', desc: '선호 행위의 신체적/정신적 위험성을 바텀에게 미리 경고하는가?' },
                    { id: 24, section: 3, weight: 4, title: '애프터케어 구체성', desc: '플레이 후 정서적 회복(드랍 관리 등)에 대한 구체적 계획이 있는가?' },
                    { id: 25, section: 3, weight: 4, title: '도구 위생 및 기술 지식', desc: '도구 관리와 해부학적 위험 부위(신경선 등)를 명확히 아는가?' },
                    { id: 26, section: 3, weight: 4, title: '지속적 동의 확인', desc: '과거의 동의가 현재를 보장하지 않음을 알고 매번 확인하는가?' },
                    { id: 27, section: 3, weight: 3, title: '비상 구급 지식', desc: '사고 발생 시 응급 처치(커팅 가위 등) 방법을 숙지하고 있는가?' }
                ];
            }

            const sections = [
                { id: 1, title: 'SECTION 01. FACT', subtitle: '객관적 사실 및 신원 검증', items: protocolItems.filter(i => i.section === 1) },
                { id: 2, title: 'SECTION 02. BEHAVIOR', subtitle: '대화 및 행동 패턴 분석', items: protocolItems.filter(i => i.section === 2) },
                { id: 3, title: 'SECTION 03. KNOWLEDGE', subtitle: '전문 지식 및 안전 원칙 숙지', items: protocolItems.filter(i => i.section === 3) }
            ];

            const maxScore = protocolItems.reduce((sum, i) => sum + i.weight, 0);

            let html = `
                <div class="verification-wrapper max-w-4xl mx-auto px-4 py-8 text-slate-300">
                    <style>
                        .verification-wrapper .data-row { background: var(--bg-panel); border: 1px solid var(--glass-border); transition: all 0.2s ease; border-radius: 8px; }
                        .verification-wrapper .data-row:hover { border-color: var(--primary-yellow); background: rgba(182, 141, 64, 0.03); }
                        .verification-wrapper .checkbox-hex { appearance: none; width: 20px; height: 20px; border: 2px solid var(--glass-border); border-radius: 4px; cursor: pointer; position: relative; transition: all 0.2s; background: rgba(0,0,0,0.2); }
                        .verification-wrapper .checkbox-hex:checked { background: var(--primary-yellow); border-color: var(--primary-yellow); }
                        .verification-wrapper .checkbox-hex:checked::after { content: '✓'; position: absolute; color: black; font-size: 14px; font-weight: 800; left: 3px; top: -1px; }
                        .verification-wrapper .progress-ring__circle { transition: stroke-dashoffset 0.35s; transform: rotate(-90deg); transform-origin: 50% 50%; }
                        .verification-wrapper .status-badge { padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; font-family: var(--font-sans); }
                        .verification-wrapper .status-verified { background: var(--primary-yellow); color: black; border: 1px solid var(--primary-yellow); }
                        .verification-wrapper .status-qualified { background: rgba(182, 141, 64, 0.2); color: var(--primary-yellow); border: 1px solid var(--primary-yellow); }
                        .verification-wrapper .status-warning { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.3); }
                        .verification-wrapper .status-danger { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); }
                    </style>

                    <header class="mb-12 border-b border-white/5 pb-8">
                        <div class="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                            <div>
                                <h1 class="text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 font-sans">BDSM AUTHENTICITY PROTOCOL <span class="text-[var(--primary-yellow)]">v4.0</span></h1>
                                <p class="text-slate-500 font-mono text-[10px] uppercase tracking-[0.2em]">Smallsm Archive / Safety & Verification System</p>
                            </div>
                            <div class="text-right">
                                <span class="bg-[var(--primary-yellow)]/10 text-[var(--primary-yellow)] text-[10px] px-3 py-1.5 border border-[var(--primary-yellow)]/20 rounded-full font-bold font-mono tracking-tighter">SECURED_LINK: ESTABLISHED</span>
                            </div>
                        </div>
                    </header>

                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-20">
                        <div class="lg:col-span-2 space-y-16">
                            ${sections.map(section => `
                                <section>
                                    <div class="flex items-center gap-4 mb-8">
                                        <h2 class="text-xs font-bold text-slate-500 tracking-[0.3em] uppercase whitespace-nowrap font-mono">${section.title}</h2>
                                        <div class="h-px flex-1 bg-white/5"></div>
                                    </div>
                                    <div class="mb-6">
                                        <h3 class="text-white text-xl font-bold font-serif italic">${section.subtitle}</h3>
                                    </div>
                                    <div class="space-y-4">
                                        ${section.items.map(item => `
                                            <div class="data-row p-5 flex items-start gap-5" data-weight="${item.weight}">
                                                <div class="pt-1">
                                                    <input type="checkbox" class="checkbox-hex protocol-check" data-id="${item.id}" data-weight="${item.weight}">
                                                </div>
                                                <div class="flex-1">
                                                    <div class="flex justify-between items-start mb-2">
                                                        <h4 class="text-white font-bold text-base leading-tight">${item.title}</h4>
                                                        <span class="text-[10px] text-slate-600 font-mono mt-0.5">W:${item.weight}</span>
                                                    </div>
                                                    <p class="text-sm text-slate-400 leading-relaxed font-serif opacity-80">${item.desc}</p>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </section>
                            `).join('')}
                        </div>

                        <div class="lg:col-span-1">
                            <div class="sticky top-24 space-y-6">
                                <div class="bg-[var(--bg-panel)] border border-white/5 rounded-2xl p-8 text-center shadow-2xl">
                                    <h3 class="text-[10px] font-bold text-slate-500 tracking-[0.2em] mb-8 uppercase font-mono">Real-time Analysis</h3>
                                    <div class="relative inline-flex items-center justify-center mb-8">
                                        <svg class="w-52 h-52">
                                            <circle class="text-white/5" stroke-width="6" stroke="currentColor" fill="transparent" r="90" cx="104" cy="104"/>
                                            <circle class="text-[var(--primary-yellow)] progress-ring__circle" stroke-width="6" stroke-dasharray="565.48" stroke-dashoffset="565.48" stroke-linecap="round" stroke="currentColor" fill="transparent" r="90" cx="104" cy="104" id="scoreProgress"/>
                                        </svg>
                                        <div class="absolute text-center">
                                            <span class="block text-5xl font-black text-white tracking-tighter mb-1" id="scorePercentage">0%</span>
                                            <span class="block text-[11px] text-slate-500 font-mono tracking-widest uppercase font-bold" id="scoreRatio">0 / ${maxScore}</span>
                                        </div>
                                    </div>
                                    <div id="statusResult" class="py-6 border-t border-white/5">
                                        <span class="status-badge status-danger">ANALYSIS_PENDING</span>
                                        <p class="text-[12px] text-slate-400 mt-4 leading-relaxed font-serif italic" id="statusMessage">
                                            충분한 데이터가 확보되지 않았습니다. 신뢰도 측정을 위해 항목을 체크해주십시오.
                                        </p>
                                    </div>
                                    <button id="resetProtocol" class="w-full mt-8 py-3.5 border border-white/10 rounded-lg text-[10px] font-bold hover:bg-white/5 hover:border-[var(--primary-yellow)] transition-all uppercase tracking-[0.2em] text-slate-500 font-mono">Reset Protocol</button>
                                </div>

                                <div class="bg-[var(--primary-yellow)]/5 border border-[var(--primary-yellow)]/10 rounded-2xl p-6">
                                    <h4 class="text-[var(--primary-yellow)] text-[11px] font-bold mb-3 flex items-center gap-2 font-mono uppercase tracking-wider">
                                        <i data-lucide="shield-alert" class="w-4 h-4"></i>
                                        System_Advisory
                                    </h4>
                                    <p class="text-[12px] text-slate-400 leading-relaxed font-serif italic opacity-70">
                                        본 프로토콜은 상대방의 진정성을 객관적으로 평가하기 위한 보조 장치입니다. 인격의 모든 것을 수치화할 수 없음을 인지하십시오.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            mainContent.innerHTML = html;
            if (window.lucide) window.lucide.createIcons();
            window.scrollTo(0, 0);

            // Logic Implementation
            const checkboxes = document.querySelectorAll('.protocol-check');
            const scorePercentage = document.getElementById('scorePercentage');
            const scoreRatio = document.getElementById('scoreRatio');
            const scoreProgress = document.getElementById('scoreProgress');
            const statusResult = document.getElementById('statusResult');
            const statusMessage = document.getElementById('statusMessage');
            const circleRadius = 90;
            const circumference = 2 * Math.PI * circleRadius;

            const updateScore = () => {
                let currentScore = 0;
                checkboxes.forEach(cb => {
                    if (cb.checked) currentScore += parseInt(cb.dataset.weight);
                });

                const percent = Math.round((currentScore / maxScore) * 100);
                const offset = circumference - (percent / 100) * circumference;

                scorePercentage.textContent = `${percent}%`;
                scoreRatio.textContent = `${currentScore} / ${maxScore}`;
                scoreProgress.style.strokeDashoffset = offset;

                // Update Status
                if (percent >= 90) {
                    statusResult.innerHTML = '<span class="status-badge status-verified">FULLY_AUTHENTIC</span>';
                    statusMessage.textContent = "검증이 완료되었습니다. 매우 높은 수준의 진정성과 안전성을 확보하고 있습니다.";
                } else if (percent >= 70) {
                    statusResult.innerHTML = '<span class="status-badge status-qualified">QUALIFIED_PARTNER</span>';
                    statusMessage.textContent = "안정적인 수준의 신뢰도를 보장합니다. 상호 합의 하에 실천을 고려할 수 있습니다.";
                } else if (percent >= 50) {
                    statusResult.innerHTML = '<span class="status-badge status-warning">PROVISIONAL_TRUST</span>';
                    statusMessage.textContent = "일부 정보가 불확실하거나 보안이 필요합니다. 더 깊은 대화와 관찰이 권장됩니다.";
                } else {
                    statusResult.innerHTML = '<span class="status-badge status-danger">HIGH_RISK_DETECTED</span>';
                    statusMessage.textContent = "진정성을 확인하기에 데이터가 부족하거나 위험한 패턴이 감지되었습니다. 극도로 주의하십시오.";
                }
            };

            checkboxes.forEach(cb => {
                cb.addEventListener('change', updateScore);
            });

            document.getElementById('resetProtocol').addEventListener('click', () => {
                checkboxes.forEach(cb => cb.checked = false);
                updateScore();
            });

            // Initial Update
            updateScore();

        } catch (error) {
            console.error('Verification view failed:', error);
            mainContent.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">데이터 로딩 실패: ${error.message}</p>`;
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
        if (window.lucide) window.lucide.createIcons();
    }

    function initHeaderScroll() {
        return; // Temporarily disabled to prevent header from hiding
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
            // Small timeout to allow transition
            setTimeout(() => {
                sidebar.classList.remove('-translate-x-full');
                overlay.classList.add('opacity-100');
            }, 10);
            document.body.style.overflow = 'hidden';

            // [추가] 사이드바 전용 버튼 리스너 초기화 (중복 방지 체크)
            initSidebarNavButtons();
        };

        function initSidebarNavButtons() {
            const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');
            if (sidebarSettingsBtn && !sidebarSettingsBtn.dataset.listenerAdded) {
                sidebarSettingsBtn.addEventListener('click', () => {
                    showSettings();
                    closeMenu();
                });
                sidebarSettingsBtn.dataset.listenerAdded = 'true';
            }
        }

        function showSettings() {
            const settingsView = document.getElementById('settingsView');
            const mainContent = document.getElementById('mainContent');
            const welcomeSection = document.getElementById('welcomeSection');

            if (settingsView) {
                settingsView.classList.remove('hidden');
                if (mainContent) mainContent.classList.add('hidden');
                if (welcomeSection) welcomeSection.classList.add('hidden');
                window.scrollTo(0, 0);
            }
        }
        window.showSettings = showSettings;

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

        if (window.lucide) window.lucide.createIcons();
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

        if (!navHome && !document.getElementById('sidebarSettingsBtn')) return;

        const resetActive = () => {
            navItems.forEach(item => {
                if (item) {
                    item.classList.remove('text-brand-primary');
                    item.classList.add('text-slate-400');
                }
            });
        };

        const showView = (view) => {
            // Check if we are on the main page
            const isMainPage = window.location.pathname.endsWith('index.html') ||
                window.location.pathname === '/' ||
                window.location.pathname.endsWith('/');

            if (!isMainPage) {
                window.location.href = `index.html?view=${view}`;
                return;
            }

            resetActive();
            if (view === 'settings') {
                if (welcomeSection) welcomeSection.classList.add('hidden');
                if (mainContent) mainContent.classList.add('hidden');
                if (settingsView) settingsView.classList.remove('hidden');
                if (navSettings) navSettings.classList.add('text-brand-primary');
            } else if (view === 'home' || view === 'wiki') {
                if (welcomeSection) welcomeSection.classList.remove('hidden');
                if (mainContent) mainContent.classList.remove('hidden');
                if (settingsView) settingsView.classList.add('hidden');

                if (view === 'home') {
                    if (navHome) navHome.classList.add('text-brand-primary');
                    // Reset to home posts
                    loadHomeSettings();
                } else {
                    if (navWiki) navWiki.classList.add('text-brand-primary');
                    renderTendencyView();
                }
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
                showView('wiki');
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
        // App Initialization triggered by core.js data-readiness
        window.SML_CORE.waitForConfig(() => {
            if (window.supabaseClient) {
                loadHomeSettings();
                loadCategories().then(() => {
                    // Check for category or view parameter in URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const categoryId = urlParams.get('category');
                    const view = urlParams.get('view');

                    if (categoryId) {
                        console.log('🎯 Filtering by category from URL:', categoryId);
                        filterByCategory(categoryId);
                    } else if (view) {
                        console.log('🎯 Switching to view from URL:', view);
                        showView(view);
                    }
                });
                initSearch();
            }
        });

        // Initialize UI Modules
        initNightMode();
        initAdminLongPress();
        initMobileMenu();
        initHeaderScroll();
        initEmergencySystem();
        initBottomNav();
    });

})();
