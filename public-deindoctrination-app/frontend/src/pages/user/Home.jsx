import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [gameStatus, setGameStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/user/stats').catch(() => ({ data: null })),
      axios.get('/api/gameplay/status').catch(() => ({ data: null })),
    ]).then(([s, g]) => {
      setStats(s.data);
      setGameStatus(g.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="home-loading">Loading your empire...</div>;

  const hub = gameStatus?.hub;
  const xpToNext = stats?.xpToNextRank || (user?.rank || 1) * 100 - (user?.xp || 0);
  const xpPct = Math.min(100, ((user?.xp || 0) / ((user?.rank || 1) * 100)) * 100);

  return (
    <div className="home">
      {/* HERO SECTION */}
      <div className="home-hero">
        <div className="hero-left">
          <div className="hero-greeting">Welcome back, Commander</div>
          <div className="hero-hub">{hub?.icon || '🏠'} {hub?.name || 'Base'}</div>
          <div className="hero-level">
            <span className="hero-rank">Level {user?.rank || 1}</span>
            <div className="hero-xp-bar"><div className="hero-xp-fill" style={{ width: `${xpPct}%` }} /></div>
            <span className="hero-xp-text">{xpToNext} XP to next level</span>
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hs-value">💰 {user?.currency || 0}</span><span className="hs-label">Credits</span></div>
          <div className="hero-stat"><span className="hs-value">⭐ {user?.xp || 0}</span><span className="hs-label">Total XP</span></div>
          <div className="hero-stat"><span className="hs-value">🔥 {user?.streak || 0}</span><span className="hs-label">Day Streak</span></div>
          <div className="hero-stat"><span className="hs-value">📈 {gameStatus?.incomePerHour || 0}/hr</span><span className="hs-label">Income</span></div>
        </div>
      </div>

      {/* PLAY SECTION */}
      <div className="home-section">
        <h2 className="section-title">🎮 Play</h2>
        <div className="play-grid">
          <Link to="/play" className="play-card play-main">
            <div className="play-card-icon">🚀</div>
            <div className="play-card-content">
              <h3>Space Explorer</h3>
              <p>Explore, fight, mine asteroids, collect power-ups</p>
            </div>
            <span className="play-card-badge">PLAY NOW</span>
          </Link>
          <Link to="/ar-explore" className="play-card play-ar">
            <div className="play-card-icon">🌍</div>
            <div className="play-card-content">
              <h3>AR Explorer</h3>
              <p>GPS + Camera — collect in the real world</p>
            </div>
          </Link>
          <Link to="/space" className="play-card play-space">
            <div className="play-card-icon">🌌</div>
            <div className="play-card-content">
              <h3>3D Solar System</h3>
              <p>View your empire across the planets</p>
            </div>
          </Link>
        </div>
      </div>

      {/* BUILD & PROGRESS */}
      <div className="home-section">
        <h2 className="section-title">🏗️ Build & Progress</h2>
        <div className="build-grid">
          <Link to="/tasks" className="build-card">
            <span className="build-icon">✅</span>
            <div><strong>Missions</strong><p>Complete real-world tasks for rewards</p></div>
          </Link>
          <Link to="/empire/in-game" className="build-card">
            <span className="build-icon">🏛️</span>
            <div><strong>Empire</strong><p>Build structures, earn passive income</p></div>
          </Link>
          <Link to="/research" className="build-card">
            <span className="build-icon">🔬</span>
            <div><strong>Research</strong><p>1,000 nodes — unlock multipliers</p></div>
          </Link>
          <Link to="/game" className="build-card">
            <span className="build-icon">⚡</span>
            <div><strong>Skills & Income</strong><p>Train skills, buy income generators</p></div>
          </Link>
          <Link to="/empire/real-world" className="build-card">
            <span className="build-icon">🎁</span>
            <div><strong>Real Rewards</strong><p>Earn tangible real-world rewards</p></div>
          </Link>
          <Link to="/shop" className="build-card">
            <span className="build-icon">🛒</span>
            <div><strong>Shop</strong><p>Credits, premium, boosters</p></div>
          </Link>
        </div>
      </div>

      {/* SOCIAL */}
      <div className="home-section">
        <h2 className="section-title">🤝 Social</h2>
        <div className="social-grid">
          <Link to="/leaderboard" className="social-card">
            <span className="social-icon">🏆</span>
            <div><strong>Leaderboard</strong><p>See where you rank globally</p></div>
          </Link>
          <Link to="/civilizations" className="social-card">
            <span className="social-icon">🤝</span>
            <div><strong>Alliances</strong><p>Join or create a civilization</p></div>
          </Link>
        </div>
      </div>

      {/* QUICK TIP */}
      <div className="home-tip">
        💡 Complete daily missions to maintain your streak. {user?.streak || 0} day streak = {Math.round((1 + (user?.streak || 0) * 0.02) * 100 - 100)}% bonus rewards!
      </div>
    </div>
  );
};

export default Home;
