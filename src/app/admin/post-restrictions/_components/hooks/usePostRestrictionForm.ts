"use client";

import type { AdminUserResponse } from "@/apis/generated/api";
import { useReducer, useTransition } from "react";
import { toast } from "sonner";
import { z } from "zod";

type PostRestrictionRequest = {
  reason: string;
  startAt: string;
  endAt: string;
};

type PostRestrictionFormData = PostRestrictionRequest & {
  userId: number;
  name: string;
};

export type FormState = {
  userId: string;
  name: string;
  reason: string;
  startAt: string | undefined;
  endAt: string | undefined;
};

type FormAction =
  | { type: "SET_USER"; payload: { userId: string; name: string } }
  | { type: "CLEAR_USER" }
  | { type: "SET_REASON"; payload: string }
  | { type: "SET_START_DATE"; payload: string | undefined }
  | { type: "SET_END_DATE"; payload: string | undefined }
  | { type: "RESET"; payload: FormState };

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        userId: action.payload.userId,
        name: action.payload.name,
      };
    case "CLEAR_USER":
      return { ...state, userId: "", name: "" };
    case "SET_REASON":
      return { ...state, reason: action.payload };
    case "SET_START_DATE":
      return { ...state, startAt: action.payload };
    case "SET_END_DATE":
      return { ...state, endAt: action.payload };
    case "RESET":
      return action.payload;
  }
}

function defaultPeriod() {
  const startAt = new Date();
  startAt.setSeconds(0, 0);
  const endAt = new Date(startAt.getTime() + 60 * 60 * 1000);
  return { startAt: startAt.toISOString(), endAt: endAt.toISOString() };
}

function getInitialState(initialData?: PostRestrictionFormData): FormState {
  const defaults = defaultPeriod();
  return {
    userId: initialData?.userId?.toString() ?? "",
    name: initialData?.name ?? "",
    reason: initialData?.reason ?? "",
    startAt: initialData?.startAt || defaults.startAt,
    endAt: initialData?.endAt || defaults.endAt,
  };
}

const postRestrictionFormSchema = z.object({
  userId: z.string().min(1, "사용자를 선택해주세요."),
  reason: z.string().min(1, "사유를 입력해주세요."),
});

type UsePostRestrictionFormOptions = {
  initialData?: PostRestrictionFormData;
  onSubmit: (data: PostRestrictionFormData) => void | Promise<void>;
};

export function usePostRestrictionForm({ initialData, onSubmit }: UsePostRestrictionFormOptions) {
  const [formState, dispatch] = useReducer(formReducer, initialData, getInitialState);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    const result = postRestrictionFormSchema.safeParse({
      userId: formState.userId,
      reason: formState.reason,
    });

    if (!result.success) {
      const firstError = result.error.issues[0];
      toast.error(firstError.message);
      return;
    }

    startTransition(async () => {
      await onSubmit({
        userId: Number(formState.userId),
        name: formState.name,
        reason: formState.reason,
        startAt: formState.startAt ?? "",
        endAt: formState.endAt ?? "",
      });
    });
  };

  return {
    formState,
    dispatch,
    isPending,
    handleSubmit,
  };
}

export type { PostRestrictionFormData, AdminUserResponse };
