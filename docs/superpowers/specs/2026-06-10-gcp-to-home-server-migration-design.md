# GCP to Home Server Migration Design

## 문서 목적

이 문서는 현재 `rico-birthday-cafe`로 잘못 표기된 프로젝트의 Spring Boot
백엔드와 PostgreSQL을 GCP Compute Engine에서 개인 MacBook으로 이전하고,
프로젝트 표기를 `riko-birthday-cafe`로 바로잡기 위한 설계 및 인수인계
문서다.

새 Codex 세션에서는 이 문서를 먼저 읽고 구현 계획부터 작성한다. 아직 실제
운영 마이그레이션이나 GCP 리소스 삭제는 시작하지 않았다.

## 승인 상태

- 홈 서버 아키텍처: 2026년 6월 10일 사용자 승인
- 상세 운영 설계: 2026년 6월 11일 사용자 승인
- 구현 계획: 상세 설계 승인 후 작성
- 운영 마이그레이션 및 GCP 삭제: 미실행

## 목표

- GCP 과금을 0원 또는 가능한 한 0원에 가깝게 줄인다.
- 프로젝트의 잘못된 `rico` 표기를 올바른 `riko`로 정규화한다.
- Netlify 프론트엔드는 현재 무료 플랜과 설정을 그대로 유지한다.
- 백엔드와 PostgreSQL을 필요할 때만 켤 수 있는 홈 서버로 이전한다.
- 백엔드가 꺼져 있어도 기존 프론트엔드 게스트 모드를 계속 이용할 수 있어야 한다.
- 기존 사용자, 점수, 업적을 포함한 PostgreSQL 전체 데이터를 보존한다.
- 비용 절감과 안전한 최소 공개를 최우선으로 하고, 엔터프라이즈 수준의 가용성은 목표로 하지 않는다.

## 현재 운영 구성

### 프론트엔드

- React/Vite 애플리케이션
- Netlify 무료 플랜 사용
- Netlify 구성은 변경하지 않는다.
- 백엔드가 없을 때 사용하는 게스트 모드와 로그인 실패 처리는 이미 구현되어 있으며, 추가 구현 범위에서 제외한다.
- 플레이 중 저장 실패에 대한 브라우저 영구 대기열과 자동 재전송은 이번 마이그레이션 범위에서 제외한다.

### GCP

- Compute Engine VM
  - vCPU 2
  - 메모리 4GB
  - 디스크 50GB
- Spring Boot 백엔드가 Docker 컨테이너로 실행된다.
- PostgreSQL도 같은 VM의 Docker 컨테이너에서 실행된다.
- 과거 Cloud SQL을 사용했지만 높은 비용 때문에 제거하고 VM 내부 PostgreSQL로 이전했다.
- 기존 Cloud SQL 리소스 및 잔여 과금 리소스는 최종 삭제 전에 다시 확인해야 한다.

### 도메인

- `riko-birthday-cafe.duckdns.org`: 운영 API
- `dev-riko-birthday-cafe.duckdns.org`: 마이그레이션 테스트 API
- 현재 두 DuckDNS 레코드는 GCP 고정 IP `34.169.16.108`을 가리킨다.
- 테스트 시 먼저 개발 도메인을 홈 서버 공인 IP로 변경하고, 검증 후 운영 도메인을 전환한다.
- 홈 공인 IP 변경에 대비해 DuckDNS 자동 갱신을 구성한다.
- Netlify 환경변수는 이미 다음과 같이 구성되어 있어 도메인 전환 시 변경하지 않는다.
  - Production: `https://riko-birthday-cafe.duckdns.org`
  - Deploy Previews 및 Branch deploys: `https://dev-riko-birthday-cafe.duckdns.org`
  - Local development: `http://localhost:8080`

## 홈 서버 환경

- Intel MacBook
- RAM 16GB, 2133MHz LPDDR3
- 저장공간 250GB 중 약 50GB 여유
- macOS Sequoia 15.7.7 (`24G720`)
- Docker Desktop 설치됨
- Wi-Fi 연결만 사용
- 전원 어댑터 상시 연결 가능
- 필요할 때만 서버를 수동으로 켜고 꺼도 된다.
- 정전 후 자동 부팅과 24시간 가용성은 요구하지 않는다.
- 원격 관리는 사용하지 않는다.

## 네트워크 확인 결과

- 공유기: ipTIME N702R
- 공유기의 WAN IP와 외부에서 확인한 공인 IP가 동일하다.
- 일반적인 IPv4 포트포워딩이 가능한 환경으로 판단한다.
- MacBook의 현재 내부 IP에 DHCP 주소 예약을 완료했다.
- DHCP 예약은 포트포워딩 대상인 MacBook의 내부 IP가 바뀌지 않도록 한다.

## 권장 아키텍처

```text
Netlify frontend
       |
       | HTTPS API request
       v
DuckDNS domain
       |
       v
Home public IPv4
       |
       v
ipTIME port forwarding (TCP 80/443 only)
       |
       v
Caddy container
       |
       v
Spring Boot container
       |
       v
PostgreSQL container + persistent volume
```

Docker Compose로 다음 다섯 서비스를 함께 관리한다.

1. `caddy`: TLS 종료 및 리버스 프록시
2. `backend-prod`: `prod` 스키마를 사용하는 운영 Spring Boot API
3. `backend-dev`: `dev` 스키마를 사용하는 개발 Spring Boot API
4. `db`: PostgreSQL 18과 영구 데이터 볼륨
5. `duckdns`: 홈 공인 IP를 두 DuckDNS 레코드에 주기적으로 반영

홈 서버 운영 구성은 기존 개발용 Compose 파일과 분리된
`docker-compose.home.yml`에서 관리한다. 홈 서버 비밀값은 Git에서 제외되는
`.env.home`에 저장한다.

## Riko 명명 정규화

`rico`는 잘못된 표기이며 새 홈 서버 구성과 활성 코드에서는 `riko`를
사용한다. 마이그레이션 구현 계획에 다음 변경을 포함한다.

- GitHub 저장소: `rico-birthday-cafe`에서 `riko-birthday-cafe`로 이름 변경
- 로컬 저장소 디렉터리와 Git remote URL 갱신
- 루트 패키지명과 문서의 프로젝트 경로
- Java 패키지: `com.rico.birthdaycafe`에서 `com.riko.birthdaycafe`로 이동
- Gradle group: `com.rico`에서 `com.riko`로 변경
- Docker Compose 프로젝트, 컨테이너, 이미지, 네트워크 및 볼륨 이름
- 로컬 DB 이름: `rico_db` 대신 `riko_birthday_cafe_db` 사용
- 프론트엔드 내부 저장 키, 이벤트명, 전역 변수, CSS/Tailwind 토큰
- 활성 배포 문서와 스크립트의 `rico` 식별자

GCP의 기존 컨테이너명 `rico-backend-prod`, `rico-backend-dev`는 원본 환경을
식별하기 위한 과거 이름으로만 기록한다. 홈 서버에서는 각각
`riko-backend-prod`, `riko-backend-dev`를 사용한다.

영속 데이터나 외부 계약에 쓰이는 식별자는 무조건 문자열 치환하지 않는다.
예를 들어 업적 코드 `RICO_DEBUT_DATE`, 브라우저 localStorage 키, 이벤트명은
기존 사용자 데이터와 호환되도록 다음 절차를 적용한다.

1. 새 `RIKO_*` 식별자를 정의한다.
2. DB 데이터와 참조 코드를 한 번에 이전한다.
3. 필요한 브라우저 키는 기존 값을 읽어 새 키로 옮긴다.
4. 이전 데이터와 신규 데이터에서 로그인, 업적 및 UI 설정을 검증한다.
5. 호환성 검증 후에만 기존 `RICO_*` 처리를 제거한다.

사용자 UID, 비밀번호 해시, 점수, 업적 획득 시각 등 실제 사용자 값은 이름
정규화 과정에서 변경하지 않는다.

## 네트워크 및 보안 원칙

- 인터넷에 공개하는 포트는 TCP `80`과 `443`뿐이다.
- Spring Boot 포트 `8080` 또는 호스트 매핑 포트 `8000`을 외부에 직접 공개하지 않는다.
- PostgreSQL `5432`를 외부에 공개하지 않는다.
- SSH, macOS 화면 공유 및 원격 데스크톱 포트를 공유기에 열지 않는다.
- Caddy만 공개 네트워크의 요청을 받고 내부 Docker 네트워크를 통해 백엔드에 전달한다.
- PostgreSQL은 Docker 내부 네트워크에서만 백엔드가 접근한다.
- macOS 방화벽과 공유기 포트포워딩을 함께 사용한다.
- 관리자 비밀번호, DB 비밀번호, JWT 비밀키, DuckDNS 토큰은 Git에 커밋하지 않는다.
- 현재 대화에 노출된 DB 비밀번호, 운영·개발 JWT 비밀키 및 관리자 인증 정보는
  마이그레이션 전환 시 모두 새 값으로 교체한다.
- 운영과 개발 JWT 비밀키는 서로 다른 값으로 생성한다.

## HTTPS

- Caddy가 DuckDNS 도메인에 대해 Let's Encrypt 인증서를 자동 발급하고 갱신한다.
- 인증서 수동 3개월 재발급 방식은 사용하지 않는다.
- 인증서 발급을 위해 도메인이 홈 공인 IP를 가리키고 외부에서 `80/443`에 접근할 수 있어야 한다.
- 먼저 `dev-riko-birthday-cafe.duckdns.org`로 인증서와 외부 접근을 검증한다.
- 운영 전환 후 `riko-birthday-cafe.duckdns.org`를 사용한다.
- 개발 도메인 검증 중에는 운영 도메인이 계속 GCP를 가리키도록 유지한다.

## macOS 운영 원칙

- 화면 꺼짐과 화면 잠금은 허용한다.
- 서버를 실행하는 동안 시스템 잠자기는 비활성화한다.
- 덮개를 닫는 운영은 하지 않는다.
- 서버를 끄고 싶을 때는 Docker Compose를 정상 종료한 후 MacBook을 재우거나 종료한다.
- Docker Desktop 자동 시작은 필수가 아니다. 필요할 때 수동 실행할 수 있다.
- Wi-Fi 장애와 전원 종료는 허용 가능한 장애로 간주한다.
- 약 50GB의 남은 공간을 고려해 Docker 로그 제한과 백업 보존 정책을 둔다.
- `scripts/home-server-start.sh`가 Docker 준비 상태와 필수 환경변수를 검사한 뒤
  홈 서버 Compose 스택을 시작한다.
- `scripts/home-server-stop.sh`가 Compose 스택과 PostgreSQL을 정상 종료한다.
- `scripts/home-server-backup.sh`는 사용자가 종료 전에 수동 실행한다.

## 로컬 실행 검증 결과

2026년 6월 10일 현재 다음을 확인했다.

- Docker Desktop 4.22.0 실행 가능
- Docker Engine 24.0.5 정상
- Docker VM 할당: CPU 4개, 메모리 약 8GB
- PostgreSQL 15.17 컨테이너 정상
- PostgreSQL 영구 볼륨 정상
- Spring Boot가 로컬 PostgreSQL에 연결됨
- `GET /actuator/health` 응답: HTTP 200, `UP`
- 로컬 DB에 애플리케이션 스키마와 업적 초기 데이터 생성 확인

이 검증은 현재 로컬 개발 DB를 대상으로 했으며, GCP 운영 데이터 복원 검증은 아직 하지 않았다.

운영 마이그레이션에서는 기존 로컬 개발 DB와 별도로 PostgreSQL
`postgres:18` 이미지를 사용한다.

## 확인된 GCP 데이터베이스

- 컨테이너: `riko-postgres`
- 이미지: `postgres:18`
- 서버 및 도구 버전: PostgreSQL 18.3
- 데이터베이스: `riko_birthday_cafe_db`
- 데이터베이스 크기: 약 8.8MB
- Docker 볼륨: `deploy_riko_postgres_data`
- 볼륨 사용량: 약 67MB
- 별도 확장: 없음 (`plpgsql`만 사용)
- 운영 백엔드: `rico-backend-prod`, `currentSchema=prod`
- 개발 백엔드: `rico-backend-dev`, `currentSchema=dev`
- `public` 스키마도 전체 DB 백업에 포함하되 백엔드에서는 사용하지 않는다.

GCP 호스트에서는 현재 `5432`, `8000`, `8001`이 모든 인터페이스에
바인딩되어 있다. 홈 서버에서는 이 포트들을 외부에 공개하지 않는다.

## 데이터 마이그레이션

전체 데이터베이스를 보존한다. `prod`, `dev`, `public` 스키마를 모두
포함한다. 서비스 점검 시간에는 제한이 없으므로 무중단 복제보다 단순하고
안전한 오프라인 백업/복원을 사용한다.

권장 흐름:

1. GCP 백엔드를 중지해 DB 쓰기를 차단한다.
2. GCP PostgreSQL에서 custom format `pg_dump`를 생성한다.
3. 덤프 파일의 크기와 체크섬을 기록한다.
4. 덤프를 MacBook으로 안전하게 전송한다.
5. PostgreSQL 18 기반의 별도 빈 로컬 운영 DB에 `pg_restore`한다.
6. 주요 테이블의 행 수, 사용자 수, 점수, 업적 및 외래키를 비교한다.
7. 로컬 백엔드로 로그인, 조회, 점수 저장, 업적 저장을 시험한다.
8. 검증이 끝날 때까지 원본 덤프와 GCP VM을 유지한다.

덤프는 GCP PostgreSQL 18.3 컨테이너의 `pg_dump`로 생성하고, 홈 서버의
PostgreSQL 18에 복원한다.

### 백업 보존

- `scripts/home-server-backup.sh`를 사용자가 수동 실행한다.
- MacBook 내부에는 성공한 최근 7개 백업만 보존한다.
- 새 백업 생성과 체크섬 검증이 성공한 뒤에만 가장 오래된 백업을 삭제한다.
- 외장 디스크에 최소 1개 백업을 복사한다.
- MacBook과 외장 디스크 파일의 SHA-256 체크섬을 비교한다.
- 외장 디스크가 연결되고 복사·검증되기 전에는 GCP 리소스를 삭제하지 않는다.
- 외장 복사가 실패하면 기존 백업을 삭제하지 않는다.

## 프론트엔드 장애 처리

이번 마이그레이션에서는 프론트엔드 오류 처리 코드를 추가하지 않는다.

- 초기 백엔드 연결 실패 시 게스트 모드 진입
- 로그인 실패 시 게스트 모드 안내
- 백엔드가 꺼져 있을 때 프론트엔드 단독 이용
- 플레이 중 저장 요청이 실패하면 기존 오류 처리에 따르며 해당 서버 기록은 보장하지 않는다.
- 브라우저 영구 대기열, 자동 재시도, 멱등성 API는 후속 개선 후보로만 남긴다.

## 운영 방식

- 서버가 필요할 때 Docker Desktop을 실행하고 Compose 스택을 시작한다.
- 서버를 끄면 Netlify 프론트엔드는 계속 서비스되고 사용자는 게스트 모드를 사용한다.
- 홈 서버의 상시 가용성, 자동 부팅, 원격 복구는 목표가 아니다.
- 운영 시작/종료 절차는 한두 개의 명령 또는 스크립트로 단순화한다.
- 운영 전 개발 DuckDNS 도메인으로 외부 네트워크 테스트를 완료한다.

## 전환 및 롤백 원칙

### 전환

1. 홈 서버에서 개발 도메인으로 기능 검증
2. GCP 백엔드 쓰기 중단
3. 최종 DB 덤프 및 로컬 복원
4. 로컬 API 전체 기능 검증
5. 운영 DuckDNS 레코드를 홈 공인 IP로 변경
6. Netlify 환경변수가 기존 운영 DuckDNS 도메인을 유지하는지 재확인
7. 외부 네트워크에서 최종 검증
8. 관찰 기간 후 GCP 리소스 삭제

전환 후 7일 동안 GCP VM은 중지 상태로 유지한다. VM 실행 비용은 차단되지만
부팅 디스크와 예약 외부 IP 비용은 관찰 기간 동안 발생할 수 있다.

### 롤백

- GCP 리소스를 삭제하기 전에는 운영 DuckDNS와 프론트엔드 API 주소를 GCP로 되돌린다.
- GCP 원본 DB는 롤백 기간 동안 읽기/쓰기 재개가 가능하도록 유지한다.
- 홈 서버에서 새로 발생한 데이터를 GCP에 역반영하는 절차가 없으므로, 전환 후 양쪽 DB에 동시에 쓰지 않는다.
- GCP 삭제 후 롤백은 보관한 덤프로 새 환경을 복구하는 방식만 가능하다.
- 7일 관찰 기간에 문제가 생기면 GCP VM을 다시 시작하고 DuckDNS를
  `34.169.16.108`로 되돌린다.

## GCP 과금 제거 점검 범위

홈 서버 검증과 롤백 기간이 끝난 뒤 다음을 확인하고 삭제한다.

- Compute Engine VM
- VM 부팅 디스크 및 추가 Persistent Disk
- 예약된 외부 고정 IPv4
- VM 스냅샷 및 머신 이미지
- Cloud SQL 인스턴스
- Cloud SQL 백업 및 복제본
- Artifact Registry 또는 Container Registry 이미지
- Cloud Storage 버킷
- Load Balancer, forwarding rule, target proxy, health check
- Cloud NAT 및 고정 주소
- 남은 VPC 방화벽 규칙은 직접 비용이 없더라도 정리
- Cloud DNS zone
- Secret Manager의 활성 secret version
- Logging/Monitoring의 사용자 정의 보존 또는 유료 기능
- 결제 보고서에서 프로젝트별 잔여 SKU 확인
- 필요하면 최종적으로 GCP 프로젝트 종료

리소스 이름과 의존성을 확인하지 않은 상태에서 프로젝트나 디스크를 먼저 삭제하지 않는다.

## 확정된 결정

- Netlify 무료 프론트엔드와 현재 설정 유지
- 홈 서버는 Intel MacBook 사용
- 백엔드 상시 가용성 불필요
- PostgreSQL 전체 데이터 보존
- 점검 시간 제한 없음
- 원격 관리 미사용
- DHCP 주소 예약 완료
- 외부 공개 포트는 `80/443`만 사용
- Docker Compose + Caddy + Spring Boot + PostgreSQL 구조 사용
- 위 홈 서버 아키텍처 사용자 승인 완료
- 홈 서버 구성은 `docker-compose.home.yml`로 개발 구성과 분리
- PostgreSQL은 `postgres:18` 사용
- 운영과 개발 백엔드를 모두 이전
- 전체 DB의 `prod`, `dev`, `public` 스키마 보존
- 개발 DuckDNS 도메인으로 먼저 시험
- DuckDNS 갱신 컨테이너와 `.env.home` 사용
- 시작·종료·백업 스크립트 제공
- MacBook 최근 7개 백업 및 외장 디스크 최소 1개 복사
- 홈 서버 전환 후 GCP VM을 중지하고 7일 관찰
- 관찰 종료 후 과금 리소스 삭제
- 노출된 비밀값은 전환 시 일괄 교체
- 저장소, Java 패키지, Docker, DB 및 프론트엔드 내부 식별자의 `rico`를
  호환성 마이그레이션과 함께 `riko`로 정규화
- 브라우저 영구 대기열과 자동 재전송은 이번 범위에서 제외

## 남은 설계 항목

상세 설계는 완료되었다. 정확한 Compose 구성, Caddyfile, 스크립트,
`pg_dump`/`pg_restore` 명령, `rico`에서 `riko`로의 명명 변경 순서, 검증
명령 및 GCP 삭제 순서는 구현 계획에서 파일과 명령 단위로 작성한다.

## 다음 세션 시작 지점

이 문서를 읽은 뒤 `superpowers:writing-plans`로 구현 계획을 작성한다.

구현 계획 승인 전에는 포트포워딩, DuckDNS 전환, 운영 데이터 덤프,
비밀값 교체 또는 GCP 삭제를 실행하지 않는다.
