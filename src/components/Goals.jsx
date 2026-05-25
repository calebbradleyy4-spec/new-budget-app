import { useState, useMemo } from 'react';
import { Plus, Trash2, Pencil, Target, Check, AlertTriangle, TrendingUp } from 'lucide-react';
import styles from './Goals.module.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

function GoalModal({ goal, existingCategories, EXPENSE_CATEGORIES, onSave, onClose }) {
  const [category, setCategory] = useState(goal?.category ?? '');
  const [limit,    setLimit]    = useState(goal?.limit    ?? '');
  const [error,    setError]    = useState('');

  const available = EXPENSE_CATEGORIES.filter(
    (c) => !existingCategories.includes(c) || c === goal?.category
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!category)               return setError('Select a category.');
    if (!limit || Number(limit) <= 0) return setError('Enter a valid budget amount.');
    setError('');
    onSave({ category, limit: Number(limit), period: 'monthly' });
  }

  return (
    <div className={styles.backdrop} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{goal ? 'Edit Budget Goal' : 'New Budget Goal'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.field}>
            <label className={styles.label}>Category</label>
            <select
              className={styles.select}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={!!goal}
            >
              <option value="">Select category…</option>
              {available.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Monthly limit ($)</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              step="1"
              placeholder="0"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              autoFocus={!!goal}
            />
          </div>
          {error && <p className={styles.error}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn}>
              {goal ? 'Save changes' : 'Add goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Goals({
  goals, transactions, addGoal, updateGoal, deleteGoal,
  EXPENSE_CATEGORIES, CATEGORY_COLORS,
}) {
  const [modal,      setModal]      = useState(null); // null | 'add' | goal obj
  const [confirmDel, setConfirmDel] = useState(null);

  const now = new Date();
  const yr  = now.getFullYear();
  const mo  = now.getMonth();

  // Spending per category this month
  const spendingMap = useMemo(() => {
    const map = {};
    transactions.forEach((t) => {
      const d = new Date(t.date);
      if (t.type === 'expense' && d.getFullYear() === yr && d.getMonth() === mo) {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      }
    });
    return map;
  }, [transactions, yr, mo]);

  const enriched = useMemo(
    () =>
      goals.map((g) => ({
        ...g,
        spent: spendingMap[g.category] ?? 0,
        pct:   Math.min((spendingMap[g.category] ?? 0) / g.limit, 1),
      })).sort((a, b) => b.pct - a.pct),
    [goals, spendingMap]
  );

  const existingCategories = goals.map((g) => g.category);

  // Uncovered categories (have spending but no goal)
  const untracked = useMemo(() => {
    return Object.entries(spendingMap)
      .filter(([cat]) => !existingCategories.includes(cat) && EXPENSE_CATEGORIES.includes(cat))
      .sort((a, b) => b[1] - a[1]);
  }, [spendingMap, existingCategories, EXPENSE_CATEGORIES]);

  function handleSave(data) {
    if (modal?.id) updateGoal(modal.id, data);
    else           addGoal(data);
    setModal(null);
  }

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const canAddMore = existingCategories.length < EXPENSE_CATEGORIES.length;

  // Summary stats
  const totalBudget = enriched.reduce((s, g) => s + g.limit, 0);
  const totalSpent  = enriched.reduce((s, g) => s + g.spent, 0);
  const onTrack     = enriched.filter((g) => g.pct < 0.8).length;
  const atRisk      = enriched.filter((g) => g.pct >= 0.8 && g.pct < 1).length;
  const over        = enriched.filter((g) => g.pct >= 1).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Budget Goals</h2>
          <p className={styles.pageSub}>{monthName} · {enriched.length} goals set</p>
        </div>
        {canAddMore && (
          <button className={styles.addBtn} onClick={() => setModal('add')}>
            <Plus size={16} /> Add Goal
          </button>
        )}
      </div>

      {/* Stats */}
      {enriched.length > 0 && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Budget</span>
            <span className={styles.statVal}>{fmt(totalBudget)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Spent</span>
            <span className={`${styles.statVal} ${totalSpent > totalBudget ? styles.red : ''}`}>{fmt(totalSpent)}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Remaining</span>
            <span className={`${styles.statVal} ${totalBudget - totalSpent < 0 ? styles.red : styles.green}`}>{fmt(Math.max(totalBudget - totalSpent, 0))}</span>
          </div>
          <div className={styles.statCard}>
            <TrendingUp size={14} style={{ color: 'var(--green)' }} />
            <span className={styles.statusPill} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>{onTrack} on track</span>
            {atRisk > 0 && <span className={styles.statusPill} style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>{atRisk} at risk</span>}
            {over  > 0 && <span className={styles.statusPill} style={{ background: 'var(--red-dim)',   color: 'var(--red)'   }}>{over} over</span>}
          </div>
        </div>
      )}

      {/* Goals grid */}
      {enriched.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}><Target size={32} /></div>
          <p className={styles.emptyTitle}>No budget goals yet</p>
          <p className={styles.emptySub}>Set spending limits for your expense categories to stay on track.</p>
          <button className={styles.addBtn} onClick={() => setModal('add')}>
            <Plus size={15} /> Set your first goal
          </button>
        </div>
      ) : (
        <div className={styles.goalGrid}>
          {enriched.map((g) => {
            const pctNum = Math.round(g.pct * 100);
            const remaining = g.limit - g.spent;
            const isOver = g.pct >= 1;
            const isWarn = g.pct >= 0.8 && !isOver;
            const statusColor = isOver ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--green)';
            const barBg      = isOver ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--green)';

            return (
              <div key={g.id} className={`${styles.goalCard} ${isOver ? styles.goalCardOver : isWarn ? styles.goalCardWarn : ''}`}>
                <div className={styles.goalTop}>
                  <div className={styles.goalMeta}>
                    <span
                      className={styles.goalDot}
                      style={{ background: CATEGORY_COLORS[g.category] ?? '#6b7280' }}
                    />
                    <span className={styles.goalCat}>{g.category}</span>
                  </div>
                  <div className={styles.goalBadge} style={{ background: `${statusColor}20`, color: statusColor }}>
                    {isOver ? <><AlertTriangle size={11} /> Over</> : isWarn ? <><AlertTriangle size={11} /> At risk</> : <><Check size={11} /> On track</>}
                  </div>
                </div>

                {/* Big progress number */}
                <div className={styles.goalNumbers}>
                  <span className={styles.goalSpent}>{fmt(g.spent)}</span>
                  <span className={styles.goalOf}> / {fmt(g.limit)}</span>
                </div>

                {/* Bar */}
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${pctNum}%`, background: barBg }}
                  />
                </div>

                <div className={styles.goalFooter}>
                  <span className={styles.goalPct} style={{ color: statusColor }}>{pctNum}% used</span>
                  <span className={styles.goalRemaining}>
                    {isOver
                      ? <span style={{ color: 'var(--red)' }}>{fmt(Math.abs(remaining))} over budget</span>
                      : <span style={{ color: 'var(--text-muted)' }}>{fmt(remaining)} left</span>
                    }
                  </span>
                </div>

                <div className={styles.goalActions}>
                  <button className={styles.editBtn} onClick={() => setModal(g)}>
                    <Pencil size={12} /> Edit limit
                  </button>
                  <button className={styles.delBtn} onClick={() => setConfirmDel(g.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Untracked categories */}
      {untracked.length > 0 && (
        <div className={styles.untrackedSection}>
          <h3 className={styles.untrackedTitle}>Untracked Spending</h3>
          <p className={styles.untrackedSub}>You have spending in these categories without a budget goal.</p>
          <div className={styles.untrackedList}>
            {untracked.map(([cat, amount]) => (
              <div key={cat} className={styles.untrackedItem}>
                <span className={styles.goalDot} style={{ background: CATEGORY_COLORS[cat] ?? '#6b7280' }} />
                <span className={styles.untrackedCat}>{cat}</span>
                <span className={styles.untrackedAmt}>{fmt(amount)}</span>
                <button
                  className={styles.addGoalBtn}
                  onClick={() => setModal({ newFor: cat })}
                >
                  + Set goal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <GoalModal
          goal={modal === 'add' || modal?.newFor ? null : modal}
          existingCategories={existingCategories}
          EXPENSE_CATEGORIES={EXPENSE_CATEGORIES}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete confirm */}
      {confirmDel && (
        <div className={styles.confirmBackdrop} onClick={(e) => e.target === e.currentTarget && setConfirmDel(null)}>
          <div className={styles.confirmBox}>
            <p className={styles.confirmTitle}>Remove goal?</p>
            <p className={styles.confirmSub}>This won't delete any transactions.</p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtnSm} onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className={styles.delConfirmBtn} onClick={() => { deleteGoal(confirmDel); setConfirmDel(null); }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
