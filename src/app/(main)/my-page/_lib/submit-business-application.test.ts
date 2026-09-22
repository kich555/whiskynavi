import { ApiError } from "@/apis/errors";
import { postApiUsersBusinessesApplications } from "@/apis/generated/api";
import { getSession } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitBusinessApplication } from "./submit-business-application";

vi.mock("@/apis/generated/api", () => ({ postApiUsersBusinessesApplications: vi.fn() }));
vi.mock("next-auth/react", () => ({ getSession: vi.fn() }));
const mockedSubmitBusinessApplication = vi.mocked(postApiUsersBusinessesApplications);

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

describe("submitBusinessApplication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getSession).mockResolvedValue({ user: { id: "test-user" }, accessToken: "token", expires: "2099-01-01" });
  });
  it.each(["", "billing@example.com"])("선택 이메일 %s를 신청 API에 전달한다", async (email) => {
    const form = createBusinessApplicationFormData();
    form.set("taxInvoiceEmail", email);
    await expect(submitBusinessApplication(form)).resolves.toEqual({ success: true });
    expect(mockedSubmitBusinessApplication).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ taxInvoiceEmail: email }),
      expect.anything(),
    );
  });

  it.each(["wrong-email", "a".repeat(250) + "@example.com"])(
    "잘못된 이메일은 API 호출 전에 거부한다",
    async (email) => {
      const form = createBusinessApplicationFormData();
      form.set("taxInvoiceEmail", email);
      expect((await submitBusinessApplication(form)).success).toBe(false);
      expect(mockedSubmitBusinessApplication).not.toHaveBeenCalled();
    },
  );

  it("로그인이 만료되면 이메일을 포함한 신청을 전송하지 않는다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "로그인이 필요합니다.",
    });
    expect(mockedSubmitBusinessApplication).not.toHaveBeenCalled();
  });

  it("10MB 초과 파일은 사업자 신청 API를 호출하기 전에 거부한다", async () => {
    const formData = createBusinessApplicationFormData();
    formData.set("document", new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf"));

    await expect(submitBusinessApplication(formData)).resolves.toEqual({
      success: false,
      error: "첨부 파일이 너무 큽니다. 사업자 등록증은 10MB 이하로 업로드해주세요.",
    });
    expect(mockedSubmitBusinessApplication).not.toHaveBeenCalled();
  });

  it("10MB 파일은 백엔드에 신청을 접수한다", async () => {
    const formData = createBusinessApplicationFormData();
    formData.set("document", new File([new Uint8Array(10 * 1024 * 1024)], "valid.pdf"));
    mockedSubmitBusinessApplication.mockResolvedValue({ data: {}, status: 200, headers: new Headers() });

    await expect(submitBusinessApplication(formData)).resolves.toEqual({ success: true });
    expect(mockedSubmitBusinessApplication).toHaveBeenCalledOnce();
  });

  it("백엔드의 413 응답도 현재 업로드 제한으로 안내한다", async () => {
    mockedSubmitBusinessApplication.mockRejectedValue(new ApiError(413, ""));

    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "첨부 파일이 너무 큽니다. 사업자 등록증은 10MB 이하로 업로드해주세요.",
    });
  });

  it("사업자 진위확인 valid 실패 시 입력 내용 검토 안내를 반환한다", async () => {
    const backendErrorMessage =
      "사업자 등록 신청 검증에 실패했습니다. 사업자등록번호, 개업일자, 대표자명을 다시 확인해 주세요.";
    mockedSubmitBusinessApplication.mockRejectedValue(
      new ApiError(400, JSON.stringify({ error: backendErrorMessage })),
    );

    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "국세청 사업자 검증에 실패했습니다. 입력하신 사업자등록번호, 개업일자, 대표자명을 다시 확인해주세요.",
    });

    expect(mockedSubmitBusinessApplication.mock.calls[0][2]?.headers).toEqual({ Authorization: "Bearer token" });
    expect(mockedSubmitBusinessApplication).toHaveBeenCalledOnce();
  });

  it("사업자 등록 신청 API를 찾지 못하면 원인과 다음 행동을 안내한다", async () => {
    mockedSubmitBusinessApplication.mockRejectedValue(
      new ApiError(404, JSON.stringify({ error: "요청한 엔드포인트를 찾을 수 없습니다." })),
    );

    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error:
        "사업자 등록 신청 페이지에 연결할 수 없습니다. 서비스가 업데이트 중이거나 신청 주소가 변경되었을 수 있습니다. 잠시 후 다시 시도하고, 계속되면 고객센터에 문의해주세요.",
    });
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

    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      code: "BUSINESS_VERIFICATION_FAILED",
      error: "국세청 진위확인 결과가 입력한 사업자 정보와 일치하지 않습니다.",
      hint: "사업자등록번호, 개업일자, 대표자명을 사업자등록증과 동일하게 입력했는지 확인해 주세요.",
      requestId: "request-123",
    });
  });

  it("로그인이 만료되면 API를 호출하지 않고 폼에 안내한다", async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    await expect(submitBusinessApplication(createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "로그인이 필요합니다.",
    });
    expect(mockedSubmitBusinessApplication).not.toHaveBeenCalled();
  });
});
