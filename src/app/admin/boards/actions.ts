"use server";

import { getUserErrorMessage } from "@/apis/errors";
import type {
  BoardPostTypeRequest,
  BoardPostTypeRequestUsage,
  PostApiAdminBoardsAnnouncementsBody,
  PostApiAdminBoardsAnnouncementsBodyScope,
  PostApiAdminBoardsBody,
  PostApiAdminBoardsBodyReadRole,
  PostApiAdminBoardsBodyWriteRole,
  PutApiAdminBoardsAnnouncementsAnnouncementidBody,
  PutApiAdminBoardsAnnouncementsAnnouncementidBodyScope,
  PutApiAdminBoardsBoardidBody,
  PutApiAdminBoardsBoardidBodyReadRole,
  PutApiAdminBoardsBoardidBodyWriteRole,
} from "@/apis/generated/api";
import {
  deleteApiAdminBoardsAnnouncementsAnnouncementid,
  deleteApiAdminBoardsBoardid,
  getApiAdminBoardsAnnouncementsAnnouncementid,
  getApiAdminBoardsBoardidPostTypes,
  postApiAdminBoards,
  postApiAdminBoardsAnnouncements,
  postApiAdminBoardsBoardidPostsPostidDelete,
  postApiAdminBoardsBoardidPostTypes,
  postApiAdminBoardsBoardidPostTypesPosttypeidActivate,
  postApiAdminBoardsBoardidPostTypesPosttypeidDeactivate,
  postApiAdminBoardsBoardidPostTypesPosttypeidDefault,
  putApiAdminBoardsAnnouncementsAnnouncementid,
  putApiAdminBoardsBoardid,
  putApiAdminBoardsBoardidPostTypesPosttypeid,
} from "@/apis/generated/api";
import { withToken } from "@/apis/mutator";
import { getAuthToken } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod/v4";

export type FormState = { success: boolean; error?: string };

// ── Announcement actions ──────────────────────────────────────────

const announcementScopeOptions = ["GLOBAL", "BOARD"] as const;

const announcementFormSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다."),
  content: z.string().min(1, "내용은 필수입니다."),
  scope: z
    .enum(announcementScopeOptions, "공지 범위는 전체(전체 공지) 또는 게시판(게시판 공지) 중 하나여야 합니다.")
    .default("BOARD")
    .catch("BOARD"),
  // 게시판 공지에서 어느 공지 탭(postType)에 노출할지 결정. GLOBAL 공지에는 지정 불가.
  postTypeCode: z
    .string()
    .transform((v) => v.trim() || undefined)
    .optional(),
  visible: z
    .enum(["true", "false"], "노출 여부 값이 올바르지 않습니다.")
    .default("true")
    .catch("false")
    .transform((v) => v === "true"),
  pinned: z
    .enum(["true", "false"], "상단 고정 값이 올바르지 않습니다.")
    .default("false")
    .catch("false")
    .transform((v) => v === "true"),
  priority: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    })
    .optional(),
  publishedAt: z
    .string()
    .transform((v) => v.trim() || undefined)
    .optional(),
  expiredAt: z
    .string()
    .transform((v) => v.trim() || undefined)
    .optional(),
});

const ROLE_OPTIONS = [
  "ROLE_GUEST",
  "ROLE_USER",
  "ROLE_ADMIN",
  "ROLE_SUPER_ADMIN",
  "ROLE_CONSUMER",
  "ROLE_WHISKYNAVI_MEMBER",
  "ROLE_WHISKYTALES_MEMBER",
  "ROLE_BLIND_MEMBER",
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
] as const;

const boardFormSchema = z.object({
  name: z.string().min(1, "게시판명은 필수입니다."),
  slug: z
    .string()
    .min(1, "슬러그는 필수입니다.")
    .regex(/^[a-z0-9-]+$/, "슬러그는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."),
  description: z
    .string()
    .transform((v) => v.trim() || undefined)
    .optional(),
  active: z
    .enum(["true", "false"])
    .default("true")
    .catch("false")
    .transform((v) => v === "true"),
  hidden: z
    .enum(["true", "false"])
    .default("false")
    .catch("false")
    .transform((v) => v === "true"),
  readOnly: z
    .enum(["true", "false"])
    .default("false")
    .catch("false")
    .transform((v) => v === "true"),
  readRole: z.enum(ROLE_OPTIONS).default("ROLE_GUEST").catch("ROLE_GUEST"),
  writeRole: z.enum(ROLE_OPTIONS).default("ROLE_USER").catch("ROLE_USER"),
});

async function getAdminOptions() {
  const token = await getAuthToken();
  return token ? (withToken(token) ?? undefined) : undefined;
}

function extractBoardFormData(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(boardFormSchema.shape)) {
    raw[key] = (formData.get(key) as string) ?? "";
  }
  return raw;
}

export async function createBoardFormAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const raw = extractBoardFormData(formData);
  const parsed = boardFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { active, hidden, readOnly, readRole, writeRole, ...rest } = parsed.data;

  try {
    await postApiAdminBoards(
      {
        ...rest,
        active,
        hidden,
        readOnly,
        readRole: readRole as PostApiAdminBoardsBodyReadRole,
        writeRole: writeRole as PostApiAdminBoardsBodyWriteRole,
      } satisfies PostApiAdminBoardsBody,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시판 생성에 실패했습니다."),
    };
  }

  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

export async function updateBoardFormAction(boardId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const raw = extractBoardFormData(formData);
  const parsed = boardFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { active, hidden, readOnly, readRole, writeRole, ...rest } = parsed.data;

  try {
    await putApiAdminBoardsBoardid(
      boardId,
      {
        ...rest,
        active,
        hidden,
        readOnly,
        readRole: readRole as PutApiAdminBoardsBoardidBodyReadRole,
        writeRole: writeRole as PutApiAdminBoardsBoardidBodyWriteRole,
      } satisfies PutApiAdminBoardsBoardidBody,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시판 수정에 실패했습니다."),
    };
  }

  revalidatePath("/admin/boards");
  redirect("/admin/boards");
}

export async function deleteBoardAction(boardId: number): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await deleteApiAdminBoardsBoardid(boardId, options);
    revalidatePath("/admin/boards");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시판 삭제에 실패했습니다."),
    };
  }
}

export async function deleteBoardPostAction(boardId: number, postId: number, deleteReason: string): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBoardsBoardidPostsPostidDelete(
      boardId,
      postId,
      { deleteReason: deleteReason || undefined },
      options,
    );
    revalidatePath("/admin/boards");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글 삭제에 실패했습니다."),
    };
  }
}

// ── Announcement Server Actions ───────────────────────────────────

function extractAnnouncementFormData(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(announcementFormSchema.shape)) {
    raw[key] = (formData.get(key) as string) ?? "";
  }
  return raw;
}

export async function createAnnouncementFormAction(
  boardId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const raw = extractAnnouncementFormData(formData);
  const parsed = announcementFormSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldLabel: Record<string, string> = {
      title: "제목",
      content: "내용",
      scope: "범위",
      postTypeCode: "공지 탭",
      visible: "노출 여부",
      pinned: "상단 고정",
      priority: "우선순위",
      publishedAt: "예약 게시",
      expiredAt: "만료",
    };
    const issue = parsed.error.issues[0];
    const label = issue?.path?.length ? (fieldLabel[String(issue.path[0])] ?? issue.path[0]) : "";
    const message = `"${label}" 항목: ${issue?.message ?? "올바르지 않은 값입니다."}`;
    return { success: false, error: message };
  }

  const { scope, postTypeCode, visible, pinned, priority, publishedAt, expiredAt, title, content } = parsed.data;

  try {
    await postApiAdminBoardsAnnouncements(
      {
        title,
        content,
        scope: scope as PostApiAdminBoardsAnnouncementsBodyScope,
        boardId: scope === "BOARD" ? boardId : undefined,
        // GLOBAL 공지에는 postTypeCode를 지정할 수 없다.
        postTypeCode: scope === "BOARD" ? postTypeCode : undefined,
        visible,
        pinned,
        priority,
        publishedAt,
        expiredAt,
      } satisfies PostApiAdminBoardsAnnouncementsBody,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "공지 등록에 실패했습니다."),
    };
  }

  revalidatePath(`/admin/boards/${boardId}`);
  return { success: true };
}

export async function updateAnnouncementFormAction(
  announcementId: number,
  boardId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 체크박스 필드는 FormData에서 직접 확인 (체크되지 않으면 필드 자체가 없음)
  const visible = formData.has("visible") && formData.get("visible") === "true";
  const pinned = formData.has("pinned") && formData.get("pinned") === "true";

  const raw = extractAnnouncementFormData(formData);
  // visible/pinned를 제외한 필드만 검증
  const updateSchema = z.object({
    title: z.string().min(1, "제목은 필수입니다."),
    content: z.string().min(1, "내용은 필수입니다."),
    scope: z.enum(announcementScopeOptions, "공지 범위가 올바르지 않습니다.").catch("BOARD"),
    postTypeCode: z
      .string()
      .transform((v) => v.trim() || undefined)
      .optional(),
    priority: z
      .string()
      .transform((v) => {
        const n = Number(v);
        return Number.isNaN(n) ? undefined : n;
      })
      .optional(),
    publishedAt: z
      .string()
      .transform((v) => v.trim() || undefined)
      .optional(),
    expiredAt: z
      .string()
      .transform((v) => v.trim() || undefined)
      .optional(),
  });
  const parsed = updateSchema.safeParse(raw);

  if (!parsed.success) {
    const fieldLabel: Record<string, string> = {
      title: "제목",
      content: "내용",
      scope: "범위",
      postTypeCode: "공지 탭",
      priority: "우선순위",
      publishedAt: "예약 게시",
      expiredAt: "만료",
    };
    const issue = parsed.error.issues[0];
    const label = issue?.path?.length ? (fieldLabel[String(issue.path[0])] ?? issue.path[0]) : "";
    const message = `"${label}" 항목: ${issue?.message ?? "올바르지 않은 값입니다."}`;
    return { success: false, error: message };
  }

  const { scope, postTypeCode, priority, publishedAt, expiredAt, title, content } = parsed.data;

  try {
    await putApiAdminBoardsAnnouncementsAnnouncementid(
      announcementId,
      {
        title,
        content,
        scope: scope as PutApiAdminBoardsAnnouncementsAnnouncementidBodyScope,
        boardId: scope === "BOARD" ? boardId : undefined,
        // GLOBAL 공지에는 postTypeCode를 지정할 수 없다.
        postTypeCode: scope === "BOARD" ? postTypeCode : undefined,
        visible,
        pinned,
        priority,
        publishedAt: publishedAt ?? undefined,
        expiredAt: expiredAt ?? undefined,
      } satisfies PutApiAdminBoardsAnnouncementsAnnouncementidBody,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "공지 수정에 실패했습니다."),
    };
  }

  revalidatePath(`/admin/boards/${boardId}`);
  return { success: true };
}

export async function deleteAnnouncementAction(announcementId: number, boardId: number): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await deleteApiAdminBoardsAnnouncementsAnnouncementid(announcementId, options);
    revalidatePath(`/admin/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "공지 삭제에 실패했습니다."),
    };
  }
}

/** 공지 상세 정보를 서버에서 조회하여 반환합니다. 클라이언트에서 인증 토큰을 직접 사용할 수 없으므로 서버 액션을 통해 조회합니다. */
export async function getAnnouncementDetailAction(announcementId: number) {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false as const, error: "인증이 필요합니다." };
  }

  try {
    const res = await getApiAdminBoardsAnnouncementsAnnouncementid(announcementId, options);
    return { success: true as const, data: res.data };
  } catch (error) {
    return {
      success: false as const,
      error: getUserErrorMessage(error, "공지 상세 조회에 실패했습니다."),
    };
  }
}

// ── PostType Server Actions ───────────────────────────────────────

const postTypeUsageOptions = ["POST", "ANNOUNCEMENT"] as const;

const postTypeFormSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다.").max(50, "이름은 50자 이하여야 합니다."),
  code: z
    .string()
    .min(1, "코드는 필수입니다.")
    .max(50, "코드는 50자 이하여야 합니다.")
    .regex(/^[a-z0-9-]+$/, "코드는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."),
  usage: z.enum(postTypeUsageOptions, "사용처는 게시글 또는 공지 중 하나여야 합니다.").default("POST"),
  displayOrder: z
    .string()
    .transform((v) => {
      const n = Number(v);
      return Number.isNaN(n) ? undefined : n;
    })
    .optional(),
});

function extractPostTypeFormData(formData: FormData): Record<string, string> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(postTypeFormSchema.shape)) {
    raw[key] = (formData.get(key) as string) ?? "";
  }
  return raw;
}

async function findDuplicateCodePostType(
  boardId: number,
  code: string,
  excludePostTypeId: number | undefined,
  options: RequestInit,
) {
  const res = await getApiAdminBoardsBoardidPostTypes(boardId, options);
  return (res.data ?? []).find((pt) => pt.code === code && pt.id !== excludePostTypeId);
}

export async function createPostTypeFormAction(
  boardId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const raw = extractPostTypeFormData(formData);
  const parsed = postTypeFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { name, code, usage, displayOrder } = parsed.data;
  const active = formData.has("active") && formData.get("active") === "true";

  if (await findDuplicateCodePostType(boardId, code, undefined, options)) {
    return { success: false, error: "이미 사용 중인 코드입니다." };
  }

  try {
    await postApiAdminBoardsBoardidPostTypes(
      boardId,
      {
        name,
        code,
        usage: usage as BoardPostTypeRequestUsage,
        displayOrder,
        active,
      } satisfies BoardPostTypeRequest,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글타입 생성에 실패했습니다."),
    };
  }

  revalidatePath(`/admin/boards/${boardId}`);
  return { success: true };
}

export async function updatePostTypeFormAction(
  boardId: number,
  postTypeId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const raw = extractPostTypeFormData(formData);
  const parsed = postTypeFormSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다." };
  }

  const { name, code, usage, displayOrder } = parsed.data;
  const active = formData.has("active") && formData.get("active") === "true";

  if (await findDuplicateCodePostType(boardId, code, postTypeId, options)) {
    return { success: false, error: "이미 사용 중인 코드입니다." };
  }

  try {
    await putApiAdminBoardsBoardidPostTypesPosttypeid(
      boardId,
      postTypeId,
      {
        name,
        code,
        usage: usage as BoardPostTypeRequestUsage,
        displayOrder,
        active,
      } satisfies BoardPostTypeRequest,
      options,
    );
  } catch (error) {
    return {
      success: false,
      error: getUserErrorMessage(error, "게시글타입 수정에 실패했습니다."),
    };
  }

  revalidatePath(`/admin/boards/${boardId}`);
  return { success: true };
}

export async function activatePostTypeAction(boardId: number, postTypeId: number): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBoardsBoardidPostTypesPosttypeidActivate(boardId, postTypeId, options);
    revalidatePath(`/admin/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "게시글타입 활성화에 실패했습니다.") };
  }
}

export async function deactivatePostTypeAction(boardId: number, postTypeId: number): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBoardsBoardidPostTypesPosttypeidDeactivate(boardId, postTypeId, options);
    revalidatePath(`/admin/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "게시글타입 비활성화에 실패했습니다.") };
  }
}

export async function setDefaultPostTypeAction(boardId: number, postTypeId: number): Promise<FormState> {
  const options = await getAdminOptions();
  if (!options) {
    return { success: false, error: "인증이 필요합니다." };
  }

  try {
    await postApiAdminBoardsBoardidPostTypesPosttypeidDefault(boardId, postTypeId, options);
    revalidatePath(`/admin/boards/${boardId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: getUserErrorMessage(error, "기본 글타입 지정에 실패했습니다.") };
  }
}
