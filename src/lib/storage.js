import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "minerva-life:v1";

const DEFAULT_STATE = {
  settings: {
    currency: "USD",
    weeklyBudget: 150,
    city: "",
    term: "",
  },
  tasks: [],
  transactions: [],
};

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATE);
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
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
    });
  }, []);

  return {
    settings: state.settings,
    tasks: state.tasks,
    transactions: state.transactions,
    addTask,
    toggleTask,
    deleteTask,
    addTransaction,
    deleteTransaction,
    updateSettings,
    resetAll,
    importData,
    rawState: state,
  };
}
