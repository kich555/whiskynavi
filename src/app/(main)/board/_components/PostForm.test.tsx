import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import PostForm from "./PostForm";

describe("PostForm toolbar", () => {
  it.each([
    ["제목 2", "h2"],
    ["제목 3", "h3"],
    ["글머리 목록", "ul"],
    ["번호 목록", "ol"],
  ])("%s 버튼으로 본문 블록 서식을 변경한다", async (buttonName, tagName) => {
    const user = userEvent.setup();
    const { container } = render(<PostForm action={() => undefined} state={null} />);

    await waitFor(() => {
      expect(container.querySelector(".ProseMirror")).toBeInTheDocument();
    });

    const editor = container.querySelector<HTMLElement>(".ProseMirror");
    expect(editor).not.toBeNull();

    await user.click(editor!);
    await user.type(editor!, "본문 서식");
    await user.click(screen.getByRole("button", { name: buttonName }));

    expect(editor!.querySelector(tagName)).toHaveTextContent("본문 서식");
    expect(editor!.closest(".post-rich-text")).toBeInTheDocument();
  });
});
