"use client";

import { postApiBoardsUploads } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RichTextImageEditor from "@/components/editor/RichTextImageEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSession } from "next-auth/react";
import Link from "next/link";
import { useCallback, useActionState, useState } from "react";
import { createInquiryAction } from "../actions";

export default function InquiryCreateForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [state, formAction, isPending] = useActionState(createInquiryAction, {
    success: false,
  });

  const uploadFn = useCallback(async (file: File): Promise<string> => {
    const session = await getSession();
    if (!session?.accessToken) throw new Error("로그인이 필요합니다.");
    const response = await postApiBoardsUploads({ file }, withToken(session.accessToken));
    const url = response.data.url;
    if (!url) throw new Error("업로드된 이미지 URL을 확인할 수 없습니다.");
    return url;
  }, []);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="title" className="typo-semibold-14 block text-white">
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
        <label htmlFor="content" className="typo-semibold-14 block text-white">
          문의 내용
        </label>
        <RichTextImageEditor
          uploadFn={uploadFn}
          placeholder="문의하실 내용을 자세히 작성해주세요."
          onUploadingChange={setIsUploading}
        />
      </div>

      {state.error ? (
        <p role="alert" className="typo-medium-14 text-red-300">
          {state.error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
          <Link href="/my-page/inquiries">취소</Link>
        </Button>
        <Button type="submit" disabled={isPending || isUploading} className="bg-white text-[#1d2429] hover:bg-gray-200">
          {isUploading ? "이미지 업로드 중..." : isPending ? "등록 중..." : "문의 등록"}
        </Button>
      </div>
    </form>
  );
}
