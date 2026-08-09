import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pagination from "./Pagination";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("admin Pagination", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("구역별 페이지 파라미터를 변경하면서 다른 구역 조건을 유지한다", async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        totalItems={30}
        itemsPerPage={10}
        currentPage={2}
        searchParams={{ unpublishedPage: "3", unpublishedLimit: "20" }}
        basePath="/admin/banners"
        pageParam="publishedPage"
        limitParam="publishedLimit"
      />,
    );

    await user.click(screen.getByRole("button", { name: "3" }));

    expect(push).toHaveBeenCalledWith("/admin/banners?unpublishedPage=3&unpublishedLimit=20&publishedPage=3");
  });

  it("구역별 페이지 크기를 변경하면 해당 구역만 1페이지로 이동한다", async () => {
    const user = userEvent.setup();
    render(
      <Pagination
        totalItems={30}
        itemsPerPage={10}
        currentPage={2}
        searchParams={{ unpublishedPage: "3" }}
        basePath="/admin/banners"
        pageParam="publishedPage"
        limitParam="publishedLimit"
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "20");

    expect(push).toHaveBeenCalledWith("/admin/banners?unpublishedPage=3&publishedLimit=20&publishedPage=1");
  });
});
