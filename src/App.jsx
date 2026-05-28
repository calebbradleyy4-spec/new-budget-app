import { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import TransactionModal from './components/TransactionModal';
import { useBudget } from './hooks/useBudget';

function getInitialTheme() {
  const saved = localStorage.getItem('budget_theme');
  if (saved === 'light' || saved === 'dark') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function App() {
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme,       setTheme]       = useState(getInitialTheme);
  const [showAddModal, setShowAddModal] = useState(false);

  const budget = useBudget();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('budget_theme', theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={budget.transactions}
            goals={budget.goals}
            CATEGORY_COLORS={budget.CATEGORY_COLORS}
            onNavigate={setPage}
            onOpenAddModal={() => setShowAddModal(true)}
          />
        );
      case 'transactions':
        return (
          <Transactions
            transactions={budget.transactions}
            addTransaction={budget.addTransaction}
            updateTransaction={budget.updateTransaction}
            deleteTransaction={budget.deleteTransaction}
            INCOME_CATEGORIES={budget.INCOME_CATEGORIES}
            EXPENSE_CATEGORIES={budget.EXPENSE_CATEGORIES}
            CATEGORY_COLORS={budget.CATEGORY_COLORS}
          />
        );
      case 'goals':
        return (
          <Goals
            goals={budget.goals}
            transactions={budget.transactions}
            addGoal={budget.addGoal}
            updateGoal={budget.updateGoal}
            deleteGoal={budget.deleteGoal}
            EXPENSE_CATEGORIES={budget.EXPENSE_CATEGORIES}
            CATEGORY_COLORS={budget.CATEGORY_COLORS}
          />
        );
      default:
        return null;
    }
  }

  return (
    <Layout
      page={page}
      onNavigate={setPage}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={setSidebarOpen}
      theme={theme}
      onToggleTheme={toggleTheme}
      onOpenAddModal={() => setShowAddModal(true)}
    >
      {renderPage()}

      {showAddModal && (
        <TransactionModal
          onClose={() => setShowAddModal(false)}
          onSave={(tx) => { budget.addTransaction(tx); setShowAddModal(false); }}
          INCOME_CATEGORIES={budget.INCOME_CATEGORIES}
          EXPENSE_CATEGORIES={budget.EXPENSE_CATEGORIES}
        />
      )}
    </Layout>
  );
}

export default App;
