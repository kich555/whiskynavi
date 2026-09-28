"use client";
import type { AdminAfterSaleResponse, AdminOrderItemResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { mutateAfterSale, type AfterSaleMutation } from "../after-sale-actions";
const labels: Record<string, string> = {
  OPEN: "접수",
  RECEIVED: "회수 완료",
  INSPECTED: "검수 완료",
  CLOSED: "처리 완료",
  REJECTED: "접수 반려",
  PENDING: "환불 처리 중",
  UNKNOWN: "환불 결과 확인 필요",
  COMPLETED: "환불 완료",
  FAILED: "환불 거절",
  RESTOCK: "재고 복구",
  REFUND_REQUESTED: "환불 요청",
  REFUND_COMPLETED: "환불 완료",
  REFUND_UNCONFIRMED: "환불 결과 미확인",
  REFUND_REJECTED: "환불 거절",
};
const selectClass = "min-h-10 rounded-md border bg-white px-3 text-gray-900";
export default function AfterSalePanel({
  orderId,
  data,
  orderItems,
}: {
  orderId: number;
  data: AdminAfterSaleResponse;
  orderItems: AdminOrderItemResponse[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const submitting = useRef(false);
  const keys = useRef(new Map<string, string>());
  const [type, setType] = useState<"RETURN" | "EXCHANGE">("RETURN");
  const [reason, setReason] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const unresolved = data.refunds?.some((r) => r.status === "PENDING" || r.status === "UNKNOWN") ?? false;
  function keyFor(payload: unknown) {
    const fingerprint = JSON.stringify(payload);
    const key = keys.current.get(fingerprint) ?? crypto.randomUUID();
    keys.current.set(fingerprint, key);
    return key;
  }
  function run(input: AfterSaleMutation) {
    if (submitting.current) return;
    submitting.current = true;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await mutateAfterSale(orderId, input);
        setMessage(result.success ? "처리 내역을 저장했습니다." : result.error);
        if (result.success) {
          if (input.kind === "create") {
            setReason("");
            setQuantities({});
          }
          // 성공한 요청은 같은 화면에서 재클릭해도 동일 키로 유지한다.
        }
      } catch {
        setMessage("결과를 확인하지 못했습니다. 이력을 새로고침한 후 같은 요청을 재확인해 주세요.");
      } finally {
        submitting.current = false;
        router.refresh();
      }
    });
  }
  const name = (id?: number) => orderItems.find((i) => i.orderItemId === id)?.itemName ?? `상품 ${id ?? "-"}`;
  return (
    <section className="space-y-6 rounded-lg border bg-white p-4 text-gray-900 sm:p-6">
      <h2 className="typo-bold-20">반품·교환·환불 관리</h2>
      <div className="typo-medium-14 flex flex-wrap gap-4">
        <span>결제액 {formatCurrency(data.paidAmount)}</span>
        <span>누적 환불 {data.refundedAmount == null ? "PG 확인 전" : formatCurrency(data.refundedAmount)}</span>
        {data.paidAmount != null && data.refundedAmount != null && (
          <span>남은 결제액 {formatCurrency(data.paidAmount - data.refundedAmount)}</span>
        )}
      </div>
      <p className="typo-medium-14 leading-6 text-gray-600">
        전화·이메일로 받은 내용을 기록해 주세요. 환불은 회수 전에도 실행할 수 있으며, 재고는 검수 후 별도로 복구합니다.
        교환품 재고와 재배송은 별도로 관리해 주세요.
      </p>
      {message && (
        <p role="status" className="typo-medium-14 rounded border p-3">
          {message}
        </p>
      )}
      {unresolved && (
        <p role="alert" className="typo-medium-14 text-amber-800">
          결과가 확인되지 않은 환불이 있습니다. 새 환불 전에 아래 내역에서 결과 재확인을 실행해 주세요.
        </p>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run({
            kind: "create",
            type,
            reason,
            items: Object.entries(quantities)
              .filter(([, q]) => q > 0)
              .map(([orderItemId, quantity]) => ({ orderItemId: Number(orderItemId), quantity })),
          });
        }}
        className="space-y-3 rounded border p-4"
      >
        <h3 className="typo-bold-16">상담 접수 등록</h3>
        <label className="block">
          접수 유형{" "}
          <select
            aria-label="접수 유형"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className={selectClass}
          >
            <option value="RETURN">반품·환불</option>
            <option value="EXCHANGE">교환 이력</option>
          </select>
        </label>
        {orderItems.map(
          (item) =>
            item.orderItemId != null && (
              <label key={item.orderItemId} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  {item.itemName} (구매 {item.quantity}개)
                </span>
                <Input
                  aria-label={`${item.itemName} 접수 수량`}
                  className="w-24"
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={quantities[item.orderItemId] ?? 0}
                  onChange={(e) => setQuantities((q) => ({ ...q, [item.orderItemId!]: Number(e.target.value) }))}
                />
              </label>
            ),
        )}
        <Textarea
          aria-label="접수 사유"
          placeholder="상담 내용과 접수 사유"
          required
          maxLength={500}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <Button disabled={pending || !Object.values(quantities).some((q) => q > 0)} type="submit">
          접수 등록
        </Button>
      </form>
      {data.cases?.map(
        (claim) =>
          claim.id != null && (
            <CaseEditor
              key={`${claim.id}-${claim.status}`}
              claim={claim}
              items={data.items?.filter((i) => i.caseId === claim.id) ?? []}
              name={name}
              pending={pending}
              unresolved={unresolved}
              run={run}
              keyFor={keyFor}
            />
          ),
      )}
      <div className="space-y-3">
        <h3 className="typo-bold-16">환불 내역</h3>
        {!data.refunds?.length && <p>환불 내역이 없습니다.</p>}
        {data.refunds?.map((refund) => (
          <div key={refund.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3">
            <div>
              <p>
                접수 #{refund.caseId} · {formatCurrency(refund.amount)} · {labels[refund.status ?? ""] ?? refund.status}
              </p>
              <p className="typo-medium-12 mt-2 text-gray-600">
                {refund.reason} · 처리자 {refund.actorId} · {formatDateTime(refund.createdAt)}
              </p>
            </div>
            {(refund.status === "UNKNOWN" || refund.status === "PENDING") && refund.requestKey && (
              <Button
                disabled={pending}
                variant="outline"
                onClick={() => run({ kind: "retry", requestKey: refund.requestKey! })}
              >
                같은 환불 결과 재확인
              </Button>
            )}
          </div>
        ))}
      </div>
      <details>
        <summary className="cursor-pointer font-semibold">전체 처리 이력 ({data.events?.length ?? 0})</summary>
        <ol className="mt-3 space-y-2">
          {data.events?.map((e) => (
            <li key={e.id} className="typo-medium-14 border-b py-2 leading-6">
              접수 #{e.caseId} · {labels[e.action ?? ""] ?? e.action} · {e.reason}
              {e.quantity != null ? ` · ${name(e.orderItemId)} ${e.quantity}개` : ""} · 처리자 {e.actorId} ·{" "}
              {formatDateTime(e.createdAt)}
            </li>
          ))}
        </ol>
      </details>
    </section>
  );
}
function CaseEditor({
  claim,
  items,
  name,
  pending,
  unresolved,
  run,
  keyFor,
}: {
  claim: NonNullable<AdminAfterSaleResponse["cases"]>[number];
  items: NonNullable<AdminAfterSaleResponse["items"]>;
  name: (id?: number) => string;
  pending: boolean;
  unresolved: boolean;
  run: (input: AfterSaleMutation) => void;
  keyFor: (input: unknown) => string;
}) {
  const [status, setStatus] = useState<"OPEN" | "RECEIVED" | "INSPECTED" | "CLOSED" | "REJECTED">(
    (claim.status as "OPEN" | "RECEIVED" | "INSPECTED" | "CLOSED" | "REJECTED") ?? "OPEN",
  );
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [restoreQuantities, setRestoreQuantities] = useState<Record<number, number>>({});
  const caseId = claim.id!;
  const closed = claim.status === "CLOSED" || claim.status === "REJECTED";
  return (
    <article className="space-y-4 rounded border p-4">
      <h3 className="typo-bold-16">
        접수 #{caseId} · {claim.type === "RETURN" ? "반품·환불" : "교환"} · {labels[claim.status ?? ""] ?? claim.status}
      </h3>
      <p className="typo-medium-14 whitespace-pre-wrap">{claim.reason}</p>
      <ul className="typo-medium-14 space-y-2">
        {items.map((i) => (
          <li key={i.id}>
            {name(i.orderItemId)} · 접수 {i.quantity}개 · 재고 복구 {i.restoredQuantity}개
          </li>
        ))}
      </ul>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          run({ kind: "update", caseId, status, reason: note });
        }}
      >
        <select
          aria-label={`접수 ${caseId} 처리 상태`}
          className={selectClass}
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
        >
          {["OPEN", "RECEIVED", "INSPECTED", "CLOSED", "REJECTED"].map((s) => (
            <option value={s} key={s}>
              {labels[s]}
            </option>
          ))}
        </select>
        <Textarea
          aria-label={`접수 ${caseId} 처리 사유`}
          required
          maxLength={500}
          placeholder="검수 결과 또는 처리 사유"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <Button disabled={pending} variant="outline" type="submit">
          상태·이력 저장
        </Button>
      </form>
      {claim.type === "RETURN" && !closed && (
        <form
          className="space-y-3 border-t pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const payload = { kind: "refund" as const, caseId, amount: Number(amount), reason: refundReason };
            if (
              !window.confirm(
                `${formatCurrency(payload.amount)}을 실제로 환불합니다. 입력 금액과 사유를 확인하셨습니까?`,
              )
            )
              return;
            run({ ...payload, requestKey: keyFor(payload) });
          }}
        >
          <label className="block">
            최종 환불액 (원)
            <Input
              aria-label={`접수 ${caseId} 최종 환불액`}
              type="number"
              min={1}
              step={1}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <Textarea
            aria-label={`접수 ${caseId} 환불 사유`}
            required
            maxLength={120}
            placeholder="환불 사유와 배송비 공제 근거 (120자 이내)"
            value={refundReason}
            onChange={(e) => setRefundReason(e.target.value)}
          />
          <Button type="submit" disabled={pending || unresolved}>
            입력 금액으로 토스 환불
          </Button>
        </form>
      )}
      {claim.type === "RETURN" &&
        claim.status === "INSPECTED" &&
        items.map(
          (i) =>
            i.orderItemId != null && (
              <div key={i.id} className="flex flex-wrap items-end gap-3 border-t pt-4">
                <label>
                  {name(i.orderItemId)} 복구 수량
                  <Input
                    type="number"
                    min={1}
                    max={(i.quantity ?? 0) - (i.restoredQuantity ?? 0)}
                    aria-label={`${name(i.orderItemId)} 재고 복구 수량`}
                    className="w-28"
                    value={restoreQuantities[i.orderItemId] ?? ""}
                    onChange={(e) => setRestoreQuantities((q) => ({ ...q, [i.orderItemId!]: Number(e.target.value) }))}
                  />
                </label>
                <Button
                  variant="outline"
                  disabled={pending || !note.trim() || !(restoreQuantities[i.orderItemId] > 0)}
                  onClick={() => {
                    const payload = {
                      kind: "restore" as const,
                      caseId,
                      orderItemId: i.orderItemId!,
                      quantity: restoreQuantities[i.orderItemId!],
                      reason: note,
                    };
                    run({ ...payload, requestKey: keyFor(payload) });
                  }}
                >
                  검수한 수량 재고 복구
                </Button>
              </div>
            ),
        )}
    </article>
  );
}
