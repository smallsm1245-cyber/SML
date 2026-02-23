// admin/js/builder.js  — Full Implementation (Phase 1 + 2)

// ============================================================
// STATE
// ============================================================
const BuilderState = {
    components: [],
    selectedId: null,
    canvas: null,
    supabase: null
};

// ============================================================
// AUTH
// ============================================================
async function initSupabase() {
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error('Config load failed');
        const config = await response.json();
        BuilderState.supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
        checkAuth();
    } catch (e) {
        console.error("Supabase init error:", e);
        const el = document.getElementById('loginError');
        if (el) el.textContent = '설정을 불러오는데 실패했습니다.';
    }
}

async function checkAuth() {
    const { data: { session } } = await BuilderState.supabase.auth.getSession();
    if (session) {
        showBuilder();
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('builderInterface').style.display = 'none';
    }
}

window.handleBuilderLogin = async function () {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    const loginBtn = document.getElementById('loginBtn');

    if (!email || !password) { errorEl.textContent = '이메일과 비밀번호를 입력해주세요.'; return; }

    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';

    try {
        const { error } = await BuilderState.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showBuilder();
    } catch (error) {
        errorEl.textContent = '로그인 실패: ' + (error.message || '정보를 확인해주세요.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = '로그인';
    }
};

function showBuilder() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('builderInterface').style.display = 'flex';
    initBuilder();
}

// ============================================================
// CORE INIT
// ============================================================
function initBuilder() {
    BuilderState.canvas = document.getElementById('builderCanvas');
    setupDragAndDrop();
    setupCanvasInteractions();
    setupKeyboardShortcuts();
    setupToolbarButtons();
}

// ============================================================
// COMPONENT DRAG-AND-DROP (from Panel → Canvas)
// ============================================================
function setupDragAndDrop() {
    document.querySelectorAll('.component-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', item.dataset.type);
            e.dataTransfer.effectAllowed = 'copy';
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', () => { item.style.opacity = '1'; });
    });

    BuilderState.canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });

    BuilderState.canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('type');
        if (type) {
            const rect = BuilderState.canvas.getBoundingClientRect();
            createComponent(type,
                Math.max(0, snap(e.clientX - rect.left - 60)),
                Math.max(0, snap(e.clientY - rect.top - 30))
            );
        }
    });
}

// ============================================================
// COMPONENT FACTORY
// ============================================================
const DEFAULTS = {
    box: {
        width: '200px', height: '120px',
        backgroundColor: '#e0e0e0', border: '1px solid #ccc'
    },
    text: {
        fontSize: '16px', color: '#333333',
        fontFamily: 'Inter, sans-serif', padding: '8px',
        minWidth: '80px'
    },
    button: {
        padding: '10px 20px', backgroundColor: '#007acc',
        color: '#ffffff', borderRadius: '4px',
        border: 'none', cursor: 'pointer',
        textAlign: 'center', display: 'inline-block',
        fontSize: '14px', fontWeight: '600'
    },
    image: {
        width: '200px', height: '160px',
        backgroundColor: '#f5f5f5',
        border: '1px dashed #ccc'
    }
};

const CONTENT_DEFAULTS = {
    text: '텍스트 상자',
    button: '버튼',
    image: ''
};

function createComponent(type, x, y, overrideData = {}) {
    const id = 'comp_' + Math.random().toString(36).substr(2, 9);
    const compData = {
        id, type,
        styles: {
            position: 'absolute',
            left: x + 'px',
            top: y + 'px',
            zIndex: BuilderState.components.length + 1,
            ...(DEFAULTS[type] || {})
        },
        content: CONTENT_DEFAULTS[type] || '',
        ...overrideData
    };

    BuilderState.components.push(compData);
    renderComponent(compData);
    selectElement(id);
}

function renderComponent(compData) {
    let el = document.getElementById(compData.id);
    if (!el) {
        el = document.createElement('div');
        el.id = compData.id;
        el.className = 'canvas-element';
        BuilderState.canvas.appendChild(el);
    }
    Object.assign(el.style, compData.styles);
    el.innerHTML = compData.content;
}

// ============================================================
// GRID SNAP
// ============================================================
const GRID_SIZE = 20;
function snap(v) { return Math.round(v / GRID_SIZE) * GRID_SIZE; }

// ============================================================
// CANVAS MOUSE INTERACTIONS (Drag + Resize)
// ============================================================
let isDragging = false;
let isResizing = false;
let currentHandle = null;
let startX, startY;
let initialX, initialY, initialWidth, initialHeight;

function setupCanvasInteractions() {
    BuilderState.canvas.addEventListener('mousedown', (e) => {
        // Resize handle?
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            currentHandle = Array.from(e.target.classList).find(c =>
                ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].includes(c)
            );
            startX = e.clientX; startY = e.clientY;
            const el = document.getElementById(BuilderState.selectedId);
            if (el) {
                initialX = parseFloat(el.style.left) || 0;
                initialY = parseFloat(el.style.top) || 0;
                initialWidth = el.offsetWidth;
                initialHeight = el.offsetHeight;
            }
            e.stopPropagation();
            return;
        }

        const el = e.target.closest('.canvas-element');
        if (el) {
            selectElement(el.id);
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            initialX = parseFloat(el.style.left) || 0;
            initialY = parseFloat(el.style.top) || 0;
            e.stopPropagation();
        } else {
            deselectAll();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging && BuilderState.selectedId) {
            const el = document.getElementById(BuilderState.selectedId);
            if (!el) return;
            el.style.left = snap(initialX + (e.clientX - startX)) + 'px';
            el.style.top = snap(initialY + (e.clientY - startY)) + 'px';
            updateOverlay();

        } else if (isResizing && BuilderState.selectedId) {
            const el = document.getElementById(BuilderState.selectedId);
            if (!el) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            let nW = initialWidth, nH = initialHeight, nX = initialX, nY = initialY;

            if (currentHandle.includes('e')) nW = snap(Math.max(GRID_SIZE, initialWidth + dx));
            if (currentHandle.includes('s')) nH = snap(Math.max(GRID_SIZE, initialHeight + dy));
            if (currentHandle.includes('w')) {
                nW = snap(Math.max(GRID_SIZE, initialWidth - dx));
                nX = snap(initialX + (initialWidth - nW));
            }
            if (currentHandle.includes('n')) {
                nH = snap(Math.max(GRID_SIZE, initialHeight - dy));
                nY = snap(initialY + (initialHeight - nH));
            }

            el.style.width = nW + 'px';
            el.style.height = nH + 'px';
            el.style.left = nX + 'px';
            el.style.top = nY + 'px';
            updateOverlay();
        }
    });

    document.addEventListener('mouseup', () => {
        if ((isDragging || isResizing) && BuilderState.selectedId) {
            syncComponentState(BuilderState.selectedId);
            updatePropertyPanel(BuilderState.selectedId);
        }
        isDragging = false;
        isResizing = false;
        currentHandle = null;
    });
}

// ============================================================
// SELECTION OVERLAY
// ============================================================
function selectElement(id) {
    BuilderState.selectedId = id;
    drawOverlay(id);
    updatePropertyPanel(id);
}

function deselectAll() {
    BuilderState.selectedId = null;
    const overlay = document.getElementById('elementOverlay');
    if (overlay) overlay.remove();
    document.querySelector('.right-panel .empty-state').style.display = 'flex';
    document.getElementById('inspectorContent').style.display = 'none';
}

function drawOverlay(id) {
    let overlay = document.getElementById('elementOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'elementOverlay';
        overlay.className = 'element-overlay';
        ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'].forEach(pos => {
            const h = document.createElement('div');
            h.className = `resize-handle ${pos}`;
            overlay.appendChild(h);
        });
        BuilderState.canvas.appendChild(overlay);
    }
    updateOverlay();
}

function updateOverlay() {
    if (!BuilderState.selectedId) return;
    const el = document.getElementById(BuilderState.selectedId);
    if (!el) return;
    const overlay = document.getElementById('elementOverlay');
    if (overlay) {
        overlay.style.width = el.offsetWidth + 'px';
        overlay.style.height = el.offsetHeight + 'px';
        overlay.style.left = el.style.left;
        overlay.style.top = el.style.top;
        overlay.style.zIndex = (parseInt(el.style.zIndex || 0) + 1000);
    }
}

function syncComponentState(id) {
    const el = document.getElementById(id);
    const comp = BuilderState.components.find(c => c.id === id);
    if (comp && el) {
        comp.styles.left = el.style.left;
        comp.styles.top = el.style.top;
        if (el.style.width) comp.styles.width = el.style.width;
        if (el.style.height) comp.styles.height = el.style.height;
    }
}

// ============================================================
// PROPERTY INSPECTOR  (Phase 2)
// ============================================================
function updatePropertyPanel(id) {
    const emptyState = document.querySelector('.right-panel .empty-state');
    const content = document.getElementById('inspectorContent');

    if (!id) {
        emptyState.style.display = 'flex';
        content.style.display = 'none';
        return;
    }

    const comp = BuilderState.components.find(c => c.id === id);
    if (!comp) return;

    emptyState.style.display = 'none';
    content.style.display = 'block';

    const s = comp.styles;
    const isText = ['text', 'button'].includes(comp.type);

    content.innerHTML = `
    <!-- Actions Row -->
    <div class="inspector-section">
      <div class="insp-actions">
        <button class="insp-btn danger" onclick="deleteSelected()" title="삭제 (Del)">🗑️ 삭제</button>
        <button class="insp-btn" onclick="cloneSelected()" title="복제 (Ctrl+D)">⧉ 복제</button>
        <button class="insp-btn" onclick="changeZIndex('up')" title="앞으로">↑ 앞으로</button>
        <button class="insp-btn" onclick="changeZIndex('down')" title="뒤로">↓ 뒤로</button>
      </div>
    </div>

    <!-- Position & Size -->
    <div class="inspector-section">
      <h4 class="insp-title">📐 위치 & 크기</h4>
      <div class="insp-grid-4">
        <label class="insp-label">X<input type="number" class="insp-input" id="ip_x" value="${parseFloat(s.left) || 0}" step="${GRID_SIZE}" oninput="applyStyle('left', this.value+'px')"></label>
        <label class="insp-label">Y<input type="number" class="insp-input" id="ip_y" value="${parseFloat(s.top) || 0}" step="${GRID_SIZE}" oninput="applyStyle('top', this.value+'px')"></label>
        <label class="insp-label">W<input type="number" class="insp-input" id="ip_w" value="${parseFloat(s.width) || ''}" step="${GRID_SIZE}" oninput="applyStyle('width', this.value+'px')"></label>
        <label class="insp-label">H<input type="number" class="insp-input" id="ip_h" value="${parseFloat(s.height) || ''}" step="${GRID_SIZE}" oninput="applyStyle('height', this.value+'px')"></label>
      </div>
      <div class="insp-grid-2">
        <label class="insp-label">Z-Index<input type="number" class="insp-input" id="ip_z" value="${s.zIndex || 1}" oninput="applyStyle('zIndex', this.value)"></label>
      </div>
    </div>

    <!-- Background -->
    <div class="inspector-section">
      <h4 class="insp-title">🎨 배경</h4>
      <div class="insp-row">
        <label class="insp-label">배경색
          <input type="color" class="insp-color" id="ip_bg" value="${rgbToHex(s.backgroundColor || '#ffffff')}" oninput="applyStyle('backgroundColor', this.value)">
        </label>
        <label class="insp-label">불투명도
          <input type="range" min="0" max="1" step="0.05" class="insp-range" id="ip_opacity" value="${s.opacity || 1}" oninput="applyStyle('opacity', this.value)">
          <span id="ip_opacity_val">${Math.round((s.opacity || 1) * 100)}%</span>
        </label>
      </div>
    </div>

    <!-- Typography (text/button only) -->
    ${isText ? `
    <div class="inspector-section">
      <h4 class="insp-title">🔤 타이포그래피</h4>
      <label class="insp-label full">글꼴
        <select class="insp-select" id="ip_ff" onchange="applyStyle('fontFamily', this.value)">
          ${['Inter, sans-serif', 'Noto Serif KR, serif', 'Georgia, serif', 'Courier New, monospace', 'Arial, sans-serif'].map(f =>
        `<option value="${f}" ${(s.fontFamily || '').includes(f.split(',')[0]) ? 'selected' : ''}>${f.split(',')[0]}</option>`
    ).join('')}
        </select>
      </label>
      <div class="insp-grid-2">
        <label class="insp-label">크기(px)<input type="number" class="insp-input" value="${parseFloat(s.fontSize) || 16}" oninput="applyStyle('fontSize', this.value+'px')"></label>
        <label class="insp-label">두께
          <select class="insp-select" onchange="applyStyle('fontWeight', this.value)">
            ${[400, 500, 600, 700].map(w => `<option value="${w}" ${s.fontWeight == w ? 'selected' : ''}>${w}</option>`).join('')}
          </select>
        </label>
        <label class="insp-label">자간(px)<input type="number" class="insp-input" value="${parseFloat(s.letterSpacing) || 0}" step="0.5" oninput="applyStyle('letterSpacing', this.value+'px')"></label>
        <label class="insp-label">행간<input type="number" class="insp-input" value="${parseFloat(s.lineHeight) || 1.5}" step="0.1" oninput="applyStyle('lineHeight', this.value)"></label>
      </div>
      <div class="insp-row">
        <label class="insp-label">색상
          <input type="color" class="insp-color" value="${rgbToHex(s.color || '#333333')}" oninput="applyStyle('color', this.value)">
        </label>
        <div class="insp-label">정렬
          <div class="insp-align-btns">
            ${['left', 'center', 'right'].map(a =>
        `<button class="align-btn ${s.textAlign === a ? 'active' : ''}" onclick="applyStyle('textAlign','${a}')">${{ left: '←', center: '↔', right: '→' }[a]}</button>`
    ).join('')}
          </div>
        </div>
      </div>
    </div>` : ''}

    <!-- Border & Radius & Shadow -->
    <div class="inspector-section">
      <h4 class="insp-title">⬜ 테두리 & 그림자</h4>
      <div class="insp-grid-2">
        <label class="insp-label">두께(px)<input type="number" class="insp-input" value="${parseFloat(s.borderWidth) || 0}" min="0" oninput="applyBorder('width', this.value)"></label>
        <label class="insp-label">스타일
          <select class="insp-select" onchange="applyBorder('style', this.value)">
            ${['none', 'solid', 'dashed', 'dotted', 'double'].map(v =>
        `<option value="${v}" ${(s.borderStyle || 'none') === v ? 'selected' : ''}>${v}</option>`
    ).join('')}
          </select>
        </label>
        <label class="insp-label">색상
          <input type="color" class="insp-color" value="${rgbToHex(s.borderColor || '#000000')}" oninput="applyBorder('color', this.value)">
        </label>
        <label class="insp-label">둥글기(px)<input type="number" class="insp-input" value="${parseFloat(s.borderRadius) || 0}" min="0" oninput="applyStyle('borderRadius', this.value+'px')"></label>
      </div>
      <label class="insp-label full">그림자
        <input type="text" class="insp-input-text" placeholder="예: 0 4px 12px rgba(0,0,0,0.15)" value="${s.boxShadow || ''}" oninput="applyStyle('boxShadow', this.value)">
      </label>
    </div>

    <!-- Spacing -->
    <div class="inspector-section">
      <h4 class="insp-title">📋 간격 (Margin / Padding)</h4>
      <div class="insp-grid-4">
        <label class="insp-label">M-Top<input type="number" class="insp-input" value="${parseFloat(s.marginTop) || 0}" oninput="applyStyle('marginTop', this.value+'px')"></label>
        <label class="insp-label">M-Right<input type="number" class="insp-input" value="${parseFloat(s.marginRight) || 0}" oninput="applyStyle('marginRight', this.value+'px')"></label>
        <label class="insp-label">M-Bot<input type="number" class="insp-input" value="${parseFloat(s.marginBottom) || 0}" oninput="applyStyle('marginBottom', this.value+'px')"></label>
        <label class="insp-label">M-Left<input type="number" class="insp-input" value="${parseFloat(s.marginLeft) || 0}" oninput="applyStyle('marginLeft', this.value+'px')"></label>
        <label class="insp-label">P-Top<input type="number" class="insp-input" value="${parseFloat(s.paddingTop) || 0}" oninput="applyStyle('paddingTop', this.value+'px')"></label>
        <label class="insp-label">P-Right<input type="number" class="insp-input" value="${parseFloat(s.paddingRight) || 0}" oninput="applyStyle('paddingRight', this.value+'px')"></label>
        <label class="insp-label">P-Bot<input type="number" class="insp-input" value="${parseFloat(s.paddingBottom) || 0}" oninput="applyStyle('paddingBottom', this.value+'px')"></label>
        <label class="insp-label">P-Left<input type="number" class="insp-input" value="${parseFloat(s.paddingLeft) || 0}" oninput="applyStyle('paddingLeft', this.value+'px')"></label>
      </div>
    </div>

    <!-- Content (text/button) -->
    ${isText ? `
    <div class="inspector-section">
      <h4 class="insp-title">✏️ 내용</h4>
      <textarea class="insp-textarea" id="ip_content" oninput="applyContent(this.value)">${comp.content}</textarea>
    </div>` : ''}
    `;

    // Range value display
    const opacityInput = document.getElementById('ip_opacity');
    const opacityVal = document.getElementById('ip_opacity_val');
    if (opacityInput && opacityVal) {
        opacityInput.addEventListener('input', () => {
            opacityVal.textContent = Math.round(opacityInput.value * 100) + '%';
        });
    }
}

// ============================================================
// REAL-TIME STYLE BINDING:  applyStyle  →  DOM + State
// ============================================================
function applyStyle(prop, value) {
    if (!BuilderState.selectedId) return;
    const el = document.getElementById(BuilderState.selectedId);
    const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
    if (!el || !comp) return;

    el.style[prop] = value;
    comp.styles[prop] = value;
    updateOverlay();
}

function applyBorder(part, value) {
    const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
    if (!comp) return;

    // store individual shorthand parts
    if (part === 'width') comp.styles.borderWidth = value + 'px';
    if (part === 'style') comp.styles.borderStyle = value;
    if (part === 'color') comp.styles.borderColor = value;

    const w = comp.styles.borderWidth || '1px';
    const s = comp.styles.borderStyle || 'solid';
    const c = comp.styles.borderColor || '#000000';
    applyStyle('border', `${w} ${s} ${c}`);
}

function applyContent(value) {
    if (!BuilderState.selectedId) return;
    const el = document.getElementById(BuilderState.selectedId);
    const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
    if (!el || !comp) return;
    comp.content = value;
    el.innerHTML = value;
}

// ============================================================
// ELEMENT ACTIONS: Delete, Clone, Z-Index
// ============================================================
function deleteSelected() {
    const id = BuilderState.selectedId;
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
    BuilderState.components = BuilderState.components.filter(c => c.id !== id);
    deselectAll();
}

function cloneSelected() {
    const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
    if (!comp) return;
    createComponent(
        comp.type,
        snap(parseFloat(comp.styles.left) + GRID_SIZE * 2),
        snap(parseFloat(comp.styles.top) + GRID_SIZE * 2),
        { styles: { ...comp.styles }, content: comp.content }
    );
}

function changeZIndex(dir) {
    const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
    if (!comp) return;
    const current = parseInt(comp.styles.zIndex) || 1;
    const next = dir === 'up' ? current + 1 : Math.max(1, current - 1);
    applyStyle('zIndex', next);
    document.getElementById('ip_z').value = next;
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (!BuilderState.selectedId) return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

        if (e.key === 'Delete' || e.key === 'Backspace') { deleteSelected(); return; }
        if (e.ctrlKey && e.key === 'd') { e.preventDefault(); cloneSelected(); return; }

        const STEP = e.shiftKey ? GRID_SIZE * 2 : GRID_SIZE;
        const comp = BuilderState.components.find(c => c.id === BuilderState.selectedId);
        if (!comp) return;

        const x = parseFloat(comp.styles.left) || 0;
        const y = parseFloat(comp.styles.top) || 0;

        if (e.key === 'ArrowLeft') { applyStyle('left', (x - STEP) + 'px'); updateOverlay(); }
        if (e.key === 'ArrowRight') { applyStyle('left', (x + STEP) + 'px'); updateOverlay(); }
        if (e.key === 'ArrowUp') { applyStyle('top', (y - STEP) + 'px'); updateOverlay(); }
        if (e.key === 'ArrowDown') { applyStyle('top', (y + STEP) + 'px'); updateOverlay(); }
    });
}

// ============================================================
// TOOLBAR BUTTONS (Save / Preview)
// ============================================================
function setupToolbarButtons() {
    document.getElementById('saveBtn')?.addEventListener('click', saveState);
    document.getElementById('previewBtn')?.addEventListener('click', previewCanvas);

    // Viewport size presets
    document.querySelectorAll('.builder-header .icon-btn').forEach(btn => {
        const icon = btn.querySelector('svg') || btn;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.builder-header .icon-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const title = btn.title;
            if (title === 'Desktop') BuilderState.canvas.style.width = '1024px';
            if (title === 'Tablet') BuilderState.canvas.style.width = '768px';
            if (title === 'Mobile') BuilderState.canvas.style.width = '375px';
        });
    });
}

// ============================================================
// STATE SERIALIZATION  (Phase 3 prep)
// ============================================================
function serializeState() {
    return JSON.stringify({
        version: '1.0',
        components: BuilderState.components
    });
}

async function saveState() {
    const json = serializeState();
    const saveBtn = document.getElementById('saveBtn');
    const orig = saveBtn.innerHTML;
    saveBtn.innerHTML = '💾 저장 중...';
    saveBtn.disabled = true;

    try {
        const { data: { user } } = await BuilderState.supabase.auth.getUser();
        if (!user) throw new Error('인증 필요');

        const { error } = await BuilderState.supabase
            .from('builder_pages')
            .upsert({
                id: 'main',
                user_id: user.id,
                state_json: json,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (error) throw error;
        showToast('✅ 저장 완료');
    } catch (e) {
        console.error('Save error:', e);
        showToast('❌ 저장 실패: ' + e.message);
    } finally {
        saveBtn.innerHTML = orig;
        saveBtn.disabled = false;
    }
}

async function previewCanvas() {
    // Open the canvas HTML in a new tab (simplified)
    const html = generatePreviewHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
}

function generatePreviewHTML() {
    const canvasHTML = BuilderState.canvas.innerHTML;
    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
    <title>Builder Preview</title>
    <style>
      body { margin: 0; }
      .builder-canvas { width: ${BuilderState.canvas.style.width || '1024px'}; min-height: 768px; position: relative; background: white; }
      .element-overlay { display: none !important; }
    </style>
    </head><body><div class="builder-canvas">${canvasHTML}</div></body></html>`;
}

// ============================================================
// UTILITIES
// ============================================================
function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return '#ffffff';
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!m) return '#ffffff';
    return '#' + [m[1], m[2], m[3]].map(c => parseInt(c).toString(16).padStart(2, '0')).join('');
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'builder-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2500);
}

// ============================================================
// BOOT
// ============================================================
document.addEventListener('DOMContentLoaded', initSupabase);
