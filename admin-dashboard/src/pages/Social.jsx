import { useState, useEffect } from 'react';
import axios from 'axios';
import './Pages.css';
const API = '/api';
const h = () => ({ headers: { Authorization: `Bearer ${sessionStorage.getItem('adminToken')}` } });

export default function Social() {
  const [tab, setTab] = useState('chat');
  const [chats, setChats] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const urls = { chat: '/admin/chats', challenges: '/admin/challenges', purchases: '/admin/purchases', feed: '/admin/activity-feed' };
    axios.get(`/api${urls[tab]}`).then(r => {
      if (tab==='chat') setChats(r.data||[]);
      if (tab==='challenges') setChallenges(r.data||[]);
      if (tab==='purchases') setPurchases(r.data||[]);
      if (tab==='feed') setFeed(r.data||[]);
    }).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [tab]);

  const delChat = async (id) => { await axios.delete(`/api/admin/chats/${id}`); load(); };
  const delFeed = async (id) => { await axios.delete(`/api/admin/activity-feed/${id}`); load(); };

  return (
    <div className="page">
      <h1>🌐 Social & Activity</h1>
      <div style={{display:'flex',gap:'0.5rem',marginBottom:'1rem'}}>
        {[['chat','💬 Chat'],['challenges','⚔️ Challenges'],['purchases','💰 Purchases'],['feed','📡 Activity Feed']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)} className={`btn ${tab===id?'btn-primary':''}`}>{label}</button>
        ))}
      </div>
      {loading ? <p>Loading...</p> :
      tab==='chat' ? (
        <table className="admin-table"><thead><tr><th>Sender</th><th>Message</th><th>Time</th><th>Actions</th></tr></thead>
          <tbody>{chats.map(c=>(
            <tr key={c._id}><td>{c.senderId?.email||'?'}</td><td>{c.message}</td><td style={{fontSize:'0.75rem'}}>{new Date(c.createdAt).toLocaleString()}</td>
              <td><button onClick={()=>delChat(c._id)} className="btn btn-danger btn-sm">Del</button></td></tr>
          ))}</tbody></table>
      ) : tab==='challenges' ? (
        <table className="admin-table"><thead><tr><th>Challenger</th><th>Target</th><th>Type</th><th>Goal</th><th>Wager</th><th>Status</th></tr></thead>
          <tbody>{challenges.map(c=>(
            <tr key={c._id}><td>{c.challengerId?.email||'?'}</td><td>{c.targetId?.email||'?'}</td><td>{c.type}</td><td>{c.goal}</td><td>💰{c.wager}</td>
              <td style={{color:c.status==='active'?'#10b981':'#f59e0b',fontWeight:700}}>{c.status}</td></tr>
          ))}</tbody></table>
      ) : tab==='purchases' ? (
        <table className="admin-table"><thead><tr><th>User</th><th>Item</th><th>Method</th><th>Amount</th><th>Currency</th><th>Date</th></tr></thead>
          <tbody>{purchases.map(p=>(
            <tr key={p._id}><td>{p.userId?.email||'?'}</td><td>{p.itemId}</td><td>{p.paymentMethod}</td><td>{p.amountPaid}</td><td>{p.currencyType}</td>
              <td style={{fontSize:'0.75rem'}}>{new Date(p.createdAt).toLocaleString()}</td></tr>
          ))}</tbody></table>
      ) : tab==='feed' ? (
        <table className="admin-table"><thead><tr><th>Icon</th><th>User</th><th>Type</th><th>Message</th><th>Time</th><th>Actions</th></tr></thead>
          <tbody>{feed.map(a=>(
            <tr key={a._id}><td>{a.icon}</td><td>{a.userId?.email||'System'}</td><td>{a.type}</td><td>{a.message}</td>
              <td style={{fontSize:'0.75rem'}}>{new Date(a.createdAt).toLocaleString()}</td>
              <td><button onClick={()=>delFeed(a._id)} className="btn btn-danger btn-sm">Del</button></td></tr>
          ))}</tbody></table>
      ) : null}
    </div>);
}



