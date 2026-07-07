import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UserEditContent from "./UserEditContent";

const mocks = vi.hoisted(() => ({
  back: vi.fn(),
  open: vi.fn(),
  refresh: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mocks.back, refresh: mocks.refresh }),
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: mocks.open },
}));

vi.mock("../../../../_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle: mocks.toggle }),
}));

vi.mock("../../../../_components/AdminHeader", () => ({
  default: ({ title }: { title: string }) => <header>{title}</header>,
}));

vi.mock("../../../../components/AdminUserDetailSection", () => ({
  default: () => <section>회원 상세 섹션</section>,
}));

vi.mock("../../_components/ManualPurchaseCreateModal", () => ({
  default: () => null,
}));

vi.mock("../../../actions", () => ({
  addUserRolesAction: vi.fn(),
  removeUserRolesAction: vi.fn(),
  updateUserStatusAction: vi.fn(),
}));

const baseUser = {
  id: 12,
  name: "홍길동",
  username: "hong",
  email: "hong@example.com",
  roles: ["ROLE_USER"],
  status: "ACTIVE",
  createdAt: "2026-05-01T00:00:00.000Z",
};

describe("UserEditContent", () => {
  beforeEach(() => {
    mocks.open.mockClear();
  });

  it("opens the manual purchase modal from the edit page", async () => {
    const user = userEvent.setup();

    render(<UserEditContent user={baseUser} />);

    await user.click(screen.getByRole("button", { name: "구매내역 추가" }));

    expect(mocks.open).toHaveBeenCalledOnce();
  });
});
