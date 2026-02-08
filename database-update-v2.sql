-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - DATABASE UPDATE v2
-- 휴지통 및 위키형 대시보드 기능 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════
-- 1. TRASH TABLE (휴지통)
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS trash (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('post', 'category')),
    item_id UUID NOT NULL,
    item_data JSONB NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_trash_expires ON trash(expires_at);
CREATE INDEX IF NOT EXISTS idx_trash_type ON trash(item_type);

-- Enable RLS
ALTER TABLE trash ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only admin can access
CREATE POLICY "Admin full access to trash"
ON trash
FOR ALL
TO authenticated
USING (auth.email() = 'your-admin-email@example.com')
WITH CHECK (auth.email() = 'your-admin-email@example.com');

-- ═══════════════════════════════════════════════════
-- 2. ADD STATUS TO POSTS (게시물 상태)
-- ═══════════════════════════════════════════════════

-- Add status column
ALTER TABLE archive_posts
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'private'));

-- Update existing posts
UPDATE archive_posts
SET status = CASE
    WHEN is_private THEN 'private'
    ELSE 'published'
END
WHERE status IS NULL;

-- ═══════════════════════════════════════════════════
-- 3. AUTO CLEANUP FUNCTION (자동 정리)
-- ═══════════════════════════════════════════════════

-- Function to delete expired trash items
CREATE OR REPLACE FUNCTION cleanup_expired_trash()
RETURNS void AS $$
BEGIN
    DELETE FROM trash WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- If pg_cron is available, uncomment:
-- SELECT cron.schedule('cleanup-trash', '0 0 * * *', 'SELECT cleanup_expired_trash()');

-- Manual cleanup (run periodically):
-- SELECT cleanup_expired_trash();

-- ═══════════════════════════════════════════════════
-- 4. UPDATED_AT TRIGGER (자동 업데이트 시각)
-- ═══════════════════════════════════════════════════

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for archive_posts
DROP TRIGGER IF EXISTS update_archive_posts_updated_at ON archive_posts;
CREATE TRIGGER update_archive_posts_updated_at
BEFORE UPDATE ON archive_posts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categories
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════
-- 5. VERIFICATION (설치 확인)
-- ═══════════════════════════════════════════════════

-- Check if everything is created
DO $$
BEGIN
    -- Check trash table
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'trash') THEN
        RAISE NOTICE '✅ Trash table created';
    ELSE
        RAISE EXCEPTION '❌ Trash table creation failed';
    END IF;
    
    -- Check status column
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'archive_posts' 
        AND column_name = 'status'
    ) THEN
        RAISE NOTICE '✅ Status column added';
    ELSE
        RAISE EXCEPTION '❌ Status column creation failed';
    END IF;
    
    RAISE NOTICE '🎉 Database update complete!';
END $$;

-- ═══════════════════════════════════════════════════
-- 6. SAMPLE DATA (테스트용 - 선택사항)
-- ═══════════════════════════════════════════════════

-- Uncomment to add sample trash item:
/*
INSERT INTO trash (item_type, item_id, item_data)
VALUES (
    'post',
    gen_random_uuid(),
    '{"title": "테스트 삭제글", "content": "휴지통 테스트"}'::jsonb
);
*/

-- ═══════════════════════════════════════════════════
-- 7. CLEANUP COMMANDS (유지보수)
-- ═══════════════════════════════════════════════════

-- Manual cleanup of expired trash items:
-- SELECT cleanup_expired_trash();

-- View trash items:
-- SELECT * FROM trash ORDER BY deleted_at DESC;

-- View items expiring soon (within 7 days):
-- SELECT * FROM trash WHERE expires_at < now() + interval '7 days';

-- Count trash items by type:
-- SELECT item_type, COUNT(*) FROM trash GROUP BY item_type;

-- ═══════════════════════════════════════════════════
-- INSTALLATION COMPLETE! 설치 완료!
-- ═══════════════════════════════════════════════════

/*
다음 단계:
1. RLS Policy에서 'your-admin-email@example.com'을 실제 이메일로 변경
2. 정기적으로 SELECT cleanup_expired_trash(); 실행
3. admin-dashboard.html 접속하여 테스트

문제 해결:
- 휴지통이 안 보이면: trash 테이블 생성 확인
- RLS 에러 발생 시: Policy의 이메일 확인
- 자동 정리 안 되면: cleanup_expired_trash() 수동 실행
*/
