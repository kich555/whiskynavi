"use client";

import type { PostTypeResponse } from "@/apis/generated/api";
import { useActionState } from "react";
import { createPostAction } from "../_lib/actions";
import PostForm from "./PostForm";

interface PostCreateContentProps {
  boardId: string;
  postTypes: PostTypeResponse[];
}

export default function PostCreateContent({ boardId, postTypes }: PostCreateContentProps) {
  const boundAction = async (_prev: Awaited<ReturnType<typeof createPostAction>> | null, formData: FormData) =>
    createPostAction(boardId, _prev, formData);
  const [state, formAction] = useActionState(boundAction, null);

  return (
    <PostForm
      action={formAction}
      state={state}
      postTypes={postTypes}
      submitLabel="등록하기"
      backHref={`/board/${boardId}`}
    />
  );
}
