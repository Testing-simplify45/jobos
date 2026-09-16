"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface Resume {
  id: string;
  label: string;
  content: string | null;
  createdAt: string;
}

export default function ResumeStudioPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [label, setLabel] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/resumes")
      .then((r) => r.json())
      .then((data) => setResumes(data.resumes ?? []));
  }, []);

  async function save() {
    if (!label || !content) return;
    setSaving(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, content }),
    });
    setSaving(false);
    if (res.ok) {
      const data = await res.json();
      setResumes((r) => [data.resume, ...r]);
      setLabel("");
      setContent("");
    }
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <h1 className="mb-1 text-2xl font-semibold text-text-primary">Resume Studio</h1>
        <p className="mb-6 text-[13px] text-text-secondary">
          Keep multiple resume versions here — the AI Hub picks the closest match when you
          prepare an application, or you can pick manually.
        </p>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 flex flex-col gap-3">
            {resumes.map((r) => (
              <div key={r.id} className="rounded-card border border-base-border bg-base-panel p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[14px] font-medium text-text-primary">{r.label}</span>
                  <span className="text-[11px] text-text-tertiary">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="whitespace-pre-line text-[12px] text-text-secondary line-clamp-4">
                  {r.content}
                </p>
              </div>
            ))}
            {resumes.length === 0 && (
              <div className="rounded-card border border-dashed border-base-border p-8 text-center text-[13px] text-text-tertiary">
                No resumes yet — add your master resume text on the right to get started.
              </div>
            )}
          </div>

          <div className="rounded-card border border-base-border bg-base-panel p-4">
            <h2 className="mb-3 text-[14px] font-semibold text-text-primary">Add Resume</h2>
            <input
              placeholder='Label — e.g. "Operations Resume"'
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mb-2 w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
            />
            <textarea
              placeholder="Paste resume text…"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="mb-2 w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
            />
            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-md bg-accent py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Resume"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
