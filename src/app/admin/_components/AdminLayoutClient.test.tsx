import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import AdminLayoutClient, { useSidebar } from "./AdminLayoutClient";
vi.mock("./AdminSidebar", () => ({
  default: ({ isOpen }: { isOpen: boolean }) => <div data-testid="sidebar" data-open={isOpen} />,
}));
function Content() {
  const { toggle } = useSidebar();
  return <button onClick={toggle}>메뉴 토글</button>;
}
afterEach(() => vi.unstubAllGlobals());
it.each([false, true])("화면 너비에 따라 메뉴를 기본 표시하고 토글한다: %s", (desktop) => {
  vi.stubGlobal("matchMedia", () => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  render(
    <AdminLayoutClient statsSlot={null}>
      <Content />
    </AdminLayoutClient>,
  );
  expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", String(desktop));
  fireEvent.click(screen.getByRole("button", { name: "메뉴 토글" }));
  expect(screen.getByTestId("sidebar")).toHaveAttribute("data-open", String(!desktop));
});
