"use client";

import { FormMessage } from "@/components/ui/form-message";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { createCommentAction, updateCommentAction, type CommentFormState } from "../_lib/actions";

interface CommentFormProps {
  boardId: string;
  postId: number;
  /** 수정 모드일 때 대상 댓글 ID. undefined면 작성 모드. */
  commentId?: number;
  /** 수정 모드일 때 기존 내용. */
  initialContent?: string;
  /** 대댓글일 때 부모 댓글 ID. 최상위 댓글이면 undefined. */
  parentCommentId?: number;
  /** 작성/수정 완료 또는 취소 시 호출. */
  onCancel?: () => void;
  /** 폼 접기/펴기 토글이 필요할 때 전달하는 placeholder. */
  placeholder?: string;
  /** 인라인 모드 (대댓글/수정) — 더 작은 크기. */
  compact?: boolean;
}

const idleState: CommentFormState = { success: false };

function SubmitButton({ isEdit, compact }: { isEdit: boolean; compact: boolean }) {
  const { pending } = useFormStatus();
  const baseButton = compact ? "px-3 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg bg-amber-600 font-medium text-white transition-colors hover:bg-amber-500 disabled:opacity-50 ${baseButton}`}
    >
      {pending ? "저장 중..." : isEdit ? "수정" : "등록"}
    </button>
  );
}

export default function CommentForm({
  boardId,
  postId,
  commentId,
  initialContent,
  parentCommentId,
  onCancel,
  placeholder = "댓글을 입력하세요.",
  compact = false,
}: CommentFormProps) {
  const isEdit = commentId !== undefined;
  const formRef = useRef<HTMLFormElement>(null);

  // useActionState: 폼 제출 처리
  const actionFn = isEdit
    ? updateCommentAction.bind(null, boardId, postId, commentId!)
    : createCommentAction.bind(null, boardId, postId);
  const [state, formAction] = useActionState(actionFn, idleState);

  // 성공 처리 — useActionState의 state는 서버 액션이 끝난 뒤 갱신되므로
  // onSubmit이 아닌 useEffect로 success를 감지해야 한다.
  //  - 수정 모드: 폼 닫기(onCancel)로 댓글 본문이 다시 보이게 한다.
  //  - 작성 모드: 폼을 비워 다음 댓글을 바로 입력할 수 있게 한다.
  useEffect(() => {
    if (!state.success) return;
    if (isEdit) {
      onCancel?.();
    } else {
      formRef.current?.reset();
    }
  }, [state, onCancel, isEdit]);

  const baseInput = compact ? "min-h-[60px] text-sm" : "min-h-[80px] text-sm";
  const baseButton = compact ? "px-3 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      {parentCommentId !== undefined && <input type="hidden" name="parentCommentId" value={parentCommentId} />}

      <textarea
        name="content"
        defaultValue={initialContent ?? state.values?.content}
        placeholder={placeholder}
        required
        maxLength={1000}
        className={`w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-amber-500/50 ${baseInput}`}
      />

      <div className="flex items-center gap-2">
        <SubmitButton isEdit={isEdit} compact={compact} />
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`rounded-lg border border-white/20 text-gray-400 transition-colors hover:bg-white/5 ${baseButton}`}
          >
            취소
          </button>
        )}
      </div>

      {state.error && <FormMessage message={state.error} variant="error" />}
    </form>
  );
}
