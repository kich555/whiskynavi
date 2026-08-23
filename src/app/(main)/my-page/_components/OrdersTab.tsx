"use client";

import type {
  GetApiV2OrdersOrderStatus,
  GetApiV2OrdersSort,
  PagedModelUserOrderResponse,
  UserOrderResponse,
} from "@/apis/generated/api";
import { Switch } from "@/components/ui/switch";
import { useIsDesktop } from "@/hooks/use-media-query";
import { useRouter, useSearchParams } from "next/navigation";
import { overlay } from "overlay-kit";
import { useTransition } from "react";
import {
  ORDER_HISTORY_SORT_OPTIONS,
  ORDER_HISTORY_STATUS_OPTIONS,
  type OrderHistoryFilters,
} from "../_lib/order-history";
import OrderCard from "./OrderCard";
import OrderDetailModal from "./OrderDetailModal";

interface OrdersTabProps {
  orders: PagedModelUserOrderResponse;
  hasError: boolean;
  filters: OrderHistoryFilters;
}

export default function OrdersTab({ orders, hasError, filters }: OrdersTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDesktop = useIsDesktop();
  const [isPending, beginNavigation] = useTransition();
  const currentPage = (orders.page?.number ?? filters.page - 1) + 1;
  const totalPages = orders.page?.totalPages ?? 0;
  const hasOrders = Boolean(orders.content?.length);

  const navigate = (update: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    update(params);
    params.set("tab", "orders");
    beginNavigation(() => router.push(`/my-page?${params.toString()}`));
  };

  const handleOrderClick = (order: UserOrderResponse) => {
    if (isDesktop) {
      overlay.open(({ isOpen, close }) => <OrderDetailModal isOpen={isOpen} close={close} order={order} />);
    } else {
      router.push(`/my-page/order-${order.id}`);
    }
  };

  const handleStatusChange = (orderStatus: GetApiV2OrdersOrderStatus | "") => {
    navigate((params) => {
      params.delete("page");
      params.delete("manualOnly");
      if (orderStatus) {
        params.set("orderStatus", orderStatus);
      } else {
        params.delete("orderStatus");
      }
    });
  };

  const handleManualOnlyChange = (manualOnly: boolean) => {
    navigate((params) => {
      params.delete("page");
      if (manualOnly) {
        params.set("manualOnly", "true");
        params.delete("orderStatus");
      } else {
        params.delete("manualOnly");
      }
    });
  };

  const handleSortChange = (sort: GetApiV2OrdersSort) => {
    navigate((params) => {
      params.delete("page");
      params.set("sort", sort);
    });
  };

  const handlePageChange = (page: number) => {
    navigate((params) => params.set("page", String(page)));
  };

  const handleRetry = () => {
    beginNavigation(() => router.refresh());
  };

  return (
    <div aria-busy={isPending}>
      <div className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-end md:justify-between">
        <h3 className="typo-bold-20 text-white md:text-2xl">주문내역</h3>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex h-9 items-center gap-2">
            <Switch
              id="manual-only"
              size="sm"
              checked={filters.manualOnly}
              onCheckedChange={handleManualOnlyChange}
              disabled={isPending}
              className="border-white/20 data-[state=checked]:bg-purple-500 data-[state=unchecked]:bg-white/20"
            />
            <label htmlFor="manual-only" className="typo-medium-12 cursor-pointer text-gray-300">
              수동입력 내역조회
            </label>
          </div>

          <label className="flex flex-col gap-2">
            <span className="typo-medium-12 text-gray-400">주문 상태</span>
            <select
              value={filters.orderStatus ?? ""}
              onChange={(event) => handleStatusChange(event.target.value as GetApiV2OrdersOrderStatus | "")}
              disabled={isPending}
              className="typo-medium-14 h-10 min-w-40 border border-white/15 bg-[#1d2429] px-3 text-white transition-colors outline-none focus:border-white/40 disabled:opacity-50"
            >
              <option value="">전체 상태</option>
              {ORDER_HISTORY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="typo-medium-12 text-gray-400">정렬</span>
            <select
              value={filters.sort}
              onChange={(event) => handleSortChange(event.target.value as GetApiV2OrdersSort)}
              disabled={isPending}
              className="typo-medium-14 h-10 min-w-48 border border-white/15 bg-[#1d2429] px-3 text-white transition-colors outline-none focus:border-white/40 disabled:opacity-50"
            >
              {ORDER_HISTORY_SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {isPending ? (
        <p className="typo-medium-14 mb-4 text-gray-400" role="status">
          주문 내역을 불러오는 중입니다.
        </p>
      ) : null}

      {hasError ? (
        <div className="border border-red-400/30 bg-red-500/10 px-4 py-10 text-center">
          <p className="typo-medium-14 text-red-100">주문 내역을 불러오지 못했습니다.</p>
          <button
            type="button"
            onClick={handleRetry}
            className="typo-bold-14 mt-4 border border-red-300/40 px-4 py-2 text-red-100 transition-colors hover:bg-red-400/10"
          >
            다시 시도
          </button>
        </div>
      ) : hasOrders ? (
        <div className="space-y-3 md:space-y-4">
          {orders.content?.map((order) => (
            <OrderCard key={order.id} order={order} onClick={() => handleOrderClick(order)} />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="typo-medium-14 text-gray-400">
            {filters.orderStatus || filters.manualOnly ? "조건에 맞는 주문 내역이 없습니다." : "주문 내역이 없습니다."}
          </p>
        </div>
      )}

      {!hasError && totalPages > 1 ? (
        <nav className="mt-6 flex items-center justify-center gap-2" aria-label="주문 내역 페이지">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            className="typo-medium-14 px-3 py-2 text-gray-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageChange(index + 1)}
              disabled={isPending}
              aria-current={index + 1 === currentPage ? "page" : undefined}
              className={`typo-medium-14 px-3 py-2 transition-colors disabled:opacity-50 ${
                index + 1 === currentPage ? "typo-bold-14 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            className="typo-medium-14 px-3 py-2 text-gray-400 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
          >
            다음
          </button>
        </nav>
      ) : null}
    </div>
  );
}
