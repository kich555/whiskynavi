// 백엔드 사업자등록증 제한(10MB)과 동일하게 검사한다.
export const BUSINESS_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
export const BUSINESS_DOCUMENT_SIZE_ERROR = "첨부 파일이 너무 큽니다. 사업자 등록증은 10MB 이하로 업로드해주세요.";

export function getBusinessDocumentError(file: File | null | undefined): string | null {
  if (!file || file.size === 0) return "사업자 등록증을 첨부해주세요.";
  if (file.size > BUSINESS_DOCUMENT_MAX_BYTES) return BUSINESS_DOCUMENT_SIZE_ERROR;
  return null;
}
