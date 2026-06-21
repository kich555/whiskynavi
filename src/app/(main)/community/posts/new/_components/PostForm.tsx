"use client";

import { FormMessage } from "@/components/ui/form-message";
import { getApiS3Presigned } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { useRef, useState, useCallback } from "react";
import { useFormStatus } from "react-dom";
import {
  MAX_IMAGE_COUNT,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
} from "../../../_lib/constants";

interface PostFormProps {
  action: (formData: FormData) => void;
  state: {
    success: boolean;
    error?: string;
    values?: Record<string, string>;
  } | null;
  defaultValues?: { title?: string; content?: string };
  submitLabel?: string;
}

interface UploadedImage {
  id: string;
  url: string;
  markdown: string;
  uploading: boolean;
  error: boolean;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors hover:bg-amber-700"
    >
      {pending ? "처리 중..." : label}
    </button>
  );
}

export default function PostForm({
  action,
  state,
  defaultValues,
  submitLabel = "등록하기",
}: PostFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);

  const insertAtCursor = useCallback((text: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = ta.value.substring(0, start);
    const after = ta.value.substring(end);
    ta.value = before + text + after;
    ta.selectionStart = ta.selectionEnd = start + text.length;
    ta.focus();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      e.target.value = "";

      const remaining = MAX_IMAGE_COUNT - images.length;
      const toUpload = files.slice(0, remaining);

      for (const file of toUpload) {
        if (
          !ALLOWED_IMAGE_TYPES.includes(
            file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
          )
        ) {
          alert(
            `${file.name}: 지원하지 않는 파일 형식입니다. (JPG/PNG/WEBP만 가능)`,
          );
          continue;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
          alert(
            `${file.name}: 파일 크기가 ${MAX_IMAGE_SIZE_MB}MB를 초과합니다.`,
          );
          continue;
        }

        const tempId = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        const entry: UploadedImage = {
          id: tempId,
          url: previewUrl,
          markdown: "",
          uploading: true,
          error: false,
        };
        setImages((prev) => [...prev, entry]);

        try {
          const token = await getAuthToken();
          if (!token) throw new Error("인증 필요");

          const key = `community/${crypto.randomUUID()}/${file.name}`;
          const presignedRes = await getApiS3Presigned(
            { key, filename: file.name },
            withToken(token),
          );
          const presignedUrl = presignedRes.data.url!;

          await fetch(presignedUrl, { method: "PUT", body: file });

          const cdnUrl = presignedUrl.split("?")[0];
          const markdown = `![${file.name}](${cdnUrl})`;

          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId ? { ...img, markdown, uploading: false } : img,
            ),
          );
        } catch {
          setImages((prev) =>
            prev.map((img) =>
              img.id === tempId
                ? { ...img, uploading: false, error: true }
                : img,
            ),
          );
        }
      }
    },
    [images.length],
  );

  const handleInsertImage = useCallback(
    (img: UploadedImage) => {
      if (!img.markdown || img.uploading) return;
      insertAtCursor(`\n${img.markdown}\n`);
    },
    [insertAtCursor],
  );

  const handleRemoveImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  return (
    <form action={action} className="mx-auto max-w-3xl px-4 py-6">
      {/* 뒤로가기 */}
      <a
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
      >
        ← 목록으로
      </a>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 p-5">
        <h1 className="text-lg font-bold text-white mb-5">
          {submitLabel === "수정하기" ? "글 수정" : "글쓰기"}
        </h1>

        {/* 제목 */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">
            제목
          </label>
          <input
            type="text"
            name="title"
            defaultValue={defaultValues?.title ?? state?.values?.title ?? ""}
            maxLength={200}
            placeholder="글 제목을 입력하세요"
            className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 placeholder-gray-500"
          />
        </div>

        {/* 내용 */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1.5">
            내용
          </label>
          <textarea
            ref={textareaRef}
            name="content"
            defaultValue={
              defaultValues?.content ?? state?.values?.content ?? ""
            }
            rows={10}
            placeholder="내용을 입력하세요. 이미지는 첨부 후 클릭하면 커서 위치에 삽입됩니다."
            className="w-full border border-white/20 rounded-lg px-3 py-2.5 text-sm text-white bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 placeholder-gray-500 resize-y min-h-[160px]"
          />
        </div>

        {/* 이미지 첨부 */}
        <div className="mb-4 border border-dashed border-white/20 rounded-lg p-3 bg-white/5">
          <div className="text-[11px] font-bold text-gray-400 uppercase mb-2">
            첨부 이미지
          </div>

          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className="relative w-14 h-14 rounded-lg overflow-hidden bg-white/10 group"
                >
                  <img
                    src={img.url}
                    alt="preview"
                    className={`w-full h-full object-cover cursor-pointer ${
                      img.uploading ? "opacity-50" : ""
                    }`}
                    onClick={() => handleInsertImage(img)}
                  />
                  {img.uploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {img.error && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                      <span className="text-[10px] text-red-600 font-bold">
                        실패
                      </span>
                    </div>
                  )}
                  {!img.uploading && !img.error && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(img.id);
                      }}
                      className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= MAX_IMAGE_COUNT}
            className="text-xs text-gray-400 border border-dashed border-white/30 rounded-lg px-4 py-2 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            + 이미지 추가 ({images.length}/{MAX_IMAGE_COUNT})
          </button>
          <p className="text-[10px] text-gray-500 mt-1">
            이미지 클릭 시 커서 위치에 삽입 · 최대 5장 · JPG/PNG/WEBP · 5MB
            이하
          </p>
        </div>

        {/* 에러 메시지 */}
        <div className="mb-4">
          <FormMessage message={state?.error} variant="error" />
        </div>

        {/* 제출 */}
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}