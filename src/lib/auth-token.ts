type ShouldRefreshAuthTokenParams = {
  accessToken?: unknown;
  refreshToken?: unknown;
};

function decodeBase64UrlJson(value: string): unknown {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function getJwtPayload(accessToken: string): Record<string, unknown> | null {
  const [, payload] = accessToken.split(".");
  if (!payload) return null;

  try {
    const decoded = decodeBase64UrlJson(payload);
    return typeof decoded === "object" && decoded !== null ? (decoded as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function getJwtExpiresAtMs(accessToken: string): number | null {
  const exp = getJwtPayload(accessToken)?.exp;
  return typeof exp === "number" ? exp * 1000 : null;
}

export function getAccessTokenRoles(accessToken: string): string[] | null {
  const roles = getJwtPayload(accessToken)?.roles;
  if (!Array.isArray(roles) || !roles.every((role) => typeof role === "string")) {
    return null;
  }
  return roles;
}

export function shouldRefreshAuthToken({ accessToken, refreshToken }: ShouldRefreshAuthTokenParams): boolean {
  if (typeof refreshToken !== "string" || !refreshToken) return false;

  if (typeof accessToken === "string" && accessToken) {
    const expiresAt = getJwtExpiresAtMs(accessToken);
    if (expiresAt !== null) {
      return expiresAt <= Date.now();
    }
  }

  return false;
}
