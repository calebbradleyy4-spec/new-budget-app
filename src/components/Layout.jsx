import { LayoutDashboard, ArrowLeftRight, Target, Menu, X, TrendingUp, Sun, Moon, Plus } from 'lucide-react';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', Icon: ArrowLeftRight  },
  { id: 'goals',        label: 'Budget Goals', Icon: Target          },
];

export default function Layout({ page, onNavigate, sidebarOpen, onToggleSidebar, theme, onToggleTheme, onOpenAddModal, children }) {
  return (
    <div className={styles.shell}>
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => onToggleSidebar(false)} />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <TrendingUp size={17} />
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
              <Icon size={17} />
              <span>{label}</span>
              {page === id && <div className={styles.navIndicator} />}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.themeToggle} onClick={onToggleTheme}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <div className={styles.footerNote}>All data stored locally</div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => onToggleSidebar((v) => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.headerTitle}>
            {NAV_ITEMS.find((n) => n.id === page)?.label ?? 'Budget Tracker'}
          </div>
          <div className={styles.headerActions}>
            <button className={styles.iconBtn} onClick={onToggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>

      <button className={styles.fab} onClick={onOpenAddModal} aria-label="Add transaction">
        <Plus size={22} />
      </button>
    </div>
  );
}
