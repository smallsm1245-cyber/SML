let supabase;

window.onload = async () => {
    if (typeof CONFIG !== 'undefined') {
        supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        const { data } = await supabase.from('categories').select('*');
        const sel = document.getElementById('category-select');
        data?.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id; opt.innerText = c.name;
            sel.appendChild(opt);
        });
    }

    // 4.3 자동 저장 복구
    const saved = localStorage.getItem('slm_tmp_post');
    if (saved && confirm("작성 중이던 글을 불러올까요?")) {
        document.getElementById('post-content').value = saved;
    }
};

// 실시간 저장
document.getElementById('post-content')?.addEventListener('input', (e) => {
    localStorage.setItem('slm_tmp_post', e.target.value);
});

async function savePost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const cid = document.getElementById('category-select').value;

    const { error } = await supabase.from('archive_posts').insert([{ title, content, category_id: cid }]);
    if (!error) {
        alert("기록 성공");
        localStorage.removeItem('slm_tmp_post');
        location.reload();
    }
}
