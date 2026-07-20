"use client";

import { postApiS3Upload } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { buildCloudFrontUrl } from "@/lib/cloudfront";
import { getImageSizeError } from "@/lib/image-upload";
import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { getSession } from "next-auth/react";
import { useMemo, useRef, useState } from "react";

interface AdditionalImage {
  key: string;
  url?: string;
}

interface AdditionalImageUploaderProps {
  initialKeys?: string[];
  initialUrls?: string[];
  maxImages?: number;
  maxSizeMB: number;
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

export default function AdditionalImageUploader({
  initialKeys = [],
  initialUrls = [],
  maxImages = 9,
  maxSizeMB,
  name = "additionalImageKeys",
  onUploadingChange,
}: AdditionalImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const initialImages = useMemo(
    () =>
      initialKeys.map((key, index) => ({
        key,
        url: resolveImageUrl(key, initialUrls[index]),
      })),
    [initialKeys, initialUrls],
  );
  const [images, setImages] = useState<AdditionalImage[]>(initialImages);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setUploading = (uploading: boolean) => {
    setIsUploading(uploading);
    onUploadingChange?.(uploading);
  };

  const uploadFiles = async (files: File[]) => {
    setError(null);

    const remainingCount = maxImages - images.length;
    if (remainingCount <= 0) {
      setError(`추가 이미지는 최대 ${maxImages}장까지 등록할 수 있습니다.`);
      return;
    }

    if (files.length > remainingCount) {
      setError(`추가 이미지는 최대 ${maxImages}장까지 등록할 수 있습니다.`);
      return;
    }

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError("이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      const sizeError = getImageSizeError(file, maxSizeMB);
      if (sizeError) {
        setError(sizeError);
        return;
      }
    }

    setUploading(true);
    try {
      const session = await getSession();
      if (!session?.accessToken) throw new Error("로그인이 필요합니다.");

      const uploadedImages = await Promise.all(
        files.map(async (file): Promise<AdditionalImage> => {
          const response = await postApiS3Upload({ file }, withToken(session.accessToken));
          const key = response.data.key;
          if (!key) throw new Error("업로드된 이미지 키를 확인할 수 없습니다.");
          return {
            key,
            url: resolveImageUrl(key, response.data.url),
          };
        }),
      );

      setImages((current) => [...current, ...uploadedImages]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    setImages((current) => {
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setError(null);
  };

  return (
    <div>
      <input type="hidden" name={name} value={JSON.stringify(images.map((image) => image.key))} />
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="typo-medium-14 text-gray-700">추가 이미지</p>
          <p className="typo-medium-12 mt-1 text-gray-500">
            대표 이미지 다음 순서로 슬라이드에 표시됩니다. ({images.length}/{maxImages})
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || images.length >= maxImages}
          className="typo-medium-14 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-600 px-3 py-2 text-amber-700 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          {isUploading ? "업로드 중" : "추가 이미지 업로드"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length > 0) void uploadFiles(files);
          }}
        />
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <div key={`${image.key}-${index}`} className="rounded-lg border border-gray-200 bg-gray-50 p-2">
              <div className="relative aspect-square overflow-hidden rounded bg-white">
                <ImageWithFallback
                  src={image.url}
                  alt={`추가 이미지 ${index + 1}`}
                  fill
                  className="object-contain"
                  sizes="160px"
                />
                <span className="typo-medium-12 absolute top-1 left-1 rounded bg-black/60 px-2 py-1 text-white">
                  {index + 2}번째
                </span>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  aria-label={`${index + 1}번째 추가 이미지 삭제`}
                  className="absolute top-1 right-1 flex size-7 cursor-pointer items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="mt-2 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => moveImage(index, -1)}
                  disabled={index === 0}
                  aria-label={`${index + 1}번째 추가 이미지를 앞으로 이동`}
                  className="flex size-8 cursor-pointer items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label={`${index + 1}번째 추가 이미지를 뒤로 이동`}
                  className="flex size-8 cursor-pointer items-center justify-center rounded border border-gray-300 text-gray-600 hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="typo-medium-12 mt-2 text-gray-500">이미지 파일 · 장당 최대 {maxSizeMB}MB</p>
      {error && (
        <p role="alert" className="typo-medium-12 mt-1 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
