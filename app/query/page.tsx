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
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [initialCode, setInitialCode] = useState<string | null>(null);

  useEffect(() => {
    const c = params.get("code");
    if (c) setInitialCode(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="tabs">
          <span className="glider" style={{ width: 92, transform: `translateX(${tab === "single" ? 0 : 92}px)` }} />
          <button className={tab === "single" ? "on" : ""} onClick={() => setTab("single")}>单个查询</button>
          <button className={tab === "batch" ? "on" : ""} onClick={() => setTab("batch")}>批量查询</button>
        </div>
        <div className="card">{tab === "single" ? <SingleQuery initialCode={initialCode} /> : <BatchQuery />}</div>
      </Reveal>
    </>
  );
}

/* ---------------- 单个查询（带自动轮询） ---------------- */
function SingleQuery({ initialCode }: { initialCode: string | null }) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useCallback(async (c: string) => {
    const target = c.trim();
    if (!target) return;
    setLoading(true);
    const r = await callApi("status", { code: target });
    setResult(r);
    setLoading(false);

    const meta = statusMeta(r.status);
    const needBackoff = r.result_unknown || r.http_status === 429 || (r.http_status ?? 0) >= 500;
    setAutoPoll(meta.polling);

    if (timer.current) clearTimeout(timer.current);
    if (meta.polling) {
      timer.current = setTimeout(() => query(target), needBackoff ? POLL_BACKOFF : POLL_NORMAL);
    }
  }, []);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      query(initialCode);
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  function stopPoll() {
    if (timer.current) clearTimeout(timer.current);
    setAutoPoll(false);
  }

  const meta = statusMeta(result?.status);
  const pct = ringPct(result?.status);

  return (
    <>
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
        {autoPoll && <button className="btn ghost" onClick={stopPoll}>停止自动刷新</button>}
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
    </>
  );
}

/* ---------------- 批量查询（逐条顺序查，避免并发刷查） ---------------- */
interface BatchRow {
  code: string;
  result?: ApiResult;
  stage: "waiting" | "querying" | "done";
}

function BatchQuery() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    if (running) return;
    const codes = Array.from(
      new Set(text.split("\n").map((l) => l.trim()).filter(Boolean))
    );
    if (codes.length === 0) return;
    const init: BatchRow[] = codes.map((c) => ({ code: c, stage: "waiting" }));
    setRows(init);
    setRunning(true);

    for (let i = 0; i < codes.length; i++) {
      setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, stage: "querying" } : r)));
      const r = await callApi("status", { code: codes[i] });
      setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, stage: "done", result: r } : row)));
      // 顺序查询 + 退避，避免共享出口限额；遇到繁忙放慢
      const slow = r.result_unknown || r.http_status === 429 || (r.http_status ?? 0) >= 500;
      if (i < codes.length - 1) await new Promise((res) => setTimeout(res, slow ? 2000 : 900));
    }
    setRunning(false);
  }

  return (
    <>
      <div className="field">
        <div className="label">
          <span>CDK 卡密（每行一个）</span>
          <span className="hint">自动去重；逐条顺序查询</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Gemini12monpixel-xxxx\nGemini6monpixel-yyyy\nGemini24monpixel-zzzz"}
          spellCheck={false}
          rows={6}
        />
        <p className="field-note">批量查询为一次性查询（不自动轮询），需要最新进度时再点一次「查询全部」。</p>
      </div>
      <button className="btn block" onClick={run} disabled={running || !text.trim()}>
        {running ? <><span className="spinner" /> 查询中…</> : "查询全部"}
      </button>

      {rows.length > 0 && (
        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          {rows.map((r, i) => {
            const meta = statusMeta(r.result?.status);
            return (
              <div className="result" key={r.code} style={{ marginTop: 0 }}>
                <div className="result-head">
                  <span style={{ color: "var(--text-faint)", fontSize: 13 }}>#{i + 1}</span>
                  <strong style={{ fontSize: 14, wordBreak: "break-all" }}>{r.code}</strong>
                  <span className={`status-pill tone-${meta.tone}`}>
                    {r.stage === "querying" ? "查询中" : r.stage === "waiting" ? "等待" : meta.text}
                  </span>
                </div>
                {r.result && <StatusCard result={r.result} />}
              </div>
            );
          })}
        </div>
      )}

      <div className="callout info" style={{ marginTop: 20 }}>
        为遵守「相同出口共享限额、避免并发刷查」的建议，批量查询按顺序逐条进行，不做自动轮询。进行中的任务请稍后再次点击查询。
      </div>
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
