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
        loadPosts(),
        loadSiteSettings()
    ]);
}

async function loadSiteSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings')
            .select('*')
            .in('key', ['site_title', 'site_description', 'google_verification', 'naver_verification']);

        const settings = {};
        if (data) data.forEach(item => settings[item.key] = item.value);

        document.getElementById('siteTitleInput').value = settings.site_title || 'SMALLSM Archive';
        document.getElementById('siteDescInput').value = settings.site_description || '';
        document.getElementById('googleVerification').value = settings.google_verification || '';
        document.getElementById('naverVerification').value = settings.naver_verification || '';
        document.getElementById('adminEmailInput').value = window.ADMIN_EMAIL;

    } catch (error) {
        console.error('Site settings loading failed:', error);
    }
}

async function saveSiteSettings() {
    const settings = [
        { key: 'site_title', value: document.getElementById('siteTitleInput').value },
        { key: 'site_description', value: document.getElementById('siteDescInput').value }
    ];

    try {
        for (const setting of settings) {
            await supabaseClient.from('settings').upsert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }
        alert('✅ 사이트 정보가 저장되었습니다!');
    } catch (error) {
        alert('❌ 저장 실패: ' + error.message);
    }
}

async function saveSeoSettings() {
    const settings = [
        { key: 'google_verification', value: document.getElementById('googleVerification').value },
        { key: 'naver_verification', value: document.getElementById('naverVerification').value }
    ];

    try {
        for (const setting of settings) {
            await supabaseClient.from('settings').upsert({
                key: setting.key,
                value: setting.value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }
        alert('✅ SEO 설정이 저장되었습니다!');
    } catch (error) {
        alert('❌ 저장 실패: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════
// SECTION SWITCHING
// ═══════════════════════════════════════════════════
window.switchSection = function (sectionName) {
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
// ═══════════════════════════════════════════════════
// HOME SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════
let homeEditor;

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

        // Init Editor if not exists
        if (!homeEditor) {
            homeEditor = new toastui.Editor({
                el: document.querySelector('#homeContentEditor'),
                height: '400px',
                initialEditType: 'markdown',
                previewStyle: 'vertical',
                initialValue: settings.home_content || '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.',
                theme: 'dark', // Since we are in admin
                events: {
                    change: updateHomePreview
                }
            });
        } else {
            homeEditor.setMarkdown(settings.home_content || '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.');
        }

        document.getElementById('showRecentPosts').checked = settings.show_recent_posts === 'true';
        document.getElementById('recentPostsCount').value = settings.recent_posts_count || '3';

        // Add listeners for other inputs
        ['homeTitle', 'homeSubtitle'].forEach(id => {
            document.getElementById(id).addEventListener('input', updateHomePreview);
        });

        updateHomePreview();
        toggleRecentPostsCount();

    } catch (error) {
        console.error('Home settings loading failed:', error);
    }
}

function updateHomePreview() {
    const title = document.getElementById('homeTitle').value;
    const subtitle = document.getElementById('homeSubtitle').value;
    // Get content from editor
    const content = homeEditor ? homeEditor.getMarkdown() : '';

    document.getElementById('previewTitle').textContent = title;
    document.getElementById('previewSubtitle').textContent = subtitle;

    // Convert markdown to html for preview (simple conversion or use Viewer)
    // Here we use a temporary Viewer calls or just simple HTML if simple text. 
    // Ideally we should use Viewer for preview too.
    const previewContainer = document.getElementById('previewContent');
    previewContainer.innerHTML = '';

    // For preview, we can render using Viewer logic or just simple text if markdown is not complex
    // But since user wants Toast UI, we should probably render it properly.
    // However, creating a new Viewer every keystroke is heavy.
    // Let's rely on Editor's preview for editing, and this preview is for "Home Logic".
    // We can just dump the markdown or basic HTML.

    // Better: Helper to render markdown
    if (!window.previewViewer) {
        const Viewer = toastui.Editor;
        window.previewViewer = new Viewer({
            el: previewContainer,
            initialValue: content
        });
    } else {
        window.previewViewer.setMarkdown(content);
    }

    hasUnsavedChanges = true;
}

function toggleRecentPostsCount() {
    const checkbox = document.getElementById('showRecentPosts');
    const countGroup = document.getElementById('recentPostsCountGroup');
    countGroup.style.display = checkbox.checked ? 'block' : 'none';
}

async function saveHomeSettings() {
    const content = homeEditor ? homeEditor.getMarkdown() : '';

    const settings = [
        { key: 'home_title', value: document.getElementById('homeTitle').value },
        { key: 'home_subtitle', value: document.getElementById('homeSubtitle').value },
        { key: 'home_content', value: content },
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
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select(`
                id,
                title,
                is_private,
                created_at,
                updated_at,
                category_id
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('postsList');
        document.getElementById('postCount').textContent = posts ? posts.length : 0;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim); text-align: center; padding: 3rem;">게시물이 없습니다.</p>';
            return;
        }

        container.innerHTML = posts.map(post => {
            const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });

            return `
                <div class="post-row" onclick="editPost('${post.id}')">
                    <div class="post-row-left">
                        <span class="post-row-title">${post.title}</span>
                        ${post.is_private ? '<span class="private-tag">🔒</span>' : ''}
                    </div>
                    <div class="post-row-right">
                        <span class="post-row-date">${date}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Posts loading failed:', error);
        document.getElementById('postsList').innerHTML = '<p style="color: var(--admin-danger);">데이터를 불러오지 못했습니다.</p>';
    }
}

window.showNewPostEditor = function () {
    window.location.href = 'admin-toastui.html?action=new';
};

window.editPost = function (id) {
    window.location.href = `admin-toastui.html?action=edit&id=${id}`;
};

window.copyPostLink = function (url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!');
    }).catch(() => {
        alert('❌ 복사 실패');
    });
};

window.deletePost = async function (id, title) {
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
let currentCategories = [];

async function loadCategories() {
    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        // Map parent_id to is_sub for UI compatibility
        currentCategories = (categories || []).map(cat => ({
            ...cat,
            is_sub: !!cat.parent_id
        }));

        renderCategories();

        // Populate Filter Dropdown
        const filterSelect = document.getElementById('postFilterCategory');
        if (filterSelect) {
            filterSelect.innerHTML = '<option value="">모든 카테고리</option>' +
                currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        }

        // Populate Parent Category Selector
        const parentSelect = document.getElementById('newCategoryParent');
        if (parentSelect) {
            const roots = currentCategories.filter(c => !c.parent_id);
            parentSelect.innerHTML = '<option value="">📁 대분류로 추가</option>' +
                roots.map(root => `<option value="${root.id}">📄 ${root.name}의 소분류로 추가</option>`).join('');
        }

    } catch (error) {
        console.error('Categories loading failed:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (currentCategories.length === 0) {
        container.innerHTML = '<p style="color: var(--admin-text-dim);">카테고리가 없습니다.</p>';
        return;
    }

    // Organize into hierarchy
    const roots = currentCategories.filter(c => !c.parent_id);
    const childrenMap = {};
    currentCategories.filter(c => c.parent_id).forEach(c => {
        if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
        childrenMap[c.parent_id].push(c);
    });

    let html = '';

    roots.forEach(root => {
        const isHidden = !root.is_visible;
        const childCount = childrenMap[root.id] ? childrenMap[root.id].length : 0;

        // Parent category card
        html += `
            <div class="category-item-card parent-category" data-id="${root.id}">
                <div class="drag-handle">≡</div>
                <span class="category-type-badge">📁 대분류</span>
                <div class="category-header">
                    <input type="text" class="category-name-input" value="${root.name}" 
                           oninput="updateLocalCategoryName('${root.id}', this.value)">
                </div>
                <span class="child-count">${childCount}개 소분류</span>
                <div class="category-actions">
                    <button class="visibility-toggle ${isHidden ? 'off' : ''}" 
                            onclick="toggleLocalVisibility('${root.id}')">
                        ${isHidden ? '🙈' : '👁️'}
                    </button>
                    <button class="action-btn danger" onclick="deleteLocalCategory('${root.id}')">🗑️</button>
                </div>
            </div>
        `;

        // Child categories
        if (childrenMap[root.id]) {
            childrenMap[root.id].forEach(child => {
                const childIsHidden = !child.is_visible;
                html += `
                    <div class="category-item-card child-category" data-id="${child.id}" data-parent="${root.id}">
                        <div class="drag-handle">≡</div>
                        <span class="category-indent">└─</span>
                        <span class="category-type-badge">📄 소분류</span>
                        <div class="category-header">
                            <input type="text" class="category-name-input" value="${child.name}" 
                                   oninput="updateLocalCategoryName('${child.id}', this.value)">
                        </div>
                        <div class="category-actions">
                            <button class="visibility-toggle ${childIsHidden ? 'off' : ''}" 
                                    onclick="toggleLocalVisibility('${child.id}')">
                                ${childIsHidden ? '🙈' : '👁️'}
                            </button>
                            <button class="action-btn danger" onclick="deleteLocalCategory('${child.id}')">🗑️</button>
                        </div>
                    </div>
                `;
            });
        }
    });

    html += `
        <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
            <button class="btn-primary" onclick="saveAllCategories()">✅ 카테고리 설정 적용하기</button>
        </div>
    `;

    container.innerHTML = html;
    initSortable();
}

function initSortable() {
    const el = document.getElementById('categoriesList');
    if (!el || !window.Sortable) return;

    Sortable.create(el, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function () {
            const newOrder = [];
            el.querySelectorAll('.category-item-card').forEach(item => {
                newOrder.push(item.dataset.id);
            });

            // Reorder currentCategories based on DOM
            const reordered = [];
            newOrder.forEach(id => {
                const cat = currentCategories.find(c => c.id == id);
                if (cat) reordered.push(cat);
            });
            currentCategories = reordered;
            hasUnsavedChanges = true;
        }
    });
}

window.updateLocalCategoryName = function (id, name) {
    const cat = currentCategories.find(c => c.id == id);
    if (cat) {
        cat.name = name;
        hasUnsavedChanges = true;
    }
};

window.toggleLocalIndent = function (id) {
    const index = currentCategories.findIndex(c => c.id == id);
    if (index === 0) {
        alert('첫 번째 카테고리는 하위 카테고리가 될 수 없습니다.');
        return;
    }

    const cat = currentCategories[index];
    if (cat) {
        // Toggle indentation
        cat.is_sub = !cat.is_sub;

        // If un-indenting, but next items are sub, they might become orphaned or attached to this one.
        // For 2-depth, it's fine. If this becomes root, subsequent subs become its children.

        renderCategories();
        hasUnsavedChanges = true;
    }
};

window.toggleLocalVisibility = function (id) {
    const cat = currentCategories.find(c => c.id == id);
    if (cat) {
        cat.is_visible = !cat.is_visible;
        renderCategories();
        hasUnsavedChanges = true;
    }
};

window.deleteLocalCategory = function (id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    currentCategories = currentCategories.filter(c => c.id != id);
    renderCategories();
    hasUnsavedChanges = true;
};

async function addCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const parentId = document.getElementById('newCategoryParent').value;

    if (!name) {
        alert('카테고리 이름을 입력하세요.');
        return;
    }

    try {
        const maxOrder = currentCategories.length > 0
            ? Math.max(...currentCategories.map(c => c.display_order || 0))
            : 0;

        const newCategory = {
            name: name,
            is_visible: true,
            has_dropdown: true,
            default_open: false,
            display_order: maxOrder + 1
        };

        // Add parent_id if selected
        if (parentId) {
            newCategory.parent_id = parentId;
        }

        await supabaseClient.from('categories').insert(newCategory);

        document.getElementById('newCategoryName').value = '';
        document.getElementById('newCategoryParent').value = '';

        const categoryType = parentId ? '소분류' : '대분류';
        alert(`✅ ${categoryType} 카테고리가 추가되었습니다!`);
        await loadCategories();

    } catch (error) {
        console.error('Add failed:', error);
        alert('❌ 추가 실패');
    }
}

window.saveAllCategories = async function () {
    try {
        // Update all categories with their new order and properties
        // Calculate parent_id based on is_sub and order
        let lastRootId = null;

        for (let i = 0; i < currentCategories.length; i++) {
            const cat = currentCategories[i];

            let parentId = null;
            if (cat.is_sub) {
                if (lastRootId) {
                    parentId = lastRootId;
                } else {
                    // Orphaned sub (e.g. first item was forced sub?), treat as root
                    cat.is_sub = false;
                    lastRootId = cat.id;
                }
            } else {
                lastRootId = cat.id;
            }

            const { error } = await supabaseClient.from('categories').upsert({
                id: cat.id,
                name: cat.name,
                display_order: i + 1,
                is_visible: cat.is_visible,
                parent_id: parentId, // Save calculated parent_id
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
        }

        alert('✅ 모든 카테고리 변경사항이 저장되었습니다!');
        hasUnsavedChanges = false;
        loadCategories();
        loadStatistics();
    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    }
};

window.updateCategoryName = async function (id, newName) {
    try {
        await supabaseClient.from('categories').update({ name: newName }).eq('id', id);
        console.log('✅ Category name updated');
    } catch (error) {
        console.error('Update failed:', error);
        alert('❌ 이름 변경 실패');
    }
};

window.toggleCategoryVisibility = async function (id, isVisible) {
    try {
        await supabaseClient.from('categories').update({ is_visible: isVisible }).eq('id', id);
        loadCategories();
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.updateCategoryDropdown = async function (id, hasDropdown) {
    try {
        await supabaseClient.from('categories').update({ has_dropdown: hasDropdown }).eq('id', id);
        const opts = document.getElementById(`dropdown_opts_${id}`);
        if (opts) opts.style.opacity = hasDropdown ? '1' : '0.3';
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.updateCategoryDefaultOpen = async function (id, defaultOpen) {
    try {
        await supabaseClient.from('categories').update({ default_open: defaultOpen }).eq('id', id);
    } catch (error) {
        console.error('Update failed:', error);
    }
};

window.deleteCategory = async function (id, name) {
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
            display_order: maxOrder + 1,
            parent_id: null
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

window.restoreItem = async function (trashId, itemType, itemId) {
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

window.permanentDelete = async function (trashId) {
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
// WAIT FOR CONFIG
// ═══════════════════════════════════════════════════
function waitForConfig() {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            } else if (Date.now() - startTime > 5000) {
                clearInterval(interval);
                reject(new Error('Config loading timeout'));
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
    } else {
        alert(message);
    }
}

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM ready');

    // Login button (Attached immediately)
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value.trim();

            if (!email || !password) {
                showError('이메일과 비밀번호를 입력하세요');
                return;
            }

            if (!supabaseClient) {
                showError('⚠️ 시스템 초기화 중입니다. 잠시 후 다시 시도하세요.');
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
    }

    try {
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

    } catch (error) {
        console.error('Initialization failed:', error);
        showError('시스템 초기화 실패: 설정 파일을 불러올 수 없습니다.');
    }

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
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSiteSettings);
    document.getElementById('saveSeoBtn').addEventListener('click', saveSeoSettings);

    // Mobile menu toggle
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '☰';
    document.querySelector('.header-left').prepend(menuBtn);

    menuBtn.addEventListener('click', () => {
        document.querySelector('.dashboard-sidebar').classList.toggle('active');
    });

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
