/**
 * js/admin-inline.js
 * Front-end management script for SmallSM Archive.
 * Handles admin toolbar, edit mode, and inline editing.
 */

(function () {
    'use strict';

    let supabaseClient = null;
    let isAdmin = false;
    let isEditMode = false;
    const ADMIN_EMAIL = 'smallsm@naver.com';

    // Markdown Converters
    let turndownService = null;
    let showdownConverter = null;

    function initConverters() {
        if (turndownService && showdownConverter) return;

        if (typeof TurndownService !== 'undefined') {
            turndownService = new TurndownService({
                headingStyle: 'atx',
                hr: '---',
                bulletListMarker: '-',
                codeBlockStyle: 'fenced'
            });
        }

        if (typeof showdown !== 'undefined') {
            showdownConverter = new showdown.Converter({
                tables: true,
                strikethrough: true,
                tasklists: true,
                simpleLineBreaks: true,
                openLinksInNewWindow: true
            });
        }
    }

    // ═══════════════════════════════════════════════════
    // 1. INITIALIZATION & AUTH
    // ═══════════════════════════════════════════════════

    async function init() {
        console.log('🛡️ Admin Inline Module Initializing...');

        // Wait for config
        await waitForSupabase();

        // Check Auth
        isAdmin = await checkAdminStatus();

        if (isAdmin) {
            console.log('✅ Admin detected. Loading management tools.');
            injectAdminToolbar();
            setupEventListeners();
        }
    }

    function waitForSupabase() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                // 1) First priority: use already initialized global client
                if (window.supabaseClient) {
                    supabaseClient = window.supabaseClient;
                    clearInterval(interval);
                    resolve();
                    return;
                }

                // 2) Second priority: initialize if libs are ready but global client isn't
                if (window.supabase && window.SUPABASE_CONFIG) {
                    supabaseClient = window.supabase.createClient(
                        window.SUPABASE_CONFIG.url,
                        window.SUPABASE_CONFIG.anonKey
                    );
                    window.supabaseClient = supabaseClient; // Sync back
                    clearInterval(interval);
                    resolve();
                }
            }, 100);
        });
    }

    async function checkAdminStatus() {
        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            if (error || !user) return false;
            return user.email === ADMIN_EMAIL;
        } catch (e) {
            return false;
        }
    }

    // ═══════════════════════════════════════════════════
    // 2. UI INJECTION (TOOLBAR)
    // ═══════════════════════════════════════════════════

    function injectAdminToolbar() {
        if (document.getElementById('adminInlineToolbar')) return;

        const toolbar = document.createElement('div');
        toolbar.id = 'adminInlineToolbar';
        toolbar.className = 'admin-inline-toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-content">
                <div class="toolbar-left">
                    <span class="toolbar-brand">🎬 ADMIN</span>
                    <div class="mode-switch-wrap">
                        <label class="switch">
                            <input type="checkbox" id="adminEditModeSwitch">
                            <span class="slider round"></span>
                        </label>
                        <span class="mode-label">Edit Mode</span>
                    </div>
                </div>
                <div class="toolbar-right">
                    <button class="toolbar-btn" id="btnNewPostInline" title="New Post">
                        <i data-lucide="plus"></i>
                    </button>
                    <button class="toolbar-btn" id="btnGoDashboard" onclick="window.location.href='admin.html'" title="Dashboard">
                        <i data-lucide="layout-dashboard"></i>
                    </button>
                    <button class="toolbar-btn" id="btnLogOutInline" title="Logout">
                        <i data-lucide="log-out"></i>
                    </button>
                </div>
            </div>
        `;
        document.body.prepend(toolbar);
        document.body.classList.add('has-admin-toolbar');

        // Initialize Lucide icons if available
        if (window.lucide) {
            window.lucide.createIcons({
                attrs: {
                    'class': 'lucide-icon'
                }
            });
        }

        // Handle Mode Switch
        const switchInput = document.getElementById('adminEditModeSwitch');
        switchInput.addEventListener('change', (e) => {
            toggleEditMode(e.target.checked);
        });

        // Handle Logout
        document.getElementById('btnLogOutInline').addEventListener('click', async () => {
            if (confirm('로그아웃 하시겠습니까?')) {
                document.body.classList.remove('has-admin-toolbar');
                await supabaseClient.auth.signOut();
                window.location.reload();
            }
        });

        // Handle New Post
        document.getElementById('btnNewPostInline').addEventListener('click', () => {
            openContentEditorModal('new', 'content');
        });
    }

    function toggleEditMode(enabled) {
        isEditMode = enabled;
        document.body.classList.toggle('admin-edit-active', isEditMode);

        // 외부에서 Edit Mode 상태를 확인할 수 있도록 전역 함수 노출
        window.isAdminEditMode = () => isEditMode;

        if (isEditMode) {
            showToast('편집 모드가 활성화되었습니다.', 'info');
            enableInlineTriggers();
            loadCategoriesForManager();

            // 현재 열린 세부성향 모달에도 즉시 편집 UI 주입
            if (typeof window.activateKinkModalEditMode === 'function') {
                window.activateKinkModalEditMode(true);
            }
        } else {
            showToast('편집 모드가 비활성화되었습니다.');
            disableInlineTriggers();
            removeCategoryManager();

            // 현재 열린 세부성향 모달에서 편집 UI 제거
            if (typeof window.activateKinkModalEditMode === 'function') {
                window.activateKinkModalEditMode(false);
            }
        }
    }

    // ═══════════════════════════════════════════════════
    // 3. INLINE EDITING LOGIC
    // ═══════════════════════════════════════════════════

    function enableInlineTriggers() {
        document.body.addEventListener('click', handleElementClick);
    }

    function disableInlineTriggers() {
        document.body.removeEventListener('click', handleElementClick);
    }

    async function handleElementClick(e) {
        if (!isEditMode) return;

        const el = e.target.closest('[data-admin-editable]');
        if (!el) return;

        const type = el.dataset.adminEditable; // text, content, image
        const id = el.dataset.adminId;
        const field = el.dataset.adminField;

        if (!id || !field) return;

        e.preventDefault();
        e.stopPropagation();

        if (type === 'text') {
            startTextEdit(el, id, field);
        } else if (type === 'content') {
            startContentEdit(el, id, field);
        } else if (type === 'image') {
            triggerImageUpload(el, id, field);
        }
    }

    function startContentEdit(el, id, field) {
        openContentEditorModal(id, field, el);
    }

    function triggerImageUpload(el, id, field) {
        showToast('이미지 교체 기능 수동 대응 필요 (Storage 권한)', 'info');
    }

    function startTextEdit(el, id, field) {
        if (el.dataset.editing === 'true') return;
        el.dataset.editing = 'true';

        const originalText = el.innerText;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'admin-inline-input';

        // Match original styles roughly
        const style = window.getComputedStyle(el);
        input.style.fontSize = style.fontSize;
        input.style.fontWeight = style.fontWeight;
        input.style.textAlign = style.textAlign;
        input.style.color = style.color;
        input.style.width = '100%';

        const finishEdit = async () => {
            const newValue = input.value.trim();
            el.innerText = newValue;
            delete el.dataset.editing;

            if (newValue !== originalText) {
                await saveChange(id, field, newValue);
            }
        };

        input.addEventListener('blur', finishEdit);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = originalText;
                input.blur();
            }
        });

        el.innerHTML = '';
        el.appendChild(input);
        input.focus();
    }

    // ═══════════════════════════════════════════════════
    // 4. MODAL EDITOR (Full Content)
    // ═══════════════════════════════════════════════════

    let editorInstance = null;
    let currentModalId = null;
    let currentModalField = null;

    async function openContentEditorModal(id, field, sourceEl) {
        currentModalId = id;
        currentModalField = field;

        injectModalHTML();

        const modal = document.getElementById('adminEditorModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        let markdown = '';
        if (id === 'new') {
            markdown = '';
        } else if (sourceEl && sourceEl.classList.contains('toastui-editor-contents')) {
            showToast('데이터 불러오는 중...', 'loading');
            markdown = await fetchContent(id, field);
        } else {
            markdown = sourceEl ? sourceEl.innerHTML : '';
        }

        initModalEditor(markdown);
    }

    async function fetchContent(id, field) {
        try {
            if (id.startsWith('setting:')) {
                const key = id.replace('setting:', '');
                const { data, error } = await supabaseClient.from('settings').select('value').eq('key', key).single();
                if (error) throw error;
                return data.value;
            } else {
                const { data, error } = await supabaseClient.from('archive_posts').select(field).eq('id', id).single();
                if (error) throw error;
                return data[field];
            }
        } catch (e) {
            console.error('Fetch failed:', e);
            return '';
        }
    }

    function injectModalHTML() {
        if (document.getElementById('adminEditorModal')) return;

        const modalHtml = `
            <div id="adminEditorModal" class="admin-modal-overlay">
                <div class="admin-modal-content">
                    <div class="modal-header">
                        <h2 id="modalTitle">Edit Content</h2>
                        <button class="modal-close" id="btnCloseModal">✕</button>
                    </div>
                    <div class="modal-body">
                        <div id="modalEditorContainer"></div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" id="btnCancelEdit">Cancel</button>
                        <button class="btn-save" id="btnSaveEdit">Save Changes</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('btnCloseModal').onclick = closeModal;
        document.getElementById('btnCancelEdit').onclick = closeModal;
        document.getElementById('btnSaveEdit').onclick = handleModalSave;
    }

    function initModalEditor(content) {
        initConverters();

        if (typeof $ === 'undefined' || typeof $.fn.summernote === 'undefined') {
            showToast('Loading Summernote...', 'loading');

            // Sequential loading of dependencies
            loadScript('https://code.jquery.com/jquery-3.6.0.min.js', () => {
                loadStyle('https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.css', () => {
                    loadScript('https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote-lite.min.js', () => {
                        loadScript('https://unpkg.com/turndown/dist/turndown.js', () => {
                            loadScript('https://cdnjs.cloudflare.com/ajax/libs/showdown/2.1.0/showdown.min.js', () => {
                                initConverters();
                                createEditor(content);
                            });
                        });
                    });
                });
            });
        } else {
            createEditor(content);
        }
    }

    function createEditor(content) {
        const container = document.getElementById('modalEditorContainer');
        container.innerHTML = '<div id="summernoteModal"></div>';

        const htmlContent = showdownConverter ? showdownConverter.makeHtml(content || '') : content;

        $('#summernoteModal').summernote({
            height: 400,
            dialogsInBody: true,
            lang: 'ko-KR',
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'hr']],
                ['view', ['fullscreen', 'codeview']]
            ]
        });

        $('#summernoteModal').summernote('code', htmlContent);
        showToast('에디터 준비 완료', 'info');
    }

    function closeModal() {
        const modal = document.getElementById('adminEditorModal');
        if (modal) modal.classList.remove('active');
        document.body.style.overflow = '';
        editorInstance = null;
    }

    async function handleModalSave() {
        const summernoteEl = document.getElementById('summernoteModal');
        if (!summernoteEl) return;

        const htmlContent = $('#summernoteModal').summernote('code');
        const markdown = turndownService ? turndownService.turndown(htmlContent) : htmlContent;

        let title = 'New Post';
        if (currentModalId === 'new') {
            title = prompt('게시물 제목을 입력하세요:', '새 기록');
            if (!title) return;
        }

        await saveChange(currentModalId, currentModalField, markdown, title);
        closeModal();

        // _kinkEditorSaveCallback이 있으면 리로드 없이 모달 내용 즉시 갱신
        if (typeof window._kinkEditorSaveCallback === 'function') {
            window._kinkEditorSaveCallback(markdown);
            window._kinkEditorSaveCallback = null;
        } else {
            // Refresh appropriate view
            setTimeout(() => window.location.reload(), 1000);
        }
    }

    async function saveChange(id, field, value, title = null) {
        try {
            showToast('저장 중...', 'loading');

            if (id === 'new') {
                // Get category from current view if possible
                let categoryId = null;
                const path = window.location.hash || '';
                if (path.includes('category-')) {
                    categoryId = path.split('category-')[1];
                }

                if (!categoryId) {
                    showToast('카테고리를 로드하는 중...', 'loading');
                    const { data: cats } = await supabaseClient.from('categories').select('id, name').eq('is_visible', true).not('parent_id', 'is', null).order('display_order');
                    if (cats && cats.length > 0) {
                        const catNames = cats.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
                        const selection = prompt(`카테고리를 선택하세요:\n${catNames}`, '1');
                        if (selection) {
                            const idx = parseInt(selection) - 1;
                            if (cats[idx]) categoryId = cats[idx].id;
                        }
                    }
                }

                if (!categoryId) {
                    showToast('카테고리가 필요합니다.', 'error');
                    return;
                }

                const { error } = await supabaseClient
                    .from('archive_posts')
                    .insert([{
                        title: title || '새 기록',
                        content: value,
                        category_id: categoryId,
                        is_private: false,
                        origin_free: false
                    }]);
                if (error) throw error;
            } else if (id.startsWith('setting:')) {
                const key = id.replace('setting:', '');
                // For settings, we might want to keep HTML or convert to MD depending on usage
                // But the requirement is to keep MD in DB.
                const { error } = await supabaseClient
                    .from('settings')
                    .update({ value: value, updated_at: new Date().toISOString() })
                    .eq('key', key);
                if (error) throw error;
            } else {
                const updateObj = {};
                updateObj[field] = value;
                updateObj.updated_at = new Date().toISOString();

                const { error } = await supabaseClient
                    .from('archive_posts')
                    .update(updateObj)
                    .eq('id', id);
                if (error) throw error;
            }

            showToast('변경사항이 저장되었습니다.', 'success');
        } catch (e) {
            console.error('Save failed:', e);
            showToast('저장 실패: ' + e.message, 'error');
        }
    }

    async function deletePostInline(id, title) {
        if (!confirm(`'${title}' 게시물을 삭제하시겠습니까?`)) return;

        try {
            showToast('삭제 중...', 'loading');
            const { error } = await supabaseClient
                .from('archive_posts')
                .delete()
                .eq('id', id);

            if (error) throw error;

            showToast('게시물이 삭제되었습니다.', 'success');
            // Refresh view
            const item = document.querySelector(`[data-admin-id="${id}"]`)?.closest('.admin-post-item');
            if (item) {
                item.style.transition = 'all 0.5s';
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                setTimeout(() => item.remove(), 500);
            } else {
                setTimeout(() => window.location.reload(), 1000);
            }
        } catch (e) {
            console.error('Delete failed:', e);
            showToast('삭제 실패: ' + e.message, 'error');
        }
    }

    function showToast(message, type = 'default') {
        let toastContainer = document.getElementById('adminToastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'adminToastContainer';
            toastContainer.className = 'admin-toast-container';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `admin-toast toast-${type}`;

        let icon = 'info';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'alert-circle';
        if (type === 'loading') icon = 'loader';

        toast.innerHTML = `
            <div class="toast-icon"><i data-lucide="${icon}"></i></div>
            <div class="toast-message">${message}</div>
        `;

        toastContainer.appendChild(toast);

        if (window.lucide) window.lucide.createIcons();

        if (type !== 'loading') {
            setTimeout(() => {
                toast.classList.add('toast-fade-out');
                setTimeout(() => toast.remove(), 500);
            }, 3000);

            const loadings = toastContainer.querySelectorAll('.toast-loading');
            loadings.forEach(l => l.remove());
        }
    }

    function loadScript(src, cb) {
        const s = document.createElement('script');
        s.src = src;
        s.onload = cb;
        document.head.appendChild(s);
    }

    function loadStyle(href, cb) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = href;
        if (cb) l.onload = cb;
        document.head.appendChild(l);
    }

    function setupEventListeners() {
        window.deletePostInline = deletePostInline;
        window.editCategoryInline = editCategoryInline;
        window.deleteCategoryInline = deleteCategoryInline;
        window.moveCategoryInline = moveCategoryInline;
        window.addCategoryInline = addCategoryInline;
        window.saveCategoryChanges = saveCategoryChanges;
        window.toggleCatVisibility = toggleCatVisibility;
        // 성향 백과 모달 편집을 위해 전역 노출
        window.openContentEditorModal = openContentEditorModal;
        window.isAdminEditMode = () => isEditMode;
    }

    // ═══════════════════════════════════════════════════
    // 8. CATEGORY INLINE MANAGEMENT
    // ═══════════════════════════════════════════════════

    let managedCategories = [];
    let deletedCatIds = new Set();
    let originalCategoryHTML = '';

    async function loadCategoriesForManager() {
        try {
            const { data, error } = await supabaseClient
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            managedCategories = (data || []).map(c => ({ ...c, is_sub: !!c.parent_id }));
            deletedCatIds.clear();
            renderCategoryManager();
        } catch (err) {
            console.error('카테고리 로드 실패:', err);
            showToast('카테고리 로드 실패', 'error');
        }
    }

    function renderCategoryManager() {
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        const nav = document.getElementById('categoryNav');
        if (nav && !originalCategoryHTML) {
            originalCategoryHTML = nav.innerHTML;
        }

        // Remove existing manager
        const existing = document.getElementById('adminCategoryManager');
        if (existing) existing.remove();

        // Build hierarchy
        const roots = managedCategories.filter(c => !c.parent_id);
        const childrenMap = {};
        managedCategories.filter(c => c.parent_id).forEach(c => {
            if (!childrenMap[c.parent_id]) childrenMap[c.parent_id] = [];
            childrenMap[c.parent_id].push(c);
        });

        let html = '<div class="admin-cat-list">';
        roots.forEach((root, idx) => {
            const isHidden = !root.is_visible;
            html += `
                <div class="admin-cat-item parent" data-id="${root.id}">
                    <div class="admin-cat-row">
                        <span class="admin-cat-badge parent">📁</span>
                        <input type="text" class="admin-cat-name" value="${root.name}" 
                               onchange="editCategoryInline('${root.id}', this.value)">
                        <div class="admin-cat-actions">
                            <button onclick="moveCategoryInline('${root.id}','up')" title="위로">⬆</button>
                            <button onclick="moveCategoryInline('${root.id}','down')" title="아래로">⬇</button>
                            <button onclick="toggleCatVisibility('${root.id}')" title="표시/숨김">${isHidden ? '🙈' : '👁️'}</button>
                            <button onclick="deleteCategoryInline('${root.id}')" class="danger" title="삭제">🗑️</button>
                        </div>
                    </div>`;

            // Children
            const children = childrenMap[root.id] || [];
            children.forEach(child => {
                const childHidden = !child.is_visible;
                html += `
                    <div class="admin-cat-item child" data-id="${child.id}">
                        <div class="admin-cat-row">
                            <span class="admin-cat-badge child">📄</span>
                            <input type="text" class="admin-cat-name" value="${child.name}" 
                                   onchange="editCategoryInline('${child.id}', this.value)">
                            <div class="admin-cat-actions">
                                <button onclick="moveCategoryInline('${child.id}','up')" title="위로">⬆</button>
                                <button onclick="moveCategoryInline('${child.id}','down')" title="아래로">⬇</button>
                                <button onclick="toggleCatVisibility('${child.id}')" title="표시/숨김">${childHidden ? '🙈' : '👁️'}</button>
                                <button onclick="deleteCategoryInline('${child.id}')" class="danger" title="삭제">🗑️</button>
                            </div>
                        </div>
                    </div>`;
            });

            html += '</div>';
        });
        html += '</div>';

        // Add category form
        const parentOptions = roots.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
        html += `
            <div class="admin-cat-add">
                <input type="text" id="newCatName" placeholder="카테고리 이름" class="admin-cat-name">
                <select id="newCatParent" class="admin-cat-select">
                    <option value="">대분류 (최상위)</option>
                    ${parentOptions}
                </select>
                <button onclick="addCategoryInline()" class="admin-cat-add-btn">➕ 추가</button>
            </div>
            <button onclick="saveCategoryChanges()" class="admin-cat-save-btn">💾 카테고리 저장</button>
        `;

        const manager = document.createElement('div');
        manager.id = 'adminCategoryManager';
        manager.className = 'admin-category-manager';
        manager.innerHTML = `<h4 class="admin-cat-title">📂 카테고리 관리</h4>${html}`;

        // Hide original nav and append manager
        if (nav) nav.style.display = 'none';
        sidebar.appendChild(manager);
    }

    function removeCategoryManager() {
        const manager = document.getElementById('adminCategoryManager');
        if (manager) manager.remove();

        const nav = document.getElementById('categoryNav');
        if (nav) {
            nav.style.display = '';
            if (originalCategoryHTML) {
                nav.innerHTML = originalCategoryHTML;
                originalCategoryHTML = '';
            }
        }

        // Reload categories to reflect any saved changes
        if (window.loadCategories) window.loadCategories();
    }

    function editCategoryInline(id, newName) {
        const cat = managedCategories.find(c => c.id === id);
        if (cat) cat.name = newName.trim();
    }

    function toggleCatVisibility(id) {
        const cat = managedCategories.find(c => c.id === id);
        if (cat) {
            cat.is_visible = !cat.is_visible;
            renderCategoryManager();
        }
    }

    function deleteCategoryInline(id) {
        const cat = managedCategories.find(c => c.id === id);
        if (!cat) return;

        const children = managedCategories.filter(c => c.parent_id === id);
        let msg = `"${cat.name}" 카테고리를 삭제하시겠습니까?`;
        if (children.length > 0) {
            msg = `⚠️ "${cat.name}" 에 ${children.length}개의 소분류가 포함되어 있습니다.\n삭제하면 소분류도 함께 삭제됩니다.\n계속하시겠습니까?`;
        }

        if (!confirm(msg)) return;

        deletedCatIds.add(id);
        children.forEach(c => deletedCatIds.add(c.id));
        managedCategories = managedCategories.filter(c => c.id !== id && c.parent_id !== id);
        renderCategoryManager();
        showToast('삭제 예약됨 (저장 시 반영)', 'info');
    }

    function moveCategoryInline(id, direction) {
        const cat = managedCategories.find(c => c.id === id);
        if (!cat) return;

        // Get siblings (same parent level)
        const parentId = cat.parent_id;
        const siblings = managedCategories.filter(c => c.parent_id === parentId);
        const idx = siblings.findIndex(c => c.id === id);

        if (direction === 'up' && idx > 0) {
            // Swap in main array
            const globalIdxA = managedCategories.indexOf(siblings[idx]);
            const globalIdxB = managedCategories.indexOf(siblings[idx - 1]);
            [managedCategories[globalIdxA], managedCategories[globalIdxB]] =
                [managedCategories[globalIdxB], managedCategories[globalIdxA]];
        } else if (direction === 'down' && idx < siblings.length - 1) {
            const globalIdxA = managedCategories.indexOf(siblings[idx]);
            const globalIdxB = managedCategories.indexOf(siblings[idx + 1]);
            [managedCategories[globalIdxA], managedCategories[globalIdxB]] =
                [managedCategories[globalIdxB], managedCategories[globalIdxA]];
        }

        renderCategoryManager();
    }

    async function addCategoryInline() {
        const nameInput = document.getElementById('newCatName');
        const parentSelect = document.getElementById('newCatParent');
        if (!nameInput) return;

        const name = nameInput.value.trim();
        if (!name) {
            showToast('카테고리 이름을 입력하세요.', 'error');
            return;
        }

        const parentId = parentSelect ? parentSelect.value || null : null;

        try {
            showToast('카테고리 추가 중...', 'loading');

            const maxOrder = managedCategories.length > 0
                ? Math.max(...managedCategories.map(c => c.display_order || 0))
                : 0;

            const newCat = {
                name,
                parent_id: parentId,
                is_visible: true,
                display_order: maxOrder + 1
            };

            const { data, error } = await supabaseClient.from('categories').insert(newCat).select().single();
            if (error) throw error;

            managedCategories.push({ ...data, is_sub: !!data.parent_id });
            nameInput.value = '';
            renderCategoryManager();
            showToast('✅ 카테고리가 추가되었습니다!', 'success');
        } catch (err) {
            console.error('카테고리 추가 실패:', err);
            showToast('카테고리 추가 실패', 'error');
        }
    }

    async function saveCategoryChanges() {
        if (!confirm('카테고리 변경사항을 저장하시겠습니까?')) return;

        try {
            showToast('저장 중...', 'loading');

            // 1. Handle deletions
            if (deletedCatIds.size > 0) {
                const { error: delErr } = await supabaseClient
                    .from('categories')
                    .delete()
                    .in('id', Array.from(deletedCatIds));
                if (delErr) throw delErr;
                deletedCatIds.clear();
            }

            // 2. Handle updates (order, name, visibility, hierarchy)
            let lastParentId = null;
            const upserts = managedCategories.map((cat, index) => {
                let parentId = null;
                if (cat.parent_id) {
                    parentId = cat.parent_id;
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

            if (upserts.length > 0) {
                const { error: upsErr } = await supabaseClient
                    .from('categories')
                    .upsert(upserts);
                if (upsErr) throw upsErr;
            }

            showToast('✅ 카테고리가 저장되었습니다!', 'success');

            // Reload to reflect changes
            await loadCategoriesForManager();

        } catch (err) {
            console.error('카테고리 저장 실패:', err);
            showToast('저장 실패: ' + err.message, 'error');
        }
    }

    // ═══════════════════════════════════════════════════
    // 9. TENDENCY INLINE MANAGEMENT
    // ═══════════════════════════════════════════════════

    let managedTendencies = [];

    async function loadTendenciesForManager() {
        try {
            const { data, error } = await supabaseClient
                .from('tendencies')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            managedTendencies = data || [];
            renderTendencyManager();
        } catch (err) {
            console.error('성향 로드 실패:', err);
            showToast('성향 로드 실패', 'error');
        }
    }

    function renderTendencyManager() {
        // Remove existing
        const existing = document.getElementById('adminTendencyManager');
        if (existing) existing.remove();

        const wrapper = document.querySelector('.tendency-gallery-wrapper');
        if (!wrapper) return; // Not in gallery view

        const tops = managedTendencies.filter(t => t.type === 'top').sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const bottoms = managedTendencies.filter(t => t.type === 'bottom').sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

        const renderTendencyRow = (item) => {
            const iconName = item.icon_class || 'crown';
            const typeColor = item.type === 'top' ? '#ff4d4d' : '#4da6ff';
            const typeLabel = item.type === 'top' ? '⬆ DOM' : '⬇ SUB';
            return `
                <div class="admin-tend-item" data-id="${item.id}">
                    <div class="admin-tend-row">
                        <span class="admin-tend-type" style="color:${typeColor}">${typeLabel}</span>
                        <input type="text" class="admin-tend-name" value="${item.name}" 
                               onchange="editTendencyField('${item.id}','name',this.value)" placeholder="이름">
                        <input type="text" class="admin-tend-sub" value="${item.sub_name || ''}" 
                               onchange="editTendencyField('${item.id}','sub_name',this.value)" placeholder="영문명">
                        <input type="text" class="admin-tend-icon" value="${item.icon_class || ''}" 
                               onchange="editTendencyField('${item.id}','icon_class',this.value)" placeholder="아이콘">
                        <div class="admin-tend-actions">
                            <button onclick="moveTendencyInline('${item.id}','up')" title="위로">⬆</button>
                            <button onclick="moveTendencyInline('${item.id}','down')" title="아래로">⬇</button>
                            <button onclick="editTendencyDesc('${item.id}')" title="설명 편집">📝</button>
                            <button onclick="deleteTendencyInline('${item.id}','${item.name.replace(/'/g, "\\\'")}')" class="danger" title="삭제">🗑️</button>
                        </div>
                    </div>
                </div>`;
        };

        let html = `
            <div class="admin-tend-section">
                <h5 class="admin-tend-section-title" style="color:#ff4d4d">⬆ DOMINANT ROLES (${tops.length})</h5>
                ${tops.map(renderTendencyRow).join('')}
                <button onclick="addTendencyInline('top')" class="admin-tend-add-btn" style="border-color:rgba(255,77,77,0.3);color:#ff4d4d">➕ DOM 추가</button>
            </div>
            <div class="admin-tend-section">
                <h5 class="admin-tend-section-title" style="color:#4da6ff">⬇ SUBMISSIVE ROLES (${bottoms.length})</h5>
                ${bottoms.map(renderTendencyRow).join('')}
                <button onclick="addTendencyInline('bottom')" class="admin-tend-add-btn" style="border-color:rgba(77,166,255,0.3);color:#4da6ff">➕ SUB 추가</button>
            </div>
            <button onclick="saveTendencyChanges()" class="admin-cat-save-btn" style="margin-top:1rem">💾 성향 전체 저장</button>
        `;

        const manager = document.createElement('div');
        manager.id = 'adminTendencyManager';
        manager.className = 'admin-tendency-manager';
        manager.innerHTML = `<h4 class="admin-cat-title">🎭 성향 관리</h4>${html}`;
        wrapper.prepend(manager);
    }

    function removeTendencyManager() {
        const manager = document.getElementById('adminTendencyManager');
        if (manager) manager.remove();
    }

    window.editTendencyField = function (id, field, value) {
        const item = managedTendencies.find(t => t.id === id);
        if (item) item[field] = value.trim();
    };

    window.editTendencyDesc = function (id) {
        const item = managedTendencies.find(t => t.id === id);
        if (!item) return;
        const newDesc = prompt('설명 편집:', item.description || '');
        if (newDesc !== null) {
            item.description = newDesc;
            showToast('설명 수정됨 (저장 필요)', 'info');
        }
    };

    window.deleteTendencyInline = async function (id, name) {
        if (!confirm(`"${name}" 성향을 삭제하시겠습니까?`)) return;
        try {
            const { error } = await supabaseClient.from('tendencies').delete().eq('id', id);
            if (error) throw error;
            managedTendencies = managedTendencies.filter(t => t.id !== id);
            renderTendencyManager();
            // Re-render gallery
            if (window.renderTendencyView) window.renderTendencyView();
            showToast('성향이 삭제되었습니다.', 'success');
        } catch (err) {
            showToast('삭제 실패', 'error');
        }
    };

    window.moveTendencyInline = function (id, direction) {
        const item = managedTendencies.find(t => t.id === id);
        if (!item) return;
        const siblings = managedTendencies.filter(t => t.type === item.type).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const idx = siblings.findIndex(t => t.id === id);

        if (direction === 'up' && idx > 0) {
            const prev = siblings[idx - 1];
            const tempOrder = item.display_order;
            item.display_order = prev.display_order;
            prev.display_order = tempOrder;
        } else if (direction === 'down' && idx < siblings.length - 1) {
            const next = siblings[idx + 1];
            const tempOrder = item.display_order;
            item.display_order = next.display_order;
            next.display_order = tempOrder;
        }
        renderTendencyManager();
    };

    window.addTendencyInline = async function (type) {
        const name = prompt(`새 ${type === 'top' ? 'Dominant' : 'Submissive'} 성향 이름:`);
        if (!name || !name.trim()) return;

        try {
            showToast('성향 추가 중...', 'loading');
            const maxOrder = managedTendencies.length > 0
                ? Math.max(...managedTendencies.map(t => t.display_order || 0))
                : 0;

            const { data, error } = await supabaseClient.from('tendencies').insert({
                type,
                name: name.trim(),
                sub_name: 'New Role',
                icon_class: 'crown',
                display_order: maxOrder + 1
            }).select().single();

            if (error) throw error;
            managedTendencies.push(data);
            renderTendencyManager();
            showToast('✅ 성향이 추가되었습니다!', 'success');
        } catch (err) {
            showToast('추가 실패', 'error');
        }
    };

    window.saveTendencyChanges = async function () {
        if (!confirm('성향 변경사항을 저장하시겠습니까?')) return;
        try {
            showToast('저장 중...', 'loading');
            for (const item of managedTendencies) {
                const { error } = await supabaseClient.from('tendencies').update({
                    name: item.name,
                    sub_name: item.sub_name || '',
                    description: item.description || '',
                    icon_class: item.icon_class || 'crown',
                    type: item.type,
                    display_order: item.display_order || 0
                }).eq('id', item.id);
                if (error) throw error;
            }
            showToast('✅ 성향이 저장되었습니다!', 'success');
            await loadTendenciesForManager();
            // Re-render gallery view
            if (window.renderTendencyView) {
                setTimeout(() => window.renderTendencyView(), 500);
            }
        } catch (err) {
            showToast('저장 실패: ' + err.message, 'error');
        }
    };

    // Hook into edit mode toggle - also manage tendency panel
    const origToggleEditMode = toggleEditMode;
    toggleEditMode = function (enabled) {
        origToggleEditMode(enabled);
        if (enabled) {
            // Check if we're in gallery view
            const galleryWrapper = document.querySelector('.tendency-gallery-wrapper');
            if (galleryWrapper) {
                loadTendenciesForManager();
            }
        } else {
            removeTendencyManager();
        }
    };

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
