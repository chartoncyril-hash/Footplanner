import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wallet, TrendingUp, TrendingDown, Plus, Trash2, Check, X,
  Pencil, Filter, ArrowDownCircle, ArrowUpCircle, Link2, Tag,
} from 'lucide-react';
import {
  listTransactions, createTransaction, updateTransaction, deleteTransaction,
  listCategories, computeBalance, listAllSponsorPayments,
  ensureDefaultCategories, createCategory, updateCategory, deleteCategory,
} from '../services/financeService';

const STATUS_META = {
  'prévu':     { label: 'Prévu',     color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'réalisé':   { label: 'Réalisé',   color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'rapproché': { label: 'Rapproché', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
};
const PAYMENT_METHODS = ['virement', 'espèces', 'chèque', 'CB', 'autre'];

const fmt = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';

export function FinanceHubView() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formDir, setFormDir] = useState('in');
  // Filtres
  const [fStatus, setFStatus] = useState('all');
  const [fCat, setFCat] = useState('all');
  const [fDir, setFDir] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tx, cats, sponsorPays] = await Promise.all([listTransactions(), ensureDefaultCategories(), listAllSponsorPayments()]);
      // Echeances sponsors -> recettes virtuelles (miroir, non editables ici)
      const sponsorTx = (sponsorPays || []).map(sp => ({
        id: 'sponsor_' + sp.id,
        virtual: true,
        direction: 'in',
        amount: sp.amount,
        category: 'Sponsors & partenariats',
        paymentMethod: 'virement',
        description: (sp.sponsorName || 'Sponsor') + (sp.label ? ' — ' + sp.label : ''),
        date: sp.paidAt || sp.dueDate || new Date().toISOString().slice(0,10),
        status: sp.paidAt ? 'réalisé' : 'prévu',
        sourceType: 'sponsor',
        sourceId: sp.sponsorId,
      }));
      setTransactions([...tx, ...sponsorTx]);
      setCategories(cats);
    } catch (e) {
      console.error('Chargement finance échoué', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const agg = useMemo(() => computeBalance(transactions), [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (fStatus !== 'all' && t.status !== fStatus) return false;
      if (fCat !== 'all' && t.category !== fCat) return false;
      if (fDir !== 'all' && t.direction !== fDir) return false;
      return true;
    });
  }, [transactions, fStatus, fCat, fDir]);

  // Répartition par catégorie (réalisé + rapproché uniquement)
  const byCategory = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.status === 'prévu') continue;
      const key = (t.category || 'Sans catégorie') + '|' + t.direction;
      if (!map[key]) map[key] = { name: t.category || 'Sans catégorie', direction: t.direction, total: 0 };
      map[key].total += t.amount;
    }
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const openCreate = (dir) => { setEditing(null); setFormDir(dir); setShowForm(true); };
  const openEdit = (t) => { setEditing(t); setFormDir(t.direction); setShowForm(true); };

  const handleSave = async (payload) => {
    try {
      if (editing) await updateTransaction(editing.id, payload);
      else await createTransaction(payload);
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      console.error('Sauvegarde mouvement échouée', e);
      alert('Erreur lors de la sauvegarde du mouvement.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce mouvement ?')) return;
    try { await deleteTransaction(id); await load(); }
    catch (e) { console.error(e); }
  };

  const cycleStatus = async (t) => {
    const order = ['prévu', 'réalisé', 'rapproché'];
    const next = order[(order.indexOf(t.status) + 1) % order.length];
    try { await updateTransaction(t.id, { status: next }); await load(); }
    catch (e) { console.error(e); }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Chargement de la trésorerie…</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* En-tête + solde */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={22} color="#22c55e" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f1f5f9' }}>Trésorerie</h1>
          <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>Suivi des recettes et dépenses du club</p>
        </div>
      </div>

      {/* Cartes de stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Solde réel" value={fmt(agg.balance)} color={agg.balance >= 0 ? '#22c55e' : '#ef4444'} big icon={Wallet} />
        <StatCard label="Recettes réalisées" value={fmt(agg.totalIn)} color="#22c55e" icon={TrendingUp} />
        <StatCard label="Dépenses réalisées" value={fmt(agg.totalOut)} color="#ef4444" icon={TrendingDown} />
        <StatCard label="Solde projeté" value={fmt(agg.projectedBalance)} color="#38bdf8" icon={Link2}
          hint={(agg.pendingIn || agg.pendingOut) ? `+${fmt(agg.pendingIn)} / -${fmt(agg.pendingOut)} prévus` : null} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => openCreate('in')} style={btn('#22c55e')}>
          <ArrowDownCircle size={16} /> Recette
        </button>
        <button onClick={() => openCreate('out')} style={btn('#ef4444')}>
          <ArrowUpCircle size={16} /> Dépense
        </button>
        <button onClick={() => setShowCats(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Tag size={16} /> Catégories
        </button>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={14} color="#64748b" />
        <Select value={fDir} onChange={setFDir} options={[['all', 'Tous'], ['in', 'Recettes'], ['out', 'Dépenses']]} />
        <Select value={fStatus} onChange={setFStatus} options={[['all', 'Tous statuts'], ['prévu', 'Prévu'], ['réalisé', 'Réalisé'], ['rapproché', 'Rapproché']]} />
        <Select value={fCat} onChange={setFCat} options={[['all', 'Toutes catégories'], ...categories.map(c => [c.name, c.name])]} />
      </div>

      {/* Liste des mouvements */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
            Aucun mouvement. Ajoute une recette ou une dépense pour commencer.
          </div>
        )}
        {filtered.map(t => {
          const cat = categories.find(c => c.name === t.category);
          const st = STATUS_META[t.status] || STATUS_META['réalisé'];
          return (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: t.direction === 'in' ? '#22c55e' : '#ef4444' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>{t.description || (t.direction === 'in' ? 'Recette' : 'Dépense')}</span>
                  {t.sourceType === 'sponsor' && <span title="Issu d'un contrat sponsor" style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, background: 'rgba(250,204,21,0.12)', color: '#facc15', fontWeight: 700 }}>SPONSOR</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                  {t.category && <span style={{ fontSize: 11, color: cat?.color || '#94a3b8' }}>● {t.category}</span>}
                  <span style={{ fontSize: 11, color: '#64748b' }}>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>· {t.paymentMethod}</span>
                </div>
              </div>
              <button onClick={() => !t.virtual && cycleStatus(t)} title={t.virtual ? 'Géré dans la fiche sponsor' : 'Cliquer pour changer le statut'} style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, border: 'none', cursor: t.virtual ? 'default' : 'pointer' }}>
                {st.label}
              </button>
              <span style={{ fontSize: 15, fontWeight: 800, color: t.direction === 'in' ? '#22c55e' : '#ef4444', whiteSpace: 'nowrap' }}>
                {t.direction === 'in' ? '+' : '−'}{fmt(t.amount)}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {!t.virtual && <button onClick={() => openEdit(t)} style={iconBtn} title="Modifier"><Pencil size={14} color="#94a3b8" /></button>}
                {!t.virtual && <button onClick={() => handleDelete(t.id)} style={iconBtn} title="Supprimer"><Trash2 size={14} color="#fb7185" /></button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Répartition par catégorie */}
      {byCategory.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>Répartition par catégorie</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {byCategory.map((c, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: '#cbd5e1' }}>{c.name}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c.direction === 'in' ? '#22c55e' : '#ef4444' }}>
                  {c.direction === 'in' ? '+' : '−'}{fmt(c.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire (modal) */}
      {showCats && (
        <CategoryManager
          categories={categories}
          onClose={() => setShowCats(false)}
          onChanged={load}
        />
      )}
      {showForm && (
        <TransactionForm
          direction={formDir}
          editing={editing}
          categories={categories.filter(c => c.direction === formDir)}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ---- Sous-composants ----
function StatCard({ label, value, color, icon: Icon, big, hint }) {
  return (
    <div style={{ padding: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={14} color={color} />}
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: big ? 24 : 18, fontWeight: 800, color }}>{value}</div>
      {hint && <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>{hint}</div>}
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ padding: '7px 10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#cbd5e1', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function TransactionForm({ direction, editing, categories, onClose, onSave }) {
  const [date, setDate] = useState(editing?.date || new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(editing?.amount || '');
  const [category, setCategory] = useState(editing?.category || (categories[0]?.name || ''));
  const [paymentMethod, setPaymentMethod] = useState(editing?.paymentMethod || 'virement');
  const [description, setDescription] = useState(editing?.description || '');
  const [status, setStatus] = useState(editing?.status || 'réalisé');

  const submit = () => {
    if (!amount || parseFloat(amount) <= 0) { alert('Indique un montant.'); return; }
    onSave({ date, direction, amount: parseFloat(amount), category, paymentMethod, description, status });
  };

  const accent = direction === 'in' ? '#22c55e' : '#ef4444';
  const inputS = { width: '100%', padding: '10px 12px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };
  const lblS = { fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, display: 'block' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 22, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: accent }}>
            {editing ? 'Modifier' : (direction === 'in' ? 'Nouvelle recette' : 'Nouvelle dépense')}
          </h2>
          <button onClick={onClose} style={iconBtn}><X size={18} color="#94a3b8" /></button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={lblS}>Montant (€) *</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ ...inputS, fontSize: 18, fontWeight: 800, color: accent }} autoFocus />
          </div>
          <div>
            <label style={lblS}>Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={direction === 'in' ? 'Ex: Subvention mairie' : 'Ex: Jeu de maillots U13'} style={inputS} />
          </div>
          <div>
            <label style={lblS}>Catégorie</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputS}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lblS}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputS} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lblS}>Paiement</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={inputS}>
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lblS}>Statut</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(STATUS_META).map(([k, m]) => (
                <button key={k} onClick={() => setStatus(k)} style={{ flex: 1, padding: '8px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: status === k ? m.bg : 'transparent', border: `1px solid ${status === k ? m.color : 'rgba(255,255,255,0.1)'}`, color: status === k ? m.color : '#64748b' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <button onClick={submit} style={{ ...btn(accent), justifyContent: 'center', marginTop: 4 }}>
            <Check size={16} /> {editing ? 'Enregistrer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryManager({ categories, onClose, onChanged }) {
  const [newName, setNewName] = React.useState('');
  const [newDir, setNewDir] = React.useState('in');
  const recettes = categories.filter(c => c.direction === 'in');
  const depenses = categories.filter(c => c.direction === 'out');

  const add = async () => {
    if (!newName.trim()) return;
    try { await createCategory({ name: newName.trim(), direction: newDir, sortOrder: 99 }); setNewName(''); await onChanged(); }
    catch (e) { console.error(e); alert('Erreur (catégorie déjà existante ?)'); }
  };
  const remove = async (c) => {
    if (!confirm('Masquer la catégorie "' + c.name + '" ? Les mouvements existants la gardent.')) return;
    try { await deleteCategory(c.id); await onChanged(); } catch (e) { console.error(e); }
  };
  const rename = async (c) => {
    const name = prompt('Renommer la catégorie :', c.name);
    if (!name || !name.trim() || name === c.name) return;
    try { await updateCategory(c.id, { name: name.trim() }); await onChanged(); } catch (e) { console.error(e); }
  };

  const col = (title, list, accent) => (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 8 }}>{title}</div>
      {list.map(c => (
        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 4, background: c.color, flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 13, color: '#cbd5e1' }}>{c.name}</span>
          <button onClick={() => rename(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 12, padding: '0 4px' }} title="Renommer">✎</button>
          <button onClick={() => remove(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', fontSize: 15, padding: '0 4px' }} title="Masquer">×</button>
        </div>
      ))}
    </div>
  );

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 560, background: '#0a0e1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 22, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#f1f5f9' }}>Gérer les catégories</h2>
          <button onClick={onClose} style={iconBtn}><X size={18} color="#94a3b8" /></button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          <select value={newDir} onChange={(e) => setNewDir(e.target.value)} style={{ padding: '9px 11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#cbd5e1', fontSize: 13, fontFamily: 'inherit' }}>
            <option value="in">Recette</option>
            <option value="out">Dépense</option>
          </select>
          <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder="Nouvelle catégorie…" style={{ flex: 1, minWidth: 140, padding: '9px 11px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, fontFamily: 'inherit' }} />
          <button onClick={add} style={btn('#a3e635')}>Ajouter</button>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {col('RECETTES', recettes, '#22c55e')}
          {col('DÉPENSES', depenses, '#ef4444')}
        </div>
      </div>
    </div>
  );
}

const btn = (color) => ({ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: color, border: 'none', borderRadius: 10, color: '#0a0e1a', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' });
const iconBtn = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, cursor: 'pointer' };
