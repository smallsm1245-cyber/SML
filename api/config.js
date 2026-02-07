 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/api/config.js b/api/config.js
index fec8e589bd63b9b27424a79b083f35a7bada0ef7..35a091e694a215c3328dae3e1db226a4a2550167 100644
--- a/api/config.js
+++ b/api/config.js
@@ -1,19 +1,19 @@
 // Vercel Serverless Function - 환경 변수 주입
 export default function handler(req, res) {
     // CORS 헤더 설정
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'GET');
     res.setHeader('Content-Type', 'application/javascript');
     
     // 환경 변수를 JavaScript 코드로 반환
     const config = `
         window.SUPABASE_CONFIG = {
             url: '${process.env.SUPABASE_URL || ''}',
             anonKey: '${process.env.SUPABASE_ANON_KEY || ''}'
         };
-        window.ADMIN_EMAIL = 'smallsml@naver.com';
+        window.ADMIN_EMAIL = 'smallsm@naver.com';
         console.log('✅ 환경 변수 로드 완료');
     `;
     
     res.status(200).send(config);
 }
 
EOF
)
