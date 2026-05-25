import { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Transactions from './components/Transactions';
import Goals from './components/Goals';
import { useBudget } from './hooks/useBudget';

function App() {
  const [page,        setPage]        = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const budget = useBudget();

  function renderPage() {
    switch (page) {
      case 'dashboard':
        return (
          <Dashboard
            transactions={budget.transactions}
            goals={budget.goals}
            CATEGORY_COLORS={budget.CATEGORY_COLORS}
            onNavigate={setPage}
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
    >
      {renderPage()}
    </Layout>
  );
}

export default App;
