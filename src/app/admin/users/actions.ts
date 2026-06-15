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
import { z } from "zod";

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

const createManualPurchaseSchema = z.object({
  bottleId: z.number().int("보틀을 선택해 주세요.").min(1, "보틀을 선택해 주세요."),
  unitPrice: z.number().finite("단가는 0 이상이어야 합니다.").min(0, "단가는 0 이상이어야 합니다."),
  requestedQuantity: z.number().int("수량은 1개 이상이어야 합니다.").min(1, "수량은 1개 이상이어야 합니다."),
  orderNote: z.string().max(500, "메모는 500자를 초과할 수 없습니다.").optional(),
});

export async function createManualPurchaseAction(userId: number, input: unknown) {
  const token = await getAuthToken();

  if (!token) {
    return { success: false, error: "인증이 필요합니다." };
  }

  if (!Number.isInteger(userId) || userId < 1) {
    return { success: false, error: "사용자 ID가 올바르지 않습니다." };
  }

  const parsed = createManualPurchaseSchema.safeParse(input);
  if (!parsed.success) {
    const invalidTypeIssue = parsed.error.issues.find((issue) => issue.code === "invalid_type");
    if (invalidTypeIssue?.path[0] === "bottleId" || invalidTypeIssue?.path.length === 0) {
      return { success: false, error: "보틀을 선택해 주세요." };
    }
    return { success: false, error: parsed.error.issues[0].message };
  }

  const values = parsed.data;
  try {
    await postApiAdminOrdersUsersUseridManualPurchases(
      userId,
      {
        bottleId: values.bottleId,
        unitPrice: values.unitPrice,
        requestedQuantity: values.requestedQuantity,
        orderNote: values.orderNote?.trim() || undefined,
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
