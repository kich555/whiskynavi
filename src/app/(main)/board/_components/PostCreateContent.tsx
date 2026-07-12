"use client";

import { useActionState } from "react";
import { createPostAction } from "../_lib/actions";
import PostForm from "./PostForm";

interface PostCreateContentProps {
  boardId: string;
}

export default function PostCreateContent({ boardId }: PostCreateContentProps) {
  const boundAction = async (_prev: Awaited<ReturnType<typeof createPostAction>> | null, formData: FormData) =>
    createPostAction(boardId, _prev, formData);
  const [state, formAction] = useActionState(boundAction, null);

  return (
    <PostForm action={formAction} state={state} submitLabel="등록하기" backHref={`/board/${boardId}`} />
  );
}
