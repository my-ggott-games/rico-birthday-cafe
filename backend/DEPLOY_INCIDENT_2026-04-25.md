# Deployment Incident Report

## 개요

2026-04-25 배포 실패의 1차 원인은 애플리케이션 빌드 실패가 아니라, 서버 디스크 용량 부족으로 인해 Docker가 마지막 메타데이터 파일을 기록하지 못한 것이었다.

이후 디스크 정리 후 재배포를 진행했으며, 그 다음 단계에서는 `dev` 컨테이너 내부 애플리케이션 기동 상태를 별도로 점검해야 하는 상황이 있었다.

---

## 1차 배포 오류 원인

### 에러 로그

```text
write /tmp/.tmp-compose-build-metadataFile-...: no space left on device
```

### 원인 요약

- Docker 이미지 빌드 자체는 성공했다.
- 실패 지점은 `resolving provenance for metadata file` 단계였다.
- `/tmp`에 메타데이터 파일을 쓰는 순간 디스크 공간 부족이 발생했다.
- 서버의 루트 파티션(`/`)이 사실상 가득 찬 상태였다.

### 확인된 상태

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       9.7G  9.2G  5.9M 100% /
```

즉, `/tmp` 문제처럼 보였지만 실제 원인은 `/tmp`가 올라간 루트 파티션 전체 용량 부족이었다.

---

## 해결 방법

### 1. 디스크 사용량 확인

```bash
df -h
docker system df
sudo du -xhd1 / | sort -h
sudo du -xhd1 /var | sort -h
sudo du -xhd1 /var/lib | sort -h
sudo du -xhd1 /var/log | sort -h
```

### 2. Docker 정리

```bash
docker builder prune -a -f
docker image prune -a -f
docker container prune -f
docker system df
```

### 3. 로그 및 캐시 정리

```bash
sudo journalctl --disk-usage
sudo journalctl --vacuum-time=7d
sudo journalctl --vacuum-size=100M
sudo apt clean
sudo apt autoremove -y
```

### 4. 실제로 크게 점유하던 항목 정리

정리 전 확인 결과, Docker보다 `google-cloud-ops-agent` 로그가 더 큰 비중을 차지하고 있었다.

대표적으로 확인된 파일:

```text
/var/log/google-cloud-ops-agent/subagents/logging-module-2026-04-16T14-55-25.989.log  419MB
/var/log/google-cloud-ops-agent/subagents/logging-module.log                           151MB
/var/log/syslog.1                                                                        87MB
```

정리 시 사용한 접근:

- 오래된 `google-cloud-ops-agent` 로그 삭제
- 활성 로그는 필요 시 `truncate`
- `syslog.1` 등 회전된 로그 정리
- `apt` 캐시 정리

---

## 정리 후 상태

### 루트 디스크

```text
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1       9.7G  6.7G  2.5G  73% /
```

### Docker 사용량

```text
TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          3         1         1.272GB   422.5MB
Containers      2         2         180.2kB   0B
Local Volumes   0         0         0B        0B
Build Cache     0         0         0B        0B
```

### 로그 사용량

```text
/var/log  43M
```

정리 후에는 동일한 종류의 `no space left on device` 오류를 유발하던 직접 원인은 해소되었다.

---

## 현재 서버 / 인스턴스 스펙

대화 중 실제로 확인된 정보만 정리한다.

### 파일시스템

```text
Root disk (/dev/sda1): 9.7G
EFI partition (/dev/sda15): 124M
```

### 메모리 관련 단서

`df -h` 기준 tmpfs/udev 수치:

```text
udev   2.0G
tmpfs  2.0G (/dev/shm)
tmpfs  393M (/run, /run/user/1000)
```

이는 시스템 메모리가 아주 크지 않은 소형 인스턴스일 가능성을 시사하지만, 정확한 RAM / vCPU / 머신 타입은 이번 점검 로그만으로 확정하지 않았다.

### 주요 디스크 사용 분포

정리 전후 조사 기준:

```text
/usr                 2.5G
/var                 2.2G ~ 3.9G
/var/lib             1.4G ~ 2.8G
/var/lib/containerd  1.2G
/var/log             최대 895M, 정리 후 43M
/home                277M
```

### 현재 판단

- 루트 디스크 10GB 미만은 Docker 기반 배포 서버로는 작은 편이다.
- 현재 정리 후 운영은 가능하지만, 로그/이미지 누적으로 다시 빠르게 찰 수 있다.
- 장기적으로는 디스크 증설이 가장 확실한 재발 방지책이다.

---

## 재발 방지 권장사항

### 운영 권장

- 디스크를 최소 20GB 이상으로 증설
- `google-cloud-ops-agent` 로그 회전 정책 점검
- Docker 캐시 정리 주기화
- 저널 로그 보관량 제한

### 주기 점검 명령어

```bash
df -h
docker system df
sudo du -sh /var/log
sudo journalctl --disk-usage
sudo find /var/log -type f -size +50M -ls
```

### 정리 명령어 예시

```bash
docker builder prune -a -f
docker image prune -a -f
docker container prune -f
sudo journalctl --vacuum-size=100M
sudo apt clean
```

---

## 추가 메모

- `google-cloud-ops-agent`는 당시 정상 실행 중이었고, 점검 시점의 활성 로그 크기는 작았다.
- 따라서 문제는 에이전트 설치 자체보다는 특정 시점의 로그 폭증 또는 회전 전 누적 가능성이 높다.
- 향후 동일 장애 재발 시 가장 먼저 `df -h`와 `/var/log/google-cloud-ops-agent`를 확인하는 것이 좋다.
