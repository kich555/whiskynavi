"use client";

import type { AdminUserResponse, AdminOrderResponse as OrderResponse } from "@/apis/generated/api";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search } from "lucide-react";
import { useState } from "react";

const ORDER_STATUS_LABEL: Record<string, string> = {
  ORDER_REQUESTED: "주문 요청",
  PAYMENT_PENDING: "결제 대기",
  ORDER_PREPARING: "준비 중",
  SHIPPING: "배송 중",
  DELIVERY_COMPLETED: "배송 완료",
  RECEIPT_PENDING: "수령 대기",
  RECEIPT_COMPLETED: "수령 완료",
  ORDER_CANCELED: "주문 취소",
  CANCEL_REQUESTED: "취소 요청",
  CANCEL_REJECTED: "취소 거절",
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  ORDER_REQUESTED: "bg-blue-100 text-blue-700",
  PAYMENT_PENDING: "bg-yellow-100 text-yellow-700",
  ORDER_PREPARING: "bg-indigo-100 text-indigo-700",
  SHIPPING: "bg-orange-100 text-orange-700",
  DELIVERY_COMPLETED: "bg-green-100 text-green-700",
  RECEIPT_PENDING: "bg-amber-100 text-amber-700",
  RECEIPT_COMPLETED: "bg-green-100 text-green-700",
  ORDER_CANCELED: "bg-gray-200 text-gray-700",
  CANCEL_REQUESTED: "bg-red-100 text-red-700",
  CANCEL_REJECTED: "bg-amber-100 text-amber-700",
};

interface OrderHistoryModalProps {
  isOpen: boolean;
  close: () => void;
  user: AdminUserResponse;
  orders: OrderResponse[];
  totalAmount: number;
}

export default function OrderHistoryModal({ isOpen, close, user, orders, totalAmount }: OrderHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      order.itemName?.toLowerCase().includes(q) ||
      order.orderNumber?.toLowerCase().includes(q) ||
      order.orderStatus?.toLowerCase().includes(q)
    );
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle className="typo-bold-20">주문 내역</DialogTitle>
          <p className="typo-medium-14 mt-1 text-gray-600">
            {user.name} ({user.username}) - 총 {orders.length}건 / 총 금액 {formatCurrency(totalAmount)}
          </p>
        </DialogHeader>

        <div className="border-t border-gray-200 pt-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-4 -translate-y-1/2 transform text-gray-400" size={20} />
            <input
              type="text"
              placeholder="상품명, 주문번호로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-12 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {filteredOrders.length > 0 ? (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div key={order.id} className="rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <h4 className="font-bold text-gray-900">{order.itemName}</h4>
                        <span
                          className={`typo-medium-12 rounded px-2 py-1 ${
                            ORDER_STATUS_COLOR[order.orderStatus!] ?? "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ORDER_STATUS_LABEL[order.orderStatus!] ?? order.orderStatus}
                        </span>
                      </div>
                      <div className="typo-medium-14 grid grid-cols-2 gap-x-6 gap-y-1">
                        <p className="text-gray-600">
                          주문번호: <span className="font-medium text-gray-900">{order.orderNumber}</span>
                        </p>
                        <p className="text-gray-600">
                          주문일:{" "}
                          <span className="font-medium text-gray-900">
                            {new Date(order.createdAt!)
                              .toLocaleDateString("ko-KR", {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                              })
                              .replace(/\. /g, ".")
                              .replace(/\.$/, "")}
                          </span>
                        </p>
                        <p className="text-gray-600">
                          신청: <span className="font-bold text-gray-900">{order.requestedQuantity}병</span>
                        </p>
                        {order.approvedQuantity != null && (
                          <p className="text-gray-600">
                            배정: <span className="font-bold text-amber-700">{order.approvedQuantity}병</span>
                          </p>
                        )}
                        <p className="text-gray-600">
                          단가: <span className="font-medium text-gray-900">{formatCurrency(order.unitPrice)}</span>
                        </p>
                        <p className="text-gray-600">
                          총 금액:{" "}
                          <span className="font-bold text-gray-900">{formatCurrency(order.totalPrice)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">
              {searchQuery ? "검색 결과가 없습니다." : "주문 내역이 없습니다."}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <Button variant="outline" className="w-full" onClick={close}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
