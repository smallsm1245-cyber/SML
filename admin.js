const supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('pw').value;
    if(email !== CONFIG.ADMIN_EMAIL) return alert("접근 권한이 없습니다.");
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert("로그인 실패: " + error.message);
    else checkUser();
}

async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user && user.email === CONFIG.ADMIN_EMAIL) {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        loadCats();
    }
}

function updatePreview() {
    document.getElementById('editor-preview').innerHTML = document.getElementById('editor-input').value;
}

async function loadCats() {
    const { data } = await supabase.from('categories').select('*');
    document.getElementById('cat-select').innerHTML = data.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

async function savePost() {
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('editor-input').value;
    const category_id = document.getElementById('cat-select').value;

    const { error } = await supabase.from('archive_posts').insert([{ title, content, category_id }]);
    if (error) alert("오류: " + error.message);
    else { alert("보관 완료"); location.reload(); }
}

async function handleLogout() { await supabase.auth.signOut(); location.reload(); }
window.onload = checkUser;

