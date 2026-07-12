import { getApiBoards } from "@/apis/generated/api";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCommunityBoard } from "./board";

vi.mock("@/apis/generated/api", () => ({
  getApiBoards: vi.fn(),
}));

const mockedGetApiBoards = vi.mocked(getApiBoards);

describe("getCommunityBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns undefined when the community board isn't in the fetched page (e.g. API throws)", async () => {
    mockedGetApiBoards.mockRejectedValue(new Error("network error"));

    await expect(getCommunityBoard(undefined)).resolves.toBeUndefined();
  });
});
