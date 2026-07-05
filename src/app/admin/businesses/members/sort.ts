export const BUSINESS_MEMBERS_SORT_OPTIONS = [
  { value: "businessId,desc", label: "최신 등록순" },
  { value: "businessId,asc", label: "오래된 등록순" },
] as const;

export const DEFAULT_BUSINESS_MEMBERS_SORT = BUSINESS_MEMBERS_SORT_OPTIONS[0].value;

export type BusinessMembersSort = (typeof BUSINESS_MEMBERS_SORT_OPTIONS)[number]["value"];

export function resolveBusinessMembersSort(sort?: string): BusinessMembersSort {
  return BUSINESS_MEMBERS_SORT_OPTIONS.find((option) => option.value === sort)?.value ?? DEFAULT_BUSINESS_MEMBERS_SORT;
}
