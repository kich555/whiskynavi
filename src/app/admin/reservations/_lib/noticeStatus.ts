import type { AdminBottleReservationNoticeResponse, AdminItemReservationNoticeResponse } from "@/apis/generated/api";

type ReservationNoticeStatus = {
  editable?: AdminBottleReservationNoticeResponse["editable"] | AdminItemReservationNoticeResponse["editable"] | null;
  saleStatus?:
    | AdminBottleReservationNoticeResponse["saleStatus"]
    | AdminItemReservationNoticeResponse["saleStatus"]
    | null;
};

const NOTICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "임시저장",
  OPEN: "진행",
  SOLD_OUT: "품절",
  CLOSED: "종료",
};

const NOTICE_STATUS_CLASS_NAME: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  OPEN: "bg-green-100 text-green-700",
  SOLD_OUT: "bg-blue-100 text-blue-700",
  CLOSED: "bg-red-100 text-red-700",
};

const EDITABLE_NOTICE_STATUSES = new Set<string>(["DRAFT", "OPEN", "SOLD_OUT"]);

export function getReservationNoticeStatus(notice: ReservationNoticeStatus): string | undefined {
  return notice.saleStatus ?? undefined;
}

export function getReservationNoticeStatusLabel(status?: string | null): string {
  if (!status) return "-";
  return NOTICE_STATUS_LABEL[status] ?? status;
}

export function getReservationNoticeStatusClassName(status?: string | null): string {
  if (!status) return "bg-gray-100 text-gray-700";
  return NOTICE_STATUS_CLASS_NAME[status] ?? "bg-gray-100 text-gray-700";
}

export function isReservationNoticeEditable(notice: ReservationNoticeStatus): boolean {
  if (typeof notice.editable === "boolean") {
    return notice.editable;
  }
  return EDITABLE_NOTICE_STATUSES.has(notice.saleStatus ?? "");
}
