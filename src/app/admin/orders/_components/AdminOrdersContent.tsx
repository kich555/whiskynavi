"use client";

import DeliveryWorkbookPanel from "./DeliveryWorkbookPanel";

import type { GetApiAdminOrdersDeliveryExportParams, AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/admin/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { getFulfillmentMethodLabel, getProductTypeLabel, getSaleTimingLabel } from "@/lib/order-classification";
import { Eye, Search, Truck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import {
  completeAdminOrderDelivery,
  shipAdminOrderDelivery,
  updateAdminOrderDelivery,
  updateAdminOrderStatus,
} from "../actions";

export interface AdminOrdersSearchParams extends Record<string, string | undefined> {
  page?: string;
  limit?: string;
  keyword?: string;
  productType?: "BOTTLE" | "ITEM";
  fulfillmentMethod?: "DIRECT_DELIVERY" | "PICKUP" | "SERVICE";
  saleTiming?: "IMMEDIATE" | "RESERVATION";
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  guestOnly?: string;
}

interface AdminOrdersContentProps {
  searchParams: AdminOrdersSearchParams;
  orders: OrderResponse[];
  totalElements: number;
  title?: string;
  basePath?: string;
  enableGeneralItemActions?: boolean;
}

type DeliveryModalMode = "edit" | "ship";

const ORDER_STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "PAYMENT_PENDING", label: "결제 대기" },
  { value: "ORDER_PREPARING", label: "상품 준비 중" },
  { value: "SHIPPING", label: "배송 중" },
  { value: "DELIVERY_COMPLETED", label: "배송 완료" },
  { value: "CANCEL_REQUESTED", label: "취소 요청" },
  { value: "CANCEL_REJECTED", label: "취소 거절" },
  { value: "ORDER_CANCELED", label: "주문 취소" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "전체 결제" },
  { value: "TOSS", label: "토스" },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "전체 결제상태" },
  { value: "DONE", label: "결제 완료" },
  { value: "CANCELED", label: "결제 취소" },
  { value: "PARTIAL_CANCELED", label: "부분 환불" },
];

const FULFILLMENT_METHOD_OPTIONS = [
  { value: "", label: "전체 방식" },
  { value: "DIRECT_DELIVERY", label: "직배송" },
  { value: "SERVICE", label: "이용권" },
  { value: "PICKUP", label: "픽업" },
];

const SALE_TIMING_OPTIONS = [
  { value: "", label: "전체 시기" },
  { value: "IMMEDIATE", label: "바로배송" },
  { value: "RESERVATION", label: "예약판매" },
];

function getOrderSourceLabel(order: OrderResponse) {
  if (order.orderSource === "ADMIN_MANUAL") return "관리자 수동";
  if (order.orderSource === "CART") return "장바구니";
  if (order.orderSource === "SINGLE_ITEM") return "단건";
  if ((order.itemsCount ?? order.items?.length ?? 0) > 1) return "장바구니";
  return null;
}

function getOrderItemsSummary(order: OrderResponse) {
  return order.itemsSummary || order.itemName || order.saleTitle || "-";
}

function getOrderTotalQuantity(order: OrderResponse) {
  return (
    order.totalQuantity ??
    order.items?.reduce((sum, item) => sum + (item.quantity ?? 0), 0) ??
    order.requestedQuantity ??
    0
  );
}

function getOrderPriceSummary(order: OrderResponse) {
  return {
    freeShippingApplied: order.priceSummary?.freeShippingApplied ?? order.freeShippingApplied,
    itemsTotalPrice: order.priceSummary?.itemsTotalPrice ?? order.itemsTotalPrice,
    shippingFee: order.priceSummary?.shippingFee ?? order.shippingFee,
    totalPrice: order.priceSummary?.totalPrice ?? order.totalPrice,
  };
}

function buildSearchParams(params: AdminOrdersSearchParams) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  return next;
}

function hasAction(order: OrderResponse, action: string) {
  return order.availableAdminActions?.includes(action) ?? false;
}

function DeliveryModal({
  order,
  mode,
  open,
  onOpenChange,
}: {
  order: OrderResponse | null;
  mode: DeliveryModalMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [carrierName, setCarrierName] = useState(order?.delivery?.carrierName || "CJ대한통운");
  const [trackingNumber, setTrackingNumber] = useState(order?.delivery?.trackingNumber || "");
  const [receiverName, setReceiverName] = useState(order?.delivery?.receiverName || "");
  const [receiverPhone, setReceiverPhone] = useState(order?.delivery?.receiverPhone || "");
  const [address, setAddress] = useState(order?.delivery?.address || "");
  const [deliveryMemo, setDeliveryMemo] = useState(order?.delivery?.deliveryMemo || "");

  if (!order?.id) return null;

  const handleSubmit = () => {
    startTransition(async () => {
      const result =
        mode === "ship"
          ? await shipAdminOrderDelivery(order.id!, { carrierName, trackingNumber })
          : await updateAdminOrderDelivery(order.id!, {
              carrierName,
              trackingNumber,
              receiverName,
              receiverPhone,
              address,
              deliveryMemo,
              deliveryMethod: "GENERAL_SHIPPING",
            });

      if (result.success) {
        toast.success(mode === "ship" ? "발송 처리했습니다." : "배송 정보를 수정했습니다.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "배송 처리에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "ship" ? "발송 처리" : "배송 정보 수정"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="typo-medium-12 mb-1 block text-gray-600">배송사</label>
              <Input value={carrierName} onChange={(event) => setCarrierName(event.target.value)} />
            </div>
            <div>
              <label className="typo-medium-12 mb-1 block text-gray-600">운송장번호</label>
              <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
            </div>
          </div>

          {mode === "edit" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="typo-medium-12 mb-1 block text-gray-600">수령인</label>
                  <Input value={receiverName} onChange={(event) => setReceiverName(event.target.value)} />
                </div>
                <div>
                  <label className="typo-medium-12 mb-1 block text-gray-600">수령인 연락처</label>
                  <Input value={receiverPhone} onChange={(event) => setReceiverPhone(event.target.value)} />
                </div>
              </div>
              <div>
                <label className="typo-medium-12 mb-1 block text-gray-600">주소</label>
                <Textarea value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div>
                <label className="typo-medium-12 mb-1 block text-gray-600">배송 메모</label>
                <Textarea value={deliveryMemo} onChange={(event) => setDeliveryMemo(event.target.value)} />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
            {isPending ? "처리 중" : "저장"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminOrdersContent({
  searchParams,
  orders,
  totalElements,
  title = "일반상품주문관리",
  basePath = "/admin/general-item-orders",
  enableGeneralItemActions = true,
}: AdminOrdersContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(searchParams.keyword ?? "");
  const [modalOrder, setModalOrder] = useState<OrderResponse | null>(null);
  const [modalMode, setModalMode] = useState<DeliveryModalMode>("edit");

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;
  const filterGridClassName = enableGeneralItemActions
    ? "grid gap-4 lg:grid-cols-[1fr_160px_160px_160px_130px_auto] lg:items-end"
    : "grid gap-4 xl:grid-cols-[1fr_150px_150px_150px_150px_130px_auto] xl:items-end";

  const pushFilter = (updates: Partial<AdminOrdersSearchParams>) => {
    const params = buildSearchParams({ ...searchParams, ...updates, page: "1" });
    router.push(`${basePath}?${params.toString()}`);
  };

  const runAction = (action: () => Promise<{ success: boolean; error?: string }>, successMessage: string) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(successMessage);
        router.refresh();
      } else {
        toast.error(result.error ?? "처리에 실패했습니다.");
      }
    });
  };

  const handleStatusChange = (order: OrderResponse, orderStatus: string, label: string) => {
    if (!order.id) return;
    const reason = window.prompt(`${label} 사유를 입력해주세요.`) ?? "";
    if (!reason.trim()) return;
    runAction(() => updateAdminOrderStatus(order.id!, orderStatus, reason), `${label} 처리했습니다.`);
  };

  const openDeliveryModal = (order: OrderResponse, mode: DeliveryModalMode) => {
    setModalOrder(order);
    setModalMode(mode);
  };

  return (
    <>
      <AdminHeader title={title} onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className={filterGridClassName}>
            <div>
              <label className="typo-medium-12 mb-1 block text-gray-600">검색어</label>
              <div className="relative">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") pushFilter({ keyword });
                  }}
                  className="pl-9"
                  placeholder="주문번호, 고객명, 연락처, 상품명"
                />
              </div>
            </div>
            {!enableGeneralItemActions && (
              <>
                <SelectFilter
                  label="배송방식"
                  value={searchParams.fulfillmentMethod ?? ""}
                  options={FULFILLMENT_METHOD_OPTIONS}
                  onChange={(value) =>
                    pushFilter({ fulfillmentMethod: value as AdminOrdersSearchParams["fulfillmentMethod"] })
                  }
                />
                <SelectFilter
                  label="배송시기"
                  value={searchParams.saleTiming ?? ""}
                  options={SALE_TIMING_OPTIONS}
                  onChange={(value) => pushFilter({ saleTiming: value as AdminOrdersSearchParams["saleTiming"] })}
                />
              </>
            )}
            <SelectFilter
              label="주문상태"
              value={searchParams.orderStatus ?? ""}
              options={ORDER_STATUS_OPTIONS}
              onChange={(value) => pushFilter({ orderStatus: value })}
            />
            <SelectFilter
              label="결제수단"
              value={searchParams.paymentMethod ?? ""}
              options={PAYMENT_METHOD_OPTIONS}
              onChange={(value) => pushFilter({ paymentMethod: value })}
            />
            <SelectFilter
              label="결제상태"
              value={searchParams.paymentStatus ?? ""}
              options={PAYMENT_STATUS_OPTIONS}
              onChange={(value) => pushFilter({ paymentStatus: value })}
            />
            <SelectFilter
              label="비회원"
              value={searchParams.guestOnly ?? ""}
              options={[
                { value: "", label: "전체" },
                { value: "true", label: "비회원만" },
              ]}
              onChange={(value) => pushFilter({ guestOnly: value })}
            />
            <Button type="button" onClick={() => pushFilter({ keyword })} className="bg-amber-600 hover:bg-amber-700">
              검색
            </Button>
          </div>
        </section>

        {enableGeneralItemActions && (
          <Link
            href="/admin/general-item-orders/notifications"
            className="typo-medium-14 mb-4 inline-block text-amber-700 underline"
          >
            비회원 안내 실패·발송 현황
          </Link>
        )}
        {enableGeneralItemActions && (
          <DeliveryWorkbookPanel
            filters={{
              keyword: searchParams.keyword,
              orderStatus: searchParams.orderStatus as GetApiAdminOrdersDeliveryExportParams["orderStatus"],
              paymentMethod: searchParams.paymentMethod,
              paymentStatus: searchParams.paymentStatus,
              guestOnly: searchParams.guestOnly === "true" ? true : undefined,
            }}
          />
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b border-gray-200 bg-gray-50 whitespace-nowrap">
                <tr>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">주문</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">고객</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">상품</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">결제</th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">
                    {enableGeneralItemActions ? "배송" : "주문 구분"}
                  </th>
                  <th className="typo-bold-12 px-4 py-3 text-left text-gray-700 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                      주문이 없습니다.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const statusLabel = order.orderStatus
                      ? (ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus)
                      : "-";
                    const statusColor = order.orderStatus
                      ? (ORDER_STATUS_COLOR[order.orderStatus] ?? "bg-gray-100 text-gray-700")
                      : "bg-gray-100 text-gray-700";
                    const lineItems = order.items ?? [];
                    const shownLineItems = lineItems.slice(0, 2);
                    const remainingItemCount = Math.max(
                      (order.itemsCount ?? lineItems.length) - shownLineItems.length,
                      0,
                    );
                    const priceSummary = getOrderPriceSummary(order);
                    const totalQuantity = getOrderTotalQuantity(order);
                    const sourceLabel = getOrderSourceLabel(order);
                    const hasPriceBreakdown = priceSummary.itemsTotalPrice != null || priceSummary.shippingFee != null;

                    return (
                      <tr key={order.id} className="align-top transition-colors hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <div className="font-medium whitespace-nowrap text-gray-900">{order.orderNumber ?? "-"}</div>
                          <div className="typo-medium-12 mt-1 text-gray-500">{formatDateTime(order.createdAt)}</div>
                          <span className={`typo-medium-12 mt-2 inline-flex rounded-full px-2 py-0.5 ${statusColor}`}>
                            {order.fulfillmentMethod === "SERVICE" && order.orderStatus === "ORDER_PREPARING"
                              ? "결제 완료"
                              : statusLabel}
                          </span>
                        </td>
                        <td className="typo-medium-14 px-4 py-4 text-gray-700">
                          <div className="font-medium text-gray-900">
                            {order.customer?.name ?? order.delivery?.receiverName ?? "-"}
                          </div>
                          <div>{order.customer?.phone ?? order.delivery?.receiverPhone ?? order.guestPhone ?? "-"}</div>
                          <div className="typo-medium-12 text-gray-500">
                            {order.customer?.guest ? "비회원" : "회원"}
                          </div>
                        </td>
                        <td className="typo-medium-14 px-4 py-4 text-gray-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">{getOrderItemsSummary(order)}</span>
                            {sourceLabel && (
                              <span className="typo-medium-12 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                                {sourceLabel}
                              </span>
                            )}
                            {order.itemsCount != null && (
                              <span className="typo-medium-12 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
                                {order.itemsCount}건
                              </span>
                            )}
                          </div>
                          <div className="mt-1">총 수량 {totalQuantity}개</div>
                          {shownLineItems.length > 0 && (
                            <ul className="typo-medium-12 mt-2 space-y-1 text-gray-500">
                              {shownLineItems.map((item, index) => (
                                <li key={item.orderItemId ?? `${item.productId ?? "item"}-${index}`}>
                                  {item.itemName || item.saleTitle || "-"} · {item.quantity ?? 0}개 ·{" "}
                                  {formatCurrency(item.lineTotalPrice)}
                                </li>
                              ))}
                              {remainingItemCount > 0 && <li>외 {remainingItemCount}개 상품</li>}
                            </ul>
                          )}
                          {hasPriceBreakdown ? (
                            <div className="typo-medium-12 mt-2 space-y-0.5 text-gray-500">
                              <div>상품 {formatCurrency(priceSummary.itemsTotalPrice)}</div>
                              <div>배송비 {formatCurrency(priceSummary.shippingFee)}</div>
                              <div className="font-medium text-gray-900">
                                총 {formatCurrency(priceSummary.totalPrice)}
                              </div>
                              {priceSummary.freeShippingApplied && <div className="text-green-700">무료배송 적용</div>}
                            </div>
                          ) : (
                            <div className="mt-1">{formatCurrency(priceSummary.totalPrice)}</div>
                          )}
                        </td>
                        <td className="typo-medium-14 px-4 py-4 text-gray-700">
                          <div>{order.payment?.paymentMethod ?? "-"}</div>
                          <div>{order.payment?.paymentStatus ?? "-"}</div>
                        </td>
                        <td className="typo-medium-14 px-4 py-4 text-gray-700">
                          {enableGeneralItemActions ? (
                            <>
                              <div>
                                {order.fulfillmentMethod === "SERVICE"
                                  ? "티켓·무형서비스"
                                  : (order.delivery?.carrierName ?? "CJ대한통운")}
                              </div>
                              <div>
                                {order.fulfillmentMethod === "SERVICE"
                                  ? "배송 없음 · 이용권 상세 확인"
                                  : (order.delivery?.trackingNumber ?? "배송 준비 중")}
                              </div>
                              <div className="typo-medium-12 text-gray-500">{order.delivery?.address ?? "-"}</div>
                            </>
                          ) : (
                            <>
                              <div>{getProductTypeLabel(order.productType)}</div>
                              <div>{getFulfillmentMethodLabel(order.fulfillmentMethod)}</div>
                              <div>
                                {order.fulfillmentMethod === "SERVICE"
                                  ? "일반 판매"
                                  : getSaleTimingLabel(order.saleTiming)}
                              </div>
                              <div className="typo-medium-12 text-gray-500">
                                {order.businessId ? `사업장 ${order.businessId}` : "보틀 주문"}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {!enableGeneralItemActions ? (
                              <>
                                {order.id && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`${basePath}/${order.id}`)}
                                  >
                                    <Eye className="size-4" />
                                    상세
                                  </Button>
                                )}
                                <span className="typo-medium-14 text-gray-400">조회 전용</span>
                              </>
                            ) : (
                              <>
                                {order.id && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`${basePath}/${order.id}`)}
                                  >
                                    <Eye className="size-4" />
                                    상세
                                  </Button>
                                )}
                                {hasAction(order, "UPDATE_DELIVERY") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDeliveryModal(order, "edit")}
                                  >
                                    배송 수정
                                  </Button>
                                )}
                                {hasAction(order, "SHIP_DELIVERY") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openDeliveryModal(order, "ship")}
                                  >
                                    <Truck className="size-4" />
                                    발송
                                  </Button>
                                )}
                                {hasAction(order, "COMPLETE_DELIVERY") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      runAction(() => completeAdminOrderDelivery(order.id!), "배송 완료 처리했습니다.")
                                    }
                                    disabled={isPending}
                                  >
                                    배송 완료
                                  </Button>
                                )}
                                {hasAction(order, "FORCE_CANCEL") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(order, "ORDER_CANCELED", "주문 취소")}
                                  >
                                    주문 취소
                                  </Button>
                                )}
                                {hasAction(order, "APPROVE_CANCEL") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(order, "ORDER_CANCELED", "취소 승인")}
                                  >
                                    취소 승인
                                  </Button>
                                )}
                                {hasAction(order, "REJECT_CANCEL") && (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(order, "CANCEL_REJECTED", "취소 거절")}
                                  >
                                    취소 거절
                                  </Button>
                                )}
                                {!order.availableAdminActions?.length && (
                                  <span className="typo-medium-14 text-gray-400">가능 액션 없음</span>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            totalItems={totalElements}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            searchParams={searchParams}
            basePath={basePath}
          />
        </div>
      </div>

      <DeliveryModal
        key={modalOrder?.id ?? "empty"}
        order={modalOrder}
        mode={modalMode}
        open={modalOrder != null}
        onOpenChange={(open) => {
          if (!open) setModalOrder(null);
        }}
      />
    </>
  );
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="typo-medium-12 mb-1 block text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="typo-medium-14 h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-gray-900 focus:border-amber-500 focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
