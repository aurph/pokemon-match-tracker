"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Trash2, ImageDown } from "lucide-react";
import { importDataAction, wipeGamesAction, wipeAllAction } from "./actions";

export default function SettingsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("Importing replaces your current data with the backup. Continue?")) {
      e.target.value = "";
      return;
    }
    setBusy(true);
    const res = await importDataAction(await file.text());
    setBusy(false);
    e.target.value = "";
    setMsg(res.ok ? "Imported backup successfully." : res.error);
    if (res.ok) router.refresh();
  }

  async function onWipeGames() {
    if (!window.confirm("Delete ALL logged games? This cannot be undone.")) return;
    setBusy(true);
    await wipeGamesAction();
    setBusy(false);
    setMsg("All games deleted.");
    router.refresh();
  }

  async function onWipeAll() {
    if (!window.confirm("Delete EVERYTHING incl. the decklist? Re-seed later with `pnpm db:seed`.")) return;
    setBusy(true);
    await wipeAllAction();
    setBusy(false);
    setMsg("All data wiped. Run `pnpm db:seed` to restore the decklist.");
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-5">
      <h1 className="font-pixel text-xl text-p-title">Settings</h1>

      {msg && (
        <div className="rounded-md border-2 border-p-primary bg-p-kpi-bg px-3 py-2 text-sm text-p-title">
          {msg}
        </div>
      )}

      <Card title="Backup" desc="Download a full JSON snapshot of your games, decklist, and history.">
        <a
          href="/api/export"
          className="inline-flex items-center gap-2 rounded-md bg-p-primary px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
        >
          <Download size={16} /> Export JSON
        </a>
      </Card>

      <Card title="Restore" desc="Import a backup. This replaces your current data.">
        <input ref={fileRef} type="file" accept="application/json,.json" onChange={onImport} className="hidden" />
        <button
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-md border-2 border-p-title px-3 py-1.5 text-sm font-medium text-p-title hover:bg-p-kpi-bg disabled:opacity-50"
        >
          <Upload size={16} /> Import JSON
        </button>
      </Card>

      <Card title="Card images" desc="Re-download card art and Pokémon pixel sprites (run from the project root).">
        <code className="flex items-center gap-2 rounded bg-p-kpi-bg px-3 py-1.5 font-mono text-xs text-p-title">
          <ImageDown size={14} /> pnpm fetch-images && pnpm exec tsx scripts/fetch-sprites.ts
        </code>
      </Card>

      <Card title="Danger zone" desc="Destructive actions — there's no undo.">
        <div className="flex flex-wrap gap-2">
          <button
            disabled={busy}
            onClick={onWipeGames}
            className="inline-flex items-center gap-2 rounded-md border-2 border-p-bad px-3 py-1.5 text-sm text-p-bad hover:bg-p-bad/10 disabled:opacity-50"
          >
            <Trash2 size={16} /> Delete all games
          </button>
          <button
            disabled={busy}
            onClick={onWipeAll}
            className="inline-flex items-center gap-2 rounded-md bg-p-bad px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Trash2 size={16} /> Wipe everything
          </button>
        </div>
      </Card>
    </div>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border-2 border-p-title bg-p-surface p-4 shadow-pixel-sm">
      <h2 className="font-pixel text-xs text-p-primary">{title.toUpperCase()}</h2>
      <p className="mt-1 mb-3 text-sm text-p-muted">{desc}</p>
      {children}
    </section>
  );
}
