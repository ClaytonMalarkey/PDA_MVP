import { useState, useEffect } from 'react';
import axios from 'axios';

export default function Nodes() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const r = await axios.get('/api/admin/nodes');
      setNodes(r.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const online = nodes.filter(n => n.status === 'online').length;
  const STATUS_COLORS = { online: '#10b981', offline: '#ef4444', idle: '#f59e0b', busy: '#8b5cf6' };

  return (
    <div>
      <div className="admin-table-header">
        <div><h2>🖥️ Node Network ({nodes.length})</h2><p>{online} online, {nodes.length - online} offline</p></div>
        <button onClick={load} className="btn btn-primary">🔄 Refresh</button>
      </div>
      {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Loading...</p> : (
        <div className="admin-table"><div className="admin-table-content">
          <table>
            <thead><tr><th>Node ID</th><th>Name</th><th>Type</th><th>Status</th><th>Owner</th><th>Capabilities</th><th>Plugins</th></tr></thead>
            <tbody>{nodes.map(n => (
              <tr key={n.nodeId}>
                <td><code style={{fontSize:'0.75rem'}}>{n.nodeId}</code></td>
                <td>{n.name}</td><td>{n.type}</td>
                <td><span style={{color:STATUS_COLORS[n.status]||'#999',fontWeight:700}}>● {n.status}</span></td>
                <td>{n.userId?.email || '?'}</td>
                <td style={{fontSize:'0.75rem'}}>{(n.capabilities||[]).join(', ')}</td>
                <td>{(n.installedPlugins||[]).length}</td>
              </tr>
            ))}</tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}

