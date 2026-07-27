import { getApiV2Bottles } from "@/apis/generated/api";
import { parseDisplayPage } from "@/lib/page-response";
import BottleCard from "../../_components/BottleCard";
import type { SearchParams } from "../_utils";
import { buildBottleSearchApiParams, buildPageUrl } from "../_utils";
import Pagination from "./Pagination";

interface BottleListProps {
  params: SearchParams;
}

export default async function BottleList({ params }: BottleListProps) {
  const currentPage = parseDisplayPage(params.page);
  const { data: bottlesResponse } = await getApiV2Bottles(buildBottleSearchApiParams(params, currentPage));

  const totalPages = bottlesResponse.page?.totalPages ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3 lg:gap-8">
        {bottlesResponse.content?.map((bottle) => (
          <BottleCard key={bottle.id} bottle={bottle} />
        ))}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        buildPageUrl={(page) => buildPageUrl(params, page)}
      />
    </>
  );
}
