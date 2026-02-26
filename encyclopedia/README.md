# SMALLSM Encyclopedia

전문 성향 용어, 안전 철학, 관리 가이드라인을 제공하는 고가독성 백과사전 웹 어플리케이션입니다.

## 특징
- **전문 학술 아카이브 디자인**: Off-white와 Slate 색조의 고대비 테마.
- **반응형 2컬럼 레이아웃**: 데스크톱 인덱스 사이드바와 모바일 드로어 지원.
- **실시간 검색**: 문서 제목 및 내용 키워드 즉시 필터링.
- **안전 알림 시스템**: 하단 고정형 Active Safety System UI.

## 파일 구조
- `index.html`: 메인 진입점 (React/Tailwind CDN 사용)
- `app.js`: React 컴포넌트 로직
- `data.json`: 백과사전 문서 데이터
- `README.md`: 프로젝트 설명

## 실행 방법
이 프로젝트는 React 빌드 도구가 필요 없는 CDN 방식입니다. `index.html` 파일을 브라우저로 열면 즉시 실행됩니다.
단, `app.js`와 `data.json` 파일을 불러오기 위해 로컬 웹 서버(예: Live Server, python http.server 등) 환경에서 실행하는 것을 권장합니다.

## 기술 스택
- React (v18)
- Tailwind CSS
- Lucide Icons
- Babel (Standalone)
