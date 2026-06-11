# GCP to Home Server Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the production and development Spring Boot APIs plus the complete PostgreSQL database from GCP to the Intel MacBook, normalize incorrect `rico` identifiers to `riko`, and remove GCP billing resources after a seven-day rollback window.

**Architecture:** Netlify remains the frontend host. The MacBook runs Caddy, two Spring Boot containers, PostgreSQL 18, and separate DuckDNS updater services through `docker-compose.home.yml`; only TCP 80/443 are exposed. Migration uses an offline PostgreSQL 18 custom-format dump, a local restore rehearsal, development-domain verification, production cutover, and a seven-day stopped-VM observation period.

**Tech Stack:** macOS Sequoia, Docker Desktop, Docker Compose, Caddy 2, Spring Boot 4/Java 17, PostgreSQL 18, DuckDNS, Bash, Netlify

---

## File Map

**Create**

- `docker-compose.home.yml`: isolated home production stack.
- `Caddyfile.home`: HTTPS routing for production and development domains.
- `.env.home.example`: non-secret home environment contract.
- `scripts/home-server-common.sh`: shared validation and Compose helpers.
- `scripts/home-server-start.sh`: start Docker and the selected DuckDNS profile.
- `scripts/home-server-stop.sh`: optionally back up, then stop the stack cleanly.
- `scripts/home-server-backup.sh`: custom-format backup, SHA-256 verification, seven-file retention.
- `scripts/home-server-restore.sh`: guarded restore into the home PostgreSQL database.
- `scripts/home-server-verify.sh`: health, schema, row-count, and exposure checks.
- `frontend/src/utils/storageMigration.ts`: migrate browser keys from `rico` to `riko`.
- `frontend/src/utils/storageMigration.test.ts`: storage migration behavior.
- `backend/src/test/java/com/riko/birthdaycafe/config/AchievementSeederTests.java`: achievement-code migration coverage.
- `docs/HOME_SERVER_RUNBOOK.md`: routine operation, cutover, rollback, and GCP cleanup.

**Modify**

- `.gitignore`: ignore home secrets, backups, and Caddy runtime data.
- `package.json`: rename the root package.
- `docker-compose.yml`, `docker-compose.local.yml`, `start_dev.sh`: use `riko` local names.
- `backend/build.gradle`: change the Java group.
- `backend/src/main/java/com/rico/**`, `backend/src/test/java/com/rico/**`: move to `com.riko`.
- `backend/src/main/java/com/riko/birthdaycafe/config/AchievementSeeder.java`: migrate `RICO_DEBUT_DATE`.
- `backend/src/main/java/com/riko/birthdaycafe/repository/UserRepository.java`: find active legacy codes.
- `frontend/src/store/useAudioStore.ts`: use the new persisted key after migration.
- `frontend/src/utils/pageTransitionLoading.ts`: rename event/global identifiers.
- `frontend/src/components/auth/AdminModal.tsx`: use `RIKO_DEBUT_DATE`.
- `frontend/src/components/common/achievementIcons.ts`: use `RIKO_DEBUT_DATE`.
- `frontend/src/index.css`, `frontend/tailwind.config.js`: rename theme tokens.
- `frontend/src/main.tsx`: invoke browser storage migration before app startup.
- `frontend/src/utils/api.ts`: remove the obsolete Render fallback.
- `PROJECT_SPEC.md`, `CLAUDE.md`, active deployment docs: update current names and home-server operations.

**External Operations**

- Rename the GitHub repository and local directory.
- Configure ipTIME port forwarding for TCP 80/443 only.
- Switch DuckDNS development, then production records.
- Rotate all exposed secrets at cutover.
- Stop GCP for seven days, then delete billable resources.

---

### Task 1: Add Naming Guardrails and Rename the Java Namespace

**Files:**
- Modify: `backend/build.gradle:7`
- Move: `backend/src/main/java/com/rico/**` to `backend/src/main/java/com/riko/**`
- Move: `backend/src/test/java/com/rico/**` to `backend/src/test/java/com/riko/**`
- Modify: `package.json:2`
- Modify: `docker-compose.yml:6`
- Modify: `docker-compose.local.yml:3-9`
- Modify: `start_dev.sh:37`

- [ ] **Step 1: Capture the current test baseline**

Run:

```bash
cd backend
./gradlew test
```

Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 2: Move Java source directories**

Run:

```bash
mkdir -p backend/src/main/java/com/riko
mkdir -p backend/src/test/java/com/riko
mv backend/src/main/java/com/rico/birthdaycafe backend/src/main/java/com/riko/
mv backend/src/test/java/com/rico/birthdaycafe backend/src/test/java/com/riko/
```

Expected: no files remain under `backend/src/main/java/com/rico` or `backend/src/test/java/com/rico`.

- [ ] **Step 3: Update package declarations, imports, Gradle group, and local infrastructure names**

Apply these exact replacements:

```text
com.rico.birthdaycafe -> com.riko.birthdaycafe
group = 'com.rico' -> group = 'com.riko'
"name": "rico-birthday-cafe" -> "name": "riko-birthday-cafe"
rico-backend -> riko-backend
rico-db-local -> riko-db-local
rico-birthday-cafe-db -> riko-birthday-cafe-db
POSTGRES_DB: rico_db -> POSTGRES_DB: riko_birthday_cafe_db
```

Do not rename the historical GCP names in the migration design or runbook.

- [ ] **Step 4: Add a repository naming scan**

Run:

```bash
rg -n 'com\.rico|container_name: rico|POSTGRES_DB: rico_db|"name": "rico-birthday-cafe"' \
  backend frontend package.json docker-compose.yml docker-compose.local.yml start_dev.sh
```

Expected: no matches.

- [ ] **Step 5: Run backend tests and local Compose validation**

Run:

```bash
cd backend && ./gradlew test && cd ..
docker compose -f docker-compose.local.yml config --quiet
docker compose -f docker-compose.yml config --quiet
```

Expected: tests pass and both Compose validations exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json docker-compose.yml docker-compose.local.yml start_dev.sh backend
git commit -m "refactor: rename backend namespace to riko"
```

---

### Task 2: Migrate Persistent `RICO_DEBUT_DATE` Data Safely

**Files:**
- Modify: `backend/src/main/java/com/riko/birthdaycafe/repository/UserRepository.java`
- Modify: `backend/src/main/java/com/riko/birthdaycafe/config/AchievementSeeder.java`
- Create: `backend/src/test/java/com/riko/birthdaycafe/config/AchievementSeederTests.java`

- [ ] **Step 1: Write a failing integration test**

Create a test that:

1. Inserts an achievement with code `RICO_DEBUT_DATE`.
2. Inserts a user whose `activeAchievementCode` is `RICO_DEBUT_DATE`.
3. Runs `AchievementSeeder`.
4. Verifies the same achievement row now has code `RIKO_DEBUT_DATE`.
5. Verifies the user's active code is `RIKO_DEBUT_DATE`.
6. Verifies no `RICO_DEBUT_DATE` achievement remains.

The core assertions must be:

```java
assertThat(achievementRepository.findByCode("RIKO_DEBUT_DATE")).isPresent();
assertThat(achievementRepository.findByCode("RICO_DEBUT_DATE")).isEmpty();
assertThat(userRepository.findByUsername("legacy-user"))
    .get()
    .extracting(User::getActiveAchievementCode)
    .isEqualTo("RIKO_DEBUT_DATE");
```

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
cd backend
./gradlew test --tests '*AchievementSeederTests'
```

Expected: FAIL because the legacy code is not migrated.

- [ ] **Step 3: Add the repository query**

Add to `UserRepository`:

```java
List<User> findAllByActiveAchievementCode(String activeAchievementCode);
```

Add the required `java.util.List` import.

- [ ] **Step 4: Implement transactional code migration before seeding**

At the start of `AchievementSeeder.run`, call:

```java
migrateAchievementCode("RICO_DEBUT_DATE", "RIKO_DEBUT_DATE");
```

Implement the method so that it:

- returns immediately if the old code is absent;
- throws if both old and new codes exist, preventing silent duplicate merging;
- updates every matching `users.active_achievement_code`;
- changes the existing achievement entity's code, preserving its ID and all `user_achievements` foreign keys;
- saves users before saving the achievement.

Change the seed declaration to:

```java
seedAchievement("RIKO_DEBUT_DATE", "관리자 권한에 접근한 자", "정답은 리코 데뷔 날짜였습니다~", "Eye");
```

- [ ] **Step 5: Run focused and full backend tests**

Run:

```bash
./gradlew test --tests '*AchievementSeederTests'
./gradlew test
```

Expected: both commands finish with `BUILD SUCCESSFUL`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/main backend/src/test
git commit -m "feat: migrate legacy rico achievement code"
```

---

### Task 3: Migrate Frontend Identifiers Without Losing Browser Preferences

**Files:**
- Create: `frontend/src/utils/storageMigration.ts`
- Create: `frontend/src/utils/storageMigration.test.ts`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/store/useAudioStore.ts`
- Modify: `frontend/src/utils/pageTransitionLoading.ts`
- Modify: `frontend/src/components/auth/AdminModal.tsx`
- Modify: `frontend/src/components/common/achievementIcons.ts`
- Modify: `frontend/src/index.css`
- Modify: `frontend/tailwind.config.js`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] **Step 1: Add Vitest for the small storage migration unit**

Run:

```bash
cd frontend
npm install --save-dev vitest jsdom
```

Add:

```json
"test": "vitest run"
```

to `frontend/package.json` scripts.

- [ ] **Step 2: Write failing storage migration tests**

Test these cases:

```typescript
it("moves the legacy audio preference when the new key is absent", () => {
  localStorage.setItem("rico-audio-settings", '{"state":{"isMuted":true}}');
  migrateRikoStorage();
  expect(localStorage.getItem("riko-audio-settings")).toBe(
    '{"state":{"isMuted":true}}',
  );
  expect(localStorage.getItem("rico-audio-settings")).toBeNull();
});

it("keeps the new preference when both keys exist", () => {
  localStorage.setItem("rico-audio-settings", "legacy");
  localStorage.setItem("riko-audio-settings", "current");
  migrateRikoStorage();
  expect(localStorage.getItem("riko-audio-settings")).toBe("current");
  expect(localStorage.getItem("rico-audio-settings")).toBeNull();
});
```

- [ ] **Step 3: Verify the tests fail**

Run:

```bash
npm test -- storageMigration.test.ts
```

Expected: FAIL because `migrateRikoStorage` does not exist.

- [ ] **Step 4: Implement and invoke storage migration**

Implement:

```typescript
const STORAGE_KEY_MIGRATIONS = [
  ["rico-audio-settings", "riko-audio-settings"],
] as const;

export const migrateRikoStorage = () => {
  for (const [legacyKey, currentKey] of STORAGE_KEY_MIGRATIONS) {
    const legacyValue = window.localStorage.getItem(legacyKey);
    if (
      legacyValue !== null &&
      window.localStorage.getItem(currentKey) === null
    ) {
      window.localStorage.setItem(currentKey, legacyValue);
    }
    window.localStorage.removeItem(legacyKey);
  }
};
```

Call `migrateRikoStorage()` in `frontend/src/main.tsx` before React renders.

- [ ] **Step 5: Rename active frontend identifiers**

Apply:

```text
rico-audio-settings -> riko-audio-settings
rico:page-transition-loading-change -> riko:page-transition-loading-change
__RICO_PAGE_TRANSITION_LOADING__ -> __RIKO_PAGE_TRANSITION_LOADING__
RICO_DEBUT_DATE -> RIKO_DEBUT_DATE
--color-rico- -> --color-riko-
Tailwind colors.rico -> colors.riko
```

Change the obsolete fallback in `frontend/src/utils/api.ts` to:

```typescript
const PRODUCTION_API_BASE_URL =
  "https://riko-birthday-cafe.duckdns.org/api";
```

- [ ] **Step 6: Run frontend verification**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: tests pass, lint exits 0, and Vite build succeeds.

- [ ] **Step 7: Scan active code for incorrect identifiers**

Run:

```bash
rg -n 'RICO_DEBUT_DATE|rico-audio|__RICO|rico:page|color-rico|colors:\s*\{\s*rico' \
  frontend/src frontend/tailwind.config.js
```

Expected: no matches.

- [ ] **Step 8: Commit**

```bash
git add frontend
git commit -m "refactor: migrate frontend identifiers to riko"
```

---

### Task 4: Define the Home Environment Contract

**Files:**
- Modify: `.gitignore`
- Create: `.env.home.example`
- Create: `scripts/home-server-common.sh`

- [ ] **Step 1: Extend ignored runtime paths**

Add:

```gitignore
.env.home
backups/home/
caddy-data/
caddy-config/
```

- [ ] **Step 2: Create the environment example**

Create `.env.home.example` with empty secret values and fixed non-secret values:

```dotenv
POSTGRES_DB=riko_birthday_cafe_db
POSTGRES_USER=riko_user
POSTGRES_PASSWORD=
JWT_SECRET_PROD=
JWT_SECRET_DEV=
ADMIN_PASSCODE_HASH=
DUCKDNS_TOKEN=
PROD_ALLOWED_ORIGINS=https://riko-birthday-cafe.duckdns.org,https://riko-birthday-cafe.netlify.app
DEV_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://dev--riko-birthday-cafe.netlify.app,https://dev-riko-birthday-cafe.duckdns.org
```

- [ ] **Step 3: Implement shared validation**

`scripts/home-server-common.sh` must:

- resolve the repository root;
- set `COMPOSE_FILE=docker-compose.home.yml`;
- require `.env.home`;
- reject empty values for all secret variables;
- reject `JWT_SECRET_PROD == JWT_SECRET_DEV`;
- expose `compose()` as `docker compose --env-file "$ROOT/.env.home" -f "$ROOT/docker-compose.home.yml"`;
- wait up to 120 seconds for `docker info`.

- [ ] **Step 4: Verify missing-secret failure**

Run:

```bash
cp .env.home.example .env.home
bash -c 'source scripts/home-server-common.sh; validate_home_env'
rm .env.home
```

Expected: non-zero exit with a message naming the first empty required variable.

- [ ] **Step 5: Commit**

```bash
git add .gitignore .env.home.example scripts/home-server-common.sh
git commit -m "feat: define home server environment contract"
```

---

### Task 5: Build the Isolated Home Docker Stack

**Files:**
- Create: `docker-compose.home.yml`
- Create: `Caddyfile.home`

- [ ] **Step 1: Create the Compose services**

Define these exact services:

- `db`
  - image `postgres:18`;
  - container `riko-postgres`;
  - no host ports;
  - volume `riko_postgres_data:/var/lib/postgresql`;
  - healthcheck with `pg_isready`;
  - JSON log limit `10m`, 3 files.
- `backend-prod`
  - container `riko-backend-prod`;
  - build `backend/Dockerfile`;
  - datasource `jdbc:postgresql://db:5432/${POSTGRES_DB}?currentSchema=prod`;
  - `SPRING_PROFILES_ACTIVE=prod`;
  - no host ports;
  - healthcheck against `/actuator/health`;
  - depend on healthy DB.
- `backend-dev`
  - same image/build;
  - `currentSchema=dev`;
  - `SPRING_PROFILES_ACTIVE=dev`;
  - no host ports.
- `caddy`
  - image `caddy:2-alpine`;
  - container `riko-caddy`;
  - host ports `80:80`, `443:443`, `443:443/udp`;
  - mount `Caddyfile.home` read-only;
  - named volumes for `/data` and `/config`.
- `duckdns-dev`
  - image `curlimages/curl:8.16.0`;
  - update only `dev-riko-birthday-cafe`;
  - run every 300 seconds.
- `duckdns-prod`
  - same image;
  - profile `production-domain`;
  - update only `riko-birthday-cafe`;
  - run every 300 seconds.

All services use a private bridge network named `riko-home`.

- [ ] **Step 2: Create Caddy routing**

Create:

```caddyfile
dev-riko-birthday-cafe.duckdns.org {
	reverse_proxy backend-dev:8080
}

riko-birthday-cafe.duckdns.org {
	reverse_proxy backend-prod:8080
}
```

- [ ] **Step 3: Validate Compose without starting**

Create a temporary `.env.home` with generated non-production test secrets:

```bash
cp .env.home.example .env.home
sed -i '' "s/^POSTGRES_PASSWORD=$/POSTGRES_PASSWORD=$(openssl rand -hex 24)/" .env.home
sed -i '' "s/^JWT_SECRET_PROD=$/JWT_SECRET_PROD=$(openssl rand -base64 48 | tr -d '\\n')/" .env.home
sed -i '' "s/^JWT_SECRET_DEV=$/JWT_SECRET_DEV=$(openssl rand -base64 48 | tr -d '\\n')/" .env.home
sed -i '' 's|^ADMIN_PASSCODE_HASH=$|ADMIN_PASSCODE_HASH=$2y$10$VPiKhqcvf7SWXd1oCV2qSe7utOCjIuYZt6W5JBYfHm0igVdTJDyt2|' .env.home
sed -i '' 's/^DUCKDNS_TOKEN=$/DUCKDNS_TOKEN=compose-validation-only/' .env.home
docker compose --env-file .env.home -f docker-compose.home.yml config --quiet
rm .env.home
```

Expected: Compose exits 0.

- [ ] **Step 4: Assert minimal port exposure**

Run:

```bash
docker compose --env-file .env.home.example -f docker-compose.home.yml config |
  rg 'published:'
```

Expected: only ports `80` and `443` are published.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.home.yml Caddyfile.home
git commit -m "feat: add isolated home server stack"
```

---

### Task 6: Add Start, Stop, Backup, Restore, and Verify Scripts

**Files:**
- Create: `scripts/home-server-start.sh`
- Create: `scripts/home-server-stop.sh`
- Create: `scripts/home-server-backup.sh`
- Create: `scripts/home-server-restore.sh`
- Create: `scripts/home-server-verify.sh`

- [ ] **Step 1: Implement start behavior**

`home-server-start.sh` must:

- source `home-server-common.sh`;
- accept only optional `--production-domain`;
- start Docker Desktop with `open -a Docker` when needed;
- validate `.env.home`;
- start default services without the production DuckDNS profile;
- include `--profile production-domain` only when requested;
- wait for PostgreSQL and both backend healthchecks;
- print the active domain mode.

- [ ] **Step 2: Implement backup behavior**

`home-server-backup.sh` must:

- create `backups/home`;
- verify `riko-postgres` is healthy;
- run `pg_dump --format=custom --no-owner --no-acl`;
- set `timestamp="$(date +%Y%m%d-%H%M%S)"` and write
  `riko_birthday_cafe_db-${timestamp}.dump`;
- write a matching `.sha256` using `shasum -a 256`;
- verify the checksum immediately;
- retain the newest seven `.dump` files and their checksum files;
- never delete old backups if dump or checksum verification fails.

- [ ] **Step 3: Implement guarded restore behavior**

`home-server-restore.sh` must:

- require one existing `.dump` argument;
- verify its `.sha256`;
- require the user to type `RESTORE riko_birthday_cafe_db`;
- stop both backends;
- drop and recreate the DB through the PostgreSQL maintenance database;
- restore with `pg_restore --clean --if-exists --no-owner --no-acl`;
- restart both backends;
- invoke `home-server-verify.sh`.

- [ ] **Step 4: Implement stop behavior**

`home-server-stop.sh` must:

- accept `--skip-backup`;
- run backup by default;
- call Compose with `--profile production-domain down`;
- preserve named volumes.

- [ ] **Step 5: Implement verification behavior**

`home-server-verify.sh` must check:

```text
PostgreSQL readiness
backend-prod health from inside the Docker network
backend-dev health from inside the Docker network
prod/dev/public schema existence
exact row counts for users, achievements, user_achievements,
asparagus_scores, and adventure_scores when present
host published ports limited to 80 and 443
```

It must exit non-zero on any failed health or exposure check.

- [ ] **Step 6: Shell syntax and static checks**

Run:

```bash
chmod +x scripts/home-server-*.sh
bash -n scripts/home-server-common.sh
bash -n scripts/home-server-start.sh
bash -n scripts/home-server-stop.sh
bash -n scripts/home-server-backup.sh
bash -n scripts/home-server-restore.sh
bash -n scripts/home-server-verify.sh
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit**

```bash
git add scripts
git commit -m "feat: add home server operations scripts"
```

---

### Task 7: Create the Operational Runbook

**Files:**
- Create: `docs/HOME_SERVER_RUNBOOK.md`
- Modify: `CLAUDE.md`
- Modify: `PROJECT_SPEC.md`
- Modify: `backend/DEPLOY_GCP.md`

- [ ] **Step 1: Document routine operation**

Include exact commands:

```bash
./scripts/home-server-start.sh
./scripts/home-server-start.sh --production-domain
./scripts/home-server-backup.sh
./scripts/home-server-stop.sh
```

Document that the Mac display may turn off, but system sleep must stay disabled while serving.

- [ ] **Step 2: Document one-time secret creation**

Document:

```bash
cp .env.home.example .env.home
openssl rand -hex 24
openssl rand -base64 48
```

Require:

- a new DB password;
- separate new production and development JWT secrets;
- a newly generated admin bcrypt hash;
- the existing DuckDNS token;
- no reuse of values exposed in the prior conversation.

- [ ] **Step 3: Document router and firewall rules**

State:

```text
TCP 80  -> reserved MacBook LAN IP port 80
TCP 443 -> reserved MacBook LAN IP port 443
UDP 443 -> optional, only for HTTP/3
```

Explicitly prohibit forwarding 5432, 8000, 8001, 8080, 22, 3389, or macOS screen-sharing ports.

- [ ] **Step 4: Mark GCP docs historical and update current project naming**

Add a warning to `backend/DEPLOY_GCP.md` that it describes the retired environment.
Update active documentation from `rico` to `riko`, while retaining historical GCP resource names where commands need them.

- [ ] **Step 5: Verify documentation names**

Run:

```bash
rg -n 'rico' CLAUDE.md PROJECT_SPEC.md docs/HOME_SERVER_RUNBOOK.md \
  package.json docker-compose*.yml scripts backend/src frontend/src
```

Expected: matches are limited to explicit legacy migration aliases and historical GCP identifiers.

- [ ] **Step 6: Commit**

```bash
git add docs/HOME_SERVER_RUNBOOK.md CLAUDE.md PROJECT_SPEC.md backend/DEPLOY_GCP.md
git commit -m "docs: add home server operations runbook"
```

---

### Task 8: Run a Disposable Local PostgreSQL 18 Restore Rehearsal

**Files:**
- No committed file changes expected.

- [ ] **Step 1: Obtain a non-final GCP dump while services remain online**

On GCP:

```bash
docker exec riko-postgres pg_dump \
  -U riko_user \
  -d riko_birthday_cafe_db \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=/tmp/riko-rehearsal.dump
docker cp riko-postgres:/tmp/riko-rehearsal.dump /home/deploy/riko-rehearsal.dump
sha256sum /home/deploy/riko-rehearsal.dump
```

Record the checksum in the migration log.

- [ ] **Step 2: Transfer and verify**

From the MacBook:

```bash
scp deploy@34.169.16.108:/home/deploy/riko-rehearsal.dump backups/home/
shasum -a 256 backups/home/riko-rehearsal.dump
```

Expected: checksum equals the GCP checksum.

- [ ] **Step 3: Restore into a disposable PostgreSQL 18 container**

Run:

```bash
docker run --name riko-restore-rehearsal \
  -e POSTGRES_PASSWORD=rehearsal-only \
  -e POSTGRES_DB=riko_birthday_cafe_db \
  -d postgres:18
until docker exec riko-restore-rehearsal pg_isready -U postgres; do sleep 2; done
docker cp backups/home/riko-rehearsal.dump riko-restore-rehearsal:/tmp/rehearsal.dump
docker exec riko-restore-rehearsal pg_restore \
  -U postgres \
  -d riko_birthday_cafe_db \
  --no-owner \
  --no-acl \
  /tmp/rehearsal.dump
```

- [ ] **Step 4: Compare schemas and exact row counts**

Run exact `count(*)` queries for all tables in `prod`, `dev`, and `public` on both GCP and the rehearsal container. Expected: every source and restored count matches.

- [ ] **Step 5: Remove only the disposable container**

Run:

```bash
docker rm -f riko-restore-rehearsal
```

Expected: the rehearsal dump remains in `backups/home`.

---

### Task 9: Verify the Development Domain on the Home Server

**Files:**
- Local secret file: `.env.home` (ignored)

- [ ] **Step 1: Populate fresh home secrets**

Create `.env.home` from the example. Use fresh values and never paste them into chat, Git, shell history, or documentation.

- [ ] **Step 2: Start the stack without production DuckDNS**

Run:

```bash
./scripts/home-server-start.sh
```

Expected: `duckdns-dev` runs; `duckdns-prod` does not run.

- [ ] **Step 3: Configure router forwarding**

In ipTIME, forward TCP 80 and TCP 443 to the DHCP-reserved MacBook IP. Do not add any other forwarding rule.

- [ ] **Step 4: Verify from a non-home network**

Using a phone with Wi-Fi disabled:

```bash
curl -fsS https://dev-riko-birthday-cafe.duckdns.org/actuator/health
```

Expected: JSON with `"status":"UP"`.

- [ ] **Step 5: Verify no direct service exposure**

From the non-home network, confirm connections fail for:

```text
home-public-ip:5432
home-public-ip:8000
home-public-ip:8001
home-public-ip:8080
```

- [ ] **Step 6: Exercise development behavior**

Verify:

- development Netlify preview loads;
- login works;
- existing dev users and achievements load after rehearsal data is restored;
- score and achievement writes persist;
- restarting `backend-dev` does not lose data.

---

### Task 10: Perform the Final Offline Data Cutover

**Files:**
- Runtime backup files under `backups/home/` (ignored)
- `.env.home` (ignored)

- [ ] **Step 1: Announce maintenance and stop GCP writers**

On GCP:

```bash
docker stop rico-backend-prod rico-backend-dev
```

Expected: PostgreSQL remains running and no application writes continue.

- [ ] **Step 2: Create the final custom-format dump**

On GCP:

```bash
FINAL_DUMP="/home/deploy/riko-final-$(date +%Y%m%d-%H%M%S).dump"
docker exec riko-postgres pg_dump \
  -U riko_user \
  -d riko_birthday_cafe_db \
  --format=custom \
  --no-owner \
  --no-acl > "$FINAL_DUMP"
sha256sum "$FINAL_DUMP" > "$FINAL_DUMP.sha256"
ls -lh "$FINAL_DUMP" "$FINAL_DUMP.sha256"
```

Expected: dump is non-empty and checksum file exists.

- [ ] **Step 3: Transfer to MacBook and external disk**

Transfer both files to `backups/home`, verify SHA-256, copy both to the attached external disk, and verify SHA-256 there. Do not proceed if the external disk is unavailable or either checksum differs.

- [ ] **Step 4: Restore into the home PostgreSQL 18 database**

Run:

```bash
FINAL_DUMP="$(ls -t backups/home/riko-final-*.dump | head -1)"
./scripts/home-server-restore.sh "$FINAL_DUMP"
```

Expected: the newest final dump is selected and restored.

- [ ] **Step 5: Verify exact data**

Compare exact row counts for all `prod`, `dev`, and `public` tables. Verify:

- 302 production users from the pre-cutover baseline, adjusted only for legitimate writes before maintenance;
- all production and development score rows;
- all user-achievement rows;
- foreign keys remain valid;
- `RICO_DEBUT_DATE` has migrated to `RIKO_DEBUT_DATE`;
- no user still has `active_achievement_code='RICO_DEBUT_DATE'`.

- [ ] **Step 6: Rotate secrets as part of the cutover**

Ensure `.env.home` contains only the fresh DB password, fresh production JWT secret, fresh development JWT secret, fresh admin bcrypt hash, and DuckDNS token. Restart both backends so all old JWTs become invalid.

---

### Task 11: Switch Production and Hold the GCP Rollback Window

**Files:**
- No committed changes expected.

- [ ] **Step 1: Activate production DuckDNS updates**

Run:

```bash
./scripts/home-server-start.sh --production-domain
```

Expected: both DuckDNS updater containers run.

- [ ] **Step 2: Confirm DNS and HTTPS externally**

From a non-home network:

```bash
curl -fsS https://riko-birthday-cafe.duckdns.org/actuator/health
curl -fsS https://dev-riko-birthday-cafe.duckdns.org/actuator/health
```

Expected: both return `UP` from the home server.

- [ ] **Step 3: Confirm Netlify requires no environment change**

Verify:

```text
Production = https://riko-birthday-cafe.duckdns.org
Deploy previews/branches = https://dev-riko-birthday-cafe.duckdns.org
```

Trigger a Netlify production deploy only if the frontend code changed during Tasks 1-3.

- [ ] **Step 4: Run production smoke tests**

Verify login, user profile, achievements, production score reads/writes, guest fallback with backend temporarily stopped, and recovery after restart.

- [ ] **Step 5: Stop the GCP VM**

After home production verification, stop the Compute Engine VM from GCP Console. Do not delete it yet.

- [ ] **Step 6: Observe for seven full days**

Once per day:

```bash
./scripts/home-server-verify.sh
./scripts/home-server-backup.sh
```

Record health, backup filename, checksum, free disk space, and any user-visible incident.

- [ ] **Step 7: Roll back if required**

If a blocking issue occurs:

1. stop home backends to prevent split writes;
2. start the GCP VM;
3. change both DuckDNS records back to `34.169.16.108`;
4. verify GCP health;
5. resume GCP backends;
6. preserve the home DB for later reconciliation.

---

### Task 12: Rename the Repository and Delete GCP Billing Resources

**Files:**
- Git remote configuration and local directory name.

- [ ] **Step 1: Rename the GitHub repository**

In GitHub repository settings, rename:

```text
rico-birthday-cafe -> riko-birthday-cafe
```

Then run:

```bash
git remote set-url origin https://github.com/my-ggott-games/riko-birthday-cafe.git
git remote -v
```

Expected: fetch and push URLs use `riko-birthday-cafe`.

- [ ] **Step 2: Rename the local directory after ending active tool sessions**

From `/Users/gminho/Github`:

```bash
mv rico-birthday-cafe riko-birthday-cafe
cd riko-birthday-cafe
git status
```

Expected: clean worktree in the renamed directory.

- [ ] **Step 3: Verify the final external backup**

Confirm the newest final dump exists on both MacBook and external disk and both SHA-256 values match.

- [ ] **Step 4: Delete GCP billable resources after seven successful days**

Delete in this order:

1. Compute Engine VM, selecting deletion of its boot disk.
2. Any unattached persistent disks.
3. Snapshots and machine images no longer required.
4. Reserved external IPv4 `34.169.16.108`.
5. Any remaining Cloud SQL instance, replica, and retained backup.
6. Artifact Registry/Container Registry images not needed elsewhere.
7. Cloud Storage buckets created for this service.
8. Load balancers, forwarding rules, target proxies, health checks, Cloud NAT, and unused addresses.
9. Secret Manager versions and paid logging/monitoring retention.

- [ ] **Step 5: Verify billing**

In GCP Billing Reports:

- filter by the project;
- verify no active billable SKU remains;
- check again after the next billing export/update cycle;
- close the GCP project only after confirming no shared resource depends on it.

- [ ] **Step 6: Final repository verification**

Run:

```bash
./backend/gradlew -p backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
docker compose --env-file .env.home -f docker-compose.home.yml config --quiet
git status --short
```

Expected: all tests/builds pass, Compose validates, and the worktree is clean.

- [ ] **Step 7: Commit final documentation updates**

```bash
git add docs CLAUDE.md PROJECT_SPEC.md
git commit -m "docs: complete home server migration"
```
