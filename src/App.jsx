import { useEffect, useState } from "react";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import { useAppData, setGmailToken } from "./lib/storage";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [gmailNotice, setGmailNotice] = useState("");
  const data = useAppData();

  useEffect(() => {
    if (!window.location.hash) return;
    const params = new URLSearchParams(window.location.hash.slice(1));
    if (params.get("gmail_connected") === "1" && params.get("rt")) {
      setGmailToken(params.get("rt"));
      setGmailNotice("Gmailとの連携が完了しました");
      setTab("settings");
      window.history.replaceState(null, "", window.location.pathname);
    } else if (params.get("gmail_error")) {
      setGmailNotice(`Gmail連携に失敗しました: ${params.get("gmail_error")}`);
      setTab("settings");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-[var(--color-ink)]">
      <Header city={data.settings.city} term={data.settings.term} />
      <TabBar active={tab} onChange={setTab} />
      {gmailNotice && (
        <div className="mx-5 mt-3 rounded-lg border border-[var(--color-border-soft)] bg-[var(--color-surface)] px-3 py-2 text-[12px] text-[var(--color-parchment-dim)] sm:mx-8">
          {gmailNotice}
        </div>
      )}
      <main className="flex-1">
        {tab === "dashboard" && (
          <Dashboard
            tasks={data.tasks}
            transactions={data.transactions}
            settings={data.settings}
            toggleTask={data.toggleTask}
            onGoTo={setTab}
          />
        )}
        {tab === "schedule" && (
          <Schedule
            tasks={data.tasks}
            addTask={data.addTask}
            toggleTask={data.toggleTask}
            deleteTask={data.deleteTask}
            settings={data.settings}
            importedGmailIds={data.importedGmailIds}
            markGmailIdsImported={data.markGmailIdsImported}
          />
        )}
        {tab === "finance" && (
          <Finance
            transactions={data.transactions}
            settings={data.settings}
            addTransaction={data.addTransaction}
            deleteTransaction={data.deleteTransaction}
          />
        )}
        {tab === "settings" && (
          <Settings
            settings={data.settings}
            updateSettings={data.updateSettings}
            resetAll={data.resetAll}
            importData={data.importData}
            rawState={data.rawState}
          />
        )}
      </main>
    </div>
  );
}
