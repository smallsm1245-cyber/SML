/**
 * js/web-builder.js
 * Web Builder Module for SmallSM Archive
 * 
 * Enables admin users to drag, resize, and edit page elements.
 * Uses interact.js for drag/resize. Persists to Supabase.
 * Only activated when admin is logged in and builder mode is on.
 */

(function () {
    'use strict';

    let supabaseClient = null;
    let isBuilderMode = false;
    let selectedElement = null;
    let pageElements = [];
    const ADMIN_EMAIL = 'smallsm@naver.com';
    const PAGE_ID = window.location.pathname.replace(/\//g, '_') || '_index';

    // ═══════════════════════════════════════════════════
    // 1. INITIALIZATION
    // ═══════════════════════════════════════════════════

    async function init() {
        // Wait for Supabase
        await waitForSupabase();

        // Check admin
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) return;

        // Load interact.js CDN
        await loadInteractJS();

        // Add builder toggle button to admin toolbar
        injectBuilderToggle();

        // Load saved elements
        await loadPageElements();

        console.log('🏗️ Web Builder ready.');
    }

    function waitForSupabase() {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (window.supabase && window.SUPABASE_CONFIG) {
                    supabaseClient = window.supabase.createClient(
                        window.SUPABASE_CONFIG.url,
                        window.SUPABASE_CONFIG.anonKey
                    );
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

    function loadInteractJS() {
        return new Promise((resolve) => {
            if (window.interact) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js';
            script.onload = resolve;
            script.onerror = () => {
                console.error('❌ interact.js 로드 실패');
                resolve();
            };
            document.head.appendChild(script);
        });
    }

    // ═══════════════════════════════════════════════════
    // 2. BUILDER TOGGLE
    // ═══════════════════════════════════════════════════

    function injectBuilderToggle() {
        const toolbar = document.querySelector('.toolbar-right');
        if (!toolbar) return;

        const btn = document.createElement('button');
        btn.className = 'toolbar-btn';
        btn.id = 'btnBuilderMode';
        btn.title = 'Web Builder';
        btn.innerHTML = '<i data-lucide="layout"></i>';
        btn.addEventListener('click', () => toggleBuilderMode(!isBuilderMode));

        // Insert before dashboard button
        const dashBtn = document.getElementById('btnGoDashboard');
        if (dashBtn) {
            toolbar.insertBefore(btn, dashBtn);
        } else {
            toolbar.appendChild(btn);
        }

        if (window.lucide) window.lucide.createIcons();
    }

    function toggleBuilderMode(enabled) {
        isBuilderMode = enabled;
        document.body.classList.toggle('builder-mode-active', isBuilderMode);

        const btn = document.getElementById('btnBuilderMode');
        if (btn) btn.classList.toggle('active', isBuilderMode);

        if (isBuilderMode) {
            showInspector();
            enableInteractions();
            showToast('🏗️ 빌더 모드 ON', 'info');
        } else {
            hideInspector();
            disableInteractions();
            deselectElement();
            showToast('빌더 모드 OFF');
        }
    }

    // ═══════════════════════════════════════════════════
    // 3. INTERACT.JS DRAG & RESIZE
    // ═══════════════════════════════════════════════════

    function enableInteractions() {
        if (!window.interact) return;

        // Make all .editable elements draggable and resizable
        interact('.editable').draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: 'parent',
                    endOnly: true
                })
            ],
            autoScroll: true,
            listeners: {
                move: dragMoveListener,
                end: () => saveElementState(selectedElement)
            }
        }).resizable({
            edges: { left: true, right: true, bottom: true, top: true },
            listeners: {
                move: resizeMoveListener,
                end: () => saveElementState(selectedElement)
            },
            modifiers: [
                interact.modifiers.restrictSize({
                    min: { width: 50, height: 30 }
                })
            ]
        }).on('tap', function (event) {
            selectElement(event.target.closest('.editable'));
        });
    }

    function disableInteractions() {
        if (!window.interact) return;
        try {
            interact('.editable').unset();
        } catch (e) {
            // ignore
        }
    }

    function dragMoveListener(event) {
        const target = event.target;
        const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        selectElement(target);
        updateInspectorValues();
    }

    function resizeMoveListener(event) {
        const target = event.target;
        let x = parseFloat(target.getAttribute('data-x')) || 0;
        let y = parseFloat(target.getAttribute('data-y')) || 0;

        target.style.width = event.rect.width + 'px';
        target.style.height = event.rect.height + 'px';

        x += event.deltaRect.left;
        y += event.deltaRect.top;

        target.style.transform = `translate(${x}px, ${y}px)`;
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);

        selectElement(target);
        updateInspectorValues();
    }

    // ═══════════════════════════════════════════════════
    // 4. ELEMENT SELECTION & INSPECTOR
    // ═══════════════════════════════════════════════════

    function selectElement(el) {
        if (!el) return;
        deselectElement();
        selectedElement = el;
        el.classList.add('builder-selected');
        updateInspectorValues();
    }

    function deselectElement() {
        if (selectedElement) {
            selectedElement.classList.remove('builder-selected');
        }
        selectedElement = null;
    }

    function showInspector() {
        if (document.getElementById('builderInspector')) return;

        const inspector = document.createElement('div');
        inspector.id = 'builderInspector';
        inspector.className = 'builder-inspector';
        inspector.innerHTML = `
            <h4 class="inspector-title">🔧 Inspector</h4>
            <div class="inspector-body">
                <div class="inspector-empty" id="inspectorEmpty">요소를 클릭하여 편집하세요</div>
                <div class="inspector-fields" id="inspectorFields" style="display:none">
                    <div class="inspector-field">
                        <label>텍스트</label>
                        <textarea id="inspText" rows="2"></textarea>
                    </div>
                    <div class="inspector-row">
                        <div class="inspector-field">
                            <label>X</label>
                            <input type="number" id="inspX" step="1">
                        </div>
                        <div class="inspector-field">
                            <label>Y</label>
                            <input type="number" id="inspY" step="1">
                        </div>
                    </div>
                    <div class="inspector-row">
                        <div class="inspector-field">
                            <label>W</label>
                            <input type="number" id="inspW" step="1">
                        </div>
                        <div class="inspector-field">
                            <label>H</label>
                            <input type="number" id="inspH" step="1">
                        </div>
                    </div>
                    <div class="inspector-field">
                        <label>글자색</label>
                        <input type="color" id="inspColor" value="#ffffff">
                    </div>
                    <div class="inspector-field">
                        <label>배경색</label>
                        <input type="color" id="inspBg" value="#000000">
                    </div>
                    <div class="inspector-field">
                        <label>글자 크기 (px)</label>
                        <input type="number" id="inspFontSize" min="8" max="200" step="1">
                    </div>
                    <div class="inspector-actions">
                        <button onclick="window._builderApply()" class="insp-btn primary">✅ 적용</button>
                        <button onclick="window._builderDuplicate()" class="insp-btn">📋 복제</button>
                        <button onclick="window._builderDelete()" class="insp-btn danger">🗑️ 삭제</button>
                    </div>
                </div>
            </div>
            <div class="inspector-add">
                <button onclick="window._builderAddText()" class="insp-btn add">➕ 텍스트 박스 추가</button>
            </div>
        `;
        document.body.appendChild(inspector);
    }

    function hideInspector() {
        const inspector = document.getElementById('builderInspector');
        if (inspector) inspector.remove();
    }

    function updateInspectorValues() {
        if (!selectedElement) return;

        const fields = document.getElementById('inspectorFields');
        const empty = document.getElementById('inspectorEmpty');
        if (fields) fields.style.display = 'block';
        if (empty) empty.style.display = 'none';

        const el = selectedElement;
        const inspText = document.getElementById('inspText');
        const inspX = document.getElementById('inspX');
        const inspY = document.getElementById('inspY');
        const inspW = document.getElementById('inspW');
        const inspH = document.getElementById('inspH');
        const inspColor = document.getElementById('inspColor');
        const inspBg = document.getElementById('inspBg');
        const inspFontSize = document.getElementById('inspFontSize');

        if (inspText) inspText.value = el.innerText || '';
        if (inspX) inspX.value = Math.round(parseFloat(el.getAttribute('data-x')) || 0);
        if (inspY) inspY.value = Math.round(parseFloat(el.getAttribute('data-y')) || 0);
        if (inspW) inspW.value = Math.round(el.offsetWidth);
        if (inspH) inspH.value = Math.round(el.offsetHeight);

        const cs = getComputedStyle(el);
        if (inspColor) inspColor.value = rgbToHex(cs.color);
        if (inspBg) inspBg.value = rgbToHex(cs.backgroundColor);
        if (inspFontSize) inspFontSize.value = parseInt(cs.fontSize) || 16;
    }

    // ═══════════════════════════════════════════════════
    // 5. INSPECTOR ACTIONS
    // ═══════════════════════════════════════════════════

    window._builderApply = function () {
        if (!selectedElement) return;
        const el = selectedElement;

        const text = document.getElementById('inspText')?.value;
        const x = parseFloat(document.getElementById('inspX')?.value) || 0;
        const y = parseFloat(document.getElementById('inspY')?.value) || 0;
        const w = parseFloat(document.getElementById('inspW')?.value);
        const h = parseFloat(document.getElementById('inspH')?.value);
        const color = document.getElementById('inspColor')?.value;
        const bg = document.getElementById('inspBg')?.value;
        const fontSize = document.getElementById('inspFontSize')?.value;

        if (text !== undefined) el.innerText = text;
        el.setAttribute('data-x', x);
        el.setAttribute('data-y', y);
        el.style.transform = `translate(${x}px, ${y}px)`;
        if (w) el.style.width = w + 'px';
        if (h) el.style.height = h + 'px';
        if (color) el.style.color = color;
        if (bg) el.style.backgroundColor = bg;
        if (fontSize) el.style.fontSize = fontSize + 'px';

        saveElementState(el);
        showToast('적용됨', 'success');
    };

    window._builderDuplicate = function () {
        if (!selectedElement) return;
        const clone = selectedElement.cloneNode(true);
        clone.id = 'editable-' + Date.now();
        const x = (parseFloat(selectedElement.getAttribute('data-x')) || 0) + 20;
        const y = (parseFloat(selectedElement.getAttribute('data-y')) || 0) + 20;
        clone.setAttribute('data-x', x);
        clone.setAttribute('data-y', y);
        clone.style.transform = `translate(${x}px, ${y}px)`;
        clone.classList.remove('builder-selected');
        selectedElement.parentNode.insertBefore(clone, selectedElement.nextSibling);
        selectElement(clone);
        saveElementState(clone);
        showToast('복제됨', 'success');
    };

    window._builderDelete = function () {
        if (!selectedElement) return;
        if (!confirm('이 요소를 삭제하시겠습니까?')) return;
        const elId = selectedElement.id;
        selectedElement.remove();
        selectedElement = null;
        // Delete from DB
        deletePageElement(elId);
        showToast('삭제됨', 'info');
    };

    window._builderAddText = function () {
        const container = document.querySelector('.main-content') || document.body;
        const el = document.createElement('div');
        el.id = 'editable-' + Date.now();
        el.className = 'editable';
        el.style.cssText = 'position:relative; padding:1rem; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff; font-size:16px; min-width:100px; min-height:40px;';
        el.innerText = '새 텍스트';
        el.setAttribute('data-x', 0);
        el.setAttribute('data-y', 0);
        container.appendChild(el);

        if (isBuilderMode) {
            enableInteractions();
        }
        selectElement(el);
        saveElementState(el);
        showToast('텍스트 박스 추가됨', 'success');
    };

    // ═══════════════════════════════════════════════════
    // 6. SUPABASE PERSISTENCE
    // ═══════════════════════════════════════════════════

    async function loadPageElements() {
        try {
            const { data, error } = await supabaseClient
                .from('page_elements')
                .select('*')
                .eq('page_id', PAGE_ID)
                .order('display_order', { ascending: true });

            if (error) {
                // Table might not exist yet - that's ok
                console.warn('page_elements table not found or error:', error.message);
                return;
            }

            pageElements = data || [];

            // Render saved elements
            const container = document.querySelector('.main-content') || document.body;
            pageElements.forEach(pe => {
                let el = document.getElementById(pe.element_id);
                if (!el) {
                    el = document.createElement(pe.element_type || 'div');
                    el.id = pe.element_id;
                    el.className = 'editable';
                    container.appendChild(el);
                }

                if (pe.content) el.innerText = pe.content;
                const styles = pe.styles || {};
                if (styles.color) el.style.color = styles.color;
                if (styles.backgroundColor) el.style.backgroundColor = styles.backgroundColor;
                if (styles.fontSize) el.style.fontSize = styles.fontSize;
                if (pe.width) el.style.width = pe.width + 'px';
                if (pe.height) el.style.height = pe.height + 'px';

                el.setAttribute('data-x', pe.position_x || 0);
                el.setAttribute('data-y', pe.position_y || 0);
                el.style.transform = `translate(${pe.position_x || 0}px, ${pe.position_y || 0}px)`;

                el.style.position = 'relative';
                el.style.padding = el.style.padding || '1rem';
                el.style.borderRadius = '8px';
            });
        } catch (err) {
            console.warn('Page elements load skipped:', err.message);
        }
    }

    async function saveElementState(el) {
        if (!el || !supabaseClient) return;

        const elementId = el.id || ('editable-' + Date.now());
        if (!el.id) el.id = elementId;

        const data = {
            page_id: PAGE_ID,
            element_id: elementId,
            element_type: el.tagName.toLowerCase(),
            content: el.innerText || '',
            styles: {
                color: el.style.color || '',
                backgroundColor: el.style.backgroundColor || '',
                fontSize: el.style.fontSize || ''
            },
            position_x: parseFloat(el.getAttribute('data-x')) || 0,
            position_y: parseFloat(el.getAttribute('data-y')) || 0,
            width: el.offsetWidth,
            height: el.offsetHeight,
            display_order: 0
        };

        try {
            // Upsert by element_id + page_id
            const { error } = await supabaseClient
                .from('page_elements')
                .upsert(data, { onConflict: 'page_id,element_id' });

            if (error) {
                console.warn('Element save skipped:', error.message);
            }
        } catch (err) {
            console.warn('Element save error:', err.message);
        }
    }

    async function deletePageElement(elementId) {
        if (!supabaseClient || !elementId) return;
        try {
            await supabaseClient
                .from('page_elements')
                .delete()
                .eq('page_id', PAGE_ID)
                .eq('element_id', elementId);
        } catch (err) {
            console.warn('Element delete error:', err.message);
        }
    }

    // ═══════════════════════════════════════════════════
    // 7. UTILITIES
    // ═══════════════════════════════════════════════════

    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
        if (rgb.startsWith('#')) return rgb;
        const matches = rgb.match(/\d+/g);
        if (!matches || matches.length < 3) return '#000000';
        return '#' + matches.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
    }

    function showToast(message, type = 'info') {
        // Reuse existing toast system
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }
        console.log(`[Builder] ${message}`);
    }

    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 500); // Wait for admin-inline to initialize first
    }

})();
