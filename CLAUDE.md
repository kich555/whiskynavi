# WhiskyNavi

위스키 정보 플랫폼. Next.js 16 App Router 기반, 관리자 대시보드 포함.

## 빌드 & 테스트

- `pnpm dev` — 개발 서버 (Turbopack)
- `pnpm build` — 프로덕션 빌드
- `pnpm lint` — ESLint
- `pnpm format` — Prettier 포매팅
- `pnpm gen:api` — OpenAPI에서 API 클라이언트 재생성 (Orval)
- `pnpm gen:icons` — SVG 아이콘 생성

## 아키텍처

- **App Router** 라우트 그룹: `(main)/` (사용자), `admin/` (관리자, 인증 필요)
- **API 레이어**: Orval 자동 생성 (`src/apis/generated/`) + 커스텀 mutator (토큰 리프레시, 에러 핸들링)
- **인증**: NextAuth.js v4 JWT (Credentials + Google + Kakao + Naver), 25분 간격 토큰 리프레시
- **DB 없음**: 모든 데이터는 `https://api.whiskynavi.com` 원격 백엔드에서 fetch
- **UI**: shadcn/ui + Radix UI + Tailwind CSS 4 + Framer Motion

## React / Next.js 최신 패턴 적극 사용

- **Server Components** 기본: 페이지/레이아웃은 서버 컴포넌트로 작성, 클라이언트 상태가 필요한 경우에만 `"use client"` 사용
- **Server Actions**: 폼 제출, 데이터 변경은 `"use server"` 서버 액션으로 처리
- **React 19 hooks**: `useActionState`, `useFormStatus`, `useOptimistic` 등 최신 hook 적극 활용
- **Streaming & Suspense**: 데이터 페칭 시 `<Suspense>` 경계와 loading.tsx 활용
- 새 기능 구현 시 클라이언트 컴포넌트보다 서버 컴포넌트/서버 액션 우선 고려

## 코딩 규칙

- Prettier: double quotes, semi, trailing comma, printWidth 80
- ESLint: next/core-web-vitals + typescript + prettier
- `src/apis/generated/` 파일은 직접 수정 금지 (Orval 자동 생성)
- path alias: `@/*` → `./src/*`
- Tailwind 클래스 정렬: prettier-plugin-tailwindcss
- import 정렬: prettier-plugin-organize-imports

## 핵심 문서

- .claude/skills/admin-api-auth.md — 관리자 API 인증 패턴, 토큰 처리, Server Action 가이드
- .env.example — 필수 환경변수 목록

## Agent skills

### Issue tracker

이슈는 GitHub Issues(`kich555/whiskynavi`)에서 관리하며 `gh` CLI를 사용한다. 외부 PR은 triage 대상에 포함하지 않는다. 자세한 내용은 `docs/agents/issue-tracker.md` 참고.

### Triage labels

5가지 canonical 역할(needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix)을 이름 그대로 라벨로 사용한다. 자세한 내용은 `docs/agents/triage-labels.md` 참고.

### Domain docs

단일 컨텍스트 구조 — 저장소 루트에 `CONTEXT.md` + `docs/adr/`. 자세한 내용은 `docs/agents/domain.md` 참고.
