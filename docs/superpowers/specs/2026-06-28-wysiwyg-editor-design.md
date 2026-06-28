# WYSIWYG 에디터 도입 설계서

## 개요

커뮤니티 게시판 작성/수정 화면에서 textarea 기반 에디터를 TipTap WYSIWYG 에디터로 교체하여,  
클립보드 이미지 붙여넣기 시 이미지가 에디터 내에서 바로 렌더링되고, 볼드/이탤릭/헤딩/리스트/링크 등  
텍스트 포맷팅이 가능하도록 한다.

## 작업 범위

| 파일 | 변경 |
|------|------|
| `community/posts/new/_components/PostForm.tsx` | textarea → TipTap 에디터 전환 |
| `community/posts/[postId]/edit/_components/PostEditContent.tsx` | 변경 없음 (PostForm 재사용) |
| `community/posts/[postId]/_components/PostDetailContent.tsx` | react-markdown → dangerouslySetInnerHTML |
| `community/actions.ts` | 서버 액션에서 sanitize-html로 XSS 방어 추가 |
| `package.json` | @tiptap/react, @tiptap/starter-kit, @tiptap/extension-image, @tiptap/extension-link, @tiptap/extension-placeholder, sanitize-html 추가 |

## 상세 설계

### 1. 에디터 (PostForm)

**TipTap 확장 구성:**
- `StarterKit` — 볼드, 이탤릭, 스트라이크, 코드, 헤딩(h1~h3), 블록쿼트, bullet/ordered 리스트, 언두/리두
- `Image` — 에디터 내 이미지 렌더링
- `Link` — 링크 삽입/편집
- `Placeholder` — placeholder 문구 표시

**메뉴바:**
에디터 상단에 간단한 툴바 제공:
- 볼드, 이탤릭, 스트라이크
- 헤딩 (h2, h3)
- 불릿 리스트, 오더드 리스트
- 링크 추가/제거
- 이미지 추가 버튼 (file input 연결)

**이미지 업로드 플로우:**
1. paste 또는 파일 선택 → `e.preventDefault()`로 기본 동작 차단
2. 파일 유효성 검사 (타입/크기)
3. blob URL로 즉시 에디터에 `<img>` 삽입 (로딩 표시용 오버레이 없이 바로 보임)
4. `postApiBoardsUploads` API 호출 → 응답 URL 받음
5. blob URL을 실제 CloudFront URL로 교체

### 2. 서버 측 sanitize (actions.ts)

`sanitize-html` 라이브러리로 Server Action에서 content 정화:
```typescript
import sanitizeHtml from "sanitize-html";

const sanitized = sanitizeHtml(content, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    "img", "h1", "h2", "h3",
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "target", "rel"],
  },
  allowedSchemes: ["http", "https"],
});
```

### 3. 조회 화면 (PostDetailContent)

react-markdown → TipTap에서 출력한 HTML을 그대로 렌더링:
```tsx
// prose 스타일은 기존 유지, dangerouslySetInnerHTML로 교체
<div
  className="px-5 py-5 prose prose-sm max-w-none prose-img:rounded-lg prose-img:my-4"
  dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
/>
```

react-markdown 관련 동적 import, remark-gfm, rehype-sanitize 제거.

### 4. 기존 PostForm 정리

삭제되는 코드:
- `textareaRef` → TipTap의 `editorRef`로 대체
- `fileInputRef` → TipTap Image 확장의 파일 선택 버튼으로 대체
- `images` 상태 배열 → TipTap 에디터 내부에서 이미지 관리
- `insertAtPosition` → 필요 없음
- `handlePaste` → TipTap의 `editor.on("paste")` 이벤트로 대체
- `handleFileChange` → TipTap의 `addNodeBefore` 또는 별도 버튼 핸들러로 대체
- `content` 상태 → TipTap의 `editor.getHTML()`로 대체
- `buildFinalContent` → 필요 없음 (content가 이미 HTML)
- `contentInputRef` → 필요 없음 (textarea → hidden input 플로우 불필요)

유지:
- `SubmitButton`, `FormMessage`, 제목 input, 레이아웃

### 5. 폼 전송

- TipTap의 `editor.getHTML()`로 HTML을 content 필드에 담아 FormData로 전송
- hidden input `name="content"`에 HTML 값 설정 (onSubmit 시점)

## 제외 사항 (YAGNI)

- 이미지 드래그 앤 드롭 리사이징
- 테이블, 코드 블록 하이라이팅, 수식 등 고급 확장
- 커스텀 이미지 업로드 노드 (TipTap 기본 Image 확장으로 충분)
- 다국어, 테마 커스터마이징

## 렌더링 보안

- TipTap 자체가 ProseMirror 파서로 허용 태그만 파싱하여 출력
- 서버 측 `sanitize-html`로 이중 방어
- 조회 화면의 `dangerouslySetInnerHTML`은 위 두 단계를 통과한 안전한 HTML만 렌더링