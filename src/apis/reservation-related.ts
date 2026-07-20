import type { UserBottleReservationNoticePublicResponse } from "./generated/api";
import { customFetch } from "./mutator";

export type RelatedNoticeAccessReason = "OWN_APPLICATION" | "PICKUP_BUSINESS_ASSIGNMENT";

export interface UserBottleReservationRelatedNoticeResponse extends UserBottleReservationNoticePublicResponse {
  accessReason?: RelatedNoticeAccessReason;
  imageUrls?: string[];
  readOnly?: boolean;
}

interface RelatedNoticeApiResponse {
  data: UserBottleReservationRelatedNoticeResponse;
  headers: Headers;
  status: number;
}

export function getRelatedBottleReservationNoticeByApplication(applicationId: number, options?: RequestInit) {
  return customFetch<RelatedNoticeApiResponse>(`/api/bottles/reservations/applications/${applicationId}/notice`, {
    ...options,
    method: "GET",
  });
}

export function getRelatedBottleReservationNoticeByPickupBusiness(noticeId: number, options?: RequestInit) {
  return customFetch<RelatedNoticeApiResponse>(`/api/users/businesses/pickup-reservations/notices/${noticeId}/detail`, {
    ...options,
    method: "GET",
  });
}
