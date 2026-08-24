import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import Card from "./Card";
import { getGmailToken } from "../lib/storage";
import { friendlyDate } from "../lib/format";

export default function GmailSync({ settings, addTask, importedGmailIds, markGmailIdsImported }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [done, setDone] = useState(false);

  const connected = Boolean(getGmailToken());

  async function handleSync() {
    setLoading(true);
    setError("");
    setDone(false);
    setCandidates([]);
    try {
      const keywords = (settings.gmailKeywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/gmail/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: getGmailToken(), keywords, days: 14 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "sync_failed");

      const fresh = (data.candidates || []).filter((c) => !importedGmailIds.includes(c.id));
      setCandidates(fresh);
      setSelected(new Set(fresh.map((c) => c.id)));
    } catch (err) {
      setError(
        String(err.message || err).includes("invalid_grant")
          ? "Gmailとの連携が切れています。設定画面から再連携してください。"
          : "同期に失敗しました。時間をおいて再度お試しください。"
      );
    } finally {
      setLoading(false);
    }
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAddSelected() {
    const chosen = candidates.filter((c) => selected.has(c.id));
    for (const c of chosen) {
      addTask({ title: c.title, date: c.date, time: c.time });
    }
    markGmailIdsImported(candidates.map((c) => c.id));
    setCandidates([]);
    setDone(true);
  }

  if (!connected) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Mail size={18} className="mt-0.5 shrink-0 text-[var(--color-muted)]" />
          <div>
            <p className="text-[13px] text-[var(--color-parchment-dim)]">
              Gmailと連携すると、寮や学校からの予定メールを検知して取り込めます。
            </p>
            <p className="mt-1 text-[12px] text-[var(--color-muted-soft)]">
              設定タブから連携できます
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-parchment-dim)]">
          <Mail size={15} /> Gmailから予定を取り込む
        </p>
        <button
          onClick={handleSync}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-gold-soft)] disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          {loading ? "確認中..." : "同期する"}
        </button>
      </div>

      {error && <p className="mt-2 text-[12px] text-[var(--color-coral)]">{error}</p>}

      {done && candidates.length === 0 && !error && (
        <p className="mt-2 text-[12px] text-[var(--color-sage)]">予定を追加しました</p>
      )}

      {!loading && !error && !done && candidates.length === 0 && (
        <p className="mt-2 text-[12px] text-[var(--color-muted-soft)]">
          「同期する」を押すと直近14日分のメールを確認します
        </p>
      )}

      {candidates.length > 0 && (
        <div className="mt-3 space-y-2">
          {candidates.map((c) => (
            <label
              key={c.id}
              className="flex items-start gap-2.5 rounded-lg border border-[var(--color-border-soft)] px-3 py-2.5"
            >
              <input
                type="checkbox"
                checked={selected.has(c.id)}
                onChange={() => toggle(c.id)}
                className="mt-1 accent-[var(--color-gold)]"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-[var(--color-parchment)]">{c.title}</p>
                <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">
                  {friendlyDate(c.date)}
                  {c.time && ` ${c.time}`} ・ {c.from?.split("<")[0].trim()}
                </p>
              </div>
            </label>
          ))}
          <button
            onClick={handleAddSelected}
            disabled={selected.size === 0}
            className="w-full rounded-lg bg-[var(--color-gold)] py-2 text-[13px] font-medium text-[var(--color-ink)] disabled:opacity-50"
          >
            選択した{selected.size}件を予定に追加
          </button>
        </div>
      )}
    </Card>
  );
}
