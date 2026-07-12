"use client";

import type { AdminAnnouncementResponse, AdminBoardPostTypeResponse } from "@/apis/generated/api";
import PostForm from "@/app/(main)/board/_components/PostForm";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import AnnouncementFormFields from "../../../../../_components/AnnouncementFormFields";
import type { FormState } from "../../../../../actions";
import { updateAnnouncementFormAction } from "../../../../../actions";

interface AnnouncementEditContentProps {
  boardId: number;
  boardName: string;
  postTypes: AdminBoardPostTypeResponse[];
  announcement: AdminAnnouncementResponse;
}

export default function AnnouncementEditContent({
  boardId,
  boardName,
  postTypes,
  announcement,
}: AnnouncementEditContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();

  const boundAction = updateAnnouncementFormAction.bind(null, announcement.id!, boardId);
  const [state, formAction] = useActionState<FormState, FormData>(boundAction, { success: false });

  // usage=ANNOUNCEMENT인 활성 postType만 공지 탭 옵션으로 노출.
  const announcementPostTypeOptions = postTypes.filter(
    (pt) => pt.active && pt.code && pt.name && (pt.usages ?? []).includes("ANNOUNCEMENT"),
  );

  useEffect(() => {
    if (state.success) {
      toast.success("공지를 수정했습니다.");
      router.push(`/admin/boards/${boardId}`);
    }
  }, [state.success, router, boardId]);

  return (
    <>
      <AdminHeader title={`공지 수정 — ${boardName}`} onToggleSidebar={toggle} showSearch={false} />
      <PostForm
        action={formAction}
        state={state}
        submitLabel="수정"
        backHref={`/admin/boards/${boardId}`}
        variant="admin"
        formTitle="공지 수정"
        defaultValues={{ title: announcement.title, content: announcement.content }}
      >
        <AnnouncementFormFields
          postTypeOptions={announcementPostTypeOptions}
          defaultValues={{
            scope: announcement.scope,
            postTypeCode: announcement.postType?.code,
            visible: announcement.visible,
            pinned: announcement.pinned,
            priority: announcement.priority,
            publishedAt: announcement.publishedAt,
            expiredAt: announcement.expiredAt,
          }}
        />
      </PostForm>
    </>
  );
}
