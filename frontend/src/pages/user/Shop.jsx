import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import './User.css';

const CAT_LABELS = {
  currency_pack: { label: '💰 Credit Packs', desc: 'Buy credits with real money' },
  premium: { label: '⭐ Premium', desc: 'Unlock premium benefits' },
  booster: { label: '⚡ Boosters', desc: 'Spend credits for instant boosts' },
  energy: { label: '🔋 Energy', desc: 'Recharge your energy' },
};

const Shop = () => {
  const { user, refreshUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('currency_pack');
  const [actionMsg, setActionMsg] = useState(null);
  const [adCooldown, setAdCooldown] = useState(0);

  useEffect(() => { fetchItems(); }, []);

  // Ad cooldown timer
  useEffect(() => {
    if (adCooldown <= 0) return;
    const t = setInterval(() => setAdCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [adCooldown]);

  const fetchItems = async () => {
    try {
      const res = await axios.get('/api/shop/items');
      setItems(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMsg = (m, type = 'success') => { setActionMsg({ m, type }); setTimeout(() => setActionMsg(null), 3000); };

  const buyWithCredits = async (itemId) => {
    try {
      const res = await axios.post(`/api/shop/buy/${itemId}`);
      showMsg(res.data.message);
      fetchItems();
      if (refreshUser) refreshUser();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed', 'error'); }
  };

  const buyWithUSD = async (itemId, price) => {
    if (!confirm(`This would charge $${price.toFixed(2)} via Stripe.\n\nIn production, this opens a Stripe checkout.\nFor demo, this simulates a successful payment.\n\nProceed?`)) return;
    try {
      const res = await axios.post(`/api/shop/buy-usd/${itemId}`);
      showMsg(res.data.message);
      fetchItems();
      if (refreshUser) refreshUser();
    } catch (err) { showMsg(err.response?.data?.error || 'Failed', 'error'); }
  };

  const claimAd = async (type) => {
    try {
      const res = await axios.post('/api/shop/ad-reward', { rewardType: type });
      showMsg(res.data.message);
      setAdCooldown(300);
      if (refreshUser) refreshUser();
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed';
      if (msg.includes('Wait')) { const secs = parseInt(msg.match(/\d+/)?.[0] || 300); setAdCooldown(secs); }
      showMsg(msg, 'error');
    }
  };

  const filtered = items.filter(i => i.category === tab);
  const premiumActive = user?.isPremium && user?.premiumExpiresAt && new Date(user.premiumExpiresAt) > new Date();

  if (loading) return <div className="loading">Loading shop...</div>;

  return (
    <div style={{ width: '100%', padding: '0 1rem' }}>
      {actionMsg && (
        <div style={{ position: 'fixed', top: 80, right: 20, zIndex: 999, padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, fontSize: '0.9rem',
          background: actionMsg.type === 'error' ? '#fef2f2' : '#f0fdf4', color: actionMsg.type === 'error' ? '#dc2626' : '#16a34a',
          border: `1px solid ${actionMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          {actionMsg.m}
        </div>
      )}

      <div style={{ marginBottom: '1.5rem' }}>
        <h1>🛒 Shop</h1>
        <p style={{ color: '#6b7280' }}>Buy credits, premium, boosters, and energy</p>
      </div>

      {/* Wallet bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <span style={{ fontWeight: 600 }}>💰 {user?.currency || 0} credits</span>
        <span style={{ fontWeight: 600 }}>⭐ {user?.xp || 0} XP</span>
        <span style={{ fontWeight: 600 }}>⚡ {user?.influencePoints || 0} IP</span>
        <span style={{ fontWeight: 600 }}>🔬 {user?.innovationTokens || 0} IT</span>
        <span style={{ fontWeight: 600 }}>🏛️ {user?.legacyStones || 0} LS</span>
        {premiumActive && <span style={{ marginLeft: 'auto', background: '#fef3c7', color: '#92400e', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 700 }}>⭐ PREMIUM</span>}
      </div>

      {/* Rewarded Ads Section */}
      <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)', color: 'white', borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1.25rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>🎬 Watch Ad — Free Rewards</h3>
        <p style={{ fontSize: '0.85rem', color: '#c4b5fd', marginBottom: '0.75rem' }}>Watch a short ad to earn free rewards. Available every 5 minutes.</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {[
            { type: 'currency', label: '💰 +50 Credits', color: '#f59e0b' },
            { type: 'energy', label: '⚡ +30 Energy', color: '#10b981' },
            { type: 'xp_boost', label: '⭐ +100 XP', color: '#8b5cf6' },
          ].map(ad => (
            <button key={ad.type} onClick={() => claimAd(ad.type)} disabled={adCooldown > 0}
              style={{ padding: '0.5rem 1rem', background: adCooldown > 0 ? '#374151' : ad.color, color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 700, cursor: adCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '0.85rem', opacity: adCooldown > 0 ? 0.5 : 1 }}>
              {adCooldown > 0 ? `⏳ ${Math.floor(adCooldown / 60)}:${String(adCooldown % 60).padStart(2, '0')}` : `▶ ${ad.label}`}
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        {Object.entries(CAT_LABELS).map(([key, val]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: '0.5rem 1rem', border: `2px solid ${tab === key ? '#6366f1' : '#e5e7eb'}`, background: tab === key ? '#6366f1' : 'white', color: tab === key ? 'white' : '#374151', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
            {val.label}
          </button>
        ))}
      </div>

      <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1rem' }}>{CAT_LABELS[tab]?.desc}</p>

      {/* Items Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${window.innerWidth < 480 ? '100%' : '250px'}, 1fr))`, gap: '1rem' }}>
        {filtered.map(item => (
          <div key={item.itemId} style={{ background: 'white', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: item.isFeatured ? '2px solid #6366f1' : '1px solid #e5e7eb', position: 'relative' }}>
            {item.isFeatured && <span style={{ position: 'absolute', top: -8, right: 12, background: '#6366f1', color: 'white', padding: '0.1rem 0.5rem', borderRadius: '1rem', fontSize: '0.65rem', fontWeight: 700 }}>BEST VALUE</span>}
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>{item.description}</p>

            {/* Rewards preview */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
              {item.rewards.currency > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>💰 +{item.rewards.currency}</span>}
              {item.rewards.xp > 0 && <span style={{ background: '#ede9fe', color: '#5b21b6', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>⭐ +{item.rewards.xp}</span>}
              {item.rewards.energy > 0 && <span style={{ background: '#d1fae5', color: '#065f46', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>⚡ +{item.rewards.energy}</span>}
              {item.rewards.influencePoints > 0 && <span style={{ background: '#dbeafe', color: '#1e40af', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>📢 +{item.rewards.influencePoints}</span>}
              {item.rewards.legacyStones > 0 && <span style={{ background: '#fce7f3', color: '#9d174d', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>🏛️ +{item.rewards.legacyStones}</span>}
              {item.rewards.premiumDays > 0 && <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.4rem', borderRadius: '0.25rem' }}>⭐ {item.rewards.premiumDays}d premium</span>}
            </div>

            {/* Buy buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {item.priceCurrency > 0 && (
                <button onClick={() => buyWithCredits(item.itemId)} disabled={!item.canPurchase || (user?.currency || 0) < item.priceCurrency}
                  style={{ flex: 1, padding: '0.5rem', background: (user?.currency || 0) >= item.priceCurrency && item.canPurchase ? '#10b981' : '#d1d5db', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, cursor: (user?.currency || 0) >= item.priceCurrency ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
                  💰 {item.priceCurrency}
                </button>
              )}
              {item.priceUSD > 0 && (
                <button onClick={() => buyWithUSD(item.itemId, item.priceUSD)} disabled={!item.canPurchase}
                  style={{ flex: 1, padding: '0.5rem', background: item.canPurchase ? '#6366f1' : '#d1d5db', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: 700, cursor: item.canPurchase ? 'pointer' : 'not-allowed', fontSize: '0.85rem' }}>
                  ${item.priceUSD.toFixed(2)}
                </button>
              )}
            </div>
            {!item.canPurchase && <p style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.3rem' }}>Purchase limit reached</p>}
          </div>
        ))}
      </div>

      {/* Premium Benefits */}
      {tab === 'premium' && (
        <div style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: '0.75rem', padding: '1.25rem' }}>
          <h3 style={{ color: '#92400e', marginBottom: '0.5rem' }}>⭐ Premium Benefits</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.85rem', color: '#78350f' }}>
            <div>🚫 No ads</div>
            <div>1.5× task rewards</div>
            <div>24h idle income cap (vs 12h)</div>
            <div>Priority task access</div>
            <div>Exclusive ship colors</div>
            <div>Premium badge in leaderboard</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
