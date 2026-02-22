const fs = require('fs');
const path = require('path');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎬 한글 폰트 Base64 변환 스크립트
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

console.log('📄 한글 폰트 변환 시작...\n');

// 설정: 폰트 파일 경로 (필요 시 수정)
const fontPath = process.argv[2] || './NotoSansKR-Regular.ttf';
const outputPath = './js/pdf-module.js';

// 폰트 파일 존재 확인
if (!fs.existsSync(fontPath)) {
    console.error('❌ 폰트 파일을 찾을 수 없습니다:', fontPath);
    console.log('\n사용법:');
    console.log('  node convert-korean-font.js <폰트파일경로>');
    console.log('\n예시:');
    console.log('  node convert-korean-font.js ./NotoSansKR-Regular.ttf');
    process.exit(1);
}

// TTF 파일을 Base64로 변환
console.log('📂 폰트 파일 읽기:', fontPath);
const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

const fontSizeKB = Math.round(base64Font.length / 1024);
console.log(`✅ Base64 변환 완료 (크기: ${fontSizeKB} KB)\n`);

// pdf-module.js 파일 읽기
if (!fs.existsSync(outputPath)) {
    console.error('❌ pdf-module.js 파일을 찾을 수 없습니다:', outputPath);
    process.exit(1);
}

let pdfModuleContent = fs.readFileSync(outputPath, 'utf8');

// NOTO_SANS_KR_BASE64 값 교체
const regex = /const NOTO_SANS_KR_BASE64 = null;/;
const replacement = `const NOTO_SANS_KR_BASE64 = "${base64Font}";`;

if (!regex.test(pdfModuleContent)) {
    console.warn('⚠️  NOTO_SANS_KR_BASE64 = null을 찾을 수 없습니다.');
    console.log('수동으로 Base64 문자열을 추가해주세요.\n');

    // Base64 문자열을 별도 파일로 저장
    const backupPath = './noto-sans-kr-base64.txt';
    fs.writeFileSync(backupPath, base64Font);
    console.log(`📁 Base64 문자열을 저장했습니다: ${backupPath}`);
    console.log('이 문자열을 pdf-module.js의 NOTO_SANS_KR_BASE64 변수에 붙여넣으세요.');
} else {
    pdfModuleContent = pdfModuleContent.replace(regex, replacement);
    fs.writeFileSync(outputPath, pdfModuleContent);
    console.log(`✅ pdf-module.js 업데이트 완료!`);
    console.log(`📍 파일 위치: ${outputPath}\n`);
    console.log('🎉 이제 브라우저를 새로고침하고 PDF 다운로드를 다시 시도하세요.');
}
