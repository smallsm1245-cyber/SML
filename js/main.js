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
    // 4. HOME: POST GRID LOADING
    // ═══════════════════════════════════════════════════
    async function loadRecentPosts() {
        if (!supabaseClient) return;

        const container = document.getElementById('content');
        if (!container) return;

        container.innerHTML = '<div class="loading-msg" style="grid-column: 1/-1; text-align: center;">기록을 불러오는 중...</div>';

        try {
            // 1. Fetch Posts
            const { data: posts, error } = await supabaseClient
                .from('archive_posts') // Using correct table name
                .select('*')
                .eq('is_visible', true)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            console.log('✅ Loaded posts:', posts.length);

            // 2. Render Grid
            if (!posts || posts.length === 0) {
                container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding:3rem;">아직 등록된 기록이 없습니다.</p>';
                return;
            }

            container.innerHTML = ''; // Clear loading

            posts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                card.onclick = () => window.location.href = `post.html?id=${post.id}`;

                // Content Strip for Excerpt
                const rawContent = post.content || '';
                const plainText = rawContent.replace(/[#*`\[\]]/g, '').slice(0, 120) + '...';
                const dateStr = new Date(post.created_at).toLocaleDateString('ko-KR');
                const categoryName = post.category_name || 'Archive'; // We might need to join categories or just show default

                // Thumb: Search for first image in markdown, else default color
                const imgMatch = rawContent.match(/!\[.*?\]\((.*?)\)/);
                const bgStyle = imgMatch ? `background-image: url('${imgMatch[1]}');` : 'background-color: #EAE6DE;';

                card.innerHTML = `
                    <div class="post-card-thumb" style="${bgStyle}"></div>
                    <div class="post-card-body">
                        <div class="post-card-cat">${post.is_private ? '🔒 Private' : 'Public'}</div>
                        <h3 class="post-card-title">${post.title}</h3>
                        <p class="post-card-excerpt">${plainText}</p>
                        <div class="post-card-meta">
                            <span>The Private Lab</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (e) {
            console.error('❌ Error loading posts:', e);
            container.innerHTML = '<p class="error-msg" style="grid-column: 1/-1;">데이터를 불러오지 못했습니다.</p>';
        }
    }

    // ═══════════════════════════════════════════════════
    // 5. SIDEBAR WIDGETS
    // ═══════════════════════════════════════════════════
    async function loadCategories() {
        if (!supabaseClient) return;

        try {
            const { data: categories, error } = await supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            const list = document.getElementById('categoryList');
            if (!list) return;

            // Keep "All Posts"
            list.innerHTML = '<li><a href="#" class="toc-link active" data-id="all">All Posts</a></li>';

            categories.forEach(cat => {
                const li = document.createElement('li');
                li.innerHTML = `<a href="#" class="toc-link" data-id="${cat.id}">${cat.name}</a>`;

                // Click Handler
                li.querySelector('a').addEventListener('click', (e) => {
                    e.preventDefault();
                    filterPostsByCategory(cat.id);
                    document.querySelectorAll('.toc-link').forEach(l => l.classList.remove('active'));
                    e.target.classList.add('active');
                });

                list.appendChild(li);
            });

        } catch (e) {
            console.error('❌ Category load failed:', e);
        }
    }

    async function filterPostsByCategory(categoryId) {
        // Simple client-side re-fetch or filter
        // For now, let's re-fetch (simpler for pagination later)
        // ... Implementation similar to loadRecentPosts but with .eq('category_id') ...
        // For MVP, just alerting or simple log
        console.log('Filter by:', categoryId);
        // Reuse loadRecentPosts with a filter arg if we refactor, 
        // but for now let's just reload all (simplification). 
        // A proper implementation would update loadRecentPosts to accept a filter.

        // Quick Implementation:
        const container = document.getElementById('content');
        container.innerHTML = '<div class="loading-msg">Filtering...</div>';

        try {
            let query = supabaseClient
                .from('archive_posts')
                .select('*')
                .eq('is_visible', true)
                .order('created_at', { ascending: false });

            if (categoryId !== 'all') {
                query = query.eq('category_id', categoryId);
            }

            const { data: posts, error } = await query;
            if (error) throw error;

            // Render (Code duplication sucks, but quick fix)
            container.innerHTML = '';
            if (!posts || posts.length === 0) {
                container.innerHTML = '<p style="padding:2rem;">이 카테고리에 글이 없습니다.</p>';
                return;
            }

            posts.forEach(post => {
                const card = document.createElement('div');
                card.className = 'post-card';
                card.onclick = () => window.location.href = `post.html?id=${post.id}`;

                const rawContent = post.content || '';
                const plainText = rawContent.replace(/[#*`\[\]]/g, '').slice(0, 120) + '...';
                const dateStr = new Date(post.created_at).toLocaleDateString();
                const imgMatch = rawContent.match(/!\[.*?\]\((.*?)\)/);
                const bgStyle = imgMatch ? `background-image: url('${imgMatch[1]}');` : 'background-color: #EAE6DE;';

                card.innerHTML = `
                    <div class="post-card-thumb" style="${bgStyle}"></div>
                    <div class="post-card-body">
                        <div class="post-card-cat">${post.is_private ? '🔒' : ''} Archive</div>
                        <h3 class="post-card-title">${post.title}</h3>
                        <p class="post-card-excerpt">${plainText}</p>
                        <div class="post-card-meta">
                            <span>The Private Lab</span>
                            <span>${dateStr}</span>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });

        } catch (e) { console.error(e); }
    }

    // ═══════════════════════════════════════════════════
    // 5. POST LOADING BY CATEGORY
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

            title.textContent = category.name;

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
                    loadRecentPosts();
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
                // Load grid instead of home settings
                loadRecentPosts();
                loadCategories();
                initSearch();
            });
        }

        initNightMode();
        initAdminLongPress();

        console.log('🎉 Initialization complete');
    });

})();
