const CACHE_KEY = "minerva-life:jpy-rate-cache";
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeCache(cache) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

/**
 * Returns how many JPY one unit of `currencyCode` is worth, or null if the
 * rate couldn't be fetched. Uses a free, no-key exchange rate API and caches
 * results in localStorage for a few hours to avoid refetching constantly.
 */
export async function getRateToJPY(currencyCode) {
  if (currencyCode === "JPY") return 1;

  const cache = readCache();
  const cached = cache[currencyCode];
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.rate;
  }

  try {
    const res = await fetch(
      `https://open.er-api.com/v6/latest/${encodeURIComponent(currencyCode)}`
    );
    if (!res.ok) throw new Error("rate_fetch_failed");
    const data = await res.json();
    const rate = data.rates?.JPY;
    if (data.result !== "success" || !rate) throw new Error("no_rate");

    cache[currencyCode] = { rate, fetchedAt: Date.now() };
    writeCache(cache);
    return rate;
  } catch {
    return cached ? cached.rate : null;
  }
}
