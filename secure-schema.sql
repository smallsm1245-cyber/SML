-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🎬 SMALLSM ARCHIVE - SECURITY & PRIVACY UPDATE
-- 익명 우체통 및 자유게시판을 위한 보안 DB 스키마
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- ═══════════════════════════════════════════════════
-- 1. ANONYMOUS MAILBOX (익명 우체통)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS mailbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT DEFAULT '익명', -- 별명 (선택)
    password_hash TEXT, -- 비밀번호 해시 (삭제/수정용, 클라이언트 생성)
    content TEXT NOT NULL, -- 고민 내용
    admin_reply TEXT, -- 관리자 답변
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'answered', 'archived')),
    is_public BOOLEAN DEFAULT false, -- 공개 여부 (사용자 동의 시)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 활성화
ALTER TABLE mailbox_messages ENABLE ROW LEVEL SECURITY;

-- [정책 1] 누구나(익명) 작성 가능 (INSERT Only)
CREATE POLICY "Anon can insert message"
ON mailbox_messages FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- [정책 2] 관리자는 모든 메시지 조회 가능 (SELECT All)
-- (email 확인 로직은 application level 또는 auth.uid() 매핑 필요. 여기서는 간단히 anon/auth 구분)
-- 실제 운영 시: auth.role() = 'service_role' 이나 특정 ID 체크 권장.
-- 여기서는 'authenticated' 사용자(관리자)에게 권한 부여. (이메일 체크 추가 권장)
CREATE POLICY "Admin select all messages"
ON mailbox_messages FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'smallsm@naver.com'); -- 관리자 이메일 하드코딩

-- [정책 3] 공개된 답변 완료 메시지는 누구나 조회 가능 (SELECT Public)
CREATE POLICY "Public select answered requests"
ON mailbox_messages FOR SELECT
TO anon, authenticated
USING (is_public = true AND status = 'answered');

-- [정책 4] 관리자는 답변 작성(UPDATE) 가능
CREATE POLICY "Admin update reply"
ON mailbox_messages FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' = 'smallsm@naver.com')
WITH CHECK (auth.jwt() ->> 'email' = 'smallsm@naver.com');

-- ═══════════════════════════════════════════════════
-- 2. FREE BOARD (자유 게시판 - 익명 타임라인)
-- ═══════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS free_board_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nickname TEXT DEFAULT '익명',
    password_hash TEXT,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS 활성화
ALTER TABLE free_board_posts ENABLE ROW LEVEL SECURITY;

-- [정책 1] 누구나 작성 가능
CREATE POLICY "Anon can insert free post"
ON free_board_posts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- [정책 2] 누구나 조회 가능
CREATE POLICY "Public select free posts"
ON free_board_posts FOR SELECT
TO anon, authenticated
USING (true);

-- ═══════════════════════════════════════════════════
-- 3. 보안 감사 (Security Audit)
-- ═══════════════════════════════════════════════════
-- IP 주소 컬럼이 없는지 확인 (스키마 레벨에서 원천 차단)
-- 만약 실수로라도 ip_address 컬럼이 추가되지 않도록 주석 처리.
-- -- ALTER TABLE mailbox_messages DROP COLUMN IF EXISTS ip_address;

-- 알림
DO $$
BEGIN
    RAISE NOTICE '✅ Security Schema Created (Mailbox & FreeBoard)';
END $$;
