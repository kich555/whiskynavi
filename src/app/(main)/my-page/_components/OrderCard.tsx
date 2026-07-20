"use client";

import type { UserOrderResponse } from "@/apis/generated/api";
import { formatOrderClassification } from "@/lib/order-classification";
import { ChevronRight } from "lucide-react";
import { getOrderDisplayNames } from "../_lib/order-display";
import { formatCurrency, formatDate, getOrderStatusConfig } from "../_lib/utils";

interface OrderCardProps {
  order: UserOrderResponse;
  onClick: () => void;
}

export default function OrderCard({ order, onClick }: OrderCardProps) {
  const status = getOrderStatusConfig(order.orderStatus);
  const orderClassification = formatOrderClassification(order);
  const displayNames = getOrderDisplayNames(order);

  return (
    <div
      className="cursor-pointer border border-white/10 p-4 transition-colors hover:border-white/20 md:p-6"
      onClick={onClick}
    >
      <div className="mb-3 flex items-start justify-between md:mb-4">
        <div>
          <p className="typo-medium-12 md:typo-medium-14 mb-1 text-gray-400">주문번호: {order.orderNumber}</p>
          <p className="typo-medium-12 md:typo-medium-14 text-gray-400">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`typo-bold-12 md:typo-medium-14 px-2 py-0.5 md:px-3 md:py-1 ${status.colorClass}`}>
          {status.label}
        </span>
      </div>
      <h4 className="typo-bold-14 mb-2 text-white md:text-base">{displayNames.primaryName}</h4>
      {displayNames.secondaryName && (
        <p className="typo-medium-12 md:typo-medium-14 mb-2 text-gray-400">{displayNames.secondaryName}</p>
      )}
      {orderClassification !== "-" && (
        <p className="typo-medium-12 mb-3 w-fit border border-white/10 px-2 py-0.5 text-gray-300">
          {orderClassification}
        </p>
      )}
      <div className="flex items-center justify-between">
        <p className="typo-bold-18 text-white md:text-xl">{formatCurrency(order.totalPrice)}</p>
        <button className="typo-medium-12 md:typo-medium-14 flex items-center gap-1 text-gray-400 hover:text-white">
          상세보기
          <ChevronRight size={14} className="md:size-4" />
        </button>
      </div>
    </div>
  );
}
