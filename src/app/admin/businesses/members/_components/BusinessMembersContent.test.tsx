import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BusinessMembersSort } from "../sort";
import BusinessMembersContent from "./BusinessMembersContent";

const push = vi.fn();
const toggle = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/app/admin/_components/AdminLayoutClient", () => ({
  useSidebar: () => ({ toggle }),
}));

const defaultSearchParams = {
  page: "1",
  limit: "20",
};

const sortSearchParams = {
  page: "2",
  limit: "20",
  sort: "businessId,desc" as BusinessMembersSort,
};

function renderContent({
  searchParams = defaultSearchParams,
  members = [],
  totalElements = 0,
}: Partial<ComponentProps<typeof BusinessMembersContent>> = {}) {
  render(<BusinessMembersContent searchParams={searchParams} members={members} totalElements={totalElements} />);
}

describe("BusinessMembersContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", () => {
    renderContent();
    expect(screen.getByText("업장 관리")).toBeInTheDocument();
  });

  it("shows empty state when no members", () => {
    renderContent();
    expect(screen.getByText("업장이 없습니다.")).toBeInTheDocument();
  });

  it("shows total count", () => {
    renderContent({ totalElements: 7 });
    expect(screen.getByText("총 7건")).toBeInTheDocument();
  });

  it("renders business type before business name and shows all role badges", () => {
    renderContent({
      members: [
        {
          businessId: 100,
          userId: 10,
          businessName: "테스트 주류",
          businessType: "HOUSEHOLD",
          username: "hong@example.com",
          hasBusinessRole: true,
          hasTrailntaleBusinessRole: false,
          hasPickupRole: true,
          roles: ["ROLE_COMMUNITY_BUSINESS"],
        },
      ],
      totalElements: 1,
    });

    expect(screen.getByText("업장ID")).toBeInTheDocument();
    expect(screen.getByText("테스트 주류")).toBeInTheDocument();
    expect(screen.getByText("가정용")).toBeInTheDocument();
    expect(screen.getByText("hong@example.com")).toBeInTheDocument();
    expect(screen.getAllByText("있음")).toHaveLength(3);
    expect(screen.getAllByText("없음")).toHaveLength(1);
  });

  it("navigates to the member detail page when the detail button is clicked", async () => {
    const user = userEvent.setup();

    renderContent({
      members: [
        {
          businessId: 100,
          userId: 10,
          businessName: "테스트 주류",
          businessType: "HOUSEHOLD",
          username: "hong@example.com",
          hasBusinessRole: true,
          hasTrailntaleBusinessRole: false,
          hasPickupRole: false,
          roles: [],
        },
      ],
      totalElements: 1,
    });

    await user.click(screen.getByRole("button", { name: "상세" }));

    expect(push).toHaveBeenCalledWith("/admin/businesses/members/100");
  });

  it("renders current sort option", () => {
    renderContent({ searchParams: sortSearchParams, totalElements: 25 });

    expect(screen.getByLabelText("정렬")).toHaveValue("businessId,desc");
  });

  it("pushes a new query when sort is changed", async () => {
    const user = userEvent.setup();

    renderContent({ searchParams: sortSearchParams, totalElements: 25 });

    await user.selectOptions(screen.getByLabelText("정렬"), "businessId,asc");

    expect(push).toHaveBeenCalledTimes(1);

    const [pushedUrl] = push.mock.calls[0];
    const url = new URL(pushedUrl, "https://example.com");

    expect(url.pathname).toBe("/admin/businesses/members");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.get("sort")).toBe("businessId,asc");
  });

  it("pushes business name search query", async () => {
    const user = userEvent.setup();

    renderContent({
      searchParams: {
        page: "3",
        limit: "20",
        searchField: "businessName",
      },
    });

    await user.type(screen.getByPlaceholderText("사업장 명으로 검색..."), "테스트");

    const [pushedUrl] = push.mock.calls.at(-1) ?? [];
    const url = new URL(pushedUrl, "https://example.com");

    expect(url.pathname).toBe("/admin/businesses/members");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.searchParams.get("searchField")).toBe("businessName");
    expect(url.searchParams.get("q")).toBe("테스트");
  });
});
