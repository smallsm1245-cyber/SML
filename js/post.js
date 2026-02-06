// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - POST SCRIPT (FINAL)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000;

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    if (verified && (Date.now() - parseInt(verified) < VERIFICATION_DURATION)) {
        if (overlay) overlay.style.display = 'none';
        if (container) container.classList.remove('content-blur');
    } else {
        if (overlay) overlay.style.display = 'flex';
        if (container) container.classList.add('content-blur');
    }
}

function handleVerifySuccess() {
    localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
    document.getElementById('disclaimerOverlay').style.display = 'none';
    document.getElementById('appContainer').classList.remove('content-blur');
}

document.addEventListener('DOMContentLoaded', () => {
    checkAgeVerification();

    const btnYes = document.getElementById('btnYes');
    if (btnYes) btnYes.addEventListener('click', handleVerifySuccess);

    const btnNo = document.getElementById('btnNo');
    if (btnNo) {
        btnNo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // 게시글 로드 로직 실행
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    if (postId && typeof loadPostContent === 'function') {
        loadPostContent(postId);
    }
});
