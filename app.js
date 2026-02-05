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
    if (typeof CONFIG === 'undefined' || !window.supabase) return;
    const { createClient } = supabase;
    const supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

    const { data } = await supabaseClient
        .from('categories')
        .select('*')
        .eq('is_visible', true)
        .order('display_order', { ascending: true });

    const categoryList = document.getElementById('categoryList');
    if (data && data.length > 0) {
        categoryList.innerHTML = data.map(cat => `<li onclick="loadPosts('${cat.id}', '${cat.name}')">${cat.name}</li>`).join('');
    } else {
        categoryList.innerHTML = '<li>기록 없음</li>';
    }
}

window.onload = () => {
    if (localStorage.getItem('slm_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    }
};
