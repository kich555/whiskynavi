#!/usr/bin/env bash
# 페이지 문서 자동 갱신 + graphify 동기화
#
# 호출 모드:
# 1. Stop hook(Claude Code): 인자 없음, PAGE_DOCS_MODE 미설정.
#    작업 트리(미커밋+인덱스+워킹) diff 기준으로 "무엇이 바뀌었는지"만 pending 파일에 기록.
#    graphify update / claude -p 실행 없음 — 빠르게 종료해야 하는 경로.
# 2. git post-commit: PAGE_DOCS_MODE=postcommit.
#    HEAD~1..HEAD diff + pending 파일(누적된 미커밋 변경 기록)을 합쳐 실제 문서 재생성 수행.
#    같은 HEAD를 이미 처리했으면 스킵(dedup).
# 3. 수동: refresh-page-docs.sh <route-group> (예: admin/reservations)
#    즉시 강제 재생성.
#
# 동작(2, 3 모드):
# 1. 대상 그룹별 변경 파일 diff(HEAD~1..HEAD, 공백만 다른 파일은 제외)
# 2. graphify update . (AST-only, 무료)
# 3. claude -p 서브에이전트에 "diff만" 전달해 문서 부분 패치 (그룹별 병렬 실행)
#
# 비활성화: .claude/scripts/.skip-page-docs 파일 존재 시 스킵

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

STATE_DIR=".claude/scripts"
PENDING_FILE="$STATE_DIR/.pending-doc-groups"
LAST_COMMIT_FILE="$STATE_DIR/.last-doc-commit"

if [[ -f "$STATE_DIR/.skip-page-docs" ]]; then
  exit 0
fi

# 라우트 그룹 → 문서 매핑 (docs/pages/<그룹>.md)
group_docs_for_file() {
  local f="$1"
  case "$f" in
    src/app/admin/reservations/*)            echo "admin/reservations" ;;
    src/app/admin/products/*)                echo "admin/products" ;;
    src/app/admin/users/*)                   echo "admin/users" ;;
    src/app/admin/banners/*)                 echo "admin/banners" ;;
    src/app/admin/boards/*|src/app/admin/board-management-history*|src/app/admin/post-restrictions*) echo "admin/boards" ;;
    src/app/admin/businesses/*)              echo "admin/businesses" ;;
    src/app/admin/inquiries/*)               echo "admin/inquiries" ;;
    src/app/admin/general-items/*|src/app/admin/general-item-sales/*|src/app/admin/general-item-orders/*) echo "admin/general-items" ;;
    src/app/admin/bottle-orders/*)           echo "admin/bottle-orders" ;;
    src/app/admin/membership*)               echo "admin/membership" ;;
    src/app/admin/orders*)                   echo "admin/orders" ;;
    src/app/admin/blacklist*|src/app/admin/youtube*|src/app/admin/shipping-policy*|src/app/admin/manual-purchases/*) echo "admin/misc" ;;
    src/app/admin/page.tsx)                  echo "admin/misc" ;;
    src/app/admin/*)                         echo "admin/_index" ;;
    src/app/\(main\)/reservation/*)          echo "main/reservation" ;;
    src/app/\(main\)/archive/*)              echo "main/archive" ;;
    src/app/\(main\)/board/*)                echo "main/board" ;;
    src/app/\(main\)/general-items/*)        echo "main/general-items" ;;
    src/app/\(main\)/orders/*)               echo "main/orders" ;;
    src/app/\(main\)/my-page/*)              echo "main/my-page" ;;
    src/app/\(main\)/sign-*|src/app/\(main\)/find-password|src/app/nice/*) echo "main/auth" ;;
    src/app/\(main\)/page.tsx|src/app/\(main\)/about/*|src/app/\(main\)/brand/*|src/app/\(main\)/terms/*) echo "main/home" ;;
    src/app/\(main\)/*)                      echo "main/_index" ;;
    src/app/business/pickup-reservations/*)  echo "business/pickup-reservations" ;;
    src/app/business/page.tsx|src/app/business/members/*|src/app/business/statistics/*) echo "business/index" ;;
    src/app/business/*)                      echo "business/_index" ;;
    *) echo "" ;;
  esac
}

# 공백/포맷 차이만 있는 파일 걸러내기 (trivial diff 스킵)
has_meaningful_diff() {
  local base="$1" head="$2" file="$3"
  # 신규/삭제 파일은 항상 의미있음
  git cat-file -e "$base:$file" 2>/dev/null || return 0
  git cat-file -e "$head:$file" 2>/dev/null || return 0
  ! git diff --ignore-all-space --ignore-blank-lines --quiet "$base" "$head" -- "$file"
}

route_path_for_group() {
  echo "/$(echo "$1" | sed -e 's|^main/|(main)/|' -e 's|_index||')"
}

# ---- 모드 판별 ----

if [[ $# -ge 1 ]]; then
  MODE="manual"
elif [[ "${PAGE_DOCS_MODE:-}" == "postcommit" ]]; then
  MODE="postcommit"
else
  MODE="stop"
fi

# ---- Stop 모드: 빠르게 pending 파일에만 기록하고 종료 ----
if [[ "$MODE" == "stop" ]]; then
  mkdir -p "$STATE_DIR"
  {
    git diff --name-only HEAD 2>/dev/null
    git diff --name-only --cached 2>/dev/null
    git diff --name-only 2>/dev/null
  } | while IFS= read -r f; do
    [[ "$f" != src/app/* ]] && continue
    doc=$(group_docs_for_file "$f")
    [[ -n "$doc" ]] && echo "$doc"
  done | sort -u >> "$PENDING_FILE.tmp" 2>/dev/null || true

  if [[ -f "$PENDING_FILE.tmp" ]]; then
    cat "$PENDING_FILE" 2>/dev/null >> "$PENDING_FILE.tmp" || true
    sort -u "$PENDING_FILE.tmp" > "$PENDING_FILE"
    rm -f "$PENDING_FILE.tmp"
  fi
  exit 0
fi

# ---- postcommit / manual 모드: 실제 작업 ----

declare -A targets=()      # doc -> 1
declare -A target_files=() # doc -> "file1 file2 ..."

if [[ "$MODE" == "manual" ]]; then
  targets["$1"]=1
else
  # dedup: 이미 처리한 HEAD면 스킵
  current_head="$(git rev-parse HEAD 2>/dev/null || echo "")"
  if [[ -f "$LAST_COMMIT_FILE" && "$(cat "$LAST_COMMIT_FILE")" == "$current_head" ]]; then
    exit 0
  fi

  base="HEAD~1"
  git rev-parse --verify "$base" >/dev/null 2>&1 || base="$(git hash-object -t tree /dev/null)"

  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    [[ "$f" != src/app/* ]] && continue
    has_meaningful_diff "$base" HEAD "$f" || continue
    doc=$(group_docs_for_file "$f")
    [[ -z "$doc" ]] && continue
    targets["$doc"]=1
    target_files["$doc"]="${target_files[$doc]:-} $f"
  done < <(git diff --name-only "$base" HEAD)

  # Stop hook가 쌓아둔 pending 그룹도 합침 (커밋 전 마지막 diff에서 놓친 것 대비)
  if [[ -f "$PENDING_FILE" ]]; then
    while IFS= read -r doc; do
      [[ -z "$doc" ]] && continue
      targets["$doc"]=1
    done < "$PENDING_FILE"
  fi
fi

if [[ ${#targets[@]} -eq 0 ]]; then
  [[ "$MODE" == "postcommit" ]] && { mkdir -p "$STATE_DIR"; git rev-parse HEAD > "$LAST_COMMIT_FILE" 2>/dev/null || true; }
  exit 0
fi

echo "[page-docs] 갱신 대상: ${!targets[*]}"

if command -v graphify >/dev/null 2>&1; then
  echo "[page-docs] graphify update 실행"
  graphify update . >/dev/null 2>&1 || true
fi

# 그룹별 병렬 실행 — diff를 프롬프트에 직접 넘겨 전체 재탐색 대신 부분 패치 유도
mkdir -p "$STATE_DIR/.logs"
pids=()
for doc in "${!targets[@]}"; do
  (
    doc_path="docs/pages/${doc}.md"
    route_path="$(route_path_for_group "$doc")"
    files="${target_files[$doc]:-}"

    diff_context=""
    if [[ -n "$files" ]]; then
      diff_context="$(git diff "${base:-HEAD~1}" HEAD -- $files 2>/dev/null | head -c 8000)"
    fi

    if [[ -n "$diff_context" ]]; then
      prompt="다음 라우트 그룹의 페이지 문서를 diff 기반으로 부분 갱신하라: $route_path
기존 문서: $doc_path (없으면 신규 작성)
변경 diff:
\`\`\`diff
$diff_context
\`\`\`
지침:
- 위 diff가 실제로 건드린 동작/구조만 문서에 반영. 관련 없는 섹션은 그대로 둔다.
- diff만으로 맥락 부족하면 graphify query 또는 src/app/ 직독으로 보충
- docs/pages/admin/reservations.md 와 docs/pages/README.md 의 템플릿/원칙 준수
- 컴포넌트명/라인번호 배제, 뷰/기능/흐름/도메인 자연어 중심
- 출력: 해당 파일 직접 갱신"
    else
      prompt="다음 라우트 그룹의 페이지 문서를 갱신하라: $route_path
기존 문서: $doc_path (없으면 신규 작성)
지침:
- graphify query 로 현재 코드 기반 맥락 파악, 필요시 src/app/ 하위 직독
- docs/pages/admin/reservations.md 와 docs/pages/README.md 의 템플릿/원칙 준수
- 컴포넌트명/라인번호 배제, 뷰/기능/흐름/도메인 자연어 중심
- 출력: 해당 파일 직접 갱신"
    fi

    {
      echo "[page-docs] 재생성 시작: $doc_path (route: $route_path)"
      claude -p --permission-mode acceptEdits "$prompt" --output-format text 2>&1 | tail -5
      echo "[page-docs] 재생성 완료: $doc_path"
    } > "$STATE_DIR/.logs/${doc//\//_}.log" 2>&1 || true
  ) &
  pids+=($!)
done

for pid in "${pids[@]}"; do
  wait "$pid" || true
done

for doc in "${!targets[@]}"; do
  cat "$STATE_DIR/.logs/${doc//\//_}.log" 2>/dev/null || true
done
rm -rf "$STATE_DIR/.logs"

if [[ "$MODE" == "postcommit" ]]; then
  rm -f "$PENDING_FILE"
  git rev-parse HEAD > "$LAST_COMMIT_FILE" 2>/dev/null || true
fi

echo "[page-docs] 완료"
exit 0
