import { useState } from "react";
import Header from "./components/Header";
import TabBar from "./components/TabBar";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import Finance from "./pages/Finance";
import Settings from "./pages/Settings";
import { useAppData } from "./lib/storage";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const data = useAppData();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-[var(--color-ink)]">
      <Header city={data.settings.city} term={data.settings.term} />
      <TabBar active={tab} onChange={setTab} />
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
