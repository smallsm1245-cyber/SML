// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - TOAST UI EDITOR INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Toast UI Admin loading...');

let supabaseClient = null;
let editor = null;
let currentPostId = null;

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
// AUTHENTICATION
// ═══════════════════════════════════════════════════
function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 3000);
    }
}

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

    // Initialize Toast UI Editor
    initializeEditor();

    // Load data
    await Promise.all([
        loadPosts(),
        loadCategories(),
        loadHomeSettings()
    ]);

    // Check for actions in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
        showNewPostEditor();
    }
}

// ═══════════════════════════════════════════════════
// TOAST UI EDITOR
// ═══════════════════════════════════════════════════
function initializeEditor() {
    if (editor) return; // Already initialized

    const Editor = toastui.Editor;

    editor = new Editor({
        el: document.querySelector('#editor'),
        height: '500px',
        initialEditType: 'markdown',
        previewStyle: 'vertical',
        placeholder: '내용을 입력하세요...',
        language: 'ko-KR',
        toolbarItems: [
            ['heading', 'bold', 'italic', 'strike'],
            ['hr', 'quote'],
            ['ul', 'ol', 'task', 'indent', 'outdent'],
            ['table', 'image', 'link'],
            ['code', 'codeblock'],
            ['scrollSync']
        ],
        hooks: {
            addImageBlobHook: async (blob, callback) => {
                try {
                    const url = await uploadImage(blob);
                    callback(url, 'Image');
                } catch (error) {
                    console.error('Image upload failed:', error);
                    alert('이미지 업로드 실패: ' + error.message);
                }
            }
        }
    });

    console.log('✅ Toast UI Editor initialized');
}

async function uploadImage(file) {
    try {
        const fileExt = file.name ? file.name.split('.').pop() : 'png';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `images/${fileName}`;

        const { data, error } = await supabaseClient.storage
            .from('archive-images')
            .upload(filePath, file);

        if (error) throw error;

        const { data: urlData } = supabaseClient.storage
            .from('archive-images')
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Upload failed:', error);
        throw error;
    }
}

// ═══════════════════════════════════════════════════
// SECTION SWITCHING
// ═══════════════════════════════════════════════════
function switchSection(sectionName) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    document.getElementById(`section-${sectionName}`).classList.add('active');
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
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
                categories (name)
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        const container = document.getElementById('postsList');
        document.getElementById('postCount').textContent = posts ? posts.length : 0;

        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">게시물이 없습니다.</div>';
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
                        ${categoryName} • ${updatedTime}
                    </div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="copyPostLink('${postUrl}')">📋 링크 복사</button>
                        <button class="action-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                        <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">🗑️ 삭제</button>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error('Posts loading failed:', error);
        document.getElementById('postsList').innerHTML = '<div class="loading">게시물을 불러오는 중 오류가 발생했습니다.</div>';
    }
}

function getTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
}

window.copyPostLink = function (url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!');
    }).catch(() => {
        alert('❌ 복사 실패');
    });
};

window.editPost = async function (id) {
    try {
        const { data: post, error } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Switch to editor view
        document.getElementById('postListView').style.display = 'none';
        document.getElementById('postEditorView').style.display = 'block';
        document.getElementById('editorTitle').textContent = '게시물 수정';

        // Fill form
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postCategory').value = post.category_id;
        document.getElementById('isPrivate').checked = post.is_private;
        document.getElementById('originFree').checked = post.origin_free;

        // Set editor content
        editor.setMarkdown(post.content);

        // Store current post ID
        currentPostId = id;

        // Scroll to top
        window.scrollTo(0, 0);

    } catch (error) {
        console.error('Edit post failed:', error);
        alert('게시물을 불러오는 중 오류가 발생했습니다.');
    }
};

window.deletePost = async function (id, title) {
    if (!confirm(`"${title}"를 삭제하시겠습니까?`)) return;

    try {
        const { error } = await supabaseClient
            .from('archive_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('✅ 삭제되었습니다.');
        loadPosts();

    } catch (error) {
        console.error('Delete failed:', error);
        alert('❌ 삭제 실패: ' + error.message);
    }
};

function showNewPostEditor() {
    document.getElementById('postListView').style.display = 'none';
    document.getElementById('postEditorView').style.display = 'block';
    document.getElementById('editorTitle').textContent = '새 글 작성';

    // Clear form
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('isPrivate').checked = false;
    document.getElementById('originFree').checked = false;
    editor.setMarkdown('');

    currentPostId = null;

    window.scrollTo(0, 0);
}

function backToList() {
    document.getElementById('postListView').style.display = 'block';
    document.getElementById('postEditorView').style.display = 'none';

    currentPostId = null;

    loadPosts();
}

async function publishPost() {
    const title = document.getElementById('postTitle').value.trim();
    const categoryId = document.getElementById('postCategory').value;
    const isPrivate = document.getElementById('isPrivate').checked;
    const originFree = document.getElementById('originFree').checked;
    const content = editor.getMarkdown();

    if (!title) {
        alert('제목을 입력하세요.');
        return;
    }

    if (!categoryId) {
        alert('카테고리를 선택하세요.');
        return;
    }

    if (!content) {
        alert('내용을 입력하세요.');
        return;
    }

    try {
        if (currentPostId) {
            // Update existing post
            const { error } = await supabaseClient
                .from('archive_posts')
                .update({
                    title: title,
                    content: content,
                    category_id: categoryId,
                    is_private: isPrivate,
                    origin_free: originFree,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentPostId);

            if (error) throw error;

            alert('✅ 게시물이 수정되었습니다!');

        } else {
            // Create new post
            const { error } = await supabaseClient
                .from('archive_posts')
                .insert([{
                    title: title,
                    content: content,
                    category_id: categoryId,
                    is_private: isPrivate,
                    origin_free: originFree
                }]);

            if (error) throw error;

            alert('✅ 게시물이 발행되었습니다!');
        }

        backToList();

    } catch (error) {
        console.error('Publish failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════
// CATEGORIES MANAGEMENT
// ═══════════════════════════════════════════════════
async function loadCategories() {
    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        // Update category select in post editor
        const select = document.getElementById('postCategory');
        select.innerHTML = '<option value="">카테고리 선택</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

        // Update filter select
        const filterSelect = document.getElementById('postFilterCategory');
        filterSelect.innerHTML = '<option value="">모든 카테고리</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');

        // Update categories list
        const container = document.getElementById('categoriesList');

        if (!categories || categories.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim);">카테고리가 없습니다.</p>';
            return;
        }

        container.innerHTML = categories.map(cat => {
            const visibilityIcon = cat.is_visible ? '👁️' : '🙈';

            return `
                <div class="category-item-card" draggable="true" data-id="${cat.id}">
                    <div class="category-header">
                        <span class="drag-handle">⋮⋮</span>
                        <input type="text" 
                               class="category-name-input" 
                               value="${cat.name}"
                               onchange="updateCategoryName('${cat.id}', this.value)">
                        <button class="visibility-toggle" onclick="toggleCategoryVisibility('${cat.id}', ${!cat.is_visible})">
                            ${visibilityIcon}
                        </button>
                        <button class="action-btn danger" onclick="deleteCategory('${cat.id}', '${cat.name}')">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        initDragAndDrop();

    } catch (error) {
        console.error('Categories loading failed:', error);
    }
}

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

    } catch (error) {
        console.error('Add failed:', error);
        alert('❌ 추가 실패');
    }
}

async function saveAllCategories() {
    const items = document.querySelectorAll('.category-item-card');

    try {
        for (let i = 0; i < items.length; i++) {
            const id = items[i].dataset.id;
            const input = items[i].querySelector('.category-name-input');
            const newName = input ? input.value : null;

            if (newName) {
                // Update order and name
                await supabaseClient.from('categories').update({
                    display_order: i + 1,
                    name: newName
                }).eq('id', id);
            }
        }

        alert('✅ 모든 카테고리 변경사항이 저장되었습니다!');
        loadCategories();
    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ 저장 실패: ' + error.message);
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
        });

        item.addEventListener('drop', async (e) => {
            e.preventDefault();
            if (draggedElement !== item) {
                const allItems = [...container.querySelectorAll('.category-item-card')];
                const draggedIndex = allItems.indexOf(draggedElement);
                const targetIndex = allItems.indexOf(item);

                if (draggedIndex < targetIndex) {
                    item.after(draggedElement);
                } else {
                    item.before(draggedElement);
                }

                await updateCategoryOrder();
            }
        });
    });
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
        .filter(line => line.trim())
        .map(line => `<p>${line}</p>`)
        .join('');
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

    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    }
}

// ═══════════════════════════════════════════════════
// SEARCH AND FILTER
// ═══════════════════════════════════════════════════
function setupSearchAndFilter() {
    const searchInput = document.getElementById('postSearch');
    const categoryFilter = document.getElementById('postFilterCategory');
    const statusFilter = document.getElementById('postFilterStatus');

    searchInput.addEventListener('input', filterPosts);
    categoryFilter.addEventListener('change', filterPosts);
    statusFilter.addEventListener('change', filterPosts);
}

function filterPosts() {
    const searchTerm = document.getElementById('postSearch').value.toLowerCase();
    const selectedCategory = document.getElementById('postFilterCategory').value;
    const selectedStatus = document.getElementById('postFilterStatus').value;

    const posts = document.querySelectorAll('.post-item');

    posts.forEach(post => {
        const title = post.querySelector('.post-title-link').textContent.toLowerCase();
        const category = post.querySelector('.post-meta').textContent;
        const isPrivate = post.querySelector('.status-badge.private') !== null;

        let show = true;

        if (searchTerm && !title.includes(searchTerm)) {
            show = false;
        }

        if (selectedStatus === 'public' && isPrivate) {
            show = false;
        } else if (selectedStatus === 'private' && !isPrivate) {
            show = false;
        }

        post.style.display = show ? 'block' : 'none';
    });
}

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
            switchSection(btn.dataset.section);
        });
    });

    // Post editor buttons
    document.getElementById('newPostBtn').addEventListener('click', showNewPostEditor);
    document.getElementById('backToListBtn').addEventListener('click', backToList);
    document.getElementById('publishPostBtn').addEventListener('click', publishPost);
    document.getElementById('saveDraftBtn').addEventListener('click', () => {
        localStorage.setItem('draft_post', JSON.stringify({
            title: document.getElementById('postTitle').value,
            category: document.getElementById('postCategory').value,
            content: editor.getMarkdown(),
            timestamp: Date.now()
        }));
        alert('✅ 임시 저장되었습니다!');
    });

    // Home preview real-time
    ['homeTitle', 'homeSubtitle', 'homeContent'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateHomePreview);
    });

    document.getElementById('showRecentPosts').addEventListener('change', toggleRecentPostsCount);
    document.getElementById('saveHomeBtn').addEventListener('click', saveHomeSettings);
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);

    const saveCatBtn = document.getElementById('saveCategoriesBtn');
    if (saveCatBtn) saveCatBtn.addEventListener('click', saveAllCategories);

    // Setup search and filter
    setupSearchAndFilter();

    console.log('🎉 Admin initialized');
});
