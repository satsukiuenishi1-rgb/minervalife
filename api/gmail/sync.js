// POST /api/gmail/sync
// Body: { refreshToken: string, keywords?: string[], days?: number }
// Uses the stored refresh token to pull an access token, lists recent
// Gmail messages, and applies simple keyword + date-detection rules to
// surface candidate schedule items. No message content is stored on the
// server; everything is returned directly to the client.

import * as chrono from "chrono-node";

const DEFAULT_KEYWORDS = [
  "house meeting",
  "mandatory",
  "orientation",
  "reminder",
  "deadline",
  "due",
  "rsvp",
  "meeting",
  "event",
  "session",
  "check-in",
  "workshop",
  "会議",
  "説明会",
  "集合",
  "締切",
  "提出",
  "イベント",
  "ミーティング",
  "オリエンテーション",
  "点呼",
  "ハウス",
  "寮",
  "必須",
];

async function getAccessToken(refreshToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "token_refresh_failed");
  }
  return data.access_token;
}

function decodeBase64Url(str) {
  if (!str) return "";
  try {
    return Buffer.from(str, "base64url").toString("utf-8");
  } catch {
    return "";
  }
}

function extractPlainText(payload) {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  if (payload.mimeType === "text/html" && payload.body?.data) {
    const html = decodeBase64Url(payload.body.data);
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  }
  return "";
}

function getHeader(headers, name) {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || "";
}

function cleanSubject(subject) {
  return subject.replace(/^(re|fwd?|fw)\s*:\s*/i, "").trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  const { refreshToken, keywords, days } = req.body || {};
  if (!refreshToken) {
    res.status(400).json({ error: "missing_refresh_token" });
    return;
  }

  const activeKeywords = (
    Array.isArray(keywords) && keywords.length > 0 ? keywords : DEFAULT_KEYWORDS
  ).map((k) => k.toLowerCase());
  const windowDays = Number(days) > 0 ? Number(days) : 14;

  try {
    const accessToken = await getAccessToken(refreshToken);
    const authHeaders = { Authorization: `Bearer ${accessToken}` };

    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("q", `newer_than:${windowDays}d -in:spam -in:trash`);
    listUrl.searchParams.set("maxResults", "30");

    const listRes = await fetch(listUrl, { headers: authHeaders });
    const listData = await listRes.json();

    if (!listRes.ok) {
      const msg = listData.error?.message || "gmail_list_failed";
      res.status(listRes.status).json({ error: msg });
      return;
    }

    const messageRefs = listData.messages || [];

    const messages = await Promise.all(
      messageRefs.map(async (ref) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${ref.id}?format=full`,
          { headers: authHeaders }
        );
        if (!msgRes.ok) return null;
        return msgRes.json();
      })
    );

    const candidates = [];

    for (const msg of messages) {
      if (!msg) continue;
      const headers = msg.payload?.headers || [];
      const subject = getHeader(headers, "Subject") || "(件名なし)";
      const from = getHeader(headers, "From");
      const dateHeader = getHeader(headers, "Date");
      const receivedAt = dateHeader ? new Date(dateHeader) : new Date();
      const body = extractPlainText(msg.payload) || msg.snippet || "";
      const haystack = `${subject}\n${body}`.toLowerCase();

      const keywordHit = activeKeywords.some((k) => haystack.includes(k));
      if (!keywordHit) continue;

      const parsed = chrono.parse(`${subject}\n${body}`, receivedAt, { forwardDate: true });
      if (parsed.length === 0) continue;

      const best = parsed[0];
      const dt = best.start.date();
      const hasTime = best.start.isCertain("hour");

      const pad = (n) => String(n).padStart(2, "0");
      const dateStr = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
      const timeStr = hasTime ? `${pad(dt.getHours())}:${pad(dt.getMinutes())}` : "";

      candidates.push({
        id: msg.id,
        title: cleanSubject(subject).slice(0, 80),
        date: dateStr,
        time: timeStr,
        from,
        subject,
        snippet: msg.snippet,
      });
    }

    res.status(200).json({ candidates });
  } catch (err) {
    res.status(500).json({ error: String(err.message || err) });
  }
}
