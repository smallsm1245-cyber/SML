/**
 * SmallSM Dictionary - Core Application Logic
 * Vanilla JS + Supabase integration
 */

let supabaseLocal = null;
let dictionaryData = [];
let categories = [];
let isAdmin = sessionStorage.getItem('admin_session') === 'true';
let bookmarkedIds = JSON.parse(localStorage.getItem('bookmarks') || '[]');
let showOnlyBookmarks = false;

// ═══════════════════════════════════════════════════
// 1. INITIALIZATION
// ═══════════════════════════════════════════════════

async function init() {
    console.log('🎬 Dictionary Initializing...');

    // 1. Load Config
    await loadConfig();

    // 2. Init Supabase
    if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.url !== '') {
        supabaseLocal = supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );
        console.log('✅ Supabase Client Ready');
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

    // Admin UI Sync (if session exists)
    if (isAdmin) {
        const addBtn = document.getElementById('addNewBtn');
        if (addBtn) {
            addBtn.classList.remove('hidden');
            addBtn.onclick = window.showNewItemForm;
        }
        const loginBtn = document.getElementById('adminLoginBtn');
        if (loginBtn) loginBtn.innerHTML = '<i data-lucide="unlock" class="w-5 h-5 text-orange-500"></i>';
    }

    // Create Lucide Icons
    if (window.lucide) window.lucide.createIcons();
}

async function loadConfig() {
    // Try to reach /api/config (Vercel) first
    try {
        const response = await fetch('/api/config');
        if (response.ok) {
            const script = await response.text();
            // This script usually sets window.SUPABASE_CONFIG
            const func = new Function(script);
            func();
        }
    } catch (e) {
        console.warn('⚠️ /api/config fetch failed, using local or window config');
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
        catData?.forEach(c => categoryMap[c.id] = c.name);

        // Map to our dictionary structure
        dictionaryData = posts.map(p => ({
            id: p.id,
            term: p.title,
            summary: extractSummary(p.content),
            content: p.content,
            category: categoryMap[p.category_id] || '기타',
            updated_at: p.updated_at
        }));

        // Get unique sorted categories based on display_order
        const seen = new Set();
        categories = catData
            ?.map(c => c.name)
            .filter(name => {
                const hasPosts = dictionaryData.some(d => d.category === name);
                if (hasPosts && !seen.has(name)) {
                    seen.add(name);
                    return true;
                }
                return false;
            }) || [];

    } catch (err) {
        console.error('❌ Data Fetch Error:', err);
        showToast('데이터를 불러오는데 실패했습니다.', 'error');
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
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'dict-item cursor-pointer animate-fade-in';
            el.innerHTML = `
                <div class="dict-term">${item.term}</div>
                <div class="dict-summary text-xs">${item.summary}</div>
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

    // Parse internal links [[Term]] or [Term]
    let body = item.content || '';
    body = body.replace(/\[([^\]]+)\]/g, (match, term) => {
        return `<span class="internal-link" onclick="handleInternalLink('${term}')">${term}</span>`;
    });

    content.innerHTML = `
        <div class="flex justify-between items-start mb-2">
            <h2 class="text-2xl font-bold text-primary">${item.term}</h2>
            <button onclick="toggleBookmark('${item.id}')" class="p-2 ${isBookmarked ? 'text-primary' : 'text-gray-600'}">
                <i data-lucide="${isBookmarked ? 'star' : 'bookmark'}" class="w-6 h-6"></i>
            </button>
        </div>
        <div class="text-xs text-gray-500 mb-6 uppercase tracking-widest">${item.category}</div>
        <div class="prose prose-invert text-light leading-relaxed mb-10 whitespace-pre-wrap">
            ${body}
        </div>
        ${isAdmin ? `<button class="w-full py-4 bg-orange-500 text-dark font-bold rounded-xl mb-4" onclick="enableEditMode('${item.id}')">수정하기</button>` : ''}
    `;

    overlay.classList.remove('hidden');
    sheet.classList.remove('hidden');

    setTimeout(() => {
        overlay.classList.add('opacity-100');
        sheet.classList.remove('translate-y-full');
    }, 10);
    if (window.lucide) window.lucide.createIcons();
}

window.enableEditMode = function (id) {
    const item = dictionaryData.find(d => d.id === id);
    if (!item) return;

    const content = document.getElementById('sheetContent');
    content.innerHTML = `
        <h2 class="text-xl font-bold text-orange-500 mb-4">관리자 편집</h2>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">용어명</label>
            <input type="text" id="editTerm" class="edit-input" value="${item.term}">
        </div>
        <div class="mb-4">
            <label class="block text-xs text-gray-500 mb-1">상세 내용 (Markdown 지원)</label>
            <textarea id="editContent" class="edit-input min-h-[200px] text-sm">${item.content}</textarea>
        </div>
        <div class="flex gap-2">
            <button class="flex-1 py-3 bg-primary text-dark font-bold rounded-lg" onclick="saveItem('${id}')">저장</button>
            <button class="px-4 py-3 bg-red-900/50 text-red-500 rounded-lg" onclick="deleteItem('${id}')">
                <i data-lucide="trash-2"></i>
            </button>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
};

window.saveItem = async function (id) {
    const newTerm = document.getElementById('editTerm').value;
    const newContent = document.getElementById('editContent').value;

    try {
        const { error } = await supabaseLocal
            .from('archive_posts')
            .update({ title: newTerm, content: newContent, updated_at: new Date().toISOString() })
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
    sheet.classList.add('translate-y-full');

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

// ═══════════════════════════════════════════════════
// 4. UTILS & EVENTS
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

    // Admin Login (Fake/Simple for now)
    document.getElementById('adminLoginBtn').onclick = () => {
        if (isAdmin) {
            if (confirm('관리자 모드를 종료하시겠습니까?')) {
                isAdmin = false;
                sessionStorage.removeItem('admin_session');
                location.reload();
            }
            return;
        }
        const pass = prompt('관리자 비밀번호를 입력하세요:');
        if (pass === 'admin') { // Replace with real auth logic
            isAdmin = true;
            sessionStorage.setItem('admin_session', 'true');
            document.getElementById('addNewBtn').classList.remove('hidden');
            document.getElementById('addNewBtn').onclick = window.showNewItemForm;
            document.getElementById('adminLoginBtn').innerHTML = '<i data-lucide="unlock" class="w-5 h-5 text-orange-500"></i>';
            if (window.lucide) window.lucide.createIcons();
            showToast('관리자 모드 활성화', 'success');
            renderList(dictionaryData); // Refresh to show edit buttons
        }
    };
}

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
    toast.style.backgroundColor = type === 'success' ? 'var(--primary)' : (type === 'error' ? '#ef4444' : 'var(--bg-dark-alt)');
    toast.style.color = type === 'success' ? 'var(--bg-dark)' : 'white';

    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

window.showNewItemForm = function () {
    const categoriesOptions = categories.map(c => `<option value="${c}">${c}</option>`).join('');
    const content = document.getElementById('sheetContent');
    content.innerHTML = `
        <h2 class="text-xl font-bold text-orange-500 mb-4">새 항목 추가</h2>
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
            <label class="block text-xs text-gray-500 mb-1">상세 내용</label>
            <textarea id="newContent" class="edit-input min-h-[200px] text-sm" placeholder="내용을 입력하세요"></textarea>
        </div>
        <button class="w-full py-4 bg-primary text-dark font-bold rounded-xl" onclick="createNewItem()">추가하기</button>
    `;

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
        // Need to find category ID
        const { data: catData } = await supabaseLocal.from('categories').select('id').eq('name', catName).single();

        const { error } = await supabaseLocal
            .from('archive_posts')
            .insert([{
                title: term,
                content: content,
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

// Start
document.addEventListener('DOMContentLoaded', init);
