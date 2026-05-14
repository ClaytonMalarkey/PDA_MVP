import { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const NAV = [
  { label: 'Home', icon: '🏠', to: '/home' },
  { label: 'Play', icon: '🎮', children: [
    { to: '/play', label: 'Space Explorer', icon: '🚀', desc: 'Explore, fight, mine' },
    { to: '/ar-explore', label: 'AR Explorer', icon: '🌍', desc: 'GPS + Camera mode' },
    { to: '/space', label: '3D Solar System', icon: '🌌', desc: 'View your empire' },
  ]},
  { label: 'Build', icon: '🏗️', children: [
    { to: '/tasks', label: 'Missions', icon: '✅', desc: 'Complete real-world tasks' },
    { to: '/empire/in-game', label: 'Empire', icon: '🏛️', desc: 'Structures & income' },
    { to: '/research', label: 'Research', icon: '🔬', desc: '1,000-node tech tree' },
    { to: '/game', label: 'Skills & Income', icon: '⚡', desc: 'Train skills, generators' },
    { to: '/empire/real-world', label: 'Real Rewards', icon: '🎁', desc: 'Tangible rewards' },
  ]},
  { label: 'Social', icon: '🤝', children: [
    { to: '/leaderboard', label: 'Ranks', icon: '🏆', desc: 'Global leaderboard' },
    { to: '/civilizations', label: 'Alliance', icon: '🤝', desc: 'Join a civilization' },
  ]},
  { label: 'Shop', icon: '🛒', to: '/shop' },
];

const Layout = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const menuRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => { setMenuOpen(false); setOpenDropdown(null); setMobileExpanded(null); }, [location.pathname]);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setOpenDropdown(null);
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.hb-btn')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (item) => {
    if (item.to) return location.pathname === item.to;
    if (item.children) return item.children.some(c => location.pathname === c.to || location.pathname.startsWith(c.to + '/'));
    return false;
  };

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-bar">
          <Link to="/home" className="nav-brand">🚀 Space Out</Link>

          {/* Desktop: 5 items */}
          <div className="nav-desktop" ref={dropRef}>
            {NAV.map((item, i) => item.children ? (
              <div key={i} className="nav-dd">
                <button className={`nav-btn ${isActive(item) ? 'active' : ''}`}
                  onClick={() => setOpenDropdown(openDropdown === i ? null : i)}>
                  <span className="nav-icon">{item.icon}</span> {item.label}
                  <span className="nav-arrow">{openDropdown === i ? '▲' : '▼'}</span>
                </button>
                {openDropdown === i && (
                  <div className="nav-dd-menu">
                    {item.children.map(c => (
                      <Link key={c.to} to={c.to} className={`nav-dd-item ${location.pathname === c.to ? 'active' : ''}`}>
                        <span className="nav-dd-icon">{c.icon}</span>
                        <div>
                          <div className="nav-dd-label">{c.label}</div>
                          <div className="nav-dd-desc">{c.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link key={i} to={item.to} className={`nav-btn ${isActive(item) ? 'active' : ''}`}>
                <span className="nav-icon">{item.icon}</span> {item.label}
              </Link>
            ))}
            {isAdmin && <Link to="/admin" className="nav-btn nav-admin">⚙️</Link>}
          </div>

          {/* Desktop user */}
          <div className="nav-user">
            <span className="pill rank">Lv.{user?.rank || 1}</span>
            <span className="pill xp">⭐{user?.xp || 0}</span>
            <span className="pill cur">💰{user?.currency || 0}</span>
            <Link to="/profile" className="nav-avatar">{(user?.email || '?')[0].toUpperCase()}</Link>
          </div>

          {/* Hamburger */}
          <button className="hb-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`hb ${menuOpen ? 'x' : ''}`} />
            <span className={`hb ${menuOpen ? 'x' : ''}`} />
            <span className={`hb ${menuOpen ? 'x' : ''}`} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mob-menu ${menuOpen ? 'open' : ''}`} ref={menuRef}>
          <div className="mob-header">
            <div className="mob-av">{(user?.email || '?')[0].toUpperCase()}</div>
            <div>
              <div className="mob-email">{user?.email}</div>
              <div className="mob-stats">Lv.{user?.rank || 1} · ⭐{user?.xp || 0} · 💰{user?.currency || 0}</div>
            </div>
          </div>
          <div className="mob-sep" />

          {NAV.map((item, i) => item.children ? (
            <div key={i}>
              <button className={`mob-link mob-parent ${isActive(item) ? 'active' : ''}`}
                onClick={() => setMobileExpanded(mobileExpanded === i ? null : i)}>
                <span className="mob-icon">{item.icon}</span>
                <span className="mob-label">{item.label}</span>
                <span className="mob-expand">{mobileExpanded === i ? '−' : '+'}</span>
              </button>
              {mobileExpanded === i && (
                <div className="mob-sub">
                  {item.children.map(c => (
                    <Link key={c.to} to={c.to} className={`mob-link mob-child ${location.pathname === c.to ? 'active' : ''}`}>
                      <span className="mob-icon">{c.icon}</span>
                      <span className="mob-label">{c.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link key={i} to={item.to} className={`mob-link ${isActive(item) ? 'active' : ''}`}>
              <span className="mob-icon">{item.icon}</span>
              <span className="mob-label">{item.label}</span>
            </Link>
          ))}

          <div className="mob-sep" />
          <Link to="/dashboard" className="mob-link"><span className="mob-icon">📊</span><span className="mob-label">Stats</span></Link>
          <Link to="/profile" className="mob-link"><span className="mob-icon">👤</span><span className="mob-label">Profile</span></Link>
          {isAdmin && <Link to="/admin" className="mob-link mob-admin"><span className="mob-icon">⚙️</span><span className="mob-label">Admin</span></Link>}
          <div className="mob-sep" />
          <button onClick={() => { logout(); navigate('/login'); }} className="mob-link mob-logout">
            <span className="mob-icon">🚪</span><span className="mob-label">Logout</span>
          </button>
        </div>
      </nav>

      <main className="main-content"><div className="container"><Outlet /></div></main>
    </div>
  );
};

export default Layout;
