"use client";

import { useActionState } from "react";
import { createPostAction } from "../../../actions";
import PostForm from "./PostForm";

interface PostCreateContentProps {
  token: string;
}

export default function PostCreateContent({ token }: PostCreateContentProps) {
  const [state, formAction] = useActionState(createPostAction, null);

  return <PostForm action={formAction} state={state} token={token} submitLabel="등록하기" />;
}