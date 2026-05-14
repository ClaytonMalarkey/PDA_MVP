import { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY = { itemId:'', name:'', description:'', icon:'🛒', category:'currency_pack', priceUSD:0, priceCurrency:0, sortOrder:0, isActive:true, isFeatured:false };

function validateForm(form, isEdit) {
  const errors = {};
  if (!isEdit && (!form.itemId || form.itemId.trim().length < 1)) errors.itemId = 'Item ID is required';
  if (!isEdit && form.itemId && !/^[a-z0-9-]+$/.test(form.itemId)) errors.itemId = 'Only lowercase letters, numbers, dashes';
  if (!form.name || form.name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!form.description || form.description.trim().length < 3) errors.description = 'Description must be at least 3 characters';
  if (form.priceUSD < 0) errors.priceUSD = 'Price cannot be negative';
  if (form.priceCurrency < 0) errors.priceCurrency = 'Credits cannot be negative';
  if (form.priceUSD === 0 && form.priceCurrency === 0) errors.priceUSD = 'Set either USD or credit price';
  return errors;
}

const FieldError = ({ error }) => error ? <div style={{color:'#ef4444',fontSize:'0.72rem',marginTop:'0.15rem'}}>{error}</div> : null;

export default function ShopItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({...EMPTY});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const load = () => { axios.get('/api/admin/shop-items').then(r => setItems(r.data||[])).catch(e=>console.error(e)).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const save = async () => {
    const errs = validateForm(form, !!editing);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSubmitError('');
    try {
      if (editing) await axios.put('/api/admin/shop-items/' + editing, form);
      else await axios.post('/api/admin/shop-items', form);
      setEditing(null); setForm({...EMPTY}); setErrors({}); load();
    } catch (e) { setSubmitError(e.response?.data?.error || 'Failed to save'); }
  };
  const del = async (id) => { if (window.confirm('Delete this item?')) { await axios.delete('/api/admin/shop-items/' + id); load(); } };
  const edit = (item) => { setEditing(item._id); setForm({...item}); setErrors({}); setSubmitError(''); };
  const cancel = () => { setEditing(null); setForm({...EMPTY}); setErrors({}); setSubmitError(''); };

  const F = (field, label, type, extra) => (
    <div>
      <label style={{fontSize:'0.75rem',fontWeight:600,display:'block',marginBottom:'0.2rem',color:errors[field]?'#ef4444':'inherit'}}>{label} *</label>
      {type === 'select' ? (
        <select className="input" value={form[field]||''} onChange={e=>{setForm({...form,[field]:e.target.value});setErrors({...errors,[field]:null});}}
          style={{width:'100%',borderColor:errors[field]?'#ef4444':''}}>
          {extra.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
      ) : (
        <input className="input" type={type||'text'} step={type==='number'?'0.01':undefined}
          value={form[field]!=null?form[field]:''} disabled={field==='itemId'&&!!editing}
          onChange={e=>{const v=type==='number'?Number(e.target.value):e.target.value;setForm({...form,[field]:v});setErrors({...errors,[field]:null});}}
          style={{width:'100%',borderColor:errors[field]?'#ef4444':''}} />
      )}
      <FieldError error={errors[field]} />
    </div>
  );

  return (
    <div>
      <div className="admin-table-header">
        <div><h2>🛒 Shop Items ({items.length})</h2><p>Manage marketplace items and pricing</p></div>
      </div>

      <div style={{background:'var(--surface-color)',border:'1px solid var(--border-color)',borderRadius:'0.5rem',padding:'1.25rem',marginBottom:'1rem'}}>
        <h3 style={{marginBottom:'0.75rem'}}>{editing ? '✏️ Edit Item' : '➕ Add New Item'}</h3>
        {submitError && <div style={{background:'#fef2f2',border:'1px solid #fecaca',color:'#dc2626',padding:'0.5rem 0.75rem',borderRadius:'0.3rem',marginBottom:'0.75rem',fontSize:'0.85rem'}}>⚠️ {submitError}</div>}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))',gap:'0.75rem'}}>
          {F('itemId','Item ID','text')}
          {F('name','Name','text')}
          {F('icon','Icon','text')}
          {F('category','Category','select',['currency_pack','premium','booster','cosmetic','energy'])}
          {F('priceUSD','Price USD','number')}
          {F('priceCurrency','Price Credits','number')}
        </div>
        <div style={{marginTop:'0.75rem'}}>
          {F('description','Description','text')}
        </div>
        <div style={{marginTop:'0.75rem',display:'flex',gap:'0.75rem',alignItems:'center',flexWrap:'wrap'}}>
          <label style={{fontSize:'0.85rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem'}}>
            <input type="checkbox" checked={form.isActive!==false} onChange={e=>setForm({...form,isActive:e.target.checked})} /> Active
          </label>
          <label style={{fontSize:'0.85rem',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.3rem'}}>
            <input type="checkbox" checked={!!form.isFeatured} onChange={e=>setForm({...form,isFeatured:e.target.checked})} /> Featured
          </label>
          <div style={{flex:1}} />
          <button onClick={save} className="btn btn-primary">{editing?'💾 Update':'✅ Create'}</button>
          {editing && <button onClick={cancel} className="btn">Cancel</button>}
        </div>
      </div>

      {loading ? <p style={{textAlign:'center',padding:'2rem'}}>Loading...</p> : (
        <div className="admin-table"><div className="admin-table-content">
          <table>
            <thead><tr><th>Icon</th><th>ID</th><th>Name</th><th>Category</th><th>USD</th><th>Credits</th><th>Active</th><th>Featured</th><th>Actions</th></tr></thead>
            <tbody>{items.map(function(i) { return (
              <tr key={i._id}>
                <td style={{fontSize:'1.3rem'}}>{i.icon}</td>
                <td><code style={{fontSize:'0.75rem'}}>{i.itemId}</code></td>
                <td><strong>{i.name}</strong><div style={{fontSize:'0.75rem',color:'var(--text-light)'}}>{(i.description||'').substring(0,50)}</div></td>
                <td>{i.category}</td>
                <td>{'$'+(i.priceUSD||0).toFixed(2)}</td>
                <td>{i.priceCurrency||0}</td>
                <td style={{color:i.isActive!==false?'#10b981':'#ef4444'}}>{i.isActive!==false?'✓':'✗'}</td>
                <td>{i.isFeatured?'⭐':'-'}</td>
                <td><div style={{display:'flex',gap:'0.3rem'}}>
                  <button onClick={function(){edit(i);}} className="btn btn-sm">✏️</button>
                  <button onClick={function(){del(i._id);}} className="btn btn-icon btn-danger">🗑️</button>
                </div></td>
              </tr>); })}</tbody>
          </table>
        </div></div>
      )}
    </div>
  );
}
