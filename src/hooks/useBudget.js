import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'budget_app_data';

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Refund', 'Other',
];

const EXPENSE_CATEGORIES = [
  'Housing', 'Food & Dining', 'Transport', 'Entertainment', 'Shopping',
  'Health', 'Education', 'Utilities', 'Subscriptions', 'Travel', 'Other',
];

const CATEGORY_COLORS = {
  // Income
  Salary:        '#22c55e',
  Freelance:     '#06b6d4',
  Investment:    '#a855f7',
  Business:      '#f59e0b',
  Gift:          '#ec4899',
  Refund:        '#84cc16',
  // Expense
  Housing:       '#ef4444',
  'Food & Dining': '#f97316',
  Transport:     '#eab308',
  Entertainment: '#8b5cf6',
  Shopping:      '#06b6d4',
  Health:        '#10b981',
  Education:     '#6366f1',
  Utilities:     '#f59e0b',
  Subscriptions: '#ec4899',
  Travel:        '#0ea5e9',
  Other:         '#6b7280',
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function getDefaultData() {
  // Seed with a few sample transactions so the app doesn't look empty
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const tx = (type, amount, category, description, daysAgo) => {
    const d = new Date(year, month, now.getDate() - daysAgo);
    return {
      id: generateId(),
      type,
      amount,
      category,
      description,
      date: d.toISOString().slice(0, 10),
      createdAt: d.getTime(),
    };
  };

  return {
    transactions: [
      tx('income',  3500, 'Salary',        'Monthly salary',        28),
      tx('income',   800, 'Freelance',      'Web project',           20),
      tx('expense',  950, 'Housing',        'Rent',                  27),
      tx('expense',  120, 'Food & Dining',  'Groceries',             25),
      tx('expense',   55, 'Transport',      'Gas & parking',         24),
      tx('expense',   45, 'Subscriptions',  'Netflix, Spotify',      22),
      tx('expense',   80, 'Entertainment',  'Movie & dinner',        18),
      tx('income',   200, 'Investment',     'Dividend payout',       15),
      tx('expense',  200, 'Shopping',       'New shoes',             14),
      tx('expense',   30, 'Health',         'Gym membership',        12),
      tx('expense',   65, 'Food & Dining',  'Restaurants',           10),
      tx('expense',   90, 'Utilities',      'Electric & water',       8),
      tx('income',   150, 'Freelance',      'Logo design',            5),
      tx('expense',   40, 'Transport',      'Uber rides',             3),
      tx('expense',   25, 'Food & Dining',  'Coffee & snacks',        1),
    ],
    goals: [
      { id: generateId(), category: 'Housing',       limit: 1000, period: 'monthly' },
      { id: generateId(), category: 'Food & Dining', limit: 300,  period: 'monthly' },
      { id: generateId(), category: 'Transport',     limit: 150,  period: 'monthly' },
      { id: generateId(), category: 'Entertainment', limit: 100,  period: 'monthly' },
      { id: generateId(), category: 'Shopping',      limit: 250,  period: 'monthly' },
    ],
  };
}

export function useBudget() {
  const [data, setData] = useState(() => loadData() ?? getDefaultData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  // ─── Transactions ─────────────────────────────────────────────
  const addTransaction = useCallback((tx) => {
    setData((prev) => ({
      ...prev,
      transactions: [
        { ...tx, id: generateId(), createdAt: Date.now() },
        ...prev.transactions,
      ],
    }));
  }, []);

  const updateTransaction = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    }));
  }, []);

  const deleteTransaction = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  }, []);

  // ─── Goals ────────────────────────────────────────────────────
  const addGoal = useCallback((goal) => {
    setData((prev) => ({
      ...prev,
      goals: [...prev.goals, { ...goal, id: generateId() }],
    }));
  }, []);

  const updateGoal = useCallback((id, updates) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id) => {
    setData((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g.id !== id),
    }));
  }, []);

  // ─── Derived helpers ──────────────────────────────────────────
  const getMonthTransactions = useCallback(
    (year, month) =>
      data.transactions.filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [data.transactions]
  );

  return {
    transactions: data.transactions,
    goals: data.goals,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    getMonthTransactions,
    INCOME_CATEGORIES,
    EXPENSE_CATEGORIES,
    CATEGORY_COLORS,
  };
}
