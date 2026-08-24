import { Check, Circle } from "lucide-react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { formatMoney, isWithin, todayISO, weekRangeISO } from "../lib/format";

export default function Dashboard({ tasks, transactions, settings, toggleTask, onGoTo }) {
  const today = todayISO();
  const todaysTasks = tasks
    .filter((t) => t.date === today)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  const { start, end } = weekRangeISO(0);
  const weekExpenses = transactions.filter(
    (t) => t.type === "expense" && isWithin(t.date, start, end)
  );
  const spentThisWeek = weekExpenses.reduce((sum, t) => sum + t.amount, 0);
  const budget = Number(settings.weeklyBudget) || 0;
  const remaining = budget - spentThisWeek;
  const pct = budget > 0 ? Math.min(100, Math.round((spentThisWeek / budget) * 100)) : 0;
  const overBudget = remaining < 0;

  const doneCount = todaysTasks.filter((t) => t.done).length;

  return (
    <div className="space-y-5 px-5 pb-6 pt-5 sm:px-8">
      {/* Today's schedule */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-[17px] text-[var(--color-parchment)]">
            今日の予定
          </h2>
          {todaysTasks.length > 0 && (
            <span className="text-[12px] text-[var(--color-muted)]">
              {doneCount}/{todaysTasks.length} 完了
            </span>
          )}
        </div>

        {todaysTasks.length === 0 ? (
          <EmptyState
            title="今日の予定はまだありません"
            hint="「予定」タブから追加できます"
          />
        ) : (
          <Card className="divide-y divide-[var(--color-border-soft)]">
            {todaysTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {task.done ? (
                  <Check size={18} className="shrink-0 text-[var(--color-sage)]" />
                ) : (
                  <Circle size={18} className="shrink-0 text-[var(--color-muted-soft)]" />
                )}
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
                  <span className="shrink-0 font-[family-name:var(--font-mono)] text-[12px] text-[var(--color-muted)]">
                    {task.time}
                  </span>
                )}
              </button>
            ))}
          </Card>
        )}
      </section>

      {/* Budget snapshot */}
      <section>
        <h2 className="mb-2.5 font-[family-name:var(--font-display)] text-[17px] text-[var(--color-parchment)]">
          今週の家計
        </h2>
        <Card className="p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[12px] text-[var(--color-muted)]">今週使った金額</p>
              <p className="font-[family-name:var(--font-mono)] text-[22px] text-[var(--color-parchment)]">
                {formatMoney(spentThisWeek, settings.currency)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[12px] text-[var(--color-muted)]">
                {overBudget ? "予算超過" : "残り予算"}
              </p>
              <p
                className={`font-[family-name:var(--font-mono)] text-[16px] ${
                  overBudget ? "text-[var(--color-coral)]" : "text-[var(--color-sage)]"
                }`}
              >
                {formatMoney(Math.abs(remaining), settings.currency)}
              </p>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
            <div
              className={`h-full rounded-full transition-all ${
                overBudget ? "bg-[var(--color-coral)]" : "bg-[var(--color-gold)]"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            onClick={() => onGoTo("finance")}
            className="mt-3 text-[13px] text-[var(--color-gold-soft)] underline decoration-[var(--color-gold-soft)]/40 underline-offset-2"
          >
            家計簿を見る →
          </button>
        </Card>
      </section>
    </div>
  );
}
