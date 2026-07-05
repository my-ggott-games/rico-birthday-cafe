# GCP 무료 체험 만료 대응 기록 (2026-07-06)

## 개요

Google Cloud 무료 체험 만료 알림("7일 남았습니다")을 받은 뒤, 실시간으로
크레딧이 소진되는 것을 확인하고 당일 중 운영 데이터를 안전하게 백업하고
GCP 비용 발생 리소스를 전부 정리했다. 홈 서버(로컬 맥북) 전환은 이미
설계·구현이 끝나 있었으나(`feat/gcp-home-migration` 브랜치) 아직
merge·실행 전이었고, 이번 대응은 그 실행 전에 발생한 시간 압박 상황을
처리한 기록이다.

## 조치 전 상태

- GCP Compute Engine VM(`rico-birthday-cafe-backend`)에서 Spring Boot
  컨테이너(`rico-backend-prod`, `rico-backend-dev`)와 PostgreSQL 18
  컨테이너(`riko-postgres`, DB `riko_birthday_cafe_db`)가 실행 중이었다.
- 같은 결제 계정에 `My First Project`라는 별도 프로젝트도 연결되어 있었다.
- 지난달 청구액 약 ₩16,913, 이번 달 누적 약 ₩1,831 (모두 무료 체험
  크레딧으로 상쇄되어 실제 결제액은 0원).

## 1. 운영 데이터 안전 백업

1. GCP 콘솔 브라우저 SSH로 접속해 API 컨테이너를 정지시켜 쓰기를 차단했다.
2. `riko-postgres` 컨테이너에서 `pg_dump --format=custom`으로
   `prod`/`dev`/`public` 스키마 전체를 덤프했다
   (`riko-final-20260705-154124.dump`, 약 69KB, SHA-256 체크섬 동봉).
3. 브라우저 SSH의 파일 다운로드 기능으로 Mac에 받았다. 최초 시도는
   `/home/deploy` 디렉터리 권한 문제로 실패했고, `/tmp`로 복사한 뒤
   재시도해서 해결했다.
4. 로컬에서 SHA-256 체크섬을 대조해 전송 무결성을 확인했다
   (`backups/home/riko-final-20260705-154124.dump`, 저장소에는 커밋되지
   않음 — `.gitignore`의 `backups/` 규칙으로 제외).
5. 로컬에 disposable PostgreSQL 18 컨테이너를 띄워 이 덤프를 실제로
   복원해봤다. `prod.users` 302건 등 기존 마이그레이션 계획 문서에 기록된
   사전 커트오버 기준치와 정확히 일치함을 확인했다. 복원 후 컨테이너는
   삭제했고 덤프 파일만 보존했다.

## 2. GCP 비용 정리

결제 보고서(그룹화: 서비스, 절감액 옵션 끔)에서 확인한 비용 발생처:

| 서비스 | 비용 | 조치 |
|---|---|---|
| Cloud SQL | ₩12,870 | 인스턴스(`rico-birthady-cafe-db`) 중지 — 마이그레이션 설계 문서에 남아있던 legacy 리소스로 확인됨 |
| Compute Engine | ₩3,271 | VM 인스턴스(`rico-birthday-cafe-backend`) 중지 |
| VM Manager | ₩157 | VM 중지로 함께 정리됨 |
| Networking | ₩157 | VM 중지 및 고정 IP 해제로 함께 정리됨 |

추가로:

- Compute Engine 인스턴스가 완전히 정지된 뒤, 네트워크 인터페이스 수정에서
  외부 IPv4 주소를 고정 IP(`34.169.16.108`)에서 "없음"으로 변경해 분리하고,
  VPC 네트워크 > IP 주소에서 해당 고정 주소를 해제했다.
- DuckDNS의 `riko-birthday-cafe`, `dev-riko-birthday-cafe` 레코드는
  `clear=true` API 호출로 현재 IP 값만 비웠다. **도메인 이름 자체는
  삭제하지 않았다** — 이미 승인된 홈 서버 설계와 Netlify 환경변수가 이
  도메인 이름을 그대로 사용하도록 되어 있기 때문이다.

## 3. 결제 계정 폐쇄

- 위 정리 후 결제 보고서에 "리소스 0개 연결" 상태를 확인했다.
- GCP Marketplace 활성 구독이 없음을 확인했다.
- 결제(Billing) > 결제 계정 관리에서 계정을 완전히 폐쇄했다. 이 계정에
  연결된 `rico-birthday-cafe-backend`, `My First Project` 두 프로젝트
  모두 추가 과금이 차단된다.
- 폐쇄 전, 월별 인보이스 PDF와 서비스별 일별 비용 CSV(절감액 제외 기준)를
  로컬에 다운로드해 보관했다.

## 현재 상태

- GCP 쪽 백엔드/DB는 완전히 중지되었고 결제 계정도 폐쇄되어 재개하려면
  계정을 다시 열어야 한다.
- 홈 서버(로컬 맥북) 전환은 아직 실행되지 않았다 — 코드 구현은
  `feat/gcp-home-migration` 브랜치에 완료되어 있으나 `main`에 merge되지
  않았고, 실제 Docker Compose 스택도 아직 띄우지 않았다.
- 프론트엔드(Netlify)는 기존 게스트 모드로 계속 동작한다. 로그인,
  점수·업적 저장 등 백엔드 의존 기능만 일시 중단된 상태다.
- 운영 데이터는 체크섬 검증 및 로컬 복원 리허설까지 마친 백업
  (`backups/home/riko-final-20260705-154124.dump`)으로 안전하게 보존되어
  있다.

## 다음 단계

1. 백업 파일을 외장 디스크에도 복사해 이중 보관한다.
2. `feat/gcp-home-migration` 브랜치를 `main`에 merge한다.
3. `docs/HOME_SERVER_RUNBOOK.md` 절차대로 `.env.home`을 새 비밀값으로
   생성하고, 이 문서의 백업으로 홈 서버 PostgreSQL을 복원한 뒤 개발
   도메인부터 검증해 운영을 재개한다.

세부 절차는 `docs/BACKUP_MIGRATION_GUIDE.md`와
`docs/HOME_SERVER_RUNBOOK.md`(브랜치 `feat/gcp-home-migration`)를 참고한다.
