import { getApiAdminBottles, getApiAdminUsers, type GetApiAdminUsersParams } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import ManualPurchaseImportContent, { type ManualPurchaseImportSearchParams } from "./_components/ManualPurchaseImportContent";

interface ManualPurchaseImportPageProps {
  searchParams: Promise<ManualPurchaseImportSearchParams>;
}

type UserSearchField = "name" | "username" | "email" | "phone";

function resolveUserSearchField(value?: string): UserSearchField {
  if (value === "username" || value === "email" || value === "phone") return value;
  return "name";
}

export default async function ManualPurchaseImportPage({ searchParams }: ManualPurchaseImportPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();
  const userQ = params.userQ?.trim();
  const bottleQ = params.bottleQ?.trim();
  const userSearchField = resolveUserSearchField(params.userField);

  const userFilters: GetApiAdminUsersParams = {
    page: 0,
    size: 10,
    sort: ["id,desc"],
  };
  if (userQ) {
    userFilters[userSearchField] = userQ;
  }

  const [usersRes, bottlesRes] = await Promise.all([
    getApiAdminUsers(userFilters, withToken(token)),
    getApiAdminBottles(
      {
        page: 0,
        size: 10,
        keyword: bottleQ || undefined,
        sort: ["id,desc"],
      },
      withToken(token),
    ),
  ]);

  return (
    <ManualPurchaseImportContent
      searchParams={params}
      users={usersRes.data.content ?? []}
      bottles={bottlesRes.data.content ?? []}
    />
  );
}
