"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Reveal } from "./components/Reveal";
import { StatusCard } from "./components/StatusCard";
import { Logo } from "./components/Logo";
import { callApi, type ApiResult } from "@/lib/client";
import { detectPlan } from "@/lib/plan";

const BENEFITS = [
  { k: "订阅周期", v: "6 / 12 / 24 个月" },
  { k: "附赠", v: "YouTube Premium 1 个月" },
  { k: "模型权益", v: "Gemini 4 Argon" },
];

const CHECKS = [
  { t: "账号没有订阅", d: "无任何 Gemini 订阅并已退出家庭组；地区受支持、已过年龄验证。建议用老号。" },
  { t: "已关闭付款资料", d: "提前关闭 Google 付款资料，操作前请自行确认影响。" },
  { t: "准备好 2FA 密钥", d: "填 Base32 密钥（16 位以上，A–Z 和 2–7），不是 6 位验证码，也不支持 8 位备用码。" },
  { t: "密码能直接登录", d: "不支持找回密码，请确认密码可用；辅助邮箱可以不填。" },
];

export default function ActivatePage() {
  const [tab, setTab] = useState<"single" | "batch">("single");

  return (
    <>
      {/* Hero */}
      <Reveal className="hero" delay={0}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <Logo size={64} />
        </div>
        <span className="eyebrow">
          <span className="dot" /> 质保订阅成功
        </span>
        <h1 style={{ marginTop: 22 }}>
          <span className="gradient-text">Gemini Pro Pixel</span>
          <br />
          一次兑换，自动开通
        </h1>
        <p className="sub">输入卡密和 Google 账号信息，系统自动为该账号开通 Gemini Pro。</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="benefits">
          {BENEFITS.map((b) => (
            <div className="benefit" key={b.k}>
              <div className="k">{b.k}</div>
              <div className="v">{b.v}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 教程入口 */}
      <Reveal delay={120} className="section">
        <div className="card lift" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h3 style={{ fontSize: 17 }}>第一次激活？先看图文教程</h3>
            <p style={{ color: "var(--text-dim)", marginTop: 6, fontSize: 14 }}>
              准备账号 → 准备 2FA 密钥 → 提交激活 → 核实订阅，四步讲清。
            </p>
          </div>
          <Link href="/guide" className="btn ghost">查看教程 ›</Link>
        </div>
      </Reveal>

      {/* 提交前确认 */}
      <section className="section">
        <Reveal className="section-title">
          <span className="num">!</span>
          <h2>提交前，请确认这 4 件事</h2>
        </Reveal>
        <Reveal delay={60}>
          <div className="checks">
            {CHECKS.map((c) => (
              <div className="check" key={c.t}>
                <span className="ic">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                </span>
                <div>
                  <div className="t">{c.t}</div>
                  <div className="d">{c.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="callout">
            提交之后网络超时不代表失败，请勿重复提交，到「卡密查询」看结果；激活成功后请核实订阅，并及时修改密码与 2FA。
          </div>
        </Reveal>
      </section>

      {/* 表单区 */}
      <section className="section">
        <Reveal>
          <Tabs tab={tab} onChange={setTab} />
          <div className="card">{tab === "single" ? <SingleForm /> : <BatchForm />}</div>
        </Reveal>
      </section>
    </>
  );
}

function Tabs({ tab, onChange }: { tab: "single" | "batch"; onChange: (t: "single" | "batch") => void }) {
  return (
    <div className="tabs">
      <span className="glider" style={{ width: tab === "single" ? 92 : 92, transform: `translateX(${tab === "single" ? 0 : 92}px)` }} />
      <button className={tab === "single" ? "on" : ""} onClick={() => onChange("single")}>单个激活</button>
      <button className={tab === "batch" ? "on" : ""} onClick={() => onChange("batch")}>批量导入</button>
    </div>
  );
}

/* ---------------- 单个激活 ---------------- */
function SingleForm() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twofa, setTwofa] = useState("");
  const [recovery, setRecovery] = useState("");

  const [precheck, setPrecheck] = useState<ApiResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<ApiResult | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const plan = useMemo(() => detectPlan(code), [code]);
  const canSubmit = precheck?.success === true && precheck?.can_submit === true && precheck?.pending_confirmation === false;

  async function onPrecheck() {
    if (!code.trim() || checking) return;
    setChecking(true);
    setSubmitResult(null);
    setConfirmed(false);
    const r = await callApi("precheck", { code: code.trim() });
    setPrecheck(r);
    setChecking(false);
  }

  async function onSubmit() {
    if (!canSubmit || !confirmed || submitting) return;
    setSubmitting(true);
    const r = await callApi("submit", {
      code: code.trim(),
      email: email.trim(),
      password,
      twofa,
      recovery_email: recovery.trim(),
    });
    setSubmitResult(r);
    setSubmitting(false);
  }

  return (
    <>
      {/* Step 1 */}
      <div className="section-title" style={{ marginTop: 0 }}>
        <span className="num">1</span>
        <h2>输入卡密</h2>
      </div>
      <div className="field">
        <div className="label">
          <span>CDK 卡密</span>
          <span className="hint">以 Gemini6/12/24monpixel- 开头</span>
        </div>
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setPrecheck(null); setSubmitResult(null); }}
          placeholder="Gemini12monpixel-…"
          spellCheck={false}
          autoComplete="off"
        />
        {plan && (
          <span className="plan-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            已识别套餐 · {plan.label}
          </span>
        )}
        <p className="field-note">已经提交过？到「卡密查询」输入原卡密即可查看进度和失败原因。</p>
      </div>
      <button className="btn" onClick={onPrecheck} disabled={!code.trim() || checking}>
        {checking ? <><span className="spinner" /> 验证中…</> : "验证卡密"}
      </button>

      {precheck && !canSubmit && <StatusCard result={precheck} />}
      {precheck && canSubmit && (
        <div className="result tone-success">
          <div className="result-head">
            <strong>卡密有效，可以提交激活</strong>
            <span className="status-pill tone-success">Ready</span>
          </div>
          <p className="msg">请继续填写 Google 账号信息，确认无误后提交。</p>
        </div>
      )}

      {/* Step 2 */}
      {canSubmit && (
        <div style={{ marginTop: 32 }}>
          <div className="section-title" style={{ marginTop: 0 }}>
            <span className="num">2</span>
            <h2>输入 Google 账号信息</h2>
          </div>
          <div className="field">
            <div className="label"><span>邮箱账号</span></div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@gmail.com" autoComplete="off" spellCheck={false} />
          </div>
          <div className="field">
            <div className="label"><span>登录密码</span></div>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="账号密码" autoComplete="new-password" />
          </div>
          <div className="field">
            <div className="label">
              <span>2FA 密钥（Base32）</span>
              <Link href="/guide#twofa">如何获取？</Link>
            </div>
            <input value={twofa} onChange={(e) => setTwofa(e.target.value)} placeholder="粘贴 2FA 密钥（A-Z、2-7），不是 6 位验证码" autoComplete="off" spellCheck={false} />
          </div>
          <div className="field">
            <div className="label"><span>辅助邮箱（可选）</span></div>
            <input value={recovery} onChange={(e) => setRecovery(e.target.value)} placeholder="可留空" autoComplete="off" spellCheck={false} />
          </div>

          {/* Step 3 */}
          <div className="section-title">
            <span className="num">3</span>
            <h2>提交激活</h2>
          </div>
          <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer", fontSize: 14, color: "var(--text-dim)" }}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, flex: "none" }} />
            <span>我已确认账号信息无误，且理解提交后不要重复操作、超时请到「卡密查询」查看结果。</span>
          </label>
          <div className="btn-row">
            <button className="btn block" onClick={onSubmit} disabled={!confirmed || submitting || !email || !password || !twofa}>
              {submitting ? <><span className="spinner" /> 提交中…</> : "提交激活"}
            </button>
          </div>
        </div>
      )}

      {submitResult && (
        <>
          <StatusCard result={submitResult} />
          {(submitResult.status === "Pending" || submitResult.success === true || submitResult.result_unknown) && (
            <div className="btn-row">
              <Link href={`/query?code=${encodeURIComponent(code.trim())}`} className="btn ghost block">前往卡密查询，查看进度 ›</Link>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------------- 批量导入 ---------------- */
interface BatchRow {
  line: number;
  code: string;
  email: string;
  result?: ApiResult;
  stage: "waiting" | "prechecking" | "submitting" | "done" | "skipped";
  note?: string;
}

function BatchForm() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [running, setRunning] = useState(false);

  async function run() {
    if (running) return;
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const parsed: BatchRow[] = lines.map((l, i) => {
      const parts = l.split("----").map((p) => p.trim());
      return {
        line: i + 1,
        code: parts[0] ?? "",
        email: parts[1] ?? "",
        stage: "waiting" as const,
      };
    });
    setRows(parsed);
    setRunning(true);

    for (let i = 0; i < parsed.length; i++) {
      const raw = lines[i].split("----").map((p) => p.trim());
      const [code, email, password, twofa, recovery] = raw;
      if (!code || !email || !password || !twofa) {
        update(i, { stage: "skipped", note: "字段不完整（格式：卡密----邮箱----密码----2FA密钥）" });
        continue;
      }
      update(i, { stage: "prechecking" });
      const pc = await callApi("precheck", { code });
      const canSubmit = pc.success === true && pc.can_submit === true && pc.pending_confirmation === false;
      if (!canSubmit) {
        update(i, { stage: "done", result: pc, note: "不可提交，已跳过" });
        continue;
      }
      update(i, { stage: "submitting" });
      const sub = await callApi("submit", { code, email, password, twofa, recovery_email: recovery ?? "" });
      update(i, { stage: "done", result: sub });
      // 简单退避，避免共享出口限额
      await new Promise((r) => setTimeout(r, 800));
    }
    setRunning(false);
  }

  function update(idx: number, patch: Partial<BatchRow>) {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  }

  return (
    <>
      <div className="section-title" style={{ marginTop: 0 }}>
        <span className="num">≡</span>
        <h2>批量导入</h2>
      </div>
      <div className="field">
        <div className="label">
          <span>每行一个账号</span>
          <span className="hint">格式：卡密----邮箱----密码----2FA密钥（辅助邮箱可选再加 ----）</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Gemini12monpixel-xxxx----a@gmail.com----密码----ABCDEFGH23456789\nGemini6monpixel-yyyy----b@gmail.com----密码----ABCDEFGH23456789"}
          spellCheck={false}
          rows={6}
        />
        <p className="field-note">系统会逐条先验证、再提交；超时或失败的条目不会自动重试，请到「卡密查询」核对。</p>
      </div>
      <button className="btn block" onClick={run} disabled={running || !text.trim()}>
        {running ? <><span className="spinner" /> 处理中…</> : "开始批量提交"}
      </button>

      {rows.length > 0 && (
        <div style={{ marginTop: 20, display: "grid", gap: 10 }}>
          {rows.map((r, i) => (
            <div className="result" key={i} style={{ marginTop: 0 }}>
              <div className="result-head">
                <span style={{ color: "var(--text-faint)", fontSize: 13 }}>#{r.line}</span>
                <strong style={{ fontSize: 14 }}>{r.email || r.code || "(空行)"}</strong>
                <span className="status-pill">{stageText(r.stage)}</span>
              </div>
              {r.note && <p className="reason">{r.note}</p>}
              {r.result && <StatusCard result={r.result} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function stageText(s: BatchRow["stage"]): string {
  switch (s) {
    case "waiting": return "等待";
    case "prechecking": return "验证中";
    case "submitting": return "提交中";
    case "done": return "完成";
    case "skipped": return "已跳过";
  }
}
