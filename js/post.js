// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - POST SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ═══════════════════════════════════════════════════
// 1. SUPABASE INITIALIZATION
// ═══════════════════════════════════════════════════
const supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
);

// ═══════════════════════════════════════════════════
// 2. AGE VERIFICATION SYSTEM (Same as main.js)
// ═══════════════════════════════════════════════════
const VERIFICATION_KEY = 'age_verified';
const VERIFICATION_DURATION = 24 * 60 * 60 * 1000;

function checkAgeVerification() {
    const verified = localStorage.getItem(VERIFICATION_KEY);
    
    if (verified) {
        const timestamp = parseInt(verified);
        const now = Date.now();
        
        if (now - timestamp < VERIFICATION_DURATION) {
            hideDisclaimer();
            return;
        }
    }
    
    showDisclaimer();
}

function showDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    overlay.style.display = 'flex';
    container.classList.add('content-blur');
}

function hideDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const container = document.getElementById('appContainer');
    
    overlay.style.display = 'none';
    container.classList.remove('content-blur');
}

document.getElementById('btnYes').addEventListener('click', () => {
    localStorage.setItem(VERIFICATION_KEY, Date.now().toString());
    hideDisclaimer();
});

document.getElementById('btnNo').addEventListener('click', () => {
    window.location.href = 'https://www.google.com';
});

// ═══════════════════════════════════════════════════
// 3. LOAD CATEGORIES (Same as main.js)
// ═══════════════════════════════════════════════════
async function loadCategories() {
    try {
        const { data: categories, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_visible', true)
            .order('display_order', { ascending: true });
        
        if (error) throw error;
        
        const nav = document.getElementById('categoryNav');
        nav.innerHTML = '';
        
        categories.forEach(category => {
            const li = document.createElement('li');
            li.className = 'category-item';
            
            const link = document.createElement('a');
            link.href = `index.html#category-${category.id}`;
            link.className = 'category-link';
            link.textContent = category.name;
            
            li.appendChild(link);
            nav.appendChild(li);
        });
        
    } catch (error) {
        console.error('카테고리 로딩 실패:', error);
    }
}

// ═══════════════════════════════════════════════════
// 4. LOAD POST CONTENT
// ═══════════════════════════════════════════════════
async function loadPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (!postId) {
        window.location.href = '404.html';
        return;
    }
    
    try {
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        const isAdmin = user && user.email === ADMIN_EMAIL;
        
        // Fetch post
        const { data: post, error } = await supabase
            .from('archive_posts')
            .select(`
                *,
                categories (name)
            `)
            .eq('id', postId)
            .single();
        
        if (error) throw error;
        
        // Security: Check if post is private and user is not admin
        if (post.is_private && !isAdmin) {
            window.location.href = '404.html';
            return;
        }
        
        // Display post
        document.getElementById('pageTitle').textContent = `${post.title} - SMALLSM Archive`;
        document.getElementById('postTitle').textContent = post.title;
        document.getElementById('postCategory').textContent = post.categories.name;
        document.getElementById('postDate').textContent = new Date(post.created_at).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Process content
        let processedContent = post.content;
        
        // Convert markdown-style formatting to HTML
        processedContent = processedContent
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<u>$1</u>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1">')
            .replace(/\n/g, '<br>');
        
        document.getElementById('postContent').innerHTML = processedContent;
        
        // Add copy protection class if needed
        if (!post.origin_free) {
            document.getElementById('postContent').classList.add('copy-protected');
        }
        
    } catch (error) {
        console.error('게시물 로딩 실패:', error);
        window.location.href = '404.html';
    }
}

// ═══════════════════════════════════════════════════
// 5. NIGHT MODE (Same as main.js)
// ═══════════════════════════════════════════════════
const modeToggle = document.getElementById('modeToggle');
const NIGHT_MODE_KEY = 'night_mode';

function loadNightMode() {
    const isNightMode = localStorage.getItem(NIGHT_MODE_KEY) === 'true';
    
    if (isNightMode) {
        document.body.classList.add('night-mode');
        modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
    }
}

modeToggle.addEventListener('click', () => {
    const isNightMode = document.body.classList.toggle('night-mode');
    localStorage.setItem(NIGHT_MODE_KEY, isNightMode);
    
    if (isNightMode) {
        modeToggle.innerHTML = '<span>☀️</span><span>Day Mode</span>';
    } else {
        modeToggle.innerHTML = '<span>🌙</span><span>Night Library</span>';
    }
});

// ═══════════════════════════════════════════════════
// 6. COPY PROTECTION (Same as main.js)
// ═══════════════════════════════════════════════════
document.addEventListener('copy', async (e) => {
    const selection = window.getSelection().toString();
    
    if (!selection) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');
    
    if (postId) {
        try {
            const { data: post } = await supabase
                .from('archive_posts')
                .select('origin_free')
                .eq('id', postId)
                .single();
            
            if (post && post.origin_free) {
                return;
            }
        } catch (error) {
            console.error('복사 보호 확인 실패:', error);
        }
    }
    
    const attribution = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━\n본 기록은 SMALLSM Archive의 자산입니다.\n출처: ${window.location.href}\n⚠️ 무단 수정 및 상업적 이용을 금합니다.\n━━━━━━━━━━━━━━━━━━━━━━━━`;
    
    e.clipboardData.setData('text/plain', selection + attribution);
    e.preventDefault();
});

// ═══════════════════════════════════════════════════
// 7. INITIALIZATION
// ═══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    checkAgeVerification();
    loadCategories();
    loadPost();
    loadNightMode();
});
