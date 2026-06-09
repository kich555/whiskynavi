type ReservationNoticePeriod = {
  reservationEndAt?: string | Date | null;
};

export function isReservationNoticeEnded(notice: ReservationNoticePeriod): boolean {
  if (!notice.reservationEndAt) {
    return false;
  }

  const endAt = new Date(notice.reservationEndAt).getTime();
  return Number.isFinite(endAt) && Date.now() > endAt;
}
