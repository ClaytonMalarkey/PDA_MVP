import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const InGameEmpire = () => {
  const { user } = useAuth();
  const [structures, setStructures] = useState([]);
  const [userStructures, setUserStructures] = useState([]);
  const [idleIncome, setIdleIncome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmpireData();
  }, []);

  const fetchEmpireData = async () => {
    try {
      const [structuresRes, userStructuresRes, idleRes] = await Promise.all([
        axios.get('/api/empire/structures'),
        axios.get('/api/empire/my-structures'),
        axios.get('/api/empire/idle-income')
      ]);
      setStructures(structuresRes.data);
      setUserStructures(userStructuresRes.data);
      setIdleIncome(idleRes.data);
    } catch (error) {
      console.error('Failed to fetch empire data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (structureId) => {
    try {
      await axios.post(`/api/empire/structures/${structureId}/purchase`);
      alert('Structure purchased successfully!');
      fetchEmpireData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to purchase structure');
    }
  };

  const handleUpgrade = async (structureId) => {
    try {
      await axios.post(`/api/empire/structures/${structureId}/upgrade`);
      alert('Structure upgraded successfully!');
      fetchEmpireData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to upgrade structure');
    }
  };

  const handleCollectIdle = async () => {
    try {
      const response = await axios.post('/api/empire/collect-idle');
      alert(`Collected ${response.data.income} currency!`);
      fetchEmpireData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to collect idle income');
    }
  };

  const getUserStructure = (structureId) => {
    return userStructures.find(us => us.structureId === structureId);
  };

  const calculateProduction = (structure, level) => {
    return Math.floor(structure.baseProduction * level * 1.15);
  };

  const calculateUpgradeCost = (structure, currentLevel) => {
    return Math.floor(structure.baseCost * Math.pow(1.15, currentLevel));
  };

  if (loading) {
    return <div className="loading">Loading empire...</div>;
  }

  return (
    <div className="empire-container">
      <div className="empire-header">
        <h1>🎮 In-Game Empire</h1>
        <p>Build structures to generate passive income</p>
      </div>

      {idleIncome && idleIncome.income > 0 && (
        <div className="idle-income-banner">
          <div>
            <h3>💰 Idle Income Available!</h3>
            <p>You earned {idleIncome.income} currency while offline ({idleIncome.hoursElapsed.toFixed(1)} hours)</p>
          </div>
          <button className="btn btn-primary" onClick={handleCollectIdle}>
            Collect
          </button>
        </div>
      )}

      <div className="empire-stats">
        <div className="empire-stat">
          <span className="stat-label">Total Structures</span>
          <span className="stat-value">{userStructures.length}</span>
        </div>
        <div className="empire-stat">
          <span className="stat-label">Passive Income/Hour</span>
          <span className="stat-value">
            {userStructures.reduce((total, us) => {
              const structure = structures.find(s => s.structureId === us.structureId);
              return total + (structure ? calculateProduction(structure, us.level) : 0);
            }, 0)} 💰
          </span>
        </div>
        <div className="empire-stat">
          <span className="stat-label">Your Currency</span>
          <span className="stat-value">{user?.currency || 0} 💰</span>
        </div>
      </div>

      <div className="structures-grid">
        {structures.map(structure => {
          const userStructure = getUserStructure(structure.structureId);
          const isOwned = !!userStructure;
          const level = userStructure?.level || 0;
          const production = isOwned ? calculateProduction(structure, level) : structure.baseProduction;
          const cost = isOwned ? calculateUpgradeCost(structure, level) : structure.baseCost;

          return (
            <div key={structure._id} className="structure-card">
              <div className="structure-header">
                <h3>{structure.name}</h3>
                {isOwned && <span className="structure-level">Level {level}</span>}
              </div>
              <p className="structure-category">{structure.category}</p>
              <p className="structure-effect">{structure.effect}</p>
              <div className="structure-stats">
                <div className="structure-stat">
                  <span>Production:</span>
                  <span>{production}/hour 💰</span>
                </div>
                <div className="structure-stat">
                  <span>{isOwned ? 'Upgrade Cost:' : 'Cost:'}</span>
                  <span>{cost} 💰</span>
                </div>
              </div>
              {isOwned ? (
                <button
                  className="btn btn-secondary btn-block"
                  onClick={() => handleUpgrade(structure.structureId)}
                  disabled={user.currency < cost}
                >
                  Upgrade
                </button>
              ) : (
                <button
                  className="btn btn-primary btn-block"
                  onClick={() => handlePurchase(structure.structureId)}
                  disabled={user.currency < cost}
                >
                  Purchase
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InGameEmpire;
