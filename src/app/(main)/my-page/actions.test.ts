import { ApiError } from "@/apis/errors";
import {
  patchApiV2OrdersOrderidReceipt,
  postApiUsersBusinessesApplicationsApplicationidCancel,
  putApiUsersMeAgreements,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cancelBusinessApplication, completeReceipt, updateProfile } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  patchApiOrdersOrderidCancel: vi.fn(),
  patchApiV2OrdersOrderidReceipt: vi.fn(),
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

const mockedCompleteReceipt = vi.mocked(patchApiV2OrdersOrderidReceipt);
const mockedCancelBusinessApplication = vi.mocked(postApiUsersBusinessesApplicationsApplicationidCancel);
const mockedPutApiUsersMeAgreements = vi.mocked(putApiUsersMeAgreements);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("my-page actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
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

  it("본인 주문을 수령 완료 처리하고 마이페이지를 갱신한다", async () => {
    mockedCompleteReceipt.mockResolvedValue({
      data: { orderId: 17, orderStatus: "RECEIPT_COMPLETED" },
      status: 200,
      headers: new Headers(),
    });

    await expect(completeReceipt(17)).resolves.toEqual({ success: true });

    expect(mockedCompleteReceipt).toHaveBeenCalledWith(17, {
      headers: { Authorization: "Bearer mocked" },
    });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page");
  });
});
