import { close, reopen, reply } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { closeInquiryAction, reopenInquiryAction, replyInquiryAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  close: vi.fn(),
  reopen: vi.fn(),
  reply: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedClose = vi.mocked(close);
const mockedReopen = vi.mocked(reopen);
const mockedReply = vi.mocked(reply);
const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function replyForm(content: string) {
  const formData = new FormData();
  formData.set("content", content);
  return formData;
}

describe("admin inquiry actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
  });

  it("빈 답변은 등록하지 않는다", async () => {
    const result = await replyInquiryAction(10, { success: false }, replyForm("  "));

    expect(result).toEqual({ success: false, error: "답변 내용을 입력해주세요." });
    expect(mockedReply).not.toHaveBeenCalled();
  });

  it("관리자 답변을 등록하고 목록과 상세 경로를 갱신한다", async () => {
    mockedReply.mockResolvedValue({
      data: { id: 3, authorType: "ADMIN", authorId: 1, content: "답변", hasImage: false },
      status: 200,
      headers: new Headers(),
    });

    const result = await replyInquiryAction(10, { success: false }, replyForm(" 답변 "));

    expect(result).toMatchObject({ success: true });
    expect(mockedReply).toHaveBeenCalledWith(
      10,
      { content: "답변", hasImage: false },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/inquiries");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/inquiries/10");
  });

  it("이미지가 포함된 답변에 hasImage를 설정한다", async () => {
    mockedReply.mockResolvedValue({
      data: { id: 3, authorType: "ADMIN", authorId: 1, content: "답변", hasImage: true },
      status: 200,
      headers: new Headers(),
    });

    await replyInquiryAction(
      10,
      { success: false },
      replyForm('<p>답변</p><img src="https://cdn.example.com/reply.png">'),
    );

    expect(mockedReply).toHaveBeenCalledWith(
      10,
      {
        content: '<p>답변</p><img src="https://cdn.example.com/reply.png" />',
        hasImage: true,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
  });

  it("문의를 종료하고 다시 열 수 있다", async () => {
    mockedClose.mockResolvedValue({
      data: { id: 10, status: "CLOSED" },
      status: 200,
      headers: new Headers(),
    });
    mockedReopen.mockResolvedValue({
      data: { id: 10, status: "WAITING" },
      status: 200,
      headers: new Headers(),
    });

    await expect(closeInquiryAction(10)).resolves.toEqual({ success: true });
    await expect(reopenInquiryAction(10)).resolves.toEqual({ success: true });

    expect(mockedClose).toHaveBeenCalledOnce();
    expect(mockedReopen).toHaveBeenCalledOnce();
  });
});
