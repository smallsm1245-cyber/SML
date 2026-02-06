-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - DATABASE SETUP
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 
-- 이 SQL 파일을 Supabase의 SQL Editor에서 실행하세요
-- 
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════
-- 1. CATEGORIES TABLE (카테고리)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default categories
INSERT INTO categories (name, is_visible, display_order) VALUES
    ('PROLOGUE', true, 1),
    ('ESSENCE', true, 2),
    ('PRACTICE', true, 3),
    ('GLOSSARY', true, 4),
    ('SECRETARY', false, 5);

-- ═══════════════════════════════════════════════════
-- 2. ARCHIVE_POSTS TABLE (게시물)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS archive_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    is_private BOOLEAN DEFAULT false,
    origin_free BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_category ON archive_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON archive_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_title ON archive_posts USING gin(to_tsvector('english', title));

-- ═══════════════════════════════════════════════════
-- 3. SETTINGS TABLE (사이트 설정)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
    ('full_name', 'SMALLSM'),
    ('short_name', 'SLM'),
    ('site_title', 'SMALLSM Archive'),
    ('site_subtitle', 'Cinematic Records');

-- ═══════════════════════════════════════════════════
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- ───────────────────────────────────────────────────
-- 4.1 CATEGORIES POLICIES
-- ───────────────────────────────────────────────────

-- Public can read visible categories
CREATE POLICY "Public can read visible categories"
    ON categories FOR SELECT
    USING (is_visible = true);

-- Authenticated admin can do everything
CREATE POLICY "Admin can manage categories"
    ON categories FOR ALL
    USING (auth.jwt() ->> 'email' = 'your-admin-email@example.com');

-- ───────────────────────────────────────────────────
-- 4.2 ARCHIVE_POSTS POLICIES
-- ───────────────────────────────────────────────────

-- Public can read non-private posts
CREATE POLICY "Public can read public posts"
    ON archive_posts FOR SELECT
    USING (is_private = false);

-- Admin can read all posts
CREATE POLICY "Admin can read all posts"
    ON archive_posts FOR SELECT
    USING (auth.jwt() ->> 'email' = 'your-admin-email@example.com');

-- Admin can manage all posts
CREATE POLICY "Admin can manage posts"
    ON archive_posts FOR ALL
    USING (auth.jwt() ->> 'email' = 'your-admin-email@example.com');

-- ───────────────────────────────────────────────────
-- 4.3 SETTINGS POLICIES
-- ───────────────────────────────────────────────────

-- Public can read settings
CREATE POLICY "Public can read settings"
    ON settings FOR SELECT
    USING (true);

-- Admin can manage settings
CREATE POLICY "Admin can manage settings"
    ON settings FOR ALL
    USING (auth.jwt() ->> 'email' = 'your-admin-email@example.com');

-- ═══════════════════════════════════════════════════
-- 5. STORAGE BUCKET FOR IMAGES
-- ═══════════════════════════════════════════════════

-- Create storage bucket (실행은 Supabase Dashboard의 Storage 섹션에서)
-- Bucket name: archive-images
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/gif, image/webp

-- Storage policies (Dashboard에서 설정)
-- 1. "Public can read images" - SELECT: (bucket_id = 'archive-images')
-- 2. "Admin can upload images" - INSERT: (bucket_id = 'archive-images' AND auth.jwt() ->> 'email' = 'your-admin-email@example.com')
-- 3. "Admin can delete images" - DELETE: (bucket_id = 'archive-images' AND auth.jwt() ->> 'email' = 'your-admin-email@example.com')

-- ═══════════════════════════════════════════════════
-- 6. UPDATE TIMESTAMP TRIGGER
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON archive_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════
-- 7. COMPLETED
-- ═══════════════════════════════════════════════════

-- ✅ 데이터베이스 설정 완료!
-- 
-- 다음 단계:
-- 1. Supabase Dashboard > Settings > API에서 URL과 anon key 확인
-- 2. js/config.js 파일 생성 (config.example.js 참고)
-- 3. RLS Policy의 'your-admin-email@example.com'을 실제 관리자 이메일로 교체
-- 4. Storage > archive-images 버킷 생성 및 정책 설정
