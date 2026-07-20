"use client";

import { postApiBoardsUploads } from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import RichTextImageEditor from "@/components/editor/RichTextImageEditor";
import { Button } from "@/components/ui/button";
import { getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { addInquiryMessageAction } from "../actions";

export default function InquiryMessageForm({ inquiryId }: { inquiryId: number }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const action = addInquiryMessageAction.bind(null, inquiryId);
  const [state, formAction, isPending] = useActionState(action, { success: false });

  const uploadFn = useCallback(async (file: File): Promise<string> => {
    const session = await getSession();
    if (!session?.accessToken) throw new Error("로그인이 필요합니다.");
    const response = await postApiBoardsUploads({ file }, withToken(session.accessToken));
    const url = response.data.url;
    if (!url) throw new Error("업로드된 이미지 URL을 확인할 수 없습니다.");
    return url;
  }, []);

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
        uploadFn={uploadFn}
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
