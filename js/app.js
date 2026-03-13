/**
 * SmallSM Dictionary - Core Application Logic
 * Vanilla JS + Supabase integration
 */

function extractSummary(content) {
    if (!content) return '';
    // Strip HTML if any
    let plainText = content.replace(/<[^>]*>/g, '');
    // Strip Markdown symbols: #, ##, **, __, *, _, [, ], (, )
    plainText = plainText.replace(/[#*_\(\)\[\]]/g, '');
    // Replace newlines with spaces
    plainText = plainText.replace(/\n/g, ' ');
    plainText = plainText.trim();
    return plainText.length > 60 ? plainText.substring(0, 57) + '...' : plainText;
}

function extractTags(text) {
    if (!text) return '';
    const words = text.split(/\s+/)
        .map(w => w.replace(/[^가-힣]/g, ''))
        .filter(w => w.length >= 2 && w.length <= 4)
        .filter(w => !['하는', '입니다', '있는', '가장', '대한', '위해', '통해', '것이', '이러한', '그리고'].includes(w));
    const unique = [...new Set(words)].slice(0, 4);
    if (unique.length === 0) return '';
    return '<div class="dict-tags">' + unique.map(w => `<span class="dict-tag">#${w}</span>`).join('') + '</div>';
}

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
        // Fetch posts (dictionary terms)
        const { data: posts, error: postError } = await supabaseLocal
            .from('archive_posts')
            .select('*, categories(name)')
            .eq('is_private', false)
            .order('title', { ascending: true });

        if (postError) throw postError;

        // Fetch categories to ensure we have the correct ordering
        const { data: catData } = await supabaseLocal
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true });

        // Map categories for quick access
        const categoryMap = {};
        if (catData) {
            catData.forEach(c => categoryMap[c.id] = c.name);
        }

        // Map to our dictionary structure
        dictionaryData = posts.map(p => ({
            id: p.id,
            term: p.title,
            summary: extractSummary(p.content),
            content: p.content,
            category: categoryMap[p.category_id] || '기타',
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
        console.error('❌ Data Fetch Error 상세:', err);
        showToast(`데이터 불러오기 실패: ${err.message || '알 수 없는 오류'}`, 'error');
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

        // Header
        const header = document.createElement('div');
        header.className = 'category-header animate-fade-in';
        header.id = `cat-${cat}`;
        header.innerText = cat;
        listContainer.appendChild(header);

        // Items
        items.forEach((item) => {
            const el = document.createElement('div');
            el.className = 'dict-item cursor-pointer animate-fade-in relative';
            el.innerHTML = `
                <div class="dict-item-inner">
                    <div class="dict-term-container flex justify-between items-start">
                        <div class="dict-term">
                            <span class="dict-title-text">${item.term}</span>
                            <span class="list-category-chip">${item.category}</span>
                        </div>
                        ${window.isAdmin ? '<i data-lucide="edit-2" class="w-4 h-4 text-ink-dim opacity-30 mt-1 flex-shrink-0"></i>' : ''}
                    </div>
                    <div class="dict-content-wrapper">
                        <div class="dict-summary">${item.summary}</div>
                        ${extractTags(item.summary)}
                    </div>
                </div>
            `;
            el.onclick = () => openBottomSheet(item);
            listContainer.appendChild(el);
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

function toggleBookmark(id) {
    const idx = bookmarkedIds.indexOf(id);
    if (idx > -1) {
        bookmarkedIds.splice(idx, 1);
    } else {
        bookmarkedIds.push(id);
    }
    localStorage.setItem('bookmarks', JSON.stringify(bookmarkedIds));

    // UI Refresh
    renderList(showOnlyBookmarks ? dictionaryData.filter(d => bookmarkedIds.includes(d.id)) : dictionaryData);

    // If bottom sheet is open, refresh it too
    const item = dictionaryData.find(d => d.id === id);
    if (item) openBottomSheet(item);
}

function openBottomSheet(item) {
    const sheet = document.getElementById('bottomSheet');
    const overlay = document.getElementById('bottomSheetOverlay');
    const content = document.getElementById('sheetContent');
    const isBookmarked = bookmarkedIds.includes(item.id);

    // Parse content
    let body = item.content || '';
    let formattedBody = '';
    const isArchive = body.includes('[ARCHIVE]');

    if (isArchive) {
        // For archive content, we first render the structure
        const archiveData = window.ArchiveRenderer ? ArchiveRenderer.parseContent(body) : null;
        if (archiveData) {
            formattedBody = ArchiveRenderer.render(archiveData);
            // Apply internal link conversion ONLY to the final rendered HTML content inside the archive
            formattedBody = formattedBody.replace(/\[([^\]]+)\]/g, (match, term) => {
                return `<span class="internal-link" onclick="handleInternalLink('${term}')">${term}</span>`;
            });
            // Refresh icons for archive content (e.g., star icon in tips)
            setTimeout(() => { if (window.lucide) window.lucide.createIcons(); }, 0);
        } else {
            formattedBody = window.marked ? marked.parse(body) : body;
        }
    } else {
        // Standard (Legacy) Processing
        // 1. Internal Links
        body = body.replace(/\[([^\]]+)\]/g, (match, term) => {
            return `<span class="internal-link" onclick="handleInternalLink('${term}')">${term}</span>`;
        });
        // 2. Markdown
        formattedBody = window.marked ? marked.parse(body) : body;
        // 3. Jokbo Styling
        formattedBody = formatJokboContent(formattedBody);
    }

    content.innerHTML = `
        <div class="secret-stamp">SECRET / 족보</div>
        
        <div class="jokbo-header">
            <div class="jokbo-meta">202X SPRING SEMESTER / MAJOR SELECTIVE</div>
            <h2 class="sheet-title">${item.term}</h2>
            <div class="flex justify-between items-end mt-4">
                <div class="text-[10px] font-bold text-ink-dim">아카이브 관리: <span class="text-white">Admin Anonymous</span></div>
                <div class="jokbo-fields">
                    <div class="flex items-center gap-1 font-sans">학번: <span class="jokbo-field">________</span></div>
                    <div class="flex items-center gap-1 font-sans">성명: <span class="jokbo-field">________</span></div>
                </div>
            </div>
        </div>

        <div class="flex justify-between items-center mb-8">
            <span class="category-chip">CATEGORY: ${item.category}</span>
            <button onclick="toggleBookmark('${item.id}')" class="p-2 ${isBookmarked ? 'text-primary' : 'text-ink-dim'}">
                <i data-lucide="${isBookmarked ? 'star' : 'bookmark'}" class="w-8 h-8"></i>
            </button>
        </div>

        <div class="body-text mb-6 ${isArchive ? '' : 'whitespace-pre-wrap'} leading-relaxed prose prose-invert max-w-none">
            ${formattedBody}
        </div>

        ${item.tip ? `
        <div class="admin-tip">
            <span class="tip-label">★ ARCHIVE TIP</span>
            <div class="text-sm opacity-90">${item.tip}</div>
        </div>
        ` : ''}

        <div class="jokbo-footer">
            CONFIDENTIAL / DO NOT DISTRIBUTE
        </div>

        <div class="flex gap-4 mb-8 font-sans mt-10">
            <button onclick="changeFontSize(-2)" class="flex-1 bg-white/5 border border-white/10 py-3 flex items-center justify-center gap-2 text-xs font-bold active:bg-white/20 transition-all text-white">
                글자 축소
            </button>
            <button onclick="changeFontSize(2)" class="flex-1 bg-white/5 border border-white/10 py-3 flex items-center justify-center gap-2 text-xs font-bold active:bg-white/20 transition-all text-white">
                글자 확대
            </button>
        </div>
        ${window.isAdmin ? `<button class="w-full py-5 bg-primary text-white font-black text-lg mt-4 active:scale-95 transition-all rounded-none" onclick="enableEditMode('${item.id}')">항목 수정 (관리 전용)</button>` : ''}
    `;

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

function formatJokboContent(html) {
    if (!html) return '';

    // 1. Convert leading numbers/letters to Circles (①, ②...)
    // Applied to paragraphs starting with (1), 1. etc.
    html = html.replace(/<p>(\(?([0-9]|[A-Z])\)?[\.\)]\s+)(.*?)(<\/p>)/gm, (match, p1, num, title, p2) => {
        const circles = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
        const label = circles[parseInt(num)] || (num + '.');
        return `<div class="section-title"><span>${label}</span> ${title}</div>`;
    });

    // 2. Highlights (Strong tags from **bold** -> Gold Highlighter)
    html = html.replace(/<strong>(.*?)<\/strong>/g, '<span class="highlight-gold">$1</span>');

    // 3. Underline keywords
    // 'text' -> Red Underline (Professor's Pen)
    html = html.replace(/'([^']+)'/g, '<span class="keyword-red">$1</span>');
    // `text` -> Blue Underline (Admin Pen)
    html = html.replace(/`([^`]+)`/g, '<span class="keyword-blue">$1</span>');

    // 4. Admin tip detection (★ or Tip:)
    html = html.replace(/<p>(★|Tip:)(.*?)<\/p>/g, '<div class="admin-tip"><span class="tip-label">$1 ADMIN\'S TIP</span>$2</div>');

    // 5. Academic Table styling
    html = html.replace(/<table>/g, '<table class="jokbo-table">');
    html = html.replace(/<thead>/g, '<thead class="bg-black/20">');
    // Apply alternating red/blue headers for 2-column tables
    html = html.replace(/<tr>\s*<th>(.*?)<\/th>\s*<th>(.*?)<\/th>\s*<\/tr>/g, (match, c1, c2) => {
        return `<tr><th class="th-red">${c1}</th><th class="th-blue">${c2}</th></tr>`;
    });

    return html;
}

window.enableEditMode = function (id) {
    const item = dictionaryData.find(d => d.id === id);
    if (!item) return;

    const content = document.getElementById('sheetContent');
    content.innerHTML = `
        < h2 class="text-xl font-bold text-primary mb-6 flex items-center gap-2" >
            <i data-lucide="shield-check"></i>
            관리자 편집
        </h2 >
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">용어명</label>
            <input type="text" id="editTerm" class="edit-input" value="${item.term}">
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">이미지 업로드</label>
            <input type="file" id="imageUpload" class="hidden" accept="image/*" onchange="handleImageUpload(this)">
            <button onclick="document.getElementById('imageUpload').click()" class="w-full py-3 bg-dark border border-gray-800 rounded-lg flex items-center justify-center gap-2 text-sm text-gray-400">
                <i data-lucide="image" class="w-4 h-4"></i> 이미지 선택 (Supabase Storage)
            </button>
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">상세 내용 (Markdown 지원)</label>
            <textarea id="editContent" class="edit-input min-h-[150px] text-sm">${item.content}</textarea>
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">Tip (한 줄 팁 또는 보충 설명)</label>
            <textarea id="editTip" class="edit-input min-h-[60px] text-sm">${item.tip || ''}</textarea>
        </div>
        <div class="flex gap-2">
            <button class="flex-1 py-3 bg-primary text-dark font-bold rounded-lg" onclick="saveItem('${id}')">저장</button>
            <button class="px-4 py-3 bg-red-900/50 text-red-500 rounded-lg" onclick="deleteItem('${id}')">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `;

    // Auto-resize logic for textarea
    const textarea = document.getElementById('editContent');
    if (textarea) {
        textarea.addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
        });
        // Initial trigger
        setTimeout(() => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight) + 'px';
        }, 0);
    }

    if (window.lucide) window.lucide.createIcons();
};

window.saveItem = async function (id) {
    const newTerm = document.getElementById('editTerm').value;
    const newContent = document.getElementById('editContent').value;
    const newTip = document.getElementById('editTip').value;

    try {
        const { error } = await supabaseLocal
            .from('archive_posts')
            .update({
                title: newTerm,
                content: newContent,
                tip: newTip,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        showToast('저장되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        showToast('저장 실패: ' + e.message, 'error');
    }
};

window.deleteItem = async function (id) {
    if (!confirm('정말로 이 항목을 삭제하시겠습니까?')) return;

    try {
        const { error } = await supabaseLocal
            .from('archive_posts')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showToast('삭제되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        showToast('삭제 실패: ' + e.message, 'error');
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
                        showToast('로그아웃 되었습니다.', 'success');
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
        showToast('이메일과 비밀번호를 입력해주세요.', 'error');
        return;
    }

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = '로그인 중...';

    try {
        const { error } = await supabaseLocal.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        showToast('로그인 성공!', 'success');
        window.closeLoginModal();
        syncAdminUI();
        renderList(dictionaryData);
    } catch (e) {
        console.error('❌ Login Error:', e);
        showToast('로그인 실패: ' + (e.message || '다시 시도해주세요.'), 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = originalText;
    }
};

// ═══════════════════════════════════════════════════
// 5. TOAST & UTILS
// ═══════════════════════════════════════════════════

function showToast(msg, type = 'info') {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full text-sm font-bold z-[200] transition-all transform translate-y-20 opacity-0';
        document.body.appendChild(toast);
    }

    toast.innerText = msg;
    toast.style.backgroundColor = type === 'success' ? 'var(--bg-paper)' : (type === 'error' ? 'var(--primary)' : 'var(--bg-paper-dark)');
    toast.style.color = type === 'success' ? 'var(--ink)' : (type === 'error' ? 'white' : 'var(--ink)');

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

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
    const tip = document.getElementById('newTip').value;
    const catName = document.getElementById('newCategory').value;

    try {
        // Need to find category ID
        const { data: catData } = await supabaseLocal.from('categories').select('id').eq('name', catName).single();

        const { error } = await supabaseLocal
            .from('archive_posts')
            .insert([{
                title: term,
                content: content,
                tip: tip,
                category_id: catData.id,
                is_private: false,
                origin_free: false
            }]);

        if (error) throw error;

        showToast('항목이 추가되었습니다.', 'success');
        await fetchData();
        renderList(dictionaryData);
        closeBottomSheet();
    } catch (e) {
        showToast('추가 실패: ' + e.message, 'error');
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
            // Need a category to save a post
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
        showToast('사이트 설정이 저장되었습니다.', 'success');
    } catch (e) {
        console.error('Save failed', e);
    }
}

// Start
document.addEventListener('DOMContentLoaded', init);
