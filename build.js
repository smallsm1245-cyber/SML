// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 SMALLSM ARCHIVE - BUILD SCRIPT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 
// 이 스크립트는 Vercel 배포 시 환경 변수를 config.js에 주입합니다.
// 
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const fs = require('fs');
const path = require('path');

console.log('🔨 Building SMALLSM Archive...');

// 환경 변수 읽기
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// 환경 변수 검증
if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !ADMIN_EMAIL) {
    console.error('❌ ERROR: 환경 변수가 설정되지 않았습니다!');
    console.error('다음 환경 변수를 Vercel 대시보드에 설정하세요:');
    console.error('- SUPABASE_URL');
    console.error('- SUPABASE_ANON_KEY');
    console.error('- ADMIN_EMAIL');
    process.exit(1);
}

console.log('✅ 환경 변수 확인 완료');

// config.js 파일 읽기
const configPath = path.join(__dirname, 'js', 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

// 플레이스홀더를 실제 환경 변수로 교체
configContent = configContent
    .replace('__SUPABASE_URL__', SUPABASE_URL)
    .replace('__SUPABASE_ANON_KEY__', SUPABASE_ANON_KEY)
    .replace('__ADMIN_EMAIL__', ADMIN_EMAIL);

// 빌드 디렉토리 생성
const buildDir = path.join(__dirname, 'public');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// public 디렉토리에 모든 파일 복사
const copyRecursive = (src, dest) => {
    if (fs.statSync(src).isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        fs.readdirSync(src).forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

// HTML 파일 복사
['index.html', 'admin.html', 'post.html', '404.html'].forEach(file => {
    fs.copyFileSync(
        path.join(__dirname, file),
        path.join(buildDir, file)
    );
});

// CSS 복사
const cssDir = path.join(buildDir, 'css');
if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
}
copyRecursive(path.join(__dirname, 'css'), cssDir);

// JS 복사
const jsDir = path.join(buildDir, 'js');
if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
}
fs.readdirSync(path.join(__dirname, 'js')).forEach(file => {
    if (file !== 'config.local.js' && file !== 'config.local.example.js') {
        fs.copyFileSync(
            path.join(__dirname, 'js', file),
            path.join(jsDir, file)
        );
    }
});

// 환경 변수가 주입된 config.js 쓰기
fs.writeFileSync(path.join(jsDir, 'config.js'), configContent);

console.log('✅ 빌드 완료!');
console.log('📦 빌드 결과: public/ 디렉토리');
