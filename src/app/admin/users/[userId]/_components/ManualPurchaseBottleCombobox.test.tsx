import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { searchManualPurchaseBottlesAction } from "../../actions";
import ManualPurchaseBottleCombobox from "./ManualPurchaseBottleCombobox";

vi.mock("../../actions", () => ({
  searchManualPurchaseBottlesAction: vi.fn(),
}));

const mockedSearchBottles = vi.mocked(searchManualPurchaseBottlesAction);

describe("ManualPurchaseBottleCombobox", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("검색 중 캐시된 키워드로 돌아오면 loading을 해제하고 캐시 결과를 보여준다", async () => {
    const user = userEvent.setup();

    mockedSearchBottles.mockImplementation(async (keyword) => {
      if (keyword === "") {
        return {
          success: true,
          data: [{ id: 1, name: "캐시 보틀", consumerPrice: 1000, stockQuantity: 3 }],
        };
      }
      return new Promise(() => undefined);
    });

    render(<ManualPurchaseBottleCombobox selected={null} onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText("보틀명을 검색하세요");
    await user.click(input);

    await waitFor(() => expect(screen.getByText("캐시 보틀 (ID: 1)")).toBeInTheDocument());

    await user.type(input, "slow");
    await new Promise((resolve) => setTimeout(resolve, 350));

    await waitFor(() => expect(screen.getByText("검색 중...")).toBeInTheDocument());

    await user.clear(input);

    await waitFor(() => expect(screen.queryByText("검색 중...")).not.toBeInTheDocument());
    expect(screen.getByText("캐시 보틀 (ID: 1)")).toBeInTheDocument();
  });
});
