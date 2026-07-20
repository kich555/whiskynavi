import type { BottleAdminResponse } from "@/apis/generated/api";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminProductDetailEdit from "./AdminProductDetailEdit";

describe("AdminProductDetailEdit", () => {
  it("shows the rich text image controls for the bottle description", () => {
    render(<AdminProductDetailEdit selectedFile={null} onSelectFile={vi.fn()} />);

    expect(screen.getByRole("toolbar", { name: "본문 서식" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "이미지 추가" })).toBeInTheDocument();
  });

  it("checks archive visibility by default for new bottles", () => {
    render(<AdminProductDetailEdit selectedFile={null} onSelectFile={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "아카이브 노출" })).toBeChecked();
  });

  it("uses the existing archive visibility value when editing", () => {
    const bottle = {
      id: 10,
      name: "숨김 보틀",
      visible: false,
    } as BottleAdminResponse & { visible: boolean };

    render(<AdminProductDetailEdit defaultValues={bottle} selectedFile={null} onSelectFile={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "아카이브 노출" })).not.toBeChecked();
  });
});
