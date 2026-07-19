# ADR-0001: 리치 텍스트 살균(sanitize) 레이어 분리

- **Status**: Accepted
- **Date**: 2026-07-19
- **Decision owners**: WhiskyNavi maintainers
- **Related**: `docs/superpowers/plans/2026-06-28-wysiwyg-editor.md`, `docs/superpowers/mappings.md` §1

## Context

WYSIWYG 에디터(TipTap) 도입으로 게시글 본문이 HTML 문자열로 저장·렌더링된다. 본문은 `dangerouslySetInnerHTML`로 직접 DOM에 삽입되므로 XSS 위험이 있다. 살균 로직을 어디에 둘지, 그리고 재사용 가능한 형태로 어떻게 분리할지 결정이 필요했다.

## Decision

살균 로직을 **두 계층**으로 분리한다.

1. **공용 라이브러리 계층** — `src/lib/rich-text.ts`
   - `sanitizeRichTextContent(content)`: sanitize-html 기반 살균. HTML 엔티티 인코딩 우회(`decodeEncodedRichText`)까지 처리.
   - `richTextHasImage(content)`, `richTextHasContent(content)`: 살균된 결과 기반 보조 함수.
   - 도메인(게시글 등)에 종속되지 않는 공용 유틸. 향후 다른 리치 텍스트 도메인(댓글, 상품 설명 등)이 추가되어도 재사용.

2. **도메인 어댑터 계층** — `src/app/(main)/board/_lib/post-content.ts`
   - `sanitizePostContent(content)`: `sanitizeRichTextContent`를 그대로 위임하는 thin wrapper.
   - `buildPostPayload(input)`: 게시글 도메인 지식(hasImage 계산, `CreatePostRequest` 조립)을 담당.

서버 액션(`board/_lib/actions.ts`)은 `buildPostPayload`를 호출해 API에 전송할 payload를 만든다. 클라이언트는 살균에 관여하지 않는다(서버에서만 살균 = 단일 신뢰 경계).

## Rationale

- **신뢰 경계 단일화**: 살균은 서버에서만. 클라이언트(브라우저)는 신뢰할 수 없으므로 서버 액션에서 최종 살균한다. TipTap의 ProseMirror 스키마가 1차 방어지만, 서버 살균이 최종 방어선이다(이중 방어).
- **재사용성**: 살균 규칙(허용 태그/속성/스킴)은 도메인 무관. 공용 라이브러리로 두면 다른 도메인 재사용 시 규칙을 한 곳에서만 갱신.
- **도메인 캡슐화**: `hasImage` 계산, `CreatePostRequest` 조립은 게시글 도메인 지식. 공용 라이브러리가 API 스키마를 알 필요 없게 분리.
- **테스트 용이성**: 공용 라이브러리(`rich-text.ts`)와 도메인 어댑터(`post-content.ts`)를 독립적으로 테스트. 실제로 `post-content.test.ts`, `pasted-url.test.ts`가 존재.

## Consequences

### 긍정
- 새 리치 텍스트 도메인 추가 시 `rich-text.ts` 재사용 + 도메인 어댑터만 추가하면 됨.
- 살균 규칙 변경(예: 새 태그 허용)은 `rich-text.ts` 한 곳.
- 서버 살균으로 XSS 최종 방어선 보장.

### 부정
- 도메인별로 어댑터 파일이 하나씩 추가됨(현재는 board만).
- `sanitizePostContent`가 현재 단순 위임이라 불필요한 간접 계층으로 보일 수 있음. 단, 향후 게시글 전용 규칙(예: 본문 최대 길이, 금지 태그)이 생기면 이 계층이 자리잡음.

## Alternatives considered

1. **살균 로직을 서버 액션에 인라인**: 거부. 규칙 중복 + 재사용 불가.
2. **클라이언트에서도 살균**: 거부. 클라이언트는 우회 가능. 서버 단일 신뢰 경계 원칙 위배.
3. **공용 라이브러리 없이 각 도메인이 직접 sanitize-html 호출**: 거부. 규칙 중복, 갱신 누락 위험.

## References

- 구현: `src/lib/rich-text.ts`, `src/app/(main)/board/_lib/post-content.ts`, `src/app/(main)/board/_lib/actions.ts`
- 렌더링: `src/app/(main)/board/_components/PostDetailShell.tsx` (`dangerouslySetInnerHTML`)
- 테스트: `src/app/(main)/board/_lib/post-content.test.ts`, `src/app/(main)/board/_lib/pasted-url.test.ts`
- 매핑: `docs/superpowers/mappings.md` §1 (WYSIWYG 설계 문서 ↔ 코드)
