"use client";

import { useEffect, useState } from "react";
import { Search, Bell, Filter, Play, Bookmark } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { StatCard, MatchBadge } from "@/components/ui";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface DashboardData {
  stats: {
    totalApplied: number;
    interviewing: number;
    avgMatch: number;
    successRate: number;
    savedCount: number;
  };
  topMatches: {
    jobId: string;
    title: string;
    company: string;
    location: string | null;
    score: number;
    skills: string[];
    salaryMin: number | null;
    salaryMax: number | null;
    postedAt: string | null;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard");
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        {/* Top bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex w-full max-w-md items-center gap-2 rounded-md border border-base-border bg-base-panel px-3 py-2 text-[13px] text-text-tertiary">
            <Search size={15} />
            Search anything
            <kbd className="ml-auto rounded border border-base-border px-1.5 py-0.5 font-mono text-[11px]">
              ⌘K
            </kbd>
          </div>
          <div className="flex items-center gap-4">
            <Bell size={18} className="text-text-secondary" />
            <div className="text-right">
              <div className="text-[13px] font-medium text-text-primary">Marcus Lee</div>
              <div className="text-[11px] text-text-tertiary">marcus@careeros.app</div>
            </div>
          </div>
        </div>

        {/* Header row */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-accent">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Live · Mission Control
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">Good evening, Marcus</h1>
            <p className="mt-1 text-[13px] text-text-secondary">
              Your AI is scanning new roles across your connected sources.
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-md border border-base-border px-3 py-2 text-[13px] text-text-secondary hover:bg-base-panel">
              <Filter size={14} /> Filters
            </button>
            <button className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright">
              <Play size={13} /> Run Auto-Apply
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-card border border-warn/40 bg-warn-dim px-4 py-3 text-[13px] text-warn">
            {error} — make sure DEV_USER_ID is set and the DB has seed data.
          </div>
        )}

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-4 gap-4">
          <StatCard
            label="Total Applied"
            value={data ? String(data.stats.totalApplied) : "—"}
            icon={Search}
          />
          <StatCard
            label="Interviews"
            value={data ? String(data.stats.interviewing) : "—"}
            icon={Bell}
          />
          <StatCard
            label="AI Match Avg"
            value={data ? `${data.stats.avgMatch}%` : "—"}
            icon={Filter}
          />
          <StatCard
            label="Success Rate"
            value={data ? `${data.stats.successRate}%` : "—"}
            icon={Play}
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Top matching roles */}
          <div className="col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-text-primary">Top Matching Roles</h2>
              <a href="/find-jobs" className="text-[13px] text-accent">
                View all →
              </a>
            </div>

            <div className="flex flex-col gap-3">
              {(data?.topMatches ?? []).map((job) => (
                <div
                  key={job.jobId}
                  className="rounded-card border border-base-border bg-base-panel p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[15px] font-semibold text-text-primary">
                        {job.title}
                      </div>
                      <div className="text-[13px] text-text-secondary">
                        {job.company}
                        {job.location ? ` · ${job.location}` : ""}
                      </div>
                    </div>
                    <MatchBadge score={job.score} />
                  </div>

                  <div className="mt-3 flex gap-2">
                    {job.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-base-border px-2 py-0.5 text-[12px] text-text-secondary"
                      >
                        {s}
                      </span>
                    ))}
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="rounded-md border border-base-border px-2 py-0.5 text-[12px] text-text-tertiary">
                        ${job.salaryMin?.toLocaleString()}–${job.salaryMax?.toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={`/jobs/${job.jobId}`}
                      className="flex-1 rounded-md bg-accent py-2 text-center text-[13px] font-medium text-base-bg hover:bg-accent-bright"
                    >
                      Prepare Application
                    </a>
                    <button className="rounded-md border border-base-border p-2 text-text-secondary hover:bg-base-panelAlt">
                      <Bookmark size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {data && data.topMatches.length === 0 && (
                <div className="rounded-card border border-dashed border-base-border p-6 text-center text-[13px] text-text-tertiary">
                  No matches yet — run a Greenhouse/Lever sync or add jobs to see AI matches here.
                </div>
              )}
            </div>

            {/* Application activity chart */}
            <div className="mt-6 rounded-card border border-base-border bg-base-panel p-4">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-text-primary">
                  Application Activity
                </h3>
                <span className="text-[12px] text-text-tertiary">last 8 weeks</span>
              </div>
              <p className="mb-3 text-[12px] text-text-secondary">Applied vs. interviews booked</p>
              <ActivityChart />
            </div>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            <div className="rounded-card border border-base-border bg-base-panel p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Upcoming</h3>
              {(data as any)?.upcoming?.length ? (
                <div className="flex flex-col gap-3">
                  {(data as any).upcoming.map((u: any) => (
                    <div key={u.id} className="flex gap-3">
                      <div className="w-10 shrink-0 font-mono text-[11px] text-text-tertiary">
                        {u.dateLabel}
                      </div>
                      <div>
                        <div className="text-[13px] font-medium text-text-primary">
                          {u.title}
                        </div>
                        <div className="text-[12px] text-text-secondary">{u.subtitle}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[13px] text-text-tertiary">
                  No screenings or interviews scheduled yet.
                </p>
              )}
            </div>

            <div className="rounded-card border border-base-border bg-base-panel p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">Activity Log</h3>
              {(data as any)?.activityLog?.length ? (
                <ul className="flex flex-col gap-2 text-[13px] text-text-secondary">
                  {(data as any).activityLog.map((a: any, i: number) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-[13px] text-text-tertiary">
                  Activity will appear here once you save, apply, or sync jobs.
                </p>
              )}
            </div>

            <div className="rounded-card border border-accent/40 bg-base-panel p-4">
              <h3 className="mb-3 text-[14px] font-semibold text-text-primary">AI Assistant</h3>
              <p className="text-[13px] text-text-secondary">
                Scanning your connected sources for new matches since you last logged in.
              </p>
              <a
                href="/ai-hub"
                className="mt-3 block rounded-md border border-base-border px-3 py-2 text-center text-[13px] text-text-primary hover:bg-base-panelAlt"
              >
                Ask AI what to apply next →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ActivityChart() {
  // TODO: wire to /api/dashboard/activity (weekly applied vs interview counts)
  const placeholder = Array.from({ length: 8 }, (_, i) => ({ week: `W${i + 1}`, applied: 0, interviews: 0 }));
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={placeholder}>
        <CartesianGrid stroke="#1e2528" vertical={false} />
        <XAxis dataKey="week" stroke="#5a6a6c" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="#5a6a6c" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: "#0f1416", border: "1px solid #1e2528", fontSize: 12 }}
        />
        <Line type="monotone" dataKey="applied" stroke="#2dd4bf" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="interviews"
          stroke="#f5a623"
          strokeWidth={2}
          strokeDasharray="3 3"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
