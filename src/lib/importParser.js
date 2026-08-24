import * as chrono from "chrono-node";

const INCOME_HINTS = ["仕送り", "奨学金", "バイト", "収入", "income", "salary", "給料"];

function normalizeDate(raw) {
  const trimmed = raw.trim();
  // Fast path for ISO-ish dates to avoid timezone surprises from chrono
  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const parsed = chrono.parseDate(trimmed, new Date(), { forwardDate: false });
  if (!parsed) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
}

/**
 * Parses lines like:
 *   2026-08-24, 850, 食費, コンビニ弁当
 *   2026-08-20, +50000, 仕送り, 8月分
 * Returns { results, errors } where results are ready for addTransaction()
 * and errors list the line numbers/text that couldn't be parsed.
 */
export function parseTransactionLines(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const results = [];
  const errors = [];

  lines.forEach((line, idx) => {
    if (/^(date|日付)\b/i.test(line)) return; // skip header row

    const parts = line.split(",").map((p) => p.trim());
    if (parts.length < 2) {
      errors.push({ line: idx + 1, text: line });
      return;
    }

    const date = normalizeDate(parts[0]);
    const category = parts[2] || "その他";
    const note = parts.slice(3).join(", ").trim();

    let amountStr = parts[1].replace(/[^\d+\-.]/g, "");
    let type = "expense";
    if (amountStr.startsWith("+")) {
      type = "income";
      amountStr = amountStr.slice(1);
    } else if (amountStr.startsWith("-")) {
      amountStr = amountStr.slice(1);
    }
    if (INCOME_HINTS.some((k) => category.toLowerCase().includes(k.toLowerCase()))) {
      type = "income";
    }

    const amount = Number(amountStr);

    if (!date || !amount || amount <= 0) {
      errors.push({ line: idx + 1, text: line });
      return;
    }

    results.push({ date, amount, category, note, type });
  });

  return { results, errors };
}
