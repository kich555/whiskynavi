# WYSIWYG 에디터 도입 Implementation Plan

> **Status: ✅ 구현 완료 (2026-07-19 검증)** — TipTap 에디터(`src/app/(main)/board/_components/PostForm.tsx`), 서버 사이드 sanitize-html(`src/lib/rich-text.ts` → `src/app/(main)/board/_lib/post-content.ts` → `actions.ts`), `dangerouslySetInnerHTML` 렌더링(`src/app/(main)/board/_components/PostDetailShell.tsx`) 모두 적용됨. 테스트: `post-content.test.ts`, `pasted-url.test.ts`. 아래 체크박스는 구현 당시 작성 기준이므로 참고용.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 커뮤니티 게시판의 textarea 기반 에디터를 TipTap WYSIWYG 에디터로 교체하여 이미지가 에디터 내에 바로 렌더링되고 텍스트 포맷팅이 가능하도록 한다.

**Architecture:** PostForm의 textarea를 TipTap `@tiptap/react` editor로 교체하고, 이미지 업로드는 `postApiBoardsUploads` API를 사용한다. 저장 형식은 HTML이며, 조회 화면에서는 `dangerouslySetInnerHTML`로 렌더링한다. 서버 액션에서 `sanitize-html`로 XSS를 이중 방어한다.

**Tech Stack:** `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `sanitize-html`

## Global Constraints

- react-markdown, remark-gfm, rehype-sanitize는 PostDetailContent에서 제거
- 기존 PostForm 레이아웃(스타일, SubmitButton, 제목 input, 레이아웃)은 유지
- 이미지 업로드는 `postApiBoardsUploads` API로 통일 (S3 presigned 코드 제거)
- 서버 액션에서 content를 `sanitize-html`로 정화 후 API 전송

---

### Task 1: 패키지 설치

**Files:**
- Modify: `package.json`

- [ ] **Step 1: TipTap 패키지 및 sanitize-html 설치**

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-placeholder sanitize-html
npm install -D @types/sanitize-html
```

- [ ] **Step 2: 설치 확인**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add tiptap and sanitize-html dependencies"
```

---

### Task 2: 서버 액션 sanitize 추가

**Files:**
- Modify: `src/app/(main)/community/actions.ts`

**Interfaces:**
- Consumes: 기존 `postSchema`, `FormState`, `createPostAction`, `updatePostAction` 시그니처 유지
- Produces: sanitize된 content를 API에 전송

- [ ] **Step 1: actions.ts에 sanitize-html import 및 정화 함수 추가**

`src/app/(main)/community/actions.ts` 파일 상단에 import 추가:

```typescript
import sanitizeHtml from "sanitize-html";
```

- [ ] **Step 2: `createPostAction`과 `updatePostAction`에서 content sanitize 추가**

두 액션 모두에서 `formData.get("content")` 값을 읽은 후, `parsed.data.content`를 API에 보내기 전에 정화한다.

`createPostAction`에서:
```typescript
// parsed 검증 통과 후, API 호출 전에 content 정화
const sanitized = sanitizeHtml(parsed.data.content, {
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

await postApiBoardsBoardidPosts(
  COMMUNITY_BOARD_ID,
  { title: parsed.data.title, content: sanitized },
  withToken(token),
);
```

`updatePostAction`에서도 동일한 정화 코드를 추가한다.

- [ ] **Step 3: 타입 체크**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(main)/community/actions.ts
git commit -m "feat: add server-side HTML sanitize for community posts"
```

---

### Task 3: PostDetailContent react-markdown → dangerouslySetInnerHTML 전환

**Files:**
- Modify: `src/app/(main)/community/posts/[postId]/_components/PostDetailContent.tsx`

**Interfaces:**
- Consumes: `PostResponse` (content가 HTML 문자열)
- Produces: dangerouslySetInnerHTML로 HTML 렌더링

- [ ] **Step 1: react-markdown 관련 코드 제거 및 dangerouslySetInnerHTML로 교체**

기존 코드:
```tsx
"use client";

import type { PostResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "../../../actions";
import Link from "next/link";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

// bundle-dynamic-imports: react-markdown은 약 100KB+ 번들.
// PostDetailContent에서만 사용되므로 next/dynamic으로 lazy-load (ssr: false).
// (remark-gfm, rehype-sanitize 플러그인은 가벼워서 정적 import)
const ReactMarkdown = dynamic(
  () => import("react-markdown").then((m) => m.default),
  { ssr: false },
);
```

변경 후:
```tsx
"use client";

import type { PostResponse } from "@/apis/generated/api";
import { FormMessage } from "@/components/ui/form-message";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { deletePostAction } from "../../../actions";
import Link from "next/link";
```

react-markdown 렌더링 부분도 교체:

기존:
```tsx
        {/* 본문 (react-markdown) — lazy-loaded */}
        <div className="px-5 py-5 prose prose-sm max-w-none prose-img:rounded-lg prose-img:my-4 [&_*]:text-white [&_img]:text-transparent">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {post.content ?? ""}
          </ReactMarkdown>
        </div>
```

변경 후:
```tsx
        {/* 본문 (TipTap HTML) */}
        <div
          className="px-5 py-5 prose prose-sm max-w-none prose-img:rounded-lg prose-img:my-4 [&_*]:text-white [&_img]:text-transparent"
          dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
        />
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/community/posts/[postId]/_components/PostDetailContent.tsx
git commit -m "feat: replace react-markdown with dangerouslySetInnerHTML in post detail"
```

---

### Task 4: PostForm TipTap WYSIWYG 에디터로 전환

**Files:**
- Modify: `src/app/(main)/community/posts/new/_components/PostForm.tsx`

**Interfaces:**
- Consumes: `token`, `action`, `state`, `defaultValues` (PostFormProps 그대로)
- Produces: HTML content를 FormData로 전송

- [ ] **Step 1: PostForm.tsx 전체 내용을 TipTap 기반으로 재작성**

```tsx
"use client";

import { postApiBoardsUploads } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { FormMessage } from "@/components/ui/form-message";
import { useCallback, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_COUNT, MAX_IMAGE_SIZE_MB } from "../../../_lib/constants";

interface PostFormProps {
  action: (formData: FormData) => void;
  state: {
    success: boolean;
    error?: string;
    values?: Record<string, string>;
  } | null;
  defaultValues?: { title?: string; content?: string };
  submitLabel?: string;
  token?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-amber-600 py-3 text-sm font-bold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

export default function PostForm({ action, state, defaultValues, submitLabel = "등록하기", token }: PostFormProps) {
  const contentInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Image.configure({
        inline: false,
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({
        placeholder: "내용을 입력하세요. 클립보드에서 이미지를 붙여넣을 수 있습니다.",
      }),
    ],
    content: defaultValues?.content ?? state?.values?.content ?? "",
    onUpdate: () => {
      // TipTap이 내부적으로 상태 관리, 추가로 할 일 없음
    },
  });

  /** 에디터 내 blob URL을 실제 URL로 교체 */
  const replaceBlobUrl = useCallback(
    (blobUrl: string, realUrl: string) => {
      if (!editor) return;
      editor.commands.command(({ tr, state }) => {
        let replaced = false;
        state.doc.descendants((node, pos) => {
          if (node.type.name === "image" && node.attrs.src === blobUrl) {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              src: realUrl,
            });
            replaced = true;
            return false; // stop traversal
          }
        });
        return replaced;
      });
    },
    [editor],
  );

  /** 파일 업로드 후 에디터에 이미지 삽입 */
  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;

      setUploadError(null);
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        alert(`${file.name}: 파일 크기가 ${MAX_IMAGE_SIZE_MB}MB를 초과합니다.`);
        return;
      }

      // blob URL로 즉시 에디터에 삽입
      const blobUrl = URL.createObjectURL(file);
      editor.commands.setImage({ src: blobUrl });

      setUploadingCount((c) => c + 1);

      try {
        if (!token) throw new Error("인증 필요");

        const res = await postApiBoardsUploads({ file }, withToken(token));
        const realUrl = res.data.url;
        if (!realUrl) throw new Error("업로드 응답에 URL이 없습니다.");

        // blob URL을 실제 URL로 교체
        replaceBlobUrl(blobUrl, realUrl);
      } catch (err) {
        console.error("Image upload failed:", err);
        // 실패 시 blob URL 유지 (깨진 이미지로 보임), 사용자가 직접 제거 가능
        setUploadError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다");
      } finally {
        setUploadingCount((c) => c - 1);
        URL.revokeObjectURL(blobUrl);
      }
    },
    [editor, token, replaceBlobUrl],
  );

  /** 클립보드 이미지 붙여넣기 처리 */
  const handlePaste = useCallback(
    async (_e: ClipboardEvent) => {
      // TipTap의 내부 paste를 막지 않고,
      // 이미지가 붙여넣어지면 TipTap이 기본적으로 base64 img를 생성하는데,
      // 그것을 우리가 원하는 blob → upload → replace 플로우로 오버라이드해야 함.
      // 대신, paste 이벤트를 intercept해서 이미지를 직접 처리한다.
      // ※ TipTap ProseMirror는 dropPaste 플러그인으로 이미지를 base64 data URL로 삽입하는데,
      //    이 기본 동작을 막고 우리의 업로드 플로우를 사용한다.
    },
    [],
  );

  /** Toolbar 버튼 핸들러 */
  const handleToolbarAction = useCallback(
    (action: string, value?: string) => {
      if (!editor) return;
      switch (action) {
        case "bold":
          editor.chain().focus().toggleBold().run();
          break;
        case "italic":
          editor.chain().focus().toggleItalic().run();
          break;
        case "strike":
          editor.chain().focus().toggleStrike().run();
          break;
        case "h2":
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case "h3":
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case "bulletList":
          editor.chain().focus().toggleBulletList().run();
          break;
        case "orderedList":
          editor.chain().focus().toggleOrderedList().run();
          break;
        case "link": {
          if (!value) return;
          const previousUrl = editor.getAttributes("link").href;
          const url = value || previousUrl;
          if (url === null || url === "") {
            editor.chain().focus().extendMarkRange("link").unsetLink().run();
          } else {
            editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
          }
          break;
        }
        case "unsetLink":
          editor.chain().focus().unsetLink().run();
          break;
      }
    },
    [editor],
  );

  /** 파일 선택 → 업로드 */
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;
      e.target.value = "";

      for (const file of files) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
          alert(`${file.name}: 지원하지 않는 파일 형식입니다. (JPG/PNG/WEBP만 가능)`);
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          alert(`${file.name}: 파일 크기가 ${MAX_IMAGE_SIZE_MB}MB를 초과합니다.`);
          continue;
        }
        uploadAndInsertImage(file);
      }
    },
    [uploadAndInsertImage],
  );

  /** form submit 시 에디터 내용을 hidden input에 설정 */
  const handleFormSubmit = useCallback(() => {
    if (!contentInputRef.current || !editor) return;
    contentInputRef.current.value = editor.getHTML();
  }, [editor]);

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429]">
      <form action={action} onSubmit={handleFormSubmit} className="mx-auto max-w-3xl px-4 py-6">
        {/* 뒤로가기 */}
        <a href="/community" className="mb-4 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white">
          ← 목록으로
        </a>

        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
          <h1 className="mb-5 text-lg font-bold text-white">{submitLabel === "수정하기" ? "글 수정" : "글쓰기"}</h1>

          {/* 제목 */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-bold text-gray-400 uppercase">제목</label>
            <input
              type="text"
              name="title"
              defaultValue={defaultValues?.title ?? state?.values?.title ?? ""}
              maxLength={200}
              placeholder="글 제목을 입력하세요"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
            />
          </div>

          {/* 내용 (TipTap 에디터) */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] font-bold text-gray-400 uppercase">내용</label>
            {/* 실제 전송용 hidden input — submit 시점에 에디터 HTML이 설정됨 */}
            <input ref={contentInputRef} type="hidden" name="content" />
            {/* Toolbar */}
            <div className="mb-1 flex flex-wrap items-center gap-0.5 rounded-t-lg border border-white/20 bg-white/5 px-2 py-1.5">
              <ToolbarButton
                onClick={() => handleToolbarAction("bold")}
                active={editor?.isActive("bold") ?? false}
                label="B"
                className="font-bold"
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("italic")}
                active={editor?.isActive("italic") ?? false}
                label="I"
                className="italic"
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("strike")}
                active={editor?.isActive("strike") ?? false}
                label="S"
                className="line-through"
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => handleToolbarAction("h2")}
                active={editor?.isActive("heading", { level: 2 }) ?? false}
                label="H2"
                className="text-xs"
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("h3")}
                active={editor?.isActive("heading", { level: 3 }) ?? false}
                label="H3"
                className="text-xs"
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => handleToolbarAction("bulletList")}
                active={editor?.isActive("bulletList") ?? false}
                label="• list"
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("orderedList")}
                active={editor?.isActive("orderedList") ?? false}
                label="1. list"
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => {
                  const url = prompt("링크 URL을 입력하세요:");
                  if (url) handleToolbarAction("link", url);
                }}
                active={editor?.isActive("link") ?? false}
                label="🔗"
              />
              {editor?.isActive("link") && (
                <ToolbarButton
                  onClick={() => handleToolbarAction("unsetLink")}
                  active={false}
                  label="✕"
                />
              )}
              <span className="mx-1 h-4 w-px bg-white/20" />
              {/* 이미지 추가 버튼 */}
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                active={false}
                label="🖼"
              />
            </div>
            {/* 에디터 영역 */}
            <div className="min-h-[200px] rounded-b-lg border border-t-0 border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white [&_.ProseMirror]:min-h-[160px] [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-500 [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg">
              <EditorContent editor={editor} />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            {uploadingCount > 0 && (
              <p className="mt-1 text-[10px] text-gray-400">
                이미지 업로드 중... ({uploadingCount}개)
              </p>
            )}
          </div>

          {/* 에러 메시지 */}
          <div className="mb-4">
            <FormMessage message={state?.error || uploadError} variant="error" />
          </div>

          {/* 제출 */}
          <SubmitButton label={submitLabel} />
        </div>
      </form>
    </div>
  );
}

interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  label: string;
  className?: string;
}

function ToolbarButton({ onClick, active, label, className = "" }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-amber-600/30 text-amber-400"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      } ${className}`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/community/posts/new/_components/PostForm.tsx
git commit -m "feat: replace textarea with TipTap WYSIWYG editor in PostForm"
```

---

### Task 5: 클립보드 이미지 붙여넣기 구현 (TipTap paste handler)

**Files:**
- Modify: `src/app/(main)/community/posts/new/_components/PostForm.tsx`

**Interfaces:**
- Consumes: Task 4의 `editor`, `uploadAndInsertImage`
- Produces: paste 시 TipTap의 기본 base64 이미지 생성을 막고 업로드 플로우로 대체

- [ ] **Step 1: useEditor 설정에 paste 이벤트 핸들러 추가**

editor 생성 부분의 `onUpdate` 다음에 `editorProps`를 추가한다:

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
    }),
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    Placeholder.configure({
      placeholder: "내용을 입력하세요. 클립보드에서 이미지를 붙여넣을 수 있습니다.",
    }),
  ],
  content: defaultValues?.content ?? state?.values?.content ?? "",
  editorProps: {
    handlePaste: (_view, event) => {
      const items = Array.from(event.clipboardData?.items ?? []);
      const imageItems = items.filter(
        (item) =>
          item.kind === "file" &&
          item.type.startsWith("image/") &&
          ALLOWED_IMAGE_TYPES.includes(item.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
      );
      if (imageItems.length === 0) return false; // TipTap 기본 paste 처리

      // 이미지 붙여넣기 → 우리의 업로드 플로우 사용
      for (const item of imageItems) {
        const file = item.getAsFile();
        if (file) {
          uploadAndInsertImage(file);
        }
      }
      return true; // TipTap 기본 paste 방지
    },
  },
});
```

그리고 `handlePaste` 콜백과 관련 useCallback은 제거한다 (editorProps.handlePaste로 대체되었으므로).

- [ ] **Step 2: 타입 체크**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/community/posts/new/_components/PostForm.tsx
git commit -m "feat: implement clipboard image paste via upload API in TipTap editor"
```

---

### Task 6: 전반 검증

**Files:**
- 전체 변경 파일 검증

- [ ] **Step 1: 전체 타입 체크**

```bash
npx tsc --noEmit --pretty 2>&1 | head -5
```

- [ ] **Step 2: 린트**

```bash
npm run lint 2>&1 | grep -E "(error|warning)" | grep -v "node_modules" | grep -v "worktrees" | head -10
```

- [ ] **Step 3: 수정된 파일 목록 확인**

```bash
git diff --name-only
```

- [ ] **Step 4: 최종 커밋 (모든 변경사항이 각각 커밋되었으므로 추가 커밋 불필요)**

```bash
git log --oneline -5
```