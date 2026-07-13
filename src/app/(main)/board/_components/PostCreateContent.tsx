"use client";

import type { PostTypeResponse } from "@/apis/generated/api";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { createPostAction } from "../_lib/actions";
import PostForm from "./PostForm";

interface PostCreateContentProps {
  boardId: string;
  postTypes: PostTypeResponse[];
}

export default function PostCreateContent({ boardId, postTypes }: PostCreateContentProps) {
  const router = useRouter();
  const boundAction = createPostAction.bind(null, boardId);
  const [state, formAction] = useActionState(boundAction, null);

  useEffect(() => {
    if (state?.success) {
      router.replace(`/board/${boardId}`);
    }
  }, [boardId, router, state?.success]);

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
