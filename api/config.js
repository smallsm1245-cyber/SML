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
        window.ADMIN_EMAIL = 'smallsm@naver.com';
        console.log('✅ 환경 변수 로드 완료');
    `;
    
    res.status(200).send(config);
}
