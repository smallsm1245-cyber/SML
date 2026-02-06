# 🎬 SMALLSM Archive - Cinematic Archive System

시네마틱 감성의 개인 아카이브 시스템입니다.

## 📋 프로젝트 개요

- **제작자**: SMALLSM (SLM)
- **기술 스택**: HTML, CSS, JavaScript, Supabase
- **라이선스**: 출처 표기 의무 / 무단 수정 금지 / 비영리 목적

## 🚀 설치 방법

### 1단계: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com) 접속 및 회원가입
2. 새 프로젝트 생성
3. Database 비밀번호 설정

### 2단계: 데이터베이스 설정

1. Supabase Dashboard > SQL Editor 접속
2. `database-setup.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기 후 실행
4. **중요**: SQL 파일 내의 `your-admin-email@example.com`을 본인 이메일로 교체

### 3단계: Storage 버킷 생성

1. Supabase Dashboard > Storage 접속
2. 새 버킷 생성:
   - Bucket name: `archive-images`
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: `image/jpeg, image/png, image/gif, image/webp`

3. Policies 설정:
   ```sql
   -- Public can read images
   SELECT: (bucket_id = 'archive-images')
   
   -- Admin can upload images
   INSERT: (bucket_id = 'archive-images' AND auth.jwt() ->> 'email' = 'your-admin-email@example.com')
   
   -- Admin can delete images
   DELETE: (bucket_id = 'archive-images' AND auth.jwt() ->> 'email' = 'your-admin-email@example.com')
   ```

### 4단계: API 키 설정

1. Supabase Dashboard > Settings > API 접속
2. Project URL과 anon (public) key 복사
3. `js/config.js` 파일 생성 (config.example.js 참고):

```javascript
const SUPABASE_CONFIG = {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here'
};

const ADMIN_EMAIL = 'your-admin-email@example.com';
```

4. **중요**: `js/config.js`가 `.gitignore`에 등록되어 있는지 확인

### 5단계: 관리자 계정 생성

1. Supabase Dashboard > Authentication > Users 접속
2. "Add user" 클릭
3. 이메일/비밀번호로 사용자 생성 (config.js의 ADMIN_EMAIL과 동일하게)

### 6단계: GitHub 업로드

```bash
git init
git add .
git commit -m "Initial commit - SMALLSM Archive"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

**주의**: `js/config.js` 파일은 절대 업로드되지 않습니다 (.gitignore 적용됨)

### 7단계: GitHub Pages 배포 (선택)

1. GitHub 저장소 > Settings > Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save

## 📂 파일 구조

```
smallsm-archive/
├── index.html              # 메인 페이지
├── admin.html              # 관리자 패널
├── post.html               # 개별 게시물 페이지
├── 404.html                # 에러 페이지
├── css/
│   └── style.css           # 시네마틱 스타일시트
├── js/
│   ├── main.js             # 메인 로직
│   ├── admin.js            # 관리자 로직
│   ├── post.js             # 게시물 로직
│   ├── config.example.js   # 설정 예제 (공개)
│   └── config.js           # 실제 설정 (비공개, .gitignore)
├── database-setup.sql      # DB 초기화 스크립트
├── .gitignore              # Git 제외 파일 목록
└── README.md               # 이 파일
```

## 🎨 주요 기능

### 방문자 기능
- ✅ 성인 인증 시스템 (24시간 유효)
- ✅ 카테고리별 게시물 탐색
- ✅ 제목 기반 실시간 검색
- ✅ Night Library 모드 전환
- ✅ 복사 시 자동 출처 표기

### 관리자 기능
- ✅ 스플릿 뷰 에디터 (실시간 미리보기)
- ✅ 이미지 업로드 (Supabase Storage)
- ✅ 비밀글 설정
- ✅ 복사 보호 비활성화 옵션
- ✅ 카테고리 공개/비공개 전환
- ✅ 자동 임시 저장 (브라우저 종료 시 복구)

### 보안 기능
- ✅ Row Level Security (RLS)
- ✅ 관리자 화이트리스트 인증
- ✅ 비밀글 404 위장
- ✅ API 키 격리 (.gitignore)

## 🛠️ 사용 방법

### 관리자 로그인

1. `admin.html` 페이지 접속
2. Supabase에 등록한 이메일/비밀번호 입력
3. 화이트리스트 검증 통과 후 접근

### 게시물 작성

1. 관리자 패널 접속
2. 제목, 카테고리, 내용 입력
3. 필요시 비밀글/복사보호 해제 체크
4. 실시간 미리보기 확인
5. "게시물 저장" 클릭

### 이미지 삽입

1. 에디터 툴바의 "🖼️ 이미지" 버튼 클릭
2. 이미지 파일 선택 (업로드 자동 진행)
3. 자동으로 마크다운 문법 삽입됨

### 카테고리 관리

1. 관리자 패널 하단의 "카테고리 관리" 섹션
2. 공개/비공개 토글로 카테고리 가시성 제어
3. 비공개 처리 시 일반 방문자의 사이드바에서 즉시 사라짐

## 🔒 보안 체크리스트

- [ ] `js/config.js` 파일이 `.gitignore`에 등록되어 있는가?
- [ ] `database-setup.sql`의 관리자 이메일을 변경했는가?
- [ ] Supabase RLS 정책이 활성화되어 있는가?
- [ ] Storage 버킷 정책이 올바르게 설정되어 있는가?
- [ ] 관리자 이메일이 config.js와 RLS 정책에 동일하게 입력되어 있는가?

## 🐛 문제 해결

### 게시물이 로딩되지 않을 때
1. 브라우저 콘솔(F12) 확인
2. Supabase Dashboard > Database > RLS 정책 확인
3. `config.js` 파일의 URL과 키 확인

### 이미지 업로드 실패 시
1. Storage 버킷 `archive-images` 생성 확인
2. 버킷 정책에서 관리자 이메일 확인
3. 파일 크기 5MB 이하인지 확인

### 관리자 패널 접근 거부 시
1. Supabase Authentication에 사용자 등록 확인
2. `config.js`의 `ADMIN_EMAIL` 확인
3. `database-setup.sql`의 RLS 정책 이메일 확인

## 📝 커스터마이징

### 색상 변경
`css/style.css` 파일 상단의 `:root` 변수 수정:

```css
:root {
    --primary-brass: #CEB180;  /* 메인 황동색 */
    --bg-deep: #0F0F0E;        /* 배경색 */
    --accent-amber: #D4A574;   /* 강조색 */
}
```

### 폰트 변경
`css/style.css` 파일의 폰트 import 및 변수 수정:

```css
:root {
    --font-serif: 'Source Han Serif', serif;
    --font-display: 'Cinzel', serif;
    --font-mono: 'Courier Prime', monospace;
}
```

## 📄 라이선스

본 프로젝트는 다음 조건 하에 사용할 수 있습니다:

1. **출처 표기 의무**: 외부 공유 시 "SMALLSM" 닉네임 또는 사이트 링크 포함
2. **무단 수정 금지**: 원본의 변형 및 왜곡 재배포 금지
3. **비영리 목적**: 상업적 이용 엄격 금지

---

© 2026 - PRESENT SMALLSM. All Rights Reserved.
