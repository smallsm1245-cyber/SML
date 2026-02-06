// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - ENVIRONMENT CONFIGURATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// 환경 변수 로드 시스템
// Vercel/Netlify 환경 변수 또는 로컬 config.js 사용

let SUPABASE_CONFIG = {
    url: '',
    anonKey: ''
};

let ADMIN_EMAIL = '';

// 환경 변수에서 로드 시도 (Vercel/Netlify)
if (typeof window !== 'undefined') {
    // 빌드 시 환경 변수가 주입됨
    SUPABASE_CONFIG.url = '__SUPABASE_URL__';
    SUPABASE_CONFIG.anonKey = '__SUPABASE_ANON_KEY__';
    ADMIN_EMAIL = '__ADMIN_EMAIL__';
}

// 환경 변수가 주입되지 않은 경우 (로컬 개발)
// config.local.js 파일에서 로드
if (SUPABASE_CONFIG.url === '__SUPABASE_URL__' || !SUPABASE_CONFIG.url) {
    console.warn('환경 변수가 설정되지 않았습니다. config.local.js를 확인하세요.');
    
    // 로컬 개발용 설정을 별도 파일에서 로드
    // config.local.js 파일을 만들어서 사용하세요 (gitignore에 등록됨)
    if (typeof SUPABASE_CONFIG_LOCAL !== 'undefined') {
        SUPABASE_CONFIG = SUPABASE_CONFIG_LOCAL;
        ADMIN_EMAIL = ADMIN_EMAIL_LOCAL;
    }
}
