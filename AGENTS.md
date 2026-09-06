# WhiskyNavi Codex Instructions

## Project Context

- This repository is a WhiskyNavi web app using Next.js 16 App Router and React 19.
- Treat `CLAUDE.md` as the project runbook for build/test commands, architecture, and local conventions.
- Use Server Components by default for pages/layouts, and use `"use client"` only when client state, effects, browser APIs, or event handlers require it.
- Prefer Server Actions and App Router patterns for mutations and form workflows when they fit the existing code.

## Default Vercel Skill Lens

For any Codex request in this repository, including spec discussion, work planning, implementation, review, refactoring, debugging, and ordinary questions, proactively consider the following skills even when the user does not explicitly request them:

- `$vercel-react-best-practices`: apply when touching React components, Next.js pages/layouts, Server Components, data fetching, Server Actions, caching, bundle boundaries, Suspense, or performance-sensitive code. Pay special attention to avoiding request waterfalls, keeping client bundles small, minimizing RSC serialization, and using `startTransition` / `useDeferredValue` where appropriate.
- `$vercel-composition-patterns`: apply when designing or changing component APIs, reusable UI, providers, context boundaries, compound components, or components that risk boolean prop proliferation. Prefer composition and explicit variants over broad boolean-mode props. Account for React 19 APIs and conventions.
- `$vercel-react-view-transitions`: apply when discussing or implementing navigation animation, route transitions, shared element transitions, list reorder animation, enter/exit animation, or animated UI state changes. Use View Transitions only when they communicate continuity or spatial relationship; do not add animation without a clear purpose.

## How To Apply These Skills

- During spec discussion, surface relevant constraints from these skills as requirements or tradeoffs.
- During plan creation, include checks for applicable Vercel rules before proposing implementation steps.
- During execution, read the relevant rule/reference files before editing when the request touches the skill's domain.
- During review, use these skills as a default checklist for React/Next.js correctness, performance, component architecture, and transition behavior.
- Do not force all three skills into unrelated non-React tasks, but always evaluate whether a request in this repository has React/Next.js, component API, or transition implications.

## Typography Rule (mandatory)

This repo uses a custom `typo-{weight}-{size}` Tailwind typography system defined in `src/app/globals.css` (`@layer components`). **Never use Tailwind's default `text-xs` / `text-sm` classes anywhere in `src/`** — always use the `typo-*` equivalent. This applies to every agent (Codex, Claude, or other) working in this repository.

- Class shape: `typo-{weight}-{size}`
  - weight: `bold` (700), `medium` (500), `regular` (400)
  - size (px): `10, 12, 13, 14, 16, 18, 20, 22, 24, 30, 32, 36, 40`
  - Each class also sets `line-height: 1`.
- Default Tailwind size mapping:
  - `text-xs` (12px) → `typo-*-12`
  - `text-sm` (14px) → `typo-*-14`
- Choose the weight that matches the surrounding text (e.g. body text → `typo-medium-14`, section labels → `typo-bold-14`).
- Only use combos that are already defined in `globals.css`. If you need a missing weight/size combo, add the class to `src/app/globals.css` first; an undefined combo will not render its font size/weight.
- Responsive size overrides (e.g. `lg:text-base`) may be combined with `typo-*`.
- Exception: inside `src/components/ui/` (shadcn/ui components) leave existing classes as-is. Only migrate classNames you add at the call site.
- When reviewing or writing code, treat any `text-xs` / `text-sm` in `src/` as a defect to fix.

## Code Exploration — graphify 우선 (강제 불가, 자발적 준수)

Claude Code 환경에선 PreToolUse hook이 graphify 우선을 강제하지만, Codex는 hooks 미지원이라 자발적 준수. 효율성 이유로 권장:

- `graphify-out/graph.json` 이 존재하므로 **코드 탐색 전 `graphify query "<질문>"` 우선**. 스코프 좁은 서브그래프 반환 — grep보다 빠르고 정확.
- 관계 탐색: `graphify path "<A>" "<B>"`. 개념 설명: `graphify explain "<concept>"`.
- 구조 파악 후 필요 시 `src/` 파일 직독. 맥락 없이 grep/직독부터 하지 말 것.
- 코드 수정 후엔 `graphify update .` 로 그래프 동기화 (AST-only, 무료). post-commit 훅이 자동 실행.
- 구조적 질문(정의/호출처/영향도)은 `codegraph_*` MCP 도구 권장. 단 Codex에선 codegraph MCP 없을 수 있음 — graphify CLI로 폴백.

## 페이지 문서 자동 갱신

`docs/pages/` 에 프론트엔드 라우트별 맥락 문서 존재. `src/app/` 코드 변경 시 연관 문서 자동 갱신:

- **트리거**: git post-commit 훅 (`.claude/scripts/install-hooks.sh` 로 설치). Codex/Claude Code 공통.
- **스크립트**: `.claude/scripts/refresh-page-docs.sh` — 변경 라우트 감지 → 그룹 매핑 → `graphify update .` → `claude -p` 서브에이전트로 문서 재생성.
- **수동 갱신**: `.claude/scripts/refresh-page-docs.sh <route-group>` (예: `admin/reservations`).
- **비활성화**: `.claude/scripts/.skip-page-docs` 파일 생성.
- **템플릿/원칙**: `docs/pages/README.md` 참조. 뷰/기능/흐름/도메인 중심, 컴포넌트명/라인번호 배제.

문서 갱신이 커밋에 포함되지 않은 경우(별도 커밋 필요) 수동으로 `.claude/scripts/refresh-page-docs.sh` 실행 후 커밋.
