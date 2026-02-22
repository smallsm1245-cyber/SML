-- ═══════════════════════════════════════════════════
-- '성향 백과' 대분류 카테고리 추가
-- Supabase SQL Editor에서 실행하세요
-- ═══════════════════════════════════════════════════

-- 현재 최대 display_order 확인 후 그 다음 순서로 삽입
INSERT INTO categories (name, parent_id, display_order, is_visible)
VALUES (
    '성향 백과',
    NULL,           -- 대분류 (부모 없음)
    (SELECT COALESCE(MAX(display_order), 0) + 1 FROM categories WHERE parent_id IS NULL),
    true
)
ON CONFLICT DO NOTHING;
