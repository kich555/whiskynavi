"use server";
import { ApiError, getUserErrorMessage } from "@/apis/errors";
import { getApiV2AdminBottles } from "@/apis/generated/api";
import * as api from "@/apis/generated/blind-tasting";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { operationFields, type Operation } from "./fields";

async function auth() {
  const s = await getServerSession(authOptions);
  if (!s?.accessToken) throw new ApiError(401, "인증이 만료되었습니다. 다시 로그인해 주세요.");
  if (!s.user.roles?.includes("ROLE_ADMIN")) throw new ApiError(403, "관리자 권한이 필요합니다.");
  return { ...withToken(s.accessToken), cache: "no-store" as const };
}
function failure(error: unknown) {
  if (isRedirectError(error)) throw error;
  return {
    success: false as const,
    error: getUserErrorMessage(error, "처리하지 못했습니다. 다시 시도해 주세요."),
    conflict: error instanceof ApiError && error.status === 409,
  };
}
export async function loadOverview(section: string, keyword = "", page = 0) {
  try {
    const opts = await auth();
    if (!Number.isSafeInteger(page) || page < 0 || keyword.length > 200)
      throw new ApiError(400, "잘못된 검색 조건입니다.");
    switch (section) {
      case "notices":
        return { success: true as const, kind: "notices" as const, data: (await api.btAdminNotices(opts)).data };
      case "bottles":
        return {
          success: true as const,
          kind: "bottles" as const,
          data: (await api.btAdminCatalog({ keyword, page, size: 30 }, opts)).data,
        };
      case "samples": {
        const [samples, bottles] = await Promise.all([
          api.btAdminSamples(opts),
          api.btAdminCatalog({ page: 0, size: 100 }, opts),
        ]);
        return { success: true as const, kind: "samples" as const, data: samples.data, bottles: bottles.data };
      }
      case "restrictions":
        return {
          success: true as const,
          kind: "restrictions" as const,
          data: (await api.btAdminRestrictions(undefined, opts)).data,
        };
      case "incidents":
        return { success: true as const, kind: "incidents" as const, data: (await api.btAdminIncidents(opts)).data };
      default:
        throw new ApiError(400, "알 수 없는 화면입니다.");
    }
  } catch (e) {
    return failure(e);
  }
}
export async function loadNotice(
  id: number,
  tab: string,
  applicationId?: number,
  sampleId?: number,
  keyword = "",
  timing = "",
  hidden = "",
) {
  try {
    const opts = await auth();
    if (!Number.isSafeInteger(id) || id <= 0) throw new ApiError(400, "잘못된 회차입니다.");
    const [notice, samples] = await Promise.all([api.btAdminNotice(id, opts), api.btAdminNoticeSamples(id, opts)]);
    const base = { notice: notice.data, samples: samples.data, serverTime: Date.now() };
    switch (tab) {
      case "settings":
        return {
          success: true as const,
          kind: "settings" as const,
          ...base,
          availableSamples: (await api.btAdminSamples(opts)).data,
        };
      case "applications": {
        const [apps, allocs] = await Promise.all([api.btAdminApplications(id, opts), api.btAdminAllocations(id, opts)]);
        return {
          success: true as const,
          kind: "applications" as const,
          ...base,
          applications: apps.data,
          allocations: allocs.data,
        };
      }
      case "shipping": {
        const [apps, allocs] = await Promise.all([api.btAdminApplications(id, opts), api.btAdminAllocations(id, opts)]);
        const selected = apps.data.find((a) => a.id === applicationId);
        const [shipments, completions] = selected
          ? await Promise.all([api.btAdminShipments(selected.id!, opts), api.btAdminCompletions(selected.id!, opts)])
          : [null, null];
        return {
          success: true as const,
          kind: "shipping" as const,
          ...base,
          applications: apps.data,
          allocations: allocs.data,
          selected,
          shipments: shipments?.data ?? [],
          completions: completions?.data ?? [],
        };
      }
      case "reviews": {
        const selectedSample = sampleId ?? samples.data[0]?.id;
        const [reviews, status, summary] = await Promise.all([
          selectedSample
            ? api.btAdminSampleReviews(
                id,
                selectedSample,
                {
                  keyword: keyword || undefined,
                  timing: timing || undefined,
                  hidden: hidden ? hidden === "true" : undefined,
                },
                opts,
              )
            : Promise.resolve({ data: [] as api.ReviewEntry[] }),
          api.btAdminReviewStatus(id, opts),
          api.btAdminSummary(id, opts),
        ]);
        return {
          success: true as const,
          kind: "reviews" as const,
          ...base,
          reviews: reviews.data,
          reviewStatus: status.data,
          summary: summary.data,
        };
      }
      case "audit":
        return {
          success: true as const,
          kind: "audit" as const,
          ...base,
          audits: (await api.btAdminAudits(id, opts)).data,
        };
      default:
        throw new ApiError(400, "알 수 없는 화면입니다.");
    }
  } catch (e) {
    return failure(e);
  }
}
export async function runOperation(
  operation: Operation,
  id: number | undefined,
  version: number | undefined,
  key: string,
  form: FormData,
) {
  try {
    const opts = await auth();
    if (!Object.hasOwn(operationFields, operation)) throw new ApiError(400, "지원하지 않는 작업입니다.");
    if (id !== undefined && (!Number.isSafeInteger(id) || id <= 0)) throw new ApiError(400, "대상 ID를 확인해 주세요.");
    if (version !== undefined && (!Number.isSafeInteger(version) || version < 0))
      throw new ApiError(400, "버전을 확인해 주세요.");
    if (!/^[a-zA-Z0-9-]{16,100}$/.test(key)) throw new ApiError(400, "요청 키가 올바르지 않습니다.");
    const options = { ...opts, headers: { ...opts.headers, "Idempotency-Key": key } };
    const s = (name: string) => String(form.get(name) ?? "").trim();
    const n = (name: string) => {
      const v = Number(s(name));
      if (!s(name) || !Number.isSafeInteger(v) || v < 0) throw new ApiError(400, "숫자 입력을 확인해 주세요.");
      return v;
    };
    const optional = (name: string) => (s(name) ? n(name) : undefined);
    const b = (name: string) => form.get(name) === "on";
    const list = (name: string) =>
      form.getAll(name).map((v) => {
        const x = Number(v);
        if (!Number.isSafeInteger(x) || x <= 0) throw new ApiError(400, "샘플 선택을 확인해 주세요.");
        return x;
      });
    const date = (name: string) => {
      const d = new Date(s(name) + ":00+09:00");
      if (!Number.isFinite(d.getTime())) throw new ApiError(400, "일시를 확인해 주세요.");
      return d.toISOString();
    };
    for (const field of operationFields[operation]) {
      if (field.required && !form.get(field.name)) throw new ApiError(400, `${field.label}을(를) 입력해 주세요.`);
    }
    const v = () => {
      if (version === undefined) throw new ApiError(400, "최신 정보를 불러온 뒤 다시 시도해 주세요.");
      return version;
    };
    const target = () => {
      if (!id) throw new ApiError(400, "대상을 선택해 주세요.");
      return id;
    };
    const reason = () => ({ expectedVersion: v(), reason: s("reason") });
    const bottle = () => ({
      name: s("name"),
      brand: s("brand"),
      series: s("series"),
      distillery: s("distillery"),
      caskType: s("caskType"),
      caskNumber: s("caskNumber"),
      abv: s("abv") ? Number(s("abv")) : undefined,
      distilledOn: s("distilledOn") || undefined,
      bottledOn: s("bottledOn") || undefined,
    });
    const sample = () => ({
      name: s("name"),
      reviewBottleId: n("reviewBottleId"),
      adminMemo: s("adminMemo"),
      active: b("active"),
    });
    const notice = () => ({
      title: s("title"),
      description: s("description"),
      applyOpenAt: date("applyOpenAt"),
      applyCloseAt: date("applyCloseAt"),
      reviewDeadlineAt: date("reviewDeadlineAt"),
    });
    let result: { data: unknown };
    switch (operation) {
      case "createBottle":
        result = await api.btAdminCreateBottle(bottle(), options);
        break;
      case "editBottle":
        result = await api.btAdminEditBottle(target(), { ...reason(), bottle: bottle() }, options);
        break;
      case "importBottle":
        result = await api.btAdminImportBottle(n("saleBottleId"), options);
        break;
      case "linkBottle":
        result = await api.btAdminLinkBottle(
          n("saleBottleId"),
          { reviewBottleId: n("reviewBottleId"), reason: s("reason") },
          options,
        );
        break;
      case "publishBottle":
        result = await api.btAdminPublishBottle(target(), { expectedVersion: v() }, options);
        break;
      case "uploadImage": {
        const file = form.get("file");
        if (!(file instanceof File) || file.size === 0) throw new ApiError(400, "이미지를 선택해 주세요.");
        result = await api.btAdminBottleImageUpload(target(), { file }, { expectedVersion: v() }, options);
        break;
      }
      case "createSample":
        result = await api.btAdminCreateSample(sample(), options);
        break;
      case "editSample":
        result = await api.btAdminEditSample(target(), { expectedVersion: v(), sample: sample() }, options);
        break;
      case "createNotice":
        result = await api.btAdminCreateNotice(notice(), options);
        break;
      case "editNotice":
        result = await api.btAdminEditNotice(target(), { expectedVersion: v(), notice: notice() }, options);
        break;
      case "publishNotice":
        result = await api.btAdminPublishNotice(target(), { expectedVersion: v() }, options);
        break;
      case "cancelNotice":
        result = await api.btAdminCancelNotice(target(), reason(), options);
        break;
      case "extend":
        result = await api.btAdminExtend(target(), { ...reason(), deadline: date("deadline") }, options);
        break;
      case "addSample":
        result = await api.btAdminAddSample(
          target(),
          { expectedVersion: v(), sampleId: n("sampleId"), offeredQuantity: n("offeredQuantity") },
          options,
        );
        break;
      case "editNoticeSample":
        result = await api.btAdminEditNoticeSample(
          target(),
          n("noticeSampleId"),
          { expectedVersion: v(), offeredQuantity: n("offeredQuantity"), blindCode: s("blindCode") },
          options,
        );
        break;
      case "unlinkSample":
        result = await api.btAdminUnlinkSample(target(), n("noticeSampleId"), reason(), options);
        break;
      case "manual":
        result = await api.btAdminManual(
          target(),
          { ...reason(), applicationId: n("applicationId"), noticeSampleIds: list("noticeSampleIds") },
          options,
        );
        break;
      case "auto":
        result = await api.btAdminAuto(
          target(),
          { expectedVersion: v(), targetTotalPerUser: n("targetTotalPerUser") },
          options,
        );
        break;
      case "confirm":
        result = await api.btAdminConfirm(target(), { expectedVersion: v() }, options);
        break;
      case "revoke":
        result = await api.btAdminRevoke(target(), reason(), options);
        break;
      case "address":
        result = await api.btAdminAddress(
          target(),
          {
            ...reason(),
            address: {
              receiverName: s("receiverName"),
              receiverPhone: s("receiverPhone"),
              postalCode: s("postalCode"),
              address: s("address"),
              addressDetail: s("addressDetail"),
            },
          },
          options,
        );
        break;
      case "prepare":
        result = await api.btAdminPrepare(
          {
            applicationId: n("applicationId"),
            allocationIds: list("allocationIds"),
            previousShipmentId: optional("previousShipmentId"),
          },
          options,
        );
        break;
      case "dispatch":
        result = await api.btAdminDispatch(
          target(),
          { expectedVersion: v(), carrier: s("carrier"), trackingNumber: s("trackingNumber") },
          options,
        );
        break;
      case "delivered":
        result = await api.btAdminDelivered(target(), reason(), options);
        break;
      case "tracking":
        result = await api.btAdminTrackingRefresh(target(), options);
        break;
      case "resolve":
        result = await api.btAdminResolve(target(), { ...reason(), reship: b("reship") }, options);
        break;
      case "complete":
        result = await api.btAdminComplete(
          target(),
          { ...reason(), allocationId: optional("allocationId"), actionType: s("actionType") },
          options,
        );
        break;
      case "correct":
        result = await api.btAdminCorrect(target(), reason(), options);
        break;
      case "restrict":
        result = await api.btAdminRestrict(
          {
            userId: n("userId"),
            applicationId: optional("applicationId"),
            reasonType: s("reasonType"),
            durationDays: n("durationDays"),
            userReason: s("userReason"),
            internalNote: s("internalNote"),
          },
          options,
        );
        break;
      case "restrictionEdit":
        result = await api.btAdminRestrictionEdit(
          target(),
          {
            ...reason(),
            durationDays: n("durationDays"),
            userReason: s("userReason"),
            internalNote: s("internalNote"),
          },
          options,
        );
        break;
      case "revokeRestriction":
        result = await api.btAdminRevokeRestriction(target(), reason(), options);
        break;
      case "annotate":
        result = await api.btAdminAnnotate(
          target(),
          {
            expectedVersion: v(),
            tags: s("tags")
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
            memo: s("memo"),
            starred: b("starred"),
            read: b("read"),
          },
          options,
        );
        break;
      case "moderate":
        result = await api.btAdminModerate(
          target(),
          {
            expectedVersion: v(),
            hidden: b("hidden"),
            includeHiddenInStatistics: b("includeHiddenInStatistics"),
            userReason: s("userReason"),
            internalNote: s("internalNote"),
          },
          options,
        );
        break;
      case "reveal":
        result = await api.btAdminReveal(target(), reason(), options);
        break;
      case "hide":
        result = await api.btAdminHide(target(), reason(), options);
        break;
      case "export":
        result = await api.btAdminExport(
          target(),
          {
            format: s("format"),
            authorMode: s("authorMode"),
            includeHidden: b("includeHidden"),
            includePostReveal: b("includePostReveal"),
          },
          options,
        );
        break;
    }
    revalidatePath("/admin/blind-tastings", "layout");
    const data = result.data as { id?: number; resultJson?: string } | undefined;
    return { success: true as const, id: data?.id, resultJson: operation === "auto" ? data?.resultJson : undefined };
  } catch (error) {
    return failure(error);
  }
}

export async function searchBottles(kind: "sale" | "review", keyword: string, page = 0) {
  try {
    const options = await auth();
    if (keyword.length > 200 || !Number.isSafeInteger(page) || page < 0)
      throw new ApiError(400, "검색 조건을 확인해 주세요.");
    if (kind === "sale") {
      const r = await getApiV2AdminBottles({ keyword, page, size: 30 }, options);
      return {
        success: true as const,
        items: (r.data.content ?? []).map((b) => ({ id: b.id!, name: b.name ?? "이름 없음" })),
      };
    }
    if (kind !== "review") throw new ApiError(400, "검색 대상을 확인해 주세요.");
    const r = await api.btAdminCatalog({ keyword, page, size: 30 }, options);
    return { success: true as const, items: r.data.map((b) => ({ id: b.id!, name: b.name ?? "이름 없음" })) };
  } catch (e) {
    return failure(e);
  }
}
