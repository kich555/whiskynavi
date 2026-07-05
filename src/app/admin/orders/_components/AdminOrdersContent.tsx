"use client";

import type { AdminDeliveryCsvUploadResponse, AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL } from "@/app/admin/constants";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Download, Eye, FileCheck2, FileUp, Search, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import AdminHeader from "../../_components/AdminHeader";
import { useSidebar } from "../../_components/AdminLayoutClient";
import Pagination from "../../_components/Pagination";
import {
  completeAdminOrderDelivery,
  exportAdminDeliveryCsv,
  shipAdminOrderDelivery,
  updateAdminOrderDelivery,
  updateAdminOrderStatus,
  uploadAdminDeliveryCsv,
} from "../actions";

export interface AdminOrdersSearchParams extends Record<string, string | undefined> {
  page?: string;
  limit?: string;
  keyword?: string;
  productType?: "BOTTLE" | "ITEM";
  orderStatus?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  guestOnly?: string;
  depositOverdue?: string;
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
  { value: "PAYMENT_PENDING", label: "입금 대기" },
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
];

const SALE_TYPE_LABEL: Record<string, string> = {
  RESERVATION: "예약공고",
  PICKUP: "픽업공고",
  GENERAL: "일반판매",
};

function getOrderSourceLabel(order: OrderResponse) {
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

function downloadTextFile(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
              <label className="mb-1 block text-xs font-medium text-gray-600">배송사</label>
              <Input value={carrierName} onChange={(event) => setCarrierName(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">운송장번호</label>
              <Input value={trackingNumber} onChange={(event) => setTrackingNumber(event.target.value)} />
            </div>
          </div>

          {mode === "edit" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">수령인</label>
                  <Input value={receiverName} onChange={(event) => setReceiverName(event.target.value)} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">수령인 연락처</label>
                  <Input value={receiverPhone} onChange={(event) => setReceiverPhone(event.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">주소</label>
                <Textarea value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">배송 메모</label>
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

function CsvResultSummary({ result }: { result: AdminDeliveryCsvUploadResponse }) {
  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-wrap gap-4 text-sm text-gray-700">
        <span>전체 {result.totalRows ?? 0}행</span>
        <span className="text-green-700">성공 {result.successCount ?? 0}행</span>
        <span className="text-red-700">실패 {result.failureCount ?? 0}행</span>
        <span>{result.dryRun ? "검증 결과" : "실제 처리 결과"}</span>
      </div>
      {(result.results ?? []).length > 0 && (
        <div className="mt-3 max-h-56 overflow-auto rounded border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left">행</th>
                <th className="px-3 py-2 text-left">주문번호</th>
                <th className="px-3 py-2 text-left">결과</th>
                <th className="px-3 py-2 text-left">메시지</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {result.results?.map((row) => (
                <tr key={`${row.rowNumber}-${row.orderNumber}`}>
                  <td className="px-3 py-2">{row.rowNumber}</td>
                  <td className="px-3 py-2">{row.orderNumber ?? "-"}</td>
                  <td className={row.success ? "px-3 py-2 text-green-700" : "px-3 py-2 text-red-700"}>
                    {row.success ? "성공" : "실패"}
                  </td>
                  <td className="px-3 py-2">{row.message ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [keyword, setKeyword] = useState(searchParams.keyword ?? "");
  const [modalOrder, setModalOrder] = useState<OrderResponse | null>(null);
  const [modalMode, setModalMode] = useState<DeliveryModalMode>("edit");
  const [csvResult, setCsvResult] = useState<AdminDeliveryCsvUploadResponse | null>(null);

  const currentPage = Number(searchParams.page) || 1;
  const itemsPerPage = Number(searchParams.limit) || 20;

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

  const handleExportCsv = () => {
    startTransition(async () => {
      const result = await exportAdminDeliveryCsv();
      if (result.success && result.data != null) {
        downloadTextFile("general-item-delivery-orders.csv", result.data, "text/csv;charset=utf-8");
      } else {
        toast.error(result.error ?? "CSV 다운로드에 실패했습니다.");
      }
    });
  };

  const handleUploadCsv = (dryRun: boolean) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("CSV 파일을 선택해주세요.");
      return;
    }

    startTransition(async () => {
      const result = await uploadAdminDeliveryCsv(file, dryRun);
      if (result.success) {
        setCsvResult(result.data ?? null);
        toast.success(dryRun ? "CSV 검증이 끝났습니다." : "CSV 발송 처리를 완료했습니다.");
        router.refresh();
      } else {
        toast.error(result.error ?? "CSV 업로드에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <AdminHeader title={title} onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1fr_160px_160px_160px_130px_auto] lg:items-end">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">검색어</label>
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
          <section className="mb-6 rounded-lg border border-gray-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="typo-bold-18 text-gray-900">배송 CSV</h2>
                <p className="mt-1 text-sm text-gray-500">
                  일반 아이템 배송 주문은 먼저 검증한 뒤 실제 발송 처리를 실행합니다.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="text-sm" />
                <Button type="button" variant="outline" onClick={handleExportCsv} disabled={isPending}>
                  <Download className="size-4" />
                  대상 다운로드
                </Button>
                <Button type="button" variant="outline" onClick={() => handleUploadCsv(true)} disabled={isPending}>
                  <FileCheck2 className="size-4" />
                  검증
                </Button>
                <Button type="button" onClick={() => handleUploadCsv(false)} disabled={isPending}>
                  <FileUp className="size-4" />
                  실제 처리
                </Button>
              </div>
            </div>
            {csvResult && <CsvResultSummary result={csvResult} />}
          </section>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px]">
              <thead className="border-b border-gray-200 bg-gray-50">
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
                          <div className="font-medium text-gray-900">{order.orderNumber ?? "-"}</div>
                          <div className="mt-1 text-xs text-gray-500">{formatDateTime(order.createdAt)}</div>
                          <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="font-medium text-gray-900">
                            {order.customer?.name ?? order.delivery?.receiverName ?? "-"}
                          </div>
                          <div>{order.customer?.phone ?? order.delivery?.receiverPhone ?? order.guestPhone ?? "-"}</div>
                          <div className="text-xs text-gray-500">{order.customer?.guest ? "비회원" : "회원"}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-gray-900">{getOrderItemsSummary(order)}</span>
                            {sourceLabel && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {sourceLabel}
                              </span>
                            )}
                            {order.itemsCount != null && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                {order.itemsCount}건
                              </span>
                            )}
                          </div>
                          <div className="mt-1">총 수량 {totalQuantity}개</div>
                          {shownLineItems.length > 0 && (
                            <ul className="mt-2 space-y-1 text-xs text-gray-500">
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
                            <div className="mt-2 space-y-0.5 text-xs text-gray-500">
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
                        <td className="px-4 py-4 text-sm text-gray-700">
                          <div>{order.payment?.paymentMethod ?? "-"}</div>
                          <div>{order.payment?.paymentStatus ?? "-"}</div>
                          {order.payment?.depositDeadlineAt && (
                            <div className="text-xs text-gray-500">
                              입금기한 {formatDateTime(order.payment.depositDeadlineAt)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-700">
                          {enableGeneralItemActions ? (
                            <>
                              <div>{order.delivery?.carrierName ?? "CJ대한통운"}</div>
                              <div>{order.delivery?.trackingNumber ?? "배송 준비 중"}</div>
                              <div className="text-xs text-gray-500">{order.delivery?.address ?? "-"}</div>
                            </>
                          ) : (
                            <>
                              <div>{order.saleType ? (SALE_TYPE_LABEL[order.saleType] ?? order.saleType) : "-"}</div>
                              <div className="text-xs text-gray-500">
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
                                <span className="text-sm text-gray-400">조회 전용</span>
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
                                  <span className="text-sm text-gray-400">가능 액션 없음</span>
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
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-amber-500 focus:outline-none"
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
