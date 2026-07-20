import { postApiAdminImagesPurpose } from "@/apis/generated/api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { getSession } from "next-auth/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdditionalImageUploader from "./AdditionalImageUploader";

vi.mock("@/apis/generated/api", () => ({
  postApiAdminImagesPurpose: vi.fn(),
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
    vi.mocked(postApiAdminImagesPurpose)
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
    const { container } = render(<AdditionalImageUploader purpose="BOTTLE" maxSizeMB={5} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    fireEvent.change(input, {
      target: {
        files: [
          new File(["first"], "first.jpg", { type: "image/jpeg" }),
          new File(["second"], "second.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await waitFor(() => expect(postApiAdminImagesPurpose).toHaveBeenCalledTimes(2));
    expect(postApiAdminImagesPurpose).toHaveBeenCalledWith("BOTTLE", expect.any(Object), expect.any(Object));
    const hiddenInput = container.querySelector<HTMLInputElement>('input[name="additionalImageKeys"]')!;
    await waitFor(() => expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-1.jpg", "bottles/extra-2.jpg"])));

    fireEvent.click(screen.getByRole("button", { name: "1번째 추가 이미지를 뒤로 이동" }));
    expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-2.jpg", "bottles/extra-1.jpg"]));

    fireEvent.click(screen.getByRole("button", { name: "1번째 추가 이미지 삭제" }));
    expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-1.jpg"]));
  });

  it("일부 업로드가 실패해도 모든 요청이 끝날 때까지 업로드 상태를 유지하고 성공한 이미지는 보존한다", async () => {
    type UploadResult = Awaited<ReturnType<typeof postApiAdminImagesPurpose>>;
    let resolveSecondUpload!: (result: UploadResult) => void;
    const secondUpload = new Promise<UploadResult>((resolve) => {
      resolveSecondUpload = resolve;
    });
    vi.mocked(postApiAdminImagesPurpose)
      .mockReset()
      .mockRejectedValueOnce(new Error("첫 번째 이미지 업로드 실패"))
      .mockReturnValueOnce(secondUpload);
    const onUploadingChange = vi.fn();
    const { container } = render(
      <AdditionalImageUploader purpose="BOTTLE" maxSizeMB={5} onUploadingChange={onUploadingChange} />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    fireEvent.change(input, {
      target: {
        files: [
          new File(["first"], "first.jpg", { type: "image/jpeg" }),
          new File(["second"], "second.jpg", { type: "image/jpeg" }),
        ],
      },
    });

    await waitFor(() => expect(postApiAdminImagesPurpose).toHaveBeenCalledTimes(2));
    expect(onUploadingChange).toHaveBeenLastCalledWith(true);

    resolveSecondUpload({
      data: { key: "bottles/extra-2.jpg", url: "https://example.com/extra-2.jpg" },
      status: 200,
      headers: new Headers(),
    });

    const hiddenInput = container.querySelector<HTMLInputElement>('input[name="additionalImageKeys"]')!;
    await waitFor(() => expect(hiddenInput.value).toBe(JSON.stringify(["bottles/extra-2.jpg"])));
    expect(onUploadingChange).toHaveBeenLastCalledWith(false);
    expect(screen.getByRole("alert")).toHaveTextContent("1개 이미지 업로드에 실패했습니다.");
  });

  it("백엔드가 허용하지 않는 이미지 형식은 업로드하지 않는다", async () => {
    const { container } = render(<AdditionalImageUploader purpose="BOTTLE" maxSizeMB={5} />);
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;

    expect(input).toHaveAttribute("accept", "image/jpeg,image/png,image/webp");
    fireEvent.change(input, {
      target: { files: [new File(["gif"], "animated.gif", { type: "image/gif" })] },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("JPG, PNG, WEBP");
    expect(postApiAdminImagesPurpose).not.toHaveBeenCalled();
  });
});
