"use client";

import type { AdminUserResponse, BottleAdminResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { Check, ExternalLink } from "lucide-react";
import Link from "next/link";

interface UserReferenceTableProps {
  users: AdminUserResponse[];
  selectedUserId?: number;
  onSelectUser?: (user: AdminUserResponse) => void;
}

interface BottleReferenceTableProps {
  bottles: BottleAdminResponse[];
  selectedBottleId?: number;
  onSelectBottle?: (bottle: BottleAdminResponse) => void;
}

export function UserReferenceTable({ users, selectedUserId, onSelectUser }: UserReferenceTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">관리 ID</th>
              <th className="px-3 py-2 text-left">이름</th>
              <th className="px-3 py-2 text-left">아이디</th>
              <th className="px-3 py-2 text-left">이메일</th>
              <th className="px-3 py-2 text-left">상태</th>
              {onSelectUser && <th className="px-3 py-2 text-left">선택</th>}
              <th className="px-3 py-2 text-left">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={onSelectUser ? 7 : 6} className="px-3 py-8 text-center text-gray-500">
                  조회된 사용자가 없습니다.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className={selectedUserId === user.id ? "bg-amber-50" : undefined}>
                  <td className="px-3 py-2 font-semibold text-gray-900">{user.id ?? "-"}</td>
                  <td className="px-3 py-2">{user.name ?? "-"}</td>
                  <td className="px-3 py-2">{user.username ?? "-"}</td>
                  <td className="px-3 py-2">{user.email ?? "-"}</td>
                  <td className="px-3 py-2">{user.status ?? "-"}</td>
                  {onSelectUser && (
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant={selectedUserId === user.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectUser(user)}
                        disabled={!user.id}
                        aria-label={`${user.name ?? user.username ?? user.email ?? user.id} 선택`}
                      >
                        <Check className="size-3" />
                        선택
                      </Button>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    {user.id && (
                      <Link className="inline-flex items-center gap-1 text-amber-700" href={`/admin/users/${user.id}`}>
                        열기
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BottleReferenceTable({ bottles, selectedBottleId, onSelectBottle }: BottleReferenceTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">관리 ID</th>
              <th className="px-3 py-2 text-left">보틀명</th>
              <th className="px-3 py-2 text-left">브랜드</th>
              <th className="px-3 py-2 text-left">소비자가</th>
              <th className="px-3 py-2 text-left">재고</th>
              {onSelectBottle && <th className="px-3 py-2 text-left">선택</th>}
              <th className="px-3 py-2 text-left">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bottles.length === 0 ? (
              <tr>
                <td colSpan={onSelectBottle ? 7 : 6} className="px-3 py-8 text-center text-gray-500">
                  조회된 보틀이 없습니다.
                </td>
              </tr>
            ) : (
              bottles.map((bottle) => (
                <tr key={bottle.id} className={selectedBottleId === bottle.id ? "bg-amber-50" : undefined}>
                  <td className="px-3 py-2 font-semibold text-gray-900">{bottle.id ?? "-"}</td>
                  <td className="px-3 py-2">{bottle.name ?? "-"}</td>
                  <td className="px-3 py-2">{bottle.brand ?? "-"}</td>
                  <td className="px-3 py-2">{formatCurrency(bottle.consumerPrice)}</td>
                  <td className="px-3 py-2">{bottle.stockQuantity ?? "-"}</td>
                  {onSelectBottle && (
                    <td className="px-3 py-2">
                      <Button
                        type="button"
                        variant={selectedBottleId === bottle.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelectBottle(bottle)}
                        disabled={!bottle.id}
                        aria-label={`${bottle.name ?? bottle.id} 선택`}
                      >
                        <Check className="size-3" />
                        선택
                      </Button>
                    </td>
                  )}
                  <td className="px-3 py-2">
                    {bottle.id && (
                      <Link
                        className="inline-flex items-center gap-1 text-amber-700"
                        href={`/admin/products/${bottle.id}`}
                      >
                        열기
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
