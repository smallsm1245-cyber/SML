// Utility and API logic has been moved to utils.js and api.js


let supabaseLocal = null;
let dictionaryData = [];
let categories = [];
window.isAdmin = sessionStorage.getItem('admin_session') === 'true';
let bookmarkedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let showOnlyBookmarks = false;
let currentFontSize = parseInt(localStorage.getItem('preferred_font_size') || '16');

// ═══════════════════════════════════════════════════
// 1. INITIALIZATION
// ═══════════════════════════════════════════════════

async function init() {
    console.log('🎬 Dictionary Initializing...');

    // 1. Load Config
    await loadConfig();

    // Catch manual config from config.js if dynamic fails
    if (!window.SUPABASE_CONFIG?.url || window.SUPABASE_CONFIG.url === '') {
        await new Promise(r => setTimeout(r, 300));
    }

    // 2. Init Supabase
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.url !== '') {
        supabaseLocal = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase Client Ready');
        // Load Global Site Settings
        await loadSiteSettings();
    } else {
        const listContainer = document.getElementById('dictionaryList');
        listContainer.innerHTML = `
            <div class="p-8 text-center text-red-500 bg-red-900/20 m-4 rounded-xl border border-red-900/50">
                <i data-lucide="alert-triangle" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                <div class="font-bold mb-2 text-lg">설정이 필요합니다</div>
                <div class="text-sm opacity-80 leading-relaxed">
                    js/config.js 파일을 열어<br>Supabase URL과 Anon Key를 입력해 주세요.
                </div>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
        return;
    }

    // 3. Fetch Data
    await fetchData();

    // 4. Setup UI Events
    setupEventListeners();

    // 5. Initial Render
    renderList(dictionaryData);
    renderToolkit();

    // 6. Admin UI Sync (Session Persistence)
    syncAdminUI();

    // Create Lucide Icons
    if (window.lucide) window.lucide.createIcons();
}

function syncAdminUI() {
    if (!supabaseLocal) return;

    supabaseLocal.auth.getSession().then(({ data: { session } }) => {
        window.isAdmin = !!session;
        const addBtn = document.getElementById('addNewBtn');
        const loginBtn = document.getElementById('adminLoginBtn');
        const header = document.querySelector('header h1');

        if (window.isAdmin) {
            console.log('🔓 Admin UI Sync: ON (User:', session.user.email, ')');
            document.body.classList.add('admin-mode');
            setupEditableFields();
            if (addBtn) {
                addBtn.classList.remove('hidden');
                addBtn.onclick = window.showNewItemForm;
            }
            if (loginBtn) {
                loginBtn.innerHTML = '<i data-lucide="unlock" class="w-6 h-6 text-admin"></i>';
            }
            // Badge logic
            const oldBadge = document.querySelector('.admin-badge');
            if (oldBadge) oldBadge.remove();
            if (header) {
                const badge = document.createElement('span');
                badge.className = 'admin-badge rounded-none align-middle ml-2 uppercase font-black';
                badge.innerText = 'Admin';
                header.appendChild(badge);
            }
        } else {
            console.log('🔒 Student View Sync: ON');
            document.body.classList.remove('admin-mode');
            disableEditableFields();
            if (addBtn) addBtn.classList.add('hidden');
            if (loginBtn) loginBtn.innerHTML = '<i data-lucide="key" class="w-6 h-6"></i>';
            const badge = document.querySelector('.admin-badge');
            if (badge) badge.remove();
        }
        if (window.lucide) window.lucide.createIcons();
    });
}

async function loadConfig() {
    // 1. Skip Vercel API if running as a local file (to avoid CORS errors)
    if (window.location.protocol === 'file:') {
        console.log('🏠 Local file detected, skipping Vercel API config');
        return;
    }

    // 2. Try to reach /api/config (Vercel)
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const script = await response.text();
            const mockWindow = { SUPABASE_CONFIG: {}, ADMIN_EMAIL: '' };
            const func = new Function('window', script);
            func(mockWindow);

            if (mockWindow.SUPABASE_CONFIG?.url && mockWindow.SUPABASE_CONFIG.url.trim() !== "") {
                window.SUPABASE_CONFIG = mockWindow.SUPABASE_CONFIG;
                console.log('📡 Config loaded from Vercel API');
            }
            if (mockWindow.ADMIN_EMAIL) {
                window.ADMIN_EMAIL = mockWindow.ADMIN_EMAIL;
            }
        }
    } catch (e) {
        console.warn('⚠️ /api/config fetch failed, using local config');
    }
}

// ═══════════════════════════════════════════════════
// 1. DATA FETCHING & PARSING
// ═══════════════════════════════════════════════════

async function fetchData() {
    try {
        const { posts, categories: catData } = await API.fetchData(supabaseLocal);

        // Map to our dictionary structure
        dictionaryData = posts.map(p => ({
            id: p.id,
            term: p.title,
            summary: Utils.extractSummary(p.content),
            content: p.content,
            category: p.categories?.name || '기타',
            tip: p.tip || '',
            updated_at: p.updated_at
        }));

        // Get unique sorted categories based on display_order
        const seen = new Set();
        categories = (catData || [])
            .map(c => c.name)
            .filter(name => {
                const hasPosts = dictionaryData.some(d => d.category === name);
                if (hasPosts && !seen.has(name)) {
                    seen.add(name);
                    return true;
                }
                return false;
            });

    } catch (err) {
        console.error('❌ Data Fetch Error:', err);
        Utils.showToast(`데이터 불러오기 실패: ${err.message || '알 수 없는 오류'}`, 'error');
    }
}


// ═══════════════════════════════════════════════════
// 2. RENDERING & UI
// ═══════════════════════════════════════════════════

function renderList(data) {
    const listContainer = document.getElementById('dictionaryList');
    listContainer.innerHTML = '';

    if (data.length === 0) {
        listContainer.innerHTML = '<div class="p-8 text-center text-gray-500 animate-fade-in">일치하는 결과가 없습니다.</div>';
        return;
    }

    // Use established category order
    categories.forEach(cat => {
        const items = data.filter(item => item.category === cat);
        if (items.length === 0) return;

        const section = document.createElement('section');
        section.className = 'category-section animate-fade-in';
        section.id = `section-${cat}`;

        const header = document.createElement('h2');
        header.className = 'category-header';
        header.id = `cat-${cat}`;
        header.innerText = cat;
        section.appendChild(header);
        listContainer.appendChild(section);

        // Items
        items.forEach((item) => {
            const el = document.createElement('article');
            el.className = 'dict-item cursor-pointer relative';
            el.innerHTML = `
                <div class="dict-item-inner">
                    <div class="dict-term-container flex justify-between items-start">
                        <header class="dict-term">
                            <h3 class="dict-title-text">${item.term}</h3>
                            <span class="list-category-chip">${item.category}</span>
                        </header>
                        ${window.isAdmin ? '<i data-lucide="edit-2" class="w-4 h-4 text-ink-dim opacity-30 mt-1 flex-shrink-0"></i>' : ''}
                    </div>
                    <div class="dict-content-wrapper">
                        <p class="dict-summary">${item.summary}</p>
                        ${Utils.extractTags(item.summary)}
                    </div>
                </div>
            `;
            el.onclick = () => openBottomSheet(item);
            section.appendChild(el);
        });
    });
}

function renderToolkit() {
    const bar = document.getElementById('toolkitBar');
    bar.innerHTML = '';

    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'w-8 h-8 flex items-center justify-center text-gray-400 hover:text-primary transition-colors';
        btn.innerHTML = `<span class="text-[10px] font-bold">${cat.substring(0, 2)}</span>`;
        btn.onclick = () => {
            const target = document.getElementById(`cat-${cat}`);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        };
        bar.appendChild(btn);
    });
}

// ═══════════════════════════════════════════════════
// 3. INTERACTIONS & LOGIC
// ═══════════════════════════════════════════════════

async function openBottomSheet(item) {
    const overlay = document.getElementById('bottomSheetOverlay');
    const sheet = document.getElementById('bottomSheet');
    const content = document.getElementById('sheetContent');

    const isArchive = item.content.includes('[ARCHIVE]');

    if (isArchive) {
        content.innerHTML = UIRenderer.renderArchiveSheet(item, window.isAdmin);
    } else {
        content.innerHTML = UIRenderer.renderJokboSheet(item, window.isAdmin);
    }

    // Apply current font size
    const bodyEl = content.querySelector('.body-text');
    if (bodyEl) bodyEl.style.fontSize = currentFontSize + 'px';

    overlay.classList.remove('hidden');
    sheet.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('opacity-100');
        sheet.classList.add('translate-y-0');
    }, 10);
    if (window.lucide) window.lucide.createIcons();
}

window.showEditForm = function (id) {
    const item = dictionaryData.find(d => d.id === id);
    if (!item) return;

    const content = document.getElementById('sheetContent');
    content.innerHTML = UIRenderer.renderEditForm(item);

    // Auto-resize logic for textarea
    const textarea = document.getElementById('editContent');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        }, 0);
    }
    if (window.lucide) window.lucide.createIcons();
};

window.toggleBookmark = async function (id, btnEl, event) {
    if (event) event.stopPropagation();
    const idx = bookmarkedIds.indexOf(id);
    if (idx === -1) {
        bookmarkedIds.push(id);
        Utils.showToast('북마크에 추가되었습니다.', 'success');
    } else {
        bookmarkedIds.splice(idx, 1);
        Utils.showToast('북마크가 해제되었습니다.', 'info');
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarkedIds));

    // Update UI if btnEl provided
    if (btnEl) {
        const icon = btnEl.querySelector('i');
        const isBookmarked = bookmarkedIds.includes(id);
        btnEl.classList.toggle('text-gold', isBookmarked);
        btnEl.classList.toggle('text-ink-dim', !isBookmarked);
        if (icon) {
            icon.classList.toggle('fill-current', isBookmarked);
        }
    } else {
        // Fallback for calls from inside sheets or outside list
        renderList(showOnlyBookmarks ? dictionaryData.filter(d => bookmarkedIds.includes(d.id)) : dictionaryData);
        // Refresh the sheet if it's open
        const item = dictionaryData.find(d => d.id === id);
        if (item) openBottomSheet(item);
    }
};

// Formatting logic moved to Utils.js


window.saveItem = async function (id) {
    const newTerm = document.getElementById('editTerm').value;
    const newContent = document.getElementById('editContent').value;

    try {
        await API.saveItem(supabaseLocal, id, { title: newTerm, content: newContent });
        Utils.showToast('저장되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        Utils.showToast('저장 실패: ' + e.message, 'error');
    }
};

window.deleteItem = async function (id) {
    if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) return;

    try {
        await API.deleteItem(supabaseLocal, id);
        Utils.showToast('삭제되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        Utils.showToast('삭제 실패: ' + e.message, 'error');
    }
};

function closeBottomSheet() {
    const sheet = document.getElementById('bottomSheet');
    const overlay = document.getElementById('bottomSheetOverlay');

    overlay.classList.remove('opacity-100');
    sheet.classList.remove('translate-y-0');

    setTimeout(() => {
        overlay.classList.add('hidden');
        sheet.classList.add('hidden');
    }, 300);
}

window.handleInternalLink = function (term) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = term;
    searchInput.dispatchEvent(new Event('input'));
    closeBottomSheet();
};

window.changeFontSize = function (delta) {
    currentFontSize = Math.min(Math.max(currentFontSize + delta, 12), 32);
    localStorage.setItem('preferred_font_size', currentFontSize);
    const bodyEl = document.querySelector('#sheetContent .body-text');
    if (bodyEl) {
        bodyEl.style.fontSize = currentFontSize + 'px';
        showToast(`글자 크기: ${currentFontSize} px`, 'info');
    }
};

// ═══════════════════════════════════════════════════
// 5. DRAG TO CLOSE (BOTTOM SHEET)
// ═══════════════════════════════════════════════════

function setupDragToClose() {
    const sheet = document.getElementById('bottomSheet');
    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    sheet.addEventListener('touchstart', (e) => {
        // Only allow dragging from the top handle area or if at the top of scroll
        const scrollContainer = document.getElementById('sheetContent');
        if (scrollContainer.scrollTop > 0 && e.target.closest('#sheetContent')) return;

        startY = e.touches[0].clientY;
        isDragging = true;
        sheet.style.transition = 'none';
    }, { passive: true });

    sheet.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            sheet.style.transform = `translateY(${diff}px)`;
        }
    }, { passive: true });

    sheet.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        sheet.style.transition = 'transform 0.3s ease-out';

        const diff = currentY - startY;
        if (diff > 150) {
            closeBottomSheet();
        } else {
            sheet.style.transform = 'translateY(0)';
        }
    });
}

// ═══════════════════════════════════════════════════
// 6. UTILS & EVENTS
// ═══════════════════════════════════════════════════

function setupEventListeners() {
    // Search
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = dictionaryData.filter(d =>
            d.term.toLowerCase().includes(val) ||
            d.summary.toLowerCase().includes(val) ||
            d.content.toLowerCase().includes(val)
        );
        renderList(filtered);
    });

    // Emergency Exit
    document.getElementById('emergencyExit').onclick = () => {
        window.location.href = 'https://www.google.com';
    };

    // Overlay Close
    document.getElementById('bottomSheetOverlay').onclick = closeBottomSheet;

    // Bookmark Toggle
    document.getElementById('bookmarkToggle').onclick = () => {
        showOnlyBookmarks = !showOnlyBookmarks;
        const btn = document.getElementById('bookmarkToggle');
        btn.classList.toggle('text-primary', showOnlyBookmarks);

        const filtered = showOnlyBookmarks
            ? dictionaryData.filter(d => bookmarkedIds.includes(d.id))
            : dictionaryData;
        renderList(filtered);
    };

    // Admin Login Trigger
    const loginBtn = document.getElementById('adminLoginBtn');
    if (loginBtn) {
        loginBtn.onclick = () => {
            console.log('🔘 Admin Login Button Clicked');
            if (window.isAdmin) {
                if (confirm('관리자 모드를 종료하시겠습니까?')) {
                    supabaseLocal.auth.signOut().then(() => {
                        syncAdminUI();
                        renderList(dictionaryData);
                        Utils.showToast('로그아웃 되었습니다.', 'success');
                    });
                }
                return;
            }
            window.openLoginModal();
        };
    }

    // Submit Login
    const submitBtn = document.getElementById('submitLoginBtn');
    if (submitBtn) submitBtn.onclick = window.handleLogin;

    // Init Drag to Close
    setupDragToClose();
}

window.openLoginModal = function () {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    if (window.lucide) window.lucide.createIcons();
};

window.closeLoginModal = function () {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.handleLogin = async function () {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('submitLoginBtn');

    if (!email || !password) {
        Utils.showToast('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '로그인 중...';

    try {
        const { error } = await supabaseLocal.auth.signInWithPassword({ email, password });
        if (error) throw error;

        Utils.showToast('로그인 성공!', 'success');
        window.closeLoginModal();
        syncAdminUI();
        renderList(dictionaryData);
    } catch (e) {
        console.error('❌ Login Error:', e);
        Utils.showToast('로그인 실패: ' + (e.message || '다시 시도해주세요.'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

// ═══════════════════════════════════════════════════
// 5. TOAST & UTILS
// ═══════════════════════════════════════════════════

// Toast function moved to utils.js


window.showNewItemForm = function () {
    const categoriesOptions = categories.map(c => `< option value = "${c}" > ${c}</option > `).join('');
    const content = document.getElementById('sheetContent');
    content.innerHTML = `
        < h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-2" >
            <i data-lucide="plus-circle"></i>
            새 항목 추가
        </h2 >
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">카테고리</label>
            <select id="newCategory" class="edit-input">
                ${categoriesOptions}
            </select>
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">용어명</label>
            <input type="text" id="newTerm" class="edit-input" placeholder="용어를 입력하세요">
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">이미지 업로드</label>
            <input type="file" id="imageUpload" class="hidden" accept="image/*" onchange="handleImageUpload(this)">
            <button onclick="document.getElementById('imageUpload').click()" class="w-full py-3 bg-dark border border-gray-800 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-400">
                <i data-lucide="image" class="w-4 h-4"></i> 이미지 선택 (Supabase Storage)
            </button>
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">상세 내용</label>
            <textarea id="newContent" class="edit-input min-h-[150px] text-sm" placeholder="내용을 입력하세요"></textarea>
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">Tip</label>
            <textarea id="newTip" class="edit-input min-h-[60px] text-sm" placeholder="팁을 입력하세요"></textarea>
        </div>
        <button class="w-full py-4 bg-primary text-dark font-bold rounded-xl" onclick="createNewItem()">추가하기</button>
    `;

    // Auto-resize for new content
    const textarea = document.getElementById('newContent');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
    }

    document.getElementById('bottomSheetOverlay').classList.remove('hidden');
    document.getElementById('bottomSheet').classList.remove('hidden');
    setTimeout(() => {
        document.getElementById('bottomSheetOverlay').classList.add('opacity-100');
        document.getElementById('bottomSheet').classList.remove('translate-y-full');
    }, 10);
};

window.createNewItem = async function () {
    const term = document.getElementById('newTerm').value;
    const content = document.getElementById('newContent').value;
    const catName = document.getElementById('newCategory').value;

    try {
        await API.createItem(supabaseLocal, { title: term, content, categoryName: catName });
        Utils.showToast('항목이 추가되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        Utils.showToast('추가 실패: ' + e.message, 'error');
    }
};

// ═══════════════════════════════════════════════════
// 7. SITE SETTINGS & DIRECT EDITING
// ═══════════════════════════════════════════════════

async function loadSiteSettings() {
    try {
        const { data, error } = await supabaseLocal
            .from('archive_posts')
            .select('*')
            .eq('title', 'SITE_GLOBAL_CONFIG')
            .single();

        if (data && data.content) {
            const config = JSON.parse(data.content);
            Object.keys(config).forEach(key => {
                const el = document.querySelector(`[data-key="${key}"]`);
                if (el) el.innerText = config[key];
            });
            window.siteConfigPostId = data.id;
        }
    } catch (e) {
        console.log('ℹ️ No global config found, using defaults.');
    }
}

function setupEditableFields() {
    const fields = document.querySelectorAll('.admin-editable');
    fields.forEach(field => {
        field.contentEditable = true;
        field.onblur = () => saveSiteSettings();
    });
}

function disableEditableFields() {
    const fields = document.querySelectorAll('.admin-editable');
    fields.forEach(field => {
        field.contentEditable = false;
    });
}

async function saveSiteSettings() {
    const fields = document.querySelectorAll('.admin-editable');
    const config = {};
    fields.forEach(field => {
        config[field.getAttribute('data-key')] = field.innerText.trim();
    });

    try {
        if (window.siteConfigPostId) {
            await supabaseLocal
                .from('archive_posts')
                .update({ content: JSON.stringify(config) })
                .eq('id', window.siteConfigPostId);
        } else {
            const { data: catData } = await supabaseLocal.from('categories').select('id').limit(1).single();
            if (!catData) return;

            const { data } = await supabaseLocal
                .from('archive_posts')
                .insert([{
                    title: 'SITE_GLOBAL_CONFIG',
                    content: JSON.stringify(config),
                    category_id: catData.id,
                    is_private: true,
                    origin_free: false
                }])
                .select()
                .single();
            if (data) window.siteConfigPostId = data.id;
        }
        Utils.showToast('사이트 설정이 저장되었습니다.', 'success');
    } catch (e) {
        console.error('Save failed', e);
        Utils.showToast('설정 저장 실패', 'error');
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
