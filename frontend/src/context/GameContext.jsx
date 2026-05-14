import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

// Resource types from GDD
const RESOURCE_TYPES = {
  minerals: { name: 'Minerals', icon: '💎', color: '#8b5cf6' },
  energy: { name: 'Energy', icon: '⚡', color: '#f59e0b' },
  research: { name: 'Research', icon: '🔬', color: '#3b82f6' },
};

// Planet data for the solar system
const PLANETS = [
  { id: 'mercury', name: 'Mercury', distance: 3, size: 0.4, color: '#a0a0a0', speed: 0.02, minerals: 30, energy: 10, research: 5 },
  { id: 'venus', name: 'Venus', distance: 5, size: 0.6, color: '#e8a838', speed: 0.015, minerals: 20, energy: 40, research: 10 },
  { id: 'earth', name: 'Earth', distance: 7, size: 0.65, color: '#4a90d9', speed: 0.012, minerals: 25, energy: 25, research: 25 },
  { id: 'mars', name: 'Mars', distance: 9, size: 0.5, color: '#c1440e', speed: 0.01, minerals: 40, energy: 15, research: 20 },
  { id: 'jupiter', name: 'Jupiter', distance: 13, size: 1.4, color: '#c88b3a', speed: 0.006, minerals: 50, energy: 30, research: 35 },
  { id: 'saturn', name: 'Saturn', distance: 17, size: 1.2, color: '#e8d5a3', speed: 0.004, minerals: 45, energy: 35, research: 40 },
  { id: 'uranus', name: 'Uranus', distance: 21, size: 0.9, color: '#7ec8e3', speed: 0.003, minerals: 35, energy: 50, research: 45 },
  { id: 'neptune', name: 'Neptune', distance: 25, size: 0.85, color: '#3f51b5', speed: 0.002, minerals: 30, energy: 45, research: 50 },
];

export const GameProvider = ({ children }) => {
  const { user } = useAuth();
  const [structures, setStructures] = useState([]);
  const [userStructures, setUserStructures] = useState([]);
  const [resources, setResources] = useState({ minerals: 0, energy: 0, research: 0 });
  const [colonizedPlanets, setColonizedPlanets] = useState([]);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [gameLoading, setGameLoading] = useState(true);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  // Calculate resources from structures
  const calculateResources = useCallback((userStructs, structs) => {
    let minerals = 0, energy = 0, research = 0;
    userStructs.forEach(us => {
      const structure = structs.find(s => s.structureId === us.structureId);
      if (structure) {
        const production = Math.floor(structure.baseProduction * us.level * 1.15);
        // Distribute production across resource types based on structure
        minerals += Math.floor(production * 0.4);
        energy += Math.floor(production * 0.35);
        research += Math.floor(production * 0.25);
      }
    });
    setResources({ minerals, energy, research });
  }, []);

  const fetchGameData = useCallback(async () => {
    try {
      const [structuresRes, userStructuresRes] = await Promise.all([
        axios.get('/api/empire/structures'),
        axios.get('/api/empire/my-structures'),
      ]);
      setStructures(structuresRes.data);
      setUserStructures(userStructuresRes.data);
      calculateResources(userStructuresRes.data, structuresRes.data);

      // Derive colonized planets from user structures count
      const numColonized = Math.min(userStructuresRes.data.length, PLANETS.length);
      setColonizedPlanets(PLANETS.slice(0, Math.max(1, numColonized)).map(p => p.id));
    } catch (error) {
      console.error('Failed to fetch game data:', error);
    } finally {
      setGameLoading(false);
    }
  }, [calculateResources]);

  useEffect(() => {
    if (user) fetchGameData();
  }, [user, fetchGameData]);

  const totalProduction = userStructures.reduce((total, us) => {
    const structure = structures.find(s => s.structureId === us.structureId);
    return total + (structure ? Math.floor(structure.baseProduction * us.level * 1.15) : 0);
  }, 0);

  const value = {
    structures, userStructures, resources, colonizedPlanets,
    selectedPlanet, setSelectedPlanet,
    notifications, addNotification,
    gameLoading, fetchGameData,
    totalProduction, PLANETS, RESOURCE_TYPES,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
