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
                    <h2 class="section-title">최근 기록</h2>
                    <div class="posts-grid">
                        ${posts.map(post => `
                            <div class="post-card">
                                <a href="post.html?id=${post.id}" class="post-card-link">
                                    <div class="post-card-content">
                                        <h3 class="post-card-title">${post.title}</h3>
                                        <span class="post-card-date">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                </a>
                            </div>
                        `).join('')}
                    </div>
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
            // Check category name first
            const { data: category } = await supabaseClient
                .from('categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            if (category && category.name === 'Top / Bottom 세부 성향') {
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

            content.innerHTML = `
                <div class="posts-grid">
                    ${posts.map(post => `
                        <div class="post-card">
                            <a href="post.html?id=${post.id}" class="post-card-link">
                                <div class="post-card-content">
                                    <h3 class="post-card-title">
                                        ${post.title}
                                        ${post.is_private ? '<span class="private-lock"> 🔒</span>' : ''}
                                    </h3>
                                    <span class="post-card-date">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                                </div>
                            </a>
                        </div>
                    `).join('')}
                </div>
            `;

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

        content.innerHTML = `
            <div class="posts-grid">
                ${results.map(post => `
                    <div class="post-card">
                        <a href="post.html?id=${post.id}" class="post-card-link">
                            <div class="post-card-content">
                                <h3 class="post-card-title">${post.title}</h3>
                                <span class="post-card-date">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                            </div>
                        </a>
                    </div>
                `).join('')}
            </div>
        `;
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
    // TENDENCY VIEW INTEGRATION - DUAL COMPARISON SYSTEM
    // ═══════════════════════════════════════════════════
    window.dualSelected = { a: null, b: null, activeSlot: 'a' };

    async function renderTendencyView() {
        if (!supabaseClient) return;

        const mainContent = document.getElementById('mainContent');
        const welcomeTitle = document.getElementById('welcomeTitle');
        const metaDiv = document.querySelector('.post-meta');

        if (!mainContent) return;

        welcomeTitle.textContent = 'Top / Bottom 성향 듀얼 비교';
        if (metaDiv) metaDiv.innerHTML = '<span>두 가지 성향을 동시에 선택하여 대조 분석 (데스크탑: 병렬 / 모바일: 탭)</span>';

        mainContent.innerHTML = `<div class="loading-container"><div class="loading"></div></div>`;

        try {
            const { data: tendencies, error } = await supabaseClient
                .from('tendencies')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            const tops = (tendencies || []).filter(t => t.type === 'top');
            const bottoms = (tendencies || []).filter(t => t.type === 'bottom');

            let gridHtml = `
                <div class="tendency-dual-wrapper">
                    <button class="list-toggle-btn" id="listToggleBtn" onclick="toggleTendencyList()">◀ 리스트 접기</button>
                    <div class="tendency-container" id="tendencyContainer">
                        <div class="tendency-list-panel" id="tendencyListPanel">
                            <div class="grid-header">
                                <div class="header-cell top">TOP</div>
                                <div class="header-cell bottom">BOTTOM</div>
                            </div>
                            <div class="comparison-grid">
            `;

            const maxRows = Math.max(tops.length, bottoms.length);
            for (let i = 0; i < maxRows; i++) {
                const topItem = tops[i];
                const bottomItem = bottoms[i];

                gridHtml += `
                    <div class="comparison-row">
                        <div class="tendency-cell top-cell ${topItem ? '' : 'empty'}" 
                             id="cell-${topItem?.id}"
                             onclick="showDetail('${topItem?.id}', 'top', 'cell-${bottomItem?.id}')">
                            <span class="cell-name">${topItem ? topItem.name : ''}</span>
                        </div>
                        <div class="tendency-cell bottom-cell ${bottomItem ? '' : 'empty'}" 
                             id="cell-${bottomItem?.id}"
                             onclick="showDetail('${bottomItem?.id}', 'bottom', 'cell-${topItem?.id}')">
                            <span class="cell-name">${bottomItem ? bottomItem.name : ''}</span>
                        </div>
                    </div>
                `;
            }

            gridHtml += `
                            </div>
                        </div>

                        <!-- Mobile Content Switcher Tabs -->
                        <div class="mobile-switcher" id="mobileSwitcher">
                            <button class="switch-tab active" onclick="switchMobileSlot('a')" id="tab-a">성향 A</button>
                            <button class="switch-tab" onclick="switchMobileSlot('b')" id="tab-b">성향 B</button>
                        </div>

                        <!-- Slot A -->
                        <div class="tendency-detail-panel slot-a" id="detailPanelA">
                            <button class="slot-clear-btn" onclick="clearSlot('a')">✕ 초기화</button>
                            <div class="detail-content" id="detailContentA">
                                <div class="detail-placeholder">
                                    <p>성향 A를 선택하세요.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Slot B -->
                        <div class="tendency-detail-panel slot-b" id="detailPanelB">
                            <button class="slot-clear-btn" onclick="clearSlot('b')">✕ 초기화</button>
                            <div class="detail-content" id="detailContentB">
                                <div class="detail-placeholder">
                                    <p>성향 B를 선택하세요.</p>
                                </div>
                            </div>
                        </div>

                        <button class="mobile-close-btn" onclick="closeDualOverlay()">✕ 닫기</button>
                    </div>
                </div>
            `;

            mainContent.innerHTML = gridHtml;
            window.tendencyData = tendencies;

            // Reset state
            window.dualSelected = { a: null, b: null, activeSlot: 'a' };

        } catch (error) {
            console.error('Tendencies load failed:', error);
            mainContent.innerHTML = `<p style="color:red">데이터 로딩 실패: ${error.message}</p>`;
        }
    }

    function getPlaceholderHtml(slot) {
        return `
            <div class="detail-placeholder">
                <p class="placeholder-text">성향 ${slot.toUpperCase()}를 선택하세요.</p>
                <div class="cta-rows">
                    <button class="cta-btn top" onclick="openSelector('${slot}', 'top')">⬆️ TOP 리스트 보기</button>
                    <button class="cta-btn bottom" onclick="openSelector('${slot}', 'bottom')">⬇️ BOTTOM 리스트 보기</button>
                </div>
            </div>
        `;
    }

    function formatDescription(text) {
        if (!text) return '';
        let formatted = text.replace(/【(.*?)】/g, '<strong>【$1】</strong>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    window.toggleTendencyList = function () {
        const wrapper = document.querySelector('.tendency-dual-wrapper');
        const btn = document.getElementById('listToggleBtn');
        if (wrapper.classList.toggle('list-collapsed')) {
            btn.textContent = '▶ 리스트 펼치기';
        } else {
            btn.textContent = '◀ 리스트 접기';
        }
    };

    window.openSelector = function (slot, typeFilter = null) {
        const overlay = document.getElementById(`selector${slot.toUpperCase()}`);
        if (!overlay) return;

        overlay.classList.add('active');
        renderSelectorContent(slot, typeFilter);
    };

    window.closeSelector = function (slot) {
        const overlay = document.getElementById(`selector${slot.toUpperCase()}`);
        if (overlay) overlay.classList.remove('active');
    };

    function renderSelectorContent(slot, typeFilter) {
        const overlay = document.getElementById(`selector${slot.toUpperCase()}`);
        const tendencies = window.tendencyData || [];

        const grouped = {
            top: tendencies.filter(t => t.type === 'top'),
            bottom: tendencies.filter(t => t.type === 'bottom'),
            etc: tendencies.filter(t => t.type !== 'top' && t.type !== 'bottom')
        };

        let html = `
            <div class="selector-header">
                <h3>성향 선택 (${slot.toUpperCase()})</h3>
                <button class="close-selector" onclick="closeSelector('${slot}')">✕</button>
            </div>
            <div class="selector-list">
        `;

        const renderGroup = (label, items, type) => {
            if (items.length === 0) return '';
            if (typeFilter && typeFilter !== type) return '';

            return `
                <div class="selector-group ${type}">
                    <div class="group-label">${label}</div>
                    ${items.map(item => `
                        <div class="selector-item" onclick="selectFromSelector('${slot}', '${item.id}', '${item.type}')">
                            ${item.name}
                        </div>
                    `).join('')}
                </div>
            `;
        };

        html += renderGroup('⬆️ TOP 성향', grouped.top, 'top');
        html += renderGroup('⬇️ BOTTOM 성향', grouped.bottom, 'bottom');
        html += renderGroup('📁 기타 성향', grouped.etc, 'etc');

        html += `</div>`;
        overlay.innerHTML = html;
    }

    window.selectFromSelector = function (slot, id, type) {
        showDetail(id, type, '', slot);
        closeSelector(slot);
    };

    window.showDetail = function (id, type, partnerCellId, forcedSlot = null) {
        if (!id) return;
        const item = window.tendencyData.find(t => t.id === id);
        if (!item) return;

        // Determine slot
        let slot = forcedSlot;
        if (!slot) {
            if (window.dualSelected.a && window.dualSelected.a.id !== id) {
                slot = 'b';
            } else {
                slot = 'a';
            }
        }

        // If already selected in a slot, just re-activate it
        if (window.dualSelected.a?.id === id) slot = 'a';
        if (window.dualSelected.b?.id === id) slot = 'b';

        window.dualSelected[slot] = { id, type, item, partnerCellId };
        window.dualSelected.activeSlot = slot;

        renderSlot(slot);
        updateHighlights();

        // Smart Logic: Suggest opposite if other slot is empty
        if (slot === 'a' && !window.dualSelected.b) {
            const oppositeType = type === 'top' ? 'bottom' : 'top';
            // Automatically open Slot B selector for the opposite type
            setTimeout(() => {
                if (!window.dualSelected.b) {
                    openSelector('b', oppositeType);
                }
            }, 600); // Slight delay for smooth flow
        }

        // Mobile Handling
        if (window.innerWidth <= 768) {
            document.getElementById('tendencyContainer').classList.add('mobile-overlay-active');
            document.body.style.overflow = 'hidden';
            switchMobileSlot(slot);
        }
    };

    function renderSlot(slot) {
        const data = window.dualSelected[slot];
        const panel = document.getElementById(`detailPanel${slot.toUpperCase()}`);
        const content = document.getElementById(`detailContent${slot.toUpperCase()}`);
        const tab = document.getElementById(`tab-${slot}`);

        if (!content) return;

        if (!data) {
            panel.classList.remove('has-content');
            content.innerHTML = getPlaceholderHtml(slot);
            if (tab) tab.textContent = `성향 ${slot.toUpperCase()}`;
            return;
        }

        panel.classList.add('has-content');
        if (tab) tab.textContent = data.item.name;

        content.innerHTML = `
            <div class="detail-view">
                <span class="detail-type-badge ${data.type}">${data.type.toUpperCase()}</span>
                <h2 class="detail-title">${data.item.name}</h2>
                <div class="detail-description">
                    ${formatDescription(data.item.description)}
                </div>
            </div>
        `;
        panel.scrollTop = 0;
    }

    function updateHighlights() {
        document.querySelectorAll('.tendency-cell').forEach(c => c.classList.remove('active-a', 'active-b', 'pair-a', 'pair-b'));

        if (window.dualSelected.a) {
            document.getElementById(`cell-${window.dualSelected.a.id}`)?.classList.add('active-a');
            document.getElementById(window.dualSelected.a.partnerCellId)?.classList.add('pair-a');
        }
        if (window.dualSelected.b) {
            document.getElementById(`cell-${window.dualSelected.b.id}`)?.classList.add('active-b');
            document.getElementById(window.dualSelected.b.partnerCellId)?.classList.add('pair-b');
        }
    }

    window.clearSlot = function (slot) {
        window.dualSelected[slot] = null;
        renderSlot(slot);
        updateHighlights();
    };

    window.switchMobileSlot = function (slot) {
        window.dualSelected.activeSlot = slot;
        document.querySelectorAll('.switch-tab').forEach(t => t.classList.remove('active'));
        document.getElementById(`tab-${slot}`)?.classList.add('active');

        const panelA = document.getElementById('detailPanelA');
        const panelB = document.getElementById('detailPanelB');

        if (slot === 'a') {
            panelA.style.display = 'flex';
            panelB.style.display = 'none';
        } else {
            panelA.style.display = 'none';
            panelB.style.display = 'flex';
        }
    };

    window.closeDualOverlay = function () {
        document.getElementById('tendencyContainer').classList.remove('mobile-overlay-active');
        document.body.style.overflow = '';
    };

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

    function initMobileMenu() {
        const menuToggle = document.getElementById('menuToggleBtn');
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (!menuToggle || !sidebar || !overlay) return;

        // 명시적으로 닫는 기능 추가
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

        // 카테고리 클릭 시 메뉴 닫기 (모바일 환경 1024px 미만)
        const categoryNav = document.getElementById('categoryNav');
        if (categoryNav) {
            categoryNav.addEventListener('click', (e) => {
                if (window.innerWidth < 1024 && (e.target.tagName === 'A' || e.target.closest('a'))) {
                    // 약간의 시간을 두어 사용자가 클릭 효과를 볼 수 있게 함
                    setTimeout(closeMenu, 150);
                }
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
        initMobileMenu();

        console.log('🎉 Initialization complete');
    });

})();
