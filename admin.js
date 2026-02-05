let supabase;

// 초기화 및 자동 저장된 글 불러오기
window.onload = async () => {
    if (typeof CONFIG !== 'undefined') {
        supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        loadCategories();
    }
    
    // 4.3 자동 저장 복구
    const saved = localStorage.getItem('tmp_content');
    if (saved) {
        if(confirm("작성 중이던 글이 있습니다. 불러올까요?")) {
            document.getElementById('post-content').value = saved;
        }
    }
};

// 실시간 자동 저장 스크립트
document.getElementById('post-content')?.addEventListener('input', (e) => {
    localStorage.setItem('tmp_content', e.target.value);
});

async function loadCategories() {
    const { data } = await supabase.from('categories').select('*');
    const select = document.getElementById('category-select');
    data?.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.innerText = c.name;
        select.appendChild(opt);
    });
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const catId = document.getElementById('category-select').value;

    const { error } = await supabase.from('archive_posts').insert([
        { title, content, category_id: catId, is_private: false }
    ]);

    if (!error) {
        alert("기록 완료");
        localStorage.removeItem('tmp_content'); // 저장 후 임시데이터 삭제
        location.reload();
    }
}
