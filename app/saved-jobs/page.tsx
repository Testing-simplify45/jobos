"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { MatchBadge } from "@/components/ui";

interface SavedRow {
  jobId: string;
  title: string;
  company: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  savedAt: string;
  matchScore: number | null;
}

export default function SavedJobsPage() {
  const [rows, setRows] = useState<SavedRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/saved-jobs");
    const data = await res.json();
    setRows(data.saved);
  }

  useEffect(() => {
    load();
  }, []);

  async function unsave(jobId: string) {
    await fetch("/api/saved-jobs", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId }),
    });
    setRows((r) => r?.filter((row) => row.jobId !== jobId) ?? null);
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="mb-1 font-mono text-[11px] uppercase tracking-wider text-accent">
              Watchlist
            </div>
            <h1 className="text-2xl font-semibold text-text-primary">Manage Your Opportunities</h1>
          </div>
        </div>

        <div className="overflow-hidden rounded-card border border-base-border">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-base-border bg-base-panel text-text-tertiary">
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">AI Match</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Salary</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Date Saved</th>
                <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(rows ?? []).map((row) => (
                <tr key={row.jobId} className="border-b border-base-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium text-text-primary">{row.title}</div>
                    <div className="text-text-secondary">
                      {row.company}
                      {row.location ? ` · ${row.location}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {row.matchScore !== null ? (
                      <MatchBadge score={row.matchScore} />
                    ) : (
                      <span className="text-text-tertiary">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {row.salaryMin && row.salaryMax
                      ? `$${row.salaryMin.toLocaleString()}–$${row.salaryMax.toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {new Date(row.savedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <a
                        href={`/jobs/${row.jobId}`}
                        className="rounded-md bg-accent px-3 py-1.5 text-[13px] font-medium text-base-bg hover:bg-accent-bright"
                      >
                        View
                      </a>
                      <button
                        onClick={() => unsave(row.jobId)}
                        className="rounded-md border border-base-border p-1.5 text-text-secondary hover:bg-base-panelAlt"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows && rows.length === 0 && (
            <div className="p-8 text-center text-[13px] text-text-tertiary">
              Nothing saved yet — save a role from Find Jobs to see it here.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
