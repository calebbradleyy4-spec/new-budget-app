import { LayoutDashboard, ArrowLeftRight, Target, Menu, X, TrendingUp } from 'lucide-react';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',     Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions',  Icon: ArrowLeftRight  },
  { id: 'goals',        label: 'Budget Goals',  Icon: Target          },
];

export default function Layout({ page, onNavigate, sidebarOpen, onToggleSidebar, children }) {
  return (
    <div className={styles.shell}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={onToggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <TrendingUp size={18} />
          </div>
          <span className={styles.logoText}>BudgetFlow</span>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`${styles.navItem} ${page === id ? styles.navItemActive : ''}`}
              onClick={() => { onNavigate(id); onToggleSidebar(false); }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {page === id && <div className={styles.navIndicator} />}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.footerNote}>All data stored locally</div>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => onToggleSidebar((v) => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.headerTitle}>
            {NAV_ITEMS.find((n) => n.id === page)?.label ?? 'Budget Tracker'}
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}
