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
  // Server Action 참조를 그대로 bind해야 redirect 응답을 Next.js가 폼 내비게이션으로 처리한다.
  const boundAction = createPostAction.bind(null, boardId);
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
