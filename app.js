// 전역 변수로 클라이언트 설정
let supabaseClient;

async function initArchive() {
    if (typeof CONFIG === 'undefined') return;

    try {
        // [교정] Supabase 초기화 방식 보정
        if (!supabaseClient) {
            const { createClient } = window.supabase;
            supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY || CONFIG.SUPABASE_ANON_KEY);
        }

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
        console.error("DB Error:", err);
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
        alert("성인 인증이 필요합니다.");
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
