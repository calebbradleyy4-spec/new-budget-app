import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Pencil, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import TransactionModal from './TransactionModal';
import styles from './Transactions.module.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(n);

export default function Transactions({
  transactions, addTransaction, updateTransaction, deleteTransaction,
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, CATEGORY_COLORS,
}) {
  const [modal,       setModal]       = useState(null); // null | 'add' | tx object
  const [search,      setSearch]      = useState('');
  const [filterType,  setFilterType]  = useState('all');
  const [filterCat,   setFilterCat]   = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [confirmDel,  setConfirmDel]  = useState(null);

  const allCategories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions]
  );

  // All available month options from transactions
  const monthOptions = useMemo(() => {
    const set = new Set(transactions.map((t) => t.date.slice(0, 7)));
    return [...set].sort().reverse();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => {
        if (filterType !== 'all' && t.type !== filterType) return false;
        if (filterCat && t.category !== filterCat) return false;
        if (filterMonth && !t.date.startsWith(filterMonth)) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!t.description.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filterType, filterCat, filterMonth, search]);

  // Summary of filtered results
  const summary = useMemo(() => {
    const income   = filtered.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  function handleSave(data) {
    if (modal?.id) {
      updateTransaction(modal.id, data);
    } else {
      addTransaction(data);
    }
    setModal(null);
  }

  function handleDelete(id) {
    deleteTransaction(id);
    setConfirmDel(null);
  }

  // Group by date
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((t) => {
      const key = t.date;
      (map[key] ??= []).push(t);
    });
    return Object.entries(map).sort((a, b) => new Date(b[0]) - new Date(a[0]));
  }, [filtered]);

  function fmtDate(iso) {
    const d = new Date(iso + 'T12:00:00');
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return 'Today';
    const y = new Date(now); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  }

  const hasFilters = filterType !== 'all' || filterCat || filterMonth || search;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Transactions</h2>
          <p className={styles.pageSub}>{transactions.length} total records</p>
        </div>
        <button className={styles.addBtn} onClick={() => setModal('add')}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      {/* Summary bar */}
      <div className={styles.summaryBar}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Income</span>
          <span className={`${styles.summaryVal} ${styles.green}`}>{fmt(summary.income)}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Expenses</span>
          <span className={`${styles.summaryVal} ${styles.red}`}>{fmt(summary.expenses)}</span>
        </div>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Net</span>
          <span className={`${styles.summaryVal} ${summary.net >= 0 ? styles.green : styles.red}`}>{fmt(summary.net)}</span>
        </div>
        {filtered.length !== transactions.length && (
          <span className={styles.filterNote}>({filtered.length} filtered)</span>
        )}
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            placeholder="Search transactions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.typeFilter}>
          {['all', 'income', 'expense'].map((t) => (
            <button
              key={t}
              className={`${styles.typeBtn} ${filterType === t ? styles.typeBtnActive : ''}`}
              onClick={() => setFilterType(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <select
          className={styles.select}
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
        >
          <option value="">All categories</option>
          {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          className={styles.select}
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
        >
          <option value="">All months</option>
          {monthOptions.map((m) => {
            const [y, mo] = m.split('-');
            const label = new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
            return <option key={m} value={m}>{label}</option>;
          })}
        </select>

        {hasFilters && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setFilterType('all'); setFilterCat(''); setFilterMonth(''); }}>
            Clear filters
          </button>
        )}
      </div>

      {/* List */}
      {grouped.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><Filter size={28} /></div>
          <p className={styles.emptyTitle}>{hasFilters ? 'No transactions match your filters' : 'No transactions yet'}</p>
          <p className={styles.emptySub}>{hasFilters ? 'Try adjusting your search or filters.' : 'Click "Add Transaction" to get started.'}</p>
        </div>
      ) : (
        <div className={styles.list}>
          {grouped.map(([date, txs]) => (
            <div key={date} className={styles.dateGroup}>
              <div className={styles.dateLabel}>{fmtDate(date)}</div>
              {txs.map((t) => (
                <div key={t.id} className={styles.txRow}>
                  <div
                    className={styles.txIcon}
                    style={{
                      background: t.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
                      color:      t.type === 'income' ? 'var(--green)' : 'var(--red)',
                    }}
                  >
                    {t.type === 'income' ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
                  </div>

                  <div className={styles.txBody}>
                    <span className={styles.txDesc}>{t.description}</span>
                    <span className={styles.txCat}>
                      <span
                        className={styles.catDot}
                        style={{ background: CATEGORY_COLORS[t.category] ?? '#6b7280' }}
                      />
                      {t.category}
                    </span>
                  </div>

                  <span className={`${styles.txAmt} ${t.type === 'income' ? styles.green : styles.red}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </span>

                  <div className={styles.txActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => setModal(t)}
                      aria-label="Edit"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      onClick={() => setConfirmDel(t.id)}
                      aria-label="Delete"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <TransactionModal
          tx={modal === 'add' ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
          INCOME_CATEGORIES={INCOME_CATEGORIES}
          EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className={styles.confirmBackdrop} onClick={(e) => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>Delete transaction?</p>
            <p className={styles.confirmSub}>This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className={styles.deleteConfirmBtn} onClick={() => handleDelete(confirmDel)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
