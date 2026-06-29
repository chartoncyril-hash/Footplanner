import React, { useState, useEffect, useCallback } from 'react';
import {
  listSponsorPayments, createSponsorPayment, updateSponsorPayment, deleteSponsorPayment,
} from '../services/financeService';

const fmt = (n) => (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €';

export function SponsorPayments({ sponsorId, contractAmount }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newAmount, setNewAmount] = useState('');
  const [newDue, setNewDue] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try { setPayments(await listSponsorPayments(sponsorId)); }
    catch (e) { console.error('Chargement échéances échoué', e); }
    finally { setLoading(false); }
  }, [sponsorId]);

  useEffect(() => { if (sponsorId) load(); }, [sponsorId, load]);

  const total = payments.reduce((s, p) => s + p.amount, 0);
  const totalPaid = payments.filter(p => p.paidAt).reduce((s, p) => s + p.amount, 0);
  const contract = parseFloat(contractAmount) || 0;
  const remaining = contract - total;

  const addPayment = async () => {
    if (!newAmount || parseFloat(newAmount) <= 0) { alert('Indique un montant.'); return; }
    try {
      await createSponsorPayment({ sponsorId, amount: parseFloat(newAmount), dueDate: newDue || null, label: newLabel || null });
      setNewAmount(''); setNewDue(''); setNewLabel(''); setAdding(false);
      await load();
    } catch (e) { console.error(e); alert('Erreur lors de l\'ajout.'); }
  };

  const togglePaid = async (p) => {
    try {
      await updateSponsorPayment(p.id, { paidAt: p.paidAt ? null : new Date().toISOString().slice(0, 10) });
      await load();
    } catch (e) { console.error(e); }
  };

  const setPaidDate = async (p, date) => {
    try { await updateSponsorPayment(p.id, { paidAt: date || null }); await load(); }
    catch (e) { console.error(e); }
  };

  const remove = async (id) => {
    if (!confirm('Supprimer cette échéance ?')) return;
    try { await deleteSponsorPayment(id); await load(); }
    catch (e) { console.error(e); }
  };

  const lbl = { fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 4, display: 'block' };
  const inp = { padding: '8px 10px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' };

  return (
    <div style={{ marginTop: 8, marginBottom: 16, padding: 14, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#22c55e' }}>💶 Échéances de paiement</span>
        {contract > 0 && (
          <span style={{ fontSize: 11, color: remaining === 0 ? '#22c55e' : (remaining < 0 ? '#ef4444' : '#94a3b8') }}>
            {fmt(total)} / {fmt(contract)} planifié{remaining > 0 ? ` · reste ${fmt(remaining)}` : (remaining < 0 ? ' · dépassé !' : ' ✓')}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: '#64748b' }}>Chargement…</div>
      ) : (
        <>
          {payments.length === 0 && !adding && (
            <div style={{ fontSize: 12, color: '#64748b', padding: '6px 0' }}>Aucune échéance. Ajoute l'acompte, le solde, etc.</div>
          )}
          {payments.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <button onClick={() => togglePaid(p)} title={p.paidAt ? 'Marquer non payé' : 'Marquer payé'} style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer', border: `1px solid ${p.paidAt ? '#22c55e' : 'rgba(255,255,255,0.2)'}`, background: p.paidAt ? '#22c55e' : 'transparent', color: '#0a0e1a', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {p.paidAt ? '✓' : ''}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{p.label || 'Versement'} · {fmt(p.amount)}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  {p.paidAt
                    ? <span style={{ color: '#22c55e' }}>Payé le {new Date(p.paidAt).toLocaleDateString('fr-FR')}</span>
                    : (p.dueDate ? `Échéance : ${new Date(p.dueDate).toLocaleDateString('fr-FR')}` : 'Pas de date prévue')}
                </div>
              </div>
              {!p.paidAt && (
                <input type="date" value={p.dueDate || ''} onChange={(e) => setPaidDate(p, null) || updateSponsorPayment(p.id, { dueDate: e.target.value }).then(load)} style={{ ...inp, padding: '5px 7px', fontSize: 11 }} title="Date d'échéance prévue" />
              )}
              <button onClick={() => remove(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb7185', fontSize: 16, padding: '0 4px' }} title="Supprimer">×</button>
            </div>
          ))}

          {adding ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 90px' }}>
                <label style={lbl}>Montant €</label>
                <input type="number" min="0" step="0.01" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={{ ...inp, width: '100%' }} autoFocus />
              </div>
              <div style={{ flex: '1 1 110px' }}>
                <label style={lbl}>Libellé</label>
                <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="Acompte / Solde" style={{ ...inp, width: '100%' }} />
              </div>
              <div style={{ flex: '1 1 120px' }}>
                <label style={lbl}>Échéance prévue</label>
                <input type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} style={{ ...inp, width: '100%' }} />
              </div>
              <button onClick={addPayment} style={{ padding: '8px 14px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#0a0e1a', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>Ajouter</button>
              <button onClick={() => setAdding(false)} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Annuler</button>
            </div>
          ) : (
            <button onClick={() => setAdding(true)} style={{ marginTop: 10, padding: '8px 14px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, color: '#22c55e', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Ajouter une échéance
            </button>
          )}

          {payments.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: '#64748b' }}>
              Encaissé : <span style={{ color: '#22c55e', fontWeight: 700 }}>{fmt(totalPaid)}</span> · En attente : <span style={{ color: '#f59e0b', fontWeight: 700 }}>{fmt(total - totalPaid)}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
