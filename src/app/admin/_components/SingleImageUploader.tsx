"use client";

import { postApiAdminImagesPurpose, type AdminImageUploadResponsePurpose } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { buildCloudFrontUrl } from "@/lib/cloudfront";
import { getImageValidationError, IMAGE_FILE_ACCEPT } from "@/lib/image-upload";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { getSession } from "next-auth/react";
import { useRef, useState } from "react";

interface SingleImageUploaderProps {
  initialKey?: string;
  initialUrl?: string;
  maxSizeMB: number;
  purpose: AdminImageUploadResponsePurpose;
  name?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

function resolveImageUrl(key: string, url?: string): string | undefined {
  if (url) return url;
  try {
    return buildCloudFrontUrl(key);
  } catch {
    return undefined;
  }
}

/** 단일 대표 이미지 업로더. 업로드 즉시 S3 key를 숨김 필드로 내보낸다. */
export default function SingleImageUploader({
  initialKey,
  initialUrl,
  maxSizeMB,
  purpose,
  name = "imageKey",
  onUploadingChange,
}: SingleImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageKey, setImageKey] = useState<string | null>(initialKey ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(
    initialKey ? resolveImageUrl(initialKey, initialUrl) : undefined,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const uploadFile = async (file: File) => {
    const validationError = getImageValidationError(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("로그인이 필요합니다.");

      const response = await postApiAdminImagesPurpose(purpose, { file }, withToken(session.accessToken));
      const key = response.data.key;
      if (!key) throw new Error("업로드된 이미지 키를 확인할 수 없습니다.");

      setImageKey(key);
      setPreviewUrl(resolveImageUrl(key, response.data.url));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = () => {
    setImageKey(null);
    setPreviewUrl(undefined);
    setError(null);
  };

  return (
    <div>
      <input type="hidden" name={name} value={imageKey ?? ""} />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void uploadFile(file);
        }}
        className={`group relative flex h-48 w-full items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          isDragging ? "border-amber-600 bg-amber-50" : "border-gray-300"
        } ${imageKey ? "bg-transparent" : "bg-gray-50"}`}
      >
        {previewUrl ? (
          <>
            <ImageWithFallback src={previewUrl} alt="대표 이미지" fill className="object-contain p-2" sizes="300px" />
            <button
              type="button"
              onClick={removeImage}
              aria-label="대표 이미지 삭제"
              className="absolute top-2 right-2 flex size-7 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
            >
              <X className="size-4" />
            </button>
          </>
        ) : isUploading ? (
          <Loader2 className="size-6 animate-spin text-amber-600" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 text-gray-500 transition-colors hover:text-amber-700"
          >
            <Upload className="size-6" />
            <span className="typo-medium-14">이미지 업로드 또는 드래그 앤 드롭</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadFile(file);
        }}
      />

      <p className="typo-medium-12 mt-2 text-gray-500">이미지 파일 · 최대 {maxSizeMB}MB</p>
      {error && (
        <p role="alert" className="typo-medium-12 mt-1 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}