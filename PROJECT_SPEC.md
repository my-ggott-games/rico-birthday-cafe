버추얼 유튜버 **유즈하 리코(Yuzuha Rico)**의 온라인 생일 카페 프로젝트를 위한 최종 기술 명세서입니다. 이 내용을 `SPECIFICATION.md` 또는 `README.md`로 저장하여 프로젝트의 가이드라인으로 활용하시기 바랍니다.

---

# 🎂 Project: Rico's Online Birthday Cafe (Project Antigravity)

본 프로젝트는 팬들이 온라인상에서 유즈하 리코의 생일을 축하할 수 있는 '온라인 생일 카페' 플랫폼입니다. 단순 전시를 넘어 미니게임을 통해 상호작용하고, 나만의 굿즈 배치를 즐길 수 있는 환경을 제공합니다.

---

## 1. 프로젝트 개요 (Overview)
- **대상:** 버추얼 유튜버 유즈하 리코와 그녀의 팬덤.
- **컨셉:** 오프라인 생일 카페의 경험을 온라인으로 이식.
- **핵심 가치:** 몰입형 인터페이스, 치팅 방지 기반 미니게임, 데이터 기반의 개인화된 코디 보관.
- **보안 원칙:** 텍스트 입력(Varchar) 배제를 통한 인젝션 및 비하 발언 차단, 백엔드 중심의 게임 로직 검증.

---

## 2. 기술 스택 (Tech Stack)

### 2.1. Frontend
- **Framework:** React 18 (TypeScript)
- **State Management:** Zustand
- **Styling:** Tailwind CSS, Framer Motion (애니메이션 효과)
- **Library:** 
  - `dnd-kit` (드래그 앤 드롭 로직)
  - `html2canvas` (결과물 이미지 저장 기능)
  - `TanStack Query` (서버 상태 관리)

### 2.2. Backend
- **Framework:** Spring Boot 3.x (Java 17)
- **Database:** PostgreSQL (JSONB 타입을 활용한 레이아웃 저장)
- **Security:** Spring Security (CORS 및 API 보호)
- **Persistence:** Spring Data JPA

---

## 3. 사용자 경험 및 기능 (UX & Features)

### 3.1. 진입 흐름 (Entry Flow)
1.  **랜딩 페이지 (Entrance):** 카페 외경 이미지 노출. 중앙의 '문' 오브젝트를 클릭하면 문이 열리는 애니메이션과 함께 내부로 진입.
2.  **메인 로비 (Cafe Interior):** 카페 내부의 정적인 배경 이미지 위에 클릭 가능한 **Hotspot 오브젝트** 배치.
    - **옷장/마네킹:** TPO 코디 게임 진입.
    - **테이블 위 가방:** 이타백 꾸미기 게임 진입.
    - **벽면 포스터:** 숫자야구 게임 진입.

### 3.2. 미니게임 상세

#### [Game 1] 리코의 코디 게임 (Rico's Birthday Look)
- **특징:** 정해진 정답 없이 자유롭게 꾸미는 힐링 게임.
- **로직:**
  1. 유저가 원하는 대로 의상(상의, 하의, 신발 등)을 자유롭게 조합.
  2. 별도의 정답 검증 과정 없음.
  3. '완성하기' 버튼 클릭 시, "쨔쟌~ 완성되었어요!" 하는 축하 메시지와 함께 결과물 저장/공유 기능 제공.

#### [Game 2] 리코의 이타백(Itabag) 꾸미기
- **특징:** 자유로운 좌표 기반 굿즈 배치.
- **로직:**
  1. 직사각형 가방 캔버스 안에 굿즈(뱃지, 인형 등) 아이템을 드래그 앤 드롭.
  2. 아이템별 **X, Y 좌표 및 회전 값**을 실시간으로 추적.
  3. '저장' 시 해당 레이아웃 데이터(JSON)를 서버에 전송하여 저장.

#### [Game 3] 리코의 생일 퍼즐 (Jigsaw Puzzle)
- **특징:** 36피스 조각을 맞춰 하나의 일러스트를 완성하는 인터랙티브 퍼즐.
- **로직:**
  1. **조각 생성:** 생일 축하 일러스트를 6x6(36피스)로 분할. 단순 사각형이 아닌 퍼즐 특유의 요철(패턴)이 있는 형태로 컷팅.
  2. **무작위 섞기:** 조각들을 캔버스 위에 무작위 위치와 무작위 회전(0, 90, 180, 270도) 상태로 배치.
  3. **회전 기능:** 조각을 클릭할 때마다 오른쪽으로 90도씩 회전.
  4. **맞추기:** 드래그 앤 드롭을 통해 퍼즐판의 올바른 위치에 조각을 배치. 올바른 위치와 각도로 놓였을 때 "착!" 하고 고정되는 피드백 제공.
  5. **승리 조건:** 36개의 조각이 모두 제자리, 제 각도를 찾으면 완성 애니메이션 출력.

---

## 4. 시스템 아키텍처 및 보안 (Security)

### 4.1. 익명 세션 관리
- 유저 닉네임을 입력받지 않고, 첫 접속 시 서버에서 고유 **UUID**를 발급받아 `localStorage`에 저장하여 유저를 식별함.

### 4.2. 치팅 방지 (Anti-Cheat)
- **No Client-side Logic:** 코디 게임의 정답 정보는 프론트엔드 코드에 포함되지 않음.
- **Server-side Verification:** 모든 결과 판정은 서버의 `Cody_Solutions` 테이블을 참조하여 수행.
- **Input Whitelisting:** 모든 API는 사전에 정의된 ID(Long)와 좌표(Double) 값만 수신하며, 문자열 데이터는 서버에서 처리하지 않음.

---

## 5. 데이터베이스 스키마 (Database Schema)

### `Users`
| Column | Type | Description |
| :--- | :--- | :--- |
| user_uuid | UUID (PK) | 유저 고유 식별자 |
| created_at | Timestamp | 생성 일자 |

### `Cody_Solutions` (정답지)
| Column | Type | Description |
| :--- | :--- | :--- |
| tpo_id | BigInt (PK) | TPO 고유 ID |
| hint_text | Varchar | 리코의 대사 힌트 |
| required_items | Int[] | 정답 아이템 ID 리스트 |

### `Game_Sessions` (검증용)
| Column | Type | Description |
| :--- | :--- | :--- |
| session_id | BigInt (PK) | 세션 고유 ID |
| user_uuid | UUID (FK) | 유저 참조 |
| tpo_id | BigInt (FK) | 진행 중인 문제 ID |
| is_completed | Boolean | 완료 여부 |

### `Itabags` (이타백 저장)
| Column | Type | Description |
| :--- | :--- | :--- |
| id | BigInt (PK) | 저장 ID |
| user_uuid | UUID (FK) | 유저 참조 |
| layout_data | JSONB | 아이템 ID, X, Y, R 값을 포함한 배열 |

---

## 6. API 명세 요약 (API Endpoints)

- `POST /api/users/register`: 유저 UUID 발급
- `GET /api/game/cody/start`: 랜덤 힌트 발급 및 게임 세션 생성
- `POST /api/game/cody/verify`: 유저 조합 검증 (치팅 방지)
- `POST /api/game/itabag/save`: 이타백 레이아웃 저장
- `GET /api/game/itabag/{uuid}`: 유저의 기존 이타백 불러오기

---

## 7. 개발 로드맵 (Roadmap)

1.  **Step 1:** React 프로젝트 초기화 및 입구(Landing) <-> 내부(Interior) 화면 전환 구현.
2.  **Step 2:** Spring Boot 초기 설정 및 UUID 발급 API 구현.
3.  **Step 3:** 코디 게임용 의상 레이어(Character Overlay) 시스템 및 드래그 앤 드롭 구현.
4.  **Step 4:** 백엔드 정답 검증 로직 및 DB 연동.
5.  **Step 5:** 이타백 JSONB 저장 로직 구현.
6.  **Step 6:** 최종 에셋(리코 일러스트) 적용 및 폴리싱.

---

**Antigravity Note:** 텍스트 소통은 제한되지만, 유저들이 만든 '이타백'과 '코디' 결과물은 숫자로 기록되어 전체 통계(예: "지금까지 총 1,200개의 이타백이 만들어졌어요!")로 노출함으로써 공동체감을 형성할 수 있습니다.