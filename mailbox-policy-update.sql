-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - POLICY UPDATE
-- 익명 우체통 공개 조회 정책 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 기존 정책 확인 후 없으면 생성 (IF NOT EXISTS 구문이 정책엔 없음, DO 블록 사용)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'mailbox_messages' AND policyname = 'Public select answered messages'
    ) THEN
        CREATE POLICY "Public select answered messages"
        ON mailbox_messages FOR SELECT
        TO anon, authenticated
        USING (is_public = true AND status = 'answered');
    END IF;
END $$;

-- 알림
DO $$
BEGIN
    RAISE NOTICE '✅ Policy Updated: Anon can now view public answered messages.';
END $$;
