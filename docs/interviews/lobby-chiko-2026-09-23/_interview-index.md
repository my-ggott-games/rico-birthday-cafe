# Interview: 로비 UI 개편 — 움직이는 치코 게임 선택 버튼
**Date:** 2026-09-23
**Status:** Complete
**Depth:** medium

## 초기 요구사항 (사용자 원문 요약)
- 로비 중앙의 게임 선택 타일(`LobbyIconTile` x4)을 **움직이는 캐릭터(치코) 이미지 버튼**으로 교체
- 스프라이트 제작 완료 (단일 시트 1000x1950 PNG, 5방향) → 리포지토리에 **방향별 분리 이미지**로 저장 필요
  - 정면 / 옆면(우) / 뒷면 / 대각선 앞(우) / 대각선 뒤(우)
  - 왼쪽 방향은 오른쪽 이미지를 **좌우 반전(mirror)** 해서 사용
- 모바일 + PC 동시 고려
- 화면 상 치코의 **이동 범위** 정의 필요
- 우선 4개 미니게임(코디놀이, 2048 아스파라거스, 퍼즐, 점프게임)의 치코 리소스는 모두 동일

## 현재 코드 상태 (조사 결과)
- `frontend/src/pages/Lobby.tsx` — 헤더 버튼 / 슬로건 스테이지 / 게임 hotspot 그리드(모바일 2x2, PC flex-wrap)
- `frontend/src/features/lobby/LobbyHotspot.tsx` — `LobbyHotspot`(Link + 비밀쪽지 버튼), `LobbyIconTile`(lucide 아이콘 타일)
- 모바일 판정: `windowWidth < 768` (CLAUDE.md 규칙 `(pointer: coarse) || < 1024`과 불일치)
- 배경: `/pages/lobby/background.webp`, 장식: `/pages/lobby/decor/`

## Themes Discovered
- 이동 & 상호작용 → movement-and-interaction.md
- 스프라이트 에셋 → sprite-assets.md
- 게임 구분 → game-identification.md
- 이동 범위 → play-area.md
- 애니메이션 & 연출 → animation.md
- 크기 & 반응형 → sizing-and-responsive.md
- 부가 기능 & 접근성 → accessibility-and-extras.md

## Files Created
- `_interview-index.md`
- `movement-and-interaction.md`
- `sprite-assets.md`
- `game-identification.md`
- `play-area.md`
- `animation.md`
- `sizing-and-responsive.md`
- `accessibility-and-extras.md`
- `_summary.md` — 확정 사항 요약표
- `_open-questions.md` — 남은 결정 사항
