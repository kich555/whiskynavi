type ReservationNoticePeriod = {
  saleStatus?: string | null;
  reservationEndAt?: string | Date | null;
};

export function isReservationNoticeClosed(notice: ReservationNoticePeriod): boolean {
  return notice.saleStatus === "CLOSED";
}
