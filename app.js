// [3.1] 성인 인증 로직
function verifyAge(isAdult) {
    if (isAdult) {
        localStorage.setItem('adult_verified', 'true');
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
    } else {
        alert("미성년자는 입장할 수 없습니다.");
        window.location.href = "https://www.google.com";
    }
}

// 페이지 로드 시 인증 여부 확인
window.onload = () => {
    if (localStorage.getItem('adult_verified') === 'true') {
        document.body.classList.remove('is-blurred');
        document.getElementById('disclaimer').style.display = 'none';
    }
    // Supabase 연결 및 카테고리 로드 실행
    if (typeof initSupabase === "function") initSupabase();
};

// Supabase 초기화 (config.js 로드 후 실행)
function initSupabase() {
    if (typeof CONFIG === 'undefined') return;
    const supabase = idb.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
    // 이후 카테고리 fetch 로직...
}
