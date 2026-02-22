// ?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺??// ?렗 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
// ?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺?곣봺??
(function () {
    'use strict';

    console.log('?? SMALLSM Archive initializing...');

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 1. GLOBALS
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    let supabaseClient = null;
    const VERIFICATION_KEY = 'age_verified';
    const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    const NIGHT_MODE_KEY = 'night_mode';

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 2. SUPABASE INITIALIZATION
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    function initializeSupabase() {
        try {
            if (!window.supabase) {
                console.error('??Supabase library not loaded');
                return false;
            }

            if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
                console.error('??Supabase config not found');
                return false;
            }

            supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.anonKey
            );

            console.log('??Supabase initialized');
            return true;
        } catch (error) {
            console.error('??Supabase init failed:', error);
            return false;
        }
    }

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 3. AGE VERIFICATION
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    function checkAgeVerification() {
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

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 4. CATEGORY LOADING
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 4. HOME SETTINGS LOADING
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    async function loadHomeSettings() {
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
                console.log('??Site Title Updated:', settings.site_title);
            }
            if (settings.site_description) {
                const descTag = document.getElementById('siteDescTag');
                if (descTag) descTag.content = settings.site_description;
                console.log('??Site Description Updated');
            }
            if (settings.google_site_verification) {
                const gTag = document.querySelector('meta[name="google-site-verification"]');
                if (gTag) {
                    gTag.content = settings.google_site_verification;
                    console.log('??Google Verification Tag Updated:', settings.google_site_verification);
                } else {
                    console.warn('?좑툘 Google Meta Tag not found in HTML');
                }
            }
            if (settings.naver_verification) {
                const nTag = document.querySelector('meta[name="naver-site-verification"]');
                if (nTag) {
                    nTag.content = settings.naver_verification;
                    console.log('??Naver Verification Tag Updated:', settings.naver_verification);
                } else {
                    console.warn('?좑툘 Naver Meta Tag not found in HTML');
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

            console.log('??Home settings loaded');

        } catch (error) {
            console.error('??Home settings loading failed:', error);
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
                    <h2 style="font-size: 1.2rem; margin-bottom: 1.5rem; color: var(--primary-brass); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">理쒓렐 湲곕줉</h2>
                    ${posts.map(post => `
                        <div style="margin-bottom: 1rem;">
                            <a href="post.html?id=${post.id}" style="color: var(--text-primary); text-decoration: none; font-size: 0.95rem;">
                                ??${post.title} <span style="color: var(--text-secondary); font-size: 0.8rem; margin-left: 0.5rem;">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                            </a>
                        </div>
                    `).join('')}
                `;
                content.appendChild(recentSection);
            }
        } catch (error) {
            console.error('??Recent posts loading failed:', error);
        }
    }

    async function loadCategories() {
        if (!supabaseClient) {
            console.warn('?좑툘 Supabase not initialized');
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

            // '?깊뼢 諛깃낵' 移댄뀒怨좊━ ?먮룞 ?앹꽦 (?놁쓣 寃쎌슦 愿由ъ옄濡?濡쒓렇????
            const hasWiki = (categories || []).some(c => c.name === '?깊뼢 諛깃낵' && !c.parent_id);
            if (!hasWiki) {
                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    if (user && user.email === window.ADMIN_EMAIL) {
                        const maxOrder = (categories || [])
                            .filter(c => !c.parent_id)
                            .reduce((max, c) => Math.max(max, c.display_order || 0), 0);
                        const { data: newCat } = await supabaseClient
                            .from('categories')
                            .insert({ name: '?깊뼢 諛깃낵', parent_id: null, display_order: maxOrder + 1, is_visible: true })
                            .select()
                            .single();
                        if (newCat) categories.push(newCat);
                        console.log('???깊뼢 諛깃낵 移댄뀒怨좊━ ?먮룞 ?앹꽦??);
                    }
                } catch (e) {
                    console.warn('?깊뼢 諛깃낵 移댄뀒怨좊━ ?앹꽦 ?ㅽ궢:', e.message);
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

            console.log('??Categories loaded');

        } catch (error) {
            console.error('??Categories loading failed:', error);
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

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 5. POST LOADING BY CATEGORY (Modified for Direct View)
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    async function loadPostsByCategory(categoryId) {
        if (!supabaseClient) return;

        try {
            // Check category name first
            const { data: category } = await supabaseClient
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            // ?깊뼢 諛깃낵 移댄뀒怨좊━ ?대┃ ??媛ㅻ윭由??쒖떆
            if (category && category.name === '?깊뼢 諛깃낵') {
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
                title.textContent = '寃뚯떆臾??놁쓬';
                content.innerHTML = '<p>??移댄뀒怨좊━?먮뒗 ?꾩쭅 寃뚯떆臾쇱씠 ?놁뒿?덈떎.</p>';
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
                    metaDiv.innerHTML = `<span>${categoryName}</span> ??<span>${dateStr}</span>`;
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
            if (metaDiv) metaDiv.innerHTML = `<span>珥?${posts.length}媛쒖쓽 寃뚯떆臾?/span>`;

            content.innerHTML = posts.map(post => `
                <div class="admin-post-item" style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border); position: relative;">
                    <h3>
                        <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;" data-admin-editable="text" data-admin-id="${post.id}" data-admin-field="title">
                            ${post.title}
                            ${post.is_private ? '<span style="font-size: 0.8em; color: var(--accent-amber);"> ?뵏</span>' : ''}
                        </a>
                    </h3>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">
                            ${new Date(post.created_at).toLocaleDateString('ko-KR')}
                        </p>
                        ${isAdmin ? `
                            <div class="admin-post-actions">
                                <button class="admin-action-btn delete" onclick="event.preventDefault(); deletePostInline('${post.id}', '${post.title.replace(/'/g, "\\'")}')" title="Delete">?뿊截?/button>
                                <button class="admin-action-btn edit" onclick="event.preventDefault(); window.location.href='admin.html?edit=${post.id}'" title="Full Edit">?숋툘</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('??Post loading failed:', error);
        }
    }

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 6. SEARCH FUNCTIONALITY
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    let searchTimeout;

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
                    console.error('??Search failed:', error);
                }
            }, 300);
        });
    }

    function displaySearchResults(results) {
        const content = document.getElementById('mainContent');
        const title = document.getElementById('welcomeTitle');

        if (!content || !title) return;

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

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 7. NIGHT MODE
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 7. LONG PRESS FOR ADMIN
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    function initAdminLongPress() {
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

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // TENDENCY VIEW INTEGRATION - KINK DICTIONARY
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    window.tendencyActiveTab = 'Top';

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
            // Find "?깊뼢 諛깃낵" category ID dynamically
            const { data: categoryData, error: catError } = await supabaseClient
                .from('categories')
                .select('id')
                .eq('name', '?깊뼢 諛깃낵')
                .single();

            if (catError) throw new Error('?깊뼢 諛깃낵 移댄뀒怨좊━瑜?李얠쓣 ???놁뒿?덈떎.');
            const kinkDictCategoryId = categoryData.id;

            // Fetch archive_posts under this category
            const { data: posts, error } = await supabaseClient
                .from('archive_posts')
                .select('id, title, content, created_at')
                .eq('category_id', kinkDictCategoryId)
                .order('created_at', { ascending: true }); // Using created_at or title for ordering

            if (error) throw error;

            // Process posts and convert them to "tendencies" format
            const tendenciesData = (posts || []).map(post => {
                // Try to extract English sub name from parenthesis, e.g., "留덉뒪??(Master)"
                const titleMatch = post.title.match(/(.*?)\s*\((.*?)\)$/);
                let name = post.title;
                let sub_name = '';

                if (titleMatch) {
                    name = titleMatch[1].trim();
                    sub_name = titleMatch[2].trim();
                }

                // Temporary logic to guess Top/Bottom based on title keywords.
                // In a robust system, you might tag posts, but for now we regex map common words.
                const isBottom = /留ㅼ“|???щ젅?대툕|?꾨젅??留덉“?덉뒪???쒕툕誘몄떆釉?諛뷀?|Bottom|Submissive/i.test(post.title);
                const type = isBottom ? 'bottom' : 'top';

                return {
                    id: post.id,
                    name: name,
                    sub_name: sub_name,
                    description: post.content, // we map content to description
                    type: type,
                    icon_class: isBottom ? 'heart' : 'crown' // Default icons
                };
            });

            window.tendencyData = tendenciesData;

            // Hide the legacy page-header to avoid duplicate titles
            const pageHeader = document.querySelector('.page-header');
            if (pageHeader) pageHeader.style.display = 'none';

            renderKinkDictionaryUI();

        } catch (error) {
            console.error('Gallery load failed:', error);
            mainContent.innerHTML = `<p style="color:red; text-align:center; padding: 2rem;">?곗씠??濡쒕뵫 ?ㅽ뙣: ${error.message}</p>`;
        }
    }

    window.renderKinkDictionaryUI = function () {
        const mainContent = document.getElementById('mainContent');
        if (!mainContent) return;

        const tendenciesData = window.tendencyData || [];
        const doms = tendenciesData.filter(t => t.type === 'top');
        const subs = tendenciesData.filter(t => t.type === 'bottom');

        const activeTab = window.tendencyActiveTab || 'Top';

        let contentHtml = '';

        if (activeTab === 'Relation') {
            contentHtml = `
                <div class="kink-relation-container">
                    <div class="kink-relation-info">
                        <p>?쒕줈 留ㅼ묶?섎뒗 ?깊뼢?쇰━ 臾띠뼱??蹂댁뿬以띾땲??</p>
                    </div>
                    <div class="kink-relation-list">
            `;
            // Simple mapping for demo matching. 
            // We assume index mapping matches them one-by-one or loops
            const matchLength = Math.min(doms.length, subs.length);
            for (let idx = 0; idx < matchLength; idx++) {
                const top = doms[idx];
                const bottom = subs[idx];
                contentHtml += `
                    <div class="kink-relation-item">
                        <div class="kink-relation-card top">
                            <div class="relation-badge top-badge">TOP</div>
                            <div class="relation-name">${top.name}</div>
                        </div>
                        <div class="relation-icon"><i data-lucide="zap"></i></div>
                        <div class="kink-relation-card bottom">
                            <div class="relation-badge bottom-badge">BOTTOM</div>
                            <div class="relation-name">${bottom.name}</div>
                        </div>
                    </div>
                `;
            }
            contentHtml += `</div></div>`;
        } else {
            const listData = activeTab === 'Top' ? doms : subs;
            contentHtml = `<div class="kink-list-container">`;
            listData.forEach(item => {
                // Create a brief summary of the markdown content for the list view
                const plainText = item.description.replace(/[#*_~>]/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
                const brief = plainText.length > 50 ? plainText.substring(0, 50) + '...' : plainText;

                contentHtml += `
                    <div class="kink-list-item" onclick="showRoleDetail('${item.id}')">
                        <div class="kink-item-content">
                            <div class="kink-item-header">
                                <h3 class="kink-item-name">${item.name}</h3>
                                <span class="kink-item-subname">(${item.sub_name || ''})</span>
                            </div>
                            <p class="kink-item-desc">${brief}</p>
                        </div>
                        <div class="kink-item-arrow">
                            <i data-lucide="chevron-right"></i>
                        </div>
                    </div>
                `;
            });
            contentHtml += `</div>`;
        }


        mainContent.innerHTML = `
            <div class="kink-dict-wrapper">
                <div class="kink-dict-header">
                    <h1 class="kink-dict-title">?깊뼢 諛깃낵</h1>
                    <p class="kink-dict-subtitle">珥?${tendenciesData.length}媛쒖쓽 湲곕줉??議댁옱?⑸땲??</p>
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
                            <span class="kink-tab-count">${Math.min(doms.length, subs.length)}</span>
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
                        <button class="modal-close-btn" onclick="closeRoleDetail()">??/button>
                        <div class="modal-content">
                            <div class="modal-header">
                                <div class="modal-icon-wrapper" id="modalIconWrapper">
                                    <!-- Icon injected here -->
                                </div>
                                <div>
                                    <h3 class="modal-title" id="modalTitle">Role Name</h3>
                                    <p class="modal-subname" id="modalSubName">SUBNAME</p>
                                </div>
                            </div>
                            <div class="modal-body">
                                <div class="description-container">
                                    <div class="role-description" id="roleDescription"></div>
                                </div>
                                <div style="margin-top: 1.5rem;">
                                    <a class="btn-primary" href="/post.html?id=\${window.currentDetailId}" style="display: block; text-align: center; text-decoration: none;">?먯꽭???쎄린 ??/a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="kink-dict-hint">
                    <div class="hint-badge">紐⑸줉???대┃?섏뿬 ?곸꽭 ?뺣낫瑜??뺤씤?섏꽭??/div>
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

        window.currentDetailId = id; // Save for "Read More" button

        const overlay = document.getElementById('roleDetailOverlay');
        const accentBar = document.getElementById('modalAccentBar');
        const iconWrapper = document.getElementById('modalIconWrapper');
        const title = document.getElementById('modalTitle');
        const subName = document.getElementById('modalSubName');
        const description = document.getElementById('roleDescription');

        const themeColor = item.type === 'top' ? '#ff4d4d' : '#4da6ff';

        accentBar.style.backgroundColor = themeColor;
        iconWrapper.style.color = themeColor;
        iconWrapper.innerHTML = `<i data-lucide="${(item.icon_class || 'crown').toLowerCase()}" style="width: 48px; height: 48px;"></i>`;

        title.textContent = item.name;
        subName.textContent = item.sub_name || '';

        if (description) {
            // Very simple markdown to HTML parser for the preview
            let descHtml = (item.description || '')
                .replace(/### (.*?)\n/g, '<h4>$1</h4>')
                .replace(/## (.*?)\n/g, '<h3>$1</h3>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n\n/g, '<br><br>');

            // Limit preview length
            if (descHtml.length > 300) {
                descHtml = descHtml.substring(0, 300) + '...';
            }

            description.innerHTML = descHtml;
        }

        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (window.lucide) {
            window.lucide.createIcons();
        }
    };

    window.closeRoleDetail = function () {
        const overlay = document.getElementById('roleDetailOverlay');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    };

    function initNightMode() {
        const sidebarToggle = document.getElementById('modeToggle');
        const headerToggle = document.getElementById('headerModeToggle');
        if (!sidebarToggle && !headerToggle) return;

        const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';

        const updateUI = (nightMode) => {
            document.body.classList.toggle('night-mode', nightMode);
            const icon = nightMode ? '?截? : '?뙔';
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

    function initHeaderScroll() {
        const header = document.querySelector('.mobile-header');
        if (!header) return;

        let lastScrollY = window.scrollY;

        window.addEventListener('scroll', () => {
            const currentScrollY = window.scrollY;

            // 50px ?댁긽 ?ㅽ겕濡ㅽ뻽???뚮쭔 ?숈옉 (媛먮룄 議곗젅)
            if (Math.abs(currentScrollY - lastScrollY) < 10) return;

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                // ?꾨옒濡??ㅽ겕濡?以묒씠硫??대뒓 ?뺣룄 ?대젮?붿쓣 ???④?
                header.classList.add('header-hidden');
            } else {
                // ?꾨줈 ?ㅽ겕濡?以묒씪 ???ㅼ떆 ?쒖떆
                header.classList.remove('header-hidden');
            }

            lastScrollY = currentScrollY;
        }, { passive: true });
    }

    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggleBtn');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!menuToggle || !sidebar || !overlay) return;

        const closeMenu = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };

        const toggleMenu = () => {
            const isActive = sidebar.classList.toggle('active');
            overlay.classList.toggle('active', isActive);
            document.body.style.overflow = isActive ? 'hidden' : '';
        };

        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        overlay.addEventListener('click', closeMenu);

        // 移댄뀒怨좊━ ?대┃ ??硫붾돱 ?リ린
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

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 9. EMERGENCY & BOTTOM NAV SYSTEM
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    const EMERGENCY_URL_KEY = 'emergency_url';
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
        const navSearch = document.getElementById('navSearch');
        const navSettings = document.getElementById('navSettings');
        const mainEls = document.querySelectorAll('.content-panel, .site-footer');
        const settingsView = document.getElementById('settingsView');

        if (!navHome || !navSettings) return;

        const showView = (view) => {
            if (view === 'settings') {
                mainEls.forEach(el => el.style.display = 'none');
                if (settingsView) settingsView.style.display = 'block';
                navSettings.classList.add('active');
                navHome.classList.remove('active');
            } else {
                mainEls.forEach(el => el.style.display = 'block');
                if (settingsView) settingsView.style.display = 'none';
                navHome.classList.add('active');
                navSettings.classList.remove('active');
            }
            window.scrollTo(0, 0);
        };

        navHome.addEventListener('click', (e) => {
            if (window.location.pathname.includes('post.html')) return; // Allow natural navigation
            e.preventDefault();
            showView('home');
        });

        navSettings.addEventListener('click', (e) => {
            e.preventDefault();
            showView('settings');
        });

        if (navSearch) {
            navSearch.addEventListener('click', (e) => {
                e.preventDefault();
                // Focusing search in sidebar as a fallback or if we want a separate search view
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    const sidebar = document.querySelector('.sidebar');
                    const overlay = document.getElementById('sidebarOverlay');
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                    setTimeout(() => searchInput.focus(), 300);
                }
            });
        }
    }

    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    // 8. INITIALIZATION
    // ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??    function waitForConfig(callback, maxWait = 5000) {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
                clearInterval(interval);
                callback();
            } else if (Date.now() - startTime > maxWait) {
                clearInterval(interval);
                console.error('?깍툘 Config loading timeout');
            }
        }, 100);
    }

    document.addEventListener('DOMContentLoaded', () => {
        console.log('?벑 DOM ready');

        // Yes button
        const btnYes = document.getElementById('btnYes');
        if (btnYes) {
            btnYes.addEventListener('click', () => {
                console.log('??Yes clicked');
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
                console.log('??No clicked');
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
        initMobileMenu();
        initHeaderScroll();
        initEmergencySystem();
        initBottomNav();

        console.log('?럦 Initialization complete');
    });

})();
