import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import './Game.css';

export default function GameHUD() {
  const { user } = useAuth();
  const { resources, totalProduction, userStructures, colonizedPlanets, RESOURCE_TYPES, notifications } = useGame();

  return (
    <>
      {/* Top Resource Bar */}
      <div className="hud-top-bar">
        <div className="hud-resources">
          {Object.entries(RESOURCE_TYPES).map(([key, res]) => (
            <div key={key} className="hud-resource">
              <span className="hud-resource-icon">{res.icon}</span>
              <div>
                <span className="hud-resource-value">{resources[key]}/hr</span>
                <span className="hud-resource-label">{res.name}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="hud-player-stats">
          <div className="hud-stat">
            <span>💰</span>
            <span>{user?.currency || 0}</span>
          </div>
          <div className="hud-stat">
            <span>⭐</span>
            <span>{user?.xp || 0} XP</span>
          </div>
          <div className="hud-stat">
            <span>🏆</span>
            <span>Rank {user?.rank || 1}</span>
          </div>
        </div>
      </div>

      {/* Left Panel - Empire Stats */}
      <div className="hud-left-panel">
        <div className="hud-panel-title">🚀 Empire Overview</div>
        <div className="hud-empire-stats">
          <div className="hud-empire-stat">
            <span className="hud-empire-label">Structures</span>
            <span className="hud-empire-value">{userStructures.length}</span>
          </div>
          <div className="hud-empire-stat">
            <span className="hud-empire-label">Production</span>
            <span className="hud-empire-value">{totalProduction}/hr</span>
          </div>
          <div className="hud-empire-stat">
            <span className="hud-empire-label">Colonies</span>
            <span className="hud-empire-value">{colonizedPlanets.length}</span>
          </div>
          <div className="hud-empire-stat">
            <span className="hud-empire-label">Streak</span>
            <span className="hud-empire-value">🔥 {user?.streak || 0}d</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="hud-notifications">
        {notifications.map(n => (
          <div key={n.id} className={`hud-notification hud-notification-${n.type}`}>
            {n.message}
          </div>
        ))}
      </div>
    </>
  );
}
