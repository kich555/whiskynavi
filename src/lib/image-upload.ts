export function getImageSizeError(file: File, maxSizeMB: number): string | undefined {
  if (file.size <= maxSizeMB * 1024 * 1024) return undefined;

  return `이미지는 최대 ${maxSizeMB}MB까지 업로드할 수 있습니다. 더 작은 이미지를 선택해주세요.`;
}
