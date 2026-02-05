// 성인 인증 및 데이터 연동 로직
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
    // config.js가 로드되지 않았을 경우 방어
    if (typeof CONFIG === 'undefined') {
        console.error("Config not found");
        return;
    }
    
    const { createClient } = supabase;
    const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    // [2.1] 카테고리 데이터 호출
    const { data, error } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

    const categoryList = document.getElementById('categoryList');
    if (data && data.length > 0) {
        categoryList.innerHTML = data.map(cat => 
            `<li onclick="console.log('${cat.id}')">${cat.name}</li>`
        ).join('');
    } else {
        categoryList.innerHTML = '<li>기록된 카테고리가 없습니다.</li>';
    }
}

window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
