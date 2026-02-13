-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - FIX TENDENCIES RLS
-- 성향 관리 권한 오류(403 Forbidden) 해결
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 기존 잘못된 정책 삭제
DROP POLICY IF EXISTS "Admin full access to tendencies" ON tendencies;
DROP POLICY IF EXISTS "Public read tendencies" ON tendencies;

-- 2. 실제 관리자 이메일을 이용한 정책 재설정
-- (api/config.js에 설정된 smallsm@naver.com 사용)
CREATE POLICY "Admin full access to tendencies"
ON tendencies
FOR ALL
TO authenticated
USING (auth.email() = 'smallsm@naver.com')
WITH CHECK (auth.email() = 'smallsm@naver.com');

-- 3. 일반 사용자 읽기 권한 설정
CREATE POLICY "Public read tendencies"
ON tendencies
FOR SELECT
TO anon, authenticated
USING (true);

-- 확인 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ Tendencies RLS policies updated successfully!';
END $$;
