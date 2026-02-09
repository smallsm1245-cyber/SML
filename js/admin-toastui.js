// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - TOAST UI EDITOR INTEGRATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('🚀 Toast UI Admin loading...');

let supabaseClient = null;
let editor = null;
let currentPostId = null;

// ═══════════════════════════════════════════════════
// URL ACTION HANDLER
// ═══════════════════════════════════════════════════
async function handleUrlAction() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const id = urlParams.get('id');

    if (action === 'new') {
        showNewPostEditor();
    } else if (action === 'edit' && id) {
        window.editPost(id);
    }
}

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
// AUTHENTICATION & VIEW
// ═══════════════════════════════════════════════════
async function checkAuth() {
    if (!supabaseClient) return false;
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error || !user) return false;
        // ADMIN_EMAIL이 설정되지 않았을 경우를 대비한 기본값 확인
        const adminEmail = window.ADMIN_EMAIL || 'sml-brown@naver.com';
        if (user.email !== adminEmail) {
            await supabaseClient.auth.signOut();
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function showDashboard() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    
    initializeEditor();
    
    // 로딩 시작 전 상태 표시
    const container = document.getElementById('postsList');
    if (container) container.innerHTML = '<div class="loading">데이터를 불러오는 중입니다...</div>';

    try {
        await Promise.all([
            loadPosts(),
            loadCategories(),
            loadHomeSettings()
        ]);
        handleUrlAction();
    } catch (err) {
        console.error("초기 데이터 로딩 실패:", err);
    }
}

// ═══════════════════════════════════════════════════
// POSTS MANAGEMENT (로딩 로직 강화)
// ═══════════════════════════════════════════════════
async function loadPosts() {
    try {
        // [CHECK] 테이블명이 archive_posts가 맞는지 확인 필요
        const { data: posts, error } = await supabaseClient
            .from('archive_posts')
            .select(`
                id,
                title,
                is_private,
                created_at,
                updated_at,
                category_id,
                categories ( name )
            `)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.error('Supabase Query Error:', error);
            throw error;
        }

        const container = document.getElementById('postsList');
        const countBadge = document.getElementById('postCount');
        
        if (countBadge) countBadge.textContent = posts ? posts.length : 0;
        
        if (!posts || posts.length === 0) {
            container.innerHTML = '<div class="loading">작성된 게시물이 없습니다.</div>';
            return;
        }
        
        container.innerHTML = posts.map(post => {
            const statusBadge = post.is_private 
                ? '<span class="status-badge private">🔴 비공개</span>'
                : '<span class="status-badge public">🟢 공개</span>';
            
            const categoryName = post.categories?.name || '미지정';
            const updatedTime = getTimeAgo(post.updated_at);
            
            return `
                <div class="post-item">
                    <div class="post-header">
                        <span class="post-title-link" onclick="editPost('${post.id}')">${post.title}</span>
                        <div class="post-badges">${statusBadge}</div>
                    </div>
                    <div class="post-meta">
                        ${categoryName} • ${updatedTime}
                    </div>
                    <div class="post-actions">
                        <button class="action-btn" onclick="editPost('${post.id}')">✏️ 수정</button>
                        <button class="action-btn danger" onclick="deletePost('${post.id}', '${post.title.replace(/'/g, "\\'")}')">🗑️ 삭제</button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Posts loading failed:', error);
        const container = document.getElementById('postsList');
        if (container) {
            container.innerHTML = `
                <div class="loading" style="color: #ff4d4d;">
                    ⚠️ 데이터를 불러오지 못했습니다.<br>
                    <small>${error.message || '네트워크 오류 또는 권한 문제'}</small>
                </div>`;
        }
    }
}

// ═══════════════════════════════════════════════════
// [필수 확인] 데이터베이스 권한 해결 방법 (SQL)
// ═══════════════════════════════════════════════════
/* 만약 위 코드를 적용해도 여전히 멈춰있다면, Supabase SQL Editor에서 다음을 실행하세요:

ALTER TABLE archive_posts DISABLE ROW LEVEL SECURITY;
-- 또는 관리자 접근 허용 정책 추가 --
CREATE POLICY "Admin full access" ON archive_posts FOR ALL USING (auth.role() = 'authenticated');
*/

// (이하 생략 - 이전 제공된 initializeEditor, publishPost 등 기능 포함)
// ... 나머지 함수들은 기존의 완성본 코드를 유지하십시오.
