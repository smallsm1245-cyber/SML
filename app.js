async function initArchive() {
    // 1. CONFIG 존재 여부 재확인
    if (typeof CONFIG === 'undefined') {
        console.error("CONFIG를 찾을 수 없습니다.");
        document.getElementById('categoryList').innerHTML = '<li>설정 오류(Config)</li>';
        return;
    }

    try {
        const { createClient } = supabase;
        // 2. 키 이름 일치 확인 (SUPABASE_KEY 또는 SUPABASE_ANON_KEY 모두 대응)
        const key = CONFIG.SUPABASE_KEY || CONFIG.SUPABASE_ANON_KEY;
        const supabaseClient = createClient(CONFIG.SUPABASE_URL, key);

        // 3. 데이터 가져오기
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        const categoryList = document.getElementById('categoryList');
        
        if (error) throw error;

        if (data && data.length > 0) {
            categoryList.innerHTML = data.map(cat => 
                `<li onclick="loadPosts('${cat.id}', '${cat.name}')">${cat.name}</li>`
            ).join('');
        } else {
            categoryList.innerHTML = '<li>등록된 카테고리 없음</li>';
        }
    } catch (err) {
        console.error("데이터 로드 실패:", err);
        document.getElementById('categoryList').innerHTML = '<li>연결 실패(DB)</li>';
    }
}

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

window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
