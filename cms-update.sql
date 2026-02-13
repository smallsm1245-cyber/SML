-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - CMS UPDATE
-- 상담 답변 템플릿 및 관리 기능
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- 1. 답변 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS answer_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL, -- 템플릿 제목 (예: 첫 인사, 마무리 인사)
    content TEXT NOT NULL, -- 템플릿 내용
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 활성화
ALTER TABLE answer_templates ENABLE ROW LEVEL SECURITY;

-- 정책: 관리자만 접근 가능
CREATE POLICY "Admin full access to templates"
ON answer_templates
FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'smallsm@naver.com')
WITH CHECK (auth.jwt() ->> 'email' = 'smallsm@naver.com');

-- 2. 초기 템플릿 데이터 삽입 (예시)
INSERT INTO answer_templates (title, content, display_order) VALUES
('따뜻한 첫 인사', '안녕하세요. 용기 내어 고민을 남겨주셔서 진심으로 감사합니다. 당신의 이야기를 듣게 되어 기쁩니다.', 1),
('마무리 인사', '언제든 마음이 힘들 때 이곳을 찾아주세요. 당신의 앞날을 항상 응원하겠습니다.', 2),
('공감 표현', '정말 많이 힘드셨겠어요. 그 마음 충분히 이해합니다.', 3);

-- 알림
DO $$
BEGIN
    RAISE NOTICE '✅ CMS Schema Created (Answer Templates)';
END $$;
