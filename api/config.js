module.exports = (req, res) => {
    const config = `
    window.SUPABASE_CONFIG = {
      url: "${process.env.SUPABASE_URL || ''}",
      anonKey: "${process.env.SUPABASE_ANON_KEY || ''}"
    };
    window.ADMIN_EMAIL = "${process.env.ADMIN_EMAIL || 'smallsm@naver.com'}";
  `;
    res.setHeader('Content-Type', 'application/javascript');
    res.status(200).send(config);
};
