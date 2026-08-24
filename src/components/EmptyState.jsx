export default function EmptyState({ title, hint }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] px-5 py-8 text-center">
      <p className="font-[family-name:var(--font-display)] text-[17px] text-[var(--color-parchment)]">
        {title}
      </p>
      {hint && (
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
          {hint}
        </p>
      )}
    </div>
  );
}
