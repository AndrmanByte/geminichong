"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Reveal } from "../components/Reveal";
import { StatusCard } from "../components/StatusCard";
import { callApi, type ApiResult } from "@/lib/client";
import { statusMeta } from "@/lib/plan";

const POLL_NORMAL = 12_000; // 10–15s
const POLL_BACKOFF = 45_000; // 429 / 5xx / 异常时退避 30–60s

function QueryInner() {
  const params = useSearchParams();
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useCallback(
    async (c: string) => {
      const target = c.trim();
      if (!target) return;
      setLoading(true);
      const r = await callApi("status", { code: target });
      setResult(r);
      setLoading(false);

      const meta = statusMeta(r.status);
      const shouldPoll = meta.polling && !r.result_unknown && r.http_status !== 429;
      const needBackoff = r.result_unknown || r.http_status === 429 || (r.http_status ?? 0) >= 500;
      setAutoPoll(meta.polling);

      if (timer.current) clearTimeout(timer.current);
      if (meta.polling) {
        const delay = shouldPoll ? POLL_NORMAL : POLL_BACKOFF;
        timer.current = setTimeout(() => query(target), needBackoff ? POLL_BACKOFF : delay);
      }
    },
    []
  );

  // URL 带 code 时自动查询一次
  useEffect(() => {
    const c = params.get("code");
    if (c) {
      setCode(c);
      query(c);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPoll() {
    if (timer.current) clearTimeout(timer.current);
    setAutoPoll(false);
  }

  const meta = statusMeta(result?.status);
  const pct = ringPct(result?.status);

  return (
    <>
      <Reveal className="hero" delay={0}>
        <span className="eyebrow"><span className="dot" /> 实时进度</span>
        <h1 style={{ marginTop: 22 }}>
          <span className="gradient-text">卡密查询</span>
        </h1>
        <p className="sub">输入原卡密即可查看激活进度和失败原因，无需任务编号。刷新或换设备后仍可继续查询。</p>
      </Reveal>

      <Reveal delay={80} className="section">
        <div className="card">
          <div className="field">
            <div className="label"><span>CDK 卡密</span></div>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Gemini12monpixel-…"
              spellCheck={false}
              autoComplete="off"
              onKeyDown={(e) => { if (e.key === "Enter") { stopPoll(); query(code); } }}
            />
          </div>
          <div className="btn-row">
            <button className="btn" onClick={() => { stopPoll(); query(code); }} disabled={!code.trim() || loading}>
              {loading ? <><span className="spinner" /> 查询中…</> : "查询进度"}
            </button>
            {autoPoll && (
              <button className="btn ghost" onClick={stopPoll}>停止自动刷新</button>
            )}
          </div>

          {result && (
            <div style={{ display: "flex", gap: 24, alignItems: "center", marginTop: 24, flexWrap: "wrap" }}>
              <ProgressRing pct={pct} tone={meta.tone} label={meta.text} />
              <div style={{ flex: 1, minWidth: 240 }}>
                <StatusCard result={result} />
                {autoPoll && (
                  <p className="field-note" style={{ marginTop: 10 }}>
                    正在每 10–15 秒自动刷新（遇到繁忙会自动放慢）。可关闭页面，稍后再查。
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="callout info" style={{ marginTop: 20 }}>
            一直显示「待确认 / 处理中」属于正常现象，通常十几分钟。请勿重复提交或换码再试；长时间无结果请保留卡密联系支持。
          </div>
        </div>
      </Reveal>
    </>
  );
}

function ringPct(status: ApiResult["status"]): number {
  switch (status) {
    case "Submitting": return 20;
    case "Pending": return 40;
    case "Running": return 75;
    case "Success": return 100;
    case "Failed": return 100;
    default: return 8;
  }
}

function ProgressRing({ pct, tone, label }: { pct: number; tone: string; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={{ position: "relative", width: 136, height: 136, flex: "none" }}>
      <svg width="136" height="136" className="ring">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--brand-1)" />
            <stop offset="100%" stopColor="var(--brand-2)" />
          </linearGradient>
        </defs>
        <circle className="track" cx="68" cy="68" r={r} fill="none" strokeWidth="8" />
        <circle className="bar" cx="68" cy="68" r={r} fill="none" strokeWidth="8" strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{pct}%</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

export default function QueryPage() {
  return (
    <Suspense fallback={<div className="hero"><p className="sub">加载中…</p></div>}>
      <QueryInner />
    </Suspense>
  );
}
