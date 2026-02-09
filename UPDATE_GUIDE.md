# 🎉 SMALLSM Archive - 홈화면 편집 & 카테고리 관리 기능 추가

## ✨ 새로 추가된 기능

### 1️⃣ 홈화면 편집 기능 🏠

관리자 패널에서 메인 페이지 내용을 자유롭게 편집할 수 있습니다.

**편집 가능한 항목:**
- 메인 제목
- 부제목  
- 본문 내용
- 최신 게시물 자동 표시 on/off
- 표시할 게시물 개수 (1-10개)

**사용 방법:**
1. 관리자 패널 접속
2. "🏠 홈화면 편집" 섹션 클릭하여 열기
3. 내용 수정
4. "홈화면 저장" 버튼 클릭
5. 메인 페이지 새로고침하여 확인

---

### 2️⃣ 카테고리 전체 관리 기능 📂

카테고리를 완전히 자유롭게 관리할 수 있습니다.

#### 📌 새 카테고리 추가
- 카테고리 이름 입력 후 "추가하기" 클릭
- 자동으로 맨 아래에 추가됨
- 기본값: 공개, 드롭다운 사용, 기본 닫힘

#### ✏️ 카테고리 이름 변경
- "✏️ 수정" 버튼 클릭
- 새 이름 입력
- 즉시 반영됨

#### ⋮⋮ 드래그 앤 드롭 순서 변경
- 왼쪽 `⋮⋮` 아이콘 잡고 드래그
- 원하는 위치에 드롭
- 자동 저장

#### 🗑️ 카테고리 삭제
- "🗑️ 삭제" 버튼 클릭
- 게시물 있으면 선택:
  - 게시물도 함께 삭제
  - 다른 카테고리로 이동 (선택 불가 - 간단하게 함께 삭제만 지원)

#### ⚙️ 드롭다운 설정 (카테고리별)
**공개 설정:**
- 공개 / 비공개 라디오 버튼

**드롭다운 사용:**
- ☑ 체크: 사이드바에서 클릭 시 글 목록 펼침
- ☐ 체크 해제: 클릭 시 페이지 이동

**기본 상태 (드롭다운 사용 시):**
- 기본 열림: 페이지 로드 시 이미 펼쳐져 있음
- 기본 닫힘: 페이지 로드 시 접혀있음

---

## 🔧 설치 방법

### 1단계: 데이터베이스 업데이트

Supabase Dashboard > SQL Editor에서 `database-update.sql` 파일 실행:

```sql
-- categories 테이블에 컬럼 추가
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS has_dropdown BOOLEAN DEFAULT true;

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS default_open BOOLEAN DEFAULT false;

-- 기존 카테고리 업데이트
UPDATE categories 
SET has_dropdown = true, default_open = false 
WHERE has_dropdown IS NULL;

-- settings 테이블에 홈화면 설정 추가
INSERT INTO settings (key, value) VALUES
    ('home_title', '환영합니다'),
    ('home_subtitle', 'SMALLSM Archive에 오신 것을 환영합니다'),
    ('home_content', '좌측 사이드바에서...'),
    ('show_recent_posts', 'false'),
    ('recent_posts_count', '3')
ON CONFLICT (key) DO NOTHING;
```

### 2단계: 파일 업로드

모든 파일을 기존 프로젝트에 덮어쓰기:
- `admin.html` (업데이트됨)
- `js/admin-new.js` (업데이트됨)
- `js/main.js` (업데이트 필요 - 아래 참고)

### 3단계: main.js 수동 업데이트 (중요!)

`js/main.js` 파일에서 초기화 부분을 찾아 `loadHomeScreen()` 호출 추가:

```javascript
// 기존 코드
waitForConfig(() => {
    initializeSupabase();
    loadCategories();
    initSearch();
    loadHomeScreen(); // ← 이 줄 추가!
});
```

**또는** 제공된 `main.js` 파일로 전체 교체하세요.

---

## 📋 변경된 파일 목록

### 수정된 파일:
- ✅ `admin.html` - 홈화면 편집 & 카테고리 관리 UI 추가
- ✅ `js/admin-new.js` - 모든 관리 기능 로직 추가
- ⚠️ `js/main.js` - 홈화면 로딩 함수 추가 필요

### 새 파일:
- ✅ `database-update.sql` - DB 스키마 업데이트

---

## 🎯 사용 예시

### 예시 1: 계절별 홈화면 변경
```
크리스마스 시즌:
제목: "메리 크리스마스! 🎄"
부제목: "연말 특별 기록 모음"
본문: "올 한 해를 돌아보며..."

평소:
제목: "환영합니다"
부제목: "SMALLSM Archive"
```

### 예시 2: 카테고리 드롭다운 설정
```
ESSENCE (일기):
→ 드롭다운 사용 ✓
→ 기본 열림 ← 자주 보니까!

GLOSSARY (용어집):
→ 드롭다운 사용 ✓
→ 기본 닫힘 ← 필요할 때만!

PROLOGUE (공지):
→ 드롭다운 사용 ✗ ← 글 2개뿐이니 그냥 페이지 이동!
```

---

## 🐛 문제 해결

### 홈화면이 바뀌지 않을 때
1. 브라우저 캐시 강제 새로고침 (Ctrl + Shift + R)
2. `database-update.sql` 실행 확인
3. Supabase settings 테이블에 데이터 있는지 확인

### 카테고리 드래그가 안 될 때
1. 왼쪽 `⋮⋮` 아이콘을 정확히 클릭
2. 브라우저 콘솔에서 에러 확인
3. 순서 변경 후 페이지 새로고침

### 드롭다운 설정이 반영 안 될 때
1. `database-update.sql` 실행 확인
2. categories 테이블에 `has_dropdown`, `default_open` 컬럼 있는지 확인
3. 프론트엔드 main.js가 업데이트되었는지 확인

---

## 📞 지원

문제가 있으면 콘솔(F12)의 에러 메시지를 확인하세요.

---

**즐거운 아카이브 관리 되세요! 🎉**

- SMALLSM Archive Team
