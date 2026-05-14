import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// NPC Companion — AI Messenger Drone that floats near the player
// Gives contextual hints, quest suggestions, and world updates

const COMPANION_MESSAGES = [
  // Exploration hints
  { type: 'hint', text: 'Walk to the Mission Terminal (north of hub) to accept quests!', trigger: 'idle' },
  { type: 'hint', text: 'Press TAB to open the radial menu and access all features.', trigger: 'idle' },
  { type: 'hint', text: 'Mine rocks with M key to collect resources for building.', trigger: 'idle' },
  { type: 'hint', text: 'Walk into buildings to interact with them. Press E to enter.', trigger: 'idle' },
  { type: 'hint', text: 'Complete daily quests for bonus XP and currency!', trigger: 'idle' },
  { type: 'hint', text: 'Your streak multiplier increases rewards. Stay active!', trigger: 'idle' },
  { type: 'hint', text: 'Click on other players to challenge or wave at them.', trigger: 'idle' },
  { type: 'hint', text: 'AI Verification gives bonus XP — describe what you did!', trigger: 'idle' },
  { type: 'hint', text: 'The Core Hub is your safe zone. Buildings surround it.', trigger: 'idle' },
  { type: 'hint', text: 'Collect crystals 💎 for currency. Fuel ⛽ keeps you moving.', trigger: 'idle' },
  // Motivational
  { type: 'motivate', text: 'Every task you complete builds toward a better civilization.', trigger: 'idle' },
  { type: 'motivate', text: 'Your actions here reflect real-world growth. Keep going!', trigger: 'idle' },
  { type: 'motivate', text: 'The world needs builders, thinkers, and doers. Be one.', trigger: 'idle' },
  // World lore
  { type: 'lore', text: 'This world is built by its players. Every contribution matters.', trigger: 'idle' },
  { type: 'lore', text: 'The Core Hub was built by the first settlers. You are one of them.', trigger: 'idle' },
];

const TYPE_COLORS = {
  hint: '#3b82f6',
  motivate: '#10b981',
  lore: '#8b5cf6',
  alert: '#f59e0b',
  reward: '#ec4899',
};

const TYPE_ICONS = {
  hint: '💡',
  motivate: '⚡',
  lore: '📜',
  alert: '⚠️',
  reward: '🎁',
};

export default function NPCCompanion({ playerStats, worldEvents, onlineCount }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [bobOffset, setBobOffset] = useState(0);
  const [dailyCount, setDailyCount] = useState(0);
  const msgIndex = useRef(0);
  const bobRef = useRef(null);

  // Bob animation
  useEffect(() => {
    let t = 0;
    bobRef.current = setInterval(() => {
      t += 0.05;
      setBobOffset(Math.sin(t) * 4);
    }, 50);
    return () => clearInterval(bobRef.current);
  }, []);

  // Show companion after 3 seconds, then cycle messages
  useEffect(() => {
    const showTimer = setTimeout(() => {
      setVisible(true);
      showNextMessage();
    }, 3000);
    return () => clearTimeout(showTimer);
  }, []);

  // Cycle messages every 15 seconds
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      if (!dismissed) showNextMessage();
    }, 15000);
    return () => clearInterval(interval);
  }, [visible, dismissed]);

  // React to world events
  useEffect(() => {
    if (worldEvents?.length > 0) {
      const event = worldEvents[0];
      setMessage({
        type: 'alert',
        text: `${event.name} — ${event.description || 'A world event is active!'}`,
        urgent: true
      });
      setDismissed(false);
    }
  }, [worldEvents]);

  // React to player stats
  useEffect(() => {
    if (!playerStats) return;
    if (playerStats.hp < 30) {
      setMessage({ type: 'alert', text: '⚠️ Low HP! Find fuel cells or return to the hub.', urgent: true });
      setDismissed(false);
    } else if (playerStats.fuel < 20) {
      setMessage({ type: 'alert', text: '⛽ Low fuel! Collect fuel cells before you run out.', urgent: true });
      setDismissed(false);
    }
  }, [playerStats?.hp, playerStats?.fuel]);

  const showNextMessage = () => {
    const msgs = COMPANION_MESSAGES;
    const msg = msgs[msgIndex.current % msgs.length];
    msgIndex.current++;
    setMessage(msg);
    setDismissed(false);
  };

  const dismiss = () => setDismissed(true);

  if (!visible) return null;

  const col = message ? (TYPE_COLORS[message.type] || '#3b82f6') : '#3b82f6';
  const icon = message ? (TYPE_ICONS[message.type] || '💡') : '💡';

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      left: 16,
      zIndex: 55,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      gap: '0.4rem',
      pointerEvents: 'none',
    }}>
      {/* Message bubble */}
      {message && !dismissed && (
        <div style={{
          background: 'rgba(13,10,4,0.95)',
          border: `1px solid ${col}60`,
          borderRadius: '0.5rem',
          padding: '0.5rem 0.75rem',
          maxWidth: 220,
          fontSize: '0.72rem',
          color: '#f5e6c8',
          lineHeight: 1.4,
          backdropFilter: 'blur(8px)',
          boxShadow: `0 0 12px ${col}20`,
          pointerEvents: 'all',
          animation: message.urgent ? 'pulse 1s infinite' : 'none',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.4rem' }}>
            <div>
              <span style={{ color: col, fontWeight: 700, marginRight: '0.3rem' }}>{icon}</span>
              {message.text}
            </div>
            <button onClick={dismiss} style={{
              background: 'none', border: 'none', color: '#5c4a2a',
              cursor: 'pointer', fontSize: '0.8rem', padding: 0, flexShrink: 0,
              pointerEvents: 'all'
            }}>✕</button>
          </div>
        </div>
      )}

      {/* Drone body */}
      <div
        onClick={() => { setDismissed(false); showNextMessage(); }}
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${col}40, rgba(13,10,4,0.9))`,
          border: `2px solid ${col}80`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          cursor: 'pointer',
          transform: `translateY(${bobOffset}px)`,
          boxShadow: `0 0 16px ${col}30, 0 0 4px ${col}60`,
          pointerEvents: 'all',
          transition: 'box-shadow 0.3s',
        }}
        title="AI Companion — click for hints"
      >
        🤖
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 12px ${col}20; }
          50% { box-shadow: 0 0 20px ${col}60; }
        }
      `}</style>
    </div>
  );
}
