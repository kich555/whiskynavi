"use client";

import type { AdminUserOrderSummaryResponse, AdminUserResponse } from "@/apis/generated/api";
import type { AdminSearchParams } from "@/app/admin/_lib/searchParams";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { IconGoogle, IconKakao, IconNaver } from "@/icons";
import { formatCurrency } from "@/lib/formatters";
import { formatOrderClassification } from "@/lib/order-classification";
import {
  Ban,
  Calendar,
  CheckCircle,
  Edit2,
  Mail,
  Phone,
  Plus,
  Shield,
  ShoppingBag,
  User,
  X,
  XCircle,
} from "lucide-react";
import { overlay } from "overlay-kit";
import { useState } from "react";
import { toast } from "sonner";
import Pagination from "../_components/Pagination";
import { ASSIGNABLE_ROLES, ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, ROLE_COLOR_MAP, ROLE_LABEL_MAP } from "../constants";
import AdminConfirmModal from "./modals/AdminConfirmModal";

// ─── 유틸 ─────────────────────────────────────────────────────
// ─── Props ─────────────────────────────────────────────────────
interface UserDetailViewProps {
  isEditMode: false;
  userDetails: AdminUserResponse;
  orderSummary?: AdminUserOrderSummaryResponse;
  searchParams?: AdminSearchParams;
  initialActiveTab?: "info" | "reservations";
  currentOrderPage?: number;
  orderItemsPerPage?: number;
  onStatusToggle?: (newStatus: string) => void;
  onAddManualPurchase?: () => void;
  onAddRole?: never;
  onRemoveRole?: never;
  isSaving?: never;
}

interface UserDetailEditProps {
  isEditMode: true;
  userDetails: AdminUserResponse;
  orderSummary?: AdminUserOrderSummaryResponse;
  searchParams?: AdminSearchParams;
  initialActiveTab?: "info" | "reservations";
  currentOrderPage?: number;
  orderItemsPerPage?: number;
  onStatusToggle?: (newStatus: string) => void;
  onAddManualPurchase?: () => void;
  onAddRole?: (role: string) => void;
  onRemoveRole?: (role: string) => void;
  isSaving?: boolean;
}

type UserDetailProps = UserDetailViewProps | UserDetailEditProps;

type UserExtWithSocialConnections = NonNullable<AdminUserResponse["userExt"]> & {
  socialConnections?: {
    google?: boolean;
    kakao?: boolean;
    naver?: boolean;
  };
};

// ─── 컴포넌트 ────────────────────────────────────────────────────
export default function AdminUserDetailSection(props: UserDetailProps) {
  const { isEditMode, userDetails, orderSummary, onStatusToggle } = props;
  const { onAddManualPurchase } = props;
  const userExt = userDetails.userExt as UserExtWithSocialConnections | undefined;
  const orderTotalElements = orderSummary?.orders?.page?.totalElements ?? 0;
  const currentOrderPage = props.currentOrderPage ?? (orderSummary?.orders?.page?.number ?? 0) + 1;
  const orderItemsPerPage = props.orderItemsPerPage ?? orderSummary?.orders?.page?.size ?? 20;
  const orderSearchParams = { ...(props.searchParams ?? {}), tab: "reservations" };

  const onAddRole = isEditMode ? props.onAddRole : undefined;
  const onRemoveRole = isEditMode ? props.onRemoveRole : undefined;
  const isSaving = isEditMode ? (props.isSaving ?? false) : false;

  // 탭
  const [activeTab, setActiveTab] = useState<"info" | "reservations">(props.initialActiveTab ?? "info");

  // 권한 편집
  const [isEditingRoles, setIsEditingRoles] = useState(false);
  const [newRole, setNewRole] = useState("");

  // ── 관리자 권한 여부 ──────────────────────────────────
  const isAdminRole = (role: string) => role === "ROLE_ADMIN" || role === "ROLE_SUPER_ADMIN";

  // ── 권한 추가 핸들러 ──────────────────────────────────
  const handleAddRole = () => {
    if (!newRole || !onAddRole) return;

    if ((userDetails.roles ?? []).includes(newRole)) {
      toast.error("이미 보유한 권한입니다.");
      return;
    }

    // 관리자 권한 → 확인 모달
    if (isAdminRole(newRole)) {
      overlay.open(({ isOpen, close }) => (
        <AdminConfirmModal
          isOpen={isOpen}
          close={close}
          userName={userDetails.name ?? ""}
          username={userDetails.username ?? ""}
          onConfirm={() => {
            onAddRole(newRole);
            setNewRole("");
          }}
        />
      ));
      return;
    }

    // 충돌 없으면 바로 추가
    onAddRole(newRole);
    setNewRole("");
  };

  return (
    <div className="space-y-6">
      {/* 기본 정보 섹션 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="typo-bold-18 mb-4 flex items-center gap-2 text-gray-900">
          <User size={20} className="text-amber-600" />
          기본 정보
        </h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name" className="typo-bold-14 mb-2 block text-gray-700">
              이름
            </Label>
            <p className="text-gray-900">{userDetails.name}</p>
          </div>
          <div>
            <Label htmlFor="username" className="typo-bold-14 mb-2 block text-gray-700">
              사용자명
            </Label>
            <p className="text-gray-900">@{userDetails.username}</p>
          </div>
          <div>
            <Label htmlFor="email" className="typo-bold-14 mb-2 block flex items-center gap-1 text-gray-700">
              <Mail size={14} />
              이메일
            </Label>
            <p className="text-gray-900">{userDetails.email}</p>
          </div>
          <div>
            <Label htmlFor="phone" className="typo-bold-14 mb-2 block flex items-center gap-1 text-gray-700">
              <Phone size={14} />
              전화번호
            </Label>
            <p className="text-gray-900">{userDetails.phone}</p>
          </div>
          <div>
            <Label htmlFor="status" className="typo-bold-14 mb-2 block text-gray-700">
              계정 상태
            </Label>
            <div className="flex items-center gap-3">
              <Switch
                checked={userDetails.status === "ACTIVE"}
                onCheckedChange={(checked) => onStatusToggle?.(checked ? "ACTIVE" : "INACTIVE")}
                disabled={!onStatusToggle || isSaving}
                className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-400"
              />
              <span className={`typo-medium-14 ${userDetails.status === "ACTIVE" ? "text-green-700" : "text-red-700"}`}>
                {userDetails.status === "ACTIVE" ? "활성" : "비활성"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 섹션 */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* 탭 헤더 */}
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab("info")}
              className={`typo-semibold-14 relative cursor-pointer px-6 py-3 transition-colors ${
                activeTab === "info"
                  ? "border-b-2 border-amber-600 bg-amber-50/50 text-amber-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              회원 상세 정보
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reservations")}
              className={`typo-semibold-14 relative cursor-pointer px-6 py-3 transition-colors ${
                activeTab === "reservations"
                  ? "border-b-2 border-amber-600 bg-amber-50/50 text-amber-600"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              예약 내역 ({orderTotalElements})
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="p-6">
          {activeTab === "info" ? (
            <div className="space-y-0">
              {/* 활동 정보 */}
              <div>
                <h4 className="typo-bold-16 mb-4 flex items-center gap-2 text-gray-900">
                  <Calendar size={18} className="text-amber-600" />
                  활동 정보
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="createdAt" className="typo-bold-14 mb-2 block text-gray-700">
                      가입일
                    </Label>
                    <p className="text-gray-900">{userDetails.createdAt}</p>
                  </div>
                  <div>
                    <Label htmlFor="lastLoginAt" className="typo-bold-14 mb-2 block text-gray-700">
                      마지막 로그인
                    </Label>
                    <p className="text-gray-900">{userDetails.lastLoginAt ?? "-"}</p>
                  </div>
                </div>

                {/* 소셜 로그인 연동 정보 */}
                {userExt?.socialConnections && (
                  <div className="mt-6">
                    <Label htmlFor="socialConnections" className="typo-bold-14 mb-3 block text-gray-700">
                      소셜 로그인 연동
                    </Label>
                    <div className="flex gap-2">
                      {userExt.socialConnections.google && (
                        <div className="flex items-center gap-2 rounded-lg border-2 border-red-200 bg-white px-3 py-2">
                          <IconGoogle size={20} />
                          <span className="typo-medium-14 text-gray-700">Google</span>
                        </div>
                      )}
                      {userExt.socialConnections.kakao && (
                        <div className="flex items-center gap-2 rounded-lg bg-[#FEE500] px-3 py-2">
                          <IconKakao size={20} />
                          <span className="typo-medium-14 text-gray-900">Kakao</span>
                        </div>
                      )}
                      {userExt.socialConnections.naver && (
                        <div className="flex items-center gap-2 rounded-lg bg-[#03C75A] px-3 py-2">
                          <IconNaver size={20} />
                          <span className="typo-medium-14 text-white">Naver</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* divider */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                {/* 권한 및 멤버십 */}
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="typo-bold-16 flex items-center gap-2 text-gray-900">
                    <Shield size={18} className="text-amber-600" />
                    권한 및 멤버십
                  </h4>
                  {isEditMode && (
                    <>
                      {!isEditingRoles ? (
                        <button
                          type="button"
                          onClick={() => setIsEditingRoles(true)}
                          className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-white transition-colors hover:bg-amber-700"
                        >
                          <Edit2 size={14} />
                          권한 수정
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingRoles(false);
                            setNewRole("");
                          }}
                          className="typo-medium-14 cursor-pointer rounded-lg bg-gray-200 px-3 py-1.5 text-gray-700 transition-colors hover:bg-gray-300"
                        >
                          완료
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roles" className="typo-bold-14 mb-3 block text-gray-700">
                      보유 권한
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {userDetails.roles?.map((role) => (
                        <span
                          key={role}
                          className={`typo-medium-14 flex items-center gap-2 rounded-lg px-3 py-1.5 ${ROLE_COLOR_MAP[role]}`}
                        >
                          {ROLE_LABEL_MAP[role]}
                          {isEditingRoles && (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => onRemoveRole?.(role)}
                              className="cursor-pointer hover:opacity-70 disabled:opacity-30"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {isEditingRoles && (
                      <div className="mt-3 flex gap-2">
                        <Select value={newRole} onValueChange={(value) => setNewRole(value)}>
                          <SelectTrigger className="typo-medium-14 flex-1">
                            <SelectValue placeholder="권한 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {ASSIGNABLE_ROLES.filter((role) => !(userDetails.roles ?? []).includes(role)).map(
                              (role) => (
                                <SelectItem key={role} value={role}>
                                  {ROLE_LABEL_MAP[role]}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                        <button
                          type="button"
                          onClick={handleAddRole}
                          disabled={!newRole || isSaving}
                          className="typo-medium-14 flex cursor-pointer items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus size={14} />
                          {isSaving ? "처리중..." : "추가"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* divider */}
              <div className="mt-6 border-t border-gray-200 pt-6">
                {/* 약관 동의 정보 */}
                <h4 className="typo-bold-16 mb-4 flex items-center gap-2 text-gray-900">
                  <CheckCircle size={18} className="text-amber-600" />
                  약관 동의 정보
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="typo-medium-14 text-gray-700">개인정보 처리방침</span>
                    {userDetails.userExt?.privacyAgree ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="typo-medium-14 text-gray-700">마케팅 수신 동의</span>
                    {userDetails.userExt?.marketingAgree ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="typo-medium-14 text-gray-700">이메일 수신 동의</span>
                    {userDetails.userExt?.emailAgree ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                    <span className="typo-medium-14 text-gray-700">SMS 수신 동의</span>
                    {userDetails.userExt?.smsAgree ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <XCircle size={20} className="text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 예약 내역 탭 */
            <div>
              {orderSummary ? (
                <>
                  {/* 총 구매 금액 요약 카드 */}
                  <div className="mb-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="typo-medium-14 text-amber-100">총 구매 금액</p>
                        <p className="typo-bold-24 mt-1 text-white">{formatCurrency(orderSummary.totalAmount ?? 0)}</p>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <div className="text-right">
                          <p className="typo-medium-14 text-amber-100">총 주문 수</p>
                          <p className="typo-bold-24 mt-1 text-white">{orderTotalElements}건</p>
                        </div>
                        {onAddManualPurchase && (
                          <button
                            type="button"
                            onClick={onAddManualPurchase}
                            className="typo-medium-14 flex shrink-0 cursor-pointer items-center gap-1 rounded-lg bg-white px-3 py-2 text-amber-700 transition-colors hover:bg-amber-50"
                          >
                            <Plus size={14} />
                            구매내역 추가
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 주문 테이블 */}
                  {(orderSummary.orders?.content ?? []).length > 0 ? (
                    <>
                      <div className="overflow-x-auto">
                        <table className="typo-medium-14 w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="px-3 py-3 text-left font-semibold text-gray-700">제품명</th>
                              <th className="px-3 py-3 text-right font-semibold text-gray-700">신청수량</th>
                              <th className="px-3 py-3 text-right font-semibold text-gray-700">배정수량</th>
                              <th className="px-3 py-3 text-right font-semibold text-gray-700">금액</th>
                              <th className="px-3 py-3 text-left font-semibold text-gray-700">상태</th>
                              <th className="px-3 py-3 text-left font-semibold text-gray-700">주문일</th>
                              <th className="px-3 py-3 text-left font-semibold text-gray-700">주문번호</th>
                              <th className="px-3 py-3 text-left font-semibold text-gray-700">주문분류</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(orderSummary.orders?.content ?? []).map((order) => (
                              <tr
                                key={order.id}
                                className="border-b border-gray-100 transition-colors hover:bg-gray-50"
                              >
                                <td className="px-3 py-3 font-medium text-gray-900">{order.itemName}</td>
                                <td className="px-3 py-3 text-right font-medium text-gray-900">
                                  {order.requestedQuantity}병
                                </td>
                                <td className="px-3 py-3 text-right font-medium text-amber-700">
                                  {order.approvedQuantity != null ? `${order.approvedQuantity}병` : "-"}
                                </td>
                                <td className="px-3 py-3 text-right font-medium text-gray-900">
                                  {formatCurrency(order.totalPrice ?? 0)}
                                </td>
                                <td className="px-3 py-3">
                                  <span
                                    className={`typo-medium-12 rounded px-2 py-1 ${
                                      ORDER_STATUS_COLOR[order.orderStatus ?? ""] ?? "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {ORDER_STATUS_LABEL[order.orderStatus ?? ""] ?? order.orderStatus}
                                  </span>
                                </td>
                                <td className="px-3 py-3 text-gray-600">
                                  {new Date(order.createdAt ?? "")
                                    .toLocaleDateString("ko-KR", {
                                      year: "numeric",
                                      month: "2-digit",
                                      day: "2-digit",
                                    })
                                    .replace(/\. /g, ".")
                                    .replace(/\.$/, "")}
                                </td>
                                <td className="px-3 py-3 text-gray-600">{order.orderNumber}</td>
                                <td className="px-3 py-3 text-gray-600">{formatOrderClassification(order)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {userDetails.id != null && (
                        <Pagination
                          totalItems={orderTotalElements}
                          itemsPerPage={orderItemsPerPage}
                          currentPage={currentOrderPage}
                          searchParams={orderSearchParams}
                          basePath={`/admin/users/${userDetails.id}`}
                        />
                      )}
                    </>
                  ) : (
                    <div className="py-12 text-center text-gray-500">
                      <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
                      <p>주문 내역이 없습니다.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <ShoppingBag size={48} className="mx-auto mb-3 text-gray-300" />
                  <p>예약 내역 데이터가 없습니다.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 제재 정보 섹션 */}
      {userDetails.userExt?.isBanned && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="typo-bold-18 mb-4 flex items-center gap-2 text-red-900">
            <Ban size={20} className="text-red-600" />
            제재 정보
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="banReason" className="typo-bold-14 mb-1 block text-red-700">
                제재 사유
              </Label>
              <p className="text-red-900">{userDetails.userExt.banReason}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="banStartDate" className="typo-bold-14 mb-1 block text-red-700">
                  제재 시작일
                </Label>
                <p className="text-red-900">{userDetails.userExt.banStartDate}</p>
              </div>
              <div>
                <Label htmlFor="banEndDate" className="typo-bold-14 mb-1 block text-red-700">
                  제재 종료일
                </Label>
                <p className="text-red-900">{userDetails.userExt.banEndDate}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {userDetails.userExt?.isPostCreationRestricted && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-6">
          <h3 className="typo-bold-18 mb-4 flex items-center gap-2 text-orange-900">
            <Edit2 size={20} className="text-orange-600" />
            게시글 작성 제한
          </h3>
          <div className="space-y-3">
            <div>
              <Label htmlFor="postCreationRestrictionReason" className="typo-bold-14 mb-1 block text-orange-700">
                제한 사유
              </Label>
              <p className="whitespace-pre-wrap text-orange-900">{userDetails.userExt.postCreationRestrictionReason}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="postCreationRestrictionStartAt" className="typo-bold-14 mb-1 block text-orange-700">
                  제한 시작일
                </Label>
                <p className="text-orange-900">{userDetails.userExt.postCreationRestrictionStartAt}</p>
              </div>
              <div>
                <Label htmlFor="postCreationRestrictionEndAt" className="typo-bold-14 mb-1 block text-orange-700">
                  제한 종료일
                </Label>
                <p className="text-orange-900">{userDetails.userExt.postCreationRestrictionEndAt}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
