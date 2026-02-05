let supabase;

window.onload = async () => {
    if (typeof CONFIG !== 'undefined') {
        supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        loadCategories();
    }
    
    // 자동 저장 복구
    const saved = localStorage.getItem('slm_draft');
    if (saved && confirm("작성 중이던 기록이 있습니다. 복구할까요?")) {
        document.getElementById('post-content').value = saved;
    }
};

// 실시간 자동 저장
document.getElementById('post-content')?.addEventListener('input', (e) => {
    localStorage.setItem('slm_draft', e.target.value);
});

async function loadCategories() {
    const { data } = await supabase.from('categories').select('*');
    const sel = document.getElementById('category-select');
    data?.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id; opt.innerText = c.name;
        sel.appendChild(opt);
    });
}

async function saveArchive() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;
    const catId = document.getElementById('category-select').value;

    const { error } = await supabase.from('archive_posts').insert([{
        title, content, category_id: catId, is_private: false
    }]);

    if (!error) {
        alert("성공적으로 기록되었습니다.");
        localStorage.removeItem('slm_draft');
        location.reload();
    }
}
