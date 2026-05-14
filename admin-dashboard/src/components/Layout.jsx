import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV_ITEMS = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/users', icon: '👥', label: 'Users' },
  { to: '/tasks', icon: '✅', label: 'Tasks' },
  { to: '/categories', icon: '📁', label: 'Categories' },
  { to: '/shop-items', icon: '🛒', label: 'Shop Items' },
  { to: '/empire', icon: '🏛️', label: 'Empire' },
  { to: '/structures', icon: '🏗️', label: 'Structures' },
  { to: '/research', icon: '🔬', label: 'Research' },
  { to: '/civilizations', icon: '🌍', label: 'Civilizations' },
  { to: '/leaderboard', icon: '🏆', label: 'Leaderboard' },
  { to: '/social', icon: '🌐', label: 'Social & Activity' },
  { to: '/verifications', icon: '🔍', label: 'Verifications' },
  { to: '/game-config', icon: '🎮', label: 'Game Config' },
  { to: '/ui-config', icon: '🎨', label: 'UI Config' },
  { to: '/metrics', icon: '📈', label: 'Metrics' },
  { to: '/nodes', icon: '🖥️', label: 'Nodes' },
  { to: '/plugins', icon: '🔌', label: 'Plugins' },
  { to: '/analytics', icon: '📊', label: 'Analytics' },
];

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🎯 Admin Panel</h1>
          <p>Public Deindoctrination</p>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div>
              <div className="user-email">{user?.email}</div>
              <div className="user-role">Administrator</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
