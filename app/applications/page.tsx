"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface AppRow {
  id: string;
  status: string;
  title: string;
  company: string;
  appliedAt: string | null;
  createdAt: string;
}

const COLUMNS = [
  { key: "PREPARING", label: "Preparing" },
  { key: "APPLIED", label: "Applied" },
  { key: "ASSESSMENT", label: "Assessment" },
  { key: "INTERVIEW", label: "Interviewing" },
  { key: "OFFER", label: "Offer" },
];

const NEXT_STATUS: Record<string, string | null> = {
  PREPARING: "APPLIED",
  APPLIED: "ASSESSMENT",
  ASSESSMENT: "INTERVIEW",
  INTERVIEW: "OFFER",
  OFFER: null,
};

export default function ApplicationsPage() {
  const [apps, setApps] = useState<AppRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/applications");
    const data = await res.json();
    setApps(data.applications);
  }

  useEffect(() => {
    load();
  }, []);

  async function advance(app: AppRow) {
    const next = NEXT_STATUS[app.status];
    if (!next) return;

    // Moving into APPLIED is the actual submit checkpoint — confirm rather
    // than silently flipping status, since this is meant to represent a
    // real, reviewed submission.
    if (next === "APPLIED") {
      const confirmed = window.confirm(
        `Mark "${app.title}" at ${app.company} as submitted? This records it as an actual application.`
      );
      if (!confirmed) return;
    }

    await fetch(`/api/applications/${app.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    load();
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <h1 className="mb-6 text-2xl font-semibold text-text-primary">Application Pipeline</h1>

        <div className="grid grid-cols-5 gap-4">
          {COLUMNS.map((col) => {
            const items = (apps ?? []).filter((a) => a.status === col.key);
            return (
              <div key={col.key}>
                <div className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-tertiary">
                  {col.label}
                  <span className="rounded-full bg-base-panel px-1.5 py-0.5 text-text-secondary">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {items.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-card border border-base-border bg-base-panel p-3"
                    >
                      <div className="text-[13px] font-medium text-text-primary">{app.title}</div>
                      <div className="mb-2 text-[12px] text-text-secondary">{app.company}</div>
                      <div className="text-[11px] text-text-tertiary">
                        {app.appliedAt
                          ? `Applied ${new Date(app.appliedAt).toLocaleDateString()}`
                          : `Created ${new Date(app.createdAt).toLocaleDateString()}`}
                      </div>
                      {NEXT_STATUS[app.status] && (
                        <button
                          onClick={() => advance(app)}
                          className="mt-2 w-full rounded-md border border-accent/40 py-1 text-[12px] text-accent hover:bg-accent-dim"
                        >
                          Move to {COLUMNS.find((c) => c.key === NEXT_STATUS[app.status])?.label}
                        </button>
                      )}
                    </div>
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-card border border-dashed border-base-border p-4 text-center text-[12px] text-text-tertiary">
                      Nothing here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
