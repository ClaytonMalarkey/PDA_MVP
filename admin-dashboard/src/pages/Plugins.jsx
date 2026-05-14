import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Plugins() {
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const r = await axios.get('/api/plugins/marketplace'); setPlugins(r.data || []); }
    catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleActive = async (pluginId, current) => {
    try { await axios.put('/api/admin/plugins/' + pluginId, { isActive: !current }); load(); }
    catch (e) { alert('Failed'); }
  };

  const del = async (pluginId) => {
    if (!window.confirm('Delete this plugin?')) return;
    try { await axios.delete('/api/admin/plugins/' + pluginId); load(); }
    catch (e) { alert('Failed'); }
  };

  return (
    <div>
      <div className="admin-table-header">
        <div>
          <h2>🔌 Plugin Marketplace ({plugins.length})</h2>
          <p>{plugins.filter(p=>p.isSystem).length} system, {plugins.filter(p=>!p.isSystem).length} community, {plugins.reduce((s,p)=>s+(p.downloads||0),0)} total downloads</p>
        </div>
        <button onClick={load} className="btn btn-primary">🔄 Refresh</button>
      </div>
      {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Loading...</p> : (
        <div className="admin-table"><div className="admin-table-content">
          <table>
            <thead><tr><th>Icon</th><th>Name</th><th>Category</th><th>Type</th><th>Downloads</th><th>Rating</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{plugins.map(p => (
              <tr key={p.pluginId}>
                <td style={{fontSize:'1.3rem'}}>{p.icon}</td>
                <td><strong>{p.name}</strong><div style={{fontSize:'0.72rem',color:'var(--text-light)'}}>{(p.description||'').substring(0,60)}</div></td>
                <td>{p.category}</td>
                <td>{p.isSystem ? <span style={{color:'#3b82f6',fontWeight:700}}>System</span> : 'Community'}</td>
                <td>{p.downloads||0}</td>
                <td>{(p.rating||0) > 0 ? '⭐' + p.rating : '-'}</td>
                <td>{p.isPaid ? '💰' + p.price : 'Free'}</td>
                <td><span style={{color:p.isActive!==false?'#10b981':'#ef4444',fontWeight:700}}>{p.isActive!==false?'Active':'Off'}</span></td>
                <td><div style={{display:'flex',gap:'0.3rem'}}>
                  <button onClick={() => toggleActive(p.pluginId, p.isActive!==false)} className={`btn btn-sm ${p.isActive!==false?'btn-danger':''}`}>
                    {p.isActive!==false ? 'Disable' : 'Enable'}
                  </button>
                  {!p.isSystem && <button onClick={() => del(p.pluginId)} className="btn btn-icon btn-danger">🗑️</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}

