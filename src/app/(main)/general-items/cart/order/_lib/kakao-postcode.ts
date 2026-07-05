const KAKAO_POSTCODE_SCRIPT_SRC = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

export type KakaoPostcodeData = {
  zonecode?: string;
  address?: string;
  roadAddress?: string;
  jibunAddress?: string;
  userSelectedType?: "R" | "J";
  bname?: string;
  buildingName?: string;
  apartment?: "Y" | "N";
};

type KakaoPostcodeConstructor = new (params: { oncomplete: (data: KakaoPostcodeData) => void }) => {
  open: () => void;
};

declare global {
  interface Window {
    daum?: {
      Postcode?: KakaoPostcodeConstructor;
    };
  }
}

let kakaoPostcodeScriptPromise: Promise<KakaoPostcodeConstructor> | null = null;

export function loadKakaoPostcodeScript(): Promise<KakaoPostcodeConstructor> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("브라우저에서만 주소 검색을 사용할 수 있습니다."));
  }

  if (window.daum?.Postcode) {
    return Promise.resolve(window.daum.Postcode);
  }

  if (kakaoPostcodeScriptPromise) return kakaoPostcodeScriptPromise;

  kakaoPostcodeScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = KAKAO_POSTCODE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.daum?.Postcode) {
        resolve(window.daum.Postcode);
      } else {
        kakaoPostcodeScriptPromise = null;
        reject(new Error("주소 검색 서비스를 불러오지 못했습니다."));
      }
    };
    script.onerror = () => {
      kakaoPostcodeScriptPromise = null;
      reject(new Error("주소 검색 서비스를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });

  return kakaoPostcodeScriptPromise;
}

export function resolvePostcodeAddress(data: KakaoPostcodeData): string {
  const baseAddress =
    data.address ||
    (data.userSelectedType === "J" ? data.jibunAddress || data.roadAddress : data.roadAddress || data.jibunAddress) ||
    "";

  if (data.userSelectedType !== "R") return baseAddress;

  const extraAddressParts = [
    data.bname && /[동로가]$/u.test(data.bname) ? data.bname : "",
    data.buildingName && data.apartment === "Y" ? data.buildingName : "",
  ].filter(Boolean);

  return [baseAddress, extraAddressParts.length > 0 ? `(${extraAddressParts.join(", ")})` : ""]
    .filter(Boolean)
    .join(" ");
}
