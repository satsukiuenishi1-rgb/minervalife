import { useRef, useState } from "react";
import { Check, Copy, Download, Mail, RefreshCw, Smartphone, Upload } from "lucide-react";
import Card from "../components/Card";
import { CURRENCIES } from "../lib/format";
import { clearGmailToken, getGmailToken } from "../lib/storage";
import { clearSyncCodeStorage, generateSyncCode, setSyncCodeStorage } from "../lib/sync";

export default function Settings({
  settings,
  updateSettings,
  resetAll,
  importData,
  rawState,
  syncCode,
  setSyncCode,
  syncStatus,
}) {
  const fileInputRef = useRef(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(Boolean(getGmailToken()));
  const [codeInput, setCodeInput] = useState("");
  const [codeCopied, setCodeCopied] = useState(false);

  function handleStartSync() {
    const code = generateSyncCode();
    setSyncCodeStorage(code);
    setSyncCode(code);
  }

  function handleLinkCode(e) {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setSyncCodeStorage(code);
    setSyncCode(code);
    setCodeInput("");
  }

  function handleUnlink() {
    clearSyncCodeStorage();
    setSyncCode("");
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(syncCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

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
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-parchment-dim)]">
          <Mail size={14} /> メール連携(Gmail)
        </p>
        <p className="text-[11px] leading-relaxed text-[var(--color-muted-soft)]">
          読み取り専用の権限でGmailに接続し、寮や学校からの予定メールを検知します。メールの内容はこの端末とVercelの処理中のみ扱われ、保存されません。
        </p>

        {gmailConnected ? (
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--color-sage)]">連携中</span>
            <button
              onClick={() => {
                clearGmailToken();
                setGmailConnected(false);
              }}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-[12px] text-[var(--color-parchment-dim)]"
            >
              連携を解除
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/google"
            className="block w-full rounded-lg bg-[var(--color-gold)] py-2 text-center text-[13px] font-medium text-[var(--color-ink)]"
          >
            Gmailと連携する
          </a>
        )}

        <div>
          <label className="mb-1 block text-[12px] text-[var(--color-muted)]">
            検知キーワード(カンマ区切り)
          </label>
          <textarea
            value={settings.gmailKeywords}
            onChange={(e) => updateSettings({ gmailKeywords: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 text-[13px] text-[var(--color-parchment)]"
          />
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <p className="flex items-center gap-1.5 text-[13px] text-[var(--color-parchment-dim)]">
          <Smartphone size={14} /> デバイス間で同期
        </p>
        <p className="text-[11px] leading-relaxed text-[var(--color-muted-soft)]">
          同じコードを他の端末(PC/スマホ)で入力すると、予定・家計のデータが自動で同期されます。ログインは不要です。
        </p>

        {syncCode ? (
          <>
            <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2">
              <span className="font-[family-name:var(--font-mono)] text-[16px] tracking-[0.15em] text-[var(--color-gold-soft)]">
                {syncCode}
              </span>
              <button
                onClick={handleCopyCode}
                aria-label="コードをコピー"
                className="flex items-center gap-1 rounded-md border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-parchment-dim)]"
              >
                {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                {codeCopied ? "コピー済み" : "コピー"}
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[var(--color-muted-soft)]">
              <span className="flex items-center gap-1">
                <RefreshCw
                  size={11}
                  className={syncStatus === "syncing" ? "animate-spin" : ""}
                />
                {syncStatus === "syncing" && "同期中..."}
                {syncStatus === "synced" && "同期済み"}
                {syncStatus === "error" && "同期エラー(電波状況を確認してください)"}
                {syncStatus === "idle" && "待機中"}
              </span>
              <button onClick={handleUnlink} className="text-[var(--color-coral-soft)]">
                この端末の同期を解除
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2.5">
            <button
              onClick={handleStartSync}
              className="w-full rounded-lg bg-[var(--color-gold)] py-2 text-[13px] font-medium text-[var(--color-ink)]"
            >
              この端末で同期コードを作る
            </button>
            <form onSubmit={handleLinkCode} className="flex gap-2">
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="他の端末のコードを入力"
                className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-2 font-[family-name:var(--font-mono)] text-[13px] uppercase tracking-[0.1em] text-[var(--color-parchment)] placeholder:normal-case placeholder:tracking-normal placeholder:text-[var(--color-muted-soft)]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg border border-[var(--color-border)] px-3 text-[13px] text-[var(--color-gold-soft)]"
              >
                連携
              </button>
            </form>
          </div>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <p className="text-[13px] text-[var(--color-parchment-dim)]">データの管理</p>
        <p className="text-[11px] leading-relaxed text-[var(--color-muted-soft)]">
          「デバイス間で同期」を設定していない場合、データはこの端末のブラウザ内にのみ保存されます。念のため、時々バックアップの書き出しもおすすめします。
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
