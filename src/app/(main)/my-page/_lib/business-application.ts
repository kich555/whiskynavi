import { ApiError, getUserErrorMessage } from "@/apis/errors";
import { z } from "zod";
import { BUSINESS_DOCUMENT_SIZE_ERROR } from "./business-document";

const isValidDateString = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
};

export const businessApplySchema = z.object({
  businessName: z.string().min(1, "사업자 이름을 입력해주세요."),
  contact: z.string().min(1, "연락처를 입력해주세요."),
  businessRegistrationNumber: z.string().min(1, "사업자 등록번호를 입력해주세요."),
  businessType: z.enum(["HOUSEHOLD", "ENTERTAINMENT"], {
    message: "사업자 구분을 선택해주세요.",
  }),
  pickupAddress: z.string().optional().default(""),
  openingDate: z.string().min(1, "개업일을 입력해주세요.").refine(isValidDateString, {
    message: "개업일은 yyyy-MM-dd 형식의 올바른 날짜여야 합니다.",
  }),
  representativeName: z.string().min(1, "대표자 이름을 입력해주세요."),
});

const BUSINESS_VERIFICATION_INPUT_REVIEW_MESSAGE =
  "국세청 사업자 검증에 실패했습니다. 입력하신 사업자등록번호, 개업일자, 대표자명을 다시 확인해주세요.";

const BUSINESS_APPLICATION_NOT_FOUND_MESSAGE =
  "사업자 등록 신청 페이지에 연결할 수 없습니다. 서비스가 업데이트 중이거나 신청 주소가 변경되었을 수 있습니다. 잠시 후 다시 시도하고, 계속되면 고객센터에 문의해주세요.";

const BUSINESS_APPLICATION_FORBIDDEN_MESSAGE =
  "현재 계정으로는 사업자 등록을 신청할 수 없습니다. 로그인 계정의 상태와 본인 인증 여부를 확인한 뒤 다시 시도해주세요.";

const BUSINESS_APPLICATION_CONFLICT_MESSAGE =
  "동일한 사업자등록번호로 접수되었거나 이미 처리 중인 신청이 있습니다. 마이페이지의 사업자 신청 내역을 확인해주세요.";

export interface BusinessApplicationActionResult {
  success: boolean;
  error?: string;
  hint?: string;
  code?: string;
  requestId?: string;
}

export type BusinessApplicationErrorDetails = Omit<BusinessApplicationActionResult, "success">;

export const getStructuredApiErrorDetails = (error: ApiError): BusinessApplicationErrorDetails => ({
  error: error.userMessage,
  ...(error.hint ? { hint: error.hint } : {}),
  ...(error.code ? { code: error.code } : {}),
  ...(error.requestId ? { requestId: error.requestId } : {}),
});

export const getBusinessApplicationErrorDetails = (error: unknown): BusinessApplicationErrorDetails => {
  if (error instanceof ApiError) {
    if (error.code) return getStructuredApiErrorDetails(error);

    if (error.status === 400 && error.userMessage.startsWith("사업자 등록 신청 검증에 실패했습니다.")) {
      return { error: BUSINESS_VERIFICATION_INPUT_REVIEW_MESSAGE };
    }

    if (error.status === 403) return { error: BUSINESS_APPLICATION_FORBIDDEN_MESSAGE };
    if (error.status === 404) return { error: BUSINESS_APPLICATION_NOT_FOUND_MESSAGE };
    if (error.status === 409) return { error: BUSINESS_APPLICATION_CONFLICT_MESSAGE };
    if (error.status === 413) {
      return { error: BUSINESS_DOCUMENT_SIZE_ERROR };
    }
    if (error.status === 415) {
      return { error: "첨부 파일 형식을 지원하지 않습니다. PDF, JPG 또는 PNG 파일을 선택해주세요." };
    }
    if (error.status === 429) {
      return { error: "사업자 등록 신청 요청이 너무 많습니다. 잠시 후 다시 제출해주세요." };
    }
    if (error.status >= 500) {
      return {
        error:
          "사업자 등록 신청을 처리하는 서버에 일시적인 문제가 발생했습니다. 입력 내용은 유지한 채 잠시 후 다시 시도해주세요.",
      };
    }
  }

  return { error: getUserErrorMessage(error, "사업자 등록 신청에 실패했습니다.") };
};
