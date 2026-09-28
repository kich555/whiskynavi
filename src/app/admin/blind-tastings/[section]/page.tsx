import { notFound } from "next/navigation";
import Overview from "../_components/Overview";
import { loadOverview } from "../actions";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ keyword?: string; page?: string }>;
}) {
  const { section } = await params;
  if (!["bottles", "samples", "restrictions", "incidents"].includes(section)) notFound();
  const q = await searchParams;
  const page = Math.max(0, Number(q.page) || 0);
  return (
    <Overview result={await loadOverview(section, q.keyword, page)} section={section} keyword={q.keyword} page={page} />
  );
}
