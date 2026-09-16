"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Search,
  Bookmark,
  Send,
  Contact,
  FileText,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/find-jobs", label: "Find Jobs", icon: Search },
  { href: "/saved-jobs", label: "Saved Jobs", icon: Bookmark },
  { href: "/applications", label: "Applications", icon: Send },
  { href: "/master-profile", label: "Master Profile", icon: Contact },
];

const STUDIO_ITEMS = [
  { href: "/resume-studio", label: "Resume", icon: FileText },
  { href: "/cover-letter", label: "Cover Letter", icon: Mail },
  { href: "/ai-hub", label: "AI Hub", icon: Sparkles },
];

interface SidebarProps {
  aiCreditsUsed: number;
  aiCreditsTotal: number;
  planLabel: string;
}

export default function Sidebar({ aiCreditsUsed, aiCreditsTotal, planLabel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col justify-between border-r border-base-border bg-base-bg px-3 py-4">
      <div>
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim font-mono text-sm text-accent">
            {">_"}
          </span>
          <span className="font-mono text-[15px] font-semibold text-text-primary">
            Career<span className="text-accent">OS</span>
          </span>
        </div>

        <nav className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-accent-dim text-accent"
                    : "text-text-secondary hover:bg-base-panel hover:text-text-primary"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 px-2.5 font-mono text-[10px] uppercase tracking-wider text-text-tertiary">
          Studios
        </div>
        <nav className="mt-1 flex flex-col gap-0.5">
          {STUDIO_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                  active
                    ? "bg-accent-dim text-accent"
                    : "text-text-secondary hover:bg-base-panel hover:text-text-primary"
                }`}
              >
                <Icon size={16} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="rounded-card border border-base-border bg-base-panel p-3">
        <div className="mb-2 flex items-center gap-1.5 text-[13px] font-medium text-warn">
          <Zap size={14} />
          {planLabel}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-base-border">
          <div
            className="h-full bg-warn"
            style={{ width: `${Math.min(100, (aiCreditsUsed / aiCreditsTotal) * 100)}%` }}
          />
        </div>
        <div className="mt-1.5 text-[11px] text-text-tertiary">
          {aiCreditsUsed} / {aiCreditsTotal} AI credits used
        </div>
      </div>
    </aside>
  );
}
