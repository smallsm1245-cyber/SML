// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - MAIN SCRIPT (Clean Version)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

(function() {
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
    async function loadCategories() {
        if (!supabaseClient) {
            console.warn('⚠️ Supabase not initialized');
            return;
        }
        
        try {
            const { data: categories, error } = await supabaseClient
                .from('categories')
                .select('*')
                .eq('is_visible', true)
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            const nav = document.getElementById('categoryNav');
            if (!nav) return;
            
            nav.innerHTML = '';
            
            categories.forEach(category => {
                const li = document.createElement('li');
                li.className = 'category-item';
                
                const link = document.createElement('a');
                link.href = `#category-${category.id}`;
                link.className = 'category-link';
                link.textContent = category.name;
                link.dataset.categoryId = category.id;
                
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    loadPostsByCategory(category.id);
                    
                    document.querySelectorAll('.category-link').forEach(l => {
                        l.classList.remove('active');
                    });
                    link.classList.add('active');
                });
                
                li.appendChild(link);
                nav.appendChild(li);
            });
            
            console.log('✅ Categories loaded');
            
        } catch (error) {
            console.error('❌ Category loading failed:', error);
        }
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
                loadCategories();
                initSearch();
            });
        }
        
        initNightMode();
        
        console.log('🎉 Initialization complete');
    });
    
})();
