// GET  /api/sync?code=XXXXXX  -> { found, state, updatedAt }
// POST /api/sync { code, state } -> { ok, updatedAt }
//
// Stores the whole Minerva Life app state blob under a short sync code so
// a second device can pull the same data. No accounts, no personal info —
// just a shared key both devices know. Whoever writes last wins.

import { Redis } from "@upstash/redis";

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function isValidCode(code) {
  return typeof code === "string" && /^[A-Za-z0-9]{4,32}$/.test(code);
}

export default async function handler(req, res) {
  const redis = getRedis();
  if (!redis) {
    res.status(500).json({ error: "storage_not_configured" });
    return;
  }

  if (req.method === "GET") {
    const code = req.query.code;
    if (!isValidCode(code)) {
      res.status(400).json({ error: "invalid_code" });
      return;
    }
    const data = await redis.get(`minerva-life:sync:${code}`);
    if (!data) {
      res.status(200).json({ found: false });
      return;
    }
    res.status(200).json({ found: true, state: data.state, updatedAt: data.updatedAt });
    return;
  }

  if (req.method === "POST") {
    const { code, state } = req.body || {};
    if (!isValidCode(code) || !state) {
      res.status(400).json({ error: "invalid_request" });
      return;
    }
    const updatedAt = Date.now();
    await redis.set(`minerva-life:sync:${code}`, { state, updatedAt });
    res.status(200).json({ ok: true, updatedAt });
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
