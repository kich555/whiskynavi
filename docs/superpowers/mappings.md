# 설계 문서 ↔ 코드 매핑 및 graphify 탐색 노트

> 2026-07-19 graphify 탐색(4634 nodes, 10296 edges, 286 communities) 결과를 바탕으로 작성.
> 목적: graphify가 잡지 못하는 설계 문서 ↔ 코드 연결을 명시하고, 라벨링 불일치 사례를 기록하여 향후 탐색 시 혼선을 줄인다.

## 1. 설계 문서 ↔ 구현 코드 매핑

graphify는 `docs/superpowers/plans|specs/*.md`를 코드와 연결하지 못한다(AST가 마크다운 링크를 엣지로 취급하지 않음). 아래 테이블이 그 갭을 채운다.

| 설계 문서 | 상태 | 구현 위치 | 비고 |
|---|---|---|---|
| `plans/2026-04-12-auth-refactor.md` | ✅ 완료 | `src/apis/mutator.ts` (`customFetch`, `withToken`), `src/lib/auth.ts` (`getAuthToken`), `src/apis/errors.ts` (`RefreshResult`) | graphify god node #1/#3와 정확히 대응 |
| `plans/2026-04-26-admin-businesses.md` | ✅ 완료 | `src/app/admin/businesses/**` | 관리자 CRUD |
| `plans/2026-04-26-business-pickup-reservations-tdd.md` | ✅ 완료 | `src/app/(main)/reservation/**` | 3편으로 분리된 TDD 스펙 |
| `plans/2026-04-26-pickup-reservations-mutations.md` | ✅ 완료 | `src/app/(main)/reservation/_lib/actions.ts` | Server Actions |
| `plans/2026-04-26-pickup-reservations-pages.md` | ✅ 완료 | `src/app/(main)/reservation/**` 페이지 | RSC + client 분리 |
| `plans/2026-05-03-admin-business-members.md` | ✅ 완료 | `src/app/admin/businesses/members/**` | |
| `plans/2026-05-03-admin-users-search-filter.md` | ✅ 완료 | `src/app/admin/users/**` | 필터 드롭다운 |
| `plans/2026-05-03-find-password.md` | ✅ 완료 | `src/app/(main)/find-password/**` | |
| `plans/2026-05-10-admin-users-role-filters.md` | ✅ 완료 | `src/app/admin/users/**` | |
| `plans/2026-05-23-cart-shipping.md` | ✅ 완료 | `src/app/(main)/cart/**`, Toss Payments 연동 | |
| `plans/2026-06-14-board-user-ui.md` | ✅ 완료 | `src/app/(main)/board/**` | 커뮤니티 UI |
| `plans/2026-06-28-wysiwyg-editor.md` | ✅ 완료 | `PostForm.tsx`(TipTap), `src/lib/rich-text.ts`(sanitize-html), `PostDetailShell.tsx`(dangerouslySetInnerHTML) | 이중 XSS 방어, 테스트 포함 |

### 설계 문서와 연결된 핵심 산출물 (specs)
| 스펙 | 대응 코드 |
|---|---|
| `specs/2026-05-03-admin-business-members-design.md` | `admin/businesses/members/_components/**` |
| `specs/2026-05-03-find-password-design.md` | `(main)/find-password/**` |
| `specs/2026-05-23-cart-shipping-design.md` | `(main)/cart/**` |
| `specs/2026-06-14-board-user-ui-design.md` | `(main)/board/**` |
| `specs/2026-06-28-wysiwyg-editor-design.md` | `board/_components/PostForm.tsx` + `lib/rich-text.ts` |

---

## 2. graphify 라벨링 불일치 사례 (9건)

graphify는 커뮤니티 라벨을 다수 파일 기준으로 붙인다. 유틸리티 심볼이 도메인 커뮤니티에 흡수되면 라벨이 의미와 어긋난다. 향후 탐색 시 아래 심볼은 라벨 무시하고 실제 정의 파일 기준으로 해석할 것.

| 심볼 | graphify 라벨 | 실제 정의 위치 | 불일치 이유 |
|---|---|---|---|
| `cn()` | auth 관련 커뮤니티 | `src/lib/utils.ts` | Tailwind 클래스 병합 유틸. auth 파일들이 다수라 흡수됨 |
| `FormMessage` | membership 커뮤니티 | `src/components/ui/form-message.tsx` | 공용 폼 에러 표시 컴포넌트 |
| `useSidebar` | admin layout 커뮤니티 | `src/app/admin/_components/AdminLayoutClient.tsx` | 의도된 위치. 라벨은 맞으나 별도 훅으로 인식 안 됨 |
| `IconSearch` | board 커뮤니티 | `src/icons/index.tsx` (codegen) | 아이콘 래퍼. board에서 많이 써서 흡수 |
| `extractUserMessage` | auth 에러 커뮤니티 | `src/apis/errors.ts` | `getUserErrorMessage`와 같은 파일. 정상 |
| `withToken` | auth 커뮤니티 | `src/apis/mutator.ts` | god node #3. 라벨 정상이나 독립적 유틸 |
| `customFetch` | auth 커뮤니티 | `src/apis/mutator.ts` | god node #1. 위와 동일 |
| `sanitizeRichTextContent` | board 커뮤니티 | `src/lib/rich-text.ts` | 공용 라이브러리. board에서 최초 사용 |
| `sanitizePostContent` | board 커뮤니티 | `src/app/(main)/board/_lib/post-content.ts` | `rich-text.ts` thin wrapper. 정상 |

### 근본 원인
- AST가 컴포넌트 간접 참조(`IconSearch` → `search.svg`)를 엣지로 인식하지 못함
- 다수 파일 기반 라벨링이 공용 유틸을 도메인으로 끌어들임
- 마크다운 설계 문서 ↔ 코드 엣지 부재

### 권장 대응
- 탐색 시 라벨이 아닌 `source_file` 기준으로 심볼 위치 확인
- 공용 유틸(`src/lib/**`, `src/components/ui/**`)은 라벨 무시
- `graphify --update` 월간 갱신 권장 (TODO-10)

---

## 3. 그래프 헬스 노트

- **God nodes (6개)**: 모두 "의도적 중앙 추상화" — `customFetch`, `withToken`, `getUserErrorMessage`, Orval 생성 함수들. 커플링 문제 아님.
- **단일 컴포넌트**: 4444 nodes가 하나의 연결 컴포넌트. "2063 weakly-connected" 보고는 오해의 소지 있음 (실제 단절 3개 중 2개는 미사용 아이콘이었고 TODO-1에서 정리 완료).
- **Orval 코드gen (C0)**: 1411 nodes로 그래프 30%. 분할 검토는 고위험(TODO-8, 보류).
- **설계 문서 단절 (C59)**: 위 §1 매핑 테이블로 보완 완료.

---

## 관련 TODO

- TODO-1 ✅ 미사용 아이콘 정리 (commit `9d2cb51`)
- TODO-3 ✅ Wysiwyg 완료 검증 (commit `106022a`)
- TODO-4 ✅ 본 문서 §2 (라벨링 불일치 9건)
- TODO-5 ✅ 본 문서 §1 (설계 문서 ↔ 코드 매핑)
- TODO-9 ✅ ADR-0001 리치 텍스트 살균 레이어 분리 (`docs/adr/0001-rich-text-sanitize-layering.md`)
- TODO-2 ⏸ membership 기획 — GitHub 이슈 #82 (needs-triage)
- TODO-6, TODO-7, TODO-8, TODO-10: 별도 진행
