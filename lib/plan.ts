export interface Plan {
  months: 6 | 12 | 24;
  label: string;
  prefix: string;
}

const PLANS: Plan[] = [
  { months: 6, label: "6 个月", prefix: "Gemini6monpixel-" },
  { months: 12, label: "12 个月", prefix: "Gemini12monpixel-" },
  { months: 24, label: "24 个月", prefix: "Gemini24monpixel-" },
];

/** 根据兑换码前缀识别套餐周期（仅前端展示用，最终以服务端识别为准）。 */
export function detectPlan(code: string): Plan | null {
  const c = code.trim();
  for (const p of PLANS) {
    if (c.toLowerCase().startsWith(p.prefix.toLowerCase())) return p;
  }
  return null;
}

export type TaskStatus =
  | "Ready"
  | "Submitting"
  | "Pending"
  | "Running"
  | "Success"
  | "Failed"
  | string;

export interface ApiResult {
  ok?: boolean;
  result_unknown?: boolean;
  http_status?: number;
  success?: boolean;
  status?: TaskStatus;
  message?: string;
  reason?: string;
  can_submit?: boolean;
  pending_confirmation?: boolean;
  refunded?: boolean;
  sub_expiry?: string | null;
}

/** 状态展示元信息：中文文案 + 语义色 + 是否仍需轮询。 */
export function statusMeta(status: TaskStatus | undefined): {
  text: string;
  tone: "idle" | "progress" | "success" | "danger" | "warn";
  polling: boolean;
} {
  switch (status) {
    case "Ready":
      return { text: "可提交", tone: "idle", polling: false };
    case "Submitting":
      return { text: "待确认", tone: "warn", polling: true };
    case "Pending":
      return { text: "排队中", tone: "progress", polling: true };
    case "Running":
      return { text: "正在激活", tone: "progress", polling: true };
    case "Success":
      return { text: "激活成功", tone: "success", polling: false };
    case "Failed":
      return { text: "激活失败", tone: "danger", polling: false };
    default:
      return { text: status ? String(status) : "未知", tone: "idle", polling: false };
  }
}

/** HTTP 状态码 → 用户可读提示（文档「HTTP 错误与重试规则」）。 */
export function httpHint(code: number | undefined): string | null {
  switch (code) {
    case 400:
      return "请求格式或字段不符合要求";
    case 404:
      return "兑换码无效、不可用或不存在（不代表此前任务未受理）";
    case 405:
      return "请求方法错误";
    case 409:
      return "该账号存在进行中的任务或状态冲突";
    case 413:
      return "请求体过大";
    case 429:
      return "请求过于频繁，请稍后再查询（不要重新提交）";
    case 503:
      return "服务暂时无法确认结果，请保留卡密稍后查询";
    default:
      if (code && code >= 500) return "服务暂时异常，请保留卡密稍后查询";
      return null;
  }
}
