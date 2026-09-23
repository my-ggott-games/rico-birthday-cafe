# 크기 & 반응형 기준

> Source: Deep Interview, 2026-09-23

## Key Points
- 치코 높이(원근 스케일 1.0 기준): **모바일 5rem / PC 7rem**
- 판정 기준 분리:
  - **레이아웃(크기·배치):** 기존 로비 기준 `windowWidth < 768` 유지
  - **입력 방식(호버 vs 첫 탭 이름 표시):** `(pointer: coarse)` 로 분기 → 태블릿·터치 노트북도 탭 규칙 적용

## Open Questions
- 원근 스케일 하한 (예: 위쪽 0.8)
