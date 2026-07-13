import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoadMorePagination from "./LoadMorePagination";

function renderPagination(overrides: Partial<React.ComponentProps<typeof LoadMorePagination>> = {}) {
  render(
    <LoadMorePagination
      isMobile
      isLoadMoreMode
      showPagination={false}
      currentPage={1}
      totalPages={10}
      loadMoreRemaining={5}
      isLoadingMore={false}
      onLoadMore={vi.fn()}
      onPageChange={vi.fn()}
      {...overrides}
    />,
  );
}

describe("LoadMorePagination", () => {
  it("더보기 가능 횟수를 변하지 않는 형식으로 표시한다", () => {
    renderPagination({ loadMoreRemaining: 3 });

    expect(screen.getByRole("button", { name: "더보기 · 3회 남음" })).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*\/\s*\d+/)).not.toBeInTheDocument();
  });

  it("불러오는 동안 남은 횟수 대신 로딩 상태를 표시한다", () => {
    renderPagination({ isLoadingMore: true });

    expect(screen.getByRole("button", { name: "로딩 중..." })).toBeDisabled();
  });
});
