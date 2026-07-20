import type { UserBottleReservationRelatedNoticeResponse } from "@/apis/reservation-related";
import { ImageWithFallback } from "@/components/ui/ImageWithFallback";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

interface RelatedNoticeDetailProps {
  notice: UserBottleReservationRelatedNoticeResponse;
  appearance: "dark" | "light";
}

const ROLE_LABELS: Record<string, string> = {
  ROLE_WHISKYNAVI_MEMBER: "위스키내비 멤버",
  ROLE_WHISKYTALES_MEMBER: "위스키테일즈 멤버",
  ROLE_BLIND_MEMBER: "블라인드 멤버",
  ROLE_BUSINESS: "업장 회원",
  ROLE_COMMUNITY_BUSINESS: "커뮤니티 업장",
  ROLE_PICK_UP_BUSINESS: "픽업 업장",
};

export default function RelatedNoticeDetail({ notice, appearance }: RelatedNoticeDetailProps) {
  const dark = appearance === "dark";
  const additionalImages = notice.imageUrls ?? [];
  const accessLabel =
    notice.accessReason === "PICKUP_BUSINESS_ASSIGNMENT" ? "픽업 사업장 관계로 열람 중" : "과거 신청 관계로 열람 중";

  const rows = [
    ["브랜드", notice.bottleBrand || "-"],
    ["예약 기간", `${formatDateTime(notice.reservationStartAt)} ~ ${formatDateTime(notice.reservationEndAt)}`],
    ["판매가", formatCurrency(notice.price)],
    ...(notice.supplyPrice != null ? [["공급가", formatCurrency(notice.supplyPrice)]] : []),
    ["인당 최대 수량", notice.maxOrderQuantity != null ? `${notice.maxOrderQuantity}병` : "-"],
  ];

  return (
    <article className={dark ? "border border-white/10 bg-white/5 p-4 lg:p-8" : "border border-gray-200 bg-white p-6"}>
      <div
        className={
          dark
            ? "typo-medium-14 mb-6 border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-amber-200"
            : "typo-medium-14 mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
        }
      >
        {accessLabel} · 이 화면에서는 공고 내용만 확인할 수 있습니다.
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <div className={dark ? "relative aspect-square bg-gray-800" : "relative aspect-square bg-gray-100"}>
            <ImageWithFallback
              src={notice.bottleImgUrl}
              alt={notice.bottleName ?? "예약 보틀"}
              fill
              className="object-contain p-6"
            />
          </div>
          {additionalImages.length > 0 && (
            <div className="mt-3 grid grid-cols-4 gap-2">
              {additionalImages.map((imageUrl, index) => (
                <div
                  key={`${imageUrl}-${index}`}
                  className={dark ? "relative aspect-square bg-gray-800" : "relative aspect-square bg-gray-100"}
                >
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`${notice.bottleName ?? "예약 보틀"} 추가 이미지 ${index + 1}`}
                    fill
                    className="object-contain p-2"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className={dark ? "typo-medium-14 text-gray-400" : "typo-medium-14 text-gray-500"}>
            {notice.bottleBrand ?? "-"}
          </p>
          <h1
            className={
              dark ? "mt-2 text-2xl font-bold text-white lg:text-3xl" : "mt-2 text-2xl font-bold text-gray-900"
            }
          >
            {notice.noticeName || notice.bottleName || "이름 없는 예약 공고"}
          </h1>
          {notice.bottleName && (
            <p className={dark ? "mt-2 text-base text-gray-400" : "mt-2 text-base text-gray-600"}>
              {notice.bottleName}
            </p>
          )}

          <dl className="mt-6 space-y-3">
            {rows.map(([label, value]) => (
              <div
                key={label}
                className={
                  dark
                    ? "flex items-start justify-between gap-6 border-b border-white/10 pb-3"
                    : "flex items-start justify-between gap-6 border-b border-gray-100 pb-3"
                }
              >
                <dt
                  className={dark ? "typo-medium-14 shrink-0 text-gray-400" : "typo-medium-14 shrink-0 text-gray-500"}
                >
                  {label}
                </dt>
                <dd
                  className={dark ? "typo-medium-14 text-right text-white" : "typo-medium-14 text-right text-gray-900"}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          {(notice.gradeConditions?.length ?? 0) > 0 && (
            <div className="mt-6">
              <h2 className={dark ? "typo-bold-14 text-white" : "typo-bold-14 text-gray-900"}>원래 신청 조건</h2>
              <ul
                className={
                  dark ? "typo-medium-14 mt-2 space-y-1 text-gray-300" : "typo-medium-14 mt-2 space-y-1 text-gray-600"
                }
              >
                {notice.gradeConditions?.map((condition, index) => (
                  <li key={`${condition.requiredRole}-${index}`}>
                    {ROLE_LABELS[condition.requiredRole ?? ""] ?? condition.requiredRole ?? "-"}
                    {condition.applicableFrom ? ` · ${formatDateTime(condition.applicableFrom)}부터` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {notice.description && (
        <section className={dark ? "mt-8 border-t border-white/10 pt-6" : "mt-8 border-t border-gray-200 pt-6"}>
          <h2 className={dark ? "text-lg font-bold text-white" : "text-lg font-bold text-gray-900"}>공고 내용</h2>
          <p
            className={
              dark
                ? "typo-medium-14 mt-3 leading-7 whitespace-pre-line text-gray-300"
                : "typo-medium-14 mt-3 leading-7 whitespace-pre-line text-gray-700"
            }
          >
            {notice.description}
          </p>
        </section>
      )}
    </article>
  );
}
