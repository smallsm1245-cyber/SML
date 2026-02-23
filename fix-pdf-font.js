const fs = require('fs');

console.log('📝 PDF 모듈 폰트 설정 수정 중...\n');

const filePath = './js/pdf-module.js';

// 파일 읽기
let content = fs.readFileSync(filePath, 'utf8');

console.log(`📂 원본 파일 크기: ${Math.round(content.length / 1024 / 1024 * 100) / 100} MB`);

// 문제가 되는 패턴 찾기 및 수정
let fixCount = 0;

// 패턴 1: doc.setFont(undefined, 'bold') → doc.setFont('NotoSansKR', 'normal')
const pattern1 = /doc\.setFont\(undefined,\s*['"]bold['"]\)/g;
const matches1 = content.match(pattern1);
if (matches1) {
    console.log(`\n✅ 찾은 패턴 1: ${matches1.length}개`);
    content = content.replace(pattern1, "doc.setFont('NotoSansKR', 'normal')");
    fixCount += matches1.length;
}

// 패턴 2: doc.setFont(undefined, 'normal') → doc.setFont('NotoSansKR', 'normal')  
const pattern2 = /doc\.setFont\(undefined,\s*['"]normal['"]\)/g;
const matches2 = content.match(pattern2);
if (matches2) {
    console.log(`✅ 찾은 패턴 2: ${matches2.length}개`);
    content = content.replace(pattern2, "doc.setFont('NotoSansKR', 'normal')");
    fixCount += matches2.length;
}

// 파일 저장
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ 총 ${fixCount}개의 폰트 설정 수정 완료`);
console.log(`📁 수정된 파일: ${filePath}`);
console.log('\n🎉 이제 브라우저를 새로고침하고 PDF를 다시 생성해보세요!');
