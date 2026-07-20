"use client";

import { ALLOWED_IMAGE_MIME_TYPES, getImageSizeError, IMAGE_FILE_ACCEPT } from "@/lib/image-upload";
import { cn } from "@/lib/utils";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Unlink,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_IMAGE_SIZE_MB = 5;
const MAX_IMAGE_COUNT = 5;

interface RichTextImageEditorProps {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  variant?: "user" | "admin";
  compact?: boolean;
  resetKey?: number;
  onUploadingChange?: (uploading: boolean) => void;
  /** 파일을 업로드한 뒤 최종 URL을 반환. 인증/토큰 처리는 호출처 책임. */
  uploadFn: (file: File) => Promise<string>;
}

function getPastedHttpUrl(clipboardData: DataTransfer): string | null {
  const value = clipboardData
    .getData("text/uri-list")
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith("#"));
  if (!value) return null;

  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? value.trim() : null;
  } catch {
    return null;
  }
}

export default function RichTextImageEditor({
  name = "content",
  defaultValue = "",
  placeholder = "내용을 입력하세요. 이미지를 붙여넣거나 추가할 수 있습니다.",
  variant = "user",
  compact = false,
  resetKey,
  onUploadingChange,
  uploadFn,
}: RichTextImageEditorProps) {
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [serializedContent, setSerializedContent] = useState(defaultValue);
  const isAdmin = variant === "admin";

  const syncHiddenInput = useCallback((html: string) => {
    setSerializedContent(html);
    if (hiddenInputRef.current) hiddenInputRef.current.value = html;
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: defaultValue,
    onCreate: ({ editor: currentEditor }) => syncHiddenInput(currentEditor.getHTML()),
    onUpdate: ({ editor: currentEditor }) => syncHiddenInput(currentEditor.getHTML()),
    editorProps: {
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItems = items.filter(
          (item) =>
            item.kind === "file" &&
            item.type.startsWith("image/") &&
            (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(item.type),
        );

        if (imageItems.length > 0) {
          imageItems.forEach((item) => {
            const file = item.getAsFile();
            if (file) void uploadAndInsertImage(file);
          });
          return true;
        }

        if (!event.clipboardData) return false;
        const pastedUrl = getPastedHttpUrl(event.clipboardData);
        if (!pastedUrl) return false;
        editor?.chain().focus().insertContent(`<a href="${pastedUrl}">${pastedUrl}</a>`).run();
        return true;
      },
    },
  });

  const countImages = useCallback(() => {
    if (!editor) return 0;
    let count = 0;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "image") count += 1;
    });
    return count;
  }, [editor]);

  const replaceImageSource = useCallback(
    (currentSource: string, nextSource?: string) => {
      if (!editor) return;
      editor.commands.command(({ tr, state }) => {
        let changed = false;
        state.doc.descendants((node, position) => {
          if (node.type.name !== "image" || node.attrs.src !== currentSource) return;
          if (nextSource) {
            tr.setNodeMarkup(position, undefined, { ...node.attrs, src: nextSource });
          } else {
            tr.delete(position, position + node.nodeSize);
          }
          changed = true;
          return false;
        });
        return changed;
      });
      // 업로드 완료 직후 hidden input을 동기식으로 갱신.
      // onUpdate 비동기 콜백에만 의존하면 저장 시점에 아직 blob: URL이 남아
      // 서버 sanitize에서 이미지가 통째로 날아가는 버그가 발생한다.
      syncHiddenInput(editor.getHTML());
    },
    [editor, syncHiddenInput],
  );

  const uploadAndInsertImage = useCallback(
    async (file: File) => {
      if (!editor) return;
      setUploadError(null);

      if (!(ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
        setUploadError(`${file.name}: 지원하지 않는 파일 형식입니다. (JPG/PNG/WEBP만 가능)`);
        return;
      }
      const sizeError = getImageSizeError(file, MAX_IMAGE_SIZE_MB);
      if (sizeError) {
        setUploadError(`${file.name}: ${sizeError}`);
        return;
      }
      if (countImages() >= MAX_IMAGE_COUNT) {
        setUploadError(`이미지는 최대 ${MAX_IMAGE_COUNT}개까지 첨부할 수 있습니다.`);
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      editor.chain().focus().setImage({ src: blobUrl, alt: file.name }).run();
      setUploadingCount((count) => count + 1);

      try {
        const realUrl = await uploadFn(file);
        replaceImageSource(blobUrl, realUrl);
      } catch (error) {
        replaceImageSource(blobUrl);
        setUploadError(error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.");
      } finally {
        setUploadingCount((count) => count - 1);
        URL.revokeObjectURL(blobUrl);
      }
    },
    [countImages, editor, replaceImageSource, uploadFn],
  );

  useEffect(() => {
    onUploadingChange?.(uploadingCount > 0);
  }, [onUploadingChange, uploadingCount]);

  useEffect(() => {
    if (!editor || !resetKey) return;
    editor.commands.clearContent();
    setUploadError(null);
  }, [editor, resetKey]);

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    files.forEach((file) => void uploadAndInsertImage(file));
  };

  const setLink = () => {
    if (!editor) return;
    const url = window.prompt("링크 URL을 입력하세요:", editor.getAttributes("link").href ?? "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div>
      <input ref={hiddenInputRef} type="hidden" name={name} value={serializedContent} readOnly />
      <div
        role="toolbar"
        aria-label="본문 서식"
        className={cn(
          "flex flex-wrap items-center gap-0.5 rounded-t-md border px-2 py-1.5",
          isAdmin ? "border-gray-300 bg-gray-50" : "border-white/15 bg-white/5",
        )}
      >
        <ToolbarButton
          label="굵게"
          active={editor?.isActive("bold") ?? false}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <Bold />
        </ToolbarButton>
        <ToolbarButton
          label="기울임"
          active={editor?.isActive("italic") ?? false}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <Italic />
        </ToolbarButton>
        <ToolbarButton
          label="취소선"
          active={editor?.isActive("strike") ?? false}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <Strikethrough />
        </ToolbarButton>
        <ToolbarDivider admin={isAdmin} />
        <ToolbarButton
          label="제목 2"
          active={editor?.isActive("heading", { level: 2 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 />
        </ToolbarButton>
        <ToolbarButton
          label="제목 3"
          active={editor?.isActive("heading", { level: 3 }) ?? false}
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 />
        </ToolbarButton>
        <ToolbarDivider admin={isAdmin} />
        <ToolbarButton
          label="글머리 목록"
          active={editor?.isActive("bulletList") ?? false}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          <List />
        </ToolbarButton>
        <ToolbarButton
          label="번호 목록"
          active={editor?.isActive("orderedList") ?? false}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered />
        </ToolbarButton>
        <ToolbarDivider admin={isAdmin} />
        <ToolbarButton label="링크 추가" active={editor?.isActive("link") ?? false} onClick={setLink}>
          <LinkIcon />
        </ToolbarButton>
        {editor?.isActive("link") ? (
          <ToolbarButton label="링크 제거" active={false} onClick={() => editor.chain().focus().unsetLink().run()}>
            <Unlink />
          </ToolbarButton>
        ) : null}
        <ToolbarDivider admin={isAdmin} />
        <ToolbarButton label="이미지 추가" active={false} onClick={() => fileInputRef.current?.click()}>
          <ImageIcon />
        </ToolbarButton>
      </div>

      <div
        className={cn(
          "typo-medium-14 rounded-b-md border border-t-0 px-3 py-2.5 [&_.ProseMirror]:outline-none [&_.ProseMirror_a]:underline [&_.ProseMirror_img]:my-3 [&_.ProseMirror_img]:max-h-[32rem] [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:object-contain [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-500 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
          compact ? "min-h-36 [&_.ProseMirror]:min-h-28" : "min-h-64 [&_.ProseMirror]:min-h-56",
          isAdmin ? "border-gray-300 bg-white text-gray-900" : "border-white/15 bg-white/5 text-white",
        )}
      >
        <EditorContent editor={editor} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <div className="typo-medium-12 mt-1 flex flex-wrap justify-between gap-2">
        <span className={isAdmin ? "text-gray-500" : "text-gray-400"}>
          JPG/PNG/WEBP · 이미지당 최대 {MAX_IMAGE_SIZE_MB}MB · 최대 {MAX_IMAGE_COUNT}개
        </span>
        {uploadingCount > 0 ? <span className="text-amber-500">이미지 업로드 중 ({uploadingCount})</span> : null}
      </div>
      {uploadError ? (
        <p role="alert" className="typo-medium-14 mt-1 text-red-500">
          {uploadError}
        </p>
      ) : null}
    </div>
  );
}

function ToolbarDivider({ admin }: { admin: boolean }) {
  return <span aria-hidden="true" className={cn("mx-1 h-4 w-px", admin ? "bg-gray-300" : "bg-white/20")} />;
}

function ToolbarButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={cn(
        "rounded p-1.5 transition-colors [&_svg]:size-4",
        active ? "bg-amber-600/20 text-amber-500" : "text-gray-400 hover:bg-black/5 hover:text-amber-500",
      )}
    >
      {children}
    </button>
  );
}
