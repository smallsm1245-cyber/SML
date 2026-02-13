-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - DATABASE UPDATE
-- 홈화면 편집 및 카테고리 관리 기능 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════
-- 1. CATEGORIES 테이블에 드롭다운 관련 컬럼 추가
-- ═══════════════════════════════════════════════════

-- has_dropdown: 드롭다운 사용 여부
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS has_dropdown BOOLEAN DEFAULT true;

-- default_open: 기본 열림/닫힘 상태
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS default_open BOOLEAN DEFAULT false;

-- 기존 카테고리에 기본값 설정
UPDATE categories 
SET has_dropdown = true, default_open = false 
WHERE has_dropdown IS NULL;

-- ═══════════════════════════════════════════════════
-- 2. SETTINGS 테이블에 홈화면 설정 추가
-- ═══════════════════════════════════════════════════

-- 홈화면 설정 삽입 (이미 있으면 무시)
INSERT INTO settings (key, value) VALUES
    ('home_title', '환영합니다'),
    ('home_subtitle', 'SMALLSM Archive에 오신 것을 환영합니다'),
    ('home_content', '좌측 사이드바에서 카테고리를 선택하여 기록을 탐색하세요.

이곳은 성향과 실천, 그리고 깊이 있는 사색이 담긴 공간입니다.'),
    ('show_recent_posts', 'false'),
    ('recent_posts_count', '3')
ON CONFLICT (key) DO NOTHING;

-- ═══════════════════════════════════════════════════
-- 3. 완료!
-- ═══════════════════════════════════════════════════

-- ✅ 데이터베이스 업데이트 완료!
-- 
-- 추가된 기능:
-- 1. 카테고리별 드롭다운 설정 (has_dropdown, default_open)
-- 2. 홈화면 편집 설정 (settings 테이블)
