"use client";

import { useActionState } from "react";
import { createPostAction } from "../../../actions";
import PostForm from "./PostForm";

export default function PostCreateContent() {
  const [state, formAction] = useActionState(createPostAction, null);

  return <PostForm action={formAction} state={state} submitLabel="등록하기" />;
}