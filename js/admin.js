 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/js/admin.js b/js/admin.js
index ffe99aa247509a2f16255ee389d83b9bc90cc272..86df0c03f66384182d5c35db32772dfa5d6d042b 100644
--- a/js/admin.js
+++ b/js/admin.js
@@ -1,371 +1,537 @@
-// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-// 🎬 SMALLSM ARCHIVE - ADMIN SCRIPT
-// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-
-// Wait for config to load
-function waitForConfig(callback) {
-    const interval = setInterval(() => {
-        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
-            clearInterval(interval);
-            callback();
-        }
-    }, 100);
-}
-
-let supabase = null;
-
-// ═══════════════════════════════════════════════════
-// 1. SUPABASE INITIALIZATION
-// ═══════════════════════════════════════════════════
-waitForConfig(() => {
-    supabase = window.supabase.createClient(
-        window.SUPABASE_CONFIG.url,
-        window.SUPABASE_CONFIG.anonKey
-    );
-    
-    console.log('✅ Supabase initialized for admin');
-    checkAuth();
-});
-
-// ═══════════════════════════════════════════════════
-// 2. LOGIN HANDLER
-// ═══════════════════════════════════════════════════
-document.addEventListener('DOMContentLoaded', () => {
-    const loginBtn = document.getElementById('loginBtn');
-    const loginEmail = document.getElementById('loginEmail');
-    const loginPassword = document.getElementById('loginPassword');
-    const loginError = document.getElementById('loginError');
-    
-    // Enter key listener
-    [loginEmail, loginPassword].forEach(input => {
-        input?.addEventListener('keypress', (e) => {
-            if (e.key === 'Enter') loginBtn?.click();
-        });
-    });
-    
-    loginBtn?.addEventListener('click', async () => {
-        const email = loginEmail.value.trim();
-        const password = loginPassword.value.trim();
-        
-        if (!email || !password) {
-            showError('이메일과 비밀번호를 입력하세요');
-            return;
-        }
-        
-        // Check if email is authorized
-        if (email !== window.ADMIN_EMAIL) {
-            showError('관리자 권한이 없습니다');
-            return;
-        }
-        
-        loginBtn.disabled = true;
-        loginBtn.textContent = '로그인 중...';
-        
-        try {
-            const { data, error } = await supabase.auth.signInWithPassword({
-                email: email,
-                password: password
-            });
-            
-            if (error) throw error;
-            
-            console.log('✅ Login successful');
-            showAdminPanel();
-            
-        } catch (error) {
-            console.error('❌ Login failed:', error);
-            showError(error.message || '로그인 실패');
-            loginBtn.disabled = false;
-            loginBtn.textContent = '로그인';
-        }
-    });
-    
-    function showError(message) {
-        loginError.textContent = message;
-        loginError.style.display = 'block';
-        setTimeout(() => {
-            loginError.style.display = 'none';
-        }, 3000);
-    }
-});
-
-function showAdminPanel() {
-    document.getElementById('loginScreen').style.display = 'none';
-    document.getElementById('adminPanel').style.display = 'block';
-}
-
-// ═══════════════════════════════════════════════════
-// 3. AUTHENTICATION CHECK
-// ═══════════════════════════════════════════════════
-async function checkAuth() {
-    if (!supabase) {
-        console.warn('⚠️ Supabase not ready');
-        return;
-    }
-    
-    const { data: { user }, error } = await supabase.auth.getUser();
-    
-    if (error || !user) {
-        console.log('❌ Not authenticated');
-        return; // Show login screen
-    }
-    
-    // Whitelist verification
-    if (user.email !== window.ADMIN_EMAIL) {
-        alert('관리자 권한이 없습니다.');
-        await supabase.auth.signOut();
-        window.location.href = 'index.html';
-        return;
-    }
-    
-    console.log('✅ Admin authenticated:', user.email);
-    showAdminPanel();
-}
-
-// ═══════════════════════════════════════════════════
-// 4. LOGOUT HANDLER
-// ═══════════════════════════════════════════════════
-document.getElementById('logoutBtn')?.addEventListener('click', async () => {
-    if (!confirm('로그아웃하시겠습니까?')) return;
-    
-    try {
-        await supabase.auth.signOut();
-        window.location.href = 'index.html';
-    } catch (error) {
-        console.error('로그아웃 실패:', error);
-        alert('로그아웃 중 오류가 발생했습니다.');
-    }
-});
-
-// ═══════════════════════════════════════════════════
-// 4. LOAD CATEGORIES FOR SELECT
-// ═══════════════════════════════════════════════════
-async function loadCategoryOptions() {
-    try {
-        const { data: categories, error } = await supabase
-            .from('categories')
-            .select('*')
-            .order('display_order', { ascending: true });
-        
-        if (error) throw error;
-        
-        const select = document.getElementById('postCategory');
-        select.innerHTML = '<option value="">카테고리 선택</option>';
-        
-        categories.forEach(cat => {
-            const option = document.createElement('option');
-            option.value = cat.id;
-            option.textContent = cat.name;
-            select.appendChild(option);
-        });
-        
-    } catch (error) {
-        console.error('카테고리 로딩 실패:', error);
-    }
-}
-
-// ═══════════════════════════════════════════════════
-// 5. SAVE POST
-// ═══════════════════════════════════════════════════
-document.getElementById('savePostBtn').addEventListener('click', async () => {
-    const title = document.getElementById('postTitle').value.trim();
-    const content = document.getElementById('contentEditor').value.trim();
-    const categoryId = document.getElementById('postCategory').value;
-    const isPrivate = document.getElementById('isPrivate').checked;
-    const originFree = document.getElementById('originFree').checked;
-    
-    // Validation
-    if (!title) {
-        alert('제목을 입력하세요.');
-        return;
-    }
-    
-    if (!content) {
-        alert('내용을 입력하세요.');
-        return;
-    }
-    
-    if (!categoryId) {
-        alert('카테고리를 선택하세요.');
-        return;
-    }
-    
-    try {
-        const { data, error } = await supabase
-            .from('archive_posts')
-            .insert([
-                {
-                    title,
-                    content,
-                    category_id: categoryId,
-                    is_private: isPrivate,
-                    origin_free: originFree
-                }
-            ])
-            .select();
-        
-        if (error) throw error;
-        
-        alert('게시물이 저장되었습니다!');
-        
-        // Clear form
-        document.getElementById('postTitle').value = '';
-        document.getElementById('contentEditor').value = '';
-        document.getElementById('postCategory').value = '';
-        document.getElementById('isPrivate').checked = false;
-        document.getElementById('originFree').checked = false;
-        document.getElementById('contentPreview').innerHTML = '<p style="color: var(--text-secondary);">미리보기 영역</p>';
-        
-        // Clear localStorage draft
-        localStorage.removeItem('draft_content');
-        localStorage.removeItem('draft_title');
-        
-    } catch (error) {
-        console.error('게시물 저장 실패:', error);
-        alert('게시물 저장 중 오류가 발생했습니다: ' + error.message);
-    }
-});
-
-// ═══════════════════════════════════════════════════
-// 6. CATEGORY MANAGEMENT
-// ═══════════════════════════════════════════════════
-async function loadCategoryManagement() {
-    try {
-        const { data: categories, error } = await supabase
-            .from('categories')
-            .select('*')
-            .order('display_order', { ascending: true });
-        
-        if (error) throw error;
-        
-        const container = document.getElementById('categoryList');
-        container.innerHTML = '';
-        
-        categories.forEach(cat => {
-            const catDiv = document.createElement('div');
-            catDiv.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: rgba(206, 177, 128, 0.1); border: 1px solid var(--glass-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';
-            
-            catDiv.innerHTML = `
-                <div>
-                    <strong>${cat.name}</strong>
-                    <span style="margin-left: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
-                        ${cat.is_visible ? '공개' : '비공개'}
-                    </span>
-                </div>
-                <div>
-                    <button class="editor-btn" onclick="toggleCategoryVisibility('${cat.id}', ${cat.is_visible})">
-                        ${cat.is_visible ? '비공개로 전환' : '공개로 전환'}
-                    </button>
-                </div>
-            `;
-            
-            container.appendChild(catDiv);
-        });
-        
-    } catch (error) {
-        console.error('카테고리 관리 로딩 실패:', error);
-    }
-}
-
-async function toggleCategoryVisibility(categoryId, currentVisibility) {
-    try {
-        const { error } = await supabase
-            .from('categories')
-            .update({ is_visible: !currentVisibility })
-            .eq('id', categoryId);
-        
-        if (error) throw error;
-        
-        loadCategoryManagement();
-        
-    } catch (error) {
-        console.error('카테고리 가시성 변경 실패:', error);
-        alert('카테고리 설정 변경 중 오류가 발생했습니다.');
-    }
-}
-
-// Make function globally accessible
-window.toggleCategoryVisibility = toggleCategoryVisibility;
-
-// ═══════════════════════════════════════════════════
-// 7. IMAGE UPLOAD TO SUPABASE STORAGE
-// ═══════════════════════════════════════════════════
-async function uploadImage(file) {
-    try {
-        const fileExt = file.name.split('.').pop();
-        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
-        const filePath = `images/${fileName}`;
-        
-        const { data, error } = await supabase.storage
-            .from('archive-images')
-            .upload(filePath, file);
-        
-        if (error) throw error;
-        
-        // Get public URL
-        const { data: urlData } = supabase.storage
-            .from('archive-images')
-            .getPublicUrl(filePath);
-        
-        return urlData.publicUrl;
-        
-    } catch (error) {
-        console.error('이미지 업로드 실패:', error);
-        throw error;
-    }
-}
-
-// Add image upload button to toolbar
-document.addEventListener('DOMContentLoaded', () => {
-    const toolbar = document.querySelector('.editor-toolbar');
-    
-    const imageBtn = document.createElement('button');
-    imageBtn.className = 'editor-btn';
-    imageBtn.textContent = '🖼️ 이미지';
-    imageBtn.onclick = async () => {
-        const input = document.createElement('input');
-        input.type = 'file';
-        input.accept = 'image/*';
-        
-        input.onchange = async (e) => {
-            const file = e.target.files[0];
-            if (!file) return;
-            
-            try {
-                imageBtn.textContent = '업로드 중...';
-                imageBtn.disabled = true;
-                
-                const url = await uploadImage(file);
-                
-                const editor = document.getElementById('contentEditor');
-                const imageMarkdown = `\n![이미지](${url})\n`;
-                editor.value += imageMarkdown;
-                
-                // Update preview
-                const preview = document.getElementById('contentPreview');
-                preview.innerHTML = editor.value.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" style="max-width: 100%;">');
-                
-                imageBtn.textContent = '🖼️ 이미지';
-                imageBtn.disabled = false;
-                
-            } catch (error) {
-                alert('이미지 업로드 실패: ' + error.message);
-                imageBtn.textContent = '🖼️ 이미지';
-                imageBtn.disabled = false;
-            }
-        };
-        
-        input.click();
-    };
-    
-    toolbar.appendChild(imageBtn);
-});
-
-// ═══════════════════════════════════════════════════
-// 8. INITIALIZATION
-// ═══════════════════════════════════════════════════
-document.addEventListener('DOMContentLoaded', async () => {
-    await checkAuth();
-    await loadCategoryOptions();
-    await loadCategoryManagement();
-});
+// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+// 🎬 SMALLSM ARCHIVE - ADMIN SCRIPT
+// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
+
+let supabase = null;
+let categoriesCache = [];
+let draggedCategoryId = null;
+
+function waitForConfig(callback, maxWait = 5000) {
+    const started = Date.now();
+    const timer = setInterval(() => {
+        if (window.SUPABASE_CONFIG?.url && window.supabase) {
+            clearInterval(timer);
+            callback();
+            return;
+        }
+
+        if (Date.now() - started > maxWait) {
+            clearInterval(timer);
+            console.error('⏱️ Config loading timeout');
+            alert('환경 변수 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
+        }
+    }, 100);
+}
+
+function showError(message) {
+    const loginError = document.getElementById('loginError');
+    if (!loginError) return;
+
+    loginError.textContent = message;
+    loginError.style.display = 'block';
+    setTimeout(() => {
+        loginError.style.display = 'none';
+    }, 3000);
+}
+
+function showAdminPanel() {
+    document.getElementById('loginScreen').style.display = 'none';
+    document.getElementById('adminPanel').style.display = 'block';
+}
+
+async function checkAuth() {
+    if (!supabase) return false;
+
+    const { data: { user }, error } = await supabase.auth.getUser();
+    if (error || !user) return false;
+
+    if (user.email !== window.ADMIN_EMAIL) {
+        alert('관리자 권한이 없습니다.');
+        await supabase.auth.signOut();
+        window.location.href = 'index.html';
+        return false;
+    }
+
+    showAdminPanel();
+    return true;
+}
+
+function initAccordion() {
+    document.querySelectorAll('.admin-section-header').forEach((header) => {
+        header.addEventListener('click', () => {
+            const section = header.closest('.admin-section');
+            section.classList.toggle('collapsed');
+        });
+    });
+}
+
+async function loadCategoryOptions() {
+    const select = document.getElementById('postCategory');
+    if (!select) return;
+
+    select.innerHTML = '<option value="">카테고리 선택</option>';
+    categoriesCache.forEach((cat) => {
+        const option = document.createElement('option');
+        option.value = cat.id;
+        option.textContent = cat.name;
+        select.appendChild(option);
+    });
+}
+
+async function loadCategories() {
+    const { data, error } = await supabase
+        .from('categories')
+        .select('*')
+        .order('display_order', { ascending: true });
+
+    if (error) throw error;
+    categoriesCache = data || [];
+
+    await loadCategoryOptions();
+    renderCategoryManagement();
+}
+
+async function savePost() {
+    const title = document.getElementById('postTitle').value.trim();
+    const content = document.getElementById('contentEditor').value.trim();
+    const categoryId = document.getElementById('postCategory').value;
+    const isPrivate = document.getElementById('isPrivate').checked;
+    const originFree = document.getElementById('originFree').checked;
+
+    if (!title) return alert('제목을 입력하세요.');
+    if (!content) return alert('내용을 입력하세요.');
+    if (!categoryId) return alert('카테고리를 선택하세요.');
+
+    const { error } = await supabase
+        .from('archive_posts')
+        .insert([{ title, content, category_id: categoryId, is_private: isPrivate, origin_free: originFree }]);
+
+    if (error) throw error;
+
+    alert('게시물이 저장되었습니다!');
+    document.getElementById('postTitle').value = '';
+    document.getElementById('contentEditor').value = '';
+    document.getElementById('postCategory').value = '';
+    document.getElementById('isPrivate').checked = false;
+    document.getElementById('originFree').checked = false;
+    document.getElementById('contentPreview').innerHTML = '<p style="color: var(--text-secondary);">미리보기 영역</p>';
+    localStorage.removeItem('draft_content');
+    localStorage.removeItem('draft_title');
+}
+
+function normalizedCategory(cat) {
+    return {
+        ...cat,
+        dropdown_enabled: cat.dropdown_enabled ?? false,
+        dropdown_default_open: cat.dropdown_default_open ?? false,
+    };
+}
+
+function renderCategoryManagement() {
+    const container = document.getElementById('categoryList');
+    if (!container) return;
+
+    container.innerHTML = '';
+
+    categoriesCache.map(normalizedCategory).forEach((cat) => {
+        const row = document.createElement('div');
+        row.className = 'category-row';
+        row.draggable = true;
+        row.dataset.categoryId = cat.id;
+
+        row.innerHTML = `
+            <div class="category-row-main">
+                <button class="drag-handle" title="순서 변경">⋮⋮</button>
+                <strong>${cat.name}</strong>
+                <span class="category-order">#${cat.display_order ?? '-'}</span>
+            </div>
+            <div class="category-row-controls">
+                <label><input type="checkbox" data-action="visible" ${cat.is_visible ? 'checked' : ''}> 공개</label>
+                <label><input type="checkbox" data-action="dropdown" ${cat.dropdown_enabled ? 'checked' : ''}> 드롭다운 사용</label>
+                <label>기본 상태
+                    <select data-action="dropdown-default" ${cat.dropdown_enabled ? '' : 'disabled'}>
+                        <option value="closed" ${cat.dropdown_default_open ? '' : 'selected'}>닫힘</option>
+                        <option value="open" ${cat.dropdown_default_open ? 'selected' : ''}>열림</option>
+                    </select>
+                </label>
+                <button class="editor-btn" data-action="rename">✏️ 수정</button>
+                <button class="editor-btn" data-action="delete">🗑️ 삭제</button>
+            </div>
+        `;
+
+        bindCategoryRowEvents(row, cat);
+        bindDragEvents(row);
+        container.appendChild(row);
+    });
+}
+
+function bindDragEvents(row) {
+    row.addEventListener('dragstart', () => {
+        draggedCategoryId = row.dataset.categoryId;
+        row.classList.add('dragging');
+    });
+
+    row.addEventListener('dragend', async () => {
+        row.classList.remove('dragging');
+        draggedCategoryId = null;
+        await persistCategoryOrder();
+    });
+
+    row.addEventListener('dragover', (e) => {
+        e.preventDefault();
+        const container = document.getElementById('categoryList');
+        const dragging = container.querySelector('.dragging');
+        if (!dragging || dragging === row) return;
+
+        const rect = row.getBoundingClientRect();
+        const shouldPlaceAfter = e.clientY > rect.top + rect.height / 2;
+        if (shouldPlaceAfter) {
+            row.after(dragging);
+        } else {
+            row.before(dragging);
+        }
+    });
+}
+
+async function persistCategoryOrder() {
+    const rows = [...document.querySelectorAll('.category-row')];
+    try {
+        await Promise.all(rows.map((row, idx) => supabase
+            .from('categories')
+            .update({ display_order: idx + 1 })
+            .eq('id', row.dataset.categoryId)));
+        await loadCategories();
+    } catch (error) {
+        console.error('카테고리 순서 저장 실패:', error);
+        alert('카테고리 순서 저장에 실패했습니다.');
+    }
+}
+
+function bindCategoryRowEvents(row, cat) {
+    row.querySelector('[data-action="visible"]').addEventListener('change', async (e) => {
+        await updateCategory(cat.id, { is_visible: e.target.checked }, '가시성 변경');
+    });
+
+    row.querySelector('[data-action="dropdown"]').addEventListener('change', async (e) => {
+        const enabled = e.target.checked;
+        row.querySelector('[data-action="dropdown-default"]').disabled = !enabled;
+        await updateCategory(cat.id, { dropdown_enabled: enabled }, '드롭다운 설정 변경');
+    });
+
+    row.querySelector('[data-action="dropdown-default"]').addEventListener('change', async (e) => {
+        await updateCategory(cat.id, { dropdown_default_open: e.target.value === 'open' }, '드롭다운 기본값 변경');
+    });
+
+    row.querySelector('[data-action="rename"]').addEventListener('click', async () => {
+        const nextName = prompt('새 카테고리 이름을 입력하세요.', cat.name);
+        if (!nextName) return;
+        await updateCategory(cat.id, { name: nextName.trim() }, '카테고리 이름 변경');
+    });
+
+    row.querySelector('[data-action="delete"]').addEventListener('click', async () => {
+        await deleteCategory(cat.id, cat.name);
+    });
+}
+
+async function updateCategory(categoryId, patch, label) {
+    try {
+        const { error } = await supabase
+            .from('categories')
+            .update(patch)
+            .eq('id', categoryId);
+
+        if (error) throw error;
+        await loadCategories();
+    } catch (error) {
+        console.error(`${label} 실패:`, error);
+        alert(`${label} 중 오류가 발생했습니다: ${error.message}`);
+    }
+}
+
+async function addCategory() {
+    const nameInput = document.getElementById('newCategoryName');
+    const name = nameInput.value.trim();
+    if (!name) return alert('카테고리 이름을 입력하세요.');
+
+    const maxOrder = categoriesCache.reduce((max, c) => Math.max(max, Number(c.display_order) || 0), 0);
+
+    const { error } = await supabase
+        .from('categories')
+        .insert([{ name, is_visible: true, display_order: maxOrder + 1 }]);
+
+    if (error) throw error;
+
+    nameInput.value = '';
+    await loadCategories();
+}
+
+async function deleteCategory(categoryId, categoryName) {
+    const { count, error: countError } = await supabase
+        .from('archive_posts')
+        .select('id', { count: 'exact', head: true })
+        .eq('category_id', categoryId);
+
+    if (countError) {
+        alert('카테고리 게시물 수 조회에 실패했습니다.');
+        return;
+    }
+
+    if (!count) {
+        if (!confirm(`${categoryName} 카테고리를 삭제하시겠습니까?`)) return;
+        await runDeleteCategory(categoryId);
+        return;
+    }
+
+    const action = prompt(
+        `⚠️ ${categoryName} 카테고리에 ${count}개의 게시물이 있습니다.\n` +
+        `"delete" 입력: 게시물도 함께 삭제\n` +
+        `"move" 입력: 다른 카테고리로 이동 후 삭제\n` +
+        `취소: 작업 중단`
+    );
+
+    if (!action) return;
+
+    if (action.toLowerCase() === 'delete') {
+        const { error: postDeleteError } = await supabase
+            .from('archive_posts')
+            .delete()
+            .eq('category_id', categoryId);
+
+        if (postDeleteError) {
+            alert('게시물 삭제 중 오류가 발생했습니다.');
+            return;
+        }
+
+        await runDeleteCategory(categoryId);
+        return;
+    }
+
+    if (action.toLowerCase() === 'move') {
+        const candidates = categoriesCache.filter((cat) => cat.id !== categoryId);
+        if (candidates.length === 0) {
+            alert('이동할 다른 카테고리가 없습니다.');
+            return;
+        }
+
+        const guide = candidates.map((c) => `${c.id}: ${c.name}`).join('\n');
+        const targetId = prompt(`이동할 카테고리 ID를 입력하세요:\n${guide}`);
+        if (!targetId) return;
+
+        const targetExists = candidates.some((c) => c.id === targetId);
+        if (!targetExists) {
+            alert('유효하지 않은 카테고리 ID입니다.');
+            return;
+        }
+
+        const { error: moveError } = await supabase
+            .from('archive_posts')
+            .update({ category_id: targetId })
+            .eq('category_id', categoryId);
+
+        if (moveError) {
+            alert('게시물 이동 중 오류가 발생했습니다.');
+            return;
+        }
+
+        await runDeleteCategory(categoryId);
+        return;
+    }
+
+    alert('알 수 없는 선택입니다. delete 또는 move를 입력해주세요.');
+}
+
+async function runDeleteCategory(categoryId) {
+    const { error } = await supabase
+        .from('categories')
+        .delete()
+        .eq('id', categoryId);
+
+    if (error) {
+        alert(`카테고리 삭제 실패: ${error.message}`);
+        return;
+    }
+
+    await loadCategories();
+}
+
+async function loadHomeSettings() {
+    try {
+        const { data, error } = await supabase
+            .from('site_settings')
+            .select('*')
+            .eq('id', 'home')
+            .maybeSingle();
+
+        if (error) throw error;
+
+        document.getElementById('homeTitle').value = data?.welcome_title || '';
+        document.getElementById('homeSubtitle').value = data?.welcome_subtitle || '';
+        document.getElementById('homeDescription').value = data?.welcome_body || '';
+    } catch (error) {
+        console.warn('site_settings 테이블 접근 실패, 로컬 초안 사용:', error.message);
+        document.getElementById('homeTitle').value = localStorage.getItem('admin_home_title') || '';
+        document.getElementById('homeSubtitle').value = localStorage.getItem('admin_home_subtitle') || '';
+        document.getElementById('homeDescription').value = localStorage.getItem('admin_home_body') || '';
+    }
+}
+
+async function saveHomeSettings() {
+    const title = document.getElementById('homeTitle').value.trim();
+    const subtitle = document.getElementById('homeSubtitle').value.trim();
+    const body = document.getElementById('homeDescription').value.trim();
+
+    try {
+        const { error } = await supabase
+            .from('site_settings')
+            .upsert({
+                id: 'home',
+                welcome_title: title,
+                welcome_subtitle: subtitle,
+                welcome_body: body,
+                updated_at: new Date().toISOString(),
+            });
+
+        if (error) throw error;
+        alert('홈화면 설정이 저장되었습니다.');
+    } catch (error) {
+        localStorage.setItem('admin_home_title', title);
+        localStorage.setItem('admin_home_subtitle', subtitle);
+        localStorage.setItem('admin_home_body', body);
+        alert('DB 저장에 실패해 브라우저 로컬에 임시 저장했습니다.');
+    }
+}
+
+async function uploadImage(file) {
+    const fileExt = file.name.split('.').pop();
+    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
+    const filePath = `images/${fileName}`;
+
+    const { error } = await supabase.storage
+        .from('archive-images')
+        .upload(filePath, file);
+
+    if (error) throw error;
+
+    const { data: urlData } = supabase.storage
+        .from('archive-images')
+        .getPublicUrl(filePath);
+
+    return urlData.publicUrl;
+}
+
+function initImageButton() {
+    const toolbar = document.querySelector('.editor-toolbar');
+    if (!toolbar) return;
+
+    const imageBtn = document.createElement('button');
+    imageBtn.className = 'editor-btn';
+    imageBtn.textContent = '🖼️ 이미지';
+
+    imageBtn.addEventListener('click', () => {
+        const input = document.createElement('input');
+        input.type = 'file';
+        input.accept = 'image/*';
+
+        input.onchange = async (e) => {
+            const file = e.target.files?.[0];
+            if (!file) return;
+
+            imageBtn.textContent = '업로드 중...';
+            imageBtn.disabled = true;
+            try {
+                const url = await uploadImage(file);
+                const editor = document.getElementById('contentEditor');
+                editor.value += `\n![이미지](${url})\n`;
+                if (typeof updatePreview === 'function') updatePreview();
+            } catch (error) {
+                alert(`이미지 업로드 실패: ${error.message}`);
+            } finally {
+                imageBtn.textContent = '🖼️ 이미지';
+                imageBtn.disabled = false;
+            }
+        };
+
+        input.click();
+    });
+
+    toolbar.appendChild(imageBtn);
+}
+
+document.addEventListener('DOMContentLoaded', async () => {
+    initAccordion();
+
+    const loginBtn = document.getElementById('loginBtn');
+    const loginEmail = document.getElementById('loginEmail');
+    const loginPassword = document.getElementById('loginPassword');
+
+    [loginEmail, loginPassword].forEach((input) => {
+        input?.addEventListener('keypress', (e) => {
+            if (e.key === 'Enter') loginBtn?.click();
+        });
+    });
+
+    waitForConfig(async () => {
+        supabase = window.supabase.createClient(
+            window.SUPABASE_CONFIG.url,
+            window.SUPABASE_CONFIG.anonKey,
+        );
+
+        const loggedIn = await checkAuth();
+        if (loggedIn) {
+            await loadCategories();
+            await loadHomeSettings();
+            initImageButton();
+        }
+    });
+
+    loginBtn?.addEventListener('click', async () => {
+        const email = loginEmail.value.trim();
+        const password = loginPassword.value.trim();
+
+        if (!email || !password) return showError('이메일과 비밀번호를 입력하세요');
+        if (email !== window.ADMIN_EMAIL) return showError('관리자 권한이 없습니다');
+
+        loginBtn.disabled = true;
+        loginBtn.textContent = '로그인 중...';
+
+        try {
+            const { error } = await supabase.auth.signInWithPassword({ email, password });
+            if (error) throw error;
+
+            showAdminPanel();
+            await loadCategories();
+            await loadHomeSettings();
+            initImageButton();
+        } catch (error) {
+            showError(error.message || '로그인 실패');
+            loginBtn.disabled = false;
+            loginBtn.textContent = '로그인';
+        }
+    });
+
+    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
+        if (!confirm('로그아웃하시겠습니까?')) return;
+        await supabase.auth.signOut();
+        window.location.href = 'index.html';
+    });
+
+    document.getElementById('savePostBtn')?.addEventListener('click', async () => {
+        try {
+            await savePost();
+        } catch (error) {
+            alert(`게시물 저장 실패: ${error.message}`);
+        }
+    });
+
+    document.getElementById('addCategoryBtn')?.addEventListener('click', async () => {
+        try {
+            await addCategory();
+        } catch (error) {
+            alert(`카테고리 추가 실패: ${error.message}`);
+        }
+    });
+
+    document.getElementById('saveHomeBtn')?.addEventListener('click', async () => {
+        await saveHomeSettings();
+    });
+});
 
EOF
)
