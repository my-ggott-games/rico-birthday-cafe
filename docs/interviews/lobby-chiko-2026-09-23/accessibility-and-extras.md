# 부가 기능 & 접근성

> Source: Deep Interview, 2026-09-23

## Key Points
- **비밀 쪽지 버튼**: 쪽지 권한(관리자/이스터에그) + 토글 ON일 때 치코에 부착되어 함께 이동 (현 `LobbyHotspot` note 버튼 기능 이관)
- **퍼즐 박물관 언락 색상 힌트**: 치코 버전에서는 **제거** (선택 안 함)
- **키보드 접근성**: Tab으로 치코 포커스, Enter/Space로 진입, `aria-label`에 게임 이름. 포커스 시 이름 표시 + 배회 정지
- **모션 줄이기**
  - 로비에 **모션 줄이기 설정 버튼 추가** 필요
  - ON 시: **모든 치코 정면 + 이동 없음** (고정 배치)
  - `prefers-reduced-motion`에도 대응

## 모션 줄이기 상세 (Round 6)
- 버튼 위치: **놀이터(치코 영역) 모서리의 작은 아이콘 버튼** (lucide, 예: `Pause`/`Play` 또는 `Footprints`)
- 기본값: OS `prefers-reduced-motion`, 사용자 변경 시 localStorage 저장 (위치는 모서리 버튼으로 확정, 저장 방식은 추천안 기준)
- ON 시 고정 배치: **균등 간격 가로 한 줄** (모바일은 2x2)
- ON 시 드래그: **허용 안 함** (선택 안 됨)
- ON 시 숨쉬기 idle: 끄기 옵션을 선택하지 않음 → 유지로 가정

## Open Questions
- 숨쉬기 idle 유지가 맞는지 ("움직이지 않음" 요구와 충돌 가능)
- 모서리 버튼이 우하단이면 모바일 `who am I?` 고정 버튼(bottom-left)과 간섭 여부
