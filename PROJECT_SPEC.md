# 🎂 Project: Rico's Online Birthday Cafe

버추얼 유튜버 **유즈하 리코(Yuzuha Rico)**의 온라인 생일 카페 프로젝트.
팬들이 온라인에서 미니게임을 즐기고 업적을 달성하며 생일을 함께 축하하는 인터랙티브 플랫폼.

---

## 1. 기술 스택 (Tech Stack)

### Frontend
- **Framework:** React 18 (TypeScript) + Vite
- **Routing:** React Router v6
- **State Management:** Zustand (`useAuthStore`)
- **Styling:** Tailwind CSS, Framer Motion
- **Libraries:** `dnd-kit` (드래그 앤 드롭), `modern-screenshot` (이미지 캡처), `canvas-confetti`, `k-celebrate-slogan`

### Backend
- **Framework:** Spring Boot 3.x (Java 17)
- **Database:** PostgreSQL
- **Security:** Spring Security + JWT (`JwtTokenProvider`, `JwtAuthenticationFilter`)
- **Persistence:** Spring Data JPA
- **Deploy:** Render (Docker Runtime) — Optimized multi-stage build, Port 8080, Actuator Health Checks.
- **Monitoring:** Spring Boot Actuator (`/actuator/health`)

---

## 2. 공통 컴포넌트 (Common Components)

| Component | 위치 | 설명 |
| :--- | :--- | :--- |
| `CommonTitle` | `components/common/CommonTitle.tsx` | 모든 게임 페이지의 공통 타이틀 블록 (`title`, `subtitle`, `helpSlot`) |
| `GameHelp` | `components/common/GameHelp.tsx` | 반응형 튜토리얼 — 모바일: `?` 토글 모달 / 데스크탑: 인라인 정적 배너. `mobileOnly` / `desktopOnly` prop 지원 |
| `TutorialBanner` | `components/common/TutorialBanner.tsx` | 슬라이드형 튜토리얼 배너 (슬라이딩 애니메이션) |
| `AchievementModal` | `components/common/AchievementModal.tsx` | 프로필 모달 — 업적 달성(전체 색상) / 미달성(`???` 마스킹) 표시 |
| `AchievementToast` | `components/common/AchievementToast.tsx` | 업적 획득 시 팝업 알림 |
| `ReturnButton` | `components/common/ReturnButton.tsx` | 로비 복귀 버튼 |
| `GameContainer` | `components/common/GameContainer.tsx` | 모든 게임 페이지 공통 레이아웃: 타이틀, 튜토리얼, 로비 복귀 버튼, 모바일/데스크탑 도움말 슬롯과 섹션별 `mainClassName`/`showDesktopHelp` 제어 |
| `GlobalLoading` | `components/common/GlobalLoading.tsx` | 전역 로딩 인디케이터 |

---

## 3. 페이지 및 게임 상세

### 3.1. 랜딩 페이지 (`/`)
- 카페 외경 컨셉의 입장 화면
- '문' 오브젝트 클릭 → 로비로 진입 애니메이션

### 3.2. 메인 로비 (`/lobby`)
- 카페 인테리어 배경 위 4개의 Hotspot 오브젝트
- 상단 우측: **프로필** 버튼(업적 모달), **who am I?** 버튼(관리자 로그인)

### 3.3. [Game 1] 리코 옷입히기 — Cody Game (`/game/cody`)
- **PC:** 드래그 앤 드롭으로 의상 장착
- **Mobile:** 탭으로 장착
- 의상 카테고리: `hair_front`, `hair_back`, `clothes`, `clothes_back`, `hair_acc`, `clothes_acc`, `hand_acc`, `shoes`, `accessories`
- 세트 조합 감지 → 전용 배경(봄 축제, 동양풍, 비, 맥주, 기사) 자동 적용
- 완성 후 Polaroid 프레임으로 결과물 표시 + JPG 저장 / SNS 공유
- `GameHelp` 공통 컴포넌트로 튜토리얼 제공 (모바일: 모달, 데스크탑: 인라인 준비)
- `GameContainer` 기반 레이아웃으로 타이틀, 리코로드 버튼, 데스크탑 도움말/모바일 튜토리얼을 일관되게 렌더링
- `hair_front` 아이템을 장착하면 자동으로 `hair_back` 레이어를 함께 세트화, 머리 뒷단 레이어는 `layoutId`/motion 애니메이션으로 분리 구현
- 세트 조합 검사는 `hair_front`만 대상으로 간소화되어 뒷머리 레이어가 선택 순서에 영향을 주지 않음

### 3.4. [Game 2] 이타백 꾸미기 (`/game/itabag`)
- Canvas UI: 화면 중앙에 4:3 비율의 직사각형 배치.
- Style: 약 12px~20px의 border-radius가 적용된 둥근 모서리.
- Pattern: 사각형 내부에는 실제 이타백의 질감을 표현하는 와이어 메시(Wire + Mesh) 패턴의 배경 레이어 포함.
- 장식 오브젝트: 유저가 획득한 업적 아이콘들이 실제 '뱃지' 아이템으로 리스트업됨. 드래그 앤 드롭을 통해 메시 망 위에 자유롭게 배치 가능.
뱃지 외에 추가적인 리본, 장식 스티커 선택 가능.
- `GameContainer` 공통 헤더에 `ITABAG_TUTORIAL_SLIDES`를 넣어 모바일/데스크탑 도움말을 일원화

### 3.5. [Game 3] 퍼즐놀이 (`/game/puzzle`)
- 4×4(16피스) 이미지 퍼즐
- 조각 클릭: 90° 회전 (800ms 디바운스, 이동 감지로 오작동 방지)
- 드래그로 정확한 칸에 배치 시 자동 고정
- 완성 시 `canvas-confetti` 폭죽 효과 + 팝업
- `GameHelp` 공통 컴포넌트로 튜토리얼 제공
- `GameContainer`을 활용해 타이틀/튜토리얼/로비 복귀 버튼을 고정하고, 트레이드오프 없이 데스크탑 도움말을 유지

### 3.6. [Game 4] 아스파라거스 키우기 — 2048 (`/game/asparagus`)
- 4×4 그리드, 타일 병합 게임 (목표 값: 2048)
- 조작: 키보드 방향키 / 화살표 버튼 / 모바일 스와이프
- 아이템(비료): **되돌리기** 3회, **타일 바꾸기** 3회
- 타일 테마: 씨앗 → 새싹 → ... → 성검(2048)
- 고득점 백엔드 동기화 (`/api/asparagus/score`)
- 2048 달성 시 업적 `ASPARAGUS_EXCALIBUR` 자동 부여
- **모바일 수정:** 보드 최대 너비 `min(500px, 100vw - 3rem)`, 타일 gap `clamp()` 적용
- `GameHelp` 공통 컴포넌트로 튜토리얼 제공 (모바일: 모달 토글, 데스크탑: 왼쪽 사이드 패널)
- `GameContainer`을 통해 타이틀/튜토리얼/리턴 버튼/데스크탑 도움말을 공유하며, 헤더 우측에 점수/베스트 블록을 고정
- 보드 컨테이너는 `clamp()` 기반 `padding`, `borderRadius`, `gap`으로 모바일에서 폭 500px를 넘기지 않고 자연스럽게 축소되는 반응형 설정

### 3.7. [Special] Who made this?! (/credits)
- 기능: 제작진 목록 송출 및 엔딩 감상 업적 부여.
- 연출: PC/모바일 공통 자동 상향 스크롤(Rolling Credits).
- 업적 부여: 스크롤 끝부분에 노출되는 [감사합니다!] 버튼(업적 아이콘 형태) 클릭 시 /api/achievements/earn 호출.
- 추가된 업적 리스트:
| 코드 | 이름 | 설명 | 비고 |
| :--- | :--- | :--- | :--- |
| THANK_YOU_ALL | 감사합니다! | 엔딩크레딧을 끝까지 봤다. | /credits 페이지 버튼 클릭 |
| (기존 업적들) | ... | ... | 이타백 게임에서 뱃지로 사용 가능 |

### 3.8. [Game 5] 오늘의 리코 운세 (Rico's Fortune/Omikuji)
- 컨셉: 일본의 '오미쿠지'처럼 통을 흔들어 오늘의 운세 뽑기.
- 랜덤 요소:
    - 대길(Great Luck) ~ 대흉(Bad Luck) 까지의 운세가 무작위로 나옵니다.
    - 각 결과마다 리코의 짧은 응원 메시지(텍스트)가 함께 출력됩니다.
- 리소스 최소화:
    - 흔들리는 운세 통 애니메이션(CSS/Framer Motion) + 결과 텍스트만 필요.
    - 운세 등급에 따라 배경색만 변경 (대길: 금색, 길: 분홍색 등).
- 모바일/PC 대응:
    - PC: 클릭 / 모바일: 기기 흔들기(DeviceMotion API) 또는 터치.
- 업적 연동:
    - LUCKY_RICO_MOMENT: '대길'을 뽑았을 때 부여.
- `GameContainer` + `FORTUNE_TUTORIAL_SLIDES`로 타이틀, 튜토리얼, 도움말을 통합하고, `GameHelp`의 데스크탑판을 자동으로 허용

---

## 4. 데이터베이스 스키마 (Database Schema)

### `users`
| Column | Type | Description |
| :--- | :--- | :--- |
| `user_uuid` | UUID (PK) | 유저 고유 식별자 (`@GeneratedValue(UUID)`) |
| `username` | VARCHAR(50) UNIQUE | 관리자용 로그인 ID |
| `password_hash` | VARCHAR | BCrypt 해시 |
| `role` | VARCHAR | 권한 (`ADMIN`, `USER` 등) |
| `created_at` | Timestamp | 생성 일자 |

### `achievements`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 업적 ID |
| `code` | VARCHAR(50) UNIQUE | 업적 코드 (e.g. `ASPARAGUS_EXCALIBUR`) |
| `title` | VARCHAR(100) | 업적 이름 |
| `description` | VARCHAR | 업적 설명 |
| `icon_url` | VARCHAR | 이모지 또는 URL |

> achievements 테이블의 icon_url은 단순히 시각적 요소가 아니라, 이타백 게임 내에서 사용 가능한 고해상도 뱃지 이미지 에셋으로 활용됨.


### `user_achievements` _(Many-to-Many 조인 테이블)_
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 레코드 ID |
| `user_uuid` | UUID (FK → users) | 유저 참조 |
| `achievement_id` | BIGINT (FK → achievements) | 업적 참조 |
| `unlocked_at` | Timestamp | 달성 일자 (`@CreationTimestamp`) |

> **관계:** `User` ↔ `Achievement` = Many-to-Many, `UserAchievement` 조인 엔티티를 통해 구현.
> `User.achievements` = `@OneToMany(mappedBy="user")`

### `asparagus_scores`
| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | BIGINT (PK) | 레코드 ID |
| `user_uuid` | UUID (FK) | 유저 참조 |
| `score` | INT | 최고 점수 |
| `recorded_at` | Timestamp | 기록 일자 |

---

## 5. API 명세 (API Endpoints)

### Auth
| Method | Path | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | JWT 토큰 발급 (관리자 로그인) |

### Achievements
| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/achievements/mine` | JWT | 현재 유저의 달성 업적 목록 |
| `GET` | `/api/achievements/all` | JWT | **전체 업적 + 달성 여부(`earned`)** 반환 |

### Asparagus Score
| Method | Path | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/asparagus/score` | JWT | 최고 점수 등록/갱신 |
| `GET` | `/api/asparagus/score/best` | JWT | 현재 유저 최고 점수 조회 |

---

## 6. 보안 (Security)

- **JWT 인증:** 모든 `/api/**` 엔드포인트는 Bearer 토큰 필수 (Spring Security Filter Chain)
- **CORS:** 프론트엔드 도메인만 허용
- **Rate Limiting:** `RateLimiterService`로 남용 방지
- **텍스트 입력 배제:** 모든 사용자 인터랙션은 클릭/드래그 기반, 자유 텍스트 없음

---

## 7. 현재 구현 상태 (Implementation Status)

| 기능 | 상태 |
| :--- | :--- |
| 랜딩 페이지 | ✅ 완료 |
| 메인 로비 (Hotspot) | ✅ 완료 |
| Cody 옷입히기 게임 | ✅ 완료 |
| 이타백 게임 | ✅ 완료 (UI 기초 및 드래그 패턴 연동) |
| 퍼즐 게임 | ✅ 완료 |
| 아스파라거스 2048 | ✅ 완료 |
| JWT 인증 / 관리자 로그인 | ✅ 완료 |
| 업적 시스템 (DB + 부여 로직) | ✅ 완료 |
| 업적 프로필 UI (달성/미달성 분리) | ✅ 완료 |
| 아스파라거스 고득점 백엔드 동기화 | ✅ 완료 |
| `CommonTitle` 공통 컴포넌트 | ✅ 완료 |
| `GameHelp` 반응형 튜토리얼 컴포넌트 | ✅ 완료 |
| 모바일 2048 보드 오버플로 수정 | ✅ 완료 |
| 엔딩 크레딧 페이지 | ✅ 완료 |
| 오늘의 리코 운세 (Omikuji) | ✅ 완료 |
