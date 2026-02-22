// SMALLSM Archive - Simplified Main Script
console.log('🚀 Simple main script loaded');

// Wait for config
function waitForConfig(callback) {
    const check = setInterval(() => {
        if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url) {
            clearInterval(check);
            callback();
        }
    }, 100);
}

// Initialize when DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM ready');
    
    // Yes button
    document.getElementById('btnYes')?.addEventListener('click', () => {
        console.log('✅ Yes clicked');
        localStorage.setItem('age_verified', Date.now());
        document.getElementById('disclaimerOverlay').style.display = 'none';
        document.getElementById('appContainer').classList.remove('content-blur');
    });
    
    // No button
    document.getElementById('btnNo')?.addEventListener('click', () => {
        console.log('❌ No clicked');
        window.location.href = 'https://www.google.com';
    });
    
    // Check if already verified
    const verified = localStorage.getItem('age_verified');
    if (verified && (Date.now() - parseInt(verified) < 86400000)) {
        document.getElementById('disclaimerOverlay').style.display = 'none';
        document.getElementById('appContainer').classList.remove('content-blur');
    }
});
