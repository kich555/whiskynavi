"use client";

import type { BusinessMemberResponse, BusinessMembershipBusinessResponse } from "@/apis/generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";
import BusinessHeader from "../../_components/BusinessHeader";
import {
  addBusinessManagerAction,
  removeBusinessManagerAction,
  transferBusinessOwnershipAction,
} from "../../actions";

interface BusinessMembersContentProps {
  business?: BusinessMembershipBusinessResponse | null;
  members: BusinessMemberResponse[];
}

const ROLE_LABEL: Record<string, string> = {
  OWNER: "소유자",
  MANAGER: "매니저",
};

export default function BusinessMembersContent({ business, members }: BusinessMembersContentProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();

  const businessId = business?.businessId;
  const canManage = business?.role === "OWNER" && businessId != null;

  const handleAddManager = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!businessId) return;

    const trimmedEmail = email.trim();
    startTransition(async () => {
      const result = await addBusinessManagerAction(businessId, { email: trimmedEmail });
      if (result.success) {
        setEmail("");
        toast.success("매니저를 추가했습니다.");
        router.refresh();
      } else {
        toast.error(result.error ?? "매니저 추가에 실패했습니다.");
      }
    });
  };

  const handleRemoveManager = (userId?: number) => {
    if (!businessId || userId == null) return;

    startTransition(async () => {
      const result = await removeBusinessManagerAction(businessId, userId);
      if (result.success) {
        toast.success("매니저를 삭제했습니다.");
        router.refresh();
      } else {
        toast.error(result.error ?? "매니저 삭제에 실패했습니다.");
      }
    });
  };

  const handleTransferOwnership = (userId?: number) => {
    if (!businessId || userId == null) return;
    if (!window.confirm("이 사용자에게 사업장 소유권을 이전하시겠습니까?")) return;

    startTransition(async () => {
      const result = await transferBusinessOwnershipAction(businessId, userId);
      if (result.success) {
        toast.success("소유권을 이전했습니다.");
        router.refresh();
      } else {
        toast.error(result.error ?? "소유권 이전에 실패했습니다.");
      }
    });
  };

  return (
    <>
      <BusinessHeader title="사업장 멤버 관리" />

      <div className="space-y-6 p-6">
        {!business ? (
          <section className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500">
            연결된 사업장이 없습니다.
          </section>
        ) : (
          <>
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-amber-600">현재 기본 사업장</p>
                  <h3 className="mt-1 text-xl font-bold text-gray-900">{business.businessName ?? "이름 없는 사업장"}</h3>
                  <p className="mt-1 text-sm text-gray-500">{business.pickupAddress ?? "주소 정보 없음"}</p>
                </div>
                <Badge className="bg-gray-900 text-white">{ROLE_LABEL[business.role ?? ""] ?? business.role ?? "-"}</Badge>
              </div>
            </section>

            {!canManage && (
              <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                사업장 소유자만 멤버를 변경할 수 있습니다.
              </section>
            )}

            {canManage && (
              <form onSubmit={handleAddManager} className="rounded-lg border border-gray-200 bg-white p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="manager-email">매니저 이메일</Label>
                    <Input
                      id="manager-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="manager@example.com"
                      className="mt-2"
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isPending} className="bg-amber-600 text-white hover:bg-amber-700">
                    매니저 추가
                  </Button>
                </div>
              </form>
            )}

            <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              {members.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">사업장 멤버가 없습니다.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">사용자</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">이메일</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">권한</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-700">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {members.map((member) => (
                        <tr key={member.userId ?? member.email}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <div className="font-bold">{member.name ?? member.username ?? "-"}</div>
                            <div className="mt-1 text-xs text-gray-500">ID {member.userId ?? "-"}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{member.email ?? "-"}</td>
                          <td className="px-4 py-3 text-sm">
                            <Badge variant="secondary">{ROLE_LABEL[member.role ?? ""] ?? member.role ?? "-"}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {canManage && member.role !== "OWNER" ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleTransferOwnership(member.userId)}
                                >
                                  소유권 이전
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isPending}
                                  onClick={() => handleRemoveManager(member.userId)}
                                >
                                  삭제
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
