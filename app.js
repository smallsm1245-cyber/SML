let supabaseClient;

async function initArchive() {
    const categoryList = document.getElementById('categoryList');
    
    if (typeof CONFIG === 'undefined') {
        categoryList.innerHTML = '<li>설정 파일(config.js) 누락</li>';
        return;
    }

    try {
        if (!supabaseClient) {
            const { createClient } = window.supabase;
            supabaseClient = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        }

        // 데이터 가져오기 시도
        const { data, error } = await supabaseClient
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });

        if (error) {
            // 구체적인 에러 메시지를 화면에 출력
            categoryList.innerHTML = `<li>에러: ${error.message}</li>`;
            console.error("Supabase Error:", error);
            return;
        }

        if (data && data.length > 0) {
            categoryList.innerHTML = data.map(cat => 
                `<li onclick="loadPosts('${cat.id}', '${cat.name}')">${cat.name}</li>`
            ).join('');
        } else {
            categoryList.innerHTML = '<li>데이터가 비어있음 (SQL 확인 필요)</li>';
        }
    } catch (err) {
        categoryList.innerHTML = `<li>시스템 오류: ${err.message}</li>`;
    }
}

function verifyAge(isAdult) {
    if (isAdult) {
        localStorage.setItem('slm_verified', 'true');
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
        initArchive();
    } else {
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
