import { getApiV2BottlesParameters } from "@/apis/generated/api";
import { Suspense } from "react";
import Hero from "../_components/Hero";
import ArchiveClientShell from "./_components/ArchiveClientShell";
import BottleList from "./_components/BottleList";
import BottleListSkeleton from "./_components/BottleListSkeleton";
import { SearchParams } from "./_utils";

type PageProps = {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const bottleParams = await getApiV2BottlesParameters();
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="min-h-screen bg-[#1d2429]">
      <Hero backgroundText="ARCHIVE" title="아카이브" subtitle="위스키내비에서 발매한 모든 제품을 둘러보세요." />
      <ArchiveClientShell bottleParams={bottleParams.data}>
        <Suspense key={suspenseKey} fallback={<BottleListSkeleton />}>
          <BottleList params={params} />
        </Suspense>
      </ArchiveClientShell>
    </div>
  );
};

export default Page;
