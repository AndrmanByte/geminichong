import type { ApiResult } from "./plan";

export type { ApiResult };

type Action = "precheck" | "submit" | "status";

/**
 * 调用自有后端代理（绝不直连 suzhe.ai）。
 * 超时/异常统一归一为 result_unknown，交由调用方处理（禁止对 submit 自动重试）。
 */
export async function callApi(action: Action, payload: Record<string, unknown>): Promise<ApiResult> {
  try {
    const res = await fetch(`/api/gemini-pixel/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let data: ApiResult = {};
    try {
      data = (await res.json()) as ApiResult;
    } catch {
      return { result_unknown: true, http_status: res.status };
    }
    if (data.http_status == null) data.http_status = res.status;
    return data;
  } catch {
    return { result_unknown: true, http_status: 0 };
  }
}
