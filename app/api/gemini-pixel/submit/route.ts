import { NextRequest } from "next/server";
import { callUpstream, toResponse } from "@/lib/upstream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 提交激活。重要约束：
 * - 仅转发文档公开字段：code / email / password / twofa / recovery_email
 * - 绝不在网络层自动重试（超时/异常都交给前端转查询）
 * - 不记录请求体
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return toResponse({ ok: false, resultUnknown: false, httpStatus: 400, data: { message: "请求体必须是 JSON" } });
  }

  const code = typeof body.code === "string" ? body.code.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const twofa = typeof body.twofa === "string" ? body.twofa : "";
  const recoveryEmail = typeof body.recovery_email === "string" ? body.recovery_email.trim() : "";

  if (!code) return bad("请填写兑换码");
  if (!email || email.length > 254) return bad("请填写有效邮箱（≤254 字符）");
  if (!password || password.length > 1024) return bad("请填写登录密码（≤1024 字符）");

  // 2FA 为 Base32 密钥，服务端会去空白与 = 填充并转大写；这里先做基本清洗与长度校验
  const cleaned2fa = twofa.replace(/\s|=/g, "").toUpperCase();
  if (cleaned2fa.length < 16 || cleaned2fa.length > 256) {
    return bad("2FA 密钥应为 16–256 位 Base32 密钥（不是 6 位验证码）");
  }

  // 只传公开字段；recovery_email 不需要时省略
  const payload: Record<string, unknown> = {
    code,
    email,
    password,
    twofa: cleaned2fa,
  };
  if (recoveryEmail) payload.recovery_email = recoveryEmail;

  const result = await callUpstream("submit", payload);
  return toResponse(result);
}

function bad(message: string) {
  return toResponse({ ok: false, resultUnknown: false, httpStatus: 400, data: { message } });
}
