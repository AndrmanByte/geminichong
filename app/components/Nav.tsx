"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "激活" },
  { href: "/query", label: "卡密查询" },
  { href: "/guide", label: "图文教程" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <Link href="/" className="nav-brand" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="nav-logo" aria-hidden />
        <span>Gemini Pro Pixel</span>
      </Link>
      <div className="nav-links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className={pathname === l.href ? "active" : ""}>
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
