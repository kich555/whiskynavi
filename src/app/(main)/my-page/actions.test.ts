import { ApiError } from "@/apis/errors";
import {
  postApiUsersBusinessesApplications,
  postApiUsersBusinessesApplicationsApplicationidCancel,
  putApiUsersMeAgreements,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelBusinessApplication, submitBusinessApplication, updateProfile } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  patchApiOrdersOrderidCancel: vi.fn(),
  postApiUsersBusinessesApplications: vi.fn(),
  postApiUsersBusinessesApplicationsApplicationidCancel: vi.fn(),
  postApiUsersMeEmailVerificationSend: vi.fn(),
  postApiUsersMeEmailVerificationVerify: vi.fn(),
  putApiUsersMeAgreements: vi.fn(),
  putApiAuthChangePassword: vi.fn(),
  putApiUsersMeEmail: vi.fn(),
  putApiUsersMeNickname: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn(() => ({ headers: { Authorization: "Bearer mocked" } })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedSubmitBusinessApplication = vi.mocked(postApiUsersBusinessesApplications);
const mockedCancelBusinessApplication = vi.mocked(postApiUsersBusinessesApplicationsApplicationidCancel);
const mockedPutApiUsersMeAgreements = vi.mocked(putApiUsersMeAgreements);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedWithToken = vi.mocked(withToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

const createBusinessApplicationFormData = () => {
  const formData = new FormData();
  formData.set("businessName", "테스트 주류");
  formData.set("pickupAddress", "서울시 강남구");
  formData.set("contact", "010-1234-5678");
  formData.set("businessRegistrationNumber", "123-45-67890");
  formData.set("businessType", "HOUSEHOLD");
  formData.set("openingDate", "2026-01-01");
  formData.set("representativeName", "홍길동");
  formData.set("document", new File(["document"], "business.pdf", { type: "application/pdf" }));
  return formData;
};

describe("my-page actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
  });

  it("사업자 진위확인 valid 실패 시 입력 내용 검토 안내를 반환한다", async () => {
    const backendErrorMessage =
      "사업자 등록 신청 검증에 실패했습니다. 사업자등록번호, 개업일자, 대표자명을 다시 확인해 주세요.";
    mockedSubmitBusinessApplication.mockRejectedValue(
      new ApiError(400, JSON.stringify({ error: backendErrorMessage })),
    );

    await expect(submitBusinessApplication({ success: false }, createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "국세청 사업자 검증에 실패했습니다. 입력하신 사업자등록번호, 개업일자, 대표자명을 다시 확인해주세요.",
    });

    expect(mockedWithToken).toHaveBeenCalledWith("token");
    expect(mockedSubmitBusinessApplication).toHaveBeenCalledOnce();
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("사업자 등록 신청 API를 찾지 못하면 원인과 다음 행동을 안내한다", async () => {
    mockedSubmitBusinessApplication.mockRejectedValue(
      new ApiError(404, JSON.stringify({ error: "요청한 엔드포인트를 찾을 수 없습니다." })),
    );

    await expect(submitBusinessApplication({ success: false }, createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error:
        "사업자 등록 신청 페이지에 연결할 수 없습니다. 서비스가 업데이트 중이거나 신청 주소가 변경되었을 수 있습니다. 잠시 후 다시 시도하고, 계속되면 고객센터에 문의해주세요.",
    });

    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });

  it("구조화된 사업자 검증 오류의 메시지, 힌트와 문의 코드를 보존한다", async () => {
    mockedSubmitBusinessApplication.mockRejectedValue(
      new ApiError(
        400,
        JSON.stringify({
          code: "BUSINESS_VERIFICATION_FAILED",
          message: "국세청 진위확인 결과가 입력한 사업자 정보와 일치하지 않습니다.",
          hint: "사업자등록번호, 개업일자, 대표자명을 사업자등록증과 동일하게 입력했는지 확인해 주세요.",
          requestId: "request-123",
        }),
      ),
    );

    await expect(submitBusinessApplication({ success: false }, createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      code: "BUSINESS_VERIFICATION_FAILED",
      error: "국세청 진위확인 결과가 입력한 사업자 정보와 일치하지 않습니다.",
      hint: "사업자등록번호, 개업일자, 대표자명을 사업자등록증과 동일하게 입력했는지 확인해 주세요.",
      requestId: "request-123",
    });
  });

  it("사업자 신청 취소 오류의 구체적인 상태와 해결 방법을 보존한다", async () => {
    mockedCancelBusinessApplication.mockRejectedValue(
      new ApiError(
        404,
        JSON.stringify({
          code: "BUSINESS_APPLICATION_NOT_FOUND",
          message: "요청한 사업자 등록 신청을 찾을 수 없습니다.",
          hint: "신청이 삭제되었거나 현재 계정의 신청이 아닐 수 있습니다. 신청 내역을 새로고침해 주세요.",
          requestId: "request-456",
        }),
      ),
    );

    await expect(cancelBusinessApplication(17)).resolves.toEqual({
      success: false,
      code: "BUSINESS_APPLICATION_NOT_FOUND",
      error: "요청한 사업자 등록 신청을 찾을 수 없습니다.",
      hint: "신청이 삭제되었거나 현재 계정의 신청이 아닐 수 있습니다. 신청 내역을 새로고침해 주세요.",
      requestId: "request-456",
    });
  });

  it("수신동의만 변경해도 프로필 변경으로 저장한다", async () => {
    const formData = new FormData();
    formData.set("username", "tester");
    formData.set("email", "tester@example.com");
    formData.set("originalUsername", "tester");
    formData.set("originalEmail", "tester@example.com");
    formData.set("emailVerified", "true");
    formData.set("originalMarketingAgree", "true");
    formData.set("originalEmailAgree", "false");
    formData.set("originalSmsAgree", "true");
    formData.set("originalSnsAgree", "false");
    formData.set("marketingAgree", "false");
    formData.set("emailAgree", "true");
    formData.set("smsAgree", "false");
    formData.set("snsAgree", "true");

    await expect(updateProfile({ success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedPutApiUsersMeAgreements).toHaveBeenCalledWith(
      {
        marketingAgree: false,
        emailAgree: true,
        smsAgree: false,
        snsAgree: true,
      },
      { headers: { Authorization: "Bearer mocked" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page");
  });
});
