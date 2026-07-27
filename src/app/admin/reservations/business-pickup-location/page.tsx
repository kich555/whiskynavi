import { getApiAdminBusinessesMembers, getApiAdminReservationsBusinessPickupLocation } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BusinessPickupSettingContent, { type PickupBusinessOption } from "./_components/BusinessPickupSettingContent";

export default async function BusinessPickupSettingPage() {
  const token = await getAuthToken();
  const options = withToken(token);
  const [settingResponse, businessesResponse] = await Promise.all([
    getApiAdminReservationsBusinessPickupLocation(options),
    getApiAdminBusinessesMembers(
      {
        hasPickupRole: true,
        page: 0,
        size: 200,
        sort: ["businessName,asc"],
      },
      options,
    ),
  ]);

  const businesses: PickupBusinessOption[] = (businessesResponse.data.content ?? []).flatMap((business) =>
    business.businessId
      ? [
          {
            businessId: business.businessId,
            businessName: business.businessName ?? `사업장 ${business.businessId}`,
            pickupAddress: business.pickupAddress,
            contact: business.contact,
          },
        ]
      : [],
  );

  return <BusinessPickupSettingContent setting={settingResponse.data} businesses={businesses} />;
}
