import { getApiUsersBusinessesPickupReservationsApplicationsApplicationid } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import PickupApplicationDetailContent from "./_components/PickupApplicationDetailContent";

interface PickupApplicationDetailPageProps {
  params: Promise<{ applicationId: string }>;
}

export default async function PickupApplicationDetailPage({
  params,
}: PickupApplicationDetailPageProps) {
  const { applicationId } = await params;
  const token = await getAuthToken();

  try {
    const res =
      await getApiUsersBusinessesPickupReservationsApplicationsApplicationid(
        Number(applicationId),
        withToken(token),
      );

    return <PickupApplicationDetailContent application={res.data} />;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("[404]")) {
      notFound();
    }
    throw error;
  }
}
