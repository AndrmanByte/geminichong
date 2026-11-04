"use client";

import type { ApiResult } from "@/lib/plan";
import { statusMeta, httpHint } from "@/lib/plan";

/**
 * 统一的状态结果卡片。根据 status / result_unknown / http_status 展示语义化结果。
 * 程序判断以 status / can_submit / pending_confirmation / refunded 为准，message 仅展示。
 */
export function StatusCard({ result }: { result: ApiResult }) {
  // 结果未知（超时/断网/网关异常）
  if (result.result_unknown) {
    const hint = httpHint(result.http_status);
    return (
      <div className="result tone-warn">
        <div className="result-head">
          <span className="breathe" />
          <strong>结果待确认</strong>
          <span className="status-pill tone-warn">保留卡密</span>
        </div>
        <p className="msg">
          本次请求未能确认结果（可能超时或服务繁忙），这<strong>不代表失败</strong>。
          请保留原卡密，稍后到「卡密查询」查看进度，切勿重复提交。
        </p>
        {hint && <p className="reason">服务提示：{hint}</p>}
      </div>
    );
  }

  const meta = statusMeta(result.status);
  const isSuccess = result.status === "Success";

  // 非成功且接口本身报错（success !== true 且无业务状态）
  if (!result.status && result.success !== true) {
    const hint = httpHint(result.http_status);
    return (
      <div className="result tone-danger">
        <div className="result-head">
          <strong>请求未通过</strong>
          {result.http_status ? <span className="status-pill tone-danger">HTTP {result.http_status}</span> : null}
        </div>
        {result.message && <p className="msg">{result.message}</p>}
        {hint && <p className="reason">{hint}</p>}
      </div>
    );
  }

  return (
    <div className={`result tone-${meta.tone}`}>
      <div className="result-head">
        {isSuccess ? (
          <svg className="check-draw" viewBox="0 0 60 60" aria-hidden>
            <circle cx="30" cy="30" r="26" />
            <path d="M18 31 l8 8 l16 -18" />
          </svg>
        ) : meta.polling ? (
          <span className="breathe" />
        ) : null}
        <strong>{meta.text}</strong>
        <span className={`status-pill tone-${meta.tone}`}>{result.status ?? "—"}</span>
      </div>

      {result.message && <p className="msg">{result.message}</p>}

      {result.status === "Success" && result.sub_expiry ? (
        <p className="msg">
          到期日期：<strong>{result.sub_expiry}</strong>
        </p>
      ) : null}

      {result.status === "Failed" && result.reason ? (
        <p className="reason">失败原因：{result.reason}</p>
      ) : null}

      {result.pending_confirmation ? (
        <p className="reason">当前为待确认状态，请勿重新提交；保留卡密稍后查询。</p>
      ) : null}

      {result.status === "Failed" && result.refunded && result.can_submit ? (
        <p className="reason" style={{ color: "var(--warn)" }}>
          激活额度已退回，可修正资料后由你手动重新提交（系统不会自动重试）。
        </p>
      ) : null}
    </div>
  );
}
