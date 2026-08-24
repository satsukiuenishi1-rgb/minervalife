import { CalendarDays, LayoutGrid, Settings, Wallet } from "lucide-react";

const TABS = [
  { id: "dashboard", label: "今日", icon: LayoutGrid },
  { id: "schedule", label: "予定", icon: CalendarDays },
  { id: "finance", label: "家計", icon: Wallet },
  { id: "settings", label: "設定", icon: Settings },
];

export default function TabBar({ active, onChange }) {
  return (
    <nav
      className="sticky bottom-0 z-10 border-t border-[var(--color-border-soft)] bg-[var(--color-ink-soft)]/95 backdrop-blur sm:static sm:border-b sm:border-t-0"
      aria-label="メインナビゲーション"
    >
      <div className="mx-auto flex max-w-3xl">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              aria-current={isActive ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[11px] transition-colors sm:flex-row sm:justify-center sm:gap-1.5 sm:py-3 sm:text-[13px] ${
                isActive
                  ? "text-[var(--color-gold)]"
                  : "text-[var(--color-muted)] hover:text-[var(--color-parchment-dim)]"
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
