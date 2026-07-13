import { list as listInquiries } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/formatters";
import { parseDisplayPage, toApiPage } from "@/lib/page-response";
import { ChevronLeft, ChevronRight, MessageCircleQuestion, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { INQUIRY_STATUS_LABEL, USER_INQUIRY_STATUS_COLOR } from "./_lib/status";

interface InquiryListPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function InquiryListPage({ searchParams }: InquiryListPageProps) {
  const token = await getAuthToken();
  if (!token) redirect("/sign-in?callbackUrl=/my-page/inquiries");

  const params = await searchParams;
  const currentPage = parseDisplayPage(params.page);
  const response = await listInquiries(
    { page: toApiPage(currentPage), size: 10, sort: ["lastMessageAt,desc"] },
    withToken(token),
  );
  const inquiries = response.data.content ?? [];
  const totalPages = response.data.page?.totalPages ?? 0;

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429] px-4 py-8 sm:mt-16 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <Link
              href="/my-page"
              className="mb-3 inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white"
            >
              <ChevronLeft className="size-4" /> 마이페이지
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-bold text-white md:text-4xl">
              <MessageCircleQuestion className="size-8" /> 1:1 문의
            </h1>
            <p className="mt-2 text-sm text-gray-400">문의 내역과 답변을 확인하실 수 있습니다.</p>
          </div>
          <Button asChild className="bg-white text-[#1d2429] hover:bg-gray-200">
            <Link href="/my-page/inquiries/new">
              <Plus /> 문의하기
            </Link>
          </Button>
        </div>

        <div className="overflow-hidden border border-white/10 bg-white/5">
          {inquiries.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <MessageCircleQuestion className="mx-auto mb-4 size-10 text-gray-500" />
              <p className="font-semibold text-white">등록한 문의가 없습니다.</p>
              <p className="mt-2 text-sm text-gray-400">궁금한 점을 남겨주시면 확인 후 답변드리겠습니다.</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {inquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    href={`/my-page/inquiries/${inquiry.id}`}
                    className="block px-5 py-5 transition-colors hover:bg-white/5 md:px-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              USER_INQUIRY_STATUS_COLOR[inquiry.status ?? ""] ?? USER_INQUIRY_STATUS_COLOR.CLOSED
                            }
                          >
                            {INQUIRY_STATUS_LABEL[inquiry.status ?? ""] ?? inquiry.status}
                          </Badge>
                          <span className="text-xs text-gray-500">문의 #{inquiry.id}</span>
                        </div>
                        <h2 className="truncate font-semibold text-white">{inquiry.title ?? "제목 없음"}</h2>
                      </div>
                      <time className="shrink-0 text-xs text-gray-400">{formatDateTime(inquiry.lastMessageAt)}</time>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {totalPages > 1 ? (
            <nav
              aria-label="문의 목록 페이지"
              className="flex items-center justify-center gap-4 border-t border-white/10 px-5 py-4"
            >
              {currentPage > 1 ? (
                <Link
                  href={`/my-page/inquiries?page=${currentPage - 1}`}
                  className="rounded p-2 text-gray-300 hover:bg-white/10"
                >
                  <ChevronLeft className="size-5" />
                  <span className="sr-only">이전 페이지</span>
                </Link>
              ) : (
                <span className="p-2 text-gray-600">
                  <ChevronLeft className="size-5" />
                </span>
              )}
              <span className="text-sm text-gray-300">
                {currentPage} / {totalPages}
              </span>
              {currentPage < totalPages ? (
                <Link
                  href={`/my-page/inquiries?page=${currentPage + 1}`}
                  className="rounded p-2 text-gray-300 hover:bg-white/10"
                >
                  <ChevronRight className="size-5" />
                  <span className="sr-only">다음 페이지</span>
                </Link>
              ) : (
                <span className="p-2 text-gray-600">
                  <ChevronRight className="size-5" />
                </span>
              )}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
