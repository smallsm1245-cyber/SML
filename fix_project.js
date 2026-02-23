const fs = require('fs');
const path = require('path');

// 파일 경로 설정
const pdfModulePath = path.join(__dirname, 'js', 'modules', 'pdf-module.js');
const dashboardPath = path.join(__dirname, 'admin', 'js', 'admin-dashboard.js');
const indexPath = path.join(__dirname, 'admin', 'index.html');

console.log('🔄 Starting fix operations...');

// 1. pdf-module.js 수정 (const -> var)
try {
    if (fs.existsSync(pdfModulePath)) {
        let pdfContent = fs.readFileSync(pdfModulePath, 'utf8');
        if (pdfContent.includes('const NOTO_SANS_KR_BASE64')) {
            pdfContent = pdfContent.replace('const NOTO_SANS_KR_BASE64', 'var NOTO_SANS_KR_BASE64');
            fs.writeFileSync(pdfModulePath, pdfContent);
            console.log('✅ pdf-module.js fixed (const -> var)');
        } else {
            console.log('ℹ️ pdf-module.js already has var or not found');
        }
    } else {
        console.error('❌ pdf-module.js not found');
    }
} catch (e) {
    console.error('❌ Error fixing pdf-module.js:', e);
}

// 2. admin-dashboard.js 수정 (addEventListener null check)
try {
    if (fs.existsSync(dashboardPath)) {
        let jsContent = fs.readFileSync(dashboardPath, 'utf8');

        // 정규식으로 getElementById(...).addEventListener(...) 패턴 찾아서 안전하게 변경
        // 예: document.getElementById('saveDraftBtn').addEventListener(...)
        // -> const btn_saveDraftBtn = document.getElementById('saveDraftBtn'); if(btn_saveDraftBtn) btn_saveDraftBtn.addEventListener(...)

        const regex = /document\.getElementById\(['"]([^'"]+)['"]\)\.addEventListener\(/g;
        let match;
        let newJsContent = jsContent;

        // replaceAll은 함수형으로 처리
        newJsContent = newJsContent.replace(regex, (match, id) => {
            return `const btn_${id} = document.getElementById('${id}');\nif (btn_${id}) btn_${id}.addEventListener(`;
        });

        if (jsContent !== newJsContent) {
            fs.writeFileSync(dashboardPath, newJsContent);
            console.log('✅ admin-dashboard.js fixed (added null checks)');
        } else {
            console.log('ℹ️ admin-dashboard.js already safe or no matches');
        }
    } else {
        console.error('❌ admin-dashboard.js not found');
    }
} catch (e) {
    console.error('❌ Error fixing admin-dashboard.js:', e);
}

// 3. admin/index.html 버전 업 (v=3, v=4 -> v=5)
try {
    if (fs.existsSync(indexPath)) {
        let htmlContent = fs.readFileSync(indexPath, 'utf8');

        // 정규식으로 ?v=숫자 패턴을 ?v=5로 변경
        htmlContent = htmlContent.replace(/\?v=\d+/g, '?v=5');

        // 타이틀도 업데이트 (Optional)
        htmlContent = htmlContent.replace(/Admin Dashboard \(v\d+\)/g, 'Admin Dashboard (v5)');
        htmlContent = htmlContent.replace(/관리자 로그인 \(v\d+\)/g, '관리자 로그인 (v5)');

        fs.writeFileSync(indexPath, htmlContent);
        console.log('✅ admin/index.html updated to v5');
    } else {
        console.error('❌ admin/index.html not found');
    }
} catch (e) {
    console.error('❌ Error updating index.html:', e);
}

console.log('🎉 Fix script completed.');
