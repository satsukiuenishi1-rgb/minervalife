import { useEffect, useRef, useState } from "react";

const CODE_KEY = "minerva-life:sync-code";
const LAST_SYNCED_KEY = "minerva-life:sync-last-updated-at";
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

export function getSyncCode() {
  try {
    return window.localStorage.getItem(CODE_KEY) || "";
  } catch {
    return "";
  }
}

export function setSyncCodeStorage(code) {
  try {
    window.localStorage.setItem(CODE_KEY, code);
  } catch {
    // ignore
  }
}

export function clearSyncCodeStorage() {
  try {
    window.localStorage.removeItem(CODE_KEY);
    window.localStorage.removeItem(LAST_SYNCED_KEY);
  } catch {
    // ignore
  }
}

function getLastSyncedAt() {
  const raw = window.localStorage.getItem(LAST_SYNCED_KEY);
  return raw ? Number(raw) : 0;
}

function setLastSyncedAt(ts) {
  window.localStorage.setItem(LAST_SYNCED_KEY, String(ts));
}

export function generateSyncCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Keeps the local app state in sync with a server-side copy identified by
 * a short code. Pulls on mount/code change if the server has something
 * newer; otherwise debounced-pushes local changes to the server. Simple
 * last-write-wins — fine for one person using 2-3 of their own devices.
 */
export function useCloudSync(code, rawState, importData) {
  const [status, setStatus] = useState("idle"); // idle | syncing | synced | error
  const pushTimer = useRef(null);
  const hasPulledForCode = useRef(null);
  const suppressNextPush = useRef(false);

  // Pull on mount / when the code changes
  useEffect(() => {
    if (!code) return;
    if (hasPulledForCode.current === code) return;
    hasPulledForCode.current = code;

    let cancelled = false;
    setStatus("syncing");

    fetch(`/api/sync?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.found && data.updatedAt > getLastSyncedAt()) {
          suppressNextPush.current = true;
          importData(data.state);
          setLastSyncedAt(data.updatedAt);
        }
        setStatus("synced");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Debounced push whenever local state changes
  useEffect(() => {
    if (!code) return;
    if (suppressNextPush.current) {
      suppressNextPush.current = false;
      return;
    }

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      setStatus("syncing");
      fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, state: rawState }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok) {
            setLastSyncedAt(data.updatedAt);
            setStatus("synced");
          } else {
            setStatus("error");
          }
        })
        .catch(() => setStatus("error"));
    }, 1500);

    return () => clearTimeout(pushTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, JSON.stringify(rawState)]);

  return status;
}
