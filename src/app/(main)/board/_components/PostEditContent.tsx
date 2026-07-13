"use client";

import type { PostResponse, PostTypeResponse } from "@/apis/generated/api";
import { useActionState } from "react";
import { updatePostAction } from "../_lib/actions";
import PostForm from "./PostForm";

interface PostEditContentProps {
  post: PostResponse;
  boardId: string;
  postTypes: PostTypeResponse[];
}

export default function PostEditContent({ post, boardId, postTypes }: PostEditContentProps) {
  // Server Action 참조를 그대로 bind해야 redirect 응답을 Next.js가 폼 내비게이션으로 처리한다.
  const boundAction = updatePostAction.bind(null, boardId, post.id!);
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
