import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import './Game.css';

export default function PlanetPanel() {
  const { selectedPlanet, setSelectedPlanet, colonizedPlanets, structures, userStructures, addNotification, fetchGameData } = useGame();
  const { user } = useAuth();

  if (!selectedPlanet) return null;

  const isColonized = colonizedPlanets.includes(selectedPlanet.id);

  // Get structures on this planet (simplified: distribute structures across colonized planets)
  const planetStructures = isColonized
    ? userStructures.filter((_, i) => {
        const planetIndex = colonizedPlanets.indexOf(selectedPlanet.id);
        const perPlanet = Math.ceil(userStructures.length / colonizedPlanets.length);
        return i >= planetIndex * perPlanet && i < (planetIndex + 1) * perPlanet;
      })
    : [];

  return (
    <div className="planet-panel">
      <div className="planet-panel-header">
        <h2 style={{ color: selectedPlanet.color }}>{selectedPlanet.name}</h2>
        <button className="planet-panel-close" onClick={() => setSelectedPlanet(null)}>✕</button>
      </div>

      <div className="planet-panel-status">
        {isColonized ? (
          <span className="planet-status colonized">🟢 Colonized</span>
        ) : (
          <span className="planet-status uncolonized">🔴 Uncolonized</span>
        )}
      </div>

      <div className="planet-panel-resources">
        <h3>Resource Potential</h3>
        <div className="planet-resource-bars">
          <div className="planet-resource-bar">
            <span>💎 Minerals</span>
            <div className="resource-bar-track">
              <div className="resource-bar-fill" style={{ width: `${selectedPlanet.minerals}%`, background: '#8b5cf6' }} />
            </div>
            <span>{selectedPlanet.minerals}</span>
          </div>
          <div className="planet-resource-bar">
            <span>⚡ Energy</span>
            <div className="resource-bar-track">
              <div className="resource-bar-fill" style={{ width: `${selectedPlanet.energy}%`, background: '#f59e0b' }} />
            </div>
            <span>{selectedPlanet.energy}</span>
          </div>
          <div className="planet-resource-bar">
            <span>🔬 Research</span>
            <div className="resource-bar-track">
              <div className="resource-bar-fill" style={{ width: `${selectedPlanet.research}%`, background: '#3b82f6' }} />
            </div>
            <span>{selectedPlanet.research}</span>
          </div>
        </div>
      </div>

      {isColonized && planetStructures.length > 0 && (
        <div className="planet-panel-structures">
          <h3>Structures ({planetStructures.length})</h3>
          {planetStructures.map((us, i) => {
            const structure = structures.find(s => s.structureId === us.structureId);
            return (
              <div key={i} className="planet-structure-item">
                <span>{structure?.icon || '🏛️'} {structure?.name || us.structureId}</span>
                <span className="structure-lvl">Lv.{us.level}</span>
              </div>
            );
          })}
        </div>
      )}

      {!isColonized && (
        <div className="planet-panel-action">
          <p style={{ color: '#9ca3af', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            Build more structures to expand your empire and colonize this planet.
          </p>
          <div style={{ color: '#6b7280', fontSize: '0.8rem' }}>
            Requires {colonizedPlanets.length + 1} structures to colonize
          </div>
        </div>
      )}
    </div>
  );
}
