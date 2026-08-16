import { getApiV2BottlesParameters } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
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
  const [params, token] = await Promise.all([searchParams, getAuthToken()]);
  const bottleParams = await getApiV2BottlesParameters(withToken(token));
  const suspenseKey = JSON.stringify(params);

  return (
    <div className="min-h-screen bg-[#1d2429]">
      <Hero backgroundText="ARCHIVE" title="아카이브" subtitle="위스키내비에서 발매한 모든 제품을 둘러보세요." />
      <ArchiveClientShell bottleParams={bottleParams.data}>
        <Suspense key={suspenseKey} fallback={<BottleListSkeleton />}>
          <BottleList params={params} token={token} />
        </Suspense>
      </ArchiveClientShell>
    </div>
  );
};

export default Page;
