// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD (Complete & Debugged)
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
window.switchSection = function(sectionName) {
    if (hasUnsavedChanges) {
        if (!confirm('저장하지 않은 변경사항이 있습니다. 정말 이동하시겠습니까?')) {
            return;
        }
        hasUnsavedChanges = false;
    }
    
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const section = document.getElementById(`section-${sectionName}`);
    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    
    if (section) section.classList.add('active');
    if (navItem) navItem.classList.add('active');
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
        if (data) data.forEach(item => settings[item.key] = item.value);
        
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
    if (countGroup) countGroup.style.display = checkbox.checked ? 'block' : 'none';
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
// POSTS MANAGEMENT (Enhanced Debugging)
// ═══════════════════════════════════════════════════
async function loadPosts() {
    const container = document.getElementById('postsList');
    try {
        console.log('📡 게시글 불러오기 시도 중 (Table: archive_posts)...');
        
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select('id, title, is_private, created_at, updated_at, category_id')
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('❌ DB 에러 발생:', error.message);
            console.error('상세 정보:', error.details, error.hint);
            throw error;
        }

        console.log('✅ 데이터 수신 성공:', posts.length, '개의 게시글');

        const { data: categories } = await supabaseClient.from('categories').select('id, name');
        const catMap = {};
        if (categories) categories.forEach(c => catMap[c.id] = c.name);
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim); text-align: center; padding: 3rem;">게시물이 없습니다.</p>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const statusBadge = post.is_private 
                ? '<span class="status-badge private">🔴 비공개</span>'
                : '<span class="status-badge public">🟢 공개</span>';
            
            const categoryName = catMap[post.category_id] || 'Uncategorized';
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
                        <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title}')">🗑️ 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Posts loading failed:', error);
        container.innerHTML = `<p style="color: var(--admin-danger); padding: 2rem;">❌ 데이터를 불러오지 못했습니다.<br><small>${error.message}</small></p>`;
    }
}

window.editPost = function(id) {
    window.location.href = `admin.html?action=edit&id=${id}`;
};

window.copyPostLink = function(url) {
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ 링크가 복사되었습니다!');
    }).catch(() => {
        alert('❌ 복사 실패');
    });
};

window.deletePost = async function(id, title) {
    if (!confirm(`"${title}"를 삭제하시겠습니까?\n\n휴지통으로 이동되며 30일 후 자동 삭제됩니다.`)) {
        return;
    }
    
    try {
        const { data: post } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('id', id)
            .single();
        
        await supabaseClient.from('trash').insert({
            item_type: 'post',
            item_id: id,
            item_data: post,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
        
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
        currentCategories = categories || [];
        renderCategories();
        
    } catch (error) {
        console.error('Categories loading failed:', error);
    }
}

function renderCategories() {
    const container = document.getElementById('categoriesList');
    if (!container) return;

    if (currentCategories.length === 0) {
        container.innerHTML = '<p style="color: var(--admin-text-dim);">카테고리가 없습니다.</p>';
        return;
    }

    container.innerHTML = currentCategories.map(cat => {
        const isHidden = !cat.is_visible;
        const isSub = cat.is_sub || false;
        
        return `
            <div class="category-item-card ${isSub ? 'sub-category' : ''}" data-id="${cat.id}">
                <div class="drag-handle">≡</div>
                <div class="category-header">
                    <input type="text" class="category-name-input" value="${cat.name}" 
                           oninput="updateLocalCategoryName('${cat.id}', this.value)">
                </div>
                <div class="category-actions">
                    <button class="indent-btn" onclick="toggleLocalIndent('${cat.id}')" title="들여쓰기">
                        ${isSub ? '⬅️' : '➡️'}
                    </button>
                    <button class="visibility-toggle ${isHidden ? 'hidden' : ''}" 
                            onclick="toggleLocalVisibility('${cat.id}')">
                        ${isHidden ? '🙈' : '👁️'}
                    </button>
                    <button class="action-btn danger" onclick="deleteLocalCategory('${cat.id}')">🗑️</button>
                </div>
            </div>
        `;
    }).join('') + `
        <div style="margin-top: 1.5rem; display: flex; justify-content: center;">
            <button class="btn-primary" onclick="saveAllCategories()">✅ 카테고리 설정 적용하기</button>
        </div>
    `;

    if (window.Sortable) initSortable();
}

function initSortable() {
    const el = document.getElementById('categoriesList');
    if (!el) return;
    
    Sortable.create(el, {
        handle: '.drag-handle',
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: function() {
            const newOrder = [];
            el.querySelectorAll('.category-item-card').forEach(item => {
                newOrder.push(item.dataset.id);
            });
            
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

window.updateLocalCategoryName = function(id, name) {
    const cat = currentCategories.find(c => c.id == id);
    if (cat) {
        cat.name = name;
        hasUnsavedChanges = true;
    }
};

window.toggleLocalIndent = function(id) {
    const cat = currentCategories.find(c => c.id == id);
    if (cat) {
        cat.is_sub = !cat.is_sub;
        renderCategories();
        hasUnsavedChanges = true;
    }
};

window.toggleLocalVisibility = function(id) {
    const cat = currentCategories.find(c => c.id == id);
    if (cat) {
        cat.is_visible = !cat.is_visible;
        renderCategories();
        hasUnsavedChanges = true;
    }
};

window.deleteLocalCategory = function(id) {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    currentCategories = currentCategories.filter(c => c.id != id);
    renderCategories();
    hasUnsavedChanges = true;
};

window.saveAllCategories = async function() {
    try {
        for (let i = 0; i < currentCategories.length; i++) {
            const cat = currentCategories[i];
            const { error } = await supabaseClient.from('categories').upsert({
                id: cat.id,
                name: cat.name,
                display_order: i + 1,
                is_visible: cat.is_visible,
                is_sub: cat.is_sub,
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

async function addCategory() {
    const nameInput = document.getElementById('newCategoryName');
    const name = nameInput.value.trim();
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
            display_order: maxOrder + 1
        });
        
        nameInput.value = '';
        alert('✅ 카테고리가 추가되었습니다!');
        loadCategories();
        loadStatistics();
        
    } catch (error) {
        console.error('Add failed:', error);
        alert('❌ 추가 실패');
    }
}

// ═══════════════════════════════════════════════════
// THEME & TRASH
// ═══════════════════════════════════════════════════
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('admin_theme', isDark ? 'dark' : 'light');
    const icon = document.querySelector('#themeToggle .icon');
    if (icon) icon.textContent = isDark ? '☀️' : '🌙';
}

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
            const title = item.item_data.title || item.item_data.name || 'Untitled';
            
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
                        <button class="action-btn" onclick="restoreItem('${item.id}', '${item.item_type}')">♻️ 복구</button>
                        <button class="action-btn danger" onclick="permanentDelete('${item.id}')">🗑️ 영구 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Trash loading failed:', error);
    }
}

window.restoreItem = async function(trashId, itemType) {
    try {
        const { data: trashItem } = await supabaseClient.from('trash').select('*').eq('id', trashId).single();
        const table = itemType === 'post' ? 'archive_posts' : 'categories';
        
        await supabaseClient.from(table).insert(trashItem.item_data);
        await supabaseClient.from('trash').delete().eq('id', trashId);
        
        alert('✅ 복구되었습니다!');
        loadTrash();
        itemType === 'post' ? loadPosts() : loadCategories();
        loadStatistics();
    } catch (error) {
        console.error('Restore failed:', error);
        alert('❌ 복구 실패');
    }
};

window.permanentDelete = async function(trashId) {
    if (!confirm('⚠️ 영구적으로 삭제됩니다. 복구할 수 없습니다.')) return;
    try {
        await supabaseClient.from('trash').delete().eq('id', trashId);
        alert('✅ 영구 삭제되었습니다.');
        loadTrash();
    } catch (error) {
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
    
    if (await checkAuth()) {
        await showDashboard();
    }
    
    document.getElementById('loginBtn').addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
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
    
    document.getElementById('logoutBtn').addEventListener('click', async () => {
        if (!confirm('로그아웃하시겠습니까?')) return;
        await supabaseClient.auth.signOut();
        window.location.reload();
    });
    
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            switchSection(section);
            if (section === 'trash') loadTrash();
        });
    });
    
    // UI Events
    ['homeTitle', 'homeSubtitle', 'homeContent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateHomePreview);
    });
    
    document.getElementById('showRecentPosts').addEventListener('change', toggleRecentPostsCount);
    document.getElementById('saveHomeBtn').addEventListener('click', saveHomeSettings);
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.getElementById('saveSettingsBtn').addEventListener('click', saveSiteSettings);
    document.getElementById('saveSeoBtn').addEventListener('click', saveSeoSettings);

    // Load saved theme
    if (localStorage.getItem('admin_theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }
});
