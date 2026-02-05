/* [3.1] 성인 인증 제어 */
function verifyAge(isAdult) {
    if (isAdult) {
        localStorage.setItem('slm_verified', 'true');
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    } else {
        alert("접근 권한이 없습니다.");
        window.location.href = "https://www.google.com";
    }
}

/* [2.1] 초기화 및 카테고리 로드 */
async function initArchive() {
    if (typeof CONFIG === 'undefined' || !window.supabase) return;
    
    const { createClient } = supabase;
    const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

    const categoryList = document.getElementById('categoryList');
    if (data) {
        // [Ver 1.1] 클릭 이벤트에 loadPosts 연결
        categoryList.innerHTML = data.map(cat => 
            `<li onclick="loadPosts('${cat.id}', '${cat.name}')">${cat.name}</li>`
        ).join('');
    }
}

/* [Ver 1.1] 게시글 목록 불러오기 (3.3 RLS 보안 적용) */
async function loadPosts(categoryId, categoryName) {
    const { createClient } = supabase;
    const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    // 해당 카테고리의 공개된 글만 가져옴
    const { data, error } = await supabaseClient
        .from('archive_posts')
        .select('id, title, created_at')
        .eq('category_id', categoryId)
        .eq('is_private', false)
        .order('created_at', { ascending: false });

    const titleElement = document.getElementById('postTitle');
    const contentElement = document.getElementById('postContent');

    titleElement.innerText = categoryName;

    if (error || !data || data.length === 0) {
        contentElement.innerHTML = `<p class="no-data">해당 카테고리에 기록된 문서가 없습니다.</p>`;
        return;
    }

    // 목록 렌더링 (6.2 문서 제목 실시간 검색 범위 반영 기초)
    contentElement.innerHTML = `<ul class="post-list">
        ${data.map(post => `
            <li onclick="loadPostDetail('${post.id}')">
                <span class="post-date">${new Date(post.created_at).toLocaleDateString()}</span>
                <span class="post-item-title">${post.title}</span>
            </li>
        `).join('')}
    </ul>`;
}

window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
