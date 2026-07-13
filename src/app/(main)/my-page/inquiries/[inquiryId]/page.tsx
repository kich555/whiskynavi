import { ApiError } from "@/apis/errors";
import { get1 as getInquiry } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RichTextContent from "@/components/editor/RichTextContent";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAuthToken } from "@/lib/auth";
import { formatDateTime } from "@/lib/formatters";
import { parsePositiveInt } from "@/lib/page-response";
import { sanitizeRichTextContent } from "@/lib/rich-text";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import InquiryDeleteButton from "../_components/InquiryDeleteButton";
import InquiryMessageForm from "../_components/InquiryMessageForm";
import { INQUIRY_STATUS_LABEL, USER_INQUIRY_STATUS_COLOR } from "../_lib/status";

interface InquiryDetailPageProps {
  params: Promise<{ inquiryId: string }>;
}

export default async function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  const { inquiryId: rawInquiryId } = await params;
  const inquiryId = parsePositiveInt(rawInquiryId);
  if (!inquiryId) notFound();

  const token = await getAuthToken();
  if (!token) redirect(`/sign-in?callbackUrl=/my-page/inquiries/${inquiryId}`);

  let response;
  try {
    response = await getInquiry(inquiryId, withToken(token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const inquiry = response.data.inquiry;
  if (!inquiry?.id) notFound();
  const isClosed = inquiry.status === "CLOSED";

  return (
    <div className="mt-20 min-h-screen bg-[#1d2429] px-4 py-8 sm:mt-16 sm:px-6 md:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Button asChild variant="ghost" className="mb-5 px-0 text-gray-400 hover:text-white">
          <Link href="/my-page/inquiries">
            <ChevronLeft /> 문의 목록으로
          </Link>
        </Button>

        <article className="border border-white/10 bg-white/5">
          <header className="border-b border-white/10 p-5 md:p-7">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={USER_INQUIRY_STATUS_COLOR[inquiry.status ?? ""] ?? USER_INQUIRY_STATUS_COLOR.CLOSED}
              >
                {INQUIRY_STATUS_LABEL[inquiry.status ?? ""] ?? inquiry.status}
              </Badge>
              <span className="text-xs text-gray-500">문의 #{inquiry.id}</span>
            </div>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <h1 className="text-xl font-bold text-white md:text-2xl">{inquiry.title}</h1>
                <p className="mt-2 text-xs text-gray-400">최근 메시지 {formatDateTime(inquiry.lastMessageAt)}</p>
              </div>
              <InquiryDeleteButton inquiryId={inquiry.id} />
            </div>
          </header>

          <div className="space-y-5 p-5 md:p-7">
            {(response.data.messages ?? []).map((message) => {
              const isUser = message.authorType === "USER";
              return (
                <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] md:max-w-[70%] ${isUser ? "text-right" : "text-left"}`}>
                    <p className="mb-1 text-xs text-gray-400">
                      {isUser ? "나" : message.authorNickname?.trim() || "위스키내비"}
                    </p>
                    <RichTextContent
                      html={sanitizeRichTextContent(message.content ?? "")}
                      className={`rounded-2xl px-4 py-3 text-left text-sm ${
                        isUser ? "rounded-tr-sm bg-white text-[#1d2429]" : "rounded-tl-sm bg-white/10 text-gray-100"
                      }`}
                    />
                    <time className="mt-1 block text-xs text-gray-500">{formatDateTime(message.createdAt)}</time>
                  </div>
                </div>
              );
            })}

            {isClosed ? (
              <div className="border-t border-white/10 pt-6 text-center text-sm text-gray-400">
                종료된 문의에는 메시지를 추가할 수 없습니다.
              </div>
            ) : (
              <InquiryMessageForm inquiryId={inquiry.id} />
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
