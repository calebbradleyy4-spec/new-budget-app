import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
          <Icon size={16} />
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

export default function Dashboard({ transactions, goals, CATEGORY_COLORS, onNavigate }) {
  const now = new Date();
  const yr = now.getFullYear();
  const mo = now.getMonth();

  // Current month totals
  const { income, expenses, balance } = useMemo(() => {
    const thisMonth = transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === yr && d.getMonth() === mo;
    });
    const income = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expenses = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions, yr, mo]);

  // All-time balance
  const totalBalance = useMemo(
    () => transactions.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0),
    [transactions]
  );

  // Last 6 months chart data
  const areaData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(yr, mo - 5 + i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const month = d.toLocaleString('default', { month: 'short' });
      const txs = transactions.filter((t) => {
        const td = new Date(t.date);
        return td.getFullYear() === y && td.getMonth() === m;
      });
      return {
        month,
        Income: txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
        Expenses: txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, yr, mo]);

  // Expense breakdown pie
  const pieData = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getFullYear() === yr && d.getMonth() === mo;
      })
      .forEach((t) => {
        map[t.category] = (map[t.category] ?? 0) + t.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value, fill: CATEGORY_COLORS[name] ?? '#6b7280' }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, yr, mo, CATEGORY_COLORS]);

  // Recent transactions
  const recent = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8),
    [transactions]
  );

  // Top goal alerts
  const goalAlerts = useMemo(() => {
    return goals.map((g) => {
      const spent = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return t.type === 'expense' && t.category === g.category
            && d.getFullYear() === yr && d.getMonth() === mo;
        })
        .reduce((s, t) => s + t.amount, 0);
      return { ...g, spent, pct: Math.min(spent / g.limit, 1) };
    }).sort((a, b) => b.pct - a.pct).slice(0, 3);
  }, [goals, transactions, yr, mo]);

  const monthName = now.toLocaleString('default', { month: 'long' });

  return (
    <div className={styles.grid}>
      {/* Stats row */}
      <div className={styles.stats}>
        <StatCard title="Total Balance"   value={totalBalance} icon={Wallet}       color="#6366f1" sub="All time" />
        <StatCard title={`${monthName} Income`}   value={income}   icon={TrendingUp}   color="#22c55e" sub={`${transactions.filter(t => { const d=new Date(t.date); return d.getFullYear()===yr&&d.getMonth()===mo&&t.type==='income'; }).length} transactions`} trend="up" />
        <StatCard title={`${monthName} Expenses`} value={expenses} icon={TrendingDown} color="#ef4444" sub={`${transactions.filter(t => { const d=new Date(t.date); return d.getFullYear()===yr&&d.getMonth()===mo&&t.type==='expense'; }).length} transactions`} trend="down" />
        <StatCard title="Monthly Savings"  value={balance}  icon={Wallet}       color={balance >= 0 ? '#22c55e' : '#ef4444'} sub={balance >= 0 ? 'Great job!' : 'Over budget'} trend={balance >= 0 ? 'up' : 'down'} />
      </div>

      {/* Area chart */}
      <div className={`${styles.card} ${styles.areaCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Income vs Expenses</h3>
            <p className={styles.cardSub}>Last 6 months</p>
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

      {/* Pie chart */}
      <div className={`${styles.card} ${styles.pieCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Spending by Category</h3>
            <p className={styles.cardSub}>{monthName} breakdown</p>
          </div>
        </div>
        {pieData.length === 0 ? (
          <div className={styles.emptyPie}>No expenses this month</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className={styles.pieList}>
              {pieData.map((d) => (
                <div key={d.name} className={styles.pieRow}>
                  <span className={styles.pieDot} style={{ background: d.fill }} />
                  <span className={styles.pieName}>{d.name}</span>
                  <span className={styles.pieVal}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Budget goal alerts */}
      {goalAlerts.length > 0 && (
        <div className={`${styles.card} ${styles.goalsCard}`}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Budget Progress</h3>
              <p className={styles.cardSub}>Top categories this month</p>
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

      {/* Recent transactions */}
      <div className={`${styles.card} ${styles.recentCard}`}>
        <div className={styles.cardHeader}>
          <div>
            <h3 className={styles.cardTitle}>Recent Transactions</h3>
            <p className={styles.cardSub}>Latest activity</p>
          </div>
          <button className={styles.cardLink} onClick={() => onNavigate('transactions')}>View all →</button>
        </div>
        {recent.length === 0 ? (
          <div className={styles.emptyPie}>No transactions yet</div>
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
