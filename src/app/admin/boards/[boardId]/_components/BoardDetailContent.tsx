"use client";

import type { AdminBoardPostTypeResponse, AdminBoardResponse, AdminAnnouncementSummaryResponse } from "@/apis/generated/api";
import AdminHeader from "@/app/admin/_components/AdminHeader";
import { useSidebar } from "@/app/admin/_components/AdminLayoutClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Edit, Eye, EyeOff, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import type { FormState } from "../../actions";
import {
  activatePostTypeAction,
  createPostTypeFormAction,
  deactivatePostTypeAction,
  deleteAnnouncementAction,
  deleteBoardAction,
  setDefaultPostTypeAction,
  updatePostTypeFormAction,
} from "../../actions";

const POST_TYPE_USAGE_LABELS: Record<string, string> = {
  POST: "게시글",
  ANNOUNCEMENT: "공지",
};

type PostTypeFormData = Partial<
  Pick<AdminBoardPostTypeResponse, "id" | "name" | "code" | "displayOrder" | "active">
> & {
  usage?: string;
  /** 원래 usages 개수. 2개 이상이면 저장 시 usage 하나로 축소된다는 경고를 보여준다. */
  usagesCount?: number;
};

const ROLE_LABELS: Record<string, string> = {
  ROLE_GUEST: "방문자",
  ROLE_USER: "일반회원",
  ROLE_ADMIN: "관리자",
  ROLE_SUPER_ADMIN: "최고관리자",
  ROLE_CONSUMER: "소비자",
  ROLE_WHISKYNAVI_MEMBER: "위스키내비 멤버",
  ROLE_WHISKYTALES_MEMBER: "위스키테일즈 멤버",
  ROLE_BLIND_MEMBER: "블라인드 멤버",
  ROLE_BUSINESS: "사업자",
  ROLE_TRAILNTALE_BUSINESS: "TrailTale 사업자",
  ROLE_COMMUNITY_BUSINESS: "커뮤니티 사업자",
  ROLE_PICK_UP_BUSINESS: "픽업 사업자",
};

interface BoardDetailContentProps {
  board: AdminBoardResponse;
  announcements: AdminAnnouncementSummaryResponse[];
  postTypes: AdminBoardPostTypeResponse[];
}

export default function BoardDetailContent({ board, announcements, postTypes }: BoardDetailContentProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingPostType, setEditingPostType] = useState<PostTypeFormData | null>(null);
  const [showCreatePostTypeForm, setShowCreatePostTypeForm] = useState(false);

  const boundCreatePostTypeAction = createPostTypeFormAction.bind(null, board.id!);
  const [createPostTypeState, createPostTypeFormActionState, createPostTypePending] = useActionState<
    FormState,
    FormData
  >(boundCreatePostTypeAction, { success: false });

  useEffect(() => {
    if (createPostTypeState.success) {
      startTransition(() => {
        setShowCreatePostTypeForm(false);
        toast.success("게시글타입을 등록했습니다.");
      });
    }
  }, [createPostTypeState.success]);

  const handlePostTypeEditSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingPostType?.id || !board.id) return;

      const formData = new FormData(e.currentTarget);
      startTransition(async () => {
        const result = await updatePostTypeFormAction(board.id!, editingPostType.id!, { success: false }, formData);
        if (result.success) {
          setEditingPostType(null);
          toast.success("게시글타입을 수정했습니다.");
          router.refresh();
        } else {
          toast.error(result.error ?? "게시글타입 수정에 실패했습니다.");
        }
      });
    },
    [board.id, editingPostType, router],
  );

  const handleToggleActive = useCallback(
    (postType: AdminBoardPostTypeResponse) => {
      if (!board.id || !postType.id) return;
      const action = postType.active ? deactivatePostTypeAction : activatePostTypeAction;
      startTransition(async () => {
        const result = await action(board.id!, postType.id!);
        if (result.success) {
          toast.success(postType.active ? "비활성화했습니다." : "활성화했습니다.");
          router.refresh();
        } else {
          toast.error(result.error ?? "처리에 실패했습니다.");
        }
      });
    },
    [board.id, router],
  );

  const handleSetDefault = useCallback(
    (postType: AdminBoardPostTypeResponse) => {
      if (!board.id || !postType.id) return;
      startTransition(async () => {
        const result = await setDefaultPostTypeAction(board.id!, postType.id!);
        if (result.success) {
          toast.success("기본 글타입으로 지정했습니다.");
          router.refresh();
        } else {
          toast.error(result.error ?? "기본 글타입 지정에 실패했습니다.");
        }
      });
    },
    [board.id, router],
  );

  const handleDelete = () => {
    if (!board.id) return;
    if (!window.confirm(`"${board.name}" 게시판을 삭제하시겠습니까?\n\n게시글이나 공지가 있으면 삭제할 수 없습니다.`))
      return;

    startTransition(async () => {
      const result = await deleteBoardAction(board.id!);
      if (result.success) {
        toast.success("게시판을 삭제했습니다.");
        router.push("/admin/boards");
      } else {
        toast.error(result.error ?? "게시판 삭제에 실패했습니다.");
      }
    });
  };

  const handleDeleteAnnouncement = (announcementId: number) => {
    if (!board.id) return;
    if (!window.confirm("이 공지를 삭제하시겠습니까?")) return;

    startTransition(async () => {
      const result = await deleteAnnouncementAction(announcementId, board.id!);
      if (result.success) {
        toast.success("공지를 삭제했습니다.");
        router.refresh();
      } else {
        toast.error(result.error ?? "공지 삭제에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <AdminHeader title={board.name ?? "게시판 상세"} onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin/boards")}
            className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700"
          >
            <ArrowLeft size={16} />
            게시판 목록으로
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() => router.push(`/admin/boards/${board.id}/edit`)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              <Edit size={16} />
              수정
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={handleDelete}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* ── 게시판 정보 ── */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 lg:col-span-1">
            <h2 className="mb-6 text-lg font-semibold text-gray-900">기본 정보</h2>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">ID</dt>
                <dd className="text-sm font-medium text-gray-900">{board.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">게시판명</dt>
                <dd className="text-sm font-medium text-gray-900">{board.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">슬러그</dt>
                <dd className="font-mono text-sm text-gray-900">{board.slug}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">설명</dt>
                <dd className="text-sm text-gray-900">{board.description ?? "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-500">생성일</dt>
                <dd className="text-sm text-gray-900">
                  {board.createdAt ? new Date(board.createdAt).toLocaleString("ko-KR") : "-"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <h3 className="mb-4 text-sm font-semibold text-gray-900">권한 설정</h3>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">활성</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        board.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {board.active ? "활성" : "비활성"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">숨김</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        board.hidden ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {board.hidden ? "숨김" : "노출"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">읽기전용</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        board.readOnly ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {board.readOnly ? "예" : "아니오"}
                    </span>
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">읽기 권한</dt>
                  <dd className="text-xs font-medium text-gray-900">
                    {board.readRole ? (ROLE_LABELS[board.readRole] ?? board.readRole) : "-"}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-xs text-gray-500">쓰기 권한</dt>
                  <dd className="text-xs font-medium text-gray-900">
                    {board.writeRole ? (ROLE_LABELS[board.writeRole] ?? board.writeRole) : "-"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* ── 공지 목록 ── */}
          <div className="rounded-lg border border-gray-200 bg-white lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                공지사항
                <span className="ml-2 text-sm font-normal text-gray-400">({announcements.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => router.push(`/admin/boards/${board.id}/announcements/new`)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
              >
                <Plus size={14} />
                공지 등록
              </button>
            </div>

            {announcements.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">등록된 공지사항이 없습니다.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {announcements.map((ann) => {
                  const scopeLabel = ann.scope === "GLOBAL" ? "전체" : "게시판";
                  return (
                    <li key={ann.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                            {scopeLabel}
                          </span>
                          {ann.scope === "BOARD" && ann.postType?.name && (
                            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                              {ann.postType.name}
                            </span>
                          )}
                          {ann.pinned && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                              고정
                            </span>
                          )}
                          <span className="truncate text-sm font-medium text-gray-900">{ann.title}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                          <span>우선순위: {ann.priority ?? 0}</span>
                          {ann.publishedAt && <span>예약: {new Date(ann.publishedAt).toLocaleString("ko-KR")}</span>}
                          {ann.expiredAt && <span>만료: {new Date(ann.expiredAt).toLocaleString("ko-KR")}</span>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            ann.visible ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {ann.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                          {ann.visible ? "노출" : "숨김"}
                        </span>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => router.push(`/admin/boards/${board.id}/announcements/${ann.id}/edit`)}
                          className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => ann.id && handleDeleteAnnouncement(ann.id)}
                          className="cursor-pointer rounded border border-red-200 px-2 py-1 text-[10px] text-red-500 transition-colors hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        {/* ── 게시글타입 관리 ── */}
        <div className="mt-6 rounded-lg border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                게시판 탭<span className="ml-2 text-sm font-normal text-gray-400">({postTypes.length})</span>
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                등록한 타입이 사용자 화면의 탭으로 나타납니다. 게시글 탭과 공지 탭이 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreatePostTypeForm(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <Plus size={14} />
              글타입 등록
            </button>
          </div>

          {postTypes.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-400">
              등록된 게시글타입이 없습니다.
              <br />
              탭을 만들려면 글타입을 등록해주세요.
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {postTypes.map((postType) => (
                <li key={postType.id} className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-gray-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {(postType.usages ?? []).map((usage) => (
                        <span
                          key={usage}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500"
                        >
                          {POST_TYPE_USAGE_LABELS[usage] ?? usage}
                        </span>
                      ))}
                      {postType.default && (
                        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                          기본
                        </span>
                      )}
                      <span className="truncate text-sm font-medium text-gray-900">{postType.name}</span>
                      <span className="font-mono text-xs text-gray-400">{postType.code}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      <span>노출순서: {postType.displayOrder ?? 0}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        postType.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {postType.active ? <Eye size={10} /> : <EyeOff size={10} />}
                      {postType.active ? "활성" : "비활성"}
                    </span>
                    {!postType.default && (
                      <button
                        type="button"
                        disabled={isPending || !postType.active}
                        onClick={() => handleSetDefault(postType)}
                        title={postType.active ? "기본 글타입으로 지정" : "비활성 글타입은 기본으로 지정할 수 없습니다"}
                        className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                      >
                        <Star size={12} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending || postType.default}
                      onClick={() => handleToggleActive(postType)}
                      className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      {postType.active ? "비활성화" : "활성화"}
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        setEditingPostType({
                          id: postType.id,
                          name: postType.name,
                          code: postType.code,
                          displayOrder: postType.displayOrder,
                          active: postType.active,
                          usage: postType.usages?.[0],
                          usagesCount: postType.usages?.length,
                        })
                      }
                      className="cursor-pointer rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
                    >
                      <Edit size={12} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── 게시글타입 등록 모달 ── */}
        {showCreatePostTypeForm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowCreatePostTypeForm(false)}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">새 탭 등록</h3>
              <p className="mb-4 text-xs text-gray-500">
                게시글타입은 게시판 안의 탭이 됩니다. 사용자는 탭으로 글을 종류별로 볼 수 있어요.
              </p>

              {createPostTypeState.error && (
                <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {createPostTypeState.error}
                </div>
              )}

              <form action={createPostTypeFormActionState} className="space-y-4">
                <div>
                  <Label htmlFor="create-pt-name" className="typo-bold-12 mb-1 block text-gray-700">
                    탭 이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-pt-name"
                    name="name"
                    type="text"
                    maxLength={50}
                    required
                    placeholder="예: 제품공지"
                  />
                  <p className="mt-1 text-xs text-gray-400">사용자에게 탭 라벨로 보이는 이름입니다.</p>
                </div>

                <div>
                  <Label htmlFor="create-pt-code" className="typo-bold-12 mb-1 block text-gray-700">
                    식별코드 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="create-pt-code"
                    name="code"
                    type="text"
                    maxLength={50}
                    required
                    placeholder="예: product-notice"
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    시스템 식별자. 영문 소문자/숫자/하이픈. 사용자에게는 안 보입니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="create-pt-usage" className="typo-bold-12 mb-1 block text-gray-700">
                    종류
                  </Label>
                  <input type="hidden" name="usage" id="create-pt-usage-hidden" defaultValue="POST" />
                  <Select
                    defaultValue="POST"
                    onValueChange={(value) => {
                      const hidden = document.getElementById("create-pt-usage-hidden") as HTMLInputElement | null;
                      if (hidden) hidden.value = value;
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">게시글 탭 (사용자가 글을 씀)</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">공지 탭 (관리자 공지 표시)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-gray-400">
                    게시글 탭은 사용자가 직접 글을 쓰는 공간, 공지 탭은 관리자가 등록한 공지만 표시하는 공간입니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="create-pt-order" className="typo-bold-12 mb-1 block text-gray-700">
                    노출순서
                  </Label>
                  <Input id="create-pt-order" name="displayOrder" type="number" min={0} defaultValue={0} />
                  <p className="mt-1 text-xs text-gray-400">
                    숫자가 작을수록 탭이 왼쪽에 나타납니다. 같으면 등록 순서를 따릅니다.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox name="active" value="true" defaultChecked />
                  <span className="text-sm text-gray-700">활성 (체크 해제 시 탭에서 숨김)</span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreatePostTypeForm(false)}
                    className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={createPostTypePending}
                    className="cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                  >
                    {createPostTypePending ? "등록 중..." : "등록"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 게시글타입 수정 모달 ── */}
        {editingPostType && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setEditingPostType(null)}
          >
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 text-lg font-semibold text-gray-900">게시글타입 수정</h3>
              <p className="mb-4 text-xs text-gray-500">
                게시글타입은 게시판 안의 탭이 됩니다. 사용자는 탭으로 글을 종류별로 볼 수 있어요.
              </p>
              {(editingPostType.usagesCount ?? 0) > 1 && (
                <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  이 글타입은 게시글/공지 둘 다에 쓰이고 있습니다. 저장하면 아래 선택한 종류 하나로 축소됩니다.
                </div>
              )}
              <form onSubmit={handlePostTypeEditSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-pt-name" className="typo-bold-12 mb-1 block text-gray-700">
                    탭 이름 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-pt-name"
                    name="name"
                    type="text"
                    maxLength={50}
                    required
                    defaultValue={editingPostType.name ?? ""}
                  />
                  <p className="mt-1 text-xs text-gray-400">사용자에게 탭 라벨로 보이는 이름입니다.</p>
                </div>

                <div>
                  <Label htmlFor="edit-pt-code" className="typo-bold-12 mb-1 block text-gray-700">
                    코드 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-pt-code"
                    name="code"
                    type="text"
                    maxLength={50}
                    required
                    defaultValue={editingPostType.code ?? ""}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    시스템 식별자. 영문 소문자/숫자/하이픈. 사용자에게는 안 보입니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-pt-usage" className="typo-bold-12 mb-1 block text-gray-700">
                    종류
                  </Label>
                  <input
                    type="hidden"
                    name="usage"
                    id="edit-pt-usage-hidden"
                    defaultValue={editingPostType.usage ?? "POST"}
                  />
                  <Select
                    defaultValue={editingPostType.usage ?? "POST"}
                    onValueChange={(value) => {
                      const hidden = document.getElementById("edit-pt-usage-hidden") as HTMLInputElement | null;
                      if (hidden) hidden.value = value;
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POST">게시글 탭 (사용자가 글을 씀)</SelectItem>
                      <SelectItem value="ANNOUNCEMENT">공지 탭 (관리자 공지 표시)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-gray-400">
                    게시글 탭은 사용자가 직접 글을 쓰는 공간, 공지 탭은 관리자가 등록한 공지만 표시하는 공간입니다.
                  </p>
                </div>

                <div>
                  <Label htmlFor="edit-pt-order" className="typo-bold-12 mb-1 block text-gray-700">
                    노출순서
                  </Label>
                  <Input
                    id="edit-pt-order"
                    name="displayOrder"
                    type="number"
                    min={0}
                    defaultValue={editingPostType.displayOrder ?? 0}
                  />
                  <p className="mt-1 text-xs text-gray-400">
                    숫자가 작을수록 탭이 왼쪽에 나타납니다. 같으면 등록 순서를 따릅니다.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-2">
                  <Checkbox name="active" value="true" defaultChecked={editingPostType.active ?? true} />
                  <span className="text-sm text-gray-700">활성 (체크 해제 시 탭에서 숨김)</span>
                </label>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingPostType(null)}
                    className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="cursor-pointer rounded-lg bg-amber-600 px-4 py-2 text-sm text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isPending ? "수정 중..." : "수정"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
