import { _delete, addMessage, create } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addInquiryMessageAction, createInquiryAction, deleteInquiryAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  _delete: vi.fn(),
  addMessage: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn(() => ({ headers: { Authorization: "Bearer token" } })),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedCreate = vi.mocked(create);
const mockedAddMessage = vi.mocked(addMessage);
const mockedDelete = vi.mocked(_delete);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedWithToken = vi.mocked(withToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function formDataFrom(entries: Record<string, string>) {
  const formData = new FormData();
  Object.entries(entries).forEach(([key, value]) => formData.set(key, value));
  return formData;
}

describe("inquiry actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
  });

  it("제목이 비어 있으면 문의를 등록하지 않는다", async () => {
    const result = await createInquiryAction({ success: false }, formDataFrom({ title: "  ", content: "문의 내용" }));

    expect(result).toEqual({ success: false, error: "문의 제목을 입력해주세요." });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("추가 문의를 등록하고 목록과 상세 경로를 갱신한다", async () => {
    mockedAddMessage.mockResolvedValue({
      data: { id: 2, authorType: "USER", content: "추가 문의", hasImage: false },
      status: 200,
      headers: new Headers(),
    });

    const result = await addInquiryMessageAction(10, { success: false }, formDataFrom({ content: " 추가 문의 " }));

    expect(result).toEqual({ success: true });
    expect(mockedAddMessage).toHaveBeenCalledWith(
      10,
      { content: "추가 문의", hasImage: false },
      { headers: { Authorization: "Bearer token" } },
    );
    expect(mockedWithToken).toHaveBeenCalledWith("token");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page/inquiries");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page/inquiries/10");
  });

  it("내 문의를 삭제하고 목록 경로를 갱신한다", async () => {
    mockedDelete.mockResolvedValue({
      data: undefined,
      status: 200,
      headers: new Headers(),
    });

    await expect(deleteInquiryAction(10)).resolves.toEqual({ success: true });

    expect(mockedDelete).toHaveBeenCalledWith(10, { headers: { Authorization: "Bearer token" } });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/my-page/inquiries");
  });
});
