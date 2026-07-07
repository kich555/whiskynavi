import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUserDetailSection from "./AdminUserDetailSection";

const mocks = vi.hoisted(() => ({
  overlayOpen: vi.fn(),
  selectedRole: "ROLE_BUSINESS",
}));

vi.mock("overlay-kit", () => ({
  overlay: { open: mocks.overlayOpen },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label {...props}>{children}</label>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({
    value,
    onValueChange,
    children,
  }: {
    value?: string;
    onValueChange?: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <div data-value={value}>
      {children}
      <button type="button" onClick={() => onValueChange?.(mocks.selectedRole)}>
        권한 선택
      </button>
    </div>
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: React.ReactNode; value: string }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("@/components/ui/switch", () => ({
  Switch: () => <button type="button">상태 스위치</button>,
}));

vi.mock("@/icons", () => ({
  IconGoogle: () => null,
  IconKakao: () => null,
  IconNaver: () => null,
}));

vi.mock("./modals/AdminConfirmModal", () => ({
  default: ({ onConfirm }: { onConfirm: () => void }) => (
    <button type="button" onClick={onConfirm}>
      관리자 권한 확인
    </button>
  ),
}));

const baseUser = {
  id: 12,
  username: "hong",
  email: "hong@example.com",
  phone: "010-0000-0000",
  name: "홍길동",
  status: "ACTIVE",
  createdAt: "2026-05-01T00:00:00.000Z",
  roles: ["ROLE_COMMUNITY_BUSINESS"],
};

describe("AdminUserDetailSection", () => {
  beforeEach(() => {
    mocks.overlayOpen.mockClear();
    mocks.selectedRole = "ROLE_BUSINESS";
  });

  it("adds parent business role without replacing existing child business role", async () => {
    const user = userEvent.setup();
    const onAddRole = vi.fn();

    render(
      <AdminUserDetailSection
        isEditMode
        userDetails={baseUser}
        onAddRole={onAddRole}
        onRemoveRole={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "권한 수정" }));
    await user.click(screen.getByRole("button", { name: "권한 선택" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(mocks.overlayOpen).not.toHaveBeenCalled();
    expect(onAddRole).toHaveBeenCalledWith("ROLE_BUSINESS");
  });

  it("does not remove existing admin role before adding another admin role", async () => {
    const user = userEvent.setup();
    const onAddRole = vi.fn();
    mocks.selectedRole = "ROLE_SUPER_ADMIN";

    render(
      <AdminUserDetailSection
        isEditMode
        userDetails={{
          ...baseUser,
          roles: ["ROLE_ADMIN"],
        }}
        onAddRole={onAddRole}
        onRemoveRole={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "권한 수정" }));
    await user.click(screen.getByRole("button", { name: "권한 선택" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    const overlayRenderer = mocks.overlayOpen.mock.calls[0][0];
    render(overlayRenderer({ isOpen: true, close: vi.fn() }));
    await user.click(screen.getByRole("button", { name: "관리자 권한 확인" }));

    expect(onAddRole).toHaveBeenCalledWith("ROLE_SUPER_ADMIN");
  });
});
