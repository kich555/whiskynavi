#!/usr/bin/env bash
# 하네스 훅 설치 — git post-commit 훅 활성화
# Codex/Claude Code 공통. Codex는 Stop hook 못 쓰므로 post-commit이 주 갱신 트리거.
#
# 설치: .claude/scripts/install-hooks.sh
# 제거: git config --unset core.hooksPath

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$REPO_ROOT"

# 훅 디렉토리 권한
chmod +x git-hooks/post-commit 2>/dev/null || true
chmod +x .claude/scripts/refresh-page-docs.sh 2>/dev/null || true

# core.hooksPath 지정
git config core.hooksPath git-hooks

echo "✓ git hooks 설치 완료"
echo "  core.hooksPath = git-hooks"
echo "  post-commit → 페이지 문서 갱신 + graphify update"
echo ""
echo "비활성화: .claude/scripts/.skip-page-docs 파일 생성"
echo "제거: git config --unset core.hooksPath"
