# GCP to Home Server Migration Design

## 문서 목적

이 문서는 `rico-birthday-cafe`의 Spring Boot 백엔드와 PostgreSQL을 GCP Compute Engine에서 개인 MacBook으로 이전하기 위한 설계 및 인수인계 문서다.

새 Codex 세션에서는 이 문서를 먼저 읽고, **남은 설계 항목을 확정한 뒤 구현 계획을 작성**한다. 아직 실제 운영 마이그레이션이나 GCP 리소스 삭제는 시작하지 않았다.

## 승인 상태

- 홈 서버 아키텍처: 2026년 6월 10일 사용자 승인
- 상세 운영 및 프론트엔드 동기화 설계: 진행 중
- 구현 계획: 상세 설계 승인 후 작성
- 운영 마이그레이션 및 GCP 삭제: 미실행

## 목표

- GCP 과금을 0원 또는 가능한 한 0원에 가깝게 줄인다.
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

Docker Compose로 다음 세 서비스를 함께 관리한다.

1. `caddy`: TLS 종료 및 리버스 프록시
2. `backend`: Spring Boot API
3. `db`: PostgreSQL과 영구 데이터 볼륨

## 네트워크 및 보안 원칙

- 인터넷에 공개하는 포트는 TCP `80`과 `443`뿐이다.
- Spring Boot 포트 `8080` 또는 호스트 매핑 포트 `8000`을 외부에 직접 공개하지 않는다.
- PostgreSQL `5432`를 외부에 공개하지 않는다.
- SSH, macOS 화면 공유 및 원격 데스크톱 포트를 공유기에 열지 않는다.
- Caddy만 공개 네트워크의 요청을 받고 내부 Docker 네트워크를 통해 백엔드에 전달한다.
- PostgreSQL은 Docker 내부 네트워크에서만 백엔드가 접근한다.
- macOS 방화벽과 공유기 포트포워딩을 함께 사용한다.
- 관리자 비밀번호, DB 비밀번호, JWT 비밀키, DuckDNS 토큰은 Git에 커밋하지 않는다.

## HTTPS

- Caddy가 DuckDNS 도메인에 대해 Let's Encrypt 인증서를 자동 발급하고 갱신한다.
- 인증서 수동 3개월 재발급 방식은 사용하지 않는다.
- 인증서 발급을 위해 도메인이 홈 공인 IP를 가리키고 외부에서 `80/443`에 접근할 수 있어야 한다.
- 먼저 `dev-riko-birthday-cafe.duckdns.org`로 인증서와 외부 접근을 검증한다.
- 운영 전환 후 `riko-birthday-cafe.duckdns.org`를 사용한다.

## macOS 운영 원칙

- 화면 꺼짐과 화면 잠금은 허용한다.
- 서버를 실행하는 동안 시스템 잠자기는 비활성화한다.
- 덮개를 닫는 운영은 하지 않는다.
- 서버를 끄고 싶을 때는 Docker Compose를 정상 종료한 후 MacBook을 재우거나 종료한다.
- Docker Desktop 자동 시작은 필수가 아니다. 필요할 때 수동 실행할 수 있다.
- Wi-Fi 장애와 전원 종료는 허용 가능한 장애로 간주한다.
- 약 50GB의 남은 공간을 고려해 Docker 로그 제한과 백업 보존 정책을 둔다.

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

## 데이터 마이그레이션

전체 데이터를 보존한다. 서비스 점검 시간에는 제한이 없으므로 무중단 복제보다 단순하고 안전한 오프라인 백업/복원을 사용한다.

권장 흐름:

1. GCP 백엔드를 중지해 DB 쓰기를 차단한다.
2. GCP PostgreSQL에서 custom format `pg_dump`를 생성한다.
3. 덤프 파일의 크기와 체크섬을 기록한다.
4. 덤프를 MacBook으로 안전하게 전송한다.
5. 별도의 빈 로컬 운영 DB에 `pg_restore`한다.
6. 주요 테이블의 행 수, 사용자 수, 점수, 업적 및 외래키를 비교한다.
7. 로컬 백엔드로 로그인, 조회, 점수 저장, 업적 저장을 시험한다.
8. 검증이 끝날 때까지 원본 덤프와 GCP VM을 유지한다.

PostgreSQL 서버 버전 차이로 인한 문제를 줄이기 위해 덤프 도구 버전과 복원 대상 버전을 구현 계획에서 확정해야 한다.

## 프론트엔드 장애 처리

이미 구현되어 있어 추가하지 않는 범위:

- 초기 백엔드 연결 실패 시 게스트 모드 진입
- 로그인 실패 시 게스트 모드 안내
- 백엔드가 꺼져 있을 때 프론트엔드 단독 이용

추가 구현이 필요한 범위:

- 플레이 중 점수 또는 업적 저장 요청 실패 시 브라우저 영구 대기열에 저장
- 서버가 복구되면 대기 요청 자동 재전송
- 중복 전송 방지를 위한 멱등성 처리
- JWT 만료 시 자동 반복 전송을 멈추고 재로그인 후 동기화
- 타임아웃, 네트워크 단절, HTTP 오류를 구분한 사용자 메시지
- 조회 실패가 게임 진행 자체를 중단시키지 않도록 로컬 데이터로 대체

대기열의 구체적인 저장소, 재시도 정책, 멱등성 키와 서버 API 변경 범위는 아직 설계해야 한다.

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
6. Netlify 프론트엔드의 운영 API 주소 변경 및 배포
7. 외부 네트워크에서 최종 검증
8. 관찰 기간 후 GCP 리소스 삭제

### 롤백

- GCP 리소스를 삭제하기 전에는 운영 DuckDNS와 프론트엔드 API 주소를 GCP로 되돌린다.
- GCP 원본 DB는 롤백 기간 동안 읽기/쓰기 재개가 가능하도록 유지한다.
- 홈 서버에서 새로 발생한 데이터를 GCP에 역반영하는 절차가 없으므로, 전환 후 양쪽 DB에 동시에 쓰지 않는다.
- GCP 삭제 후 롤백은 보관한 덤프로 새 환경을 복구하는 방식만 가능하다.

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
- 개발 DuckDNS 도메인으로 먼저 시험
- 저장 실패 데이터는 브라우저에 보관하고 복구 후 재전송

## 남은 설계 항목

다음 항목은 구현 전에 순서대로 확정해야 한다.

1. 저장 요청 대기열의 데이터 모델, 멱등성 및 재시도 정책
2. 운영 Compose 파일 구조와 개발 Compose 파일 분리 방식
3. Caddy 설정과 두 DuckDNS 도메인의 전환 절차
4. DuckDNS 공인 IP 자동 갱신 방식과 주기
5. macOS 서버 시작/종료 스크립트
6. Docker 로그 크기 제한과 DB 백업 보존 기간
7. GCP PostgreSQL 버전과 실제 DB 용량
8. `pg_dump` 전송 및 복원 검증 명령
9. 관찰 기간과 GCP 삭제 시점
10. Netlify 운영 환경변수의 현재 API 주소 및 변경 절차

## 다음 세션 시작 지점

이 문서를 읽은 뒤 `superpowers:brainstorming`을 계속 진행한다. 첫 질문은 다음과 같다.

> 저장 실패 대기열에서 점수는 최고점 기준으로 병합하고 업적은 코드별 한 번만 전송하는 방식으로 설계해도 되는가?

설계가 모두 승인되기 전에는 운영 파일 변경, 포트포워딩, DuckDNS 전환, 데이터 덤프 또는 GCP 삭제를 실행하지 않는다.
