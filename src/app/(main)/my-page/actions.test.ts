import { ApiError } from "@/apis/errors";
import { postApiUsersBusinessesApplications } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { submitBusinessApplication } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  patchApiOrdersOrderidCancel: vi.fn(),
  postApiUsersBusinessesApplications: vi.fn(),
  postApiUsersBusinessesApplicationsApplicationidCancel: vi.fn(),
  postApiUsersMeEmailVerificationSend: vi.fn(),
  postApiUsersMeEmailVerificationVerify: vi.fn(),
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
    mockedSubmitBusinessApplication.mockRejectedValue(new ApiError(400, JSON.stringify({ error: backendErrorMessage })));

    await expect(submitBusinessApplication({ success: false }, createBusinessApplicationFormData())).resolves.toEqual({
      success: false,
      error: "국세청 사업자 검증에 실패했습니다. 입력하신 사업자등록번호, 개업일자, 대표자명을 다시 확인해주세요.",
    });

    expect(mockedWithToken).toHaveBeenCalledWith("token");
    expect(mockedSubmitBusinessApplication).toHaveBeenCalledOnce();
    expect(mockedRevalidatePath).not.toHaveBeenCalled();
  });
});
