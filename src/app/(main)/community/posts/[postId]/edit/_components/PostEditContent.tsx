"use client";

import { useActionState } from "react";
import PostForm from "../../../new/_components/PostForm";
import { updatePostAction } from "../../../../actions";
import type { FormState } from "../../../../actions";
import type { PostResponse } from "@/apis/generated/api";

interface PostEditContentProps {
  post: PostResponse;
}

export default function PostEditContent({ post }: PostEditContentProps) {
  const boundAction = async (
    _prev: FormState | null,
    formData: FormData,
  ): Promise<FormState> => {
    return updatePostAction(post.id!, _prev, formData);
  };

  const [state, formAction] = useActionState(boundAction, null);

  return (
    <PostForm
      action={formAction}
      state={state}
      defaultValues={{ title: post.title, content: post.content }}
      submitLabel="수정하기"
    />
  );
}