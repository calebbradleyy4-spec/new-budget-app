import { useState, useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Wallet,
  ArrowUpRight, ArrowDownRight, Target, Plus,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import styles from './Dashboard.module.css';

const fmt = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtShort = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statHeader}>
        <span className={styles.statLabel}>{title}</span>
        <div className={styles.statIcon} style={{ background: `${color}20`, color }}>
          <Icon size={15} />
        </div>
      </div>
      <div className={styles.statValue}>{fmt(value)}</div>
      {sub && (
        <div className={`${styles.statSub} ${trend === 'up' ? styles.subGreen : trend === 'down' ? styles.subRed : ''}`}>
          {trend === 'up' && <ArrowUpRight size={12} />}
          {trend === 'down' && <ArrowDownRight size={12} />}
          {sub}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className={styles.tooltipRow}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipRow}>
        <span style={{ color: payload[0].payload.fill }}>{payload[0].name}</span>
        <span>{fmt(payload[0].value)}</span>
      </div>
    </div>
  );
};

export default function Dashboard({ transactions, goals, CATEGORY_COLORS, onNavigate, onOpenAddModal }) {
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  const [selYear,  setSelYear]  = useState(currentYear);
  const [selMonth, setSelMonth] = useState(currentMonth);

  const isCurrentMonth = selYear === currentYear && selMonth === currentMonth;

  function goToPrev() {
    if (selMonth === 0) { setSelMonth(11); setSelYear((y) => y - 1); }
    else { setSelMonth((m) => m - 1); }
  }

  function goToNext() {
    if (isCurrentMonth) return;
    if (selMonth === 11) { setSelMonth(0); setSelYear((y) => y + 1); }
    else { setSelMonth((m) => m + 1); }
  }

  const selDate   = new Date(selYear, selMonth, 1);
  const monthName = selDate.toLocaleString('default', { month: 'long' });
  const monthLabel = selDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  // ── Stats for selected month ──────────────────────────────────────
  const { income, expenses, balance, incomeCount, expenseCount } = useMemo(() => {
    const mo = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === selYear && d.getMonth() === selMonth;
    });
    const inc = mo.filter((t) => t.type === 'income');
    const exp = mo.filter((t) => t.type === 'expense');
    const income   = inc.reduce((s, t) => s + t.amount, 0);
    const expenses = exp.reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses, incomeCount: inc.length, expenseCount: exp.length };
  }, [transactions, selYear, selMonth]);

  // All-time balance (unaffected by month selection)
  const totalBalance = useMemo(
    () => transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    [transactions]
  );

  // ── Area chart: 6 months ending at selected month ─────────────────
  const areaData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(selYear, selMonth - 5 + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getFullYear() === y && td.getMonth() === m;
      });
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        Income:   txs.filter((t) => t.type === 'income').reduce((s, t)  => s + t.amount, 0),
        Expenses: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, selYear, selMonth]);

  // ── Spending pie for selected month ───────────────────────────────
  const pieData = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getFullYear() === selYear && d.getMonth() === selMonth;
      })
      .forEach((t) => { map[t.category] = (map[t.category] ?? 0) + t.amount; });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] ?? '#6b7280' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, selYear, selMonth, CATEGORY_COLORS]);

  const pieTotal = useMemo(() => pieData.reduce((s, d) => s + d.value, 0), [pieData]);

  // ── Recent transactions for selected month ────────────────────────
  const recent = useMemo(() => {
    return transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === selYear && d.getMonth() === selMonth;
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [transactions, selYear, selMonth]);

  // ── Goal alerts for selected month ────────────────────────────────
  const goalAlerts = useMemo(() => {
    return goals.map((g) => {
      const spent = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return t.type === 'expense' && t.category === g.category
            && d.getFullYear() === selYear && d.getMonth() === selMonth;
        })
        .reduce((s, t) => s + t.amount, 0);
      return { ...g, spent, pct: Math.min(spent / g.limit, 1) };
    }).sort((a, b) => b.pct - a.pct).slice(0, 3);
  }, [goals, transactions, selYear, selMonth]);

  const isEmpty = transactions.length === 0;

  return (
    <div className={styles.grid}>

      {/* ── Month navigator ── */}
      <div className={styles.monthNav}>
        <button className={styles.monthNavBtn} onClick={goToPrev} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <div className={styles.monthNavCenter}>
          <span className={styles.monthNavLabel}>{monthLabel}</span>
          {isCurrentMonth && <span className={styles.monthNavBadge}>Current</span>}
        </div>
        <button
          className={styles.monthNavBtn}
          onClick={goToNext}
          disabled={isCurrentMonth}
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* ── Stats row — always visible ── */}
      <div className={styles.stats}>
        <StatCard title="Total Balance"    value={totalBalance} icon={Wallet}       color="#6366f1" sub="All time" />
        <StatCard title="Income"           value={income}   icon={TrendingUp}   color="#22c55e"
          sub={incomeCount ? `${incomeCount} transaction${incomeCount !== 1 ? 's' : ''}` : 'No income yet'}
          trend={income > 0 ? 'up' : undefined} />
        <StatCard title="Expenses"         value={expenses} icon={TrendingDown} color="#ef4444"
          sub={expenseCount ? `${expenseCount} transaction${expenseCount !== 1 ? 's' : ''}` : 'No expenses yet'}
          trend={expenses > 0 ? 'down' : undefined} />
        <StatCard title="Net Savings"      value={balance}  icon={Wallet}
          color={balance >= 0 ? '#22c55e' : '#ef4444'}
          sub={isEmpty ? 'Add transactions to start' : balance >= 0 ? 'Great job!' : 'Over budget'}
          trend={isEmpty ? undefined : balance >= 0 ? 'up' : 'down'} />
      </div>

      {/* ── Quickstart — only when no transactions at all ── */}
      {isEmpty && (
        <div className={`${styles.card} ${styles.quickstartCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Get started</h3>
              <p className={styles.cardSub}>Add your first transaction to start tracking your budget</p>
            </div>
          </div>
          <div className={styles.quickstartGrid}>
            <button className={styles.quickBtn} onClick={onOpenAddModal}>
              <div className={styles.quickBtnIcon} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                <ArrowUpRight size={22} />
              </div>
              <span className={styles.quickBtnLabel}>Track Income</span>
              <span className={styles.quickBtnSub}>Log your earnings</span>
            </button>
            <button className={styles.quickBtn} onClick={onOpenAddModal}>
              <div className={styles.quickBtnIcon} style={{ background: 'var(--red-dim)', color: 'var(--red)' }}>
                <ArrowDownRight size={22} />
              </div>
              <span className={styles.quickBtnLabel}>Track Expenses</span>
              <span className={styles.quickBtnSub}>Record your spending</span>
            </button>
            <button className={styles.quickBtn} onClick={() => onNavigate('goals')}>
              <div className={styles.quickBtnIcon} style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                <Target size={22} />
              </div>
              <span className={styles.quickBtnLabel}>Set Budget Goals</span>
              <span className={styles.quickBtnSub}>Define spending limits</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Area chart ── */}
      <div className={`${styles.card} ${styles.areaCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Income vs Expenses</h3>
            <p className={styles.cardSub}>6 months ending {monthName}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={areaData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="gIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtShort} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="Income"   stroke="#22c55e" strokeWidth={2} fill="url(#gIncome)"   />
            <Area type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} fill="url(#gExpenses)" />
          </AreaChart>
        </ResponsiveContainer>
        <div className={styles.chartLegend}>
          <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#22c55e' }} />Income</div>
          <div className={styles.legendItem}><span className={styles.legendDot} style={{ background: '#ef4444' }} />Expenses</div>
        </div>
      </div>

      {/* ── Spending breakdown ── */}
      <div className={`${styles.card} ${goalAlerts.length > 0 ? styles.pieCard : styles.areaCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Spending by Category</h3>
            <p className={styles.cardSub}>{monthLabel} breakdown</p>
          </div>
        </div>
        {pieData.length === 0 ? (
          <div className={styles.emptyPie}>
            <p>No expenses in {monthName}</p>
            <button className={styles.emptyPieBtn} onClick={onOpenAddModal}>
              <Plus size={13} /> Add expense
            </button>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={44} outerRadius={72}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.catBreakdown}>
              {pieData.map((d) => {
                const pct = pieTotal > 0 ? Math.round((d.value / pieTotal) * 100) : 0;
                return (
                  <div key={d.name} className={styles.catRow}>
                    <div className={styles.catMeta}>
                      <span className={styles.catDot} style={{ background: d.fill }} />
                      <span className={styles.catName}>{d.name}</span>
                      <span className={styles.catPct}>{pct}%</span>
                      <span className={styles.catVal}>{fmt(d.value)}</span>
                    </div>
                    <div className={styles.catBar}>
                      <div className={styles.catBarFill} style={{ width: `${pct}%`, background: d.fill }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Budget progress ── */}
      {goalAlerts.length > 0 && (
        <div className={`${styles.card} ${styles.goalsCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Budget Progress</h3>
              <p className={styles.cardSub}>Top categories · {monthName}</p>
            </div>
            <button className={styles.cardLink} onClick={() => onNavigate('goals')}>View all →</button>
          </div>
          <div className={styles.goalList}>
            {goalAlerts.map((g) => {
              const pctNum = Math.round(g.pct * 100);
              const isOver = g.pct >= 1;
              const isWarn = g.pct >= 0.8 && !isOver;
              return (
                <div key={g.id} className={styles.goalItem}>
                  <div className={styles.goalRow}>
                    <span className={styles.goalCat}>{g.category}</span>
                    <span className={`${styles.goalPct} ${isOver ? styles.pctRed : isWarn ? styles.pctAmber : styles.pctGreen}`}>
                      {isOver ? `${pctNum}% — Over!` : `${fmt(g.spent)} / ${fmt(g.limit)}`}
                    </span>
                  </div>
                  <div className={styles.bar}>
                    <div
                      className={`${styles.barFill} ${isOver ? styles.barRed : isWarn ? styles.barAmber : styles.barGreen}`}
                      style={{ width: `${pctNum}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transactions for selected month ── */}
      <div className={`${styles.card} ${styles.recentCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Transactions</h3>
            <p className={styles.cardSub}>{monthLabel}</p>
          </div>
          <button className={styles.cardLink} onClick={() => onNavigate('transactions')}>View all →</button>
        </div>
        {recent.length === 0 ? (
          <div className={styles.emptyPie}>
            <p>No transactions in {monthName}</p>
            <button className={styles.emptyPieBtn} onClick={onOpenAddModal}>
              <Plus size={13} /> Add transaction
            </button>
          </div>
        ) : (
          <div className={styles.txList}>
            {recent.map((t) => (
              <div key={t.id} className={styles.txItem}>
                <div className={styles.txDot} style={{
                  background: t.type === 'income' ? 'var(--green-dim)' : 'var(--red-dim)',
                  color:      t.type === 'income' ? 'var(--green)'    : 'var(--red)',
                }}>
                  {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                </div>
                <div className={styles.txMeta}>
                  <span className={styles.txDesc}>{t.description}</span>
                  <span className={styles.txCat}>{t.category} · {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
                <span className={`${styles.txAmount} ${t.type === 'income' ? styles.amtGreen : styles.amtRed}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
