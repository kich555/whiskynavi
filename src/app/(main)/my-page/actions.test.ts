import { customFetch, withToken } from "@/apis/mutator";
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

vi.mock("@/apis/mutator", () => ({
  customFetch: vi.fn(),
  withToken: vi.fn(() => ({ headers: { Authorization: "Bearer mocked" } })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedCustomFetch = vi.mocked(customFetch);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);
const mockedWithToken = vi.mocked(withToken);

function validBusinessApplicationFormData() {
  const formData = new FormData();
  formData.set("businessName", "나비 바");
  formData.set("contact", "02-1234-5678");
  formData.set("businessRegistrationNumber", "123-45-67890");
  formData.set("businessType", "ENTERTAINMENT");
  formData.set("pickupAddress", "서울시 강남구");
  formData.set("openingDate", "2026-01-01");
  formData.set("representativeName", "홍길동");
  formData.set("document", new File(["document"], "business.pdf", { type: "application/pdf" }));
  return formData;
}

describe("my-page actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("access-token");
    mockedCustomFetch.mockResolvedValue({ data: {}, status: 200, headers: new Headers() });
  });

  it("사업자 신청 정보를 파일과 함께 multipart body로 전송한다", async () => {
    const result = await submitBusinessApplication({ success: false }, validBusinessApplicationFormData());

    expect(result).toEqual({ success: true });
    expect(mockedWithToken).toHaveBeenCalledWith("access-token");
    expect(mockedCustomFetch).toHaveBeenCalledWith(
      "/api/users/businesses/applications",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Bearer mocked" },
        body: expect.any(FormData),
      }),
    );

    const body = mockedCustomFetch.mock.calls[0][1].body as FormData;
    expect(body.get("businessName")).toBe("나비 바");
    expect(body.get("contact")).toBe("02-1234-5678");
    expect(body.get("businessRegistrationNumber")).toBe("123-45-67890");
    expect(body.get("businessType")).toBe("ENTERTAINMENT");
    expect(body.get("pickupAddress")).toBe("서울시 강남구");
    expect(body.get("openingDate")).toBe("2026-01-01");
    expect(body.get("representativeName")).toBe("홍길동");
    expect(body.get("document")).toBeInstanceOf(File);
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page");
  });
});
