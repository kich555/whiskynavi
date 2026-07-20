import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RichTextImageEditor from "./RichTextImageEditor";

describe("RichTextImageEditor", () => {
  beforeEach(() => {
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn(() => "blob:https://example.com/preview"),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("replaces the preview URL with the uploaded URL in the submitted value", async () => {
    let completeUpload: ((url: string) => void) | undefined;
    const uploadFn = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          completeUpload = resolve;
        }),
    );
    const onUploadingChange = vi.fn();
    const { container } = render(
      <RichTextImageEditor name="description" uploadFn={uploadFn} onUploadingChange={onUploadingChange} />,
    );
    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]');
    const hiddenInput = container.querySelector<HTMLInputElement>('input[type="hidden"][name="description"]');

    expect(fileInput).not.toBeNull();
    expect(hiddenInput).not.toBeNull();

    fireEvent.change(fileInput!, {
      target: {
        files: [new File(["image"], "description.png", { type: "image/png" })],
      },
    });

    await waitFor(() => {
      expect(uploadFn).toHaveBeenCalledOnce();
      expect(onUploadingChange).toHaveBeenLastCalledWith(true);
    });

    await act(async () => {
      completeUpload?.("https://cdn.example.com/description.png");
    });

    await waitFor(() => {
      expect(onUploadingChange).toHaveBeenLastCalledWith(false);
      expect(hiddenInput?.value).toContain('src="https://cdn.example.com/description.png"');
      expect(hiddenInput?.value).not.toContain("blob:");
    });
  });
});
