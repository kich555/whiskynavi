"use client";

import type { AdminReservationBusinessDeliveryResponse, DeliveryCompanyResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateReservationDeliveryAction } from "../../actions";

const DEFAULT_CARRIER_CODE = "CJ_LOGISTICS";
const DEFAULT_CARRIER_NAME = "CJ대한통운";

const DELIVERY_METHOD_LABEL: Record<string, string> = {
  PARCEL: "택배",
  PRIVATE_CARGO: "개인 용달",
};

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  READY: "배송 준비",
  SHIPPED: "발송 완료",
  IN_TRANSIT: "배송 중",
  OUT_FOR_DELIVERY: "배송 출발",
  DELIVERED: "배송 완료",
};

const DELIVERY_STATUS_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "READY", label: "배송 준비" },
  { value: "SHIPPED", label: "발송 완료" },
  { value: "IN_TRANSIT", label: "배송 중" },
  { value: "OUT_FOR_DELIVERY", label: "배송 출발" },
  { value: "DELIVERED", label: "배송 완료" },
];

interface ReservationDeliverySectionProps {
  noticeId: number;
  deliveries: AdminReservationBusinessDeliveryResponse[];
  companies: DeliveryCompanyResponse[];
}

const formatCarrierName = (delivery: AdminReservationBusinessDeliveryResponse) => {
  if (delivery.deliveryMethod === "PRIVATE_CARGO") return "해당 없음 (용달)";
  return delivery.carrierName ?? delivery.carrierCode ?? "-";
};

const formatTrackingNumber = (delivery: AdminReservationBusinessDeliveryResponse) => {
  if (delivery.deliveryMethod === "PRIVATE_CARGO") return "해당 없음 (용달)";
  return delivery.trackingNumber?.trim() || "-";
};

function DeliveryEditModal({
  noticeId,
  delivery,
  companies,
  open,
  onOpenChange,
}: {
  noticeId: number;
  delivery: AdminReservationBusinessDeliveryResponse;
  companies: DeliveryCompanyResponse[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deliveryMethod, setDeliveryMethod] = useState<string>(delivery.deliveryMethod ?? "PARCEL");
  const [carrierCode, setCarrierCode] = useState<string>(delivery.carrierCode ?? DEFAULT_CARRIER_CODE);
  const [trackingNumber, setTrackingNumber] = useState(delivery.trackingNumber ?? "");
  const [deliveryStatus, setDeliveryStatus] = useState(delivery.deliveryStatus ?? "");
  const [deliveryMemo, setDeliveryMemo] = useState(delivery.deliveryMemo ?? "");
  const isPrivateCargo = deliveryMethod === "PRIVATE_CARGO";

  const handleSubmit = () => {
    if (!delivery.businessId) {
      toast.error("업장 정보가 없어 배송정보를 저장할 수 없습니다.");
      return;
    }

    startTransition(async () => {
      const result = await updateReservationDeliveryAction({
        noticeId,
        businessId: delivery.businessId!,
        deliveryMethod,
        carrierCode,
        trackingNumber,
        deliveryStatus,
        deliveryMemo,
      });

      if (result.success) {
        toast.success("배송정보를 수정했습니다.");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "배송정보 수정에 실패했습니다.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>배송정보 수정</DialogTitle>
          <DialogDescription>{delivery.businessName ?? "선택한 업장"}의 입고 배송 정보를 수정합니다.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
 <label className="mb-1 block typo-medium-12 text-gray-600">배송 방식</label>
            <select
              value={deliveryMethod}
              onChange={(event) => setDeliveryMethod(event.target.value)}
 className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 typo-medium-14 text-gray-900 focus:border-amber-500 focus:outline-none"
            >
              <option value="PARCEL">택배</option>
              <option value="PRIVATE_CARGO">개인 용달</option>
            </select>
          </div>

          {!isPrivateCargo && (
            <div className="grid gap-4 md:grid-cols-2">
              <div>
 <label className="mb-1 block typo-medium-12 text-gray-600">택배사</label>
                <select
                  value={carrierCode}
                  onChange={(event) => setCarrierCode(event.target.value)}
 className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 typo-medium-14 text-gray-900 focus:border-amber-500 focus:outline-none"
                >
                  {companies.map((company) => (
                    <option key={company.code} value={company.code}>
                      {company.displayName ?? company.code}
                    </option>
                  ))}
                </select>
              </div>

              <div>
 <label className="mb-1 block typo-medium-12 text-gray-600">송장번호</label>
                <Input
                  value={trackingNumber}
                  onChange={(event) => setTrackingNumber(event.target.value)}
                  placeholder="송장번호"
                  maxLength={100}
                />
              </div>
            </div>
          )}

          <div>
 <label className="mb-1 block typo-medium-12 text-gray-600">배송 진행</label>
            <select
              value={deliveryStatus}
              onChange={(event) => setDeliveryStatus(event.target.value)}
 className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 typo-medium-14 text-gray-900 focus:border-amber-500 focus:outline-none"
            >
              {DELIVERY_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
 <label className="mb-1 block typo-medium-12 text-gray-600">메모</label>
            <textarea
              value={deliveryMemo}
              onChange={(event) => setDeliveryMemo(event.target.value)}
 className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 typo-medium-14 text-gray-900 focus:border-amber-500 focus:outline-none"
              maxLength={500}
              placeholder="배송 메모"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            취소
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
            {isPending ? "수정 중" : "수정"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeliveryRow({
  noticeId,
  delivery,
  companies,
}: {
  noticeId: number;
  delivery: AdminReservationBusinessDeliveryResponse;
  companies: DeliveryCompanyResponse[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="grid gap-3 border-t border-gray-100 px-4 py-4 md:grid-cols-[1.2fr_1fr_1.4fr_1fr_120px] md:items-center">
      <div>
        <div className="typo-medium-14 text-gray-900">{delivery.businessName ?? "-"}</div>
 <div className="mt-1 typo-medium-12 text-gray-500">업장 ID {delivery.businessId ?? "-"}</div>
      </div>

 <div className="typo-medium-14 text-gray-600">
        {delivery.deliveryMethod ? (DELIVERY_METHOD_LABEL[delivery.deliveryMethod] ?? delivery.deliveryMethod) : "택배"}
      </div>
 <div className="typo-medium-14 text-gray-600">{formatCarrierName(delivery)}</div>
 <div className="typo-medium-14 text-gray-600">{formatTrackingNumber(delivery)}</div>
      <Button type="button" onClick={() => setIsOpen(true)} className="bg-amber-600 hover:bg-amber-700">
        수정
      </Button>

      <DeliveryEditModal
        noticeId={noticeId}
        delivery={delivery}
        companies={companies}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </div>
  );
}

export default function ReservationDeliverySection({
  noticeId,
  deliveries,
  companies,
}: ReservationDeliverySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const availableCompanies = companies.filter((company) => company.code);
  const hasDefaultCarrier = availableCompanies.some((company) => company.code === DEFAULT_CARRIER_CODE);
  const deliveryCompanies = hasDefaultCarrier
    ? availableCompanies
    : [{ code: DEFAULT_CARRIER_CODE, displayName: DEFAULT_CARRIER_NAME }, ...availableCompanies];

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className={`${isExpanded ? "border-b border-gray-200" : ""} bg-gray-50 px-6 py-4`}>
        <h3>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls="reservation-delivery-section-content"
            aria-label={`업장별 입고 배송 정보 ${deliveries.length}건 ${isExpanded ? "접기" : "펼치기"}`}
            onClick={() => setIsExpanded((current) => !current)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 text-left font-bold text-gray-900 transition-colors hover:text-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none"
          >
            <span>
              업장별 입고 배송 정보 <span className="typo-regular-14 text-gray-500">({deliveries.length}건)</span>
            </span>
 <span className="flex items-center gap-1.5 typo-medium-14 text-gray-600">
              {isExpanded ? "접기" : "펼치기"}
              <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
            </span>
          </button>
        </h3>
      </div>

      {isExpanded && (
        <div id="reservation-delivery-section-content">
 <div className="hidden grid-cols-[1.2fr_1fr_1.4fr_1fr_120px] gap-3 bg-gray-50 px-4 py-3 typo-bold-12 text-gray-700 md:grid">
            <div>업장</div>
            <div>배송 방식</div>
            <div>택배사</div>
            <div>송장번호</div>
            <div>관리</div>
          </div>

          {deliveries.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">입고 배송 정보가 없습니다.</div>
          ) : (
            deliveries.map((delivery) => (
              <div key={`${delivery.businessId}-${delivery.id ?? "empty"}`}>
                <DeliveryRow noticeId={noticeId} delivery={delivery} companies={deliveryCompanies} />
                {(delivery.deliveryStatus || delivery.deliveryMemo) && (
 <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 typo-medium-12 text-gray-500">
                    {delivery.deliveryStatus && (
                      <span className="mr-4">
                        상태: {DELIVERY_STATUS_LABEL[delivery.deliveryStatus] ?? delivery.deliveryStatus}
                      </span>
                    )}
                    {delivery.deliveryMemo && <span>메모: {delivery.deliveryMemo}</span>}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
