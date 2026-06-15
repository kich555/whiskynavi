"use server";

import {
  deleteApiAdminUsersId,
  getApiAdminBottles,
  patchApiAdminUsersIdRolesAdd,
  patchApiAdminUsersIdRolesRemove,
  patchApiAdminUsersIdStatus,
  postApiAdminOrdersUsersUseridManualPurchases,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface ManualPurchaseBottleOption {
  id: number;
  name: string;
  consumerPrice: number | null;
  stockQuantity: number | null;
}

export type SearchManualPurchaseBottlesResult =
  | { success: true; data: ManualPurchaseBottleOption[] }
  | { success: false; error: string };

export async function searchManualPurchaseBottlesAction(keyword: string): Promise<SearchManualPurchaseBottlesResult> {
  const token = await getAuthToken();
  if (!token) return { success: false, error: "인증이 필요합니다." };

  try {
    const trimmed = keyword.trim().slice(0, 100);
    const res = await getApiAdminBottles(
      {
        keyword: trimmed || undefined,
        size: 20,
      },
      withToken(token),
    );
    const data: ManualPurchaseBottleOption[] =
      res.data.content
        ?.filter((b): b is typeof b & { id: number; name: string } => b.id != null && b.name != null)
        .map((b) => ({
          id: b.id,
          name: b.name,
          consumerPrice: b.consumerPrice ?? null,
          stockQuantity: b.stockQuantity ?? null,
        })) ?? [];
    return { success: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "보틀 검색에 실패했습니다.";
    return { success: false, error: message };
  }
}

export interface CreateManualPurchaseInput {
  bottleId: number;
  unitPrice: number;
  requestedQuantity: number;
  orderNote?: string;
}

export async function createManualPurchaseAction(userId: number, input: CreateManualPurchaseInput) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  if (!Number.isInteger(userId) || userId < 1) {
    return { success: false, error: "사용자 ID가 올바르지 않습니다." };
  }
  if (!Number.isInteger(input.bottleId) || input.bottleId < 1) {
    return { success: false, error: "보틀을 선택해 주세요." };
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    return { success: false, error: "단가는 0 이상이어야 합니다." };
  }
  if (!Number.isInteger(input.requestedQuantity) || input.requestedQuantity < 1) {
    return { success: false, error: "수량은 1개 이상이어야 합니다." };
  }
  if ((input.orderNote ?? "").length > 500) {
    return { success: false, error: "메모는 500자를 초과할 수 없습니다." };
  }

  try {
    await postApiAdminOrdersUsersUseridManualPurchases(
      userId,
      {
        bottleId: input.bottleId,
        unitPrice: input.unitPrice,
        requestedQuantity: input.requestedQuantity,
        orderNote: input.orderNote?.trim() || undefined,
      },
      withToken(token),
    );
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "구매내역 추가에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function deleteUserAction(userId: number) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await deleteApiAdminUsersId(userId, withToken(token));
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "회원 삭제에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function updateUserStatusAction(userId: number, status: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminUsersIdStatus(userId, { status }, withToken(token));
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "상태 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function addUserRolesAction(userId: number, roles: string[]) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminUsersIdRolesAdd(userId, { roles }, withToken(token));
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "권한 추가에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function removeUserRolesAction(userId: number, roles: string[]) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminUsersIdRolesRemove(userId, { roles }, withToken(token));
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "권한 제거에 실패했습니다.";
    return { success: false, error: message };
  }
}

export async function replaceUserRoleAction(userId: number, oldRole: string, newRole: string) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await patchApiAdminUsersIdRolesRemove(userId, { roles: [oldRole] }, withToken(token));
    await patchApiAdminUsersIdRolesAdd(userId, { roles: [newRole] }, withToken(token));
    revalidatePath(`/admin/users/${userId}`);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "권한 변경에 실패했습니다.";
    return { success: false, error: message };
  }
}
