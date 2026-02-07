// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - ADMIN SCRIPT (Simplified)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📱 Admin script loading...');

var supabaseAdmin = null;
let isConfigReady = false;

// Wait for config to load
function waitForConfig() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

// Show error message
function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
}

// Show admin panel
function showAdminPanel() {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
}

// Check authentication
async function checkAuth() {
    if (!supabaseAdmin) {
        console.log('⚠️ Supabase not ready for auth check');
        return;
    }
    
    try {
        const { data: { user }, error } = await supabaseAdmin.auth.getUser();
        
        if (error || !user) {
            console.log('❌ Not authenticated');
            return;
        }
        
        // Whitelist verification
        if (user.email !== window.ADMIN_EMAIL) {
            alert('관리자 권한이 없습니다.');
            await supabaseAdmin.auth.signOut();
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Admin authenticated:', user.email);
        showAdminPanel();
        
    } catch (error) {
        console.error('❌ Auth check failed:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM ready');
    
    // Wait for config
    await waitForConfig();
    
    // Initialize Supabase
    supabaseAdmin = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    
    isConfigReady = true;
    console.log('✅ Supabase initialized for admin');
    
    // Check if already logged in
    await checkAuth();
    
    // Setup login button
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (!loginBtn || !loginEmail || !loginPassword) {
        console.error('❌ Login elements not found');
        return;
    }
    
    console.log('✅ Login elements found');
    
    // Enter key listener
    [loginEmail, loginPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginBtn.click();
            }
        });
    });
    
    // Login button click
    loginBtn.addEventListener('click', async () => {
        console.log('🔘 Login button clicked');
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        
        console.log('📧 Email:', email);
        
        if (!email || !password) {
            showError('이메일과 비밀번호를 입력하세요');
            return;
        }
        
        if (!isConfigReady || !supabaseAdmin) {
            showError('시스템 초기화 중입니다. 잠시 후 다시 시도하세요.');
            return;
        }
        
        // Check if email is authorized
        if (email !== window.ADMIN_EMAIL) {
            showError(`관리자 권한이 없습니다. (허용: ${window.ADMIN_EMAIL})`);
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = '로그인 중...';
        
        try {
            console.log('🔐 Attempting login...');
            
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }
            
            console.log('✅ Login successful');
            showAdminPanel();
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            showError(error.message || '로그인 실패');
            loginBtn.disabled = false;
            loginBtn.textContent = '로그인';
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!confirm('로그아웃하시겠습니까?')) return;
            
            try {
                await supabaseAdmin.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('❌ Logout failed:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        });
    }
    
    console.log('🎉 Admin script initialized');
    
    // ═══════════════════════════════════════════════════
    // HOME SCREEN EDITOR
    // ═══════════════════════════════════════════════════
    
    // Load home screen settings
    async function loadHomeSettings() {
        try {
            const { data, error } = await supabaseAdmin
                .from('settings')
                .select('*')
                .in('key', ['home_title', 'home_subtitle', 'home_content', 'show_recent_posts', 'recent_posts_count']);
            
            if (error) throw error;
            
            const settings = {};
            data.forEach(item => {
                settings[item.key] = item.value;
            });
            
            document.getElementById('homeTitle').value = settings.home_title || '환영합니다';
            document.getElementById('homeSubtitle').value = settings.home_subtitle || 'SMALLSM Archive에 오신 것을 환영합니다';
            document.getElementById('homeContent').value = settings.home_content || '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.\n\n이곳은 성향과 실천, 그리고 깊이 있는 사색이 담긴 공간입니다.';
            document.getElementById('showRecentPosts').checked = settings.show_recent_posts === 'true';
            document.getElementById('recentPostsCount').value = settings.recent_posts_count || '3';
            
            // Show/hide recent posts count
            toggleRecentPostsCount();
            
        } catch (error) {
            console.error('홈 설정 로딩 실패:', error);
        }
    }
    
    // Toggle recent posts count visibility
    function toggleRecentPostsCount() {
        const checkbox = document.getElementById('showRecentPosts');
        const countGroup = document.getElementById('recentPostsCountGroup');
        countGroup.style.display = checkbox.checked ? 'block' : 'none';
    }
    
    document.getElementById('showRecentPosts').addEventListener('change', toggleRecentPostsCount);
    
    // Save home screen settings
    document.getElementById('saveHomeBtn').addEventListener('click', async () => {
        try {
            const settings = [
                { key: 'home_title', value: document.getElementById('homeTitle').value },
                { key: 'home_subtitle', value: document.getElementById('homeSubtitle').value },
                { key: 'home_content', value: document.getElementById('homeContent').value },
                { key: 'show_recent_posts', value: document.getElementById('showRecentPosts').checked.toString() },
                { key: 'recent_posts_count', value: document.getElementById('recentPostsCount').value }
            ];
            
            for (const setting of settings) {
                const { error } = await supabaseAdmin
                    .from('settings')
                    .upsert({ 
                        key: setting.key, 
                        value: setting.value,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });
                
                if (error) throw error;
            }
            
            alert('홈화면 설정이 저장되었습니다!');
            
        } catch (error) {
            console.error('홈 설정 저장 실패:', error);
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        }
    });
    
    // ═══════════════════════════════════════════════════
    // CATEGORY MANAGEMENT
    // ═══════════════════════════════════════════════════
    
    // Load categories
    async function loadCategories() {
        try {
            const { data: categories, error } = await supabaseAdmin
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            const container = document.getElementById('categoryList');
            container.innerHTML = '';
            
            categories.forEach((cat, index) => {
                const catDiv = document.createElement('div');
                catDiv.className = 'category-item-admin';
                catDiv.setAttribute('data-id', cat.id);
                catDiv.setAttribute('data-order', cat.display_order);
                catDiv.style.cssText = 'margin-bottom: 1rem; padding: 1.5rem; background: rgba(206, 177, 128, 0.08); border: 1px solid var(--glass-border); border-radius: 8px; cursor: move;';
                
                catDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <span style="cursor: grab; color: var(--text-secondary); font-size: 1.2rem;">⋮⋮</span>
                        <strong style="flex: 1; color: var(--primary-brass); font-size: 1.1rem;">${cat.name}</strong>
                        <button class="editor-btn" onclick="editCategoryName('${cat.id}', '${cat.name}')" style="padding: 0.4rem 0.8rem;">
                            ✏️ 수정
                        </button>
                        <button class="editor-btn" onclick="deleteCategory('${cat.id}', '${cat.name}')" style="padding: 0.4rem 0.8rem; background: rgba(220, 53, 69, 0.1); border-color: rgba(220, 53, 69, 0.3);">
                            🗑️ 삭제
                        </button>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; padding: 1rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
                        <div>
                            <label style="display: block; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">공개 설정</label>
                            <div style="display: flex; gap: 1rem;">
                                <label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                                    <input type="radio" name="visible_${cat.id}" value="true" ${cat.is_visible ? 'checked' : ''} onchange="updateCategoryVisibility('${cat.id}', true)">
                                    <span style="color: var(--text-primary);">공개</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                                    <input type="radio" name="visible_${cat.id}" value="false" ${!cat.is_visible ? 'checked' : ''} onchange="updateCategoryVisibility('${cat.id}', false)">
                                    <span style="color: var(--text-primary);">비공개</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label style="display: block; color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">드롭다운 설정</label>
                            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                                <label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                                    <input type="checkbox" id="dropdown_${cat.id}" ${cat.has_dropdown ? 'checked' : ''} onchange="updateCategoryDropdown('${cat.id}', this.checked)">
                                    <span style="color: var(--text-primary);">드롭다운 사용</span>
                                </label>
                                <div id="dropdown_options_${cat.id}" style="margin-left: 1.5rem; ${cat.has_dropdown ? '' : 'display: none;'}">
                                    <label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                                        <input type="radio" name="default_open_${cat.id}" value="true" ${cat.default_open ? 'checked' : ''} onchange="updateCategoryDefaultOpen('${cat.id}', true)">
                                        <span style="color: var(--text-primary); font-size: 0.9rem;">기본 열림</span>
                                    </label>
                                    <label style="display: flex; align-items: center; gap: 0.3rem; cursor: pointer;">
                                        <input type="radio" name="default_open_${cat.id}" value="false" ${!cat.default_open ? 'checked' : ''} onchange="updateCategoryDefaultOpen('${cat.id}', false)">
                                        <span style="color: var(--text-primary); font-size: 0.9rem;">기본 닫힘</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                container.appendChild(catDiv);
            });
            
            // Initialize drag and drop
            initDragAndDrop();
            
            // Load categories for post select
            loadCategoryOptions();
            
        } catch (error) {
            console.error('카테고리 로딩 실패:', error);
        }
    }
    
    // Add new category
    document.getElementById('addCategoryBtn').addEventListener('click', async () => {
        const name = document.getElementById('newCategoryName').value.trim();
        
        if (!name) {
            alert('카테고리 이름을 입력하세요.');
            return;
        }
        
        try {
            // Get max display_order
            const { data: categories } = await supabaseAdmin
                .from('categories')
                .select('display_order')
                .order('display_order', { ascending: false })
                .limit(1);
            
            const maxOrder = categories && categories.length > 0 ? categories[0].display_order : 0;
            
            const { error } = await supabaseAdmin
                .from('categories')
                .insert([{
                    name: name,
                    is_visible: true,
                    has_dropdown: true,
                    default_open: false,
                    display_order: maxOrder + 1
                }]);
            
            if (error) throw error;
            
            document.getElementById('newCategoryName').value = '';
            alert('카테고리가 추가되었습니다!');
            loadCategories();
            
        } catch (error) {
            console.error('카테고리 추가 실패:', error);
            alert('추가 중 오류가 발생했습니다: ' + error.message);
        }
    });
    
    // Update category visibility
    window.updateCategoryVisibility = async (id, isVisible) => {
        try {
            const { error } = await supabaseAdmin
                .from('categories')
                .update({ is_visible: isVisible })
                .eq('id', id);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('가시성 업데이트 실패:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        }
    };
    
    // Update category dropdown
    window.updateCategoryDropdown = async (id, hasDropdown) => {
        try {
            const { error } = await supabaseAdmin
                .from('categories')
                .update({ has_dropdown: hasDropdown })
                .eq('id', id);
            
            if (error) throw error;
            
            // Show/hide dropdown options
            const optionsDiv = document.getElementById(`dropdown_options_${id}`);
            if (optionsDiv) {
                optionsDiv.style.display = hasDropdown ? 'block' : 'none';
            }
            
        } catch (error) {
            console.error('드롭다운 업데이트 실패:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        }
    };
    
    // Update category default open
    window.updateCategoryDefaultOpen = async (id, defaultOpen) => {
        try {
            const { error } = await supabaseAdmin
                .from('categories')
                .update({ default_open: defaultOpen })
                .eq('id', id);
            
            if (error) throw error;
            
        } catch (error) {
            console.error('기본 상태 업데이트 실패:', error);
            alert('업데이트 중 오류가 발생했습니다.');
        }
    };
    
    // Edit category name
    window.editCategoryName = async (id, currentName) => {
        const newName = prompt('새 카테고리 이름:', currentName);
        
        if (!newName || newName === currentName) return;
        
        try {
            const { error } = await supabaseAdmin
                .from('categories')
                .update({ name: newName })
                .eq('id', id);
            
            if (error) throw error;
            
            alert('카테고리 이름이 변경되었습니다!');
            loadCategories();
            
        } catch (error) {
            console.error('이름 변경 실패:', error);
            alert('변경 중 오류가 발생했습니다: ' + error.message);
        }
    };
    
    // Delete category
    window.deleteCategory = async (id, name) => {
        // Check if there are posts
        try {
            const { data: posts, error: countError } = await supabaseAdmin
                .from('archive_posts')
                .select('id', { count: 'exact', head: true })
                .eq('category_id', id);
            
            if (countError) throw countError;
            
            const postCount = posts ? posts.length : 0;
            
            if (postCount > 0) {
                // Has posts - show options
                const action = confirm(`⚠️ "${name}" 카테고리에 ${postCount}개의 게시물이 있습니다.\n\n확인: 게시물도 함께 삭제 (복구 불가)\n취소: 작업 취소`);
                
                if (!action) return;
                
                // Delete posts first
                const { error: deletePostsError } = await supabaseAdmin
                    .from('archive_posts')
                    .delete()
                    .eq('category_id', id);
                
                if (deletePostsError) throw deletePostsError;
            } else {
                if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
            }
            
            // Delete category
            const { error } = await supabaseAdmin
                .from('categories')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            alert('카테고리가 삭제되었습니다!');
            loadCategories();
            
        } catch (error) {
            console.error('삭제 실패:', error);
            alert('삭제 중 오류가 발생했습니다: ' + error.message);
        }
    };
    
    // Drag and drop for reordering
    function initDragAndDrop() {
        const container = document.getElementById('categoryList');
        let draggedElement = null;
        
        container.querySelectorAll('.category-item-admin').forEach(item => {
            item.setAttribute('draggable', true);
            
            item.addEventListener('dragstart', (e) => {
                draggedElement = item;
                item.style.opacity = '0.5';
            });
            
            item.addEventListener('dragend', (e) => {
                item.style.opacity = '1';
            });
            
            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                const afterElement = getDragAfterElement(container, e.clientY);
                if (afterElement == null) {
                    container.appendChild(draggedElement);
                } else {
                    container.insertBefore(draggedElement, afterElement);
                }
            });
            
            item.addEventListener('drop', async (e) => {
                e.preventDefault();
                await updateCategoryOrder();
            });
        });
    }
    
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.category-item-admin:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
    
    async function updateCategoryOrder() {
        const items = document.querySelectorAll('.category-item-admin');
        const updates = [];
        
        items.forEach((item, index) => {
            const id = item.getAttribute('data-id');
            updates.push({
                id: id,
                display_order: index + 1
            });
        });
        
        try {
            for (const update of updates) {
                const { error } = await supabaseAdmin
                    .from('categories')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id);
                
                if (error) throw error;
            }
            
            console.log('✅ 카테고리 순서 업데이트 완료');
            
        } catch (error) {
            console.error('순서 업데이트 실패:', error);
            alert('순서 업데이트 중 오류가 발생했습니다.');
        }
    }
    
    // Load categories for post select dropdown
    async function loadCategoryOptions() {
        try {
            const { data: categories, error } = await supabaseAdmin
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });
            
            if (error) throw error;
            
            const select = document.getElementById('postCategory');
            select.innerHTML = '<option value="">카테고리 선택</option>';
            
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                select.appendChild(option);
            });
            
        } catch (error) {
            console.error('카테고리 옵션 로딩 실패:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════
    // SECTION TOGGLE
    // ═══════════════════════════════════════════════════
    
    window.toggleSection = function(sectionId) {
        const content = document.getElementById(sectionId + 'Content');
        const toggle = document.getElementById(sectionId + 'Toggle');
        
        if (content.style.display === 'none') {
            content.style.display = 'block';
            toggle.textContent = '▲';
        } else {
            content.style.display = 'none';
            toggle.textContent = '▼';
        }
    };
    
    // Load initial data after admin panel shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.target.id === 'adminPanel' && mutation.target.style.display === 'block') {
                loadHomeSettings();
                loadCategories();
                observer.disconnect();
            }
        });
    });
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        observer.observe(adminPanel, { attributes: true, attributeFilter: ['style'] });
    }
});
