import { useState, useEffect } from 'react';
import axios from 'axios';
import './Pages.css';
const API = '/api';
const h = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } });

export default function Research() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = () => axios.get(`/api/admin/research-nodes`).then(r => setNodes(r.data||[])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try { await axios.put(`/api/admin/research-nodes/${editing}`, form); setEditing(null); load(); }
    catch (e) { alert('Failed'); }
  };

  const domains = [...new Set(nodes.map(n => n.domain))];
  const filtered = filter === 'all' ? nodes : nodes.filter(n => n.domain === filter);

  return (
    <div className="page">
      <h1>🔬 Research Nodes ({nodes.length})</h1>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
        <button onClick={()=>setFilter('all')} className={`btn ${filter==='all'?'btn-primary':''}`}>All ({nodes.length})</button>
        {domains.map(d => {
          const count = nodes.filter(n=>n.domain===d).length;
          return <button key={d} onClick={()=>setFilter(d)} className={`btn ${filter===d?'btn-primary':''}`}>{d} ({count})</button>;
        })}
      </div>
      {editing && (
        <div style={{background:'var(--card-bg)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1rem',marginBottom:'1rem'}}>
          <h3>Edit: {form.name}</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.5rem'}}>
            <input className="input" placeholder="Name" value={form.name||''} onChange={e=>setForm({...form,name:e.target.value})} />
            <input className="input" type="number" placeholder="Cost" value={form.cost||0} onChange={e=>setForm({...form,cost:Number(e.target.value)})} />
            <input className="input" type="number" placeholder="XP Reward" value={form.xpReward||0} onChange={e=>setForm({...form,xpReward:Number(e.target.value)})} />
            <input className="input" type="number" placeholder="Research Time (s)" value={form.researchTime||0} onChange={e=>setForm({...form,researchTime:Number(e.target.value)})} />
            <input className="input" type="number" placeholder="Tier" value={form.tier||0} onChange={e=>setForm({...form,tier:Number(e.target.value)})} />
          </div>
          <button onClick={save} className="btn btn-primary" style={{marginTop:'0.5rem'}}>Save</button>
          <button onClick={()=>setEditing(null)} className="btn" style={{marginLeft:'0.5rem'}}>Cancel</button>
        </div>
      )}
      {loading ? <p>Loading...</p> : (
        <table className="admin-table"><thead><tr><th>ID</th><th>Domain</th><th>Name</th><th>Tier</th><th>Cost</th><th>XP</th><th>Time</th><th>Actions</th></tr></thead>
          <tbody>{filtered.map(n=>(
            <tr key={n._id}><td style={{fontFamily:'monospace',fontSize:'0.7rem'}}>{n.nodeId}</td><td>{n.domain}</td><td><strong>{n.name}</strong></td>
              <td>{n.tier}</td><td>💰{n.cost}</td><td>⭐{n.xpReward}</td><td>{Math.ceil(n.researchTime/60)}min</td>
              <td><button onClick={()=>{setEditing(n._id);setForm(n);}} className="btn btn-sm">Edit</button></td>
            </tr>))}</tbody></table>)}
    </div>);
}



