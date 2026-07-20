import { postApiS3Upload } from "@/apis/generated/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getSession } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdditionalImageUploader from "./AdditionalImageUploader";

vi.mock("@/apis/generated/api", () => ({
  postApiS3Upload: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn((token: string) => ({ token })),
}));

vi.mock("next-auth/react", () => ({
  getSession: vi.fn(),
}));

describe("AdditionalImageUploader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSession).mockResolvedValue({
      accessToken: "admin-token",
      expires: "2099-01-01T00:00:00.000Z",
      user: { id: "admin" },
    });
    vi.mocked(postApiS3Upload)
      .mockResolvedValueOnce({
        data: { key: "bottles/extra-1.jpg", url: "https://example.com/extra-1.jpg" },
        status: 200,
        headers: new Headers(),
      })
      .mockResolvedValueOnce({
        data: { key: "bottles/extra-2.jpg", url: "https://example.com/extra-2.jpg" },
        status: 200,
        headers: new Headers(),
      });
  });

  it("여러 이미지를 업로드하고 순서 변경 및 삭제 결과를 hidden input에 반영한다", async () => {
    const { container } = render(<AdditionalImageUploader maxSizeMB={5} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    fireEvent.change(input, {
      target: {
        files: [
          new File(["first"], "first.jpg", { type: "image/jpeg" }),
          new File(["second"], "second.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await waitFor(() => expect(postApiS3Upload).toHaveBeenCalledTimes(2));
    const hiddenInput = container.querySelector<HTMLInputElement>('input[name="additionalImageKeys"]')!;
    await waitFor(() => expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-1.jpg", "bottles/extra-2.jpg"])));

    fireEvent.click(screen.getByRole("button", { name: "1번째 추가 이미지를 뒤로 이동" }));
    expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-2.jpg", "bottles/extra-1.jpg"]));

    fireEvent.click(screen.getByRole("button", { name: "1번째 추가 이미지 삭제" }));
    expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-1.jpg"]));
  });
});
