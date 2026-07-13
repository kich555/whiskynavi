import { getApiBoardsBoardid } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBoard } from "./board";

vi.mock("@/apis/generated/api", () => ({
  getApiBoardsBoardid: vi.fn(),
}));

const mockedGetApiBoardsBoardid = vi.mocked(getApiBoardsBoardid);

describe("getBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a board from the route-specific endpoint", async () => {
    mockedGetApiBoardsBoardid.mockResolvedValue({
      data: { id: 3, slug: "community", name: "커뮤니티", postTypes: [] },
      status: 200,
      headers: new Headers(),
    });

    await expect(getBoard("community", undefined)).resolves.toMatchObject({ id: 3, slug: "community" });
    expect(mockedGetApiBoardsBoardid).toHaveBeenCalledWith("community", undefined);
  });

  it("does not hide a board API failure as an empty post type list", async () => {
    mockedGetApiBoardsBoardid.mockRejectedValue(new Error("network error"));

    await expect(getBoard("community", undefined)).rejects.toThrow("network error");
  });
});
