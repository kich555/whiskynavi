import { postApiAdminBoardsAnnouncements, putApiAdminBoardsAnnouncementsAnnouncementid } from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAnnouncementFormAction, updateAnnouncementFormAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  postApiAdminBoardsAnnouncements: vi.fn(),
  putApiAdminBoardsAnnouncementsAnnouncementid: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedCreate = vi.mocked(postApiAdminBoardsAnnouncements);
const mockedUpdate = vi.mocked(putApiAdminBoardsAnnouncementsAnnouncementid);
const mockedRevalidatePath = vi.mocked(revalidatePath);

function baseCreateFormData() {
  const formData = new FormData();
  formData.set("title", "이벤트 공지");
  formData.set("content", "내용");
  formData.set("scope", "BOARD");
  formData.set("postTypeCode", "notice-event");
  formData.set("priority", "0");
  formData.set("visible", "true");
  return formData;
}

describe("announcement admin actions — postTypeCode routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedCreate.mockResolvedValue({ data: { id: 1 }, status: 200, headers: new Headers() });
    mockedUpdate.mockResolvedValue({ data: { id: 1 }, status: 200, headers: new Headers() });
  });

  it("sends postTypeCode when creating a BOARD announcement", async () => {
    const formData = baseCreateFormData();

    await expect(createAnnouncementFormAction(1, { success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "BOARD", postTypeCode: "notice-event", boardId: 1 }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("omits postTypeCode when creating a GLOBAL announcement", async () => {
    const formData = baseCreateFormData();
    formData.set("scope", "GLOBAL");

    await expect(createAnnouncementFormAction(1, { success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "GLOBAL", postTypeCode: undefined, boardId: undefined }),
      expect.anything(),
    );
  });

  it("sends postTypeCode when updating a BOARD announcement", async () => {
    const formData = baseCreateFormData();

    await expect(updateAnnouncementFormAction(1, 1, { success: false }, formData)).resolves.toEqual({
      success: true,
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ scope: "BOARD", postTypeCode: "notice-event", boardId: 1 }),
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("omits postTypeCode when updating a GLOBAL announcement", async () => {
    const formData = baseCreateFormData();
    formData.set("scope", "GLOBAL");

    await expect(updateAnnouncementFormAction(1, 1, { success: false }, formData)).resolves.toEqual({
      success: true,
    });

    expect(mockedUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ scope: "GLOBAL", postTypeCode: undefined, boardId: undefined }),
      expect.anything(),
    );
  });
});
