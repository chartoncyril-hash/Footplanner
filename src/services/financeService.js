import { supabase } from '../lib/supabase';
import { getEffectiveOwnerId } from '../lib/effectiveUser';

// ============================================================
// financeService — Socle trésorerie
// Mouvements (finance_transactions) + catégories (finance_categories)
// ============================================================

function txFromDb(r) {
  return {
    id: r.id,
    ownerId: r.owner_id,
    date: r.date,
    direction: r.direction,            // 'in' | 'out'
    amount: parseFloat(r.amount) || 0,
    category: r.category,
    paymentMethod: r.payment_method,
    description: r.description,
    status: r.status,                  // 'prévu' | 'réalisé' | 'rapproché'
    account: r.account,
    sourceType: r.source_type,
    sourceId: r.source_id,
    createdAt: r.created_at,
  };
}

function txToDb(t, ownerId) {
  const out = {};
  if (ownerId !== undefined) out.owner_id = ownerId;
  if (t.date !== undefined) out.date = t.date;
  if (t.direction !== undefined) out.direction = t.direction;
  if (t.amount !== undefined) out.amount = Math.abs(parseFloat(t.amount) || 0);
  if (t.category !== undefined) out.category = t.category;
  if (t.paymentMethod !== undefined) out.payment_method = t.paymentMethod;
  if (t.description !== undefined) out.description = t.description;
  if (t.status !== undefined) out.status = t.status;
  if (t.account !== undefined) out.account = t.account;
  if (t.sourceType !== undefined) out.source_type = t.sourceType;
  if (t.sourceId !== undefined) out.source_id = t.sourceId;
  return out;
}

function catFromDb(r) {
  return {
    id: r.id,
    ownerId: r.owner_id,
    name: r.name,
    direction: r.direction,
    sortOrder: r.sort_order,
    active: r.active,
    color: r.color,
  };
}

// ---- MOUVEMENTS ----
export async function listTransactions() {
  const ownerId = await getEffectiveOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('finance_transactions')
    .select('*')
    .eq('owner_id', ownerId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(txFromDb);
}

export async function createTransaction(t) {
  const ownerId = await getEffectiveOwnerId();
  const { data, error } = await supabase
    .from('finance_transactions')
    .insert(txToDb(t, ownerId))
    .select()
    .single();
  if (error) throw error;
  return txFromDb(data);
}

export async function updateTransaction(id, patch) {
  const { data, error } = await supabase
    .from('finance_transactions')
    .update(txToDb(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return txFromDb(data);
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('finance_transactions')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ---- CATÉGORIES ----
export async function listCategories() {
  const ownerId = await getEffectiveOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('finance_categories')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('active', true)
    .order('direction', { ascending: true })
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data || []).map(catFromDb);
}

export async function createCategory(c) {
  const ownerId = await getEffectiveOwnerId();
  const { data, error } = await supabase
    .from('finance_categories')
    .insert({ owner_id: ownerId, name: c.name, direction: c.direction, sort_order: c.sortOrder || 0, color: c.color || '#64748b' })
    .select()
    .single();
  if (error) throw error;
  return catFromDb(data);
}

export async function deleteCategory(id) {
  const { error } = await supabase
    .from('finance_categories')
    .update({ active: false })
    .eq('id', id);
  if (error) throw error;
}

// ---- AGRÉGATS (calculés côté client à partir des mouvements) ----
export function computeBalance(transactions) {
  // Solde réel = entrées (réalisé+rapproché) - sorties (réalisé+rapproché)
  let inReal = 0, outReal = 0, inPrev = 0, outPrev = 0;
  for (const t of transactions) {
    const real = t.status === 'réalisé' || t.status === 'rapproché';
    if (t.direction === 'in') { real ? inReal += t.amount : inPrev += t.amount; }
    else { real ? outReal += t.amount : outPrev += t.amount; }
  }
  return {
    balance: inReal - outReal,            // solde réel
    totalIn: inReal,
    totalOut: outReal,
    pendingIn: inPrev,                     // prévus non encore réalisés
    pendingOut: outPrev,
    projectedBalance: (inReal + inPrev) - (outReal + outPrev), // solde projeté
  };
}

// ============================================================
// ÉCHÉANCES SPONSORS (sponsor_payments)
// ============================================================
function payFromDb(r) {
  return {
    id: r.id,
    ownerId: r.owner_id,
    sponsorId: r.sponsor_id,
    amount: parseFloat(r.amount) || 0,
    dueDate: r.due_date,
    paidAt: r.paid_at,
    label: r.label,
    createdAt: r.created_at,
  };
}

export async function listSponsorPayments(sponsorId) {
  const { data, error } = await supabase
    .from('sponsor_payments')
    .select('*')
    .eq('sponsor_id', sponsorId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(payFromDb);
}

export async function createSponsorPayment(p) {
  const ownerId = await getEffectiveOwnerId();
  const { data, error } = await supabase
    .from('sponsor_payments')
    .insert({ owner_id: ownerId, sponsor_id: p.sponsorId, amount: Math.abs(parseFloat(p.amount) || 0), due_date: p.dueDate || null, paid_at: p.paidAt || null, label: p.label || null })
    .select()
    .single();
  if (error) throw error;
  return payFromDb(data);
}

export async function updateSponsorPayment(id, patch) {
  const out = {};
  if (patch.amount !== undefined) out.amount = Math.abs(parseFloat(patch.amount) || 0);
  if (patch.dueDate !== undefined) out.due_date = patch.dueDate || null;
  if (patch.paidAt !== undefined) out.paid_at = patch.paidAt || null;
  if (patch.label !== undefined) out.label = patch.label || null;
  const { data, error } = await supabase
    .from('sponsor_payments')
    .update(out)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return payFromDb(data);
}

export async function deleteSponsorPayment(id) {
  const { error } = await supabase.from('sponsor_payments').delete().eq('id', id);
  if (error) throw error;
}

// Toutes les échéances du club (pour la trésorerie)
export async function listAllSponsorPayments() {
  const ownerId = await getEffectiveOwnerId();
  if (!ownerId) return [];
  const { data, error } = await supabase
    .from('sponsor_payments')
    .select('*, sponsor_library(name, status)')
    .eq('owner_id', ownerId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data || []).map(r => ({ ...payFromDb(r), sponsorName: r.sponsor_library?.name, sponsorStatus: r.sponsor_library?.status }));
}
