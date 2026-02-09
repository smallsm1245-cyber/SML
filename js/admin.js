// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - ADMIN SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Wait for config to load
(function () {
    'use strict';

    // Wait for config to load
    function waitForConfig(callback) {
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
                clearInterval(interval);
                callback();
                return;
            }

            // Local Config Fallback
            if (typeof SUPABASE_CONFIG_LOCAL !== 'undefined' && SUPABASE_CONFIG_LOCAL.url) {
                console.log('⚠️ Using LOCAL CONFIG');
                window.SUPABASE_CONFIG = SUPABASE_CONFIG_LOCAL;
                if (typeof ADMIN_EMAIL_LOCAL !== 'undefined') {
                    window.ADMIN_EMAIL = ADMIN_EMAIL_LOCAL;
                }
                clearInterval(interval);
                callback();
                return;
            }
        }, 100);
    }

    let supabase = null;

    // ═══════════════════════════════════════════════════
    // 1. SUPABASE INITIALIZATION
    // ═══════════════════════════════════════════════════
    waitForConfig(() => {
        if (!window.supabase) {
            console.error('Supabase library not found');
            return;
        }
        supabase = window.supabase.createClient(
            window.SUPABASE_CONFIG.url,
            window.SUPABASE_CONFIG.anonKey
        );

        console.log('✅ Supabase initialized for admin');
        checkAuth();
    });

    // ═══════════════════════════════════════════════════
    // 2. LOGIN HANDLER
    // ═══════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', () => {
        const loginBtn = document.getElementById('loginBtn');
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        const loginError = document.getElementById('loginError');

        // Enter key listener
        [loginEmail, loginPassword].forEach(input => {
            input?.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') loginBtn?.click();
            });
        });

        loginBtn?.addEventListener('click', async () => {
            console.log('👆 Login button clicked');

            if (!supabase) {
                console.error('❌ Supabase not initialized');
                showError('시스템 초기화 중입니다. 잠시 후 다시 시도해주세요.');
                return;
            }

            const email = loginEmail.value.trim();
            const password = loginPassword.value.trim();

            if (!email || !password) {
                showError('이메일과 비밀번호를 입력하세요');
                return;
            }

            // Check if email is authorized
            if (email !== window.ADMIN_EMAIL) {
                showError('관리자 권한이 없습니다');
                return;
            }

            loginBtn.disabled = true;
            loginBtn.textContent = '로그인 중...';

            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                console.log('✅ Login successful');
                showAdminPanel();

            } catch (error) {
                console.error('❌ Login failed:', error);
                showError(error.message || '로그인 실패');
                loginBtn.disabled = false;
                loginBtn.textContent = '로그인';
            }
        });

        function showError(message) {
            if (!loginError) return;
            loginError.textContent = message;
            loginError.style.display = 'block';
            setTimeout(() => {
                loginError.style.display = 'none';
            }, 3000);
        }
    });

    function showAdminPanel() {
        const loginScreen = document.getElementById('loginScreen');
        const adminDashboard = document.getElementById('adminPanel'); // Original was adminPanel

        if (loginScreen) loginScreen.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
    }

    // ═══════════════════════════════════════════════════
    // 3. AUTHENTICATION CHECK
    // ═══════════════════════════════════════════════════
    async function checkAuth() {
        if (!supabase) {
            console.warn('⚠️ Supabase not ready');
            return;
        }

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            console.log('❌ Not authenticated');
            return; // Show login screen
        }

        // Whitelist verification
        if (user.email !== window.ADMIN_EMAIL) {
            alert('관리자 권한이 없습니다.');
            await supabase.auth.signOut();
            window.location.href = 'index.html';
            return;
        }

        console.log('✅ Admin authenticated:', user.email);
        showAdminPanel();
    }

    // ═══════════════════════════════════════════════════
    // 4. LOGOUT HANDLER
    // ═══════════════════════════════════════════════════
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (!confirm('로그아웃하시겠습니까?')) return;

        try {
            await supabase.auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('로그아웃 실패:', error);
            alert('로그아웃 중 오류가 발생했습니다.');
        }
    });

    // ═══════════════════════════════════════════════════
    // 4. LOAD CATEGORIES FOR SELECT
    // ═══════════════════════════════════════════════════
    async function loadCategoryOptions() {
        try {
            const { data: categories, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            const select = document.getElementById('postCategory');
            if (select) {
                select.innerHTML = '<option value="">카테고리 선택</option>';
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat.id;
                    option.textContent = cat.name;
                    select.appendChild(option);
                });
            }

        } catch (error) {
            console.error('카테고리 로딩 실패:', error);
        }
    }

    // ═══════════════════════════════════════════════════
    // 5. SAVE POST
    // ═══════════════════════════════════════════════════
    const savePostBtn = document.getElementById('savePostBtn');
    if (savePostBtn) {
        savePostBtn.addEventListener('click', async () => {
            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('contentEditor').value.trim();
            const categoryId = document.getElementById('postCategory').value;
            const isPrivate = document.getElementById('isPrivate').checked;
            const originFree = document.getElementById('originFree').checked;

            // Validation
            if (!title) {
                alert('제목을 입력하세요.');
                return;
            }

            if (!content) {
                alert('내용을 입력하세요.');
                return;
            }

            if (!categoryId) {
                alert('카테고리를 선택하세요.');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('archive_posts')
                    .insert([
                        {
                            title,
                            content,
                            category_id: categoryId,
                            is_private: isPrivate,
                            origin_free: originFree
                        }
                    ])
                    .select();

                if (error) throw error;

                alert('게시물이 저장되었습니다!');

                // Clear form
                document.getElementById('postTitle').value = '';
                document.getElementById('contentEditor').value = '';
                document.getElementById('postCategory').value = '';
                document.getElementById('isPrivate').checked = false;
                document.getElementById('originFree').checked = false;
                document.getElementById('contentPreview').innerHTML = '<p style="color: var(--text-secondary);">미리보기 영역</p>';

                // Clear localStorage draft
                localStorage.removeItem('draft_content');
                localStorage.removeItem('draft_title');

            } catch (error) {
                console.error('게시물 저장 실패:', error);
                alert('게시물 저장 중 오류가 발생했습니다: ' + error.message);
            }
        });
    }

    // ═══════════════════════════════════════════════════
    // 6. CATEGORY MANAGEMENT
    // ═══════════════════════════════════════════════════
    async function loadCategoryManagement() {
        try {
            const { data: categories, error } = await supabase
                .from('categories')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            const container = document.getElementById('categoryList');
            if (container) {
                container.innerHTML = '';

                categories.forEach(cat => {
                    const catDiv = document.createElement('div');
                    catDiv.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: rgba(206, 177, 128, 0.1); border: 1px solid var(--glass-border); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;';

                    catDiv.innerHTML = `
                        <div>
                            <strong>${cat.name}</strong>
                            <span style="margin-left: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
                                ${cat.is_visible ? '공개' : '비공개'}
                            </span>
                        </div>
                        <div>
                            <button class="editor-btn" onclick="toggleCategoryVisibility('${cat.id}', ${cat.is_visible})">
                                ${cat.is_visible ? '비공개로 전환' : '공개로 전환'}
                            </button>
                        </div>
                    `;
                    container.appendChild(catDiv);
                });
            }
        } catch (error) {
            console.error('카테고리 관리 로딩 실패:', error);
        }
    }

    async function toggleCategoryVisibility(categoryId, currentVisibility) {
        try {
            const { error } = await supabase
                .from('categories')
                .update({ is_visible: !currentVisibility })
                .eq('id', categoryId);

            if (error) throw error;
            loadCategoryManagement();
        } catch (error) {
            console.error('카테고리 가시성 변경 실패:', error);
            alert('카테고리 설정 변경 중 오류가 발생했습니다.');
        }
    }

    // Make function globally accessible
    window.toggleCategoryVisibility = toggleCategoryVisibility;

    // ═══════════════════════════════════════════════════
    // 7. IMAGE UPLOAD
    // ═══════════════════════════════════════════════════
    async function uploadImage(file) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `images/${fileName}`;

            const { data, error } = await supabase.storage
                .from('archive-images')
                .upload(filePath, file);

            if (error) throw error;

            const { data: urlData } = supabase.storage
                .from('archive-images')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            throw error;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        const toolbar = document.querySelector('.editor-toolbar');
        if (toolbar) {
            const imageBtn = document.createElement('button');
            imageBtn.className = 'editor-btn';
            imageBtn.textContent = '🖼️ 이미지';
            imageBtn.onclick = async () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    try {
                        imageBtn.textContent = '업로드 중...';
                        imageBtn.disabled = true;
                        const url = await uploadImage(file);
                        const editor = document.getElementById('contentEditor');
                        const imageMarkdown = `\n![이미지](${url})\n`;
                        editor.value += imageMarkdown;
                        const preview = document.getElementById('contentPreview');
                        if (preview) preview.innerHTML = editor.value.replace(/!\[.*?\]\((.*?)\)/g, '<img src="$1" style="max-width: 100%;">');
                        imageBtn.textContent = '🖼️ 이미지';
                        imageBtn.disabled = false;
                    } catch (error) {
                        alert('이미지 업로드 실패: ' + error.message);
                        imageBtn.textContent = '🖼️ 이미지';
                        imageBtn.disabled = false;
                    }
                };
                input.click();
            };
            toolbar.appendChild(imageBtn);
        }
    });

    // ═══════════════════════════════════════════════════
    // 8. INITIALIZATION
    // ═══════════════════════════════════════════════════
    document.addEventListener('DOMContentLoaded', async () => {
        await checkAuth();
        await loadCategoryOptions();
        await loadCategoryManagement();
    });

})();
