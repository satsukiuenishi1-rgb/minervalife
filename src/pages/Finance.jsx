import { useEffect, useMemo, useState } from "react";
import { ClipboardPaste, Copy, Check, ExternalLink, Plus, Trash2, X } from "lucide-react";
import Card from "../components/Card";
import EmptyState from "../components/EmptyState";
import { formatMoney, friendlyDate, isWithin, todayISO, weekRangeISO } from "../lib/format";
import { parseTransactionLines } from "../lib/importParser";
import { getRateToJPY } from "../lib/exchangeRate";

const EXPENSE_CATEGORIES = ["食費", "寮費・家賃", "交通費", "日用品", "通信費", "娯楽", "その他"];
const INCOME_CATEGORIES = ["仕送り", "奨学金", "アルバイト", "その他"];

export default function Finance({ transactions, settings, addTransaction, deleteTransaction }) {
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importPreview, setImportPreview] = useState(null);
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());
  const [promptCopied, setPromptCopied] = useState(false);
  const [jpyRate, setJpyRate] = useState(settings.currency === "JPY" ? 1 : undefined);

  useEffect(() => {
    let cancelled = false;
    if (settings.currency === "JPY") {
      setJpyRate(1);
      return;
    }
    setJpyRate(undefined); // undefined = loading
    getRateToJPY(settings.currency).then((rate) => {
      if (!cancelled) setJpyRate(rate); // null = failed, number = success
    });
    return () => {
      cancelled = true;
    };
  }, [settings.currency]);

  const GEMINI_PROMPT =
    "日付(YYYY-MM-DD), 金額(数字のみ), カテゴリ(食費/日用品/交通費/通信費/娯楽/その他), メモ(店名や内容を簡潔に)";

  function handleCopyPrompt() {
    navigator.clipboard.writeText(GEMINI_PROMPT).then(() => {
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    });
  }

  const { start, end } = weekRangeISO(0);

  const monthLabel = new Date().toLocaleDateString("ja-JP", { month: "long" });
  const thisMonth = new Date().getMonth();
  const monthTx = transactions.filter(
    (t) => new Date(t.date).getMonth() === thisMonth
  );
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  const weekExpenses = transactions.filter(
    (t) => t.type === "expense" && isWithin(t.date, start, end)
  );
  const spentThisWeek = weekExpenses.reduce((s, t) => s + t.amount, 0);
  const budget = Number(settings.weeklyBudget) || 0;
  const pct = budget > 0 ? Math.min(100, Math.round((spentThisWeek / budget) * 100)) : 0;
  const overBudget = spentThisWeek > budget;

  const byCategory = useMemo(() => {
    const map = new Map();
    for (const t of monthTx) {
      if (t.type !== "expense") continue;
      map.set(t.category, (map.get(t.category) || 0) + t.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [monthTx]);

  const grouped = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    const map = new Map();
    for (const t of sorted) {
      if (!map.has(t.date)) map.set(t.date, []);
      map.get(t.date).push(t);
    }
    return [...map.entries()];
  }, [transactions]);

  function handleSubmit(e) {
    e.preventDefault();
    const num = Number(amount);
    if (!num || num <= 0 || !date) return;
    addTransaction({ type, amount: num, category, note: note.trim(), date });
    setAmount("");
    setNote("");
    setShowForm(false);
  }

  function handlePreviewImport() {
    const { results, errors } = parseTransactionLines(importText);
    setImportPreview({ results, errors });
  }

  function handleConfirmImport() {
    if (!importPreview) return;
    for (const r of importPreview.results) {
      addTransaction(r);
    }
    setImportText("");
    setImportPreview(null);
    setShowImport(false);
  }

  return (
    <div className="space-y-5 px-5 pb-6 pt-5 sm:px-8">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-[family-name:var(--font-display)] text-[18px] text-[var(--color-parchment)]">
          家計
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setShowImport((v) => !v);
              setShowForm(false);
            }}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[13px] text-[var(--color-gold-soft)]"
          >
            <ClipboardPaste size={14} />
            取り込む
          </button>
          <button
            onClick={() => {
              setShowForm((v) => !v);
              setShowImport(false);
            }}
            className="flex items-center gap-1.5 rounded-full bg-[var(--color-gold)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-ink)]"
          >
            {showForm ? <X size={15} /> : <Plus size={15} />}
            {showForm ? "閉じる" : "記録を追加"}
          </button>
        </div>
      </div>

      {showImport && (
        <Card className="p-4">
          <p className="text-[13px] text-[var(--color-parchment-dim)]">テキストから取り込む</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--color-muted-soft)]">
            Gemini・ChatGPT・Claudeなどでレシート画像を読み取ってもらい、1行ずつ「日付,
            金額, カテゴリ, メモ」の形式で出力してもらったテキストを貼り付けてください。収入は金額の先頭に「+」をつけてください。
          </p>
          <a
            href="https://gemini.google.com/app?hl=ja"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-[var(--color-gold-soft)] underline decoration-[var(--color-gold-soft)]/40 underline-offset-2"
          >
            <ExternalLink size={12} />
            Geminiでレシートを読み取る
          </a>

          <div className="mt-2.5 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface-raised)] px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[11px] leading-relaxed text-[var(--color-muted)]">
                {GEMINI_PROMPT}
              </p>
              <button
                onClick={handleCopyPrompt}
                aria-label="プロンプトをコピー"
                className="flex shrink-0 items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-gold-soft)]"
              >
                {promptCopied ? <Check size={12} /> : <Copy size={12} />}
                {promptCopied ? "コピー済み" : "コピー"}
              </button>
            </div>
          </div>
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setImportPreview(null);
            }}
            rows={5}
            placeholder={"2026-08-24, 850, 食費, コンビニ弁当\n2026-08-20, +50000, 仕送り, 8月分"}
            className="mt-2.5 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
          />

          {!importPreview ? (
            <button
              onClick={handlePreviewImport}
              disabled={!importText.trim()}
              className="mt-2.5 w-full rounded-lg bg-[var(--color-gold)] py-2 text-[13px] font-medium text-[var(--color-ink)] disabled:opacity-50"
            >
              内容を確認する
            </button>
          ) : (
            <div className="mt-2.5 space-y-2.5">
              {importPreview.results.length > 0 && (
                <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-[var(--color-border-soft)] p-2.5">
                  {importPreview.results.map((r, i) => (
                    <div key={i} className="flex items-center justify-between text-[12px]">
                      <span className="text-[var(--color-parchment-dim)]">
                        {friendlyDate(r.date)} ・ {r.category}
                        {r.note && ` ・ ${r.note}`}
                      </span>
                      <span
                        className={
                          r.type === "income"
                            ? "text-[var(--color-sage)]"
                            : "text-[var(--color-parchment)]"
                        }
                      >
                        {r.type === "income" ? "+" : "-"}
                        {formatMoney(r.amount, settings.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {importPreview.errors.length > 0 && (
                <p className="text-[11px] text-[var(--color-coral)]">
                  {importPreview.errors.length}行を読み取れませんでした(
                  {importPreview.errors.map((e) => e.line).join(", ")}行目)
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirmImport}
                  disabled={importPreview.results.length === 0}
                  className="flex-1 rounded-lg bg-[var(--color-gold)] py-2 text-[13px] font-medium text-[var(--color-ink)] disabled:opacity-50"
                >
                  {importPreview.results.length}件を追加する
                </button>
                <button
                  onClick={() => setImportPreview(null)}
                  className="flex-1 rounded-lg border border-[var(--color-border)] py-2 text-[13px] text-[var(--color-parchment-dim)]"
                >
                  修正する
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {showForm && (
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex gap-2">
              {["expense", "income"].map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => {
                    setType(t);
                    setCategory(t === "expense" ? EXPENSE_CATEGORIES[0] : INCOME_CATEGORIES[0]);
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2 text-[13px] ${
                    type === t
                      ? "border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold-soft)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  {t === "expense" ? "支出" : "収入"}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-[12px] text-[var(--color-muted)]">金額</label>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
                />
              </div>
              <div className="flex-1">
                <label className="mb-1 block text-[12px] text-[var(--color-muted)]">日付</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] text-[var(--color-muted)]">カテゴリ</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)]"
              >
                {(type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] text-[var(--color-muted)]">メモ(任意)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 学食で夕食"
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--color-gold)] py-2.5 text-[14px] font-medium text-[var(--color-ink)]"
            >
              記録する
            </button>
          </form>
        </Card>
      )}

      {/* Week budget */}
      <Card className="p-4">
        <p className="text-[12px] text-[var(--color-muted)]">今週の予算消化</p>
        <div className="mt-1.5 flex items-baseline justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[18px] text-[var(--color-parchment)]">
            {formatMoney(spentThisWeek, settings.currency)}
          </span>
          <span className="text-[12px] text-[var(--color-muted)]">
            / {formatMoney(budget, settings.currency)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-surface-raised)]">
          <div
            className={`h-full rounded-full ${overBudget ? "bg-[var(--color-coral)]" : "bg-[var(--color-gold)]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {/* Month summary */}
      <div className="grid grid-cols-3 gap-2.5">
        <Card className="p-3 text-center">
          <p className="text-[11px] text-[var(--color-muted)]">{monthLabel}の収入</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-sage)]">
            {formatMoney(income, settings.currency)}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-[var(--color-muted)]">{monthLabel}の支出</p>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-coral)]">
            {formatMoney(expense, settings.currency)}
          </p>
          {settings.currency !== "JPY" && (
            <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-muted-soft)]">
              {jpyRate === undefined && "換算中..."}
              {jpyRate === null && "換算できませんでした"}
              {typeof jpyRate === "number" &&
                `≈ ¥${Math.round(expense * jpyRate).toLocaleString("ja-JP")}`}
            </p>
          )}
        </Card>
        <Card className="p-3 text-center">
          <p className="text-[11px] text-[var(--color-muted)]">収支</p>
          <p
            className={`mt-1 font-[family-name:var(--font-mono)] text-[14px] ${
              balance >= 0 ? "text-[var(--color-gold-soft)]" : "text-[var(--color-coral)]"
            }`}
          >
            {formatMoney(balance, settings.currency)}
          </p>
        </Card>
      </div>

      {/* Category breakdown */}
      {byCategory.length > 0 && (
        <div>
          <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
            カテゴリ別({monthLabel})
          </p>
          <Card className="divide-y divide-[var(--color-border-soft)]">
            {byCategory.map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between px-4 py-2.5">
                <span className="text-[13px] text-[var(--color-parchment-dim)]">{cat}</span>
                <span className="font-[family-name:var(--font-mono)] text-[13px] text-[var(--color-parchment)]">
                  {formatMoney(amt, settings.currency)}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Transaction history */}
      <div>
        <p className="mb-1.5 text-[12px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          履歴
        </p>
        {grouped.length === 0 ? (
          <EmptyState title="記録がまだありません" hint="「記録を追加」から入力しましょう" />
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <p className="mb-1.5 text-[12px] text-[var(--color-muted)]">{friendlyDate(date)}</p>
                <Card className="divide-y divide-[var(--color-border-soft)]">
                  {items.map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] text-[var(--color-parchment)]">
                          {t.category}
                          {t.note && (
                            <span className="text-[var(--color-muted)]"> · {t.note}</span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 font-[family-name:var(--font-mono)] text-[14px] ${
                          t.type === "income" ? "text-[var(--color-sage)]" : "text-[var(--color-parchment)]"
                        }`}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatMoney(t.amount, settings.currency)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(t.id)}
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
    </div>
  );
}
