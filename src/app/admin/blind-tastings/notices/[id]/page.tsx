import { notFound } from "next/navigation";
import NoticeDetail from "../../_components/NoticeDetail";
import { loadNotice } from "../../actions";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const q = await searchParams;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) notFound();
  const tab = q.tab ?? "settings";
  if (!["settings", "applications", "shipping", "reviews", "audit"].includes(tab)) notFound();
  return (
    <NoticeDetail
      id={Number(id)}
      tab={tab}
      query={q}
      result={await loadNotice(
        Number(id),
        tab,
        Number(q.application) || undefined,
        Number(q.sample) || undefined,
        q.keyword,
        q.timing,
        q.hidden,
      )}
    />
  );
}
