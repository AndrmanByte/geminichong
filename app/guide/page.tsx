import Link from "next/link";
import { Reveal } from "../components/Reveal";
import { GuideFigure } from "./GuideFigure";

export const metadata = {
  title: "Gemini Pro 激活教程 · Gemini Pro Pixel",
  description: "准备账号 → 准备 2FA 密钥 → 提交激活 → 核实订阅，四步图文讲清。",
};

const STEPS = ["准备账号", "准备 2FA 密钥", "提交激活", "核实订阅"];

const PREP = [
  { t: "账号没有任何 Gemini 订阅", d: "包括家庭组里的订阅；在家庭组里请先退出。" },
  { t: "已关闭所有付款资料", d: "打开 Google 付款设置，删除或关闭全部付款资料。操作前请自行确认影响。" },
  { t: "账号地区受支持，已通过年龄验证", d: "否则无法开通。" },
  { t: "密码能直接登录", d: "不支持找回密码。" },
  { t: "尽量用老号", d: "新注册账号很容易触发 Google 风控，建议用老号或购买老号。" },
];

const SUBMIT_FIELDS = [
  ["CDK 卡密", "你的卡密。输入后会显示识别到的套餐（6 / 12 / 24 个月）。"],
  ["邮箱账号", "第 1 步准备好的 Google 账号。"],
  ["登录密码", "当前能直接登录的密码。"],
  ["2FA 密钥", "第 2 步的密钥（16 位以上），不是 6 位验证码。"],
  ["辅助邮箱", "可选，没有就留空。"],
];

const SHOWN = [
  ["已提交 / 排队中", "一切正常，任务已收到，正在排队。"],
  ["正在激活", "一切正常，系统正在为你开通，等结果即可。"],
  ["激活成功", "完成了，去做第 4 步核实订阅。"],
  ["失败", "页面会写原因，对照常见提示改正后，用同一张卡密重新提交。"],
];

const COMMON = [
  ["处理中（十几分钟还没结果）", "一切正常，系统还在处理。不要重复提交，稍后到「卡密查询」看结果。"],
  ["登录：2FA 密钥错误（验证码不匹配）", "密钥填错，或填成了 6 位验证码 / 备用码。按第 2 步重新拿密钥再提交。"],
  ["未找到身份验证器选项", "没开身份验证器，或开了没点「验证」，新的 2FA 没生效。回到 2.4 点「验证」。"],
  ["未检测到结账弹窗", "账号还有订阅，尚未完全取消。"],
  ["失败，需要手机接码", "谷歌账号已被风控。"],
  ["登录：缺少号码上下文，无法获取短信", "谷歌账号已被风控，请更换账号重试。"],
  ["登录：登录无法验证归属", "谷歌账号已被风控，请更换账号重试。"],
  ["Google 页面：我们无法验证您的身份", "谷歌账号已被风控，请更换账号。见下方截图说明。"],
];

const TWOFA_STEPS = [
  {
    t: "2.1 进入 Google 账户设置",
    d: "① 在 Gemini 页面点右上角头像（PRO 标识旁边）。② 点「Manage your Google Account」（管理你的 Google 账号）。",
    imgs: [
      { src: "/geminiverify/step1.webp", alt: "Gemini 页面右上角头像" },
      { src: "/geminiverify/step2.webp", alt: "Manage your Google Account" },
    ],
  },
  {
    t: "2.2 找到「身份验证器」",
    d: "③ 左侧点「Security & sign-in」（安全性与登录）。④ 往下找到「身份验证器」，点进去。",
    imgs: [
      { src: "/geminiverify/step3.webp", alt: "Security & sign-in" },
      { src: "/geminiverify/step4.webp", alt: "身份验证器 Authenticator" },
    ],
  },
  {
    t: "2.3 设置新的身份验证器，拿到密钥",
    d: "⑤ 点「+ 设置身份验证器」。⑥ 弹出二维码时点「无法扫描？」显示密钥。⑦ 把密钥粘贴到 2fa.run 获取验证码，并复制无空格的密钥保存好。",
    imgs: [
      { src: "/geminiverify/step5.webp", alt: "设置身份验证器" },
      { src: "/geminiverify/step6.webp", alt: "二维码弹窗与无法扫描" },
      { src: "/geminiverify/step7.webp", alt: "2fa.run 复制密钥" },
    ],
  },
  {
    t: "2.4 输入验证码，点「验证」",
    d: "⑧ 把 2fa.run 显示的 6 位验证码填进去，点「验证」。务必点验证，新 2FA 才生效。⑨ 看到「两步验证」已启用即完成。",
    imgs: [
      { src: "/geminiverify/step8.webp", alt: "输入验证码" },
      { src: "/geminiverify/step9.webp", alt: "两步验证已启用" },
    ],
  },
] as const;

export default function GuidePage() {
  return (
    <>
      <Reveal className="hero">
        <span className="eyebrow"><span className="dot" /> 约 10 分钟准备</span>
        <h1 style={{ marginTop: 22 }}>
          <span className="gradient-text">Gemini Pro 激活教程</span>
        </h1>
        <p className="sub">适用于 6 / 12 / 24 个月卡密。照着 4 步做：准备约 10 分钟，提交后等待十几分钟。</p>
      </Reveal>

      <Reveal delay={80}>
        <div className="benefits" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
          {STEPS.map((s, i) => (
            <div className="benefit" key={s}>
              <div className="k">STEP {i + 1}</div>
              <div className="v" style={{ fontSize: 15 }}>{s}</div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* 开始前 */}
      <section className="section">
        <Reveal className="section-title"><span className="num">◆</span><h2>开始前，你需要这 3 样东西</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <table className="tbl">
              <thead><tr><th>东西</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td>CDK 卡密</td><td>购买后拿到的卡密，以 <code>Gemini6monpixel-</code> / <code>Gemini12monpixel-</code> / <code>Gemini24monpixel-</code> 开头。</td></tr>
                <tr><td>Google 账号和密码</td><td>要开通 Gemini 的账号，要求见第 1 步。</td></tr>
                <tr><td>2FA 密钥</td><td>16 位以上的字母数字，不是 6 位验证码。怎么拿见第 2 步。</td></tr>
              </tbody>
            </table>
            <div className="callout info">Gemini Pro（6 / 12 / 24 个月）+ YouTube Premium 1 个月；权益包含 Gemini 4 Argon 模型。Antigravity 能否使用取决于你的谷歌账户。</div>
          </div>
        </Reveal>
      </section>

      {/* 01 准备账号 */}
      <section className="section">
        <Reveal className="section-title"><span className="num">1</span><h2>准备账号</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <p style={{ color: "var(--text-dim)", marginBottom: 16, fontSize: 14 }}>逐条打勾，全部满足再往下走。大部分失败都出在这里。</p>
            <div className="checks">
              {PREP.map((c) => (
                <div className="check" key={c.t}>
                  <span className="ic"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg></span>
                  <div><div className="t">{c.t}</div><div className="d">{c.d}</div></div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 02 准备 2FA */}
      <section className="section" id="twofa">
        <Reveal className="section-title"><span className="num">2</span><h2>准备 2FA 密钥</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
              2FA 密钥长这样：<code>ABCDEFGHIJKLMNOPQRSTUVWXYZ234567</code>（16 位以上，只有 A–Z 和 2–7）。
              不是 6 位验证码，也不是 8 位备用码。
            </p>
            <table className="tbl" style={{ marginTop: 16 }}>
              <thead><tr><th>你的情况</th><th>怎么做</th></tr></thead>
              <tbody>
                <tr><td>购买的账号</td><td>发货格式一般是 <code>账户---密码---辅助邮箱---2FA</code>，最后一段就是密钥，直接用，跳到第 3 步。</td></tr>
                <tr><td>自己的账号</td><td>没有 2FA，或有 2FA 但拿不到密钥：按下面 4 小步换一个新的。</td></tr>
              </tbody>
            </table>

            <div className="timeline" style={{ marginTop: 24 }}>
              {TWOFA_STEPS.map((s, i) => (
                <div className="tl-item" key={s.t}>
                  <span className="tl-dot">{i + 1}</span>
                  <h3>{s.t}</h3>
                  <p style={{ color: "var(--text-dim)", fontSize: 14 }}>{s.d}</p>
                  <div className="guide-figure-row">
                    {s.imgs.map((img) => (
                      <GuideFigure key={img.src} src={img.src} alt={img.alt} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 03 提交 */}
      <section className="section">
        <Reveal className="section-title"><span className="num">3</span><h2>提交激活</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <table className="tbl">
              <thead><tr><th>输入框</th><th>填什么</th></tr></thead>
              <tbody>{SUBMIT_FIELDS.map(([a, b]) => (<tr key={a}><td>{a}</td><td>{b}</td></tr>))}</tbody>
            </table>
            <p style={{ color: "var(--text-dim)", fontSize: 14, marginTop: 14 }}>
              多个账号：切到「批量导入」，每行一个，格式 <code>卡密----邮箱----密码----2FA密钥</code>。
            </p>
            <h3 style={{ fontSize: 16, marginTop: 22, marginBottom: 12 }}>提交后会看到什么</h3>
            <div className="callout info">显示「处理中」= 一切正常。系统通常需要十几分钟，请耐心等待、不要重复提交。可关闭页面，稍后到「卡密查询」看结果。</div>
            <table className="tbl" style={{ marginTop: 14 }}>
              <thead><tr><th>页面显示</th><th>意思</th></tr></thead>
              <tbody>{SHOWN.map(([a, b]) => (<tr key={a}><td>{a}</td><td>{b}</td></tr>))}</tbody>
            </table>
            <div className="btn-row">
              <Link href="/" className="btn">去激活页提交 ›</Link>
              <Link href="/query" className="btn ghost">卡密查询</Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 04 核实 */}
      <section className="section">
        <Reveal className="section-title"><span className="num">4</span><h2>核实订阅</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 14 }}>显示「激活成功」后，做完这 3 件事。</p>
            <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-dim)", fontSize: 14, lineHeight: 2 }}>
              <li>打开 Google Play 订阅页，查看 Gemini 订阅和时间（6 / 12 / 24 个月都在这里看）。</li>
              <li>再打开一次 Google 付款设置，确认付款资料已关闭。</li>
              <li>修改密码或 2FA，保证账号只有你自己能登录。</li>
            </ol>
            <div className="callout info">订阅日期当天、下次续订一个月后？这是正常的——Google 按月自动续订，不代表只开通了 1 个月。</div>
          </div>
        </Reveal>
      </section>

      {/* 常见提示 */}
      <section className="section">
        <Reveal className="section-title"><span className="num">?</span><h2>常见提示</h2></Reveal>
        <Reveal delay={60}>
          <div className="card">
            <table className="tbl">
              <thead><tr><th>页面提示</th><th>意思 / 怎么办</th></tr></thead>
              <tbody>{COMMON.map(([a, b]) => (<tr key={a}><td>{a}</td><td>{b}</td></tr>))}</tbody>
            </table>
            <h3 style={{ fontSize: 16, marginTop: 28, marginBottom: 8 }}>看到「我们无法验证您的身份」= 账号被风控</h3>
            <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
              登录 Google 时出现下面页面，说明该账号已被风控，无法用于激活。请换另一个账号（建议老号），再用同一张卡密重新提交。
            </p>
            <GuideFigure src="/geminiverify/risk-verify.webp" alt="Google：我们无法验证您的身份" />
          </div>
        </Reveal>
      </section>
    </>
  );
}
