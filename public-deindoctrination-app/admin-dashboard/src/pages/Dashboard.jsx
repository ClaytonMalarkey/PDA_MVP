import { useState, useEffect } from 'react';
import axios from 'axios';
const API = '/api';
const hdr = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } });

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get(`/api/analytics/overview`)
      .then(r => setData(r.data))
      .catch(() => axios.get(`/api/admin/metrics`).then(r => setData({ users: { total: r.data.totalUsers, activeToday: r.data.activeUsers, premium: r.data.premiumUsers }, economy: { totalRevenue: r.data.revenue, totalCurrency: r.data.totalCurrency }, progression: { totalTasksCompleted: r.data.tasksCompleted, avgStreak: r.data.averageStreak, maxStreak: r.data.maxStreak }, social: {}, empire: {}, network: {} })))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div style={{padding:'2rem',textAlign:'center'}}>Loading dashboard...</div>;

  const u = data?.users || {};
  const ec = data?.economy || {};
  const pr = data?.progression || {};
  const so = data?.social || {};
  const em = data?.empire || {};
  const net = data?.network || {};

  const Card = ({ icon, label, value, sub, color }) => (
    <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem',display:'flex',alignItems:'center',gap:'1rem'}}>
      <div style={{fontSize:'2rem',width:48,height:48,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(99,102,241,0.1)',borderRadius:'0.5rem'}}>{icon}</div>
      <div>
        <div style={{fontSize:'0.8rem',color:'var(--text-secondary,#94a3b8)'}}>{label}</div>
        <div style={{fontSize:'1.6rem',fontWeight:700,color:color||'var(--text-primary,#e2e8f0)'}}>{typeof value==='number'?value.toLocaleString():value}</div>
        {sub && <div style={{fontSize:'0.72rem',color:'var(--text-secondary,#64748b)',marginTop:'0.1rem'}}>{sub}</div>}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
        <div>
          <h2 style={{margin:0}}>🎯 Command Center</h2>
          <p style={{color:'var(--text-secondary,#94a3b8)',margin:'0.25rem 0 0',fontSize:'0.85rem'}}>Real-time overview of your platform</p>
        </div>
        <button onClick={load} className="btn btn-primary">🔄 Refresh</button>
      </div>

      {/* Key Metrics */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'0.75rem',marginBottom:'1.5rem'}}>
        <Card icon="👥" label="Total Users" value={u.total||0} sub={`+${u.newToday||0} today`} />
        <Card icon="🟢" label="Active Today" value={u.activeToday||0} sub={`${u.total>0?((u.activeToday/u.total)*100).toFixed(1):0}% DAU`} color="#10b981" />
        <Card icon="⭐" label="Premium" value={u.premium||0} sub={`${u.total>0?((u.premium/u.total)*100).toFixed(1):0}% conversion`} color="#f59e0b" />
        <Card icon="💵" label="Revenue" value={`$${(ec.totalRevenue||0).toFixed(2)}`} sub={`${ec.paidPurchases||0} paid purchases`} color="#10b981" />
        <Card icon="✅" label="Tasks Done" value={pr.totalTasksCompleted||0} sub={`${pr.completedToday||0} today`} />
        <Card icon="🔥" label="Avg Streak" value={(pr.avgStreak||0)} sub={`Max: ${pr.maxStreak||0} days`} color="#ef4444" />
        <Card icon="💰" label="Economy" value={(ec.totalCurrency||0).toLocaleString()} sub="Total currency in circulation" />
        <Card icon="🖥️" label="Nodes" value={net.nodes||0} sub={`${net.onlineNodes||0} online`} color="#6366f1" />
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'1rem',marginBottom:'1.5rem'}}>
        {/* Social Stats */}
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>🌐 Social</h3>
          {[['💬 Chats',so.chats],['👥 Friends',so.friends],['⚔️ Challenges',so.challenges],['🎁 Gifts',so.gifts],['🏆 Achievements',so.achievements]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'1px solid var(--border-color,#334155)',fontSize:'0.85rem'}}>
              <span>{l}</span><span style={{fontWeight:700}}>{v||0}</span>
            </div>
          ))}
        </div>

        {/* Empire Stats */}
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>🏛️ Empire & World</h3>
          {[['🏗️ Structures',em.structures],['🔬 Research',em.research],['🌍 Civilizations',em.civilizations],['⚔️ Guilds',em.guilds],['🏛️ Projects',em.projects]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',borderBottom:'1px solid var(--border-color,#334155)',fontSize:'0.85rem'}}>
              <span>{l}</span><span style={{fontWeight:700}}>{v||0}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>⚡ Quick Actions</h3>
          {[
            ['/users','👥','Manage Users'],
            ['/tasks','✅','Manage Tasks'],
            ['/shop-items','🛒','Shop Items'],
            ['/game-config','🎮','Game Config'],
            ['/analytics','📊','Full Analytics'],
            ['/social','🌐','Social & Activity'],
          ].map(([to,icon,label])=>(
            <a key={to} href={to} style={{display:'block',padding:'0.4rem 0',textDecoration:'none',color:'var(--primary-color,#6366f1)',fontSize:'0.85rem',borderBottom:'1px solid var(--border-color,#334155)'}}>
              {icon} {label}
            </a>
          ))}
        </div>
      </div>

      {/* Top Players */}
      {data?.topPlayers?.length > 0 && (
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem'}}>🏆 Top Players</h3>
          <table className="admin-table"><thead><tr><th>#</th><th>Email</th><th>Rank</th><th>XP</th><th>Currency</th><th>Streak</th><th>Tasks</th><th>Premium</th></tr></thead>
            <tbody>{data.topPlayers.slice(0,5).map((p,i)=>(
              <tr key={p._id}><td style={{fontWeight:700,color:i<3?'#f59e0b':'inherit'}}>#{i+1}</td><td>{p.email}</td><td>{p.rank}</td>
                <td>{p.xp.toLocaleString()}</td><td>💰{p.currency.toLocaleString()}</td><td>🔥{p.streak}</td>
                <td>{p.totalTasksCompleted}</td><td>{p.isPremium?'⭐':'-'}</td></tr>
            ))}</tbody></table>
        </div>
      )}

      {/* System Health */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem',marginTop:'1rem'}}>
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>🔧 System Health</h3>
          {[['Database','● Connected','#10b981'],['API','● Running','#10b981'],['WebSocket','● Active','#10b981'],['Rate Limiter','● Enabled','#10b981']].map(([l,s,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',fontSize:'0.85rem'}}>
              <span>{l}</span><span style={{color:c,fontWeight:600}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{background:'var(--card-bg,#1e293b)',border:'1px solid var(--border-color,#334155)',borderRadius:'0.75rem',padding:'1.25rem'}}>
          <h3 style={{marginBottom:'0.75rem',fontSize:'1rem'}}>📈 Retention</h3>
          {[['Daily (DAU)',u.total>0?((u.activeToday/u.total)*100).toFixed(1)+'%':'0%'],['7-Day',u.retention7d+'%'],['30-Day',u.retention30d+'%'],['Daily Logins',u.dailyLogins||0]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'0.3rem 0',fontSize:'0.85rem'}}>
              <span>{l}</span><span style={{fontWeight:700}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



