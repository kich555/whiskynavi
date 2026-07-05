"use client";

import type {
  AdminBusinessUserDetailResponse,
  PatchApiAdminBusinessesBusinessesBusinessidBodyBusinessType,
} from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/formatters";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminHeader from "../../../../_components/AdminHeader";
import { useSidebar } from "../../../../_components/AdminLayoutClient";
import {
  grantBusinessRoleAction,
  revokeBusinessRoleAction,
  updateBusinessAction,
  type BusinessMemberRole,
} from "../actions";

const BUSINESS_TYPE_LABEL: Record<string, string> = {
  HOUSEHOLD: "가정용",
  ENTERTAINMENT: "유흥용",
};

const FALLBACK_SAVE_ERROR_MESSAGE = "사업자 정보 수정에 실패했습니다.";
const FALLBACK_ROLE_ERROR_MESSAGE = "사업자 권한 변경에 실패했습니다.";

const getRemainingSeconds = (expiresAt?: string): number => {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000));
};

const formatRemainingTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const BUSINESS_ROLE_CONFIGS = [
  {
    role: "ROLE_BUSINESS",
    label: "사업자 권한",
    roleKey: "hasBusinessRole",
    badgeClassName: "bg-purple-100 text-purple-700",
  },
  {
    role: "ROLE_TRAILNTALE_BUSINESS",
    label: "트레일앤테일",
    roleKey: "hasTrailntaleBusinessRole",
    badgeClassName: "bg-blue-100 text-blue-700",
  },
  {
    role: "ROLE_COMMUNITY_BUSINESS",
    label: "커뮤니티",
    roleKey: "hasCommunityBusinessRole",
    badgeClassName: "bg-emerald-100 text-emerald-700",
  },
  {
    role: "ROLE_PICK_UP_BUSINESS",
    label: "픽업",
    roleKey: "hasPickupRole",
    badgeClassName: "bg-amber-100 text-amber-700",
  },
] as const satisfies readonly {
  role: BusinessMemberRole;
  label: string;
  roleKey: string;
  badgeClassName: string;
}[];

const isBusinessType = (value: string): value is PatchApiAdminBusinessesBusinessesBusinessidBodyBusinessType =>
  value === "HOUSEHOLD" || value === "ENTERTAINMENT";

type BusinessEditForm = {
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  businessName: string;
  businessRegistrationNumber: string;
  businessType: PatchApiAdminBusinessesBusinessesBusinessidBodyBusinessType;
  contact: string;
  pickupAddress: string;
  storeManagerName: string;
  storeManagerPhone: string;
};

const formatBusinessType = (member: AdminBusinessUserDetailResponse & { businessType?: string }): string => {
  const businessType = member.businessType;
  if (!businessType) return "-";
  return BUSINESS_TYPE_LABEL[businessType] ?? businessType;
};

const hasRole = (member: AdminBusinessUserDetailResponse, roleKey: string, role: BusinessMemberRole) => {
  const value = (member as Record<string, unknown>)[roleKey];
  return typeof value === "boolean" ? value : (member.roles?.includes(role) ?? false);
};

const createInitialForm = (member: AdminBusinessUserDetailResponse): BusinessEditForm => ({
  accountHolderName: member.accountHolderName ?? "",
  accountNumber: member.accountNumber ?? "",
  bankName: member.bankName ?? "",
  businessName: member.businessName ?? "",
  businessRegistrationNumber: member.businessRegistrationNumber ?? "",
  businessType: member.businessType ?? "HOUSEHOLD",
  contact: member.contact ?? "",
  pickupAddress: member.pickupAddress ?? "",
  storeManagerName: member.storeManagerName ?? "",
  storeManagerPhone: member.storeManagerPhone ?? "",
});

interface BusinessMemberDetailContentProps {
  member: AdminBusinessUserDetailResponse;
  documentDownloadExpiresAt?: string;
  documentDownloadInitialRemainingSeconds?: number;
}

export default function BusinessMemberDetailContent({
  member,
  documentDownloadExpiresAt,
  documentDownloadInitialRemainingSeconds,
}: BusinessMemberDetailContentProps) {
  const router = useRouter();
  const { toggle } = useSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    variant: "error" | "success";
  } | null>(null);
  const [pendingRoleAction, setPendingRoleAction] = useState<string | null>(null);
  const [form, setForm] = useState<BusinessEditForm>(() => createInitialForm(member));
  const [documentDownloadRemainingSeconds, setDocumentDownloadRemainingSeconds] = useState(
    documentDownloadInitialRemainingSeconds ?? getRemainingSeconds(documentDownloadExpiresAt),
  );

  useEffect(() => {
    if (!documentDownloadExpiresAt) {
      if (documentDownloadInitialRemainingSeconds === undefined) return;

      // 서버에서 만료 시각을 만들 수 없는 경우 초기 남은 시간을 기준으로 단순 카운트다운한다.
      const timer = setInterval(() => {
        setDocumentDownloadRemainingSeconds((current) => Math.max(0, current - 1));
      }, 1000);
      return () => clearInterval(timer);
    }

    // 서버에서 계산한 만료 시각을 기준으로 브라우저 표시용 남은 시간을 갱신한다.
    const updateRemainingSeconds = () => {
      setDocumentDownloadRemainingSeconds(getRemainingSeconds(documentDownloadExpiresAt));
    };

    updateRemainingSeconds();
    const timer = setInterval(updateRemainingSeconds, 1000);
    return () => clearInterval(timer);
  }, [documentDownloadExpiresAt, documentDownloadInitialRemainingSeconds]);

  const handleEditStart = () => {
    setForm(createInitialForm(member));
    setMessage(null);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setForm(createInitialForm(member));
    setMessage(null);
    setIsEditing(false);
  };

  const handleChange = (field: Exclude<keyof BusinessEditForm, "businessType">, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setMessage(null);
  };

  const handleBusinessTypeChange = (value: PatchApiAdminBusinessesBusinessesBusinessidBodyBusinessType) => {
    setForm((current) => ({
      ...current,
      businessType: value,
    }));
    setMessage(null);
  };

  const handleSave = async () => {
    setIsPending(true);
    setMessage(null);

    try {
      const result = await updateBusinessAction(member.businessId!, {
        accountHolderName: form.accountHolderName,
        accountNumber: form.accountNumber,
        bankName: form.bankName,
        businessName: form.businessName,
        businessRegistrationNumber: form.businessRegistrationNumber,
        businessType: form.businessType,
        contact: form.contact,
        pickupAddress: form.pickupAddress,
        storeManagerName: form.storeManagerName,
        storeManagerPhone: form.storeManagerPhone,
      });

      if (result.success) {
        setMessage({
          text: "사업자 정보가 수정되었습니다.",
          variant: "success",
        });
        setIsEditing(false);
        router.refresh();
        return;
      }

      setMessage({
        text: result.error ?? FALLBACK_SAVE_ERROR_MESSAGE,
        variant: "error",
      });
    } catch {
      setMessage({
        text: FALLBACK_SAVE_ERROR_MESSAGE,
        variant: "error",
      });
    } finally {
      setIsPending(false);
    }
  };

  const handleRoleAction = async (mode: "grant" | "revoke", role: BusinessMemberRole, label: string) => {
    setPendingRoleAction(`${mode}:${role}`);
    setMessage(null);

    try {
      const result =
        mode === "grant"
          ? await grantBusinessRoleAction(member.businessId!, role)
          : await revokeBusinessRoleAction(member.businessId!, role);

      if (result.success) {
        setMessage({
          text: `${label}을 ${mode === "grant" ? "부여" : "회수"}했습니다.`,
          variant: "success",
        });
        router.refresh();
        return;
      }

      setMessage({
        text: result.error ?? FALLBACK_ROLE_ERROR_MESSAGE,
        variant: "error",
      });
    } catch {
      setMessage({
        text: FALLBACK_ROLE_ERROR_MESSAGE,
        variant: "error",
      });
    } finally {
      setPendingRoleAction(null);
    }
  };

  return (
    <>
      <AdminHeader title="업장 상세" onToggleSidebar={toggle} showSearch={false} />

      <div className="p-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex cursor-pointer items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            업장 목록으로 돌아가기
          </button>
        </div>

        <FormMessage message={message?.text} variant={message?.variant} className="mb-4" />

        <div className="space-y-4">
          {/* 멤버 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">멤버 정보</h3>
            </div>
            <div className="grid grid-cols-2 gap-6 p-6 md:grid-cols-3">
              <div>
                <p className="text-xs text-gray-500">User ID</p>
                <p className="text-sm font-medium text-gray-900">{member.userId}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이름</p>
                <p className="text-sm font-medium text-gray-900">{member.name ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이메일</p>
                <p className="text-sm font-medium text-gray-900">{member.username ?? "-"}</p>
              </div>
            </div>
          </div>

          {/* 사업자 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900">사업자 정보</h3>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        저장
                      </button>
                      <button
                        type="button"
                        onClick={handleEditCancel}
                        disabled={isPending}
                        className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEditStart}
                      className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      수정
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-6 p-6">
              {/* 기본 사업자 식별 정보는 가장 먼저 확인할 수 있게 상단에 모은다. */}
              <section>
                <h4 className="mb-3 text-sm font-semibold text-gray-900">기본 정보</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <Label htmlFor="businessName" className="mb-1 text-xs text-gray-500">
                      업체명
                    </Label>
                    {isEditing ? (
                      <Input
                        id="businessName"
                        value={form.businessName}
                        onChange={(event) => handleChange("businessName", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.businessName ?? "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="businessRegistrationNumber" className="mb-1 text-xs text-gray-500">
                      사업자등록번호
                    </Label>
                    {isEditing ? (
                      <Input
                        id="businessRegistrationNumber"
                        value={form.businessRegistrationNumber}
                        onChange={(event) => handleChange("businessRegistrationNumber", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.businessRegistrationNumber ?? "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="businessType" className="mb-1 text-xs text-gray-500">
                      사업자 구분
                    </Label>
                    {isEditing ? (
                      <select
                        id="businessType"
                        value={form.businessType}
                        onChange={(event) => {
                          if (isBusinessType(event.target.value)) {
                            handleBusinessTypeChange(event.target.value);
                          }
                        }}
                        disabled={isPending}
                        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="HOUSEHOLD">가정용</option>
                        <option value="ENTERTAINMENT">유흥용</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{formatBusinessType(member)}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="contact" className="mb-1 text-xs text-gray-500">
                      대표 연락처
                    </Label>
                    {isEditing ? (
                      <Input
                        id="contact"
                        value={form.contact}
                        onChange={(event) => handleChange("contact", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.contact ?? "-"}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="pickupAddress" className="mb-1 text-xs text-gray-500">
                      픽업 주소
                    </Label>
                    {isEditing ? (
                      <Input
                        id="pickupAddress"
                        value={form.pickupAddress}
                        onChange={(event) => handleChange("pickupAddress", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.pickupAddress ?? "-"}</p>
                    )}
                  </div>
                </div>
              </section>

              {/* 담당자와 정산 계좌는 운영 확인 순서에 맞춰 기본 정보 아래에 분리한다. */}
              <section className="border-t border-gray-100 pt-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">운영 담당자</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <Label htmlFor="storeManagerName" className="mb-1 text-xs text-gray-500">
                      담당자명
                    </Label>
                    {isEditing ? (
                      <Input
                        id="storeManagerName"
                        value={form.storeManagerName}
                        onChange={(event) => handleChange("storeManagerName", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.storeManagerName ?? "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="storeManagerPhone" className="mb-1 text-xs text-gray-500">
                      담당자 전화번호
                    </Label>
                    {isEditing ? (
                      <Input
                        id="storeManagerPhone"
                        value={form.storeManagerPhone}
                        onChange={(event) => handleChange("storeManagerPhone", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.storeManagerPhone ?? "-"}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">정산 계좌</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div>
                    <Label htmlFor="bankName" className="mb-1 text-xs text-gray-500">
                      은행명
                    </Label>
                    {isEditing ? (
                      <Input
                        id="bankName"
                        value={form.bankName}
                        onChange={(event) => handleChange("bankName", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.bankName ?? "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="accountHolderName" className="mb-1 text-xs text-gray-500">
                      예금주명
                    </Label>
                    {isEditing ? (
                      <Input
                        id="accountHolderName"
                        value={form.accountHolderName}
                        onChange={(event) => handleChange("accountHolderName", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium text-gray-900">{member.accountHolderName ?? "-"}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="accountNumber" className="mb-1 text-xs text-gray-500">
                      계좌번호
                    </Label>
                    {isEditing ? (
                      <Input
                        id="accountNumber"
                        value={form.accountNumber}
                        onChange={(event) => handleChange("accountNumber", event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <p className="text-sm font-medium break-all text-gray-900">{member.accountNumber ?? "-"}</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="border-t border-gray-100 pt-6">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">문서 및 변경 이력</h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {member.documentDownloadUrl && (
                    <div>
                      <p className="text-xs text-gray-500">사업자등록증</p>
                      <a
                        href={member.documentDownloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-amber-600 hover:underline"
                      >
                        {member.documentOriginalFilename ?? "다운로드"}
                      </a>
                      <p className="mt-1 text-xs text-gray-500">
                        {documentDownloadRemainingSeconds > 0
                          ? `남은 시간 ${formatRemainingTime(documentDownloadRemainingSeconds)}`
                          : "다운로드 주소가 만료되었습니다."}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">사업자 등록일</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(member.businessCreatedAt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">사업자 수정일</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(member.businessUpdatedAt)}</p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* 권한 정보 */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
              <h3 className="font-bold text-gray-900">권한 정보</h3>
            </div>
            <div className="divide-y divide-gray-100">
              {BUSINESS_ROLE_CONFIGS.map((roleConfig) => {
                const enabled = hasRole(member, roleConfig.roleKey, roleConfig.role);
                const grantPending = pendingRoleAction === `grant:${roleConfig.role}`;
                const revokePending = pendingRoleAction === `revoke:${roleConfig.role}`;
                const grantDisabled = enabled || pendingRoleAction !== null;
                const revokeDisabled = !enabled || pendingRoleAction !== null;

                return (
                  <div key={roleConfig.role} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-gray-900">{roleConfig.label}</p>
                      {enabled ? (
                        <Badge className={roleConfig.badgeClassName}>보유</Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-500">미보유</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`${roleConfig.label} 부여`}
                        onClick={() => handleRoleAction("grant", roleConfig.role, roleConfig.label)}
                        disabled={grantDisabled}
                        className={`typo-medium-14 rounded-lg border px-3 py-1.5 transition-colors ${
                          grantDisabled
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            : "cursor-pointer border-amber-600 bg-amber-600 text-white hover:bg-amber-700"
                        }`}
                      >
                        {grantPending ? "처리 중..." : "부여"}
                      </button>
                      <button
                        type="button"
                        aria-label={`${roleConfig.label} 회수`}
                        onClick={() => handleRoleAction("revoke", roleConfig.role, roleConfig.label)}
                        disabled={revokeDisabled}
                        className={`typo-medium-14 rounded-lg border px-3 py-1.5 transition-colors ${
                          revokeDisabled
                            ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                            : "cursor-pointer border-red-600 bg-red-600 text-white hover:bg-red-700"
                        }`}
                      >
                        {revokePending ? "처리 중..." : "회수"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
