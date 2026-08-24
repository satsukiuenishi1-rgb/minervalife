import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "minerva-life:v1";
const GMAIL_TOKEN_KEY = "minerva-life:gmail-refresh-token";

export const DEFAULT_GMAIL_KEYWORDS = [
  "house meeting",
  "mandatory",
  "orientation",
  "reminder",
  "deadline",
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

const DEFAULT_STATE = {
  settings: {
    currency: "USD",
    weeklyBudget: 150,
    city: "",
    term: "",
    gmailKeywords: DEFAULT_GMAIL_KEYWORDS.join(", "),
  },
  tasks: [],
  transactions: [],
  importedGmailIds: [],
};

// The Gmail refresh token is kept in its own storage key (separate from
// the exportable app state) so it is never included in data export/import.
export function getGmailToken() {
  try {
    return window.localStorage.getItem(GMAIL_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setGmailToken(token) {
  try {
    window.localStorage.setItem(GMAIL_TOKEN_KEY, token);
  } catch (err) {
    console.error("Failed to save Gmail token", err);
  }
}

export function clearGmailToken() {
  try {
    window.localStorage.removeItem(GMAIL_TOKEN_KEY);
  } catch (err) {
    console.error("Failed to clear Gmail token", err);
  }
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
      importedGmailIds: Array.isArray(parsed.importedGmailIds) ? parsed.importedGmailIds : [],
    };
  } catch (err) {
    console.error("Failed to load Minerva Life data", err);
    return structuredClone(DEFAULT_STATE);
  }
}

function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save Minerva Life data", err);
  }
}

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function useAppData() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addTask = useCallback((task) => {
    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        {
          id: makeId(),
          title: task.title,
          date: task.date,
          time: task.time || "",
          done: false,
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const toggleTask = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }, []);

  const deleteTask = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const addTransaction = useCallback((tx) => {
    setState((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions,
        {
          id: makeId(),
          type: tx.type, // "expense" | "income"
          amount: Math.abs(Number(tx.amount) || 0),
          category: tx.category || "その他",
          note: tx.note || "",
          date: tx.date,
          createdAt: Date.now(),
        },
      ],
    }));
  }, []);

  const deleteTransaction = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  const updateSettings = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...patch },
    }));
  }, []);

  const resetAll = useCallback(() => {
    setState(structuredClone(DEFAULT_STATE));
  }, []);

  const importData = useCallback((data) => {
    setState({
      settings: { ...DEFAULT_STATE.settings, ...(data.settings || {}) },
      tasks: Array.isArray(data.tasks) ? data.tasks : [],
      transactions: Array.isArray(data.transactions) ? data.transactions : [],
      importedGmailIds: Array.isArray(data.importedGmailIds) ? data.importedGmailIds : [],
    });
  }, []);

  const markGmailIdsImported = useCallback((ids) => {
    setState((prev) => ({
      ...prev,
      importedGmailIds: [...new Set([...prev.importedGmailIds, ...ids])],
    }));
  }, []);

  return {
    settings: state.settings,
    tasks: state.tasks,
    transactions: state.transactions,
    importedGmailIds: state.importedGmailIds,
    addTask,
    toggleTask,
    deleteTask,
    addTransaction,
    deleteTransaction,
    updateSettings,
    resetAll,
    importData,
    markGmailIdsImported,
    rawState: state,
  };
}
