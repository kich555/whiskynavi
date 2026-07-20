"use client";

import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useActionState, useState } from "react";
import { AgreementSection, EmailField, UsernameField } from "./_components";
import { useFunnel } from "./_hooks/useFunnel";
import { useNiceVerification } from "./_hooks/useNiceVerification";
import { signUpAction, type SignUpState } from "./actions";
import { formatGenderLabel, IS_DEV_BYPASS_ENABLED, maskPhoneNumber, type VerifiedSignupProfile } from "./nice";

// --- Funnel Steps ---

type SignUpSteps = {
  본인인증: Record<string, never>;
  회원정보입력: { verifiedProfile: VerifiedSignupProfile };
};

// --- Step Components ---

function VerificationStep({ onNext }: { onNext: (profile: VerifiedSignupProfile) => void }) {
  const nice = useNiceVerification({ onSuccess: onNext });

  return (
    <div className="flex flex-col gap-6">
      {nice.duplicateAccount && (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-center">
          <p className="typo-bold-16 text-red-600">이미 가입된 계정입니다.</p>
          <p className="typo-regular-14 mt-2 text-red-500">
            기존 로그인 방식: {nice.duplicateAccount.existingAuthType}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => (window.location.href = "/sign-in")}
            className="mt-4 border-red-300 text-red-600 hover:bg-red-100"
          >
            로그인 페이지로 이동
          </Button>
        </section>
      )}

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="typo-medium-14 text-gray-500">Step 1</p>
        <h2 className="typo-bold-20 mt-2 text-black">NICE 본인인증</h2>
        <p className="typo-regular-14 mt-3 text-gray-600">
          회원가입은 본인인증 후 진행됩니다. 인증이 완료되면 이름, 휴대폰번호, 생년월일, 성별이 자동으로 반영됩니다.
        </p>

        <Button
          type="button"
          onClick={nice.startVerification}
          disabled={nice.isStarting}
          className="typo-medium-16 mt-6 h-14 w-full rounded-[10px] bg-[#1E2A38] text-white hover:bg-[#2a3a4d] disabled:opacity-50"
        >
          {nice.isStarting ? "인증 준비 중..." : "본인인증 시작"}
        </Button>

        {IS_DEV_BYPASS_ENABLED && (
          <Button
            type="button"
            variant="outline"
            onClick={nice.devBypass}
            className="mt-3 h-10 w-full border-dashed border-amber-400 text-amber-600 hover:bg-amber-50"
          >
            [DEV] 본인인증 건너뛰기
          </Button>
        )}
      </section>

      <FormMessage message={nice.error} className="text-center" />
    </div>
  );
}

function InfoFormStep({ verifiedProfile, onReset }: { verifiedProfile: VerifiedSignupProfile; onReset: () => void }) {
  const [state, formAction, isPending] = useActionState(signUpAction, {
    success: false,
  } satisfies SignUpState);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isUsernameVerified, setIsUsernameVerified] = useState(false);

  const canSubmit = isEmailVerified && isUsernameVerified && !isPending;

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="typo-medium-14 text-gray-500">본인인증 완료</p>
            <h2 className="typo-bold-18 mt-1 text-black">인증된 본인정보</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="h-9 rounded-[10px] border-gray-300 bg-white px-4 text-black"
          >
            다시 인증
          </Button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <Label className="typo-medium-13 text-gray-500">이름</Label>
            <Input value={verifiedProfile.name} readOnly className="mt-2" />
          </div>
          <div>
            <Label className="typo-medium-13 text-gray-500">전화번호</Label>
            <Input value={maskPhoneNumber(verifiedProfile.phone)} readOnly className="mt-2" />
          </div>
          <div>
            <Label className="typo-medium-13 text-gray-500">생년월일</Label>
            <Input value={verifiedProfile.birthDate} readOnly className="mt-2" />
          </div>
          <div>
            <Label className="typo-medium-13 text-gray-500">성별</Label>
            <Input value={formatGenderLabel(verifiedProfile.gender)} readOnly className="mt-2" />
          </div>
        </div>
      </section>

      <input type="hidden" name="name" value={verifiedProfile.name} />
      <input type="hidden" name="phone" value={verifiedProfile.phone} />
      <input type="hidden" name="birthDate" value={verifiedProfile.birthDate} />
      <input type="hidden" name="gender" value={verifiedProfile.gender} />
      <input type="hidden" name="niceRequestNo" value={verifiedProfile.niceRequestNo} />
      <input type="hidden" name="niceWebTransactionId" value={verifiedProfile.niceWebTransactionId} />

      <EmailField onValidationChange={setIsEmailVerified} error={state.fieldErrors?.email} />

      <div className="w-full">
        <Label htmlFor="password" className="typo-medium-14 block font-semibold text-black">
          비밀번호
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="8~16자, 영문 대소문자/숫자/특수문자 중 2가지 이상 조합"
          className="typo-regular-14 rounded-none border-0 border-b border-gray-200 bg-transparent px-0 py-3 text-black placeholder:text-gray-400 focus-visible:border-black focus-visible:ring-0"
        />
        <FormMessage message={state.fieldErrors?.password} className="typo-regular-12 mt-2" />
      </div>

      <div className="w-full">
        <Label htmlFor="confirmPassword" className="typo-medium-14 block font-semibold text-black">
          비밀번호 확인
        </Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="typo-regular-14 rounded-none border-0 border-b border-gray-200 bg-transparent px-0 py-3 text-black placeholder:text-gray-400 focus-visible:border-black focus-visible:ring-0"
        />
      </div>

      <UsernameField onValidationChange={setIsUsernameVerified} error={state.fieldErrors?.username} />

      <div className="my-2 h-px w-full bg-gray-200" />

      <AgreementSection />

      <FormMessage message={state.fieldErrors?.nice} className="text-center" />
      <FormMessage message={state.error} className="text-center" />

      <Button
        type="submit"
        disabled={!canSubmit}
        className="typo-medium-16 mt-4 h-14 w-full rounded-[10px] bg-[#1E2A38] text-white hover:bg-[#2a3a4d] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "가입 중..." : "가입하기"}
      </Button>

      {(!isEmailVerified || !isUsernameVerified) && (
        <p className="text-center text-xs text-gray-500">
          {!isEmailVerified && !isUsernameVerified
            ? "이메일 인증과 닉네임 중복 확인이 필요합니다."
            : !isEmailVerified
              ? "이메일 인증이 필요합니다."
              : "닉네임 중복 확인이 필요합니다."}
        </p>
      )}
    </form>
  );
}

// --- Main ---

export function SignUpForm() {
  const funnel = useFunnel<SignUpSteps>({
    step: "본인인증",
    context: {},
  });
  return funnel.Render({
    본인인증: ({ history }) => (
      <VerificationStep onNext={(profile) => history.push("회원정보입력", { verifiedProfile: profile })} />
    ),
    회원정보입력: ({ context, history }) => (
      <InfoFormStep verifiedProfile={context.verifiedProfile} onReset={() => history.back()} />
    ),
  });
}
