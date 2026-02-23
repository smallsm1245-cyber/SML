-- Supabase Migration: builder_pages 테이블 생성
-- 실행 위치: Supabase SQL Editor
-- 웹 빌더에서 저장한 캔버스 상태(JSON)를 저장하는 테이블입니다.

CREATE TABLE IF NOT EXISTS public.builder_pages (
    id          TEXT        PRIMARY KEY,         -- 페이지 식별자 (예: 'main', 'about')
    user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
    state_json  TEXT        NOT NULL DEFAULT '{}',  -- 직렬화된 캔버스 상태(JSON)
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 (Row Level Security)
ALTER TABLE public.builder_pages ENABLE ROW LEVEL SECURITY;

-- 읽기(SELECT): 누구나 가능 (공개 미리보기 허용)
CREATE POLICY "builder_pages_select_public"
ON public.builder_pages
FOR SELECT USING (true);

-- 쓰기(INSERT/UPDATE/DELETE): 인증된 사용자(관리자)만 허용
CREATE POLICY "builder_pages_write_admin"
ON public.builder_pages
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
