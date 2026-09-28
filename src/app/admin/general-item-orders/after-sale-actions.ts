"use server";
import { getUserErrorMessage } from "@/apis/errors";
import {
  getApiV2AdminOrdersOrderIdAfterSales,
  patchApiV2AdminOrdersOrderIdAfterSalesCaseId,
  postApiV2AdminOrdersOrderIdAfterSales,
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds,
  postApiV2AdminOrdersOrderIdAfterSalesCaseIdRestock,
  postApiV2AdminOrdersOrderIdRefundsRequestKeyRetry,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
class AfterSaleActionError extends Error {}
async function adminOptions() {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) throw new AfterSaleActionError("인증이 만료되었습니다. 다시 로그인해 주세요.");
  if (!session.user.roles?.includes("ROLE_ADMIN")) throw new AfterSaleActionError("관리자 권한이 필요합니다.");
  return withToken(session.accessToken);
}
const id = z.number().int().positive();
const reason = z.string().trim().min(1, "처리 사유를 입력해 주세요.").max(500);
const line = z.object({ orderItemId: id, quantity: id });
const mutation = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create"),
    type: z.enum(["RETURN", "EXCHANGE"]),
    reason,
    items: z.array(line).min(1).max(100),
  }),
  z.object({
    kind: z.literal("update"),
    caseId: id,
    status: z.enum(["OPEN", "RECEIVED", "INSPECTED", "CLOSED", "REJECTED"]),
    reason,
  }),
  z.object({ kind: z.literal("refund"), caseId: id, amount: id, reason: reason.max(120), requestKey: z.uuid() }),
  z.object({ kind: z.literal("restore"), caseId: id, orderItemId: id, quantity: id, reason, requestKey: z.uuid() }),
  z.object({ kind: z.literal("retry"), requestKey: z.uuid() }),
]);
export type AfterSaleMutation = z.infer<typeof mutation>;
export async function loadAfterSales(orderId: number) {
  const options = await adminOptions();
  return (await getApiV2AdminOrdersOrderIdAfterSales(id.parse(orderId), { ...options, cache: "no-store" })).data;
}
export async function mutateAfterSale(orderId: number, input: AfterSaleMutation) {
  try {
    const options = await adminOptions();
    id.parse(orderId);
    const data = mutation.parse(input);
    switch (data.kind) {
      case "create":
        await postApiV2AdminOrdersOrderIdAfterSales(
          orderId,
          { type: data.type, reason: data.reason, items: data.items },
          options,
        );
        break;
      case "update":
        await patchApiV2AdminOrdersOrderIdAfterSalesCaseId(
          orderId,
          data.caseId,
          { status: data.status, reason: data.reason },
          options,
        );
        break;
      case "refund":
        await postApiV2AdminOrdersOrderIdAfterSalesCaseIdRefunds(
          orderId,
          data.caseId,
          { amount: data.amount, reason: data.reason, requestKey: data.requestKey },
          options,
        );
        break;
      case "restore":
        await postApiV2AdminOrdersOrderIdAfterSalesCaseIdRestock(
          orderId,
          data.caseId,
          { orderItemId: data.orderItemId, quantity: data.quantity, reason: data.reason, requestKey: data.requestKey },
          options,
        );
        break;
      case "retry":
        await postApiV2AdminOrdersOrderIdRefundsRequestKeyRetry(orderId, data.requestKey, options);
        break;
    }
    try {
      revalidatePath(`/admin/general-item-orders/${orderId}`);
      revalidatePath("/admin/orders");
      revalidatePath("/my-page");
    } catch {
      /* 성공한 환불을 캐시 오류로 실패 처리하지 않는다. */
    }
    return { success: true as const };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      success: false as const,
      error:
        error instanceof AfterSaleActionError
          ? error.message
          : error instanceof z.ZodError
            ? error.issues[0].message
            : getUserErrorMessage(error, "처리에 실패했습니다. 이력을 확인해 주세요."),
    };
  }
}
