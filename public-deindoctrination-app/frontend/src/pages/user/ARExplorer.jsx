import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

// Generate AR objects around player's GPS location
function generateNearbyObjects(lat, lng) {
  const objects = [];
  const types = [
    { type: 'crystal', icon: '💎', name: 'Space Crystal', reward: 15, xp: 20, color: '#8b5cf6', rarity: 'common' },
    { type: 'fuel', icon: '⛽', name: 'Fuel Cell', reward: 10, xp: 10, color: '#10b981', rarity: 'common' },
    { type: 'enemy', icon: '👾', name: 'Alien Scout', reward: 30, xp: 50, color: '#ef4444', rarity: 'uncommon', hp: 50 },
    { type: 'boss', icon: '👹', name: 'Alien Commander', reward: 100, xp: 150, color: '#dc2626', rarity: 'rare', hp: 150 },
    { type: 'portal', icon: '🌀', name: 'Warp Portal', reward: 50, xp: 100, color: '#f59e0b', rarity: 'uncommon' },
    { type: 'crate', icon: '📦', name: 'Supply Crate', reward: 25, xp: 30, color: '#6366f1', rarity: 'common' },
    { type: 'ore', icon: '⛏️', name: 'Asteroid Fragment', reward: 20, xp: 25, color: '#a0a0a0', rarity: 'common' },
    { type: 'rareore', icon: '✨', name: 'Rare Mineral', reward: 75, xp: 80, color: '#fbbf24', rarity: 'rare' },
    { type: 'powerup', icon: '⚡', name: 'Power Core', reward: 40, xp: 60, color: '#22d3ee', rarity: 'uncommon' },
    { type: 'station', icon: '🛸', name: 'Abandoned Station', reward: 60, xp: 100, color: '#3b82f6', rarity: 'rare' },
  ];

  // Seed-based generation from GPS coords so objects are consistent
  const seed = Math.floor(lat * 10000) + Math.floor(lng * 10000);
  const seededRandom = (i) => {
    const x = Math.sin(seed * 9301 + i * 49297 + 49831) * 49297;
    return x - Math.floor(x);
  };

  for (let i = 0; i < 20; i++) {
    const r = seededRandom(i);
    const angle = seededRandom(i + 100) * Math.PI * 2;
    const dist = 20 + seededRandom(i + 200) * 280; // 20-300 meters
    const dlat = (dist / 111320) * Math.cos(angle);
    const dlng = (dist / (111320 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);

    let typeIdx = 0;
    if (r < 0.25) typeIdx = 0;
    else if (r < 0.40) typeIdx = 1;
    else if (r < 0.55) typeIdx = 2;
    else if (r < 0.60) typeIdx = 3;
    else if (r < 0.70) typeIdx = 4;
    else if (r < 0.80) typeIdx = 5;
    else if (r < 0.87) typeIdx = 6;
    else if (r < 0.92) typeIdx = 7;
    else if (r < 0.97) typeIdx = 8;
    else typeIdx = 9;

    objects.push({
      id: `obj-${i}`,
      ...types[typeIdx],
      lat: lat + dlat,
      lng: lng + dlng,
      distance: Math.round(dist),
      bearing: Math.round((angle * 180 / Math.PI + 360) % 360),
      collected: false,
      hp: types[typeIdx].hp || 0,
      maxHp: types[typeIdx].hp || 0,
    });
  }
  return objects.sort((a, b) => a.distance - b.distance);
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) - Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

export default function ARExplorer() {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [objects, setObjects] = useState([]);
  const [selectedObj, setSelectedObj] = useState(null);
  const [inventory, setInventory] = useState({ credits: 0, xp: 0, crystals: 0, ore: 0, kills: 0 });
  const [compass, setCompass] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [viewMode, setViewMode] = useState('ar'); // ar | map | list

  const addMsg = (t) => setMsgs(pr => [...pr.slice(-4), { t, ts: Date.now() }]);

  // GPS tracking
  useEffect(() => {
    if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGps({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy) });
        setGpsError(null);
      },
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Generate objects when GPS available
  useEffect(() => {
    if (gps && objects.length === 0) {
      setObjects(generateNearbyObjects(gps.lat, gps.lng));
    }
  }, [gps]);

  // Update distances
  useEffect(() => {
    if (!gps) return;
    setObjects(prev => prev.map(obj => ({
      ...obj,
      distance: Math.round(getDistance(gps.lat, gps.lng, obj.lat, obj.lng)),
      bearing: Math.round(getBearing(gps.lat, gps.lng, obj.lat, obj.lng))
    })));
  }, [gps]);

  // Device orientation for compass
  useEffect(() => {
    const handler = (e) => { if (e.alpha !== null) setCompass(Math.round(e.alpha)); };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  // Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
    } catch (err) { addMsg('Camera access denied'); }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  // Interact with object
  const interact = (obj) => {
    if (obj.collected) return;
    if (obj.distance > 50) { addMsg(`Too far! Walk ${obj.distance - 50}m closer`); return; }

    if (obj.type === 'enemy' || obj.type === 'boss') {
      // Combat — tap to attack
      setObjects(prev => prev.map(o => {
        if (o.id === obj.id) {
          const newHp = o.hp - 25;
          if (newHp <= 0) {
            setInventory(inv => ({ ...inv, credits: inv.credits + o.reward, xp: inv.xp + o.xp, kills: inv.kills + 1 }));
            addMsg(`💀 ${o.name} defeated! +${o.reward}💰 +${o.xp}XP`);
            return { ...o, hp: 0, collected: true };
          }
          addMsg(`⚔️ Hit ${o.name}! ${newHp}/${o.maxHp} HP`);
          return { ...o, hp: newHp };
        }
        return o;
      }));
    } else {
      setObjects(prev => prev.map(o => o.id === obj.id ? { ...o, collected: true } : o));
      setInventory(inv => ({
        ...inv,
        credits: inv.credits + obj.reward,
        xp: inv.xp + obj.xp,
        crystals: inv.crystals + (obj.type === 'crystal' ? 1 : 0),
        ore: inv.ore + (obj.type === 'ore' || obj.type === 'rareore' ? 1 : 0),
      }));
      addMsg(`${obj.icon} ${obj.name} collected! +${obj.reward}💰 +${obj.xp}XP`);
    }
    setSelectedObj(null);
  };

  const refreshObjects = () => {
    if (gps) { setObjects(generateNearbyObjects(gps.lat + Math.random() * 0.0001, gps.lng + Math.random() * 0.0001)); addMsg('🔄 New objects spawned!'); }
  };

  const syncToGame = async () => {
    try {
      addMsg('Syncing to game hub...');
      // In a real app this would POST to backend
      addMsg(`✅ Synced: +${inventory.credits}💰 +${inventory.xp}XP`);
    } catch (err) { addMsg('Sync failed'); }
  };

  const activeObjects = objects.filter(o => !o.collected);
  const nearbyCount = activeObjects.filter(o => o.distance <= 50).length;

  return (
    <div style={{ background: '#050510', minHeight: '100vh', color: '#e2e8f0', fontFamily: "'Segoe UI', sans-serif" }}>
      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/play" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.8rem' }}>← Game</Link>
          <span style={{ background: 'linear-gradient(135deg,#10b981,#059669)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontWeight: 700, fontSize: '0.8rem' }}>🌍 AR Explorer</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.8rem', fontWeight: 600 }}>
          <span>💰{inventory.credits}</span><span>⭐{inventory.xp}</span><span>💎{inventory.crystals}</span><span>💀{inventory.kills}</span>
        </div>
      </div>

      {/* GPS STATUS */}
      <div style={{ padding: '0.4rem 0.75rem', background: '#0a0f1a', borderBottom: '1px solid #1e293b', fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {gps ? (
          <span style={{ color: '#10b981' }}>📍 GPS Active — {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)} (±{gps.accuracy}m)</span>
        ) : gpsError ? (
          <span style={{ color: '#ef4444' }}>❌ GPS Error: {gpsError}</span>
        ) : (
          <span style={{ color: '#f59e0b' }}>📡 Acquiring GPS signal...</span>
        )}
        <span style={{ color: '#64748b' }}>🧭 {compass}°</span>
      </div>

      {/* VIEW TABS */}
      <div style={{ display: 'flex', gap: '0.4rem', padding: '0.4rem 0.75rem', background: '#0a0f1a' }}>
        {[['ar', '📷 AR View'], ['map', '🗺️ Map'], ['list', '📋 List']].map(([id, label]) => (
          <button key={id} onClick={() => { setViewMode(id); if (id === 'ar' && !cameraActive) startCamera(); if (id !== 'ar') stopCamera(); }}
            style={{ padding: '0.3rem 0.75rem', background: viewMode === id ? '#1e293b' : 'transparent', border: `1px solid ${viewMode === id ? '#334155' : 'transparent'}`, color: viewMode === id ? '#e2e8f0' : '#64748b', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
            {label}
          </button>
        ))}
        <button onClick={refreshObjects} style={{ marginLeft: 'auto', padding: '0.3rem 0.75rem', background: '#1e293b', border: '1px solid #334155', color: '#94a3b8', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.75rem' }}>🔄 Refresh</button>
      </div>

      {/* AR VIEW */}
      {viewMode === 'ar' && (
        <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 180px)', background: '#000', overflow: 'hidden' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {!cameraActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a2e' }}>
              <button onClick={startCamera} style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.1rem', fontWeight: 700, cursor: 'pointer' }}>
                📷 Enable Camera for AR
              </button>
            </div>
          )}
          {/* AR Overlay objects */}
          {cameraActive && activeObjects.filter(o => o.distance <= 200).map((obj, i) => {
            const relBearing = ((obj.bearing - compass) + 360) % 360;
            const screenX = (relBearing / 360) * 100;
            const scale = Math.max(0.5, 1 - obj.distance / 300);
            const top = 20 + (obj.distance / 200) * 50;
            return (
              <div key={obj.id} onClick={() => setSelectedObj(obj)}
                style={{ position: 'absolute', left: `${screenX}%`, top: `${top}%`, transform: `translate(-50%,-50%) scale(${scale})`, cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s', zIndex: obj.distance <= 50 ? 10 : 5 }}>
                <div style={{ fontSize: obj.distance <= 50 ? '2.5rem' : '1.5rem', filter: obj.distance <= 50 ? 'none' : 'brightness(0.6)', animation: obj.distance <= 50 ? 'bounce 1s infinite' : 'none' }}>
                  {obj.icon}
                </div>
                <div style={{ fontSize: '0.6rem', color: obj.color, fontWeight: 700, textShadow: '0 0 4px rgba(0,0,0,0.8)' }}>
                  {obj.distance}m
                </div>
              </div>
            );
          })}
          {/* Nearby count */}
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', background: '#0f172aCC', padding: '0.4rem 1rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
            {nearbyCount > 0 ? `${nearbyCount} objects within reach!` : 'Walk closer to objects...'}
          </div>
        </div>
      )}

      {/* MAP VIEW */}
      {viewMode === 'map' && gps && (
        <div style={{ padding: '1rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'relative', width: 350, height: 350, background: '#0f172a', border: '1px solid #1e293b', borderRadius: '50%', overflow: 'hidden' }}>
            {/* Player at center */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10 }}>
              <div style={{ width: 14, height: 14, background: '#3b82f6', borderRadius: '50%', border: '2px solid #93c5fd', boxShadow: '0 0 10px #3b82f6' }} />
            </div>
            {/* Range circles */}
            {[50, 150, 300].map(r => (
              <div key={r} style={{ position: 'absolute', top: '50%', left: '50%', width: r * 1.1, height: r * 1.1, border: '1px solid #1e293b', borderRadius: '50%', transform: 'translate(-50%,-50%)' }}>
                <span style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#334155' }}>{r}m</span>
              </div>
            ))}
            {/* Objects */}
            {activeObjects.map(obj => {
              const dx = (obj.lng - gps.lng) * 111320 * Math.cos(gps.lat * Math.PI / 180);
              const dy = (obj.lat - gps.lat) * 111320;
              const mapScale = 350 / 700;
              const px = 175 + dx * mapScale;
              const py = 175 - dy * mapScale;
              if (px < 0 || px > 350 || py < 0 || py > 350) return null;
              return (
                <div key={obj.id} onClick={() => setSelectedObj(obj)}
                  style={{ position: 'absolute', left: px, top: py, transform: 'translate(-50%,-50%)', cursor: 'pointer', fontSize: obj.distance <= 50 ? '1.2rem' : '0.9rem', opacity: obj.distance <= 50 ? 1 : 0.6 }}>
                  {obj.icon}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === 'list' && (
        <div style={{ padding: '0.75rem', maxWidth: 500, margin: '0 auto' }}>
          {activeObjects.map(obj => (
            <div key={obj.id} onClick={() => setSelectedObj(obj)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem', background: '#0f172a', border: `1px solid ${obj.distance <= 50 ? obj.color + '40' : '#1e293b'}`, borderRadius: '0.5rem', marginBottom: '0.4rem', cursor: 'pointer' }}>
              <span style={{ fontSize: '1.5rem' }}>{obj.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{obj.name}</div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>+{obj.reward}💰 +{obj.xp}XP • {obj.rarity}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: obj.distance <= 50 ? '#10b981' : '#64748b' }}>{obj.distance}m</div>
                <div style={{ fontSize: '0.65rem', color: '#475569' }}>{obj.bearing}°</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SELECTED OBJECT MODAL */}
      {selectedObj && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}
          onClick={() => setSelectedObj(null)}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#0f172a', border: `1px solid ${selectedObj.color}40`, borderRadius: '1rem', padding: '1.5rem', maxWidth: 350, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{selectedObj.icon}</div>
            <h3 style={{ marginBottom: '0.25rem' }}>{selectedObj.name}</h3>
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: selectedObj.color + '20', color: selectedObj.color, borderRadius: '1rem' }}>{selectedObj.rarity}</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '1rem 0' }}>
              <div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.375rem' }}><div style={{ fontSize: '0.65rem', color: '#64748b' }}>Distance</div><div style={{ fontWeight: 700 }}>{selectedObj.distance}m</div></div>
              <div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.375rem' }}><div style={{ fontSize: '0.65rem', color: '#64748b' }}>Bearing</div><div style={{ fontWeight: 700 }}>{selectedObj.bearing}°</div></div>
              <div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.375rem' }}><div style={{ fontSize: '0.65rem', color: '#64748b' }}>Credits</div><div style={{ fontWeight: 700 }}>+{selectedObj.reward}💰</div></div>
              <div style={{ background: '#1e293b', padding: '0.5rem', borderRadius: '0.375rem' }}><div style={{ fontSize: '0.65rem', color: '#64748b' }}>XP</div><div style={{ fontWeight: 700 }}>+{selectedObj.xp}⭐</div></div>
            </div>
            {selectedObj.maxHp > 0 && !selectedObj.collected && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.2rem' }}>HP: {selectedObj.hp}/{selectedObj.maxHp}</div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(selectedObj.hp / selectedObj.maxHp) * 100}%`, background: '#ef4444', borderRadius: 3 }} />
                </div>
              </div>
            )}
            {selectedObj.collected ? (
              <div style={{ color: '#10b981', fontWeight: 700 }}>✅ Collected</div>
            ) : selectedObj.distance <= 50 ? (
              <button onClick={() => interact(selectedObj)}
                style={{ width: '100%', padding: '0.75rem', background: `linear-gradient(135deg,${selectedObj.color},${selectedObj.color}CC)`, color: 'white', border: 'none', borderRadius: '0.5rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
                {selectedObj.type === 'enemy' || selectedObj.type === 'boss' ? '⚔️ ATTACK' : '✋ COLLECT'}
              </button>
            ) : (
              <div style={{ color: '#f59e0b', fontSize: '0.85rem' }}>Walk {selectedObj.distance - 50}m closer to interact</div>
            )}
          </div>
        </div>
      )}

      {/* MESSAGES */}
      <div style={{ position: 'fixed', bottom: 60, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: '0.3rem', zIndex: 50 }}>
        {msgs.filter(m => Date.now() - m.ts < 4000).map((m, i) => (
          <div key={i} style={{ background: '#0f172aDD', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 600, textAlign: 'center', backdropFilter: 'blur(8px)' }}>{m.t}</div>
        ))}
      </div>

      {/* BOTTOM BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0.5rem', background: '#0f172a', borderTop: '1px solid #1e293b' }}>
        <Link to="/play" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.75rem', textAlign: 'center' }}>🎮<br />Game</Link>
        <button onClick={syncToGame} style={{ background: 'none', border: 'none', color: '#10b981', fontSize: '0.75rem', cursor: 'pointer', textAlign: 'center' }}>📤<br />Sync</button>
        <Link to="/game" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.75rem', textAlign: 'center' }}>🏠<br />Hub</Link>
      </div>

      <style>{`@keyframes bounce{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-8px)}}`}</style>
    </div>
  );
}
