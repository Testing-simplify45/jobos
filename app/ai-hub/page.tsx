"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Check, Hourglass } from "lucide-react";

interface AppRow {
  id: string;
  jobId: string;
  status: string;
  title: string;
  company: string;
}

export default function AiHubPage() {
  const [apps, setApps] = useState<AppRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => {
        const preparing = (data.applications ?? []).filter((a: AppRow) => a.status === "PREPARING");
        setApps(preparing);
        if (preparing.length > 0) setSelected(preparing[0].id);
      });
  }, []);

  const current = apps.find((a) => a.id === selected);

  async function generateCoverLetter(jobId: string) {
    setGenerating(true);
    setError(null);
    const res = await fetch(`/api/jobs/${jobId}/cover-letter`, { method: "POST" });
    setGenerating(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Cover letter generation failed");
      return;
    }
    const data = await res.json();
    setCoverLetter(data.content);
  }

  async function markApplied() {
    if (!current) return;
    const confirmed = window.confirm(
      `Submit the application to ${current.company} yourself on their site, then confirm here to mark it as applied. This does not submit anything automatically.`
    );
    if (!confirmed) return;

    await fetch(`/api/applications/${current.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPLIED" }),
    });
    setApps((a) => a.filter((x) => x.id !== current.id));
    setSelected(null);
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <h1 className="mb-1 text-2xl font-semibold text-text-primary">AI Application Hub</h1>
        <p className="mb-6 text-[13px] text-text-secondary">
          Every application is prepared here for your review — nothing is ever submitted
          automatically. You review the cover letter and answers, then apply on the company's
          site yourself and confirm below.
        </p>

        {apps.length === 0 ? (
          <div className="rounded-card border border-dashed border-base-border p-8 text-center text-[13px] text-text-tertiary">
            Nothing in preparation — click "Initialize AI Application" on a job's detail page to
            start one.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            <div>
              {apps.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setSelected(a.id);
                    setCoverLetter(null);
                  }}
                  className={`mb-2 w-full rounded-card border p-3 text-left ${
                    selected === a.id
                      ? "border-accent bg-accent-dim"
                      : "border-base-border bg-base-panel hover:bg-base-panelAlt"
                  }`}
                >
                  <div className="text-[13px] font-medium text-text-primary">{a.title}</div>
                  <div className="text-[12px] text-text-secondary">{a.company}</div>
                </button>
              ))}
            </div>

            <div className="col-span-2">
              {current && (
                <>
                  <h2 className="mb-1 text-lg font-semibold text-text-primary">
                    {current.company} · {current.title}
                  </h2>
                  <p className="mb-4 text-[13px] text-text-secondary">Application Readiness Check</p>

                  {error && (
                    <div className="mb-4 rounded-card border border-warn/40 bg-warn-dim px-4 py-3 text-[13px] text-warn">
                      {error}
                    </div>
                  )}

                  <div className="rounded-card border border-base-border bg-base-panel p-4">
                    <ChecklistItem done label="Master Profile" note="Evidence base ready" />
                    <ChecklistItem
                      done={!!coverLetter}
                      label="Cover Letter"
                      note={coverLetter ? "Generated — review below" : "Not generated yet"}
                      action={
                        !coverLetter && (
                          <button
                            onClick={() => generateCoverLetter(current.jobId)}
                            disabled={generating}
                            className="rounded-md border border-accent/40 px-3 py-1 text-[12px] text-accent hover:bg-accent-dim disabled:opacity-60"
                          >
                            {generating ? "Generating…" : "Generate"}
                          </button>
                        )
                      }
                    />
                  </div>

                  {coverLetter && (
                    <div className="mt-4 rounded-card border border-base-border bg-base-panel p-4">
                      <h3 className="mb-2 text-[13px] font-semibold text-text-primary">
                        Tailored Cover Letter — review before using
                      </h3>
                      <p className="whitespace-pre-line text-[13px] text-text-secondary">
                        {coverLetter}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={markApplied}
                    className="mt-4 w-full rounded-md bg-accent py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright"
                  >
                    I've applied on the company's site — mark as Applied
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ChecklistItem({
  done,
  label,
  note,
  action,
}: {
  done: boolean;
  label: string;
  note: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-base-border py-3 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full ${
            done ? "bg-accent-dim text-accent" : "bg-warn-dim text-warn"
          }`}
        >
          {done ? <Check size={13} /> : <Hourglass size={13} />}
        </span>
        <div>
          <div className="text-[13px] font-medium text-text-primary">{label}</div>
          <div className="text-[12px] text-text-tertiary">{note}</div>
        </div>
      </div>
      {action}
    </div>
  );
}
