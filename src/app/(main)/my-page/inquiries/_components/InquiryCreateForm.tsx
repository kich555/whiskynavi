"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useActionState } from "react";
import { createInquiryAction } from "../actions";

export default function InquiryCreateForm() {
  const [state, formAction, isPending] = useActionState(createInquiryAction, {
    success: false,
  });

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="block text-sm font-semibold text-white">
          제목
        </label>
        <Input
          id="title"
          name="title"
          maxLength={200}
          required
          placeholder="문의 제목을 입력해주세요."
          className="border-white/15 bg-white/5 text-white placeholder:text-gray-500"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="content" className="block text-sm font-semibold text-white">
          문의 내용
        </label>
        <Textarea
          id="content"
          name="content"
          required
          rows={10}
          placeholder="문의하실 내용을 자세히 작성해주세요."
          className="min-h-64 border-white/15 bg-white/5 text-white placeholder:text-gray-500"
        />
      </div>

      {state.error ? (
        <p role="alert" className="text-sm text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
          <Link href="/my-page/inquiries">취소</Link>
        </Button>
        <Button type="submit" disabled={isPending} className="bg-white text-[#1d2429] hover:bg-gray-200">
          {isPending ? "등록 중..." : "문의 등록"}
        </Button>
      </div>
    </form>
  );
}
