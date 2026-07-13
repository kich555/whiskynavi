"use client";

import type { AdminInquiryDetailResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/formatters";
import { ArrowLeft, ExternalLink, Lock, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { closeInquiryAction, reopenInquiryAction, replyInquiryAction } from "../actions";

const STATUS_LABEL: Record<string, string> = {
  WAITING: "답변 대기",
  ANSWERED: "답변 완료",
  CLOSED: "문의 종료",
};

const STATUS_COLOR: Record<string, string> = {
  WAITING: "border-amber-200 bg-amber-50 text-amber-700",
  ANSWERED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CLOSED: "border-gray-200 bg-gray-100 text-gray-600",
};

export default function AdminInquiryDetailContent({ detail }: { detail: AdminInquiryDetailResponse }) {
  const inquiry = detail.inquiry!;
  const router = useRouter();
  const { toggle } = useSidebar();
  const formRef = useRef<HTMLFormElement>(null);
  const [isStatusPending, startStatusTransition] = useTransition();
  const replyAction = replyInquiryAction.bind(null, inquiry.id!);
  const [replyState, replyFormAction, isReplyPending] = useActionState(replyAction, { success: false });
  const isClosed = inquiry.status === "CLOSED";

  useEffect(() => {
    if (!replyState.success) return;
    formRef.current?.reset();
    toast.success("답변을 등록했습니다.");
    router.refresh();
  }, [replyState, router]);

  const handleStatusAction = () => {
    startStatusTransition(async () => {
      const result = isClosed ? await reopenInquiryAction(inquiry.id!) : await closeInquiryAction(inquiry.id!);
      if (!result.success) {
        toast.error(result.error ?? "문의 상태를 변경하지 못했습니다.");
        return;
      }
      toast.success(isClosed ? "문의를 다시 열었습니다." : "문의를 종료했습니다.");
      router.refresh();
    });
  };

  return (
    <>
      <AdminHeader title="1:1 문의 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/admin/inquiries")}
              className="justify-start px-0 text-gray-600"
            >
              <ArrowLeft /> 문의 목록으로
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleStatusAction}
              disabled={isStatusPending}
              className={isClosed ? "border-amber-300 text-amber-700" : "border-gray-300 text-gray-700"}
            >
              {isClosed ? <RotateCcw /> : <Lock />}
              {isStatusPending ? "처리 중..." : isClosed ? "문의 다시 열기" : "문의 종료"}
            </Button>
          </div>

          <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <header className="border-b border-gray-200 bg-gray-50 p-5 md:p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={STATUS_COLOR[inquiry.status ?? ""] ?? STATUS_COLOR.CLOSED}>
                  {STATUS_LABEL[inquiry.status ?? ""] ?? inquiry.status}
                </Badge>
                <span className="text-xs text-gray-500">문의 #{inquiry.id}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 md:text-2xl">{inquiry.title}</h1>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                <Link
                  href={`/admin/users/${inquiry.userId}`}
                  className="inline-flex items-center gap-1 text-amber-700 hover:underline"
                >
                  사용자 #{inquiry.userId} <ExternalLink className="size-3" />
                </Link>
                <span>등록 {formatDateTime(inquiry.createdAt)}</span>
                <span>최근 메시지 {formatDateTime(inquiry.lastMessageAt)}</span>
              </div>
            </header>

            <div className="space-y-5 p-5 md:p-7">
              {(detail.messages ?? []).map((message) => {
                const isAdmin = message.authorType === "ADMIN";
                return (
                  <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] md:max-w-[70%] ${isAdmin ? "text-right" : "text-left"}`}>
                      <p className="mb-1 text-xs text-gray-500">
                        {isAdmin ? `관리자 #${message.authorId}` : `사용자 #${message.authorId}`}
                      </p>
                      <div
                        className={`rounded-2xl px-4 py-3 text-left text-sm whitespace-pre-wrap ${
                          isAdmin ? "rounded-tr-sm bg-amber-600 text-white" : "rounded-tl-sm bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                      <time className="mt-1 block text-xs text-gray-400">{formatDateTime(message.createdAt)}</time>
                    </div>
                  </div>
                );
              })}

              {isClosed ? (
                <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
                  종료된 문의입니다. 답변하려면 문의를 다시 열어주세요.
                </div>
              ) : (
                <form ref={formRef} action={replyFormAction} className="border-t border-gray-200 pt-6">
                  <label htmlFor="content" className="mb-2 block text-sm font-semibold text-gray-900">
                    관리자 답변
                  </label>
                  <Textarea
                    id="content"
                    name="content"
                    required
                    rows={6}
                    placeholder="답변 내용을 입력해주세요."
                    className="min-h-36"
                  />
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <div aria-live="polite">
                      {replyState.error ? <p className="text-sm text-red-600">{replyState.error}</p> : null}
                    </div>
                    <Button
                      type="submit"
                      disabled={isReplyPending}
                      className="bg-amber-600 text-white hover:bg-amber-700"
                    >
                      {isReplyPending ? "등록 중..." : "답변 등록"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
