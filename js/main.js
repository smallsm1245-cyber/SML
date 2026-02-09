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
                const siteTitleEl = document.querySelector('.site-title a');
                if (siteTitleEl) siteTitleEl.textContent = settings.site_title;
            }
            if (settings.site_description) {
                const descTag = document.getElementById('siteDescTag');
                if (descTag) descTag.content = settings.site_description;
            }

            // Update Home Content
            const title = document.getElementById('welcomeTitle');
            const subtitle = document.getElementById('welcomeSubtitle');
            const content = document.getElementById('welcomeContent');

            if (title && settings.home_title) title.textContent = settings.home_title;
            if (subtitle && settings.home_subtitle) subtitle.textContent = settings.home_subtitle;
            if (content && settings.home_content) {
                // Initialize Toast UI Viewer
                const Viewer = toastui.Editor;
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
                const content = document.getElementById('welcomeContent');
                if (!content) return;

                const recentSection = document.createElement('div');
                recentSection.style.marginTop = '3rem';
                recentSection.innerHTML = `
                    <h2 style="font-size: 1.2rem; margin-bottom: 1.5rem; color: var(--primary-brass); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem;">최근 기록</h2>
                    ${posts.map(post => `
                        <div style="margin-bottom: 1rem;">
                            <a href="javascript:void(0);" onclick="loadPost(${post.id})" style="color: var(--text-primary); text-decoration: none; font-size: 0.95rem;">
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
        if (!supabaseClient) return;

        try {
            // Fetch Categories & Counts
            const { data: categories, error } = await supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            const { data: posts } = await supabaseClient
                .from('archive_posts')
                .select('category_id')
                .eq('is_private', false);

            const counts = {};
            if (posts) {
                posts.forEach(p => counts[p.category_id] = (counts[p.category_id] || 0) + 1);
            }

            // Add child counts to parents
            if (categories) {
                categories.forEach(c => {
                    if (c.parent_id) {
                        // Find parent and add
                        const parent = categories.find(p => p.id === c.parent_id);
                        if (parent) {
                            counts[parent.id] = (counts[parent.id] || 0) + (counts[c.id] || 0);
                        }
                    }
                });
            }

            renderCategories(categories || [], counts);

        } catch (error) {
            console.error('❌ Categories loading failed:', error);
        }
    }

    function renderCategories(categories, counts) {
        // TARGET categoryList NOT categoryNav (which contains menu items)
        const list = document.getElementById('categoryList');
        if (!list) return;

        const roots = categories.filter(c => !c.parent_id);
        const childrenMap = {};
        categories.filter(c => c.parent_id).forEach(c => {
            if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
            childrenMap[c.parent_id].push(c);
        });

        list.innerHTML = roots.map(root => {
            const children = childrenMap[root.id] || [];
            const hasChildren = children.length > 0;
            const count = counts[root.id] || 0;

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
        document.querySelectorAll('.category-link, .submenu-link').forEach(el => el.classList.remove('active'));
        if (element) element.classList.add('active');

        loadPostsByCategory(categoryId);
    };

    // Global function to load a single post (for recent posts link)
    window.loadPost = async function (postId) {
        if (!supabaseClient) return;
        try {
            const { data: post, error } = await supabaseClient
                .from('archive_posts')
                .select('*')
                .eq('id', postId)
                .single();

            if (error) throw error;

            showPostView(post, post.title); // Re-use show logic

        } catch (e) {
            console.error(e);
        }
    }

    // ═══════════════════════════════════════════════════
    // 5. POST LOADING & VIEW SWITCHING
    // ═══════════════════════════════════════════════════
    function switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
        // Show target
        document.getElementById(sectionId).style.display = 'block';

        // Update menu active state
        document.querySelectorAll('.category-link, .submenu-link, #menuHome, #menuInclinations').forEach(el => el.classList.remove('active'));

        if (sectionId === 'homeSection') {
            document.getElementById('menuHome').classList.add('active');
        } else if (sectionId === 'inclinationsSection') {
            document.getElementById('menuInclinations').classList.add('active');
        }

        // Mobile menu close
        document.querySelector('.dashboard-sidebar').classList.remove('active');
    }

    // Explicit Home Button Handler
    const menuHome = document.getElementById('menuHome');
    if (menuHome) {
        menuHome.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection('homeSection');
        });
    }

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

            const { data: category } = await supabaseClient
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            const categoryName = category ? category.name : 'Category';

            if (posts.length === 0) {
                showPostList([], categoryName, '이 카테고리에는 게시물이 없습니다.');
                return;
            }

            if (posts.length === 1) {
                showPostView(posts[0], categoryName);
                return;
            }

            showPostList(posts, categoryName);

        } catch (error) {
            console.error('❌ Post loading failed:', error);
        }
    }

    function showPostView(post, categoryName) {
        switchSection('postsSection');

        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postCategory').textContent = categoryName;
        document.getElementById('postDate').textContent = new Date(post.created_at).toLocaleDateString('ko-KR');

        const content = document.getElementById('postContent');
        content.innerHTML = '';

        const Viewer = toastui.Editor;
        new Viewer({
            el: content,
            initialValue: post.content,
            theme: 'dark'
        });
    }

    function showPostList(posts, titleText, emptyMsg) {
        switchSection('postsSection');

        document.getElementById('postTitle').textContent = titleText;
        document.getElementById('postCategory').textContent = '';
        document.getElementById('postDate').textContent = '';

        const content = document.getElementById('postContent');
        content.innerHTML = '';

        if (posts.length === 0) {
            content.innerHTML = `<p>${emptyMsg || '게시물이 없습니다.'}</p>`;
            return;
        }

        content.innerHTML = posts.map(post => `
             <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
                <h3>
                    <a href="javascript:void(0);" onclick="loadPost(${post.id})" style="color: var(--primary-brass); text-decoration: none;">
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
                // ... (Search logic similar to before but using showPostList)
                if (query.length < 2) return;

                try {
                    const { data: { user } } = await supabaseClient.auth.getUser();
                    const isAdmin = user && user.email === window.ADMIN_EMAIL;

                    let searchQuery = supabaseClient
                        .from('archive_posts')
                        .select('id, title, created_at, category_id, is_private, content') // content needed? no
                        .ilike('title', `%${query}%`)
                        .order('created_at', { ascending: false })
                        .limit(10);

                    if (!isAdmin) searchQuery = searchQuery.eq('is_private', false);

                    const { data: results, error } = await searchQuery;
                    if (error) throw error;

                    showPostList(results, '검색 결과: ' + query);

                } catch (e) { console.error(e); }

            }, 300);
        });
    }

    function displaySearchResults(results) {
        // Deprecated, using showPostList
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
                localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
                hideDisclaimer();

                waitForConfig(() => {
                    initializeSupabase();
                    loadHomeSettings();
                    loadCategories();
                    initSearch();
                    initAdminLongPress();
                    initNightMode();
                    initInclinations();
                });
            });
        }

        // ═══════════════════════════════════════════════════
        // 9. INCLINATIONS FEATURE
        // ═══════════════════════════════════════════════════

        // Sample Data Structure
        const INCLINATIONS_DATA = [
            {
                id: 'dom_1',
                name: 'Dominant',
                position: 'top',
                description: '지배적인 성향을 가진 파트너',
                tags: ['통제', '리드', '책임'],
                image: 'https://via.placeholder.com/300x200/3a3a3a/ffffff?text=Dominant'
            },
            {
                id: 'sub_1',
                name: 'Submissive',
                position: 'bottom',
                description: '지배받는 것을 선호하는 파트너',
                tags: ['순종', '팔로우', '헌신'],
                image: 'https://via.placeholder.com/300x200/3a3a3a/ffffff?text=Submissive'
            },
            {
                id: 'switch_1',
                name: 'Switch',
                position: 'switch',
                description: '상황에 따라 역할을 바꾸는 파트너',
                tags: ['유연성', '양면성', '멀티'],
                image: 'https://via.placeholder.com/300x200/3a3a3a/ffffff?text=Switch'
            },
            {
                id: 'hunter_1',
                name: 'Hunter',
                position: 'top',
                description: '적극적으로 파트너를 공략하는 성향',
                tags: ['추적', '공략', '적극성'],
                image: 'https://via.placeholder.com/300x200/3a3a3a/ffffff?text=Hunter'
            },
            {
                id: 'prey_1',
                name: 'Prey',
                position: 'bottom',
                description: '공략당하는 상황을 즐기는 성향',
                tags: ['도망', '긴장감', '피동'],
                image: 'https://via.placeholder.com/300x200/3a3a3a/ffffff?text=Prey'
            }
        ];

        function initInclinations() {
            // Sidebar Menu
            const menuBtn = document.getElementById('menuInclinations');
            if (menuBtn) {
                menuBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    showInclinationsSection();
                });
            }

            // Tab Filters
            document.querySelectorAll('.filter-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    // Update active tab
                    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');

                    // Filter
                    const filter = tab.dataset.filter;
                    renderInclinations(filter);
                });
            });

            // Initial Render
            renderInclinations('all');
        }

        function showInclinationsSection() {
            // Hide other sections
            document.querySelectorAll('.content-section').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.category-link, .submenu-link').forEach(el => el.classList.remove('active'));
            document.getElementById('menuHome').classList.remove('active');

            // Show Inclinations
            document.getElementById('inclinationsSection').style.display = 'block';
            document.getElementById('menuInclinations').classList.add('active');

            // Mobile menu close
            document.querySelector('.dashboard-sidebar').classList.remove('active');
        }

        function renderInclinations(filter) {
            const grid = document.getElementById('inclinationsGrid');
            if (!grid) return;

            const filteredData = filter === 'all'
                ? INCLINATIONS_DATA
                : INCLINATIONS_DATA.filter(item => item.position === filter.toLowerCase());

            if (filteredData.length === 0) {
                grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">해당하는 성향 카드가 없습니다.</p>';
                return;
            }

            grid.innerHTML = filteredData.map(item => `
                <div class="inclination-card">
                    <div class="card-image" style="background-image: url('${item.image}')"></div>
                    <div class="card-content">
                        <div class="card-header">
                            <h3 class="card-title">${item.name}</h3>
                            <span class="position-badge ${item.position}">${item.position.toUpperCase()}</span>
                        </div>
                        <p class="card-desc">${item.description}</p>
                        <div class="card-tags">
                            ${item.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        if (checkAgeVerification()) {
            waitForConfig(() => {
                initializeSupabase();
                loadHomeSettings();
                loadCategories();
                initSearch();
                initAdminLongPress();
                initNightMode();
                initInclinations();
            });
        } else {
            // If checking age fails (returns false show disclaimer), we wait for interaction
            initAdminLongPress(); // Still allow admin access
        }
    });

})();
