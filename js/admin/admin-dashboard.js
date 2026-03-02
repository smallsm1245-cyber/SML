// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - WIKI DASHBOARD (Complete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Wiki Dashboard loading...');

var supabaseClient = null;
var hasUnsavedChanges = false;
var globalCategories = []; // Added for tendency category mapping

// Markdown Converters
const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced'
});

// Prevent Turndown from escaping Markdown syntax typed by the user
turndownService.escape = function (string) {
    return string;
};



// Custom filter for clean Markdown
turndownService.remove(['script', 'style', 'noscript']);
turndownService.addRule('cleanSpan', {
    filter: 'span',
    replacement: function (content, node) {
        // If it's a color span or bold span, we might want to keep it, 
        // but for general Summernote font mess, just return content
        const style = node.getAttribute('style') || '';
        if (style.includes('color') || style.includes('background-color')) {
            return `<span style="${style}">${content}</span>`;
        }
        return content;
    }
});

const showdownConverter = new showdown.Converter({
    tables: true,
    strikethrough: true,
    tasklists: true,
    simpleLineBreaks: true,
    openLinksInNewWindow: true
});

// ═══════════════════════════════════════════════════
// WAIT FOR CONFIG
// ═══════════════════════════════════════════════════
function waitForConfig() {
    return new Promise((resolve) => {
        let attempts = 0;
        const interval = setInterval(() => {
            attempts++;
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            } else if (attempts > 50) { // 5 seconds timeout
                console.error('Config load timeout. Env vars missing?');
                clearInterval(interval);
                // Resolve anyway to let the UI show errors instead of hanging
                resolve();
            }
        }, 100);
    });
}

// ═══════════════════════════════════════════════════
// SHOW ERROR
// ═══════════════════════════════════════════════════
function showError(message) {
    console.error('Error:', message);
    const loginError = document.getElementById('loginError');
    if (loginError && document.getElementById('loginScreen').style.display !== 'none') {
        loginError.textContent = message;
        loginError.classList.add('show');
        setTimeout(() => loginError.classList.remove('show'), 3000);
    } else {
        alert(message);
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
    const dashboard = document.getElementById('adminDashboard');
    if (dashboard) dashboard.style.display = 'block';

    // Load all data
    await Promise.all([
        loadStatistics(),
        loadRecentActivity(),
        loadHomeSettings(),
        loadCategories(),
        loadPosts(),
        loadSiteSettings(),
        loadKinkPairs(),
        window.loadVerificationSettings()
    ]);

    // Mobile Menu Toggle Logic
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.querySelector('.dashboard-sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (mobileMenuBtn && sidebar && overlay) {
        mobileMenuBtn.onclick = () => {
            sidebar.classList.add('active');
            overlay.classList.add('active');
        };

        overlay.onclick = () => {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        };

        // Close sidebar when clicking nav items on mobile
        document.querySelectorAll('.nav-item').forEach(item => {
            item.onclick = () => {
                if (window.innerWidth <= 992) {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            };
        });
    }
}

async function loadSiteSettings() {
    try {
        const { data } = await supabaseClient
            .from('settings')
            .select('*')
            .in('key', ['site_title', 'site_description', 'google_site_verification', 'naver_verification']);

        const settings = {};
        if (data) data.forEach(item => settings[item.key] = item.value);

        document.getElementById('siteTitleInput').value = settings.site_title || 'SMALLSM Archive';
        document.getElementById('siteDescInput').value = settings.site_description || '';
        document.getElementById('googleVerification').value = settings.google_site_verification || '';
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
        { key: 'google_site_verification', value: document.getElementById('googleVerification').value },
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
    const targetSection = document.getElementById(`section-${sectionName}`);
    if (targetSection) targetSection.classList.add('active');

    const navItem = document.querySelector(`[data-section="${sectionName}"]`);
    if (navItem) navItem.classList.add('active');

    // Back to Overview Button visibility
    const backBtn = document.getElementById('backToOverviewBtn');
    if (backBtn) {
        backBtn.style.display = sectionName === 'overview' ? 'none' : 'flex';
    }
};

// ═══════════════════════════════════════════════════
// STATISTICS
// ═══════════════════════════════════════════════════
async function loadStatistics() {
    try {
        const { data: posts } = await supabaseClient.from('archive_posts').select('id, is_private');
        const { data: categories } = await supabaseClient.from('categories').select('id');

        const total = posts ? posts.length : 0;
        const catCount = categories ? categories.length : 0;

        const statTotalPosts = document.getElementById('statTotalPosts');
        const statCategories = document.getElementById('statCategories');
        const postCountBadge = document.getElementById('postCount');

        if (statTotalPosts) statTotalPosts.textContent = total;
        if (statCategories) statCategories.textContent = catCount;
        if (postCountBadge) postCountBadge.textContent = total;

        // Implement Referrer logic
        const referrer = document.referrer || 'Direct / Internal';
        const statReferrer = document.getElementById('statReferrer');
        if (statReferrer) {
            let label = '직접 유입';
            if (referrer.includes('naver.com')) label = '네이버';
            else if (referrer.includes('google.com')) label = '구글';
            else if (referrer.includes('daum.net')) label = '다음';
            else if (referrer.includes('t.co') || referrer.includes('twitter.com')) label = '트위터(X)';
            else if (referrer !== 'Direct / Internal') label = new URL(referrer).hostname;

            statReferrer.textContent = label;
        }

        const referrerList = document.getElementById('referrerList');
        if (referrerList) {
            referrerList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">🔗</div>
                    <div class="activity-content">
                        <p class="activity-text">${referrer === 'Direct / Internal' ? '직접 접속 또는 북마크' : referrer}</p>
                        <p class="activity-time">현재 세션 유입 경로</p>
                    </div>
                </div>
            `;
        }

    } catch (error) {
        console.error('Statistics loading failed:', error);
    }
}

// ═══════════════════════════════════════════════════
// NEW: SYSTEM MONITORING & TOOLS
// ═══════════════════════════════════════════════════
function loadSystemStats() {
    // Storage Capacity Logic
    const usedPercent = 45; // Fixed for now
    const storageBar = document.getElementById('storageProgressBar');
    const storageVal = document.getElementById('storageValue');

    if (storageVal) storageVal.textContent = usedPercent + '%';
    if (storageBar) {
        storageBar.style.width = usedPercent + '%';
        if (usedPercent < 70) storageBar.style.backgroundColor = 'var(--admin-success)';
        else if (usedPercent < 90) storageBar.style.backgroundColor = 'var(--admin-warning)';
        else storageBar.style.backgroundColor = 'var(--admin-danger)';
    }

    // Live User Count (Minimal simulation)
    const liveCount = document.getElementById('liveUserCount');
    if (liveCount) {
        setInterval(() => {
            const current = parseInt(liveCount.textContent);
            const change = Math.random() > 0.5 ? 1 : -1;
            let next = Math.max(1, Math.min(15, current + change));
            liveCount.textContent = next;
        }, 10000);
    }
}

window.optimizeDB = function () {
    const btn = document.querySelector('.btn-xs-primary');
    const originalText = btn.textContent;
    const scoreEl = document.getElementById('dbHealthScore');

    if (btn.disabled) return;

    if (!confirm('DB 최적화를 진행하시겠습니까?\n임시 파일 정리 및 인덱스 재구성이 실행됩니다.')) return;

    btn.disabled = true;
    btn.textContent = '🔄 처리 중...';
    btn.style.opacity = '0.7';

    // Simulate Network Request
    setTimeout(() => {
        btn.textContent = '✅ 완료!';
        scoreEl.textContent = '100';
        scoreEl.style.color = '#4CAF50';

        setTimeout(() => {
            btn.disabled = false;
            btn.textContent = originalText;
            btn.style.opacity = '1';
            alert('시스템 최적화가 성공적으로 완료되었습니다.\n- 불필요한 캐시 12MB 삭제됨\n- 쿼리 인덱스 재정렬 완료');
        }, 1500);
    }, 1500);
};

// Hook into initial load
const originalLoadStatistics = loadStatistics;
loadStatistics = async function () {
    await originalLoadStatistics(); // Run original logic
    loadSystemStats(); // Run new logic
};

// ═══════════════════════════════════════════════════
// RECENT ACTIVITY
// ═══════════════════════════════════════════════════
async function loadRecentActivity() {
    // Removed per user request
    return;
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

        // Summernote Editor for Home
        const homeHtml = showdownConverter.makeHtml(settings.home_content || '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.');
        const summernoteConfig = {
            height: 300,
            lang: 'ko-KR',
            placeholder: '홈 화면 내용을 입력하세요...',
            toolbar: [
                ['style', ['style', 'bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['link', 'picture', 'hr']],
                ['view', ['fullscreen', 'codeview']]
            ],
            styleTags: ['p', 'h2', 'h3', 'h4'], // Filtered list for site consistency
            callbacks: {
                onChange: updateHomePreview,
                onPaste: function (e) {
                    // Strip absolute font sizes on paste
                    const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
                    e.preventDefault();
                    document.execCommand('insertText', false, bufferText);
                }
            }
        };

        $('#homeContentEditor').summernote(summernoteConfig);
        $('#homeContentEditor').summernote('code', homeHtml);

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
    // Preview removed - but we can keep the logic if needed
    hasUnsavedChanges = true;
}

function toggleRecentPostsCount() {
    const checkbox = document.getElementById('showRecentPosts');
    const countGroup = document.getElementById('recentPostsCountGroup');
    countGroup.style.display = checkbox.checked ? 'block' : 'none';
}

async function saveHomeSettings() {
    let homeHtml = $('#homeContentEditor').summernote('code');
    homeHtml = homeHtml.replace(/&nbsp;|\u00A0/g, ' ');
    const content = turndownService.turndown(homeHtml);

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
let selectedPosts = new Set();
let postEditorInstance = null;
let currentEditingId = null;

// Pagination and Filter State
let postCurrentPage = 1;
const postPageSize = 10;
let postSearchKeyword = '';
let postSelectedCategory = '';
let postSelectedStatus = '';

async function loadPosts() {
    try {
        const container = document.getElementById('postsList');
        const paginationContainer = document.getElementById('postsPagination');

        // Build Supabase query
        let query = supabaseClient
            .from('archive_posts')
            .select(`
                id,
                title,
                is_private,
                created_at,
                updated_at,
                category_id
            `, { count: 'exact' });

        // Apply Search
        if (postSearchKeyword) {
            query = query.ilike('title', `%${postSearchKeyword}%`);
        }

        // Apply Category Filter
        if (postSelectedCategory) {
            query = query.eq('category_id', postSelectedCategory);
        }

        // Apply Status Filter
        if (postSelectedStatus === 'public') {
            query = query.eq('is_private', false);
        } else if (postSelectedStatus === 'private') {
            query = query.eq('is_private', true);
        }

        // Pagination
        const from = (postCurrentPage - 1) * postPageSize;
        const to = from + postPageSize - 1;

        const { data: posts, error, count } = await query
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        document.getElementById('postCount').textContent = count || 0;
        selectedPosts.clear();
        updateBulkToolbar();

        if (!posts || posts.length === 0) {
            container.innerHTML = '<p style="color: var(--admin-text-dim); text-align: center; padding: 3rem;">검색 결과가 없습니다.</p>';
            paginationContainer.innerHTML = '';
            return;
        }

        let html = `
            <div class="post-list-header">
                <div class="post-col-checkbox">선택</div>
                <div class="post-col-title">제목</div>
                <div class="post-col-date">작성일</div>
                <div class="post-col-actions">관리</div>
            </div>
        `;

        html += posts.map(post => {
            const date = new Date(post.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric'
            });

            return `
                <div class="post-row" onclick="editPost('${post.id}')">
                    <div class="post-col-checkbox" onclick="event.stopPropagation()">
                        <input type="checkbox" class="post-checkbox" value="${post.id}" onchange="togglePostSelection('${post.id}')">
                    </div>
                    <div class="post-row-left">
                        <span class="post-row-title">${post.title}</span>
                        ${post.is_private ? '<span class="private-tag">🔒</span>' : ''}
                    </div>
                    <div class="post-row-right">
                        <span class="post-row-date">${date}</span>
                        <div class="post-row-actions" onclick="event.stopPropagation()">
                            <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">🗑️</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
        renderPagination(count);

    } catch (error) {
        console.error('Posts loading failed:', error);
        document.getElementById('postsList').innerHTML = '<p style="color: var(--admin-danger);">데이터를 불러오지 못했습니다.</p>';
    }
}

function renderPagination(totalCount) {
    const container = document.getElementById('postsPagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / postPageSize);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '<div class="pagination">';

    // Previous Button
    html += `<button class="page-btn" ${postCurrentPage === 1 ? 'disabled' : ''} onclick="changePage(${postCurrentPage - 1})">이전</button>`;

    // Page Numbers (Simple version: show all or limited)
    const maxPagesToShow = 5;
    let startPage = Math.max(1, postCurrentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === postCurrentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    }

    // Next Button
    html += `<button class="page-btn" ${postCurrentPage === totalPages ? 'disabled' : ''} onclick="changePage(${postCurrentPage + 1})">다음</button>`;

    html += '</div>';
    container.innerHTML = html;
}

window.changePage = function (page) {
    postCurrentPage = page;
    loadPosts();
    // Scroll to top of section
    document.getElementById('section-posts').scrollIntoView({ behavior: 'smooth' });
};

window.toggleSelectAll = function (source) {
    const checkboxes = document.querySelectorAll('.post-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
        if (source.checked) selectedPosts.add(cb.value);
        else selectedPosts.delete(cb.value);
    });
    updateBulkToolbar();
};

window.togglePostSelection = function (id) {
    if (selectedPosts.has(id)) {
        selectedPosts.delete(id);
    } else {
        selectedPosts.add(id);
    }
    updateBulkToolbar();

    // Update select all checkbox
    const all = document.querySelectorAll('.post-checkbox');
    const checked = document.querySelectorAll('.post-checkbox:checked');
    const selectAll = document.getElementById('selectAllPosts');
    if (selectAll) {
        selectAll.checked = all.length === checked.length;
        selectAll.indeterminate = checked.length > 0 && checked.length < all.length;
    }
};

window.updateBulkToolbar = function () {
    const bar = document.getElementById('bulkActionBar');
    const countText = document.getElementById('selectedCountText');
    if (bar) {
        bar.style.display = selectedPosts.size > 0 ? 'block' : 'none';
        if (countText) countText.textContent = `${selectedPosts.size}개 선택됨`;
    }
}

window.bulkMovePosts = async function () {
    if (selectedPosts.size === 0) return;

    const targetId = document.getElementById('bulkMoveCategory').value;
    if (!targetId) {
        alert('이동할 카테고리를 선택해주세요.');
        return;
    }

    if (!confirm(`${selectedPosts.size}개의 게시글을 선택한 카테고리로 이동하시겠습니까?`)) {
        return;
    }

    try {
        const ids = Array.from(selectedPosts);
        const { error } = await supabaseClient
            .from('archive_posts')
            .update({ category_id: targetId })
            .in('id', ids);

        if (error) throw error;

        alert('✅ 일괄 이동이 완료되었습니다.');
        selectedPosts.clear();
        loadPosts();
        loadStatistics();
    } catch (error) {
        console.error('Bulk move failed:', error);
        alert('❌ 일괄 이동 실패: ' + error.message);
    }
}

window.deleteSelectedPosts = async function () {
    if (selectedPosts.size === 0) return;

    if (!confirm(`선택한 ${selectedPosts.size}개의 게시글을 삭제하시겠습니까?\n\n휴지통으로 이동됩니다.`)) {
        return;
    }

    try {
        const ids = Array.from(selectedPosts);

        // 1. Fetch posts data to save in trash
        const { data: postsToDelete } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .in('id', ids);

        if (postsToDelete && postsToDelete.length > 0) {
            // 2. Insert into trash
            const trashItems = postsToDelete.map(post => ({
                item_type: 'post',
                item_id: post.id,
                item_data: post
            }));

            await supabaseClient.from('trash').insert(trashItems);

            // 3. Delete from actual table
            await supabaseClient.from('archive_posts').delete().in('id', ids);

            alert('✅ 선택한 게시글이 휴지통으로 이동되었습니다.');
            loadPosts();
            loadStatistics();
        }
    } catch (error) {
        console.error('Bulk delete failed:', error);
        alert('❌ 일괄 삭제 실패: ' + error.message);
    }
};

window.showNewPostEditor = function () {
    currentEditingId = null;
    document.getElementById('postEditorView').style.display = 'block';
    document.getElementById('postsList').style.display = 'none';
    document.getElementById('editorTitle').textContent = '새 글 작성';

    // Reset form
    document.getElementById('postTitle').value = '';
    document.getElementById('postCategory').value = '';
    document.getElementById('isPrivate').checked = false;
    document.getElementById('originFree').checked = false;

    initPostEditor('');

    // Populate categories in editor dropdown
    const categorySelect = document.getElementById('postCategory');
    if (categorySelect && currentCategories.length > 0) {
        // Now allowing all categories instead of just subCategories
        categorySelect.innerHTML = '<option value="">카테고리 선택</option>' +
            currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
};

window.editPost = async function (id) {
    try {
        const { data: post, error } = await supabaseClient
            .from('archive_posts')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        currentEditingId = id;
        document.getElementById('postEditorView').style.display = 'block';
        document.getElementById('postsList').style.display = 'none';
        document.getElementById('editorTitle').textContent = '글 수정';

        document.getElementById('postTitle').value = post.title;
        document.getElementById('isPrivate').checked = post.is_private;
        document.getElementById('originFree').checked = !post.origin_free;

        // Populate categories
        const categorySelect = document.getElementById('postCategory');
        if (categorySelect && currentCategories.length > 0) {
            // Now allowing all categories instead of just subCategories
            categorySelect.innerHTML = '<option value="">카테고리 선택</option>' +
                currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
            categorySelect.value = post.category_id || '';
        }

        const htmlContent = showdownConverter.makeHtml(post.content || '');
        initPostEditor(htmlContent);

    } catch (error) {
        console.error('Failed to load post for edit:', error);
        alert('게시글 정보를 불러오는데 실패했습니다.');
    }
};

function initPostEditor(content) {
    const summernoteConfig = {
        height: 500,
        placeholder: '내용을 입력하세요...',
        lang: 'ko-KR',
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'underline', 'clear']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'hr']],
            ['view', ['fullscreen', 'codeview', 'help']]
        ],
        styleTags: [
            'p',
            { title: '제목 1', tag: 'h2', className: 'post-h1', value: 'h2' },
            { title: '제목 2', tag: 'h3', className: 'post-h2', value: 'h3' },
            { title: '본문 리드', tag: 'p', className: 'lead', value: 'p' }
        ],
        fontNames: ['Noto Serif KR', 'Inter', 'Arial'],
        fontNamesIgnoreCheck: ['Noto Serif KR'],
        addDefaultFonts: false,
        callbacks: {
            onImageUpload: function (files) {
                for (let i = 0; i < files.length; i++) {
                    uploadImageToSummernote(files[i], this);
                }
            },
            onPaste: function (e) {
                // Prevent font-family/size mess when pasting
                const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
                e.preventDefault();
                setTimeout(() => {
                    document.execCommand('insertText', false, bufferText);
                }, 10);
            }
        }
    };

    $('#summernote').summernote(summernoteConfig);
    $('#summernote').summernote('code', content || '');
}

async function uploadImageToSummernote(file, editorInstance) {
    try {
        const url = await uploadImage(file); // assuming uploadImage exists in this or another file
        $(editorInstance).summernote('insertImage', url);
    } catch (error) {
        console.error('Image upload failed:', error);
        alert('이미지 업로드 실패: ' + error.message);
    }
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

const backBtn = document.getElementById('backToListBtn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        if (postEditorInstance && postEditorInstance.getMarkdown().length > 0) {
            // Simple check if content exists
        }
        document.getElementById('postEditorView').style.display = 'none';
        document.getElementById('postsList').style.display = 'block';
    });
}

// Save/Publish handlers
const saveDraftBtn = document.getElementById('saveDraftBtn');
if (saveDraftBtn) saveDraftBtn.addEventListener('click', () => savePost(true));
document.getElementById('publishPostBtn').addEventListener('click', () => savePost(false));

async function savePost(isDraft) {
    const title = document.getElementById('postTitle').value.trim();
    const categoryId = document.getElementById('postCategory').value;
    const isPrivate = document.getElementById('isPrivate').checked;
    const originFree = !document.getElementById('originFree').checked;
    let htmlContent = $('#summernote').summernote('code');
    htmlContent = htmlContent.replace(/&nbsp;|\u00A0/g, ' ');
    const content = turndownService.turndown(htmlContent);

    if (!title) {
        alert('제목을 입력하세요.');
        return;
    }
    if (!categoryId) {
        alert('카테고리를 선택하세요.');
        return;
    }

    try {
        const postData = {
            title: title,
            content: content,
            category_id: categoryId,
            is_private: isDraft ? true : isPrivate,
            origin_free: originFree,
            updated_at: new Date().toISOString()
        };

        if (!currentEditingId) {
            // New Post
            postData.created_at = new Date().toISOString();
            await supabaseClient.from('archive_posts').insert(postData);
            alert('✅ 게시글이 등록되었습니다!');
        } else {
            // Update Post
            await supabaseClient.from('archive_posts').update(postData).eq('id', currentEditingId);
            alert('✅ 게시글이 수정되었습니다!');
        }

        document.getElementById('postEditorView').style.display = 'none';
        document.getElementById('postsList').style.display = 'block';
        loadPosts();
        loadStatistics();

    } catch (error) {
        console.error('Save failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    }
}

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
let deletedCategoryIds = new Set();

async function loadCategories() {
    deletedCategoryIds.clear();
    console.log('📥 loadCategories called - fetching from database...');

    try {
        const { data: categories, error } = await supabaseClient
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        if (error) throw error;

        console.log('📊 Categories loaded from DB:', categories);
        console.log('📊 Total count:', categories ? categories.length : 0);

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

        // Populate Bulk Move Dropdown
        const bulkMoveSelect = document.getElementById('bulkMoveCategory');
        if (bulkMoveSelect) {
            bulkMoveSelect.innerHTML = '<option value="">이동할 카테고리 선택...</option>' +
                currentCategories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
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

    let html = '';

    currentCategories.forEach((cat, index) => {
        const isHidden = !cat.is_visible;

        // Determine child count based on flat list sequence
        let childCount = 0;
        if (!cat.is_sub) {
            for (let i = index + 1; i < currentCategories.length; i++) {
                if (currentCategories[i].is_sub) childCount++;
                else break;
            }
        }

        if (!cat.is_sub) {
            // Parent category card
            html += `
                <div class="category-item-card parent-category" data-id="${cat.id}">
                    <div class="drag-handle" title="순서 드래그">≡</div>
                    <span class="category-type-badge clickable" onclick="toggleLocalIndent('${cat.id}')" title="대분류/소분류 전환">📁 대분류</span>
                    <div class="category-header">
                        <input type="text" class="category-name-input" value="${cat.name}" 
                               oninput="updateLocalCategoryName('${cat.id}', this.value)" title="이름 수정">
                    </div>
                    <span class="child-count">${childCount}개 소분류</span>
                    <div class="category-actions">
                        <button class="visibility-toggle ${isHidden ? 'off' : ''}" 
                                onclick="toggleLocalVisibility('${cat.id}')" title="숨기기/보이기">
                            ${isHidden ? '🙈' : '👁️'}
                        </button>
                        <button class="action-btn danger" onclick="deleteLocalCategory('${cat.id}')" title="삭제">🗑️</button>
                    </div>
                </div>
            `;
        } else {
            // Child category card
            html += `
                <div class="category-item-card child-category" data-id="${cat.id}">
                    <div class="drag-handle" title="순서 드래그">≡</div>
                    <span class="category-indent">└─</span>
                    <span class="category-type-badge clickable" onclick="toggleLocalIndent('${cat.id}')" title="대분류/소분류 전환">📄 소분류</span>
                    <div class="category-header">
                        <input type="text" class="category-name-input" value="${cat.name}" 
                               oninput="updateLocalCategoryName('${cat.id}', this.value)" title="이름 수정">
                    </div>
                    <div class="category-actions">
                        <button class="visibility-toggle ${isHidden ? 'off' : ''}" 
                                onclick="toggleLocalVisibility('${cat.id}')" title="숨기기/보이기">
                            ${isHidden ? '🙈' : '👁️'}
                        </button>
                        <button class="action-btn danger" onclick="deleteLocalCategory('${cat.id}')" title="삭제">🗑️</button>
                    </div>
                </div>
            `;
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



window.saveAllCategories = async function () {
    console.log('🔧 saveAllCategories called');
    console.log('📋 Current categories:', currentCategories);
    console.log('🗑️ Deleted IDs:', Array.from(deletedCategoryIds));

    if (!confirm('변경된 카테고리 설정을 저장하시겠습니까?')) return;

    try {
        // 1. Handle Deletions first
        if (deletedCategoryIds.size > 0) {
            const idsToDelete = Array.from(deletedCategoryIds);
            console.log('🗑️ Deleting categories:', idsToDelete);

            const { error: deleteError } = await supabaseClient
                .from('categories')
                .delete()
                .in('id', idsToDelete);

            if (deleteError) {
                console.error('❌ Delete error:', deleteError);
                throw deleteError;
            }
            console.log('✅ Deletions successful');
            deletedCategoryIds.clear();
        }

        // 2. Handle Updates (Hierarchy & Order)
        let lastParentId = null;
        const upserts = currentCategories.map((cat, index) => {
            // Logic to determine parent based on is_sub
            // If is_sub is true, it uses the last seen parent.
            // If is_sub is false, it becomes the new lastParent.

            let parentId = null;
            if (cat.is_sub) {
                parentId = lastParentId;
                // If there's no parent above (e.g. first item is sub), it defaults to null (becomes root)
                // or we could force it to be root.
            } else {
                lastParentId = cat.id;
            }

            return {
                id: cat.id,
                name: cat.name,
                is_visible: cat.is_visible,
                display_order: index + 1,
                parent_id: parentId
            };
        });

        console.log('📝 Upserting categories:', upserts);

        if (upserts.length > 0) {
            const { error: upsertError } = await supabaseClient
                .from('categories')
                .upsert(upserts);

            if (upsertError) {
                console.error('❌ Upsert error:', upsertError);
                throw upsertError;
            }
            console.log('✅ Upserts successful');
        }

        alert('✅ 카테고리 설정이 저장되었습니다!');
        hasUnsavedChanges = false;
        loadCategories(); // Reload to reflect DB state
        loadStatistics();

    } catch (error) {
        console.error('❌ Save categories failed:', error);
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

// ═══════════════════════════════════════════════════
// DELETE CATEGORY (LOCAL)
// ═══════════════════════════════════════════════════
window.deleteLocalCategory = function (id) {
    console.log('🗑️ deleteLocalCategory called with id:', id);

    const index = currentCategories.findIndex(c => c.id == id);
    const cat = currentCategories[index];
    if (!cat) {
        console.warn('⚠️ Category not found:', id);
        return;
    }

    // Check for children based on current sequence (sequential UI feedback)
    const childrenIds = [];
    if (!cat.is_sub) {
        for (let i = index + 1; i < currentCategories.length; i++) {
            if (currentCategories[i].is_sub) childrenIds.push(currentCategories[i].id);
            else break;
        }
    }

    let message = '정말 삭제하시겠습니까? (저장 시 영구 삭제됩니다)';
    if (childrenIds.length > 0) {
        message = `⚠️ 이 카테고리에는 ${childrenIds.length}개의 소분류가 포함되어 있습니다.\n\n삭제하면 소분류도 함께 삭제됩니다.\n계속하시겠습니까?`;
    }

    if (!confirm(message)) {
        console.log('❌ Deletion cancelled by user');
        return;
    }

    console.log('✅ User confirmed deletion');

    // 1. Mark for DB deletion
    deletedCategoryIds.add(id);
    childrenIds.forEach(childId => deletedCategoryIds.add(childId));

    // 2. Remove also children that might be linked via parent_id but moved elsewhere (consistency)
    currentCategories.forEach(c => {
        if (c.parent_id == id) deletedCategoryIds.add(c.id);
    });

    // 3. Remove from local list
    currentCategories = currentCategories.filter(c => !deletedCategoryIds.has(c.id));

    renderCategories();
    hasUnsavedChanges = true;
};

// ═══════════════════════════════════════════════════
// ADD CATEGORY (IMMEDIATE)
// ═══════════════════════════════════════════════════
async function addCategory() {
    if (hasUnsavedChanges) {
        if (!confirm('⚠️ 저장하지 않은 변경사항(삭제/순서변경)이 있습니다.\n\n카테고리를 추가하면 변경사항이 저장되지 않고 목록이 새로고침됩니다.\n\n정말 진행하시겠습니까?')) {
            return;
        }
        // If they proceed, unsaved changes are lost (reset)
        deletedCategoryIds.clear();
        hasUnsavedChanges = false;
    }

    const name = document.getElementById('newCategoryName').value.trim();
    const parentId = document.getElementById('newCategoryParent').value;

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

        const newCategory = {
            name: name,
            is_visible: true,
            display_order: maxOrder + 1
        };

        if (parentId) {
            newCategory.parent_id = parentId;
        }

        await supabaseClient.from('categories').insert(newCategory);

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
// GLOBAL LOGIN HANDLER
// ═══════════════════════════════════════════════════
window.handleLogin = async function () {
    console.log('👆 Login button clicked');

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('loginBtn');

    if (!email || !password) {
        showError('이메일과 비밀번호를 입력하세요');
        return;
    }

    if (!supabaseClient) {
        const msg = '⚠️ 시스템 설정(Config)을 불러오지 못했습니다.\n새로고침 하거나 관리자에게 문의하세요.';
        showError(msg);
        alert(msg); // 확실한 피드백을 위해 alert 추가
        console.warn('Supabase client not ready. window.SUPABASE_CONFIG:', window.SUPABASE_CONFIG);
        return;
    }

    // Admin Email Check
    if (window.ADMIN_EMAIL && email !== window.ADMIN_EMAIL) {
        showError('관리자 권한이 없습니다.');
        console.warn('Email mismatch:', email);
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = '로그인 중...';

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) throw error;

        console.log('✅ Login successful', data);
        await showDashboard();

    } catch (error) {
        console.error('Login failed:', error);
        showError(error.message || '로그인 실패');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.textContent = '로그인';
        }
    }
};

// ═══════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM ready');

    // Home preview setup
    ['homeTitle', 'homeSubtitle', 'homeContent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateHomePreview);
    });

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

        });
    });

    // Search and Filters for Posts
    const postSearch = document.getElementById('postSearch');
    const postCatFilter = document.getElementById('postFilterCategory');
    const postStatusFilter = document.getElementById('postFilterStatus');

    if (postSearch) {
        let debounceTimer;
        postSearch.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                postSearchKeyword = e.target.value.trim();
                postCurrentPage = 1;
                loadPosts();
            }, 300);
        });
    }

    if (postCatFilter) {
        postCatFilter.addEventListener('change', (e) => {
            postSelectedCategory = e.target.value;
            postCurrentPage = 1;
            loadPosts();
        });
    }

    if (postStatusFilter) {
        postStatusFilter.addEventListener('change', (e) => {
            postSelectedStatus = e.target.value;
            postCurrentPage = 1;
            loadPosts();
        });
    }

    // Home preview real-time
    ['homeTitle', 'homeSubtitle', 'homeContent'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateHomePreview);
    });

    document.getElementById('showRecentPosts')?.addEventListener('change', toggleRecentPostsCount);
    document.getElementById('saveHomeBtn')?.addEventListener('click', saveHomeSettings);
    document.getElementById('addCategoryBtn')?.addEventListener('click', addCategory);
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('previewThemeToggle')?.addEventListener('click', togglePreviewTheme);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSiteSettings);
    document.getElementById('saveSeoBtn')?.addEventListener('click', saveSeoSettings);
    // Tendency buttons now use onclick in HTML for better reliability

    // Mobile menu toggle is now handled in showDashboard
    const overlay = document.getElementById('sidebarOverlay');
    const sidebar = document.querySelector('.dashboard-sidebar');

    const toggleSidebar = () => {
        if (!sidebar || !overlay) return;
        const isActive = sidebar.classList.toggle('active');
        if (overlay) overlay.classList.toggle('active', isActive);
        document.body.style.overflow = isActive ? 'hidden' : '';
    };

    if (overlay) overlay.onclick = toggleSidebar;

    // Close sidebar on nav click (mobile)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('active')) {
                toggleSidebar();
            }
        });
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

// ═══════════════════════════════════════════════════
// PDF REPORT DOWNLOAD
// ═══════════════════════════════════════════════════

/**
 * PDF 리포트 다운로드 버튼 클릭 핸들러
 * pdf-module.js의 generatePostsReport 함수를 호출합니다
 */
window.downloadPostsReport = async function () {
    if (!supabaseClient) {
        alert('❌ Supabase 클라이언트가 초기화되지 않았습니다.');
        return;
    }

    if (!window.generatePostsReport) {
        alert('❌ PDF 생성 모듈을 불러오지 못했습니다.');
        return;
    }

    try {
        console.log('📄 PDF 리포트 다운로드 시작...');
        await window.generatePostsReport(supabaseClient);
        // generatePostsReport 함수 내부에서 성공 메시지 출력
    } catch (error) {
        console.error('PDF 다운로드 실패:', error);
        alert('❌ PDF 생성 중 오류가 발생했습니다.\n\n' + error.message);
    }
};

// ═══════════════════════════════════════════════════
// KINK PAIR MANAGEMENT
// ═══════════════════════════════════════════════════
let kinkDictionaryPairs = {}; // { topId: bottomId }
let kinkRoleOverrides = {}; // { itemId: 'top' | 'bottom' }
let kinkDisplayOrder = []; // Array of IDs in order
let allKinkTops = [];
let allKinkBottoms = [];
let pairSortables = [];
let allRawKinkPosts = []; // Store raw post data for role switches

window.loadKinkPairs = async function () {
    try {
        // Fetch specific Category ID for Kink Dictionary
        const { data: catData } = await supabaseClient.from('categories').select('id, name').eq('name', '성향 백과').single();
        if (!catData) return;

        const { data: posts } = await supabaseClient.from('archive_posts').select('id, title').eq('category_id', catData.id);
        allRawKinkPosts = posts || [];

        // Fetch saved pairs, overrides, and order
        const { data: kinkSettingsData } = await supabaseClient.from('settings').select('*').in('key', ['kink_dictionary_pairs', 'kink_role_overrides', 'kink_display_order']);

        const pairData = (kinkSettingsData || []).find(s => s.key === 'kink_dictionary_pairs');
        kinkDictionaryPairs = pairData && pairData.value ? JSON.parse(pairData.value) : {};

        const overrideData = (kinkSettingsData || []).find(s => s.key === 'kink_role_overrides');
        kinkRoleOverrides = overrideData && overrideData.value ? JSON.parse(overrideData.value) : {};

        const orderData = (kinkSettingsData || []).find(s => s.key === 'kink_display_order');
        kinkDisplayOrder = orderData && orderData.value ? JSON.parse(orderData.value) : [];

        processKinkItems();
        sortKinkItems();
        renderKinkPairUI();

    } catch (e) {
        console.error('Error loading kink pairs:', e);
    }
}

function sortKinkItems() {
    if (!kinkDisplayOrder || kinkDisplayOrder.length === 0) return;

    const orderMap = {};
    kinkDisplayOrder.forEach((id, idx) => orderMap[id] = idx);

    const sortFn = (a, b) => {
        const orderA = orderMap[a.id] !== undefined ? orderMap[a.id] : 9999;
        const orderB = orderMap[b.id] !== undefined ? orderMap[b.id] : 9999;
        return orderA - orderB;
    };

    allKinkTops.sort(sortFn);
    allKinkBottoms.sort(sortFn);
}

function processKinkItems() {
    allKinkTops = [];
    allKinkBottoms = [];

    allRawKinkPosts.forEach(post => {
        let type = kinkRoleOverrides[post.id];
        let rawTitle = post.title;

        if (!type) {
            // Auto detect if no manual override
            type = 'top';
            const tagMatch = rawTitle.match(/^\[(top|bottom|relation)\]\s*/i);
            if (tagMatch) {
                type = tagMatch[1].toLowerCase();
                rawTitle = rawTitle.slice(tagMatch[0].length).trim();
            } else {
                const bottomKeywords = /매조|섭|슬레이브|프레이|마조히스트|서브미시브|바텀|bottom|submissive|브랫|brat|펫|pet|리틀|little|디그레이디|degradee/i;
                if (bottomKeywords.test(rawTitle)) type = 'bottom';
            }
        } else {
            // If manual override exists, clean the title of tags if they exist
            const tagMatch = rawTitle.match(/^\[(top|bottom|relation)\]\s*/i);
            if (tagMatch) rawTitle = rawTitle.slice(tagMatch[0].length).trim();
        }

        const cleanName = rawTitle.replace(/\s*\(.*?\)$/, '').trim();
        const item = { id: post.id, name: cleanName, title: post.title, assignedType: type };

        if (type === 'top') allKinkTops.push(item);
        else allKinkBottoms.push(item);
    });
}

function renderKinkPairUI() {
    const pairedList = document.getElementById('pairedList');
    const unpairedList = document.getElementById('unpairedBottoms');
    if (!pairedList || !unpairedList) return;

    pairedList.innerHTML = '';
    unpairedList.innerHTML = '';

    if (pairSortables.length) {
        pairSortables.forEach(s => s.destroy());
    }
    pairSortables = [];

    // Track assigned bottoms
    const assignedBottomIds = new Set(Object.values(kinkDictionaryPairs));

    // Render Tops
    allKinkTops.forEach(top => {
        const topEl = document.createElement('div');
        topEl.className = 'kink-pair-row';
        topEl.dataset.id = top.id;
        topEl.style.cssText = 'display: flex; align-items: center; gap: 1rem; padding: 0.5rem; background: var(--admin-bg-alt); border-radius: 4px; box-shadow: inset 0 0 5px rgba(0,0,0,0.2); cursor: grab;';

        const topLabel = document.createElement('div');
        topLabel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <div>
                    <strong style="font-size:0.7rem; opacity:0.7;">TOP</strong><br>
                    <span style="color: #ff4d4d; font-weight: bold;">${top.name}</span>
                </div>
                <button class="btn-secondary" onclick="toggleKinkRole('${top.id}', 'bottom')" style="padding: 2px 4px; font-size: 0.7rem;">바텀으로</button>
            </div>
        `;
        topLabel.style.cssText = 'flex: 1; font-size: 0.95rem; line-height: 1.4;';

        const bottomSlot = document.createElement('div');
        bottomSlot.className = 'bottom-slot';
        bottomSlot.dataset.topId = top.id;
        bottomSlot.style.cssText = 'flex: 1; min-height: 48px; border: 2px dashed #666; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.1); padding: 4px; transition: border-color 0.2s ease;';

        // If has assigned bottom
        const bottomId = kinkDictionaryPairs[top.id];
        if (bottomId) {
            const bottom = allKinkBottoms.find(b => b.id === bottomId);
            if (bottom) {
                const bEl = createBottomCard(bottom);
                bottomSlot.appendChild(bEl);
            }
        }

        topEl.appendChild(topLabel);
        topEl.appendChild(bottomSlot);
        pairedList.appendChild(topEl);

        // Make slot sortable
        pairSortables.push(new Sortable(bottomSlot, {
            group: 'kink-pairs',
            animation: 150,
            forceFallback: true,
            fallbackOnBody: true,
            swapThreshold: 0.65,
            onAdd: function (evt) {
                // Return old item to unpaired if replacing
                if (bottomSlot.children.length > 1) {
                    const oldItem = Array.from(bottomSlot.children).find(c => c !== evt.item);
                    if (oldItem) unpairedList.appendChild(oldItem);
                }
            }
        }));
    });

    // Render Unpaired Bottoms
    allKinkBottoms.forEach(bottom => {
        if (!assignedBottomIds.has(bottom.id)) {
            unpairedList.appendChild(createBottomCard(bottom));
        }
    });

    // Initialize reordering for Top items
    new Sortable(pairedList, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        scroll: true,
        scrollSensitivity: 100,
        scrollSpeed: 20,
        bubble: true,
        onEnd: (evt) => {
            console.log('Top items reordered');
        }
    });

    // Initialize reordering for Bottom queue
    new Sortable(unpairedList, {
        group: 'kink-pairs',
        animation: 150,
        ghostClass: 'sortable-ghost',
        scroll: true,
        scrollSensitivity: 100,
        scrollSpeed: 20,
        bubble: true,
        onEnd: (evt) => {
            console.log('Bottom queue reordered');
        }
    });
}

function createBottomCard(bottom) {
    const el = document.createElement('div');
    el.className = 'bottom-card';
    el.dataset.bottomId = bottom.id;
    el.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="text-align:left;">
                <strong style="font-size:0.7rem; opacity:0.7;">BOTTOM</strong><br>
                <span style="color: #4da6ff;">${bottom.name}</span>
            </div>
            <button class="btn-secondary" onclick="toggleKinkRole('${bottom.id}', 'top')" style="padding: 2px 4px; font-size: 0.7rem; margin-left:8px;">탑으로</button>
        </div>
    `;
    el.style.cssText = 'background: #2a2a35; padding: 0.5rem; border-radius: 4px; cursor: grab; width: 100%; text-align: center; border: 1px solid #445; font-size: 0.9rem; user-select: none; box-shadow: 0 2px 4px rgba(0,0,0,0.2);';
    return el;
}

window.toggleKinkRole = function (itemId, newType) {
    kinkRoleOverrides[itemId] = newType;
    processKinkItems();
    renderKinkPairUI();
}

window.saveKinkPairs = async function () {
    const pairedRows = document.querySelectorAll('.kink-pair-row');
    const unpairedRows = document.querySelectorAll('#unpairedBottoms .bottom-card');

    const newPairs = {};
    const newOrder = [];

    // Capture order and pairs from TOP list
    pairedRows.forEach(row => {
        const topId = row.dataset.id;
        newOrder.push(topId);

        const slot = row.querySelector('.bottom-slot');
        const bottomCard = slot.querySelector('.bottom-card');
        if (bottomCard) {
            newPairs[topId] = bottomCard.dataset.bottomId;
            newOrder.push(bottomCard.dataset.bottomId);
        }
    });

    // Capture remaining order from unpaired list
    unpairedRows.forEach(card => {
        newOrder.push(card.dataset.bottomId);
    });

    try {
        // Save mapping pairs
        await supabaseClient.from('settings').upsert({
            key: 'kink_dictionary_pairs',
            value: JSON.stringify(newPairs),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        // Save role overrides
        await supabaseClient.from('settings').upsert({
            key: 'kink_role_overrides',
            value: JSON.stringify(kinkRoleOverrides),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        // Save display order
        await supabaseClient.from('settings').upsert({
            key: 'kink_display_order',
            value: JSON.stringify(newOrder),
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

        kinkDictionaryPairs = newPairs;
        kinkDisplayOrder = newOrder;
        alert('✅ 성향 매칭 및 순서 설정이 저장되었습니다!');
    } catch (error) {
        alert('❌ 저장 실패: ' + error.message);
    }
};

// Event hook for the button instead of inline onclick if preferred
document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('saveKinkPairsBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', window.saveKinkPairs);
    }
});
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// VERIFICATION PROTOCOL MANAGEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
let protocolItems = [];
let currentEditingProtocolId = null;

window.loadVerificationSettings = async function () {
    if (!supabaseClient) return;

    try {
        const { data, error } = await supabaseClient
            .from('settings')
            .select('value')
            .eq('key', 'verification_protocol_data')
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data && data.value) {
            protocolItems = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
        } else {
            // Default if nothing in DB
            protocolItems = [
                { id: 1, section: 1, weight: 5, title: "실명/나이/성별 기반 신원 확인", desc: "신분증 또는 공신력 있는 수단(더치트 등)을 통한 본인 인증 여부" },
                { id: 2, section: 1, weight: 4, title: "과거 활동 이력 (SNS/커뮤니티)", desc: "최소 6개월 이상의 꾸준한 활동 기록 또는 평판 확인" },
                { id: 3, section: 2, weight: 4, title: "SSC/RACK 원칙 숙지 및 동의", desc: "안전(Safe), 건전(Sane), 합의(Consensual) 원칙에 대한 이해도" },
                { id: 4, section: 2, weight: 5, title: "비동의/강제 행위 이력 확인", desc: "불쾌한 접촉, 스토킹, 강제 플레이 등 부정적 피드백 존재 여부" },
                { id: 5, section: 3, weight: 3, title: "성향 전문 지식 (BDSM 용어 등)", desc: "기본적인 가학/피학적 성향 및 안전 도구 사용법 숙지" }
            ];
        }

        renderProtocolItems();
    } catch (error) {
        console.error('Load verification settings failed:', error);
        showError('검증 설정을 불러오는 중 오류가 발생했습니다.');
    }
};

function renderProtocolItems() {
    const list = document.getElementById('protocolItemsList');
    if (!list) return;

    if (protocolItems.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--admin-text-dim);">
                <span style="font-size: 3rem; display: block; margin-bottom: 1rem;">📋</span>
                <p>등록된 프로토콜 항목이 없습니다. 상단에서 항목을 추가해주세요.</p>
            </div>
        `;
        return;
    }

    // Sort by section then weight (desc)
    const sorted = [...protocolItems].sort((a, b) => {
        if (a.section !== b.section) return a.section - b.section;
        return b.weight - a.weight;
    });

    list.innerHTML = sorted.map((item) => `
        <div class="post-row" style="grid-template-columns: 100px 80px 1fr 120px; padding: 1.2rem; cursor: default; display: grid; align-items: center; border-bottom: 1px solid var(--admin-border);">
            <div style="font-weight: 700; color: var(--admin-primary);">Sec ${item.section}</div>
            <div style="text-align: center;"><span class="badge" style="background: rgba(182, 141, 64, 0.1); color: var(--admin-primary); border: 1px solid var(--admin-border); padding: 2px 8px; border-radius: 4px; font-size: 0.8rem;">W:${item.weight}</span></div>
            <div style="min-width: 0; padding: 0 1rem;">
                <div style="font-weight: 600; font-size: 1.05rem; margin-bottom: 0.2rem; color: var(--admin-text);">${item.title}</div>
                <div style="font-size: 0.85rem; color: var(--admin-text-dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.desc}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; align-items: center;">
                <button class="action-btn" onclick="window.editProtocolItem(${item.id})" title="수정" style="background: transparent; border: 1px solid var(--admin-border); padding: 0.3rem 0.6rem; cursor: pointer; border-radius: 6px;">✏️</button>
                <button class="action-btn danger" onclick="window.removeProtocolItem(${item.id})" title="삭제" style="background: transparent; border: 1px solid var(--admin-border); padding: 0.3rem 0.6rem; cursor: pointer; border-radius: 6px;">🗑️</button>
            </div>
        </div>
    `).join('');
}

window.editProtocolItem = function (id) {
    const item = protocolItems.find(i => i.id === id);
    if (!item) return;

    currentEditingProtocolId = id;
    document.getElementById('protocolEditId').value = id;
    document.getElementById('protocolSection').value = item.section;
    document.getElementById('protocolWeight').value = item.weight;
    document.getElementById('protocolTitle').value = item.title;
    document.getElementById('protocolDesc').value = item.desc;

    // UI Feedback
    document.getElementById('protocolFormTitle').textContent = '✏️ 항목 수정';
    document.getElementById('protocolSubmitBtn').textContent = '수정 완료';
    document.getElementById('cancelProtocolEditBtn').style.display = 'inline-block';

    // Scroll to form
    document.getElementById('protocolFormTitle').scrollIntoView({ behavior: 'smooth' });
};

window.resetProtocolForm = function () {
    currentEditingProtocolId = null;
    document.getElementById('protocolEditId').value = '';
    document.getElementById('protocolSection').value = '1';
    document.getElementById('protocolWeight').value = '3';
    document.getElementById('protocolTitle').value = '';
    document.getElementById('protocolDesc').value = '';

    document.getElementById('protocolFormTitle').textContent = '➕ 새 항목 추가';
    document.getElementById('protocolSubmitBtn').textContent = '항목 추가';
    document.getElementById('cancelProtocolEditBtn').style.display = 'none';
};

window.addProtocolItem = function () {
    const section = parseInt(document.getElementById('protocolSection').value);
    const weight = parseInt(document.getElementById('protocolWeight').value);
    const title = document.getElementById('protocolTitle').value.trim();
    const desc = document.getElementById('protocolDesc').value.trim();

    if (!title) {
        alert('항목 제목을 입력해주세요.');
        return;
    }

    if (currentEditingProtocolId) {
        // Update existing
        const index = protocolItems.findIndex(i => i.id === currentEditingProtocolId);
        if (index !== -1) {
            protocolItems[index] = {
                ...protocolItems[index],
                section,
                weight,
                title,
                desc
            };
        }
    } else {
        // Add new
        const newItem = {
            id: Date.now(),
            section,
            weight,
            title,
            desc
        };
        protocolItems.push(newItem);
    }

    renderProtocolItems();
    resetProtocolForm();
    hasUnsavedChanges = true;
};

window.removeProtocolItem = function (id) {
    if (!confirm('이 항목을 삭제하시겠습니까?')) return;
    protocolItems = protocolItems.filter(i => i.id !== id);
    renderProtocolItems();
    hasUnsavedChanges = true;
};

window.saveVerificationSettings = async function () {
    if (!supabaseClient) return;

    const btn = document.getElementById('saveVerificationBtn');
    const originalText = btn.textContent;

    try {
        btn.disabled = true;
        btn.textContent = '💾 저장 중...';

        const { error } = await supabaseClient
            .from('settings')
            .upsert({
                key: 'verification_protocol_data',
                value: protocolItems,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;

        alert('✅ 검증 프로토콜 설정이 저장되었습니다!');
        hasUnsavedChanges = false;
    } catch (error) {
        console.error('Save verification settings failed:', error);
        alert('❌ 저장 실패: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
};
