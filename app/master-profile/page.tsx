"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface ProfileData {
  phone?: string;
  location?: string;
  linkedin?: string;
  portfolio?: string;
  github?: string;
  experiences: { id: string; company: string; role: string; skills: string[] }[];
  skills: { id: string; name: string; level: string }[];
  achievements: { id: string; problem: string; action: string; result: string }[];
}

export default function MasterProfilePage() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user);
        setProfile(data.profile);
      });
  }, []);

  async function save() {
    if (!profile) return;
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  }

  return (
    <div className="flex">
      <Sidebar aiCreditsUsed={72} aiCreditsTotal={100} planLabel="Pro Plan" />

      <main className="flex-1 px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">Master Profile</h1>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-md bg-accent px-3 py-2 text-[13px] font-medium text-base-bg hover:bg-accent-bright disabled:opacity-60"
          >
            {saving ? "Saving…" : savedMsg ? "Saved ✓" : "Save Profile Changes"}
          </button>
        </div>

        {!profile ? (
          <p className="text-[13px] text-text-secondary">Loading…</p>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-base-panel text-2xl font-semibold text-text-primary">
                {user?.name?.[0] ?? "?"}
              </div>
              <div>
                <div className="text-xl font-semibold text-text-primary">{user?.name}</div>
                <div className="text-[13px] text-text-secondary">{user?.email}</div>
              </div>
            </div>

            <div className="mb-4 rounded-card border border-base-border bg-base-panel p-5">
              <h2 className="mb-4 text-[14px] font-semibold text-text-primary">Contact & Links</h2>
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Location"
                  value={profile.location ?? ""}
                  onChange={(v) => setProfile({ ...profile, location: v })}
                />
                <Field
                  label="Phone"
                  value={profile.phone ?? ""}
                  onChange={(v) => setProfile({ ...profile, phone: v })}
                />
                <Field
                  label="LinkedIn"
                  value={profile.linkedin ?? ""}
                  onChange={(v) => setProfile({ ...profile, linkedin: v })}
                />
                <Field
                  label="Portfolio"
                  value={profile.portfolio ?? ""}
                  onChange={(v) => setProfile({ ...profile, portfolio: v })}
                />
              </div>
            </div>

            <div className="mb-4 rounded-card border border-base-border bg-base-panel p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[14px] font-semibold text-text-primary">
                  Experience & Skills
                </h2>
                <span className="text-[11px] text-text-tertiary">used for AI matching</span>
              </div>
              {profile.experiences.length === 0 ? (
                <p className="mb-3 text-[13px] text-text-tertiary">
                  No experience added yet. Add roles here so the AI matcher and cover letter
                  generator have real evidence to work from — it will never claim a skill that
                  isn't listed here.
                </p>
              ) : (
                <div className="mb-3 flex flex-col gap-3">
                  {profile.experiences.map((exp) => (
                    <div key={exp.id} className="rounded-md border border-base-border p-3">
                      <div className="text-[13px] font-medium text-text-primary">
                        {exp.role} · {exp.company}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {exp.skills.map((s) => (
                          <span
                            key={s}
                            className="rounded-md border border-base-border px-2 py-0.5 text-[11px] text-text-secondary"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AddExperienceForm onAdded={(exp) => setProfile({ ...profile, experiences: [...profile.experiences, exp] })} />
            </div>

            <div className="rounded-card border border-base-border bg-base-panel p-5">
              <h2 className="mb-3 text-[14px] font-semibold text-text-primary">
                Achievement Evidence
              </h2>
              {profile.achievements.length === 0 ? (
                <p className="mb-3 text-[13px] text-text-tertiary">
                  No achievements yet — add a Problem / Action / Result entry so cover letters
                  and application answers can cite something concrete.
                </p>
              ) : (
                <div className="mb-3 flex flex-col gap-3">
                  {profile.achievements.map((a) => (
                    <div key={a.id} className="rounded-md border border-base-border p-3 text-[13px]">
                      <div className="text-text-secondary">
                        <span className="text-text-primary">Problem:</span> {a.problem}
                      </div>
                      <div className="text-text-secondary">
                        <span className="text-text-primary">Action:</span> {a.action}
                      </div>
                      <div className="text-text-secondary">
                        <span className="text-text-primary">Result:</span> {a.result}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <AddAchievementForm
                onAdded={(a) => setProfile({ ...profile, achievements: [...profile.achievements, a] })}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[12px] text-text-secondary">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-base-border bg-base-bg px-3 py-2 text-[13px] text-text-primary outline-none focus:border-accent"
      />
    </div>
  );
}

function AddExperienceForm({
  onAdded,
}: {
  onAdded: (exp: { id: string; company: string; role: string; skills: string[] }) => void;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!company || !role) return;
    setSubmitting(true);
    const res = await fetch("/api/profile/experiences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company,
        role,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      onAdded(data.experience);
      setCompany("");
      setRole("");
      setSkills("");
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2 border-t border-base-border pt-3">
      <input
        placeholder="Company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        className="rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <input
        placeholder="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <input
        placeholder="Skills (comma separated)"
        value={skills}
        onChange={(e) => setSkills(e.target.value)}
        className="flex-1 rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <button
        onClick={submit}
        disabled={submitting}
        className="rounded-md border border-accent/40 px-3 py-1.5 text-[13px] text-accent hover:bg-accent-dim disabled:opacity-60"
      >
        + Add Experience
      </button>
    </div>
  );
}

function AddAchievementForm({
  onAdded,
}: {
  onAdded: (a: { id: string; problem: string; action: string; result: string }) => void;
}) {
  const [problem, setProblem] = useState("");
  const [action, setAction] = useState("");
  const [result, setResult] = useState("");
  const [skills, setSkills] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!problem || !action || !result) return;
    setSubmitting(true);
    const res = await fetch("/api/profile/achievements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        problem,
        action,
        result,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      onAdded(data.achievement);
      setProblem("");
      setAction("");
      setResult("");
      setSkills("");
    }
  }

  return (
    <div className="flex flex-col gap-2 border-t border-base-border pt-3">
      <input
        placeholder="Problem"
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        className="rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <input
        placeholder="Action"
        value={action}
        onChange={(e) => setAction(e.target.value)}
        className="rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <input
        placeholder="Result"
        value={result}
        onChange={(e) => setResult(e.target.value)}
        className="rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
      />
      <div className="flex gap-2">
        <input
          placeholder="Skills (comma separated)"
          value={skills}
          onChange={(e) => setSkills(e.target.value)}
          className="flex-1 rounded-md border border-base-border bg-base-bg px-2.5 py-1.5 text-[13px] text-text-primary outline-none focus:border-accent"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md border border-accent/40 px-3 py-1.5 text-[13px] text-accent hover:bg-accent-dim disabled:opacity-60"
        >
          + Add Achievement
        </button>
      </div>
    </div>
  );
}

