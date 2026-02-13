-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - DATABASE UPDATE v5 (Tendencies Hierarchy)
-- 성향과 카테고리 연결을 위한 category_id 컬럼 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. tendencies 테이블에 category_id 컬럼 추가
ALTER TABLE tendencies 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- 2. 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_tendencies_category_id ON tendencies(category_id);

-- 3. 확인 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ tendencies 테이블에 category_id 컬럼이 추가되었습니다.';
END $$;
