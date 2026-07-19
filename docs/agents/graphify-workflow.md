# graphify 워크플로

> 저장소 아키텍처 건전성 모니터링을 위한 정기 graphify 실행 가이드.

## 왜 정기 실행인가

graphify는 코드베이스트를 AST + semantic 지식 그래프로 구조화하여 god node, 커뮤니티 구조, 단절된 설계 문서, 라벨링 불일치를 보여준다. 코드베이스가 성장하면 이런 구조적 신호가 흐려지므로 정기 갱신이 필요하다.

## 월간 루틴 (매월 1일 또는 첫 영업일)

### 1. 증분 갱신

```bash
# graphify-out/ 가 있으면 증분 모드 (변경된 파일만 재추출)
/graphify . --update
```

전체 재구축이 필요한 경우(대규모 리팩터, graphify 버전업, 추출 스펙 변경):

```bash
/graphify . --force
```

### 2. GRAPH_REPORT.md 리뷰

갱신 후 `graphify-out/GRAPH_REPORT.md`의 다음 항목 확인:

- **God nodes 상위 10**: 새로운 god node가 생겼는지. 의도적 중앙 추상화(예: `customFetch`, `withToken`)인지 커플링 문제인지 판단.
- **커뮤니티 수 / 평균 크기**: 급격한 변화가 있으면 구조 재편 신호.
- **단절된 노드 / weakly-connected**: 미사용 코드 또는 설계 문서 단절 확인.
- **신규 순환 의존성** (있다면): `/graphify query "import cycles"`로 추적.

### 3. `docs/superpowers/mappings.md` 갱신

- §1(설계 문서 ↔ 코드 매핑): 신규 플랜/스펙 추가 시 테이블 갱신
- §2(라벨링 불일치): 새 불일치 사례 발견 시 추가
- §3(그래프 헬스): god node 수, 커뮤니티 수 갱신

### 4. 발견된 이슈 → GitHub 이슈화

- 미사용 코드 정리 → 별도 PR
- 구조적 문제(god node 급증, 순환 의존) → `/improve-codebase-architecture` 경로로 이슈화
- 설계 문서 단절 → mappings.md 갱신으로 보완

## 워크플로 산출물

- `graphify-out/graph.json` — 갱신된 그래프 (gitignored)
- `graphify-out/GRAPH_REPORT.md` — 갱신된 보고서 (gitignored)
- `docs/superpowers/mappings.md` — 갱신된 매핑 (커밋 대상)
- `docs/adr/` — 신규 아키텍처 결정 시 ADR 추가

## 비고

- `graphify-out/`은 gitignore 대상 (재생성 가능). 커밋하지 않는다.
- 정기 실행 외에도 대규모 리팩터/마이그레이션 전후에 실행 권장.
- `--watch` 모드는 개발 중 실시간 갱신용. 정기 루틴에는 불필요.
- Gemini API 키 설정 시 semantic 추출을 Gemini가 처리 (더 빠름). 미설정 시 호스트 에이전트가 처리.
