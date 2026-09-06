import { getApiAdminBottlesParameters } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import SeriesCreateContent from "./_components/SeriesCreateContent";

export default async function SeriesCreatePage() {
  const token = await getAuthToken();
  const parametersRes = await getApiAdminBottlesParameters(withToken(token));

  return <SeriesCreateContent brandOptions={parametersRes.data.brands ?? []} />;
}