"use client";

import type { PostResponse, PostTypeResponse } from "@/apis/generated/api";
import { useActionState } from "react";
import type { FormState } from "../_lib/actions";
import { updatePostAction } from "../_lib/actions";
import PostForm from "./PostForm";

interface PostEditContentProps {
  post: PostResponse;
  boardId: string;
  postTypes: PostTypeResponse[];
}

export default function PostEditContent({ post, boardId, postTypes }: PostEditContentProps) {
  const boundAction = async (_prev: FormState | null, formData: FormData): Promise<FormState> => {
    return updatePostAction(boardId, post.id!, _prev, formData);
  };

  const [state, formAction] = useActionState(boundAction, null);

  return (
    <PostForm
      action={formAction}
      state={state}
      defaultValues={{ title: post.title, content: post.content, postTypeCode: post.postType?.code }}
      postTypes={postTypes}
      submitLabel="수정하기"
      backHref={`/board/${boardId}/posts/${post.id}`}
    />
  );
}
