import React from 'react';
import { FileCheck, AlertTriangle, XCircle, Pencil, Trash2, FileText, ChevronDown } from 'lucide-react';

// ============================================================
// LicencieListItem — une ligne (desktop) / carte (mobile) de licencié
// Hiérarchie d'info : 1) conformité docs  2) équipe/catégorie  3) statut
// ============================================================

const TYPES_DOCS = ['Licence', 'Certificat médical', 'Assurance', "Pièce d'identité", 'Autorisation parentale'];

const STATUS_META = {
  actif:    { label: 'Actif',    color: '#34d399', dot: '#34d399' },
  inactif:  { label: 'Inactif',  color: '#64748b', dot: '#64748b' },
  suspendu: { label: 'Suspendu', color: '#fb7185', dot: '#fb7185' },
};

function initials(l) {
  return ((l.first_name?.[0] || '') + (l.last_name?.[0] || '')).toUpperCase();
}

// Barre de conformité : vert (complet) / orange (partiel) / rouge (rien)
function ConformityBar({ conformes, total }) {
  const pct = total > 0 ? (conformes / total) * 100 : 0;
  const color = conformes === total ? '#34d399' : conformes > 0 ? '#f59e0b' : '#fb7185';
  const Icon = conformes === total ? FileCheck : conformes > 0 ? AlertTriangle : XCircle;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <Icon size={15} color={color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 44, maxWidth: 90, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
        {conformes}/{total}
      </span>
    </div>
  );
}

export function LicencieListItem({
  licencie: l, docs, isMobile, isExpanded, isSelected,
  onToggleSelect, onToggleExpand, onEdit, onDelete, children,
}) {
  const licDocs = docs.filter((d) => d.licencie_id === l.id);
  const conformes = TYPES_DOCS.filter((type) =>
    licDocs.find((d) => d.type === type && d.statut === 'conforme')
  ).length;
  const total = TYPES_DOCS.length;
  const status = STATUS_META[l.status] || STATUS_META.actif;

  const avatar = l.photo_url ? (
    <img src={l.photo_url} alt="" style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  ) : (
    <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#a3e635', flexShrink: 0 }}>
      {initials(l)}
    </div>
  );

  const catBadge = l.category && (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(163,230,53,0.12)', color: '#a3e635' }}>{l.category}</span>
  );
  const teamBadge = l.team && (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(129,140,248,0.12)', color: '#818cf8' }}>{l.team}</span>
  );
  const statusDot = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: status.color }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot }} /> {status.label}
    </span>
  );

  // ───────────── MOBILE : carte ─────────────
  if (isMobile) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 14, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input type="checkbox" checked={isSelected} onChange={onToggleSelect} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#a3e635', flexShrink: 0 }} />
          {avatar}
          <div style={{ flex: 1, minWidth: 0 }} onClick={onToggleExpand}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {l.first_name} {l.last_name}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {catBadge}{teamBadge}{statusDot}
            </div>
          </div>
        </div>
        {/* Conformité en bas, pleine largeur */}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <ConformityBar conformes={conformes} total={total} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={onToggleExpand} style={btnIcon('#94a3b8')}><FileText size={15} /></button>
            <button onClick={onEdit} style={btnIcon('#94a3b8')}><Pencil size={15} /></button>
            <button onClick={onDelete} style={btnIcon('#fb7185')}><Trash2 size={15} /></button>
          </div>
        </div>
        {isExpanded && <div style={{ marginTop: 12 }}>{children}</div>}
      </div>
    );
  }

  // ───────────── DESKTOP : ligne tableau ─────────────
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${isExpanded ? 'rgba(163,230,53,0.25)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 12, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 42px 1fr 150px 120px 44px 44px 44px', alignItems: 'center', gap: 12, padding: '10px 14px' }}>
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect} style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#a3e635' }} />
        {avatar}
        {/* Nom + sous-ligne identité */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {l.first_name} {l.last_name}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', display: 'flex', gap: 10, marginTop: 2 }}>
            {l.licence_number && <span>🪪 {l.licence_number}</span>}
            {l.phone && <span>📞 {l.phone}</span>}
          </div>
        </div>
        {/* Conformité (priorité 1) */}
        <ConformityBar conformes={conformes} total={total} />
        {/* Équipe/catégorie + statut (priorité 2 & 3) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{catBadge}{teamBadge}</div>
          {statusDot}
        </div>
        <button onClick={onToggleExpand} title="Documents" style={btnIcon('#94a3b8')}><FileText size={15} /></button>
        <button onClick={onEdit} title="Modifier" style={btnIcon('#94a3b8')}><Pencil size={15} /></button>
        <button onClick={onDelete} title="Supprimer" style={btnIcon('#fb7185')}><Trash2 size={15} /></button>
      </div>
      {isExpanded && <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>{children}</div>}
    </div>
  );
}

function btnIcon(color) {
  return {
    width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)', color, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  };
}

// En-tête de colonnes (desktop uniquement)
export function LicencieListHeader() {
  const cell = { fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '28px 42px 1fr 150px 120px 44px 44px 44px', alignItems: 'center', gap: 12, padding: '6px 14px 10px' }}>
      <span />
      <span />
      <span style={cell}>Licencié</span>
      <span style={cell}>Conformité</span>
      <span style={cell}>Équipe / Statut</span>
      <span /><span /><span />
    </div>
  );
}