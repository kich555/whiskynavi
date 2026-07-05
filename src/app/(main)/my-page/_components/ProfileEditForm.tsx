"use client";

import type { UserSelfResponse } from "@/apis/generated/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarDays } from "lucide-react";
import { useSession } from "next-auth/react";
import { useActionState, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { sendEmailVerification, updateProfile, verifyEmailCode } from "../actions";

type EmailVerificationStep = "idle" | "code-sent" | "verified";
type AgreementFieldName = "emailAgree" | "smsAgree" | "marketingAgree" | "snsAgree";

interface ProfileEditFormProps {
  user: UserSelfResponse;
  onClose: () => void;
}

export default function ProfileEditForm({ user, onClose }: ProfileEditFormProps) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfile, { success: false });
  const { update: updateSession } = useSession();

  // Email verification state
  const [email, setEmail] = useState(user.email ?? "");
  const [agreements, setAgreements] = useState<Record<AgreementFieldName, boolean>>({
    emailAgree: Boolean(user.emailAgree),
    smsAgree: Boolean(user.smsAgree),
    marketingAgree: Boolean(user.marketingAgree),
    snsAgree: Boolean(user.snsAgree),
  });
  const [code, setCode] = useState("");
  const [emailStep, setEmailStep] = useState<EmailVerificationStep>("idle");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailPending, startEmailTransition] = useTransition();
  const verifiedEmailRef = useRef("");

  const emailChanged = email !== (user.email ?? "");

  // 성공 시 세션 동기화 후 모달 닫기
  useEffect(() => {
    if (!profileState.success) return;

    const { updatedUsername, updatedEmail } = profileState;
    const userPatch: { name?: string; email?: string } = {};
    if (updatedUsername) userPatch.name = updatedUsername;
    if (updatedEmail) userPatch.email = updatedEmail;

    if (Object.keys(userPatch).length > 0) {
      // jwt callback의 trigger === "update" 분기를 태워 JWT.name/email을 최신값으로 갱신
      updateSession({ user: userPatch }).finally(onClose);
    } else {
      onClose();
    }
  }, [profileState, onClose, updateSession]);

  const handleEmailChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setEmail(newValue);

      if (emailStep !== "idle" && newValue !== verifiedEmailRef.current) {
        setEmailStep("idle");
        setCode("");
        setEmailError(null);
      }
    },
    [emailStep],
  );

  const handleSendCode = useCallback(() => {
    if (!email.trim()) {
      setEmailError("이메일을 입력해주세요.");
      return;
    }

    startEmailTransition(async () => {
      const result = await sendEmailVerification(email);
      if (result.success) {
        setEmailStep("code-sent");
        setEmailError(null);
      } else {
        setEmailError(result.error ?? "인증 코드 발송에 실패했습니다.");
      }
    });
  }, [email]);

  const handleVerifyCode = useCallback(() => {
    if (!code.trim()) {
      setEmailError("인증 코드를 입력해주세요.");
      return;
    }

    startEmailTransition(async () => {
      const result = await verifyEmailCode(email, code.trim());
      if (result.success) {
        setEmailStep("verified");
        verifiedEmailRef.current = email;
        setEmailError(null);
      } else {
        setEmailError(result.error ?? "인증 코드가 올바르지 않습니다.");
      }
    });
  }, [email, code]);

  const isEmailVerified = emailStep === "verified";
  const agreementItems: Array<{ name: AgreementFieldName; label: string }> = [
    {
      name: "emailAgree",
      label: "이메일 수신 동의",
    },
    {
      name: "smsAgree",
      label: "SMS 수신 동의",
    },
    {
      name: "marketingAgree",
      label: "마케팅 정보 수신 동의",
    },
    {
      name: "snsAgree",
      label: "SNS 수신 동의",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <form action={profileAction}>
        <input type="hidden" name="originalUsername" value={user.username} />
        <input type="hidden" name="originalEmail" value={user.email} />
        <input type="hidden" name="emailVerified" value={String(!emailChanged || isEmailVerified)} />
        <input type="hidden" name="originalEmailAgree" value={String(Boolean(user.emailAgree))} />
        <input type="hidden" name="originalSmsAgree" value={String(Boolean(user.smsAgree))} />
        <input type="hidden" name="originalMarketingAgree" value={String(Boolean(user.marketingAgree))} />
        <input type="hidden" name="originalSnsAgree" value={String(Boolean(user.snsAgree))} />
        {agreementItems.map((item) => (
          <input key={item.name} type="hidden" name={item.name} value={String(agreements[item.name])} />
        ))}

        <div className="border-b border-gray-200 pb-4 md:pb-6">
          <h4 className="mb-3 font-bold text-gray-900 md:mb-4">기본 정보</h4>
          <div className="space-y-3 md:space-y-4">
            {/* 닉네임 */}
            <div>
              <Label className="typo-bold-14 mb-2 block text-gray-700">닉네임</Label>
              <Input name="username" defaultValue={user.username} className="text-sm md:text-base" />
            </div>

            {/* 이름 (읽기 전용) */}
            <div>
              <Label className="typo-bold-14 mb-2 block text-gray-700">이름</Label>
              <Input
                defaultValue={user.name}
                disabled
                className="cursor-not-allowed bg-gray-50 text-sm text-gray-500 md:text-base"
              />
              <p className="mt-1 text-xs text-gray-500">이름은 변경할 수 없습니다</p>
            </div>

            {/* 이메일 (인증 플로우) */}
            <div>
              <Label className="typo-bold-14 mb-2 block text-gray-700">이메일</Label>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    name="email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    readOnly={isEmailVerified}
                    className="text-sm md:text-base"
                  />
                </div>
                {emailChanged && emailStep !== "verified" && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={isEmailPending || emailStep === "code-sent"}
                    className="shrink-0 text-xs md:text-sm"
                  >
                    {isEmailPending && emailStep === "idle"
                      ? "발송 중..."
                      : emailStep === "code-sent"
                        ? "발송완료"
                        : "인증하기"}
                  </Button>
                )}
              </div>

              {/* 인증 코드 입력 */}
              {emailStep === "code-sent" && (
                <div className="mt-2 flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="인증 코드 입력"
                      className="text-sm md:text-base"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleVerifyCode}
                    disabled={isEmailPending || !code.trim()}
                    className="shrink-0 text-xs md:text-sm"
                  >
                    {isEmailPending ? "확인 중..." : "확인"}
                  </Button>
                </div>
              )}

              <FormMessage message={emailError} className="mt-1" />
              {emailStep === "code-sent" && !emailError && (
                <FormMessage
                  message="인증 코드가 발송되었습니다. 이메일을 확인해주세요."
                  variant="info"
                  className="mt-1"
                />
              )}
              {isEmailVerified && !emailError && (
                <FormMessage message="이메일 인증이 완료되었습니다." variant="success" className="mt-1" />
              )}
            </div>

            {/* 전화번호 (읽기 전용) */}
            <div>
              <Label className="typo-bold-14 mb-2 block text-gray-700">전화번호</Label>
              <Input disabled name="phone" type="tel" defaultValue={user.phone} className="text-sm md:text-base" />
            </div>

            {/* 생년월일 & 성별 (읽기 전용) */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div>
                <Label className="typo-bold-14 mb-2 block text-gray-700">생년월일</Label>
                <div className="relative">
                  <Input
                    disabled
                    name="birthDate"
                    type="date"
                    defaultValue={user.birthDate}
                    className="py-2 pr-3 pl-10 text-sm md:py-3 md:pr-4 md:pl-12 md:text-base"
                  />
                  <CalendarDays
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 md:left-4"
                    size={16}
                  />
                </div>
              </div>
              <div>
                <Label className="typo-bold-14 mb-2 block text-gray-700">성별</Label>
                <Input
                  disabled
                  name="gender"
                  defaultValue={user.gender === "M" ? "남성" : user.gender === "F" ? "여성" : "-"}
                  className="text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* 마케팅 수신 동의 */}
          <div className="mt-4 md:mt-6">
            <h4 className="mb-3 font-bold text-gray-900 md:mb-4">마케팅 수신 동의</h4>
            <div className="space-y-2 md:space-y-3">
              {agreementItems.map((item) => (
                <label
                  key={item.name}
                  className="flex cursor-pointer items-center gap-2 border border-gray-200 p-2 hover:bg-gray-50 md:gap-3 md:p-3"
                >
                  <Checkbox
                    checked={agreements[item.name]}
                    onCheckedChange={(checked) =>
                      setAgreements((prev) => ({
                        ...prev,
                        [item.name]: checked === true,
                      }))
                    }
                  />
                  <span className="text-sm text-gray-900 md:text-base">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <FormMessage message={profileState.error} className="mt-3" />
          <FormMessage
            message={profileState.success ? "프로필이 수정되었습니다." : undefined}
            variant="success"
            className="mt-3"
          />

          <div className="mt-4 flex gap-3">
            <Button type="submit" disabled={profilePending || (emailChanged && !isEmailVerified)} className="flex-1">
              {profilePending ? "저장 중..." : "정보 수정"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
