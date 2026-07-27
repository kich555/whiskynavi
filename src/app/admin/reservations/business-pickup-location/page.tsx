import { getApiAdminBusinessesMembers, getApiAdminReservationsBusinessPickupLocation } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessPickupSettingContent, { type PickupBusinessOption } from "./_components/BusinessPickupSettingContent";

const BUSINESS_PAGE_SIZE = 200;

async function getPickupBusinessOptions(options?: RequestInit): Promise<PickupBusinessOption[]> {
  const getPage = (page: number) =>
    getApiAdminBusinessesMembers(
      {
        page,
        size: BUSINESS_PAGE_SIZE,
        sort: ["businessId,asc"],
      },
      options,
    );

  const firstPage = await getPage(0);
  const totalPages = firstPage.data.page?.totalPages ?? 1;
  const remainingPages =
    totalPages > 1 ? await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => getPage(index + 1))) : [];
  const businessesById = new Map<number, PickupBusinessOption>();

  for (const response of [firstPage, ...remainingPages]) {
    for (const business of response.data.content ?? []) {
      if (!business.businessId || businessesById.has(business.businessId)) continue;
      businessesById.set(business.businessId, {
        businessId: business.businessId,
        businessName: business.businessName ?? `사업장 ${business.businessId}`,
        pickupAddress: business.pickupAddress,
      });
    }
  }

  return [...businessesById.values()].sort(
    (left, right) =>
      left.businessName.localeCompare(right.businessName, "ko") || left.businessId - right.businessId,
  );
}

export default async function BusinessPickupSettingPage() {
  const token = await getAuthToken();
  const options = withToken(token);
  const [settingResponse, businesses] = await Promise.all([
    getApiAdminReservationsBusinessPickupLocation(options),
    getPickupBusinessOptions(options),
  ]);

  return <BusinessPickupSettingContent setting={settingResponse.data} businesses={businesses} />;
}
