import { postApiAuthLogin } from "@/apis/generated/api";
import { callRefreshApiSingleFlight } from "@/apis/refresh-token";
import { AUTH_SESSION_MAX_AGE_SEC } from "@/lib/auth-constants";
import { shouldRefreshAuthToken } from "@/lib/auth-token";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

/**
 * raw fetch 기반 토큰 리프레시.
 * - 성공: 새 accessToken + refreshToken 반환
 * - 인증 실패(401/400): 토큰 삭제 + error 설정 → 클라이언트에서 signOut 유도
 * - 서버 장애: 기존 토큰 보존 → 다음 요청에서 재시도
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, accessToken: undefined, error: "RefreshTokenError" };
  }

  const result = await callRefreshApiSingleFlight(token.refreshToken);

  switch (result.status) {
    case "success":
      return {
        ...token,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        tokenIssuedAt: Date.now(),
        error: undefined,
      };
    case "auth_failed":
      // refresh token 자체가 무효 → 토큰 삭제, 클라이언트에서 signOut 유도
      return {
        ...token,
        accessToken: undefined,
        refreshToken: undefined,
        error: "RefreshTokenError",
      };
    case "server_error":
      // 서버 일시 장애 → 기존 토큰 보존, 다음 요청에서 재시도
      return {
        ...token,
        error: "RefreshTemporaryError",
      };
  }
}

// Naver 커스텀 Provider
const NaverProvider = {
  id: "naver",
  name: "Naver",
  type: "oauth" as const,
  authorization: {
    url: "https://nid.naver.com/oauth2.0/authorize",
    params: { scope: "" },
  },
  token: "https://nid.naver.com/oauth2.0/token",
  userinfo: "https://openapi.naver.com/v1/nid/me",
  profile(profile: {
    response: {
      id: string;
      name?: string;
      email?: string;
      profile_image?: string;
    };
  }) {
    return {
      id: profile.response.id,
      name: profile.response.name,
      email: profile.response.email,
      image: profile.response.profile_image,
    };
  },
  clientId: process.env.NAVER_CLIENT_ID ?? "",
  clientSecret: process.env.NAVER_CLIENT_SECRET ?? "",
};

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("이메일과 비밀번호를 입력해주세요.");
        }

        try {
          const res = await postApiAuthLogin({
            email: credentials.email,
            password: credentials.password,
          });

          if (!res.data.accessToken || !res.data.refreshToken || !res.data.userId) {
            throw new Error("서버 응답에 필수 인증 정보가 누락되었습니다.");
          }

          return {
            id: String(res.data.userId),
            name: res.data.username ?? "",
            email: res.data.email ?? "",
            roles: res.data.userInfo?.roles,
            accessToken: res.data.accessToken,
            refreshToken: res.data.refreshToken,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "로그인에 실패했습니다.";
          throw new Error(message);
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID ?? "",
      clientSecret: process.env.KAKAO_CLIENT_SECRET ?? "",
    }),
    NaverProvider,
  ],

  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },

  session: {
    strategy: "jwt",
    maxAge: AUTH_SESSION_MAX_AGE_SEC,
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // 최초 로그인 시 user 정보를 token에 저장
      if (user) {
        token.id = user.id;
        token.roles = user.roles;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.tokenIssuedAt = Date.now();

        if (account) {
          token.provider = account.provider;
          token.providerAccountId = account.providerAccountId;
        }
        return token;
      }

      // 클라이언트에서 useSession().update({ user: { name } }) 호출 시
      // 프로필 변경(닉네임 등)을 JWT에 반영
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") {
          token.name = session.user.name;
        }
        if (typeof session.user.email === "string") {
          token.email = session.user.email;
        }
        return token;
      }

      // 이후 호출: accessToken이 이미 만료된 경우에만 리프레시
      if (
        shouldRefreshAuthToken({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        })
      ) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.roles = token.roles;
      }
      session.accessToken = token.accessToken;
      // refreshToken은 서버(JWT) 내부에서만 사용 — 클라이언트에 노출하지 않음
      session.error = token.error;
      return session;
    },

    async signIn({ account }) {
      if (account?.provider !== "credentials") {
        // TODO: 백엔드 소셜 로그인 API 호출
        // 구현 전까지 소셜 로그인은 허용하되, 토큰이 없는 상태임에 유의
      }
      return true;
    },
  },

  debug: process.env.NODE_ENV === "development",
};

/**
 * 비즈니스 계열 역할. 이 중 하나라도 보유하면 비즈니스 사용자로 취급한다.
 */
const BUSINESS_ROLES = [
  "ROLE_BUSINESS",
  "ROLE_TRAILNTALE_BUSINESS",
  "ROLE_COMMUNITY_BUSINESS",
  "ROLE_PICK_UP_BUSINESS",
] as const;

/**
 * 세션의 roles에 비즈니스 계열 역할이 하나라도 포함되어 있는지 확인한다.
 */
export function hasBusinessRole(roles: string[] | undefined): boolean {
  return roles?.some((role) =>
    (BUSINESS_ROLES as readonly string[]).includes(role),
  ) ?? false;
}

/**
 * 서버 컴포넌트에서 인증 토큰을 가져오는 헬퍼 함수.
 * getServerSession 호출 시 jwt callback이 트리거되어 만료된 토큰은 자동 갱신됨.
 * @returns accessToken 또는 undefined
 */
export async function getAuthToken(): Promise<string | undefined> {
  const session = await getServerSession(authOptions);
  return session?.accessToken;
}
