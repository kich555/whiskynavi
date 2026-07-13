import { render, waitFor } from "@testing-library/react";
import { useActionState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PostCreateContent from "./PostCreateContent";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn(),
  };
});

vi.mock("../_lib/actions", () => ({
  createPostAction: vi.fn(),
}));

vi.mock("./PostForm", () => ({
  default: () => <div>게시글 폼</div>,
}));

const mockedUseActionState = vi.mocked(useActionState);

describe("PostCreateContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("게시글 등록 성공 상태를 받으면 목록으로 이동한다", async () => {
    mockedUseActionState.mockReturnValue([{ success: true }, vi.fn(), false]);

    render(<PostCreateContent boardId="community" postTypes={[]} />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/board/community");
    });
  });

  it("등록 실패 상태에서는 목록으로 이동하지 않는다", () => {
    mockedUseActionState.mockReturnValue([{ success: false, error: "등록 실패" }, vi.fn(), false]);

    render(<PostCreateContent boardId="community" postTypes={[]} />);

    expect(replace).not.toHaveBeenCalled();
  });
});
