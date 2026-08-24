import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import Card from "../components/Card";
import { CURRENCIES } from "../lib/format";

export default function Settings({ settings, updateSettings, resetAll, importData, rawState }) {
  const fileInputRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);

  function handleExport() {
    const blob = new Blob([JSON.stringify(rawState, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minerva-life-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        importData(data);
      } catch {
        alert("ファイルを読み込めませんでした。正しいバックアップファイルか確認してください。");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-5 px-5 pb-6 pt-5 sm:px-8">
      <h2 className="font-[family-name:var(--font-display)] text-[18px] text-[var(--color-parchment)]">
        設定
      </h2>

      <Card className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-[12px] text-[var(--color-muted)]">通貨</label>
          <select
            value={settings.currency}
            onChange={(e) => updateSettings({ currency: e.target.value })}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)]"
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} ({c.symbol})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-[var(--color-muted-soft)]">
            今いる都市に合わせて切り替えられます
          </p>
        </div>

        <div>
          <label className="mb-1 block text-[12px] text-[var(--color-muted)]">週の予算</label>
          <input
            inputMode="decimal"
            value={settings.weeklyBudget}
            onChange={(e) => updateSettings({ weeklyBudget: e.target.value })}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-[family-name:var(--font-mono)] text-[14px] text-[var(--color-parchment)]"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-4">
        <div>
          <label className="mb-1 block text-[12px] text-[var(--color-muted)]">今いる都市</label>
          <input
            value={settings.city}
            onChange={(e) => updateSettings({ city: e.target.value })}
            placeholder="例: San Francisco"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-[12px] text-[var(--color-muted)]">学期・ターム</label>
          <input
            value={settings.term}
            onChange={(e) => updateSettings({ term: e.target.value })}
            placeholder="例: Term 3"
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[14px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-[13px] text-[var(--color-parchment-dim)]">データの管理</p>
        <p className="text-[11px] leading-relaxed text-[var(--color-muted-soft)]">
          データはこの端末のブラウザ内にのみ保存されます。機種変更や別の端末で使う前に、バックアップの書き出しをおすすめします。
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-2 text-[13px] text-[var(--color-parchment-dim)]"
          >
            <Download size={14} /> 書き出し
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-2 text-[13px] text-[var(--color-parchment-dim)]"
          >
            <Upload size={14} /> 読み込み
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-[13px] text-[var(--color-coral-soft)]">危険な操作</p>
        {confirmReset ? (
          <div className="space-y-2">
            <p className="text-[12px] text-[var(--color-muted)]">
              すべてのデータを削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
                className="flex-1 rounded-lg bg-[var(--color-coral)] py-2 text-[13px] font-medium text-[var(--color-ink)]"
              >
                すべて削除する
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-lg border border-[var(--color-border)] py-2 text-[13px] text-[var(--color-parchment-dim)]"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full rounded-lg border border-[var(--color-coral)]/50 py-2 text-[13px] text-[var(--color-coral-soft)]"
          >
            すべてのデータをリセット
          </button>
        )}
      </Card>
    </div>
  );
}
