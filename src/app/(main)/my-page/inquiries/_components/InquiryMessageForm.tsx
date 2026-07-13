"use client";

import RichTextImageEditor from "@/components/editor/RichTextImageEditor";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { addInquiryMessageAction } from "../actions";

export default function InquiryMessageForm({ inquiryId }: { inquiryId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const action = addInquiryMessageAction.bind(null, inquiryId);
  const [state, formAction, isPending] = useActionState(action, { success: false });

  useEffect(() => {
    if (!state.success) return;
    formRef.current?.reset();
    router.refresh();
  }, [router, state]);

  return (
    <form ref={formRef} action={formAction} className="border-t border-white/10 pt-6">
      <label htmlFor="content" className="mb-2 block text-sm font-semibold text-white">
        추가 문의
      </label>
      <RichTextImageEditor
        compact
        resetKey={state.submittedAt}
        placeholder="추가로 문의하실 내용을 입력해주세요."
        onUploadingChange={setIsUploading}
      />
      <div className="mt-3 flex items-center justify-between gap-4">
        <div aria-live="polite">
          {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
          {state.success ? <p className="text-sm text-emerald-300">추가 문의를 등록했습니다.</p> : null}
        </div>
        <Button type="submit" disabled={isPending || isUploading} className="bg-white text-[#1d2429] hover:bg-gray-200">
          {isUploading ? "이미지 업로드 중..." : isPending ? "등록 중..." : "메시지 보내기"}
        </Button>
      </div>
    </form>
  );
}
