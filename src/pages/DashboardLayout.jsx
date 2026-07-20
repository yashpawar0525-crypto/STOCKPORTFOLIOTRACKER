import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <h3>Menu</h3>
        <NavLink className="sidebar-link" to="/dashboard">Overview</NavLink>
        <NavLink className="sidebar-link" to="/dashboard/portfolio">Portfolio</NavLink>
        <NavLink className="sidebar-link" to="/dashboard/watchlist">Watchlist</NavLink>
        <NavLink className="sidebar-link" to="/dashboard/analytics">Analytics</NavLink>
        <button className="sidebar-link" onClick={handleLogout}>Logout</button>
      </aside>
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <p>Welcome back, {user?.name || 'investor'}.</p>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
