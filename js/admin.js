// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD (Complete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Wiki Dashboard loading...');

let supabaseClient = null;
let hasUnsavedChanges = false;

// ═══════════════════════════════════════════════════
// WAIT FOR CONFIG
// ═══════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════
// SHOW ERROR
// ═══════════════════════════════════════════════════
function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 3000);
    }
}

// ═══════════════════════════════════════════════════
// AUTHENTICATION
// ═══════════════════════════════════════════════════
async function checkAuth() {
    if (!supabaseClient) return false;
    
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        
        if (error || !user) return false;
        
        if (user.email !== window.ADMIN_EMAIL) {
            await supabaseClient.auth.signOut();
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Auth check failed:', error);
        return false;
    }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    // Load all data
    await Promise.all([
        loadStatistics(),
        loadRecentActivity(),
        loadHomeSettings(),
        loadCategories(),
        loadPosts()
    ]);
}

// ═══════════════════════════════════════════════════
// SECTION SWITCHING
// ═══════════════════════════════════════════════════
window.switchSection = function(sectionName) {
    // Check unsaved changes
    if (hasUnsavedChanges) {
        if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 이동하시겠습니까?')) {
            return;
        }
        hasUnsavedChanges = false;
    }
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // Show selected section
    document.getElementById(`section-${sectionName}`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
};

// ═══════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════
async function loadStatistics() {
    try {
        const { data: posts } = await supabaseClient.from('archive_posts').select('id, is_private');
        const { data: categories } = await supabaseClient.from('categories').select('id');
        
        const total = posts ? posts.length : 0;
        const publicPosts = posts ? posts.filter(p => !p.is_private).length : 0;
        const privatePosts = total - publicPosts;
        const catCount = categories ? categories.length : 0;
        
        document.getElementById('statTotalPosts').textContent = total;
        document.getElementById('statPublicPosts').textContent = publicPosts;
        document.getElementById('statPrivatePosts').textContent = privatePosts;
        document.getElementById('statCategories').textContent = catCount;
        document.getElementById('postCount').textContent = total;
        
    } catch (error) {
        console.error('Statistics loading failed:', error);
    }
}

// ═══════════════════════════════════════════════════
// RECENT ACTIVITY
// ═══════════════════════════════════════════════════
async function loadRecentActivity() {
    try {
        const { data: posts } = await supabaseClient
            .from('archive_posts')
            .select('id, title, created_at, updated_at')
            .order('updated_at', { ascending: false })
            .limit(5);
        
        const container = document.getElementById('recentActivity');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim);">활동 내역이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const time = getTimeAgo(post.updated_at);
            return `
                <div class="activity-item">
                    <div class="activity-icon">📝</div>
                    <div class="activity-content">
                        <p class="activity-text">${post.title}</p>
                        <p class="activity-time">${time}</p>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Activity loading failed:', error);
    }
}

function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
}

// ═══════════════════════════════════════════════════
// HOME SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════
async function loadHomeSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings')
            .select('*')
            .in('key', ['home_title', 'home_subtitle', 'home_content', 'show_recent_posts', 'recent_posts_count']);
        
        const settings = {};
        data.forEach(item => settings[item.key] = item.value);
        
        document.getElementById('homeTitle').value = settings.home_title || '환영합니다';
        document.getElementById('homeSubtitle').value = settings.home_subtitle || 'SMALLSM Archive에 오신 것을 환영합니다';
        document.getElementById('homeContent').value = settings.home_content || '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.';
        document.getElementById('showRecentPosts').checked = settings.show_recent_posts === 'true';
        document.getElementById('recentPostsCount').value = settings.recent_posts_count || '3';
        
        updateHomePreview();
        toggleRecentPostsCount();
        
    } catch (error) {
        console.error('Home settings loading failed:', error);
    }
}

function updateHomePreview() {
    const title = document.getElementById('homeTitle').value;
    const subtitle = document.getElementById('homeSubtitle').value;
    const content = document.getElementById('homeContent').value;
    
    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewSubtitle').textContent = subtitle;
    document.getElementById('previewContent').innerHTML = content
        .split('\n')
        .map(line => `<p>${line}</p>`)
        .join('');
    
    hasUnsavedChanges = true;
}

function toggleRecentPostsCount() {
    const checkbox = document.getElementById('showRecentPosts');
    const countGroup = document.getElementById('recentPostsCountGroup');
    countGroup.style.display = checkbox.checked ? 'block' : 'none';
}

async function saveHomeSettings() {
    const settings = [
        { key: 'home_title', value: document.getElementById('homeTitle').value },
        { key: 'home_subtitle', value: document.getElementById('homeSubtitle').value },
        { key: 'home_content', value: document.getElementById('homeContent').value },
        { key: 'show_recent_posts', value: document.getElementById('showRecentPosts').checked.toString() },
        { key: 'recent_posts_count', value: document.getElementById('recentPostsCount').value }
    ];
    
    try {
        for (const setting of settings) {
            await supabaseClient.from('settings').upsert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }
        
        alert('✅ 홈화면이 저장되었습니다!');
        hasUnsavedChanges = false;
        
    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════
// POSTS MANAGEMENT
// ═══════════════════════════════════════════════════
async function loadPosts() {
    try {
        const { data: posts } = await supabaseClient
            .from('archive_posts')
            .select(`
                id,
                title,
                is_private,
                created_at,
                updated_at,
                categories (name)
            `)
            .order('updated_at', { ascending: false });
        
        const container = document.getElementById('postsList');
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim); text-align: center; padding: 3rem;">게시물이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const statusBadge = post.is_private 
                ? '<span class="status-badge private">🔴 비공개</span>'
                : '<span class="status-badge public">🟢 공개</span>';
            
            const categoryName = post.categories?.name || 'Uncategorized';
            const updatedTime = getTimeAgo(post.updated_at);
            const postUrl = `${window.location.origin}/post.html?id=${post.id}`;
            
            return `
                <div class="post-item">
                    <div class="post-header">
                        <a href="${postUrl}" class="post-title-link" target="_blank">${post.title}</a>
                        <div class="post-badges">${statusBadge}</div>
                    </div>
                    <div class="post-meta">
                        ${categoryName} • ${updatedTime} • 최종 수정일
                    </div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="copyPostLink('${postUrl}')">📋 링크 복사</button>
                        <button class="action-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                        <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title}')">🗑️ 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Posts loading failed:', error);
    }
}

window.copyPostLink = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!');
    }).catch(() => {
        alert('❌ 복사 실패');
    });
};

window.editPost = function(id) {
    // TODO: Open editor
    alert('편집 기능은 구현 예정입니다.');
};

window.deletePost = async function(id, title) {
    if (!confirm(`"${title}"를 삭제하시겠습니까?\n\n휴지통으로 이동되며 30일 후 자동 삭제됩니다.`)) {
        return;
    }
    
    try {
        // Get post data
        const { data: post } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('id', id)
            .single();
        
        // Move to trash
        await supabaseClient.from('trash').insert({
            item_type: 'post',
            item_id: id,
            item_data: post
        });
        
        // Delete from posts
        await supabaseClient.from('archive_posts').delete().eq('id', id);
        
        alert('✅ 휴지통으로 이동되었습니다.');
        loadPosts();
        loadStatistics();
        
    } catch (error) {
        console.error('Delete failed:', error);
        alert('❌ 삭제 실패: ' + error.message);
    }
};

// ═══════════════════════════════════════════════════
// CATEGORIES MANAGEMENT
// ═══════════════════════════════════════════════════
async function loadCategories() {
    try {
        const { data: categories } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });
        
        const container = document.getElementById('categoriesList');
        
        if (!categories || categories.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim);">카테고리가 없습니다.</p>';
            return;
        }
        
        container.innerHTML = categories.map(cat => {
            const visibilityIcon = cat.is_visible ? '👁️' : '🙈';
            
            return `
                <div class="category-item-card" draggable="true" data-id="${cat.id}" data-order="${cat.display_order}">
                    <div class="category-header">
                        <span class="drag-handle">⋮⋮</span>
                        <input type="text" 
                               class="category-name-input" 
                               value="${cat.name}"
                               onchange="updateCategoryName('${cat.id}', this.value)"
                               onblur="this.dataset.original = this.value">
                        <button class="visibility-toggle" onclick="toggleCategoryVisibility('${cat.id}', ${!cat.is_visible})">
                            ${visibilityIcon}
                        </button>
                        <button class="action-btn" onclick="deleteCategory('${cat.id}', '${cat.name}')">🗑️</button>
                    </div>
                    <div class="category-controls">
                        <div>
                            <label style="color: var(--admin-text-dim); font-size: 0.9rem;">드롭다운</label>
                            <label class="checkbox-label">
                                <input type="checkbox" ${cat.has_dropdown ? 'checked' : ''} 
                                       onchange="updateCategoryDropdown('${cat.id}', this.checked)">
                                <span>사용</span>
                            </label>
                        </div>
                        <div id="dropdown_opts_${cat.id}" style="${cat.has_dropdown ? '' : 'opacity: 0.3;'}">
                            <label style="color: var(--admin-text-dim); font-size: 0.9rem;">기본 상태</label>
                            <label class="checkbox-label">
                                <input type="radio" name="default_${cat.id}" value="open" ${cat.default_open ? 'checked' : ''}
                                       onchange="updateCategoryDefaultOpen('${cat.id}', true)"
                                       ${!cat.has_dropdown ? 'disabled' : ''}>
                                <span>열림</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="radio" name="default_${cat.id}" value="closed" ${!cat.default_open ? 'checked' : ''}
                                       onchange="updateCategoryDefaultOpen('${cat.id}', false)"
                                       ${!cat.has_dropdown ? 'disabled' : ''}>
                                <span>닫힘</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        initDragAndDrop();
        
    } catch (error) {
        console.error('Categories loading failed:', error);
    }
}

window.updateCategoryName = async function(id, newName) {
    try {
        await supabaseClient.from('categories').update({ name: newName }).eq('id', id);
        console.log('✅ Category name updated');
    } catch (error) {
        console.error('Update failed:', error);
        alert('❌ 이름 변경 실패');
    }
};

window.toggleCategoryVisibility = async function(id, isVisible) {
    try {
        await supabaseClient.from('categories').update({ is_visible: isVisible }).eq('id', id);
        loadCategories();
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.updateCategoryDropdown = async function(id, hasDropdown) {
    try {
        await supabaseClient.from('categories').update({ has_dropdown: hasDropdown }).eq('id', id);
        const opts = document.getElementById(`dropdown_opts_${id}`);
        if (opts) opts.style.opacity = hasDropdown ? '1' : '0.3';
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.updateCategoryDefaultOpen = async function(id, defaultOpen) {
    try {
        await supabaseClient.from('categories').update({ default_open: defaultOpen }).eq('id', id);
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.deleteCategory = async function(id, name) {
    if (!confirm(`"${name}" 카테고리를 삭제하시겠습니까?`)) return;
    
    try {
        const { data: posts } = await supabaseClient.from('archive_posts').select('id').eq('category_id', id);
        
        if (posts && posts.length > 0) {
            if (!confirm(`⚠️ ${posts.length}개의 게시물이 있습니다.\n\n게시물도 함께 삭제됩니까?`)) {
                return;
            }
            await supabaseClient.from('archive_posts').delete().eq('category_id', id);
        }
        
        await supabaseClient.from('categories').delete().eq('id', id);
        alert('✅ 삭제되었습니다.');
        loadCategories();
        loadStatistics();
        
    } catch (error) {
        console.error('Delete failed:', error);
        alert('❌ 삭제 실패');
    }
};

async function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) {
        alert('카테고리 이름을 입력하세요.');
        return;
    }
    
    try {
        const { data: categories } = await supabaseClient
            .from('categories')
            .select('display_order')
            .order('display_order', { ascending: false })
            .limit(1);
        
        const maxOrder = categories && categories.length > 0 ? categories[0].display_order : 0;
        
        await supabaseClient.from('categories').insert({
            name: name,
            is_visible: true,
            has_dropdown: true,
            default_open: false,
            display_order: maxOrder + 1
        });
        
        document.getElementById('newCategoryName').value = '';
        alert('✅ 카테고리가 추가되었습니다!');
        loadCategories();
        loadStatistics();
        
    } catch (error) {
        console.error('Add failed:', error);
        alert('❌ 추가 실패');
    }
}

function initDragAndDrop() {
    const container = document.getElementById('categoriesList');
    let draggedElement = null;
    
    container.querySelectorAll('.category-item-card').forEach(item => {
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
    const draggableElements = [...container.querySelectorAll('.category-item-card:not(.dragging)')];
    
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
    const items = document.querySelectorAll('.category-item-card');
    
    try {
        for (let i = 0; i < items.length; i++) {
            const id = items[i].dataset.id;
            await supabaseClient.from('categories').update({ display_order: i + 1 }).eq('id', id);
        }
        console.log('✅ Order updated');
    } catch (error) {
        console.error('Order update failed:', error);
    }
}

// ═══════════════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════════════
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
    
    const icon = document.querySelector('#themeToggle .icon');
    icon.textContent = isDark ? '☀️' : '🌙';
}

function togglePreviewTheme() {
    const preview = document.getElementById('homePreview');
    const btn = document.getElementById('previewThemeToggle');
    
    preview.classList.toggle('dark');
    const isDark = preview.classList.contains('dark');
    btn.textContent = isDark ? '☀️ 라이트' : '🌙 다크';
}

// ═══════════════════════════════════════════════════
// TRASH
// ═══════════════════════════════════════════════════
async function loadTrash() {
    try {
        const { data: items } = await supabaseClient
            .from('trash')
            .select('*')
            .order('deleted_at', { ascending: false });
        
        const container = document.getElementById('trashList');
        const count = items ? items.length : 0;
        document.getElementById('trashCount').textContent = count;
        
        if (count === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim); text-align: center; padding: 3rem;">휴지통이 비어있습니다.</p>';
            return;
        }
        
        container.innerHTML = items.map(item => {
            const daysLeft = Math.ceil((new Date(item.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
            const title = item.item_data.title || item.item_data.name;
            
            return `
                <div class="trash-item">
                    <div class="post-header">
                        <span class="post-title-link">${title}</span>
                        <span class="status-badge warning">${daysLeft}일 남음</span>
                    </div>
                    <div class="post-meta">
                        ${item.item_type === 'post' ? '📝 게시물' : '📂 카테고리'} • ${new Date(item.deleted_at).toLocaleString('ko-KR')}
                    </div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="restoreItem('${item.id}', '${item.item_type}', '${item.item_id}')">♻️ 복구</button>
                        <button class="action-btn danger" onclick="permanentDelete('${item.id}')">🗑️ 영구 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Trash loading failed:', error);
    }
}

window.restoreItem = async function(trashId, itemType, itemId) {
    try {
        const { data: trashItem } = await supabaseClient.from('trash').select('*').eq('id', trashId).single();
        
        if (itemType === 'post') {
            await supabaseClient.from('archive_posts').insert(trashItem.item_data);
        } else {
            await supabaseClient.from('categories').insert(trashItem.item_data);
        }
        
        await supabaseClient.from('trash').delete().eq('id', trashId);
        
        alert('✅ 복구되었습니다!');
        loadTrash();
        if (itemType === 'post') loadPosts();
        else loadCategories();
        loadStatistics();
        
    } catch (error) {
        console.error('Restore failed:', error);
        alert('❌ 복구 실패');
    }
};

window.permanentDelete = async function(trashId) {
    if (!confirm('⚠️ 영구적으로 삭제됩니다.\n\n복구할 수 없습니다. 계속하시겠습니까?')) {
        return;
    }
    
    try {
        await supabaseClient.from('trash').delete().eq('id', trashId);
        alert('✅ 영구 삭제되었습니다.');
        loadTrash();
    } catch (error) {
        console.error('Delete failed:', error);
        alert('❌ 삭제 실패');
    }
};

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM ready');
    
    await waitForConfig();
    
    supabaseClient = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    
    console.log('✅ Supabase initialized');
    
    // Check if already logged in
    if (await checkAuth()) {
        await showDashboard();
    }
    
    // Login button
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            showError('이메일과 비밀번호를 입력하세요');
            return;
        }
        
        if (email !== window.ADMIN_EMAIL) {
            showError('관리자 권한이 없습니다');
            return;
        }
        
        try {
            const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            
            await showDashboard();
        } catch (error) {
            showError(error.message || '로그인 실패');
        }
    });
    
    // Logout button
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('로그아웃하시겠습니까?')) return;
        
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
    
    // Nav buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
            
            if (section === 'trash') loadTrash();
        });
    });
    
    // Home preview real-time
    ['homeTitle', 'homeSubtitle', 'homeContent'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateHomePreview);
    });
    
    document.getElementById('showRecentPosts').addEventListener('change', toggleRecentPostsCount);
    document.getElementById('saveHomeBtn').addEventListener('click', saveHomeSettings);
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('previewThemeToggle').addEventListener('click', togglePreviewTheme);
    
    // Load saved theme
    const savedTheme = localStorage.getItem('admin_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.querySelector('#themeToggle .icon').textContent = '☀️';
    }
    
    // Unsaved changes warning
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
    
    console.log('🎉 Dashboard initialized');
});
