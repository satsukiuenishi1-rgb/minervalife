import { format } from "date-fns";
import { ja } from "date-fns/locale";

export default function Header({ city, term }) {
  const today = new Date();
  const dateLabel = format(today, "M月d日 (EEE)", { locale: ja });
  const location = [city, term].filter(Boolean).join(" · ");

  return (
    <header className="starfield relative overflow-hidden bg-[var(--color-ink-soft)] px-5 pb-5 pt-6 sm:px-8">
      <div className="mx-auto flex max-w-3xl items-end justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-gold-soft)]">
            Nova Sidera
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-[26px] font-medium leading-none text-[var(--color-parchment)]">
            Minerva Life
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[13px] text-[var(--color-parchment-dim)]">{dateLabel}</p>
          {location && (
            <p className="mt-0.5 text-[12px] text-[var(--color-gold-soft)]">{location}</p>
          )}
        </div>
      </div>
    </header>
  );
}
