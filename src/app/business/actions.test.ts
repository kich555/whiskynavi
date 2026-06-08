import { ApiError } from "@/apis/errors";
import {
  deleteApiUsersBusinessesBusinessidMembersUserid,
  patchApiUsersBusinessesMeBusinessidPrimary,
  postApiUsersBusinessesBusinessidMembers,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addBusinessManagerAction, removeBusinessManagerAction, setPrimaryBusinessAction } from "./actions";

vi.mock("@/apis/generated/api", () => ({
  deleteApiUsersBusinessesBusinessidMembersUserid: vi.fn(),
  patchApiUsersBusinessesMeBusinessidPrimary: vi.fn(),
  postApiUsersBusinessesBusinessidMembers: vi.fn(),
  postApiUsersBusinessesBusinessidOwnershipTransfer: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getAuthToken: vi.fn(),
}));

vi.mock("@/apis/mutator", () => ({
  withToken: vi.fn(() => ({ headers: { Authorization: "Bearer mocked" } })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockedGetAuthToken = vi.mocked(getAuthToken);
const mockedWithToken = vi.mocked(withToken);
const mockedSetPrimary = vi.mocked(patchApiUsersBusinessesMeBusinessidPrimary);
const mockedAddManager = vi.mocked(postApiUsersBusinessesBusinessidMembers);
const mockedRemoveManager = vi.mocked(deleteApiUsersBusinessesBusinessidMembersUserid);
const mockedRevalidatePath = vi.mocked(revalidatePath);

describe("business actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuthToken.mockResolvedValue("token");
  });

  it("기본 사업장 변경 API를 호출하고 사업자 화면을 revalidate한다", async () => {
    mockedSetPrimary.mockResolvedValue({ data: {}, status: 200, headers: new Headers() });

    await expect(setPrimaryBusinessAction(10)).resolves.toEqual({ success: true });

    expect(mockedWithToken).toHaveBeenCalledWith("token");
    expect(mockedSetPrimary).toHaveBeenCalledWith(10, { headers: { Authorization: "Bearer mocked" } });
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/business");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/business/pickup-reservations");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/business/statistics");
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/business/members");
  });

  it("이메일을 trim해서 매니저 추가 API에 전달한다", async () => {
    mockedAddManager.mockResolvedValue({ data: {}, status: 200, headers: new Headers() });

    await expect(addBusinessManagerAction(10, { email: " manager@navi.test " })).resolves.toEqual({ success: true });

    expect(mockedAddManager).toHaveBeenCalledWith(
      10,
      { email: "manager@navi.test" },
      { headers: { Authorization: "Bearer mocked" } },
    );
    expect(mockedRevalidatePath).toHaveBeenCalledWith("/business/members");
  });

  it("인증 토큰이 없으면 API를 호출하지 않는다", async () => {
    mockedGetAuthToken.mockResolvedValue(undefined);

    await expect(removeBusinessManagerAction(10, 20)).resolves.toEqual({
      success: false,
      error: "인증이 필요합니다.",
    });

    expect(mockedRemoveManager).not.toHaveBeenCalled();
  });

  it("백엔드 오류 메시지를 사용자 메시지로 반환한다", async () => {
    mockedAddManager.mockRejectedValue(new ApiError(404, '{"message":"추가할 사용자를 찾을 수 없습니다."}'));

    await expect(addBusinessManagerAction(10, { email: "missing@navi.test" })).resolves.toEqual({
      success: false,
      error: "추가할 사용자를 찾을 수 없습니다.",
    });
  });
});
