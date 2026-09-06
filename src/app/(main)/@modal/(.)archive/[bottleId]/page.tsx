import { getApiBottlesId } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import BottleDetailModal from "./BottleDetailModal";

const Page = async ({ params }: { params: Promise<{ bottleId: string }> }) => {
  const { bottleId: bottleIdParam } = await params;
  const bottleId = Number(bottleIdParam);
  const token = await getAuthToken();
  const { data: bottle } = await getApiBottlesId(bottleId, withToken(token));

  return <BottleDetailModal bottle={bottle} />;
};

export default Page;
