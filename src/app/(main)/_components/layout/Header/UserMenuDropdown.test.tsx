import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import UserMenuDropdown from "./UserMenuDropdown";

describe("UserMenuDropdown", () => {
  it("shows business management link to the default business page for business users", () => {
    render(<UserMenuDropdown close={vi.fn()} isAdminUser={false} isBusinessUser />);

    expect(screen.getByRole("link", { name: "비즈니스 관리" })).toHaveAttribute("href", "/business");
  });
});
