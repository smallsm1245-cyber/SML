function verifyAge(isAdult) {
    if (isAdult) {
        localStorage.setItem('slm_verified', 'true');
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    } else {
        alert("성인 인증이 필요합니다.");
        window.location.href = "https://www.google.com";
    }
}

async function initArchive() {
    // [보정] CONFIG가 로드되었는지 확인
    if (typeof CONFIG === 'undefined' || !window.supabase) {
        console.log("Config or Supabase not ready");
        return;
    }
    
    const { createClient } = supabase;
    // [보정] CONFIG.SUPABASE_KEY를 사용하도록 통일
    const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

    const categoryList = document.getElementById('categoryList');
    if (data && data.length > 0) {
        // 카테고리 목록 렌더링
        categoryList.innerHTML = data.map(cat => 
            `<li onclick="loadPosts('${cat.id}', '${cat.name}')">${cat.name}</li>`
        ).join('');
    } else {
        categoryList.innerHTML = '<li>등록된 카테고리가 없습니다.</li>';
    }
}

// 게시글 목록 불러오기 함수 (나중에 사용)
async function loadPosts(id, name) {
    document.getElementById('postTitle').innerText = name;
    document.getElementById('postContent').innerHTML = '기록을 불러오는 중...';
    // 여기에 게시글 로드 로직 추가 예정
}

window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
