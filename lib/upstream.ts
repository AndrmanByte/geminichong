import { NextResponse } from "next/server";

/**
 * 苏哲AI Gemini Pro Pixel CDK 激活接口基址。
 * 这组接口使用请求体中的 `code`（兑换码）作为凭据，不使用 API Key。
 */
const BASE = "https://suzhe.ai/api/gemini-pixel";

export type Action = "precheck" | "submit" | "status";

const ALLOWED: Record<Action, true> = {
  precheck: true,
  submit: true,
  status: true,
};

/**
 * 统一的上游响应结构。注意：这里刻意不记录任何请求体（含 code / 密码 / 2FA 密钥）。
 */
export interface UpstreamResult {
  // 本次「接口调用」是否成功拿到可解析结果（不等于激活成功）
  ok: boolean;
  // 结果不可确定（超时 / 断网 / 非 JSON / 网关异常）。此时前端必须转入查询流程，禁止自动重发 submit。
  resultUnknown: boolean;
  httpStatus: number;
  // 透传的业务字段（success/status/can_submit/pending_confirmation/refunded/sub_expiry/message/reason...）
  data: Record<string, unknown>;
}

/**
 * 向上游发起一次请求。严格遵循文档：
 * - POST + application/json
 * - 连接 10s / 读取 75s 超时
 * - 不跟随重定向
 * - 不做任何网络层自动重试（尤其 submit）
 * - 不记录请求体与异常详情（可能含敏感资料）
 */
export async function callUpstream(
  action: Action,
  payload: Record<string, unknown>
): Promise<UpstreamResult> {
  if (!ALLOWED[action]) {
    return { ok: false, resultUnknown: true, httpStatus: 0, data: {} };
  }

  const controller = new AbortController();
  // 读取超时（文档建议 ~75s）。连接超时由平台 fetch 兜底。
  const timer = setTimeout(() => controller.abort(), 75_000);

  try {
    const res = await fetch(`${BASE}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "manual",
      signal: controller.signal,
      cache: "no-store",
    });

    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      // 非 JSON 响应：结果未知
      return { ok: false, resultUnknown: true, httpStatus: res.status, data: {} };
    }

    if (!data || typeof data !== "object") {
      return { ok: false, resultUnknown: true, httpStatus: res.status, data: {} };
    }

    const obj = data as Record<string, unknown>;

    // 同时判断 HTTP 状态与业务 success 字段
    if (res.status !== 200 || obj.success !== true) {
      // 非 200 时，缺失字段不代表允许重试；交给前端按状态码展示
      return {
        ok: false,
        resultUnknown: res.status >= 500 || res.status === 0,
        httpStatus: res.status,
        data: obj,
      };
    }

    return { ok: true, resultUnknown: false, httpStatus: res.status, data: obj };
  } catch {
    // 网络超时 / 连接中断 / abort：结果未知，禁止自动重发
    return { ok: false, resultUnknown: true, httpStatus: 0, data: {} };
  } finally {
    clearTimeout(timer);
  }
}

/** 把上游结果转为给前端的 JSON 响应，保持原始 HTTP 语义。 */
export function toResponse(result: UpstreamResult): NextResponse {
  const status = result.httpStatus && result.httpStatus > 0 ? result.httpStatus : 200;
  return NextResponse.json(
    {
      ok: result.ok,
      result_unknown: result.resultUnknown,
      http_status: result.httpStatus,
      ...result.data,
    },
    { status: result.resultUnknown ? 200 : status }
  );
}
