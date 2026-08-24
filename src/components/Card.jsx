export default function Card({ children, className = "", as: As = "div" }) {
  return (
    <As
      className={`rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface)] ${className}`}
    >
      {children}
    </As>
  );
}
