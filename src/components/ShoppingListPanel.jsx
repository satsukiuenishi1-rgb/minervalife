import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { getSuggestions } from "../lib/shopping";

export default function ShoppingListPanel({
  task,
  shoppingHistory,
  addShoppingItem,
  toggleShoppingItem,
  removeShoppingItem,
}) {
  const [input, setInput] = useState("");
  const items = task.items || [];

  const suggestions = getSuggestions(
    shoppingHistory,
    items.map((i) => i.name),
    8
  );

  function handleAdd(name) {
    addShoppingItem(task.id, name);
    setInput("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim()) handleAdd(input);
  }

  return (
    <div className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface-raised)]/40 px-4 py-3">
      {items.length > 0 && (
        <ul className="mb-2.5 space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-2.5">
              <button
                onClick={() => toggleShoppingItem(task.id, item.id)}
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                  item.done
                    ? "border-[var(--color-sage)] bg-[var(--color-sage)]"
                    : "border-[var(--color-muted-soft)]"
                }`}
                aria-label={item.done ? "未購入に戻す" : "購入済みにする"}
              />
              <span
                className={`flex-1 text-[13px] ${
                  item.done
                    ? "text-[var(--color-muted)] line-through"
                    : "text-[var(--color-parchment-dim)]"
                }`}
              >
                {item.name}
              </span>
              <button
                onClick={() => removeShoppingItem(task.id, item.id)}
                aria-label="削除"
                className="shrink-0 text-[var(--color-muted-soft)] hover:text-[var(--color-coral)]"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mb-2.5 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="買うものを入力"
          className="min-w-0 flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[13px] text-[var(--color-parchment)] placeholder:text-[var(--color-muted-soft)]"
        />
        <button
          type="submit"
          aria-label="追加"
          className="flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-gold)] px-3 text-[var(--color-ink)]"
        >
          <Plus size={15} />
        </button>
      </form>

      {suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] text-[var(--color-muted-soft)]">おすすめ</p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((name) => (
              <button
                key={name}
                onClick={() => handleAdd(name)}
                className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-[12px] text-[var(--color-gold-soft)]"
              >
                + {name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
