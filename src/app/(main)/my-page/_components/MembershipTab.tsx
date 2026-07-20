"use client";

import type { UserSelfResponse } from "@/apis/generated/api";
import { Crown } from "lucide-react";
import { MEMBERSHIP_INFO } from "../_lib/constants";
import { hasNaviMembership, hasTalesMembership } from "../_lib/utils";

function MembershipCard({
  data,
  isActive,
}: {
  data: (typeof MEMBERSHIP_INFO)["navi"] | (typeof MEMBERSHIP_INFO)["tales"];
  isActive: boolean;
}) {
  return (
    <div className="border-2 border-white/10 p-4 md:p-6">
      <div className="mb-3 flex items-center justify-between md:mb-4">
        <div>
          <h4 className="typo-bold-18 text-white md:text-xl">{data.name}</h4>
          <p className="typo-medium-12 text-gray-400 md:typo-medium-14">{data.subtitle}</p>
        </div>
        <div
          className={`typo-bold-12 border px-2 py-1 md:px-3 md:py-1.5 md:typo-medium-14 ${
            isActive ? "border-white/20 bg-white/10 text-white" : "border-white/10 bg-white/5 text-gray-400"
          }`}
        >
          {isActive ? "가입됨" : "미가입"}
        </div>
      </div>

      {isActive ? (
        <div>
          <div className="mb-3 border border-white/10 bg-white/5 p-3 md:mb-4 md:p-4">
            <div className="mb-2 flex items-center gap-2">
              <Crown size={16} className="text-white md:size-5" />
              <span className="typo-bold-12 text-white md:typo-medium-14">프리미엄 멤버</span>
            </div>
          </div>
          <div className="space-y-1.5 md:space-y-2">
            {data.benefits.map((benefit) => (
              <div key={benefit} className="typo-medium-12 flex items-start gap-2 text-gray-300 md:typo-medium-14">
                <div className="mt-0.5 text-white md:mt-1">✓</div>
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-6 text-center md:py-8">
          <p className="typo-medium-12 mb-3 whitespace-pre-line text-gray-400 md:mb-4 md:typo-medium-14">{data.joinMessage}</p>
          {/* <button className="typo-bold-14 bg-white px-5 py-2 text-gray-900 transition-colors hover:bg-gray-100 md:px-6 md:py-2.5">
            가입 신청하기
          </button> */}
        </div>
      )}
    </div>
  );
}

interface MembershipTabProps {
  user: UserSelfResponse;
}

export default function MembershipTab({ user }: MembershipTabProps) {
  const naviActive = hasNaviMembership(user.roles);
  const talesActive = hasTalesMembership(user.roles);

  return (
    <div>
      <h3 className="typo-bold-20 mb-4 text-white md:mb-6 md:text-2xl">나의 멤버십</h3>

      <div className="grid gap-4 md:gap-6">
        <MembershipCard data={MEMBERSHIP_INFO.navi} isActive={naviActive} />
        <MembershipCard data={MEMBERSHIP_INFO.tales} isActive={talesActive} />
      </div>

      <div className="mt-6 border border-white/10 bg-white/5 p-4 md:mt-8 md:p-6">
        <h4 className="typo-bold-14 mb-2 text-white md:mb-3 md:text-base">멤버십 안내</h4>
        <div className="typo-medium-12 space-y-1.5 text-gray-400 md:space-y-2 md:typo-medium-14">
          {MEMBERSHIP_INFO.notice.map((text) => (
            <p key={text}>• {text}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
