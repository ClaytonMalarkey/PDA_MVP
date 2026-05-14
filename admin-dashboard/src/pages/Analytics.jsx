import { useState, useEffect } from 'react';
import axios from 'axios';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1rem'}}>
    <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.3rem'}}>
      <span style={{fontSize:'1.5rem'}}>{icon}</span>
      <span style={{fontSize:'0.8rem',color:'var(--text-light)'}}>{label}</span>
    </div>
    <div style={{fontSize:'1.8rem',fontWeight:700,color:color||'inherit'}}>{value != null ? (typeof value==='number' ? value.toLocaleString() : value) : '0'}</div>
    {sub && <div style={{fontSize:'0.75rem',color:'var(--text-light)',marginTop:'0.2rem'}}>{sub}</div>}
  </div>
);

const Bar = ({ label, value, max, color }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{marginBottom:'0.4rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.75rem',marginBottom:'0.15rem'}}>
        <span>{label}</span><span style={{fontWeight:700}}>{value}</span>
      </div>
      <div style={{height:8,background:'var(--border-color)',borderRadius:4,overflow:'hidden'}}>
        <div style={{height:'100%',width:Math.min(pct,100)+'%',background:color||'#3b82f6',borderRadius:4}} />
      </div>
    </div>
  );
};

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [playerDetail, setPlayerDetail] = useState(null);

  const load = () => {
    axios.get('/api/analytics/overview')
      .then(r => setData(r.data))
      .catch(e => console.error('Analytics error:', e))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const viewPlayer = async (id) => {
    try {
      const r = await axios.get('/api/analytics/player/' + id);
      setPlayerDetail(r.data);
    } catch(e) { alert('Failed to load player'); }
  };

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading analytics...</div>;
  if (!data) return <div style={{padding:'2rem',textAlign:'center'}}>Failed to load analytics. <button onClick={load} className="btn btn-primary">Retry</button></div>;

  const u = data.users || {};
  const ec = data.economy || {};
  const pr = data.progression || {};
  const so = data.social || {};
  const em = data.empire || {};
  const net = data.network || {};
  const topPlayers = data.topPlayers || [];

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
        <h2>📊 Analytics & Control Center</h2>
        <button onClick={load} className="btn btn-primary">🔄 Refresh</button>
      </div>

      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
        {[['overview','📊 Overview'],['players','👥 Players'],['economy','💰 Economy'],['engagement','🔥 Engagement'],['world','🌍 World'],['network','🖥️ Network']].map(function(item) {
          return <button key={item[0]} onClick={function(){setTab(item[0]);setPlayerDetail(null);}} className={'btn ' + (tab===item[0]?'btn-primary':'')}>{item[1]}</button>;
        })}
      </div>

      {tab==='overview' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
            <StatCard icon="👥" label="Total Users" value={u.total || 0} sub={'+'+(u.newToday||0)+' today'} />
            <StatCard icon="🟢" label="Active Today" value={u.activeToday || 0} color="#10b981" />
            <StatCard icon="📅" label="7-Day Active" value={u.active7d || 0} sub={(u.retention7d||0)+'% retention'} color="#3b82f6" />
            <StatCard icon="⭐" label="Premium" value={u.premium || 0} color="#f59e0b" />
            <StatCard icon="💵" label="Revenue" value={'$'+(ec.totalRevenue||0).toFixed(2)} color="#10b981" />
            <StatCard icon="✅" label="Tasks Done" value={pr.totalTasksCompleted || 0} sub={(pr.completedToday||0)+' today'} />
            <StatCard icon="🔥" label="Avg Streak" value={pr.avgStreak || 0} sub={'Max: '+(pr.maxStreak||0)} color="#ef4444" />
            <StatCard icon="🖥️" label="Nodes" value={net.nodes || 0} sub={(net.onlineNodes||0)+' online'} color="#6366f1" />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
            <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1rem'}}>
              <h3 style={{marginBottom:'0.75rem'}}>🏆 Top Players</h3>
              {topPlayers.slice(0,8).map(function(p, i) {
                return (
                  <div key={p._id} onClick={function(){viewPlayer(p._id);}} style={{display:'flex',alignItems:'center',gap:'0.5rem',padding:'0.3rem 0',borderBottom:'1px solid var(--border-color)',cursor:'pointer'}}>
                    <span style={{fontWeight:700,width:24,color:i<3?'#f59e0b':'var(--text-light)'}}>{'#'+(i+1)}</span>
                    <span style={{flex:1,fontSize:'0.85rem'}}>{p.email}</span>
                    <span style={{fontSize:'0.75rem',color:'#8b5cf6'}}>{'⭐'+(p.xp||0).toLocaleString()}</span>
                    <span style={{fontSize:'0.75rem',color:'#10b981'}}>{'💰'+(p.currency||0).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
            <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1rem'}}>
              <h3 style={{marginBottom:'0.75rem'}}>📡 Activity (7 days)</h3>
              {(data.activity?.byType || []).map(function(a) {
                var maxCount = (data.activity?.byType?.[0]?.count) || 1;
                return <Bar key={a._id} label={a._id} value={a.count} max={maxCount} color="#3b82f6" />;
              })}
            </div>
          </div>
        </div>
      )}

      {tab==='players' && (
        <div>
          {playerDetail ? (
            <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1.5rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
                <h2>{'👤 ' + playerDetail.email}</h2>
                <button onClick={function(){setPlayerDetail(null);}} className="btn">← Back</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:'0.5rem',marginBottom:'1rem'}}>
                <StatCard icon="⭐" label="XP" value={playerDetail.xp||0} />
                <StatCard icon="🎖️" label="Rank" value={playerDetail.rank||1} />
                <StatCard icon="💰" label="Currency" value={playerDetail.currency||0} />
                <StatCard icon="🔥" label="Streak" value={playerDetail.streak||0} />
                <StatCard icon="✅" label="Tasks" value={playerDetail.stats?.tasksCompleted||0} />
                <StatCard icon="🏗️" label="Structures" value={playerDetail.stats?.structures||0} />
                <StatCard icon="🔬" label="Research" value={playerDetail.stats?.researchCompleted||0} />
                <StatCard icon="🏆" label="Achievements" value={playerDetail.stats?.achievementCount||0} />
              </div>
              {playerDetail.skills && (
                <div>
                  <h3>Skills</h3>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.3rem',marginTop:'0.5rem'}}>
                    {Object.entries(playerDetail.skills).map(function(entry) {
                      return <Bar key={entry[0]} label={entry[0]} value={entry[1]} max={10} color="#8b5cf6" />;
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem',marginBottom:'1rem'}}>
                <StatCard icon="👥" label="Total" value={u.total||0} />
                <StatCard icon="🟢" label="Active (24h)" value={u.activeToday||0} color="#10b981" />
                <StatCard icon="⭐" label="Premium" value={u.premium||0} color="#f59e0b" />
                <StatCard icon="📅" label="Daily Logins" value={u.dailyLogins||0} color="#3b82f6" />
              </div>
              <h3>Top Players (click for details)</h3>
              <div className="admin-table" style={{marginTop:'0.5rem'}}><div className="admin-table-content">
                <table>
                  <thead><tr><th>#</th><th>Email</th><th>Rank</th><th>XP</th><th>Currency</th><th>Streak</th><th>Premium</th></tr></thead>
                  <tbody>{topPlayers.map(function(p, i) {
                    return (
                      <tr key={p._id} onClick={function(){viewPlayer(p._id);}} style={{cursor:'pointer'}}>
                        <td style={{fontWeight:700,color:i<3?'#f59e0b':'inherit'}}>{'#'+(i+1)}</td>
                        <td>{p.email}</td><td>{p.rank}</td>
                        <td>{(p.xp||0).toLocaleString()}</td>
                        <td>{'💰'+(p.currency||0).toLocaleString()}</td>
                        <td>{'🔥'+(p.streak||0)}</td>
                        <td>{p.isPremium?'⭐':'-'}</td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div></div>
            </div>
          )}
        </div>
      )}

      {tab==='economy' && (
        <div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
            <StatCard icon="💰" label="Total Currency" value={ec.totalCurrency||0} sub={'Avg: '+(ec.avgCurrency||0)+'/user'} />
            <StatCard icon="💵" label="Revenue" value={'$'+(ec.totalRevenue||0).toFixed(2)} color="#10b981" />
            <StatCard icon="🛒" label="Purchases" value={ec.totalPurchases||0} sub={(ec.purchasesToday||0)+' today'} />
            <StatCard icon="📢" label="Influence" value={ec.totalInfluence||0} color="#3b82f6" />
            <StatCard icon="🔬" label="Innovation" value={ec.totalInnovation||0} color="#8b5cf6" />
            <StatCard icon="🏛️" label="Legacy" value={ec.totalLegacy||0} color="#f59e0b" />
          </div>
          <h3>Top Selling Items</h3>
          <div className="admin-table" style={{marginTop:'0.5rem'}}><div className="admin-table-content">
            <table>
              <thead><tr><th>#</th><th>Item</th><th>Purchases</th><th>Revenue</th></tr></thead>
              <tbody>{(ec.topItems||[]).map(function(item, i) {
                return <tr key={item._id}><td>{'#'+(i+1)}</td><td>{item._id}</td><td>{item.count}</td><td>{'$'+(item.revenue||0).toFixed(2)}</td></tr>;
              })}</tbody>
            </table>
          </div></div>
        </div>
      )}

      {tab==='engagement' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
          <StatCard icon="✅" label="Tasks Completed" value={pr.totalTasksCompleted||0} sub={(pr.completedToday||0)+' today'} />
          <StatCard icon="🔥" label="Avg Streak" value={pr.avgStreak||0} sub={'Max: '+(pr.maxStreak||0)} color="#ef4444" />
          <StatCard icon="📅" label="7d Retention" value={(u.retention7d||0)+'%'} color="#3b82f6" />
          <StatCard icon="📅" label="30d Retention" value={(u.retention30d||0)+'%'} color="#8b5cf6" />
          <StatCard icon="💬" label="Chat Messages" value={so.chats||0} />
          <StatCard icon="👥" label="Friendships" value={so.friends||0} />
          <StatCard icon="⚔️" label="Challenges" value={so.challenges||0} />
          <StatCard icon="🏆" label="Achievements" value={so.achievements||0} />
        </div>
      )}

      {tab==='world' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
          <StatCard icon="🏗️" label="Structures" value={em.structures||0} />
          <StatCard icon="🔬" label="Research" value={em.research||0} />
          <StatCard icon="🌍" label="Civilizations" value={em.civilizations||0} />
          <StatCard icon="⚔️" label="Guilds" value={em.guilds||0} />
          <StatCard icon="🏛️" label="Projects" value={em.projects||0} />
          <StatCard icon="🎁" label="Gifts" value={so.gifts||0} />
        </div>
      )}

      {tab==='network' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:'0.75rem'}}>
          <StatCard icon="🖥️" label="Total Nodes" value={net.nodes||0} />
          <StatCard icon="🟢" label="Online" value={net.onlineNodes||0} color="#10b981" />
          <StatCard icon="🔌" label="Plugins" value={net.plugins||0} />
          <StatCard icon="⬇️" label="Installs" value={net.pluginInstalls||0} />
        </div>
      )}
    </div>
  );
}
