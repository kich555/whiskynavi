export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const IMAGE_FILE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(",");

export function getImageTypeError(file: File): string | undefined {
  if ((ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) return undefined;
  return "이미지는 JPG, PNG, WEBP 형식만 업로드할 수 있습니다.";
}

export function getImageSizeError(file: File, maxSizeMB: number): string | undefined {
  if (file.size <= maxSizeMB * 1024 * 1024) return undefined;

  return `이미지는 최대 ${maxSizeMB}MB까지 업로드할 수 있습니다. 더 작은 이미지를 선택해주세요.`;
}

export function getImageValidationError(file: File, maxSizeMB: number): string | undefined {
  return getImageTypeError(file) ?? getImageSizeError(file, maxSizeMB);
}
