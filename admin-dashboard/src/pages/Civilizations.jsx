import { useState, useEffect } from 'react';
import axios from 'axios';
import './Pages.css';
const API = '/api';
const h = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } });

export default function Civilizations() {
  const [civs, setCivs] = useState([]);
  const [guilds, setGuilds] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tab, setTab] = useState('civs');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      axios.get(`/api/admin/civilizations`).catch(()=>({data:[]})),
      axios.get(`/api/admin/guilds`).catch(()=>({data:[]})),
      axios.get(`/api/admin/projects`).catch(()=>({data:[]})),
    ]).then(([c,g,p]) => { setCivs(c.data||[]); setGuilds(g.data||[]); setProjects(p.data||[]); }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const delCiv = async (id) => { if(window.confirm('Delete?')){await axios.delete(`/api/admin/civilizations/${id}`);load();} };
  const delGuild = async (id) => { if(window.confirm('Delete?')){await axios.delete(`/api/admin/guilds/${id}`);load();} };

  return (
    <div className="page">
      <h1>🌍 Civilizations, Guilds & Projects</h1>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        {[['civs','🌍 Civilizations'],['guilds','⚔️ Guilds'],['projects','🏗️ Projects']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`btn ${tab===id?'btn-primary':''}`}>{label}</button>
        ))}
      </div>
      {loading ? <p>Loading...</p> :
      tab==='civs' ? (
        <table className="admin-table"><thead><tr><th>Icon</th><th>Name</th><th>Leader</th><th>Members</th><th>Governance</th><th>Stability</th><th>Resources</th><th>Actions</th></tr></thead>
          <tbody>{civs.map(c=>(
            <tr key={c._id}><td style={{fontSize:'1.3rem'}}>{c.icon}</td><td><strong>{c.name}</strong></td><td>{c.leaderId?.email||'?'}</td>
              <td>{c.members?.length||0}</td><td>{c.governanceType}</td><td>{c.stabilityScore}%</td><td>💰{c.totalResources}</td>
              <td><button onClick={()=>delCiv(c._id)} className="btn btn-danger btn-sm">Del</button></td></tr>
          ))}</tbody></table>
      ) : tab==='guilds' ? (
        <table className="admin-table"><thead><tr><th>Icon</th><th>Name</th><th>Specialization</th><th>Level</th><th>Members</th><th>Bonus</th><th>Actions</th></tr></thead>
          <tbody>{guilds.map(g=>(
            <tr key={g._id}><td style={{fontSize:'1.3rem'}}>{g.icon}</td><td><strong>{g.name}</strong></td><td>{g.specialization}</td>
              <td>{g.level}</td><td>{g.memberCount}/{g.maxMembers}</td><td>+{Math.round((g.bonusMultiplier-1)*100)}%</td>
              <td><button onClick={()=>delGuild(g._id)} className="btn btn-danger btn-sm">Del</button></td></tr>
          ))}</tbody></table>
      ) : (
        <table className="admin-table"><thead><tr><th>Icon</th><th>Name</th><th>Stage</th><th>Progress</th><th>Contributors</th><th>Status</th></tr></thead>
          <tbody>{projects.map(p=>(
            <tr key={p._id}><td style={{fontSize:'1.3rem'}}>{p.icon}</td><td><strong>{p.name}</strong></td><td>{p.stage}</td>
              <td>{p.currentProgress}/{p.targetProgress}</td><td>{p.contributors?.length||0}</td>
              <td style={{color:p.isComplete?'#10b981':'#f59e0b'}}>{p.isComplete?'Complete':'In Progress'}</td></tr>
          ))}</tbody></table>
      )}
    </div>);
}



