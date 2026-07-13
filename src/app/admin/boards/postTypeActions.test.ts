import {
  getApiAdminBoardsBoardidPostTypes,
  postApiAdminBoardsBoardidPostTypes,
  postApiAdminBoardsBoardidPostTypesPosttypeidActivate,
  postApiAdminBoardsBoardidPostTypesPosttypeidDeactivate,
  postApiAdminBoardsBoardidPostTypesPosttypeidDefault,
  putApiAdminBoardsBoardidPostTypesPosttypeid,
} from "@/apis/generated/api";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activatePostTypeAction,
  createPostTypeFormAction,
  deactivatePostTypeAction,
  setDefaultPostTypeAction,
  updatePostTypeFormAction,
} from "./actions";

vi.mock("@/apis/generated/api", () => ({
  getApiAdminBoardsBoardidPostTypes: vi.fn(),
  postApiAdminBoardsBoardidPostTypes: vi.fn(),
  putApiAdminBoardsBoardidPostTypesPosttypeid: vi.fn(),
  postApiAdminBoardsBoardidPostTypesPosttypeidActivate: vi.fn(),
  postApiAdminBoardsBoardidPostTypesPosttypeidDeactivate: vi.fn(),
  postApiAdminBoardsBoardidPostTypesPosttypeidDefault: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedList = vi.mocked(getApiAdminBoardsBoardidPostTypes);
const mockedCreate = vi.mocked(postApiAdminBoardsBoardidPostTypes);
const mockedUpdate = vi.mocked(putApiAdminBoardsBoardidPostTypesPosttypeid);
const mockedActivate = vi.mocked(postApiAdminBoardsBoardidPostTypesPosttypeidActivate);
const mockedDeactivate = vi.mocked(postApiAdminBoardsBoardidPostTypesPosttypeidDeactivate);
const mockedSetDefault = vi.mocked(postApiAdminBoardsBoardidPostTypesPosttypeidDefault);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("postType admin actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("admin-token");
    mockedList.mockResolvedValue({
      data: [{ id: 99, code: "existing-code", name: "기존타입" }],
      status: 200,
      headers: new Headers(),
    });
    mockedCreate.mockResolvedValue({
      data: { id: 1, name: "질문", code: "qna" },
      status: 200,
      headers: new Headers(),
    });
    mockedUpdate.mockResolvedValue({
      data: { id: 1, name: "질문", code: "qna" },
      status: 200,
      headers: new Headers(),
    });
    mockedActivate.mockResolvedValue({ data: { id: 5, active: true }, status: 200, headers: new Headers() });
    mockedDeactivate.mockResolvedValue({ data: { id: 5, active: false }, status: 200, headers: new Headers() });
    mockedSetDefault.mockResolvedValue({ data: { id: 5, default: true }, status: 200, headers: new Headers() });
  });

  it("rejects postType creation without an auth token", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.set("name", "질문");
    formData.set("code", "qna");

    await expect(createPostTypeFormAction(1, { success: false }, formData)).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects a code containing characters unsafe for URL query strings", async () => {
    const formData = new FormData();
    formData.set("name", "질문");
    formData.set("code", "q&a");

    const result = await createPostTypeFormAction(1, { success: false }, formData);

    expect(result.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects creating a postType whose code already exists on the board", async () => {
    const formData = new FormData();
    formData.set("name", "중복");
    formData.set("code", "existing-code");

    const result = await createPostTypeFormAction(1, { success: false }, formData);

    expect(result.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("rejects an invalid usage value instead of silently coercing to POST", async () => {
    const formData = new FormData();
    formData.set("name", "질문");
    formData.set("code", "qna");
    formData.set("usage", "BOGUS");

    const result = await createPostTypeFormAction(1, { success: false }, formData);

    expect(result.success).toBe(false);
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it("creates a postType with the selected usage and revalidates the board page", async () => {
    const formData = new FormData();
    formData.set("name", "질문");
    formData.set("code", "qna");
    formData.set("usage", "ANNOUNCEMENT");
    formData.set("displayOrder", "2");
    formData.set("active", "true");

    await expect(createPostTypeFormAction(1, { success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedCreate).toHaveBeenCalledWith(
      1,
      {
        name: "질문",
        code: "qna",
        usage: "ANNOUNCEMENT",
        displayOrder: 2,
        active: true,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("updates a postType and revalidates the board page", async () => {
    const formData = new FormData();
    formData.set("name", "질문 수정");
    formData.set("code", "qna");
    formData.set("usage", "POST");
    formData.set("displayOrder", "3");
    formData.set("active", "false");

    await expect(updatePostTypeFormAction(1, 5, { success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedUpdate).toHaveBeenCalledWith(
      1,
      5,
      {
        name: "질문 수정",
        code: "qna",
        usage: "POST",
        displayOrder: 3,
        active: false,
      },
      { headers: { Authorization: "Bearer admin-token" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("allows updating a postType while keeping its own unchanged code (self-exclusion from duplicate check)", async () => {
    mockedList.mockResolvedValue({
      data: [{ id: 5, code: "qna", name: "질문" }],
      status: 200,
      headers: new Headers(),
    });

    const formData = new FormData();
    formData.set("name", "질문 수정");
    formData.set("code", "qna");
    formData.set("usage", "POST");

    await expect(updatePostTypeFormAction(1, 5, { success: false }, formData)).resolves.toEqual({ success: true });
    expect(mockedUpdate).toHaveBeenCalled();
  });

  it("updates a postType to inactive when the active checkbox is unchecked (absent from FormData)", async () => {
    const formData = new FormData();
    formData.set("name", "질문 수정");
    formData.set("code", "qna");
    formData.set("usage", "POST");
    formData.set("displayOrder", "3");
    // active 체크박스가 해제되면 브라우저는 필드 자체를 FormData에 포함하지 않음

    await expect(updatePostTypeFormAction(1, 5, { success: false }, formData)).resolves.toEqual({ success: true });

    expect(mockedUpdate).toHaveBeenCalledWith(1, 5, expect.objectContaining({ active: false }), {
      headers: { Authorization: "Bearer admin-token" },
    });
  });

  it("activates a postType with admin token and revalidates the board page", async () => {
    await expect(activatePostTypeAction(1, 5)).resolves.toEqual({ success: true });

    expect(mockedActivate).toHaveBeenCalledWith(1, 5, { headers: { Authorization: "Bearer admin-token" } });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("deactivates a postType with admin token and revalidates the board page", async () => {
    await expect(deactivatePostTypeAction(1, 5)).resolves.toEqual({ success: true });

    expect(mockedDeactivate).toHaveBeenCalledWith(1, 5, { headers: { Authorization: "Bearer admin-token" } });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });

  it("sets a postType as default with admin token and revalidates the board page", async () => {
    await expect(setDefaultPostTypeAction(1, 5)).resolves.toEqual({ success: true });

    expect(mockedSetDefault).toHaveBeenCalledWith(1, 5, { headers: { Authorization: "Bearer admin-token" } });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/admin/boards/1");
  });
});
