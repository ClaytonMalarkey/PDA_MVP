import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <h2>🛡️ Admin Panel</h2>
        </div>

        <nav className="admin-nav">
          <Link to="/admin" className="admin-nav-link">
            📊 Dashboard
          </Link>
          <Link to="/admin/tasks" className="admin-nav-link">
            ✅ Manage Tasks
          </Link>
          <Link to="/admin/users" className="admin-nav-link">
            👥 Manage Users
          </Link>
          <Link to="/admin/empire" className="admin-nav-link">
            🏛️ Empire
          </Link>
          <Link to="/admin/leaderboard" className="admin-nav-link">
            🏆 Leaderboard
          </Link>
          <Link to="/admin/metrics" className="admin-nav-link">
            📈 Metrics
          </Link>
          <Link to="/admin/ui-config" className="admin-nav-link">
            🎨 UI Configuration
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/dashboard" className="btn btn-secondary">
            ← Back to App
          </Link>
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-content">
            <h1>Admin Dashboard</h1>
            <div className="admin-user">
              <span>{user?.email}</span>
              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
