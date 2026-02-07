// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - ADMIN SCRIPT (Simplified)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📱 Admin script loading...');

let supabase = null;
let isConfigReady = false;

// Wait for config to load
function waitForConfig() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.supabase) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

// Show error message
function showError(message) {
    const loginError = document.getElementById('loginError');
    if (loginError) {
        loginError.textContent = message;
        loginError.style.display = 'block';
        setTimeout(() => {
            loginError.style.display = 'none';
        }, 3000);
    }
}

// Show admin panel
function showAdminPanel() {
    const loginScreen = document.getElementById('loginScreen');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (adminPanel) adminPanel.style.display = 'block';
}

// Check authentication
async function checkAuth() {
    if (!supabase) {
        console.log('⚠️ Supabase not ready for auth check');
        return;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
            console.log('❌ Not authenticated');
            return;
        }
        
        // Whitelist verification
        if (user.email !== window.ADMIN_EMAIL) {
            alert('관리자 권한이 없습니다.');
            await supabase.auth.signOut();
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Admin authenticated:', user.email);
        showAdminPanel();
        
    } catch (error) {
        console.error('❌ Auth check failed:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM ready');
    
    // Wait for config
    await waitForConfig();
    
    // Initialize Supabase
    supabase = window.supabase.createClient(
        window.SUPABASE_CONFIG.url,
        window.SUPABASE_CONFIG.anonKey
    );
    
    isConfigReady = true;
    console.log('✅ Supabase initialized for admin');
    
    // Check if already logged in
    await checkAuth();
    
    // Setup login button
    const loginBtn = document.getElementById('loginBtn');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    
    if (!loginBtn || !loginEmail || !loginPassword) {
        console.error('❌ Login elements not found');
        return;
    }
    
    console.log('✅ Login elements found');
    
    // Enter key listener
    [loginEmail, loginPassword].forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                loginBtn.click();
            }
        });
    });
    
    // Login button click
    loginBtn.addEventListener('click', async () => {
        console.log('🔘 Login button clicked');
        
        const email = loginEmail.value.trim();
        const password = loginPassword.value.trim();
        
        console.log('📧 Email:', email);
        
        if (!email || !password) {
            showError('이메일과 비밀번호를 입력하세요');
            return;
        }
        
        if (!isConfigReady || !supabase) {
            showError('시스템 초기화 중입니다. 잠시 후 다시 시도하세요.');
            return;
        }
        
        // Check if email is authorized
        if (email !== window.ADMIN_EMAIL) {
            showError(`관리자 권한이 없습니다. (허용: ${window.ADMIN_EMAIL})`);
            return;
        }
        
        loginBtn.disabled = true;
        loginBtn.textContent = '로그인 중...';
        
        try {
            console.log('🔐 Attempting login...');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });
            
            if (error) {
                console.error('❌ Supabase error:', error);
                throw error;
            }
            
            console.log('✅ Login successful');
            showAdminPanel();
            
        } catch (error) {
            console.error('❌ Login failed:', error);
            showError(error.message || '로그인 실패');
            loginBtn.disabled = false;
            loginBtn.textContent = '로그인';
        }
    });
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!confirm('로그아웃하시겠습니까?')) return;
            
            try {
                await supabase.auth.signOut();
                window.location.href = 'index.html';
            } catch (error) {
                console.error('❌ Logout failed:', error);
                alert('로그아웃 중 오류가 발생했습니다.');
            }
        });
    }
    
    console.log('🎉 Admin script initialized');
});
