type ReservationNoticeStatus = {
  saleStatus?: string | null;
};

export function isReservationNoticeClosed<T extends object>(notice: T): boolean {
  return (notice as T & ReservationNoticeStatus).saleStatus === "CLOSED";
}
