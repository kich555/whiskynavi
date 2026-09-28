import { ApiError } from "@/apis/errors";
import { btAdminBottleImage, btAdminExportDownload } from "@/apis/generated/blind-tasting";
import { withToken } from "@/apis/mutator";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) return new Response("다시 로그인해 주세요.", { status: 401, headers });
  if (!session.user.roles?.includes("ROLE_ADMIN"))
    return new Response("관리자 권한이 필요합니다.", { status: 403, headers });
  const { kind, id } = await params;
  if (!["export", "image"].includes(kind) || !/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0)
    return new Response("파일을 찾을 수 없습니다.", { status: 404, headers });
  try {
    const r = await (kind === "export" ? btAdminExportDownload : btAdminBottleImage)(
      Number(id),
      withToken(session.accessToken),
    );
    const body: unknown = r.data;
    if (!(body instanceof Blob)) throw new Error("Invalid file response");
    const type = r.headers.get("content-type") ?? "application/octet-stream";
    return new Response(body, {
      headers: {
        ...headers,
        "Content-Type": type,
        "Content-Disposition":
          kind === "export"
            ? `attachment; filename="blind-tasting-${id}.${type.includes("csv") ? "csv" : "xlsx"}"`
            : "inline",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return new Response(e instanceof ApiError ? e.userMessage : "파일을 불러오지 못했습니다. 다시 시도해 주세요.", {
      status: e instanceof ApiError ? e.status : 502,
      headers,
    });
  }
}
