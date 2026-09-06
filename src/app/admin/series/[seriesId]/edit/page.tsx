import {
  type AdminBottleSeriesResponse,
  getApiAdminBottlesParameters,
  getApiV2AdminBottleSeriesSeriesid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { notFound } from "next/navigation";
import SeriesEditContent from "./_components/SeriesEditContent";

interface SeriesEditPageProps {
  params: Promise<{ seriesId: string }>;
}

export default async function SeriesEditPage({ params }: SeriesEditPageProps) {
  const { seriesId } = await params;
  const token = await getAuthToken();

  let series: AdminBottleSeriesResponse | undefined;
  try {
    const res = await getApiV2AdminBottleSeriesSeriesid(Number(seriesId), withToken(token));
    series = res.data;
  } catch {
    notFound();
  }

  const parametersRes = await getApiAdminBottlesParameters(withToken(token));

  return (
    <SeriesEditContent
      series={series!}
      brandOptions={parametersRes.data.brands ?? []}
    />
  );
}