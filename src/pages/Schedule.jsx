import { useMemo, useState } from "react";
import { Check, Circle, Plus, Trash2, X } from "lucide-react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import GmailSync from "../components/GmailSync";
import { friendlyDate, todayISO } from "../lib/format";

export default function Schedule({
  tasks,
  addTask,
  toggleTask,
  deleteTask,
  settings,
  importedGmailIds,
  markGmailIdsImported,
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("");

  const grouped = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || "99:99").localeCompare(b.time || "99:99");
    });
    const map = new Map();
    for (const t of sorted) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    return [...map.entries()];
  }, [tasks]);

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    addTask({ title: title.trim(), date, time });
    setTitle("");
    setTime("");
    setShowForm(false);
  }

  return (
    <div className="space-y-4 px-5 pb-6 pt-5 sm:px-8">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-[18px] text-[var(--color-parchment)]">
          予定
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)]"
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? "閉じる" : "予定を追加"}
        </button>
      </div>

      <GmailSync
        settings={settings}
        addTask={addTask}
        importedGmailIds={importedGmailIds}
        markGmailIdsImported={markGmailIdsImported}
      />

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-[12px] text-[var(--color-muted)]">
                内容
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: レポート提出"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
              />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[12px] text-[var(--color-muted)]">
                  日付
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)]"
                />
              </div>
              <div className="w-28">
                <label className="mb-1 block text-[12px] text-[var(--color-muted)]">
                  時間(任意)
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)]"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--color-gold)] py-2.5 text-[14px] font-medium text-[var(--color-ink)]"
            >
              追加する
            </button>
          </form>
        </Card>
      )}

      {grouped.length === 0 ? (
        <EmptyState title="予定がまだありません" hint="「予定を追加」から作成しましょう" />
      ) : (
        <div className="space-y-4">
          {grouped.map(([date, items]) => (
            <div key={date}>
              <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
                {friendlyDate(date)}
              </p>
              <Card className="divide-y divide-[var(--color-border-soft)]">
                {items.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => toggleTask(task.id)} className="shrink-0">
                      {task.done ? (
                        <Check size={18} className="text-[var(--color-sage)]" />
                      ) : (
                        <Circle size={18} className="text-[var(--color-muted-soft)]" />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-[14px] ${
                        task.done
                          ? "text-[var(--color-muted)] line-through"
                          : "text-[var(--color-parchment)]"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.time && (
                      <span className="font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-muted)]">
                        {task.time}
                      </span>
                    )}
                    <button
                      onClick={() => deleteTask(task.id)}
                      aria-label="削除"
                      className="shrink-0 text-[var(--color-muted-soft)] hover:text-[var(--color-coral)]"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
