#!/usr/bin/env bash
# 페이지 문서 자동 갱신 + graphify 동기화
#
# 호출 모드:
# 1. Stop hook(Claude Code): 인자 없음. 작업 트리 diff(미커밋+인덱스+워킹) 기반
# 2. git post-commit: 인자 없음. 환경변수 PAGE_DOCS_MODE=postcommit 시 HEAD~1..HEAD 기반
# 3. 수동: refresh-page-docs.sh <route-group>  (예: admin/reservations)
#
# 동작:
# 1. 모드별 diff로 src/app/ 하위 변경 파일 감지
# 2. 라우트 그룹 → 문서 매핑
# 3. graphify update . (AST-only, 무료)
# 4. claude -p 서브에이전트로 각 문서 재생성
#
# 비활성화: .claude/scripts/.skip-page-docs 파일 존재 시 스킵

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

if [[ -f .claude/scripts/.skip-page-docs ]]; then
  exit 0
fi

# 모드별 변경 파일 추출
changed_app_files() {
  if [[ "${PAGE_DOCS_MODE:-}" == "postcommit" ]]; then
    # post-commit: 방금 커밋된 내용 (HEAD~1..HEAD). 첫 커밋이면 HEAD 기준 전체
    if git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
      git diff --name-only HEAD~1 HEAD
    else
      git diff --name-only --root HEAD
    fi
  else
    # Stop hook / 수동: 작업 트리 전체 diff
    git diff --name-only HEAD 2>/dev/null
    git diff --name-only --cached 2>/dev/null
    git diff --name-only 2>/dev/null
  fi
}

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

# 대상 문서 수집
declare -A targets=()
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  [[ "$f" != src/app/* ]] && continue
  doc=$(group_docs_for_file "$f")
  [[ -n "$doc" ]] && targets["$doc"]=1
done < <(changed_app_files)

# 인자로 강제 지정
if [[ $# -ge 1 ]]; then
  targets=()
  targets["$1"]=1
fi

if [[ ${#targets[@]} -eq 0 ]]; then
  exit 0
fi

echo "[page-docs] 갱신 대상: ${!targets[*]}"

# graphify 동기화 (AST-only, 무료)
if command -v graphify >/dev/null 2>&1; then
  echo "[page-docs] graphify update 실행"
  graphify update . >/dev/null 2>&1 || true
fi

# Claude CLI 서브에이전트로 문서 재생성
for doc in "${!targets[@]}"; do
  doc_path="docs/pages/${doc}.md"
  route_path="/$(echo "$doc" | sed 's|^main/|(main)/; s|_index||')"
  echo "[page-docs] 재생성: $doc_path (route: $route_path)"

  claude -p --permission-mode acceptEdits \
    "다음 라우트 그룹의 페이지 문서를 갱신하라: $route_path
기존 문서: $doc_path (없으면 신규 작성)
지침:
- graphify query 로 현재 코드 기반 맥락 파악, 필요시 src/app/ 하위 직독
- docs/pages/admin/reservations.md 와 docs/pages/README.md 의 템플릿/원칙 준수
- 컴포넌트명/라인번호 배제, 뷰/기능/흐름/도메인 자연어 중심
- 공용 컴포넌트는 동작 방식(router.back vs push, URL 동기화 등) 명시
- 코드 변경 사항이 문서에 반영되도록 갱신
- 출력: 해당 파일 직접 갱신" \
    --output-format text 2>&1 | tail -5 || true
done

echo "[page-docs] 완료"
exit 0
