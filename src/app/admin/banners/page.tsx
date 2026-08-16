import { getApiV2AdminBannersPublished, getApiV2AdminBannersUnpublished } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parseDisplayPage, parsePageSize, toApiPage } from "@/lib/page-response";
import BannersContent from "./_components/BannersContent";

interface BannersPageProps {
  searchParams: Promise<{
    publishedPage?: string;
    publishedLimit?: string;
    unpublishedPage?: string;
    unpublishedLimit?: string;
  }>;
}

export default async function BannersPage({ searchParams }: BannersPageProps) {
  const params = await searchParams;
  const token = await getAuthToken();

  const publishedPage = parseDisplayPage(params.publishedPage);
  const publishedLimit = parsePageSize(params.publishedLimit, 12);
  const unpublishedPage = parseDisplayPage(params.unpublishedPage);
  const unpublishedLimit = parsePageSize(params.unpublishedLimit, 12);

  const [publishedResponse, unpublishedResponse] = await Promise.all([
    getApiV2AdminBannersPublished({ page: toApiPage(publishedPage), size: publishedLimit }, withToken(token)),
    getApiV2AdminBannersUnpublished({ page: toApiPage(unpublishedPage), size: unpublishedLimit }, withToken(token)),
  ]);

  return (
    <BannersContent
      searchParams={params}
      publishedBanners={publishedResponse.data.content ?? []}
      publishedTotalElements={publishedResponse.data.page?.totalElements ?? 0}
      publishedPage={publishedPage}
      publishedLimit={publishedLimit}
      unpublishedBanners={unpublishedResponse.data.content ?? []}
      unpublishedTotalElements={unpublishedResponse.data.page?.totalElements ?? 0}
      unpublishedPage={unpublishedPage}
      unpublishedLimit={unpublishedLimit}
    />
  );
}
