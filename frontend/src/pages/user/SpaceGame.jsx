import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GameProvider } from '../../context/GameContext';
import SpaceScene from '../../components/game/SpaceScene';
import GameHUD from '../../components/game/GameHUD';
import PlanetPanel from '../../components/game/PlanetPanel';
import TaskOverlay from '../../components/game/TaskOverlay';
import '../../components/game/Game.css';

function SpaceGameInner() {
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div className="game-viewport">
      {/* 3D Space Scene */}
      <SpaceScene />

      {/* HUD Overlay */}
      <GameHUD />

      {/* Planet Info Panel */}
      <PlanetPanel />

      {/* Bottom Navigation */}
      <div className="game-bottom-nav">
        <Link to="/dashboard" className="game-nav-btn">
          <span className="game-nav-icon">📊</span>
          Dashboard
        </Link>
        <button className="game-nav-btn active" disabled>
          <span className="game-nav-icon">🌌</span>
          Space
        </button>
        <button className="game-nav-btn" onClick={() => setShowTasks(true)}>
          <span className="game-nav-icon">📋</span>
          Missions
        </button>
        <Link to="/empire/in-game" className="game-nav-btn">
          <span className="game-nav-icon">🏛️</span>
          Build
        </Link>
        <Link to="/leaderboard" className="game-nav-btn">
          <span className="game-nav-icon">🏆</span>
          Ranks
        </Link>
      </div>

      {/* Task Overlay */}
      {showTasks && <TaskOverlay onClose={() => setShowTasks(false)} />}
    </div>
  );
}

export default function SpaceGame() {
  return (
    <GameProvider>
      <SpaceGameInner />
    </GameProvider>
  );
}
