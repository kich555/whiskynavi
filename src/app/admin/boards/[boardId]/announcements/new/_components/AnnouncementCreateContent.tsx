"use client";

import type { AdminBoardPostTypeResponse } from "@/apis/generated/api";
import PostForm from "@/app/(main)/board/_components/PostForm";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import AnnouncementFormFields from "../../../../_components/AnnouncementFormFields";
import type { FormState } from "../../../../actions";
import { createAnnouncementFormAction } from "../../../../actions";

interface AnnouncementCreateContentProps {
  boardId: number;
  boardName: string;
  postTypes: AdminBoardPostTypeResponse[];
}

export default function AnnouncementCreateContent({
  boardId,
  boardName,
  postTypes,
}: AnnouncementCreateContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const boundAction = createAnnouncementFormAction.bind(null, boardId);
  const [state, formAction] = useActionState<FormState, FormData>(boundAction, { success: false });

  // usage=ANNOUNCEMENT인 활성 postType만 공지 탭 옵션으로 노출.
  const announcementPostTypeOptions = postTypes.filter(
    (pt) => pt.active && pt.code && pt.name && (pt.usages ?? []).includes("ANNOUNCEMENT"),
  );

  useEffect(() => {
    if (state.success) {
      toast.success("공지를 등록했습니다.");
      router.push(`/admin/boards/${boardId}`);
    }
  }, [state.success, router, boardId]);

  return (
    <>
      <AdminHeader title={`공지 등록 — ${boardName}`} onToggleSidebar={toggle} showSearch={false} />
      <PostForm
        action={formAction}
        state={state}
        submitLabel="등록"
        backHref={`/admin/boards/${boardId}`}
        variant="admin"
        formTitle="새 공지 등록"
      >
        <AnnouncementFormFields postTypeOptions={announcementPostTypeOptions} />
      </PostForm>
    </>
  );
}
