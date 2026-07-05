# 백업 기반 마이그레이션 가이드 (2026-07-06)

Google Cloud 무료 체험 만료를 앞두고 오늘 확보한 운영 DB 백업을 어떻게
활용해서 GCP 밖으로 마이그레이션할 수 있는지 정리한 문서다.

## 0. 지금 당장 — 서비스 상태 (2026-07-06 갱신)

- GCP 쪽 리소스(Cloud SQL, Compute Engine VM, 고정 IP)는 모두 중지·해제되었고,
  결제 계정 자체도 폐쇄했다. **GCP에서 백엔드를 다시 켜는 옵션은 더 이상
  없다** — 재개하려면 결제 계정을 다시 열어야 한다. 자세한 경과는
  `backend/DEPLOY_INCIDENT_2026-07-06.md` 참고.
- 데이터는 이미 아래 3번 위치에 안전하게 백업되어 있고, 로컬 복원 리허설로
  무결성까지 확인했다 (`prod.users` 302건 등 기존 기준치와 일치).
- 프론트엔드(Netlify)는 게스트 모드로 계속 서비스되며, 로그인·점수·업적
  저장 등 백엔드 의존 기능만 아래 경로 A(홈 서버) 실행 전까지 중단된다.
- 즉, 서비스를 재개하는 유일한 경로는 아래 **경로 A(홈 서버)**를 실제로
  실행하는 것이다.

## 1. 오늘 확보한 백업

- 파일: `backups/home/riko-final-20260705-154124.dump`
- 체크섬: `backups/home/riko-final-20260705-154124.dump.sha256`
- 형식: PostgreSQL custom format, `prod`/`dev`/`public` 스키마 전체 포함
- 크기: 약 69KB (원본 DB 볼륨 크기 약 67MB, 압축 후 크기이므로 정상 범위 —
  실제 무결성은 2번 restore 리허설로 확인해야 한다)
- 이 덤프를 뜬 시점 이후 GCP에는 쓰기가 없었다 (덤프 직전 백엔드를 중지함)
- 로컬에서 SHA-256 일치 확인 완료

### 아직 안 한 것 (GCP를 완전히 지우기 전에 반드시 수행)

- [ ] 외장 디스크로 복사 후 체크섬 재검증
- [ ] 실제 restore 리허설로 row count 대조 (덤프가 "만들어졌다"와 "복원된다"는
      다른 문제다)

## 2. 마이그레이션 경로 두 가지

### 경로 A: 홈 서버(로컬 맥북) — 이미 설계·구현 완료, 승인됨 (권장)

2026-06-10/11에 이미 사용자 승인을 받은 설계다. Netlify(프론트엔드)는 그대로
두고, 맥북에서 Caddy + Spring Boot 컨테이너 2개(prod/dev) + PostgreSQL 18을
Docker Compose로 구동한다. 도메인(`riko-birthday-cafe.duckdns.org`,
`dev-riko-birthday-cafe.duckdns.org`)도 그대로 유지되므로 Netlify 환경변수를
바꿀 필요가 없다.

코드 구현은 이미 `feat/gcp-home-migration` 브랜치에 25개 커밋으로 완료되어
있다 (`docker-compose.home.yml`, `Caddyfile.home`, `scripts/home-server-*.sh`,
`docs/HOME_SERVER_RUNBOOK.md`, 백엔드 `com.riko` 네임스페이스 정리 등). 아직
`main`에 merge되지 않았다.

진행 순서:

1. 브랜치를 `main`에 merge한다.
2. `docs/HOME_SERVER_RUNBOOK.md`의 "Restore Rehearsal" 절차대로, 오늘 받은
   `backups/home/riko-final-20260705-154124.dump`를 로컬 disposable
   PostgreSQL 18 컨테이너에 복원해서 스키마별 row count를 GCP 쪽 기록과
   대조한다.
3. 같은 문서 "One-Time Secret Creation" 절차로 `.env.home`을 만든다 — DB
   비밀번호, JWT 시크릿, 관리자 해시는 반드시 새로 생성한다 (지금까지 대화나
   커밋에 노출된 값은 재사용하지 않는다).
4. ipTIME 공유기에서 TCP 80/443만 맥북으로 포트포워딩한다.
5. `./scripts/home-server-start.sh`로 개발 도메인부터 외부 네트워크 검증 후
   운영 도메인으로 전환한다 (`--production-domain`).
6. GCP VM은 7일간 중지 상태로 관찰한 뒤, 같은 문서의 "GCP Billing Deletion
   Checklist"에 따라 과금 리소스를 삭제한다.

장점: 이미 완전히 설계·구현된 경로, 월 비용 0원, 도메인 유지, 데이터 전량
보존. 단점: 맥북이 켜져 있어야 백엔드가 살아있고 (꺼지면 프론트는 게스트
모드로 계속 동작), 공유기 포트포워딩 등 물리적 설정이 필요하다.

### 경로 B: Supabase(DB) + Render/Railway/Fly(백엔드) — 더 빠른 대안

과거에도 이 조합을 검토해서 `backend/DEPLOY_SUPABASE.md`,
`backend/DEPLOY_RENDER_DB.md`가 이미 작성되어 있다. Supabase는 Spring Boot
앱 자체를 호스팅하지 않으므로, DB만 Supabase에 올리고 앱은 별도 무료
호스팅(Render 등)에 올리는 조합이다. 맥북을 상시 켜둘 필요가 없다.

1. Supabase 프로젝트를 새로 만든다 (무료 플랜 DB 한도 500MB, 현재 데이터
   67MB 수준이면 충분).
2. `Project Settings → Database`에서 **Direct connection**(포트 5432,
   pooler 아님) 정보를 확인한다. `pg_restore`는 pooler가 아니라 direct
   connection에서 실행해야 한다.
3. 로컬에서 오늘 받은 덤프를 그대로 복원한다.

   ```bash
   pg_restore \
     --no-owner --no-acl \
     --clean --if-exists \
     -h <PROJECT_REF>.supabase.co -p 5432 -U postgres -d postgres \
     backups/home/riko-final-20260705-154124.dump
   ```

   덤프에 `prod`/`dev`/`public` 스키마가 이미 구분되어 있으므로 이름 충돌
   없이 그대로 복원된다.

4. 복원 후 `psql`이나 Supabase Table Editor로 스키마별 row count를 GCP
   원본 기록과 대조한다 (`docs/HOME_SERVER_RUNBOOK.md`의 count(*) 생성
   쿼리를 그대로 재사용할 수 있다).
5. `backend/DEPLOY_SUPABASE.md` 절차대로 백엔드를 Render/Railway/Fly에
   Docker로 배포한다.
   - 런타임 연결은 Session Pooler(포트 6543)를 쓴다:
     `SUPABASE_DB_JDBC_URL=jdbc:postgresql://<POOLER_HOST>:6543/postgres?sslmode=require`
   - `SUPABASE_DB_USER`, `SUPABASE_DB_PASSWORD`, `JWT_SECRET`,
     `ADMIN_PASSCODE_HASH`, `ALLOWED_ORIGINS`도 함께 설정한다.
6. 백엔드 도메인이 GCP/홈서버와 달라지므로, Netlify 환경변수의 API base
   URL을 새 백엔드 주소로 바꿔야 한다.

장점: 물리 서버 관리가 필요 없고 상시 가동되며, 설정만 마치면 당일에도
끝낼 수 있다. 단점: Supabase/Render 무료 플랜 자체의 제약(유휴 시 슬립,
대역폭 한도 등)이 있고, 프론트엔드 API 주소 변경이 필요하며, 이미 승인된
홈서버 설계와는 별개의 새 인프라라 재검토가 필요하다.

## 3. 권장 순서

GCP는 이미 결제 계정 폐쇄로 완전히 정리되어 더 이상 대안이 아니다
(`backend/DEPLOY_INCIDENT_2026-07-06.md` 참고). 남은 건 경로 A 또는
경로 B 중 하나를 실행하는 것뿐이다.

1. 백업 파일을 외장 디스크에도 복사해 이중 보관한다 (restore 리허설은
   이미 완료, `prod.users` 302건 등 기준치 일치 확인됨).
2. 경로 A(홈서버) 브랜치를 `main`에 merge한다.
3. `.env.home`을 새 비밀값으로 생성하고, 개발 도메인부터 외부 검증 후
   운영 도메인으로 전환한다.

경로 B는 경로 A가 시간상 불가능할 때 쓰는 임시 대안으로 남겨둔다. 이미
설계·구현·승인이 끝난 경로 A를 두고 새 인프라를 또 도입하면 유지보수
대상만 늘어난다.
