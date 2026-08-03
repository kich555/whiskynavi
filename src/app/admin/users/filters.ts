export const USER_SEARCH_FIELD_OPTIONS = [
  { value: "name", label: "이름" },
  { value: "username", label: "사용자명" },
  { value: "email", label: "이메일" },
] as const;

export type UserSearchField = (typeof USER_SEARCH_FIELD_OPTIONS)[number]["value"];

export const ADMIN_USER_ROLES = {
  SUPER_ADMIN: "ROLE_SUPER_ADMIN",
  ADMIN: "ROLE_ADMIN",
  USER: "ROLE_USER",
  ROLE_BUSINESS: "ROLE_BUSINESS",
  WHISKYNAVI_MEMBER: "ROLE_WHISKYNAVI_MEMBER",
  WHISKYTALES_MEMBER: "ROLE_WHISKYTALES_MEMBER",
  TRAILNTALE_BUSINESS: "ROLE_TRAILNTALE_BUSINESS",
  COMMUNITY_BUSINESS: "ROLE_COMMUNITY_BUSINESS",
  PICK_UP_BUSINESS: "ROLE_PICK_UP_BUSINESS",
} as const;

export type AdminUserRole = (typeof ADMIN_USER_ROLES)[keyof typeof ADMIN_USER_ROLES];

export const ROLE_OPTIONS = [
  { value: "all", label: "전체" },
  { value: ADMIN_USER_ROLES.SUPER_ADMIN, label: "총괄 관리자" },
  { value: ADMIN_USER_ROLES.ADMIN, label: "관리자" },
  { value: ADMIN_USER_ROLES.USER, label: "일반 회원" },
] as const;

export const NAVI_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "include", label: "가입" },
  { value: "exclude", label: "미가입" },
] as const;

export const TALES_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "include", label: "가입" },
  { value: "exclude", label: "미가입" },
] as const;

export const BUSINESS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: ADMIN_USER_ROLES.ROLE_BUSINESS, label: "업장" },
  { value: ADMIN_USER_ROLES.TRAILNTALE_BUSINESS, label: "트레일테일" },
  { value: ADMIN_USER_ROLES.COMMUNITY_BUSINESS, label: "커뮤니티" },
  { value: ADMIN_USER_ROLES.PICK_UP_BUSINESS, label: "픽업" },
] as const;

export const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "ACTIVE", label: "활성" },
  { value: "INACTIVE", label: "비활성" },
] as const;

export type AdminUsersSearchParams = {
  page?: string;
  limit?: string;
  q?: string;
  searchField?: string;
  role?: string;
  excludedRoles?: string[];
  status?: string;
  sortBy?: string;
  sortDirection?: string;
};

export type AdminUsersRawSearchParams = Omit<
  {
    [Key in keyof AdminUsersSearchParams]?: string | string[];
  },
  "excludedRoles"
> & {
  excludedRoles?: string | string[];
};

const ROLE_FILTER_KEYS = ["role", "navi", "tales", "business"] as const;

export type AdminUserRoleFilterKey = (typeof ROLE_FILTER_KEYS)[number];

const MEMBER_ROLE_VALUES = ROLE_OPTIONS.filter((option) => option.value !== "all").map((option) => option.value);
const BUSINESS_ROLE_VALUES = BUSINESS_OPTIONS.filter((option) => option.value !== "all").map((option) => option.value);
const ADMIN_USER_ROLE_VALUES = [
  ...MEMBER_ROLE_VALUES,
  ADMIN_USER_ROLES.WHISKYNAVI_MEMBER,
  ADMIN_USER_ROLES.WHISKYTALES_MEMBER,
  ...BUSINESS_ROLE_VALUES,
];
const ADMIN_USER_ROLE_VALUE_SET = new Set<string>(ADMIN_USER_ROLE_VALUES);
const MEMBER_ROLE_VALUE_SET = new Set<string>(MEMBER_ROLE_VALUES);
const BUSINESS_ROLE_VALUE_SET = new Set<string>(BUSINESS_ROLE_VALUES);

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function arrayQueryValue(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function uniqueValues(values: string[]): string[] {
  return [...new Set(values)];
}

function isKnownRole(value: string): value is AdminUserRole {
  return ADMIN_USER_ROLE_VALUE_SET.has(value);
}

export function isAdminUserRoleFilterKey(key: string): key is AdminUserRoleFilterKey {
  return ROLE_FILTER_KEYS.includes(key as AdminUserRoleFilterKey);
}

function normalizeRole(value: string | undefined): string | undefined {
  return value && isKnownRole(value) ? value : undefined;
}

function normalizeExcludedRoles(values: string[], role?: string): string[] | undefined {
  const excludedRoles = uniqueValues(values).filter((value) => isKnownRole(value) && value !== role);
  return excludedRoles.length > 0 ? excludedRoles : undefined;
}

function removeExcludedRole(values: string[] | undefined, role: string): string[] | undefined {
  return normalizeExcludedRoles((values ?? []).filter((value) => value !== role));
}

function addExcludedRole(values: string[] | undefined, role: string): string[] {
  return normalizeExcludedRoles([...(values ?? []), role]) ?? [];
}

export function resolveSearchField(value?: string): UserSearchField {
  if (value === "username" || value === "email") {
    return value;
  }

  return "name";
}

export function normalizeAdminUsersSearchParams(params: AdminUsersRawSearchParams): AdminUsersSearchParams {
  const role = normalizeRole(firstQueryValue(params.role));

  return {
    page: firstQueryValue(params.page),
    limit: firstQueryValue(params.limit),
    q: firstQueryValue(params.q),
    searchField: firstQueryValue(params.searchField),
    role,
    excludedRoles: normalizeExcludedRoles(arrayQueryValue(params.excludedRoles), role),
    status: firstQueryValue(params.status),
    sortBy: firstQueryValue(params.sortBy),
    sortDirection: firstQueryValue(params.sortDirection),
  };
}

export function resolveAdminUsersRoleFilters(params: AdminUsersSearchParams): {
  role?: string;
  excludedRoles?: string[];
} {
  const role = normalizeRole(params.role);

  return {
    role,
    excludedRoles: normalizeExcludedRoles(params.excludedRoles ?? [], role),
  };
}

export function getAdminUserRoleFilterValue(params: AdminUsersSearchParams, key: AdminUserRoleFilterKey): string {
  if (key === "role") {
    return params.role && MEMBER_ROLE_VALUE_SET.has(params.role) ? params.role : "all";
  }

  if (key === "business") {
    return params.role && BUSINESS_ROLE_VALUE_SET.has(params.role) ? params.role : "all";
  }

  const role = key === "navi" ? ADMIN_USER_ROLES.WHISKYNAVI_MEMBER : ADMIN_USER_ROLES.WHISKYTALES_MEMBER;

  if (params.role === role) {
    return "include";
  }

  if (params.excludedRoles?.includes(role)) {
    return "exclude";
  }

  return "all";
}

function setPositiveRole(params: AdminUsersSearchParams, role: string): AdminUsersSearchParams {
  return {
    ...params,
    role,
    excludedRoles: removeExcludedRole(params.excludedRoles, role),
  };
}

function clearRoleIfIn(params: AdminUsersSearchParams, roles: ReadonlySet<string>): AdminUsersSearchParams {
  if (!params.role || !roles.has(params.role)) {
    return params;
  }

  return {
    ...params,
    role: undefined,
  };
}

function toUrlSearchParams(params: AdminUsersSearchParams): URLSearchParams {
  const urlParams = new URLSearchParams();

  if (params.page) urlParams.set("page", params.page);
  if (params.limit) urlParams.set("limit", params.limit);
  if (params.q) urlParams.set("q", params.q);
  if (params.searchField) urlParams.set("searchField", params.searchField);
  if (params.role) urlParams.set("role", params.role);
  params.excludedRoles?.forEach((role) => urlParams.append("excludedRoles", role));
  if (params.status) urlParams.set("status", params.status);
  if (params.sortBy) urlParams.set("sortBy", params.sortBy);
  if (params.sortDirection) urlParams.set("sortDirection", params.sortDirection);

  return urlParams;
}

export function buildAdminUserRoleFilterParams(
  searchParams: AdminUsersSearchParams,
  key: AdminUserRoleFilterKey,
  value: string,
): URLSearchParams {
  let nextParams: AdminUsersSearchParams = {
    ...searchParams,
    page: "1",
    excludedRoles: searchParams.excludedRoles ? [...searchParams.excludedRoles] : undefined,
  };

  if (key === "role") {
    nextParams =
      value === "all" ? clearRoleIfIn(nextParams, MEMBER_ROLE_VALUE_SET) : setPositiveRole(nextParams, value);
  }

  if (key === "business") {
    nextParams =
      value === "all" ? clearRoleIfIn(nextParams, BUSINESS_ROLE_VALUE_SET) : setPositiveRole(nextParams, value);
  }

  if (key === "navi" || key === "tales") {
    const role = key === "navi" ? ADMIN_USER_ROLES.WHISKYNAVI_MEMBER : ADMIN_USER_ROLES.WHISKYTALES_MEMBER;

    if (value === "include") {
      nextParams = setPositiveRole(nextParams, role);
    }

    if (value === "exclude") {
      nextParams = {
        ...clearRoleIfIn(nextParams, new Set([role])),
        excludedRoles: addExcludedRole(nextParams.excludedRoles, role),
      };
    }

    if (value === "all") {
      nextParams = {
        ...clearRoleIfIn(nextParams, new Set([role])),
        excludedRoles: removeExcludedRole(nextParams.excludedRoles, role),
      };
    }
  }

  const roleFilters = resolveAdminUsersRoleFilters(nextParams);
  return toUrlSearchParams({
    ...nextParams,
    role: roleFilters.role,
    excludedRoles: roleFilters.excludedRoles,
  });
}
