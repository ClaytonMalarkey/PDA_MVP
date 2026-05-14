import { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY = { structureId:'', name:'', description:'', icon:'🏛️', baseCost:100, baseProduction:5 };

export default function Structures() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({...EMPTY});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const load = () => { axios.get('/api/admin/structures').then(r => setItems(r.data||[])).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const validate = () => {
    const e = {};
    if (!editing && (!form.structureId || form.structureId.trim().length < 1)) e.structureId = 'Structure ID is required';
    if (!form.name || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.description || form.description.trim().length < 3) e.description = 'Description required (3+ chars)';
    if (!form.baseCost || form.baseCost < 1) e.baseCost = 'Cost must be at least 1';
    if (form.baseProduction < 0) e.baseProduction = 'Cannot be negative';
    return e;
  };

  const save = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitError('');
    try {
      if (editing) await axios.put('/api/admin/structures/' + editing, form);
      else await axios.post('/api/admin/structures', form);
      setEditing(null); setForm({...EMPTY}); setErrors({}); load();
    } catch (e) { setSubmitError(e.response?.data?.error || 'Failed'); }
  };
  const del = async (id) => { if (window.confirm('Delete?')) { await axios.delete('/api/admin/structures/' + id); load(); } };
  const cancel = () => { setEditing(null); setForm({...EMPTY}); setErrors({}); setSubmitError(''); };

  const Err = function(props) { return props.msg ? <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{props.msg}</div> : null; };

  return (
    <div>
      <div className="admin-table-header">
        <div><h2>🏗️ Structures ({items.length})</h2><p>Manage empire structures</p></div>
      </div>

      <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1.25rem',marginBottom:'1rem'}}>
        <h3 style={{marginBottom:'0.75rem'}}>{editing ? '✏️ Edit' : '➕ Add'} Structure</h3>
        {submitError && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'0.5rem',borderRadius:'0.3rem',marginBottom:'0.75rem',fontSize:'0.85rem'}}>⚠️ {submitError}</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'0.75rem'}}>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Structure ID *</label>
            <input className="input" value={form.structureId||''} disabled={!!editing}
              onChange={function(e){setForm({...form,structureId:e.target.value});setErrors({...errors,structureId:null});}}
              style={{width:'100%',borderColor:errors.structureId?'#ef4444':''}} />
            <Err msg={errors.structureId} />
          </div>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Name *</label>
            <input className="input" value={form.name||''}
              onChange={function(e){setForm({...form,name:e.target.value});setErrors({...errors,name:null});}}
              style={{width:'100%',borderColor:errors.name?'#ef4444':''}} />
            <Err msg={errors.name} />
          </div>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Icon</label>
            <input className="input" value={form.icon||''} onChange={function(e){setForm({...form,icon:e.target.value});}} style={{width:'100%'}} />
          </div>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Description *</label>
            <input className="input" value={form.description||''}
              onChange={function(e){setForm({...form,description:e.target.value});setErrors({...errors,description:null});}}
              style={{width:'100%',borderColor:errors.description?'#ef4444':''}} />
            <Err msg={errors.description} />
          </div>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Base Cost *</label>
            <input className="input" type="number" value={form.baseCost||0}
              onChange={function(e){setForm({...form,baseCost:Number(e.target.value)});setErrors({...errors,baseCost:null});}}
              style={{width:'100%',borderColor:errors.baseCost?'#ef4444':''}} />
            <Err msg={errors.baseCost} />
          </div>
          <div>
            <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem'}}>Base Production</label>
            <input className="input" type="number" value={form.baseProduction||0}
              onChange={function(e){setForm({...form,baseProduction:Number(e.target.value)});}}
              style={{width:'100%'}} />
          </div>
        </div>
        <div style={{marginTop:'0.75rem',display:'flex',gap:'0.5rem'}}>
          <button onClick={save} className="btn btn-primary">{editing?'💾 Update':'✅ Create'}</button>
          {editing && <button onClick={cancel} className="btn">Cancel</button>}
        </div>
      </div>

      {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Loading...</p> : (
        <div className="admin-table"><div className="admin-table-content">
          <table>
            <thead><tr><th>Icon</th><th>ID</th><th>Name</th><th>Description</th><th>Cost</th><th>Production</th><th>Actions</th></tr></thead>
            <tbody>{items.map(function(s) { return (
              <tr key={s._id}>
                <td style={{fontSize:'1.3rem'}}>{s.icon}</td><td>{s.structureId}</td><td><strong>{s.name}</strong></td>
                <td>{s.description}</td><td>{'💰'+s.baseCost}</td><td>{'📈'+s.baseProduction+'/hr'}</td>
                <td><div style={{display:'flex',gap:'0.3rem'}}>
                  <button onClick={function(){setEditing(s._id);setForm({...s});setErrors({});}} className="btn btn-sm">✏️</button>
                  <button onClick={function(){del(s._id);}} className="btn btn-icon btn-danger">🗑️</button>
                </div></td>
              </tr>); })}</tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}
