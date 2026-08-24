export const DEFAULT_SUGGESTIONS = [
  "卵",
  "牛乳",
  "パン",
  "米",
  "野菜",
  "果物",
  "冷凍食品",
  "お菓子",
  "トイレットペーパー",
  "ティッシュ",
  "洗剤",
  "シャンプー",
  "歯磨き粉",
  "ゴミ袋",
  "水",
  "コーヒー",
];

// Suggests items to buy: recently-frequent items from purchase history first
// (things bought often but not yet on the current list), then a handful of
// generic staples to fill out the list. Nothing here uses AI — it's a simple
// frequency count kept in local history.
export function getSuggestions(history, currentItemNames, limit = 10) {
  const current = new Set(currentItemNames.map((n) => n.trim().toLowerCase()));

  const fromHistory = [...history]
    .filter((h) => !current.has(h.name.trim().toLowerCase()))
    .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
    .map((h) => h.name);

  const fromDefaults = DEFAULT_SUGGESTIONS.filter(
    (name) => !current.has(name.trim().toLowerCase())
  );

  const merged = [...fromHistory, ...fromDefaults].filter(
    (name, idx, arr) => arr.findIndex((n) => n.toLowerCase() === name.toLowerCase()) === idx
  );

  return merged.slice(0, limit);
}

export const SHOPPING_KEYWORDS = ["買い物", "買出し", "買い出し", "ショッピング", "お買い物"];

export function looksLikeShoppingTrip(title) {
  const t = title.toLowerCase();
  return SHOPPING_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}
