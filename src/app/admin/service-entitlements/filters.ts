export const entitlementStatusLabels: Record<string, string> = {
  AVAILABLE: "이용 가능",
  NOT_YET_VALID: "이용 시작 전",
  EXPIRED: "만료",
  USED: "사용 완료",
  CANCELED: "취소",
  SUSPENDED: "이용 정지",
};
export interface EntitlementSearchParams {
  keyword?: string;
  status?: string;
  entitlementId?: string;
  orderId?: string;
  beforeId?: string;
}
export function entitlementSearchHref(params: EntitlementSearchParams, beforeId?: number) {
  const query = new URLSearchParams();
  for (const key of ["keyword", "status", "entitlementId", "orderId"] as const) {
    if (params[key]) query.set(key, params[key]);
  }
  if (beforeId) query.set("beforeId", String(beforeId));
  return `/admin/service-entitlements${query.size ? `?${query}` : ""}`;
}
