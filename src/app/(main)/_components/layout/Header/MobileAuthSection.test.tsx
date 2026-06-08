import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import MobileAuthSection from "./MobileAuthSection";

describe("MobileAuthSection", () => {
  it("shows guest order lookup below login for anonymous users", () => {
    render(<MobileAuthSection userName="" hasSession={false} isAdmin={false} isBusiness={false} close={vi.fn()} />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute("href", "/sign-in");
    expect(screen.getByRole("link", { name: "비회원 주문조회" })).toHaveAttribute("href", "/orders/guest");
  });

  it("shows business management link to the default business page for business users", () => {
    render(<MobileAuthSection userName="나비" hasSession isAdmin={false} isBusiness close={vi.fn()} />);

    expect(screen.getByRole("link", { name: "비즈니스 관리" })).toHaveAttribute("href", "/business");
  });
});
