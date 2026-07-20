import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import SearchBar from '../components/SearchBar';
import { useEffect, useState } from 'react';
import api from '../api';

// ── Icons ──────────────────────────────────────────────────────────────────
const IconDashboard = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
  </svg>
);

const IconPortfolio = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2"/>
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconWallet = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
    <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
    <circle cx="18" cy="12" r="2"/>
  </svg>
);

const IconTrend = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconMarket = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

// ── Market status helper ──────────────────────────────────────────────────
function getMarketBadge(state) {
  if (!state) return <span className="market-badge closed">UNKNOWN</span>;
  const s = state.toUpperCase();
  if (s === 'REGULAR') return <span className="market-badge open">REGULAR</span>;
  if (s === 'PRE') return <span className="market-badge pre">PRE-MARKET</span>;
  if (s === 'POST') return <span className="market-badge pre">POST-MARKET</span>;
  return <span className="market-badge closed">CLOSED</span>;
}

// ── Main Layout ───────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ totalBalance: 0, profitLoss: 0, holdings: 0, marketState: null });

  useEffect(() => {
    api.get('/dashboard/overview').then((r) => {
      const d = r.data;
      const balance = d.overview.currentValue || 0;
      const pl = d.overview.gain || 0;
      const holdings = d.overview.portfolioCount || 0;
      setStats({ totalBalance: balance, profitLoss: pl, holdings, marketState: null });
    }).catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="dashboard-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">🚀</div>
          <span className="sidebar-brand-name">Investa</span>
        </div>

        {/* Stats */}
        <div className="sidebar-stats">
          <div className="sidebar-stat">
            <div className="sidebar-stat-label"><IconWallet /> Total Balance :</div>
            <div className="sidebar-stat-value">
              ${stats.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-label"><IconTrend /> Profit / Loss:</div>
            <div className={`sidebar-stat-value ${stats.profitLoss >= 0 ? 'green' : 'red'}`}>
              {stats.profitLoss >= 0 ? '+' : ''}${Math.abs(stats.profitLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="sidebar-stat">
            <div className="sidebar-stat-label"><IconMarket /> Market Status :</div>
            <div className="sidebar-stat-value muted">{getMarketBadge(stats.marketState)}</div>
          </div>
          {stats.holdings > 0 && (
            <div className="sidebar-stat">
              <div className="sidebar-stat-label">Holdings :</div>
              <div className="sidebar-stat-value green">{stats.holdings}</div>
            </div>
          )}
        </div>

        <hr className="sidebar-divider" />

        {/* Nav */}
        <nav className="sidebar-nav">
          <NavLink
            to="/dashboard"
            end
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><IconDashboard /></span>
            Dashboard
          </NavLink>

          <NavLink
            to="/dashboard/portfolio"
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><IconPortfolio /></span>
            Portfolio
            <span className="nav-badge">Pro</span>
          </NavLink>

          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon"><IconSettings /></span>
            Settings
          </NavLink>

          <hr className="sidebar-divider" />

          <button className="sidebar-nav-item" onClick={handleLogout}>
            <span className="nav-icon"><IconLogout /></span>
            LogOut
          </button>
        </nav>
      </aside>

      {/* ── Topbar ── */}
      <header className="topbar">
        <SearchBar />
        <div className="topbar-spacer" />
        <div className="topbar-avatar" title={user?.name}>{initials}</div>
      </header>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="page-body">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
