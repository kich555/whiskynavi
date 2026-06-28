import { postApiUserNiceidResult, postApiUserNiceidSession } from "@/apis/generated/api";
import { useEffect, useReducer } from "react";
import {
  DEV_MOCK_PROFILE,
  type DuplicateAccountInfo,
  getNiceChannelName,
  type NiceMessage,
  type VerifiedSignupProfile,
} from "../nice";

// --- State & Actions ---

type NiceState = {
  verifiedProfile: VerifiedSignupProfile | null;
  requestNo: string | null;
  sessionId: string;
  isStarting: boolean;
  error: string | null;
  duplicateAccount: DuplicateAccountInfo | null;
};

type NiceAction =
  | { type: "START_VERIFICATION" }
  | { type: "SESSION_CREATED"; requestNo: string }
  | { type: "VERIFICATION_SUCCESS"; profile: VerifiedSignupProfile }
  | { type: "VERIFICATION_ERROR"; error: string }
  | { type: "DUPLICATE_ACCOUNT"; account: DuplicateAccountInfo }
  | { type: "RESET" }
  | { type: "DEV_BYPASS" };

function niceReducer(state: NiceState, action: NiceAction): NiceState {
  switch (action.type) {
    case "START_VERIFICATION":
      return { ...state, isStarting: true, error: null };
    case "SESSION_CREATED":
      return { ...state, isStarting: false, requestNo: action.requestNo };
    case "VERIFICATION_SUCCESS":
      return {
        ...state,
        verifiedProfile: action.profile,
        error: null,
        duplicateAccount: null,
      };
    case "VERIFICATION_ERROR":
      return { ...state, isStarting: false, error: action.error };
    case "DUPLICATE_ACCOUNT":
      return { ...state, duplicateAccount: action.account };
    case "RESET":
      return {
        ...state,
        verifiedProfile: null,
        error: null,
        duplicateAccount: null,
      };
    case "DEV_BYPASS":
      return {
        ...state,
        verifiedProfile: DEV_MOCK_PROFILE,
        error: null,
        duplicateAccount: null,
      };
  }
}

// --- Hook ---

type UseNiceVerificationOptions = {
  onSuccess?: (profile: VerifiedSignupProfile) => void;
};

export function useNiceVerification(options?: UseNiceVerificationOptions) {
  const [state, dispatch] = useReducer(niceReducer, {
    verifiedProfile: null,
    requestNo: null,
    sessionId: crypto.randomUUID(),
    isStarting: false,
    error: null,
    duplicateAccount: null,
  });

  useEffect(() => {
    const channel = new BroadcastChannel(getNiceChannelName(state.sessionId));

    channel.onmessage = async (event: MessageEvent<NiceMessage>) => {
      const data = event.data;

      if (data.type === "nice-verification-success") {
        if (!state.requestNo) {
          dispatch({
            type: "VERIFICATION_ERROR",
            error: "인증 세션 정보가 없습니다. 다시 시도해주세요.",
          });
          return;
        }
        const { webTransactionId } = data;
        try {
          const { data: result } = await postApiUserNiceidResult({
            requestNo: state.requestNo,
            webTransactionId,
          });

          const payload = result;
          if (!payload?.name || !payload?.phone || !payload?.birthDate) {
            throw new Error("인증 결과에서 필수 정보를 가져오지 못했습니다.");
          }

          const profile: VerifiedSignupProfile = {
            niceRequestNo: state.requestNo,
            niceWebTransactionId: webTransactionId,
            name: payload.name,
            phone: payload.phone,
            birthDate: payload.birthDate,
            gender: (payload.gender ?? "N") as VerifiedSignupProfile["gender"],
          };

          dispatch({ type: "VERIFICATION_SUCCESS", profile });
          options?.onSuccess?.(profile);
        } catch (error) {
          dispatch({
            type: "VERIFICATION_ERROR",
            error: error instanceof Error ? error.message : "본인인증 결과 조회에 실패했습니다. 다시 시도해주세요.",
          });
        }
      }

      if (data.type === "nice-verification-error") {
        dispatch({
          type: "VERIFICATION_ERROR",
          error: data.error ?? "본인인증에 실패했습니다. 다시 시도해주세요.",
        });
      }
    };

    return () => channel.close();
  }, [state.sessionId, state.requestNo, options]);

  async function startVerification() {
    dispatch({ type: "START_VERIFICATION" });

    try {
      const returnUrl = `${window.location.origin}/nice/callback?niceSessionId=${state.sessionId}`;
      // const returnUrl = `https://6db8-2a09-bac0-1001-40f-00-20b-b8.ngrok-free.app/nice/callback?niceSessionId=${state.sessionId}`;
      const { data } = await postApiUserNiceidSession({ returnUrl });
      if (!data.authUrl || !data.requestNo) {
        throw new Error("본인인증 시작 정보를 받아오지 못했습니다.");
      }

      dispatch({ type: "SESSION_CREATED", requestNo: data.requestNo });

      const popup = window.open(data.authUrl, "nice-auth", "width=430,height=720");

      if (!popup) {
        const tab = window.open(data.authUrl, "_blank");
        if (!tab) {
          throw new Error("팝업이 차단되었습니다. 브라우저 설정에서 팝업을 허용한 후 다시 시도해 주세요.");
        }
      }
    } catch (error) {
      dispatch({
        type: "VERIFICATION_ERROR",
        error: error instanceof Error ? error.message : "본인인증을 시작하지 못했습니다. 다시 시도해주세요.",
      });
    }
  }

  return {
    ...state,
    startVerification,
    reset: () => dispatch({ type: "RESET" }),
    devBypass: () => {
      dispatch({ type: "DEV_BYPASS" });
      options?.onSuccess?.(DEV_MOCK_PROFILE);
    },
  };
}
