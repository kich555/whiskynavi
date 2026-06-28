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
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link,
  Unlink,
  ImageIcon,
} from "lucide-react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE_MB } from "../../../_lib/constants";

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
    editorProps: {
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItems = items.filter(
          (item) =>
            item.kind === "file" &&
            item.type.startsWith("image/") &&
            ALLOWED_IMAGE_TYPES.includes(item.type as (typeof ALLOWED_IMAGE_TYPES)[number]),
        );
        if (imageItems.length === 0) return false; // TipTap 기본 paste 처리 (텍스트)

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
                label={<Bold className="h-3.5 w-3.5" />}
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("italic")}
                active={editor?.isActive("italic") ?? false}
                label={<Italic className="h-3.5 w-3.5" />}
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("strike")}
                active={editor?.isActive("strike") ?? false}
                label={<Strikethrough className="h-3.5 w-3.5" />}
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => handleToolbarAction("h2")}
                active={editor?.isActive("heading", { level: 2 }) ?? false}
                label={<Heading2 className="h-3.5 w-3.5" />}
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("h3")}
                active={editor?.isActive("heading", { level: 3 }) ?? false}
                label={<Heading3 className="h-3.5 w-3.5" />}
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => handleToolbarAction("bulletList")}
                active={editor?.isActive("bulletList") ?? false}
                label={<List className="h-3.5 w-3.5" />}
              />
              <ToolbarButton
                onClick={() => handleToolbarAction("orderedList")}
                active={editor?.isActive("orderedList") ?? false}
                label={<ListOrdered className="h-3.5 w-3.5" />}
              />
              <span className="mx-1 h-4 w-px bg-white/20" />
              <ToolbarButton
                onClick={() => {
                  const url = prompt("링크 URL을 입력하세요:");
                  if (url) handleToolbarAction("link", url);
                }}
                active={editor?.isActive("link") ?? false}
                label={<Link className="h-3.5 w-3.5" />}
              />
              {editor?.isActive("link") && (
                <ToolbarButton
                  onClick={() => handleToolbarAction("unsetLink")}
                  active={false}
                  label={<Unlink className="h-3.5 w-3.5" />}
                />
              )}
              <span className="mx-1 h-4 w-px bg-white/20" />
              {/* 이미지 추가 버튼 */}
              <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                active={false}
                label={<ImageIcon className="h-3.5 w-3.5" />}
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
  label: React.ReactNode;
}

function ToolbarButton({ onClick, active, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded px-2 py-1 text-sm transition-colors ${
        active
          ? "bg-amber-600/30 text-amber-400"
          : "text-gray-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}