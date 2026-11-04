import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./components/Nav";

export const metadata: Metadata = {
  title: "Gemini Pro Pixel · 卡密激活",
  description: "输入卡密和 Google 账号信息，系统自动为该账号开通 Gemini Pro。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="bg-aura" aria-hidden />
        <div className="bg-grain" aria-hidden />
        <Nav />
        <main className="shell">{children}</main>
        <footer className="footer shell" style={{ paddingBottom: 40 }}>
          <p>服务器不保存你的账号密码和 2FA 密钥，仅用于本次激活转发。请自行保存好账号信息。</p>
          <p style={{ marginTop: 6 }}>Gemini Pro Pixel · 由苏哲AI 提供激活服务</p>
        </footer>
      </body>
    </html>
  );
}
