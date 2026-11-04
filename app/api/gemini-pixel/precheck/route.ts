import { NextRequest } from "next/server";
import { callUpstream, toResponse } from "@/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return toResponse({ ok: false, resultUnknown: false, httpStatus: 400, data: { message: "请求体必须是 JSON" } });
  }

  const code = (body as Record<string, unknown>)?.code;
  if (typeof code !== "string" || code.trim() === "") {
    return toResponse({ ok: false, resultUnknown: false, httpStatus: 400, data: { message: "缺少兑换码 code" } });
  }

  const result = await callUpstream("precheck", { code: code.trim() });
  return toResponse(result);
}
