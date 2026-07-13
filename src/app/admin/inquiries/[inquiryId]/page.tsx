import { ApiError } from "@/apis/errors";
import { get2 as getAdminInquiry } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { parsePositiveInt } from "@/lib/page-response";
import { sanitizeRichTextContent } from "@/lib/rich-text";
import { notFound } from "next/navigation";
import AdminInquiryDetailContent from "../_components/AdminInquiryDetailContent";

interface AdminInquiryDetailPageProps {
  params: Promise<{ inquiryId: string }>;
}

export default async function AdminInquiryDetailPage({ params }: AdminInquiryDetailPageProps) {
  const { inquiryId: rawInquiryId } = await params;
  const inquiryId = parsePositiveInt(rawInquiryId);
  if (!inquiryId) notFound();

  const token = await getAuthToken();
  let response;
  try {
    response = await getAdminInquiry(inquiryId, withToken(token));
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  if (!response.data.inquiry?.id) notFound();
  const detail = {
    ...response.data,
    messages: (response.data.messages ?? []).map((message) => ({
      ...message,
      content: sanitizeRichTextContent(message.content ?? ""),
    })),
  };
  return <AdminInquiryDetailContent detail={detail} />;
}
