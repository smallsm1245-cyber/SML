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

/* 초기화 및 데이터 로드 */
async function initArchive() {
    if (typeof CONFIG === 'undefined') return;
    
    const supabaseClient = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    // 카테고리 불러오기 (2.1 반영)
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

    const categoryList = document.getElementById('categoryList');
    if (data) {
        categoryList.innerHTML = data.map(cat => 
            `<li onclick="loadPosts('${cat.id}')">${cat.name}</li>`
        ).join('');
    }
}

/* 페이지 로드 시 상태 확인 */
window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
