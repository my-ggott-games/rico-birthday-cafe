# Project: Riko's Online Birthday Cafe

버추얼 유튜버 유즈하 리코(Yuzuha Riko)의 온라인 생일 카페 프로젝트.
팬이 랜딩 페이지에서 입장한 뒤 로비를 거쳐 미니게임을 즐기고, 업적을 수집하고, 프로필을 확인하는 인터랙티브 웹서비스다.

이 문서는 현재 저장소 구현을 기준으로 정리한 최신 스펙이다.

---

## 1. 기술 스택

### Frontend

- Framework: React 19 + TypeScript + Vite 6
- Routing: React Router DOM 7
- State Management: Zustand
- Styling/UI: Tailwind CSS 4, Framer Motion
- Core Libraries:
  - `@dnd-kit/*` - 퍼즐 드래그 앤 드롭
  - `canvas-confetti` - 퍼즐 완성 이펙트
  - `modern-screenshot`, `html2canvas` - 코디 게임 결과 캡처
  - `pixi.js` - 일부 인터랙션/렌더링 실험 자산
  - `lucide-react` - 전역 아이콘 시스템
  - `k-celebrate-slogan` - 로비 슬로건 연출
- Analytics: 커스텀 `pushEvent` 기반 페이지/행동 이벤트 추적

### Backend

- Framework: Spring Boot 4.0.2 (Java 17)
- Persistence: Spring Data JPA
- Database: PostgreSQL
- Security: Spring Security + JWT
- Validation: Jakarta Validation
- Monitoring: Spring Boot Actuator (`/actuator/health`)
- Deployment: Docker 기반 배포 구성

---

## 2. 공통 구조

### 공통 레이아웃 / UI 컴포넌트

- `GameContainer`
  - 게임 페이지 공통 프레임
  - 타이틀, 설명, 튜토리얼, 로비 복귀 버튼, 도움말 슬롯을 통합 제공
- `CommonTitle`
  - 게임 제목/서브카피 렌더링
- `GameHelp`
  - 반응형 게임 도움말
  - 모바일은 모달 중심, 데스크탑은 인라인/패널 방식 지원
- `TutorialBanner`
  - 슬라이드형 튜토리얼 배너
- `ReturnButton`
  - 로비 복귀 버튼
- `AchievementModal`
  - 프로필/업적 확인 모달
  - 달성 업적, 미달성 업적, 대표 업적(active achievement) 설정 기능 포함
- `AchievementToast`
  - 업적 획득 토스트
- `GlobalLoading`
  - 전역 로딩 UI
- `GlobalAudioToggle`
  - 전역 음소거 토글

### 아이콘 규칙

- UI와 게임 비주얼 아이콘은 기본적으로 `lucide-react` 기반으로 통일한다.
- 업적 아이콘은 문자열 코드 기반으로 저장되고, 프론트에서 매핑하여 렌더링한다.
- 이모지 의존형 렌더링 대신 앱 아이콘 레지스트리 기반 표현을 우선한다.

### 전역 인터랙션

- `CursorManager`에서 클릭 파티클 연출 제공
- 페이지 BGM은 `usePageBgm`과 전역 오디오 스토어를 통해 관리

---

## 3. 페이지 및 기능 상세

### 3.1 랜딩 페이지 (`/`)

- 카페 외경 이미지를 활용한 입장 페이지
- 문 영역 클릭 시 입장 애니메이션 실행
- 비인증 상태에서는 먼저 `AuthModal`을 통해 진입 방식 선택
- 인증 또는 게스트 진입 이후 로비로 이동

### 3.2 인증 플로우

- 기본 진입점은 랜딩의 `AuthModal`
- 지원 시나리오:
  - UID + 4자리 PIN 로그인
  - UID 발급 후 PIN 등록 (`/api/auth/issue-uid` -> `/api/auth/register`)
  - 네트워크 오류 등 특정 조건에서 게스트 모드 진입
  - 관리자 패스코드 로그인 (`/api/auth/admin`)
- 인증 상태는 `useAuthStore`에서 관리
- 게스트도 앱 진입 자체는 가능하지만, 인증이 필요한 API 호출은 `fetchWithAuth`에서 차단

### 3.3 메인 로비 (`/lobby`)

- 카페 배경 위에 게임 진입 핫스팟 제공
- 주요 진입 대상:
  - 리코의 외출 준비 (`/game/cody`)
  - 퍼즐 맞추기 (`/game/puzzle`)
  - 아스파라거스 키우기 (`/game/asparagus`)
  - 용사 리코 이야기 1 (`/game/adventure`)
- 우측 상단 액션:
  - 크레딧 페이지 이동
  - 프로필/업적 모달
  - 관리자 모달
- 숨은 요소:
  - 이스터에그 노트
  - 슬로건 인터랙션
  - 특정 업적 해금 연출

### 3.4 리코의 외출 준비 (`/game/cody`)

- 드레스업 게임
- PC는 드래그 앤 드롭, 모바일은 탭 중심 장착
- 카테고리별 아이템 조합 가능
- 특정 세트 조합 감지 시 전용 배경/연출 반영
- 완성 후 폴라로이드 스타일 결과물 생성
- 캡처/저장 흐름 지원
- 업적 연동 포함

### 3.5 퍼즐 맞추기 (`/game/puzzle`)

- 현재 구현은 고정 4x4가 아니라 가변 그리드 퍼즐 구조를 사용
- 기본값은 10 분할 기준으로 시작하며, 보드 설정은 `features/puzzle/constants.ts`에서 관리
- 조각 회전, 드래그 배치, 자동 위치 고정 지원
- 진행 상태를 `localStorage`에 저장해 이어하기 가능
- 게스트 모드에서도 로컬 진행 저장 가능
- 완성 시:
  - 폭죽 이펙트
  - 업적 지급 (`FIRST_PUZZLE`)
  - 포토카드/뮤지엄 연출 해금
- 모바일 센서 기반 포토카드 홀로그램/기울기 연출 일부 포함

### 3.6 아스파라거스 키우기 (`/game/asparagus`)

- 4x4 보드 기반 2048 변형 게임
- 입력 방식:
  - 키보드 방향키
  - 모바일 스와이프
  - 화면 버튼
- 점수 및 개인 최고점 표시
- 아이템 기능:
  - 되돌리기
  - 타일 바꾸기
- 최고 점수는 인증 사용자 기준 백엔드 동기화
- 2048 달성 시 업적 지급 로직 연동
- `GameContainer` + 도움말 슬라이드 기반 공통 UI 사용

### 3.7 용사 리코 이야기 1 (`/game/adventure`)

- 경량 러너/회피형 액션 게임
- 준비 -> 진행 중 -> 일시정지 -> 게임오버 상태 머신 기반
- 점수에 따라 속도 단계가 상승
- 최고 점수 표시 및 진행 게이지 제공
- 개인 최고 점수는 인증 사용자 기준 백엔드 동기화
- 1000점 이상 달성 시 업적 `R-GEND-HERO` 획득 가능

### 3.8 크레딧 (`/credits`)

- 롤링 크레딧 페이지
- 수동 시작/스크롤 보조 UX 포함
- 크레딧 끝까지 본 뒤 업적 지급 버튼 활성화
- 업적 코드: `THANK_YOU_ALL`

### 3.9 관리자/샘플 페이지

- 관리자 전용 라우트는 `AdminOnlyRoute`로 보호
- 샘플/실험용 페이지:
  - `/sample/landing-compare`
  - `/sample/cody`
  - `/sample/adventure`
  - `/sample/puzzle`
  - `/sample/hologram`
  - `/sample/asparagus`
- 비관리자는 접근 시 `NotFound` 처리

---

## 4. 데이터 모델

### `users`

| Column | Type | Description |
| :--- | :--- | :--- |
| `user_uuid` | UUID (PK) | 유저 고유 식별자 |
| `username` | VARCHAR(50), UNIQUE | UID 또는 관리자 식별자 |
| `password_hash` | VARCHAR | PIN/비밀번호 해시 |
| `role` | VARCHAR | `USER`, `ADMIN` 등 권한 |
| `active_achievement_code` | VARCHAR(50) | 대표 업적 코드 |
| `created_at` | TIMESTAMP | 생성 시각 |

### `achievements`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 업적 ID |
| `code` | VARCHAR(50), UNIQUE | 업적 코드 |
| `title` | VARCHAR(100) | 업적명 |
| `description` | VARCHAR | 설명 |
| `icon_url` | VARCHAR | 아이콘 키 또는 리소스 식별값 |

### `user_achievements`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 레코드 ID |
| `user_uuid` | UUID (FK -> users) | 유저 참조 |
| `achievement_id` | BIGINT (FK -> achievements) | 업적 참조 |
| `unlocked_at` | TIMESTAMP | 달성 시각 |

### `asparagus_scores`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 레코드 ID |
| `uid` | VARCHAR(50), UNIQUE | 사용자 UID |
| `best_score` | INT | 최고 점수 |

### `adventure_scores`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 레코드 ID |
| `uid` | VARCHAR(50), UNIQUE | 사용자 UID |
| `best_score` | INT | 최고 점수 |

### 현재 시드 업적

- `LEGEND_GARDENER`
- `THANK_YOU_ALL`
- `FIRST_PUZZLE`
- `R-GEND-HERO`
- `RICO_DEBUT_DATE`
- `WHO_ARE_YOU`
- `LOST_IN_THE_WAY`
- `LEGEND_COORDINATOR`
- `SLOGAN_COLLECTOR`

---

## 5. API 명세

### Auth

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | UID + PIN 로그인 |
| `POST` | `/api/auth/register` | Public | 발급된 UID로 PIN 등록 |
| `POST` | `/api/auth/issue-uid` | Public | 신규 UID 발급 |
| `POST` | `/api/auth/admin` | Public | 관리자 패스코드 로그인 |

### Achievements

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/achievements/mine` | JWT | 현재 사용자가 획득한 업적만 조회 |
| `GET` | `/api/achievements/all` | JWT | 전체 업적 + earned/active 상태 조회 |
| `POST` | `/api/achievements/award/{code}` | JWT | 업적 지급 |
| `POST` | `/api/achievements/active/{code}` | JWT | 대표 업적 설정 |

### Asparagus Score

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/asparagus/score` | JWT | 개인 최고 점수 조회 |
| `POST` | `/api/asparagus/score` | JWT | 개인 최고 점수 갱신 |

### Adventure Score

| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/adventure/score` | JWT | 개인 최고 점수 조회 |
| `POST` | `/api/adventure/score` | JWT | 개인 최고 점수 갱신 |

---

## 6. 보안 및 접근 정책

- Spring Security는 `/api/auth/**`, `/actuator/health`, `/error`를 제외한 나머지 요청에 인증을 요구한다.
- 프론트 라우트 레벨에서는 현재 `/lobby`, `/game/*`, `/credits`가 `ProtectedRoute` 아래에 있어 인증 또는 게스트 진입 이후 접근 가능하다.
- `fetchWithAuth`는 게스트 모드에서 인증이 필요한 API 요청을 403 형태로 차단한다.
- 관리자 전용 샘플 페이지는 `AdminOnlyRoute`로 별도 보호한다.
- CORS는 설정값 기반 허용 출처만 허용한다.
- `RateLimiterService`가 존재하며 인증/보안 관련 남용 방지 용도로 사용된다.

---

## 7. 현재 구현 상태

| 기능 | 상태 |
| :--- | :--- |
| 랜딩 페이지 및 입장 애니메이션 | 완료 |
| UID 발급 / PIN 등록 / 로그인 | 완료 |
| 게스트 모드 진입 | 완료 |
| 메인 로비 | 완료 |
| 프로필/업적 모달 | 완료 |
| 리코의 외출 준비 게임 | 완료 |
| 퍼즐 게임 | 완료 |
| 아스파라거스 게임 | 완료 |
| 용사 리코 이야기 1 | 완료 |
| 크레딧 페이지 | 완료 |
| 관리자 인증 / 샘플 라우트 | 완료 |

---

## 8. 고도화

### 8.1 로그인 UX 개선

- 현재 로그인 UX가 직관적이지 않음
- 진입 시점의 선택지, 문구, 단계 구성을 더 쉽게 이해되도록 개선 필요

### 8.2 아스파라거스 게임 우측 버튼 크기 확대

- 우측 액션 버튼의 클릭/터치 영역을 더 크게 조정
- 모바일과 PC 모두에서 조작 실수를 줄이는 방향으로 개선

### 8.3 아스파라거스 게임 타일 생성 알고리즘 검토

- 현재도 난이도가 높게 느껴짐
- 타일 생성 규칙과 난이도 곡선을 다시 점검하고 밸런스를 조정

### 8.4 게임 첫 진입 시 가이드 화면 노출

- 게임 페이지 첫 진입 시 즉시 플레이보다 가이드 화면이 먼저 노출되도록 개선
- 조작법과 목표를 빠르게 파악할 수 있게 설계

### 8.5 PC 로비 우측 상단 버튼 가시성 개선

- `크레딧`, `프로필`, `관리자` 버튼이 너무 구석에 있어 눈에 잘 띄지 않음
- 위치, 크기, 대비를 조정해 시인성을 높일 필요가 있음

### 8.6 로비 게임 버튼 컴포넌트화

- 로비 게임 버튼을 공통 컴포넌트로 정리
- 배경 컬러 input을 기준으로 내부 아이콘 색상과 외곽 border 색상을 계산
- 현재처럼 살짝 더 어둡고 진한 톤을 유지하는 규칙을 명문화

### 8.7 비로그인 가드 로직 개선

- 현재 로그인 절차가 유입을 차단하는 요소로 작동하고 있음
- 비로그인 상태에서도 게임과 주요 탐색이 가능하도록 개선 필요
- 로그인은 프로필 페이지에서 가능하도록 유도
- 사용자가 필요성을 느낄 때 자발적으로 로그인하게 만드는 구조로 전환

### 8.8 모바일 퍼즐게임 자이로 센서 기능 재추가

- 모바일 퍼즐게임의 자이로 센서 기능을 다시 추가
- 센서 권한 요청과 비지원 환경 대응까지 함께 정리 필요
