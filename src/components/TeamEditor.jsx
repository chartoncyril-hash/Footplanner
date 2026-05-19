import React, { useState } from 'react';
import { X, Plus, Trash2, Crown, Save } from 'lucide-react';
import { FieldText } from './form/Fields';
import { styles } from '../styles/styles';

const TEAM_COLORS = [
  '#22d3ee', '#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa',
  '#fb7185', '#facc15', '#2dd4bf', '#fb923c', '#c084fc', '#4ade80',
];

// ============================================================
// TeamEditor — modal plein écran d'édition d'équipe
// ============================================================
export function TeamEditor({
  team, existingPools, defaultCategory, onSave, onDelete, onCancel,
}) {
  const [name, setName] = useState(team?.name || '');
  const [short, setShort] = useState(team?.short || '');
  const [level, setLevel] = useState(team?.level || 1);
  const [pool, setPool] = useState(team?.pool || existingPools[0] || 'A');
  const [color, setColor] = useState(team?.color || TEAM_COLORS[0]);
  const [category, setCategory] = useState(team?.category || defaultCategory || 'U11');
  const [logo, setLogo] = useState(team?.logo || null);
  const [isHost, setIsHost] = useState(team?.isHost || false);
  const [customPool, setCustomPool] = useState(false);
  const [newPool, setNewPool] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [saving, setSaving] = useState(false);

  const finalPool = customPool ? newPool.toUpperCase().trim() : pool;
  const valid = name.trim() && short.trim() && finalPool;

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Le fichier doit être une image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image trop lourde (max 5 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // Crop carré centré, redimensionne à 200x200
        const size = 200;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
        setLogo(canvas.toDataURL('image/png', 0.85));
      };
      img.onerror = () => setUploadError("Impossible de lire l'image.");
      img.src = ev.target.result;
    };
    reader.onerror = () => setUploadError('Erreur de lecture du fichier.');
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!valid || saving) return;
    setSaving(true);
    try {
      await onSave({
        id: team?.id,
        name: name.trim(),
        short: short.trim().toUpperCase(),
        pool: finalPool,
        color,
        logo,
        category,
        isHost,
        level,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.fullscreenSheet}>
      <div style={styles.sheetHead}>
        <button onClick={onCancel} style={styles.sheetBack}>
          <X size={18} />
        </button>
        <span style={styles.sheetTitle}>{team ? 'Modifier équipe' : 'Nouvelle équipe'}</span>
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          style={{ ...styles.sheetSave, opacity: (valid && !saving) ? 1 : 0.35 }}
        >
          {saving ? '…' : (team ? 'ENREGISTRER' : 'CRÉER')}
        </button>
      </div>

      <div style={styles.sheetBody}>
        {/* Aperçu écusson */}
        <div style={styles.previewCrest}>
          <div
            style={{
              ...styles.bigCrest,
              background: color + '22',
              borderColor: color + '66',
              color,
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {logo
              ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span>{(short || '??').slice(0, 2).toUpperCase()}</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', marginTop: 8 }}>
            {name || "Nom de l'équipe"}
          </div>
        </div>

        {/* Logo */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Logo de l'équipe (optionnel)</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={{ ...styles.btnSecondary, flex: 1, padding: '10px', cursor: 'pointer', justifyContent: 'center' }}>
              <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <Plus size={13} /> {logo ? 'Changer le logo' : 'Choisir une image'}
            </label>
            {logo && (
              <button onClick={() => setLogo(null)} style={styles.btnDangerSmall}>
                <Trash2 size={13} />
              </button>
            )}
          </div>
          {uploadError && <span style={styles.fieldError}>{uploadError}</span>}
          {!uploadError && (
            <span style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
              Recadré en carré, redimensionné à 200×200 max.
            </span>
          )}
        </div>

        <FieldText label="Nom complet" value={name} onChange={setName} placeholder="Ex : AS Vallée" />

        {/* Niveau */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Equipe dans le club</span>
          <div style={styles.levelGrid}>
            {[
              { v: 1, l: 'Equipe 1' },
              { v: 2, l: 'Equipe 2' },
              { v: 3, l: 'Equipe 3' },
            ].map(opt => (
              <button
                key={opt.v}
                onClick={() => setLevel(opt.v)}
                style={{
                  ...styles.levelBtn,
                  borderColor: level === opt.v ? color : '#1e293b',
                  background: level === opt.v ? color + '15' : 'transparent',
                  color: level === opt.v ? color : '#94a3b8',
                }}
              >
                {opt.l}
              </button>
            ))}
          </div>
          <span style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
            Pour distinguer plusieurs équipes d'un même club (ex : Paris 1, Paris 2).
          </span>
        </div>

        <FieldText
          label="Abréviation (3 lettres)"
          value={short}
          onChange={(v) => setShort(v.slice(0, 3))}
          placeholder="ASV"
        />

        {/* Toggle équipe hôte */}
        <div style={{ ...styles.bonusRow, borderColor: isHost ? '#facc1555' : '#1e293b' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...styles.bonusLabel, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Crown size={13} color={isHost ? '#facc15' : '#94a3b8'} /> Équipe hôte
            </div>
            <div style={styles.bonusDesc}>
              Active si c'est l'équipe du club organisateur du tournoi.
            </div>
          </div>
          <button
            onClick={() => setIsHost(!isHost)}
            style={{ ...styles.switch, background: isHost ? '#facc15' : '#334155' }}
          >
            <div style={{ ...styles.switchKnob, transform: isHost ? 'translateX(16px)' : 'translateX(0)' }} />
          </button>
        </div>

        {/* Poule */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Poule</span>
          {!customPool ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <select
                value={pool}
                onChange={(e) => setPool(e.target.value)}
                style={{ ...styles.input, flex: 1 }}
              >
                {existingPools.length === 0 && <option value="A">A</option>}
                {existingPools.map(p => <option key={p} value={p}>Poule {p}</option>)}
              </select>
              <button
                onClick={() => { setCustomPool(true); setNewPool(''); }}
                style={styles.btnSmall}
              >
                <Plus size={12} /> Nouvelle
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={newPool}
                onChange={(e) => setNewPool(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="Ex : C"
                style={{ ...styles.input, flex: 1 }}
                autoFocus
              />
              <button onClick={() => setCustomPool(false)} style={styles.btnSmall}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Couleur */}
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Couleur</span>
          <div style={styles.colorGrid}>
            {TEAM_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  ...styles.colorSwatch,
                  background: c + '22',
                  borderColor: color === c ? c : c + '33',
                  boxShadow: color === c ? `0 0 0 2px ${c}` : 'none',
                }}
              >
                <div style={{ width: 16, height: 16, borderRadius: 4, background: c }} />
              </button>
            ))}
          </div>
        </div>

        {/* Bouton de secours en bas */}
        <button
          onClick={handleSave}
          disabled={!valid || saving}
          style={{ ...styles.btnPrimary, marginTop: 8, opacity: (valid && !saving) ? 1 : 0.4 }}
        >
          <Save size={14} /> {saving ? 'Enregistrement…' : (team ? 'ENREGISTRER LES MODIFICATIONS' : "CRÉER L'ÉQUIPE")}
        </button>

        {onDelete && (
          <button onClick={onDelete} style={{ ...styles.btnDanger, marginTop: 4 }}>
            <Trash2 size={14} /> Supprimer cette équipe
          </button>
        )}
      </div>
    </div>
  );
}
