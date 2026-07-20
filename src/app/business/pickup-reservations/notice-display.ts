interface ReservationNoticeNames {
  noticeName?: string;
  bottleName?: string;
}

export function getReservationNoticeDisplay(names: ReservationNoticeNames) {
  const noticeName = names.noticeName?.trim();
  const bottleName = names.bottleName?.trim();
  const primaryName = noticeName || bottleName || "이름 없는 예약 공고";

  return {
    primaryName,
    secondaryName: bottleName && bottleName !== primaryName ? bottleName : undefined,
  };
}
