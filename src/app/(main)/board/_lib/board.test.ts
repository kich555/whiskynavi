import { getApiBoards } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBoard } from "./board";

vi.mock("@/apis/generated/api", () => ({
  getApiBoards: vi.fn(),
}));

const mockedGetApiBoards = vi.mocked(getApiBoards);

describe("getBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined when the board isn't in the fetched page (e.g. API throws)", async () => {
    mockedGetApiBoards.mockRejectedValue(new Error("network error"));

    await expect(getBoard("community", undefined)).resolves.toBeUndefined();
  });
});
