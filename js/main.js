 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/js/main.js b/js/main.js
index 074034c41becade77728680c90dea9330f3d0527..be2c7605423698af91efc72321c6bb8ae0f8d54d 100644
--- a/js/main.js
+++ b/js/main.js
@@ -1,354 +1,348 @@
-// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
-// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-
-(function() {
-    'use strict';
-    
-    console.log('🚀 SMALLSM Archive initializing...');
-    
-    // ═══════════════════════════════════════════════════
-    // 1. GLOBALS
-    // ═══════════════════════════════════════════════════
-    let supabaseClient = null;
-    const VERIFICATION_KEY = 'age_verified';
-    const VERIFICATION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
-    const NIGHT_MODE_KEY = 'night_mode';
-    
-    // ═══════════════════════════════════════════════════
-    // 2. SUPABASE INITIALIZATION
-    // ═══════════════════════════════════════════════════
-    function initializeSupabase() {
-        try {
-            if (!window.supabase) {
-                console.error('❌ Supabase library not loaded');
-                return false;
-            }
-            
-            if (!window.SUPABASE_CONFIG || !window.SUPABASE_CONFIG.url) {
-                console.error('❌ Supabase config not found');
-                return false;
-            }
-            
-            supabaseClient = window.supabase.createClient(
-                window.SUPABASE_CONFIG.url,
-                window.SUPABASE_CONFIG.anonKey
-            );
-            
-            console.log('✅ Supabase initialized');
-            return true;
-        } catch (error) {
-            console.error('❌ Supabase init failed:', error);
-            return false;
-        }
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 3. AGE VERIFICATION
-    // ═══════════════════════════════════════════════════
-    function checkAgeVerification() {
-        const verified = localStorage.getItem(VERIFICATION_KEY);
-        
-        if (verified) {
-            const timestamp = parseInt(verified);
-            const now = Date.now();
-            
-            if (now - timestamp < VERIFICATION_DURATION) {
-                hideDisclaimer();
-                return true;
-            }
-        }
-        
-        showDisclaimer();
-        return false;
-    }
-    
-    function showDisclaimer() {
-        const overlay = document.getElementById('disclaimerOverlay');
-        const container = document.getElementById('appContainer');
-        
-        if (overlay) overlay.style.display = 'flex';
-        if (container) container.classList.add('content-blur');
-    }
-    
-    function hideDisclaimer() {
-        const overlay = document.getElementById('disclaimerOverlay');
-        const container = document.getElementById('appContainer');
-        
-        if (overlay) overlay.style.display = 'none';
-        if (container) container.classList.remove('content-blur');
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 4. CATEGORY LOADING
-    // ═══════════════════════════════════════════════════
-    async function loadCategories() {
-        if (!supabaseClient) {
-            console.warn('⚠️ Supabase not initialized');
-            return;
-        }
-        
-        try {
-            const { data: categories, error } = await supabaseClient
-                .from('categories')
-                .select('*')
-                .eq('is_visible', true)
-                .order('display_order', { ascending: true });
-            
-            if (error) throw error;
-            
-            const nav = document.getElementById('categoryNav');
-            if (!nav) return;
-            
-            nav.innerHTML = '';
-            
-            categories.forEach(category => {
-                const li = document.createElement('li');
-                li.className = 'category-item';
-                
-                const link = document.createElement('a');
-                link.href = `#category-${category.id}`;
-                link.className = 'category-link';
-                link.textContent = category.name;
-                link.dataset.categoryId = category.id;
-                
-                link.addEventListener('click', (e) => {
-                    e.preventDefault();
-                    loadPostsByCategory(category.id);
-                    
-                    document.querySelectorAll('.category-link').forEach(l => {
-                        l.classList.remove('active');
-                    });
-                    link.classList.add('active');
-                });
-                
-                li.appendChild(link);
-                nav.appendChild(li);
-            });
-            
-            console.log('✅ Categories loaded');
-            
-        } catch (error) {
-            console.error('❌ Category loading failed:', error);
-        }
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 5. POST LOADING BY CATEGORY
-    // ═══════════════════════════════════════════════════
-    async function loadPostsByCategory(categoryId) {
-        if (!supabaseClient) return;
-        
-        try {
-            const { data: { user } } = await supabaseClient.auth.getUser();
-            const isAdmin = user && user.email === window.ADMIN_EMAIL;
-            
-            let query = supabaseClient
-                .from('archive_posts')
-                .select('*')
-                .eq('category_id', categoryId)
-                .order('created_at', { ascending: false });
-            
-            if (!isAdmin) {
-                query = query.eq('is_private', false);
-            }
-            
-            const { data: posts, error } = await query;
-            
-            if (error) throw error;
-            
-            const content = document.getElementById('mainContent');
-            const title = document.getElementById('welcomeTitle');
-            
-            if (!content || !title) return;
-            
-            if (posts.length === 0) {
-                title.textContent = '게시물 없음';
-                content.innerHTML = '<p>이 카테고리에는 아직 게시물이 없습니다.</p>';
-                return;
-            }
-            
-            const { data: category } = await supabaseClient
-                .from('categories')
-                .select('name')
-                .eq('id', categoryId)
-                .single();
-            
-            title.textContent = category.name;
-            
-            content.innerHTML = posts.map(post => `
-                <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
-                    <h3>
-                        <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
-                            ${post.title}
-                            ${post.is_private ? '<span style="font-size: 0.8em; color: var(--accent-amber);"> 🔒</span>' : ''}
-                        </a>
-                    </h3>
-                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
-                        ${new Date(post.created_at).toLocaleDateString('ko-KR')}
-                    </p>
-                </div>
-            `).join('');
-            
-        } catch (error) {
-            console.error('❌ Post loading failed:', error);
-        }
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 6. SEARCH FUNCTIONALITY
-    // ═══════════════════════════════════════════════════
-    let searchTimeout;
-    
-    function initSearch() {
-        const searchInput = document.getElementById('searchInput');
-        if (!searchInput) return;
-        
-        searchInput.addEventListener('input', (e) => {
-            clearTimeout(searchTimeout);
-            
-            searchTimeout = setTimeout(async () => {
-                const query = e.target.value.trim();
-                
-                if (query.length < 2) return;
-                
-                try {
-                    const { data: { user } } = await supabaseClient.auth.getUser();
-                    const isAdmin = user && user.email === window.ADMIN_EMAIL;
-                    
-                    let searchQuery = supabaseClient
-                        .from('archive_posts')
-                        .select('id, title, created_at, category_id')
-                        .ilike('title', `%${query}%`)
-                        .order('created_at', { ascending: false })
-                        .limit(10);
-                    
-                    if (!isAdmin) {
-                        searchQuery = searchQuery.eq('is_private', false);
-                    }
-                    
-                    const { data: results, error } = await searchQuery;
-                    
-                    if (error) throw error;
-                    
-                    displaySearchResults(results);
-                    
-                } catch (error) {
-                    console.error('❌ Search failed:', error);
-                }
-            }, 300);
-        });
-    }
-    
-    function displaySearchResults(results) {
-        const content = document.getElementById('mainContent');
-        const title = document.getElementById('welcomeTitle');
-        
-        if (!content || !title) return;
-        
-        title.textContent = '검색 결과';
-        
-        if (results.length === 0) {
-            content.innerHTML = '<p>검색 결과가 없습니다.</p>';
-            return;
-        }
-        
-        content.innerHTML = results.map(post => `
-            <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
-                <h3>
-                    <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
-                        ${post.title}
-                    </a>
-                </h3>
-                <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
-                    ${new Date(post.created_at).toLocaleDateString('ko-KR')}
-                </p>
-            </div>
-        `).join('');
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 7. NIGHT MODE
-    // ═══════════════════════════════════════════════════
-    function initNightMode() {
-        const modeToggle = document.getElementById('modeToggle');
-        if (!modeToggle) return;
-        
-        const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';
-        
-        if (isNightMode) {
-            document.body.classList.add('night-mode');
-            modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
-        }
-        
-        modeToggle.addEventListener('click', () => {
-            const nightMode = document.body.classList.toggle('night-mode');
-            localStorage.setItem(NIGHT_MODE_KEY, nightMode);
-            
-            if (nightMode) {
-                modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
-            } else {
-                modeToggle.innerHTML = '<span>🌙</span><span>Night Library</span>';
-            }
-        });
-    }
-    
-    // ═══════════════════════════════════════════════════
-    // 8. INITIALIZATION
-    // ═══════════════════════════════════════════════════
-    function waitForConfig(callback, maxWait = 5000) {
-        const startTime = Date.now();
-        const interval = setInterval(() => {
-            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
-                clearInterval(interval);
-                callback();
-            } else if (Date.now() - startTime > maxWait) {
-                clearInterval(interval);
-                console.error('⏱️ Config loading timeout');
-            }
-        }, 100);
-    }
-    
-    document.addEventListener('DOMContentLoaded', () => {
-        console.log('📱 DOM ready');
-        
-        // Yes button
-        const btnYes = document.getElementById('btnYes');
-        if (btnYes) {
-            btnYes.addEventListener('click', () => {
-                console.log('✅ Yes clicked');
-                localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
-                hideDisclaimer();
-                
-                waitForConfig(() => {
-                    initializeSupabase();
-                    loadCategories();
-                    initSearch();
-                });
-            });
-        }
-        
-        // No button
-        const btnNo = document.getElementById('btnNo');
-        if (btnNo) {
-            btnNo.addEventListener('click', () => {
-                console.log('❌ No clicked');
-                window.location.href = 'https://www.google.com';
-            });
-        }
-        
-        // Check verification
-        if (checkAgeVerification()) {
-            waitForConfig(() => {
-                initializeSupabase();
-                loadCategories();
-                initSearch();
-            });
-        }
-        
-        initNightMode();
-        
-        console.log('🎉 Initialization complete');
-    });
-    
-})();
+// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
+// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+
+(function() {
+    'use strict';
+
+    let supabaseClient = null;
+    const VERIFICATION_KEY = 'age_verified';
+    const VERIFICATION_DURATION = 24 * 60 * 60 * 1000;
+    const NIGHT_MODE_KEY = 'night_mode';
+
+    function initializeSupabase() {
+        if (!window.supabase || !window.SUPABASE_CONFIG?.url) return false;
+        supabaseClient = window.supabase.createClient(
+            window.SUPABASE_CONFIG.url,
+            window.SUPABASE_CONFIG.anonKey,
+        );
+        return true;
+    }
+
+    function showDisclaimer() {
+        document.getElementById('disclaimerOverlay')?.style.setProperty('display', 'flex');
+        document.getElementById('appContainer')?.classList.add('content-blur');
+    }
+
+    function hideDisclaimer() {
+        document.getElementById('disclaimerOverlay')?.style.setProperty('display', 'none');
+        document.getElementById('appContainer')?.classList.remove('content-blur');
+    }
+
+    function checkAgeVerification() {
+        const verified = localStorage.getItem(VERIFICATION_KEY);
+        if (verified) {
+            const now = Date.now();
+            if (now - Number(verified) < VERIFICATION_DURATION) {
+                hideDisclaimer();
+                return true;
+            }
+        }
+        showDisclaimer();
+        return false;
+    }
+
+    async function loadHomeSettings() {
+        const titleEl = document.getElementById('welcomeTitle');
+        const metaEl = document.querySelector('.post-meta span');
+        const bodyEl = document.getElementById('mainContent');
+        if (!titleEl || !metaEl || !bodyEl || !supabaseClient) return;
+
+        try {
+            const { data, error } = await supabaseClient
+                .from('site_settings')
+                .select('*')
+                .eq('id', 'home')
+                .maybeSingle();
+
+            if (error) throw error;
+
+            if (data?.welcome_title) titleEl.textContent = data.welcome_title;
+            if (data?.welcome_subtitle) metaEl.textContent = data.welcome_subtitle;
+            if (data?.welcome_body) {
+                bodyEl.innerHTML = data.welcome_body.split('\n').map((line) => `<p>${line}</p>`).join('');
+            }
+        } catch (error) {
+            const localTitle = localStorage.getItem('admin_home_title');
+            const localSubtitle = localStorage.getItem('admin_home_subtitle');
+            const localBody = localStorage.getItem('admin_home_body');
+
+            if (localTitle) titleEl.textContent = localTitle;
+            if (localSubtitle) metaEl.textContent = localSubtitle;
+            if (localBody) bodyEl.innerHTML = localBody.split('\n').map((line) => `<p>${line}</p>`).join('');
+        }
+    }
+
+    function normalizedCategory(cat) {
+        return {
+            ...cat,
+            dropdown_enabled: cat.dropdown_enabled ?? false,
+            dropdown_default_open: cat.dropdown_default_open ?? false,
+        };
+    }
+
+    async function loadCategoryPostsForDropdown(categoryId, container) {
+        const { data: { user } } = await supabaseClient.auth.getUser();
+        const isAdmin = user && user.email === window.ADMIN_EMAIL;
+
+        let query = supabaseClient
+            .from('archive_posts')
+            .select('id, title, is_private')
+            .eq('category_id', categoryId)
+            .order('created_at', { ascending: false })
+            .limit(15);
+
+        if (!isAdmin) query = query.eq('is_private', false);
+
+        const { data, error } = await query;
+        if (error) throw error;
+
+        if (!data?.length) {
+            container.innerHTML = '<li style="color:var(--text-secondary); font-size:0.85rem;">게시물 없음</li>';
+            return;
+        }
+
+        container.innerHTML = data.map((post) => `
+            <li>
+                <a href="post.html?id=${post.id}" class="category-link" style="font-size:0.85rem; padding:0.35rem 0.5rem;">
+                    - ${post.title}${post.is_private ? ' 🔒' : ''}
+                </a>
+            </li>
+        `).join('');
+    }
+
+    async function loadCategories() {
+        if (!supabaseClient) return;
+
+        const { data, error } = await supabaseClient
+            .from('categories')
+            .select('*')
+            .eq('is_visible', true)
+            .order('display_order', { ascending: true });
+
+        if (error) {
+            console.error('❌ Category loading failed:', error);
+            return;
+        }
+
+        const nav = document.getElementById('categoryNav');
+        if (!nav) return;
+        nav.innerHTML = '';
+
+        data.map(normalizedCategory).forEach((category) => {
+            const li = document.createElement('li');
+            li.className = 'category-item';
+
+            if (!category.dropdown_enabled) {
+                const link = document.createElement('a');
+                link.href = `#category-${category.id}`;
+                link.className = 'category-link';
+                link.textContent = category.name;
+                link.addEventListener('click', async (e) => {
+                    e.preventDefault();
+                    await loadPostsByCategory(category.id);
+                    document.querySelectorAll('.category-link').forEach((l) => l.classList.remove('active'));
+                    link.classList.add('active');
+                });
+                li.appendChild(link);
+                nav.appendChild(li);
+                return;
+            }
+
+            const button = document.createElement('button');
+            button.className = 'category-link';
+            button.style.width = '100%';
+            button.style.textAlign = 'left';
+            button.style.background = 'transparent';
+            button.style.border = 'none';
+            button.innerHTML = `${category.name} <span style="float:right;">${category.dropdown_default_open ? '▲' : '▼'}</span>`;
+
+            const list = document.createElement('ul');
+            list.style.listStyle = 'none';
+            list.style.margin = '0.25rem 0 0 0.5rem';
+            list.style.padding = '0';
+            list.hidden = !category.dropdown_default_open;
+
+            const openList = async () => {
+                if (!list.dataset.loaded) {
+                    await loadCategoryPostsForDropdown(category.id, list);
+                    list.dataset.loaded = '1';
+                }
+            };
+
+            if (category.dropdown_default_open) openList();
+
+            button.addEventListener('click', async () => {
+                list.hidden = !list.hidden;
+                button.querySelector('span').textContent = list.hidden ? '▼' : '▲';
+                if (!list.hidden) await openList();
+            });
+
+            li.appendChild(button);
+            li.appendChild(list);
+            nav.appendChild(li);
+        });
+    }
+
+    async function loadPostsByCategory(categoryId) {
+        try {
+            const { data: { user } } = await supabaseClient.auth.getUser();
+            const isAdmin = user && user.email === window.ADMIN_EMAIL;
+
+            let query = supabaseClient
+                .from('archive_posts')
+                .select('*')
+                .eq('category_id', categoryId)
+                .order('created_at', { ascending: false });
+
+            if (!isAdmin) query = query.eq('is_private', false);
+
+            const { data: posts, error } = await query;
+            if (error) throw error;
+
+            const content = document.getElementById('mainContent');
+            const title = document.getElementById('welcomeTitle');
+            if (!content || !title) return;
+
+            if (!posts.length) {
+                title.textContent = '게시물 없음';
+                content.innerHTML = '<p>이 카테고리에는 아직 게시물이 없습니다.</p>';
+                return;
+            }
+
+            const { data: category } = await supabaseClient
+                .from('categories')
+                .select('name')
+                .eq('id', categoryId)
+                .single();
+
+            title.textContent = category?.name || '카테고리';
+            content.innerHTML = posts.map((post) => `
+                <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
+                    <h3>
+                        <a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">
+                            ${post.title}${post.is_private ? '<span style="font-size:0.8em; color:var(--accent-amber);"> 🔒</span>' : ''}
+                        </a>
+                    </h3>
+                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
+                        ${new Date(post.created_at).toLocaleDateString('ko-KR')}
+                    </p>
+                </div>
+            `).join('');
+        } catch (error) {
+            console.error('❌ Post loading failed:', error);
+        }
+    }
+
+    function initSearch() {
+        const searchInput = document.getElementById('searchInput');
+        if (!searchInput) return;
+
+        let timer;
+        searchInput.addEventListener('input', (e) => {
+            clearTimeout(timer);
+            timer = setTimeout(async () => {
+                const q = e.target.value.trim();
+                if (q.length < 2) return;
+
+                const { data: { user } } = await supabaseClient.auth.getUser();
+                const isAdmin = user && user.email === window.ADMIN_EMAIL;
+
+                let query = supabaseClient
+                    .from('archive_posts')
+                    .select('id, title, created_at')
+                    .ilike('title', `%${q}%`)
+                    .order('created_at', { ascending: false })
+                    .limit(10);
+
+                if (!isAdmin) query = query.eq('is_private', false);
+
+                const { data, error } = await query;
+                if (error) return;
+
+                const content = document.getElementById('mainContent');
+                const title = document.getElementById('welcomeTitle');
+                title.textContent = '검색 결과';
+
+                if (!data.length) {
+                    content.innerHTML = '<p>검색 결과가 없습니다.</p>';
+                    return;
+                }
+
+                content.innerHTML = data.map((post) => `
+                    <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--glass-border);">
+                        <h3><a href="post.html?id=${post.id}" style="color: var(--primary-brass); text-decoration: none;">${post.title}</a></h3>
+                        <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">
+                            ${new Date(post.created_at).toLocaleDateString('ko-KR')}
+                        </p>
+                    </div>
+                `).join('');
+            }, 300);
+        });
+    }
+
+    function initNightMode() {
+        const modeToggle = document.getElementById('modeToggle');
+        if (!modeToggle) return;
+
+        const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';
+        if (isNightMode) {
+            document.body.classList.add('night-mode');
+            modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
+        }
+
+        modeToggle.addEventListener('click', () => {
+            const nightMode = document.body.classList.toggle('night-mode');
+            localStorage.setItem(NIGHT_MODE_KEY, String(nightMode));
+            modeToggle.innerHTML = nightMode
+                ? '<span>☀️</span><span>Day Mode</span>'
+                : '<span>🌙</span><span>Night Library</span>';
+        });
+    }
+
+    function waitForConfig(callback, maxWait = 5000) {
+        const started = Date.now();
+        const timer = setInterval(() => {
+            if (window.SUPABASE_CONFIG?.url) {
+                clearInterval(timer);
+                callback();
+                return;
+            }
+            if (Date.now() - started > maxWait) {
+                clearInterval(timer);
+                console.error('⏱️ Config loading timeout');
+            }
+        }, 100);
+    }
+
+    document.addEventListener('DOMContentLoaded', () => {
+        const btnYes = document.getElementById('btnYes');
+        const btnNo = document.getElementById('btnNo');
+
+        btnYes?.addEventListener('click', () => {
+            localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
+            hideDisclaimer();
+            waitForConfig(async () => {
+                if (!initializeSupabase()) return;
+                await loadHomeSettings();
+                await loadCategories();
+                initSearch();
+            });
+        });
+
+        btnNo?.addEventListener('click', () => {
+            window.location.href = 'https://www.google.com';
+        });
+
+        if (checkAgeVerification()) {
+            waitForConfig(async () => {
+                if (!initializeSupabase()) return;
+                await loadHomeSettings();
+                await loadCategories();
+                initSearch();
+            });
+        }
+
+        initNightMode();
+    });
+})();
 
EOF
)
