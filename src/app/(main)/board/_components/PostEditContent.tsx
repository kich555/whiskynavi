"use client";

import type { PostResponse } from "@/apis/generated/api";
import { useActionState } from "react";
import PostForm from "./PostForm";
import type { FormState } from "../_lib/actions";
import { updatePostAction } from "../_lib/actions";

interface PostEditContentProps {
  post: PostResponse;
  boardId: string;
}

export default function PostEditContent({ post, boardId }: PostEditContentProps) {
  const boundAction = async (_prev: FormState | null, formData: FormData): Promise<FormState> => {
    return updatePostAction(boardId, post.id!, _prev, formData);
  };

  const [state, formAction] = useActionState(boundAction, null);

  return (
    <PostForm
      action={formAction}
      state={state}
      defaultValues={{ title: post.title, content: post.content }}
      submitLabel="수정하기"
      backHref={`/board/${boardId}/posts/${post.id}`}
    />
  );
}
