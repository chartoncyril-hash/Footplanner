import React, { useState } from 'react';
import {
  MinusCircle, PlusCircle, Plus, Trash2, X, MapPin, Award,
} from 'lucide-react';
import { FieldText } from './form/Fields';
import { styles } from '../styles/styles';

// ============================================================
// SettingsParts — sous-composants des réglages
// Regroupés ici pour limiter le nombre de fichiers
// ============================================================

// Switch on/off avec stepper de points (ex bonus fair-play)
export function BonusToggle({ label, desc, enabled, points, onToggle, onPoints }) {
  return (
    <div style={{ ...styles.bonusRow, borderColor: enabled ? '#facc1555' : '#1e293b' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={styles.bonusLabel}>{label}</div>
        <div style={styles.bonusDesc}>{desc}</div>
      </div>
      {enabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button onClick={() => onPoints(Math.max(0, points - 1))} style={styles.epBtn}>
            <MinusCircle size={12} />
          </button>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#facc15', minWidth: 22, textAlign: 'center' }}>
            +{points}
          </span>
          <button onClick={() => onPoints(points + 1)} style={styles.epBtn}>
            <PlusCircle size={12} />
          </button>
        </div>
      )}
      <button
        onClick={() => onToggle(!enabled)}
        style={{ ...styles.switch, background: enabled ? '#facc15' : '#334155' }}
      >
        <div style={{ ...styles.switchKnob, transform: enabled ? 'translateX(16px)' : 'translateX(0)' }} />
      </button>
    </div>
  );
}

// Toggle classement par catégorie (U7/U9 par défaut OFF)
export function RankingByCategory({ rankings, categories, onChange }) {
  const list = (Array.isArray(categories) && categories.length > 0)
    ? categories
    : ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'Senior'];
  const toggle = (cat) => {
    const current = rankings[cat] !== false;
    onChange({ ...rankings, [cat]: !current });
  };
  return (
    <div style={styles.rankingGrid}>
      {list.map(cat => {
        const enabled = rankings[cat] !== false;
        const isActive = false;
        return (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            style={{
              ...styles.rankingChip,
              borderColor: isActive
                ? (enabled ? '#22d3ee' : '#fb7185')
                : enabled ? 'rgba(52,211,153,0.3)' : 'rgba(251,113,133,0.2)',
              background: enabled ? 'rgba(52,211,153,0.06)' : 'rgba(251,113,133,0.04)',
            }}
          >
            <span
              style={{
                fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                color: isActive ? '#22d3ee' : enabled ? '#34d399' : '#94a3b8',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {cat}
            </span>
            <div style={{ ...styles.rankingDot, background: enabled ? '#34d399' : '#fb7185' }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: enabled ? '#34d399' : '#fb7185', letterSpacing: 0.5 }}>
              {enabled ? 'ON' : 'OFF'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Durées par catégorie
export function CategoryDurations({ durations, categories, onChange }) {
  const list = (Array.isArray(categories) && categories.length > 0)
    ? categories
    : ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'Senior'];
  const update = (cat, val) => {
    onChange({ ...durations, [cat]: parseInt(val) || 0 });
  };
  return (
    <div style={styles.field}>
      <span style={styles.fieldLabel}>Durée des matchs (min) par catégorie</span>
      <div style={styles.durationsList}>
        {list.map(cat => {
          const isActive = false;
          return (
            <div
              key={cat}
              style={{
                ...styles.durationRow,
                borderColor: isActive ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)',
                background: isActive ? 'rgba(34,211,238,0.06)' : 'rgba(0,0,0,0.2)',
              }}
            >
              <span style={{ ...styles.durationCat, color: isActive ? '#22d3ee' : '#cbd5e1' }}>
                {cat}
              </span>
              <div style={styles.durationStepper}>
                <button
                  onClick={() => update(cat, Math.max(1, (durations[cat] || 10) - 1))}
                  style={styles.epBtn}
                >
                  <MinusCircle size={14} />
                </button>
                <input
                  type="number"
                  value={durations[cat] || ''}
                  onChange={(e) => update(cat, e.target.value)}
                  style={styles.durationInput}
                />
                <button
                  onClick={() => update(cat, (durations[cat] || 10) + 1)}
                  style={styles.epBtn}
                >
                  <PlusCircle size={14} />
                </button>
                <span style={styles.durationUnit}>min</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Toggle phase finale + nombre d'équipes qualifiées par poule
export function KnockoutToggle({ 
  enabled, onToggle, 
  topN, onTopN,
  hasThirdPlace, onThirdPlace,
  hasConsolation, onConsolation,
  knockoutFormat, onKnockoutFormat,
  knockoutFields, onKnockoutFields,
  tournamentFields,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ ...styles.bonusRow, borderColor: enabled ? '#f59e0b55' : '#1e293b' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.bonusLabel}>Activer la phase finale</div>
          <div style={styles.bonusDesc}>
            Élimination directe après les poules. Désactive pour terminer sur les phases de poule (catégories jeunes).
          </div>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          style={{ ...styles.switch, background: enabled ? '#f59e0b' : '#334155' }}
        >
          <div style={{ ...styles.switchKnob, transform: enabled ? 'translateX(16px)' : 'translateX(0)' }} />
        </button>
      </div>
      {enabled && (
        <div style={styles.field}>
          <span style={styles.fieldLabel}>Équipes qualifiées par poule</span>
          <div style={styles.qualifyGrid}>
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => onTopN(n)}
                style={{
                  ...styles.qualifyBtn,
                  borderColor: topN === n ? '#f59e0b' : '#1e293b',
                  background: topN === n ? 'rgba(245,158,11,0.1)' : 'transparent',
                  color: topN === n ? '#f59e0b' : '#94a3b8',
                }}
              >
                {n === 1 ? '1er' : n + ' premiers'}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#64748b', marginTop: 6 }}>
                      Les <strong>{topN === 1 ? 'premiers' : `${topN} premiers`}</strong> de chaque poule passent en phase finale. La taille du tableau (8e, quarts…) est calculée automatiquement.
                    </div>

                    {/* Toggle Petite finale */}
                    <div style={{ ...styles.field, marginTop: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={styles.fieldLabel}>Petite finale (3e/4e place)</span>
                        <button
                          onClick={() => onThirdPlace(!hasThirdPlace)}
                          style={{ ...styles.switch, background: hasThirdPlace ? '#f59e0b' : '#334155' }}
                        >
                          <div style={{ ...styles.switchKnob, transform: hasThirdPlace ? 'translateX(16px)' : 'translateX(0)' }} />
                        </button>
                      </div>
                      <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                        Match opposant les 2 perdants des demi-finales.
                      </div>
                    </div>

                    {/* Toggle Consolation (uniquement si pas multicup) */}
                    {knockoutFormat !== 'multicup' && (
                      <div style={{ ...styles.field, marginTop: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={styles.fieldLabel}>Consolation (5e a 8e place)</span>
                          <button
                            onClick={() => onConsolation(!hasConsolation)}
                            style={{ ...styles.switch, background: hasConsolation ? '#f59e0b' : '#334155' }}
                          >
                            <div style={{ ...styles.switchKnob, transform: hasConsolation ? 'translateX(16px)' : 'translateX(0)' }} />
                          </button>
                        </div>
                        <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                          Pour gros tournois (8+ qualifies). Les perdants des quarts s'affrontent pour le classement.
                        </div>
                      </div>
                    )}

                    {/* Format phase finale */}
                    <div style={{ ...styles.field, marginTop: 12 }}>
                      <span style={styles.fieldLabel}>Format de la phase finale</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                        {[
                          { v: 'standard', l: 'Standard', d: '1er A vs 2e B / 1er B vs 2e A (croisement classique)' },
                          { v: 'crossed', l: 'Croisé', d: '1er A vs 2e A / 1er B vs 2e B (chaque poule garde ses équipes)' },
                          { v: 'multicup', l: 'Champions / Europa League', d: 'Deux coupes séparées : les 1ers dans Champions, les 2es dans Europa. Recommandé pour 16+ équipes.' },
                        ].map(opt => {
                          const isActive = (knockoutFormat || 'standard') === opt.v;
                          return (
                            <button
                              key={opt.v}
                              onClick={() => onKnockoutFormat(opt.v)}
                              style={{
                                padding: '10px 12px',
                                background: isActive ? 'rgba(34,211,238,0.12)' : 'transparent',
                                border: isActive ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 7,
                                color: isActive ? '#22d3ee' : '#94a3b8',
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'left',
                              }}
                            >
                              <div style={{ marginBottom: 2 }}>{opt.l}</div>
                              <div style={{ fontSize: 10, fontWeight: 500, color: '#64748b', lineHeight: 1.4 }}>
                                {opt.d}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Terrains de phase finale */}
                    {Array.isArray(tournamentFields) && tournamentFields.length > 0 && (
                      <div style={{ ...styles.field, marginTop: 12 }}>
                        <span style={styles.fieldLabel}>Terrains utilisés en phase finale</span>
                        <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, lineHeight: 1.4 }}>
                          Décoche les terrains à libérer en phase finale (ex: pour tirs au but, échauffement).
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {tournamentFields.map(t => {
                            const isActive = knockoutFields === null || !Array.isArray(knockoutFields) || knockoutFields.includes(t);
                            return (
                              <button
                                key={t}
                                onClick={() => {
                                  const current = (knockoutFields === null || !Array.isArray(knockoutFields))
                                    ? [...tournamentFields]
                                    : [...knockoutFields];
                                  const next = isActive
                                    ? current.filter(f => f !== t)
                                    : [...current, t];
                                  // Si tous cochés, on remet null (defaut)
                                  onKnockoutFields(next.length === tournamentFields.length ? null : next);
                                }}
                                style={{
                                  padding: '6px 12px',
                                  background: isActive ? 'rgba(34,211,238,0.12)' : 'transparent',
                                  border: isActive ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: 7,
                                  color: isActive ? '#22d3ee' : '#64748b',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}
                              >
                                {isActive ? '✓ ' : ''}{t}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

// Liste éditable des terrains
export function FieldsEditor({ fields, onChange }) {
  const [newField, setNewField] = useState('');
  const add = () => {
    const v = newField.trim().toUpperCase();
    if (!v || fields.includes(v)) return;
    onChange([...fields, v]);
    setNewField('');
  };
  const remove = (f) => {
    if (fields.length <= 1) return;
    onChange(fields.filter(x => x !== f));
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={styles.fieldsGrid}>
        {fields.map(f => (
          <div key={f} style={styles.fieldEditChip}>
            <MapPin size={11} color="#34d399" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', flex: 1 }}>{f}</span>
            {fields.length > 1 && (
              <button onClick={() => remove(f)} style={styles.fieldEditRemove}>
                <X size={11} />
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={newField}
          onChange={(e) => setNewField(e.target.value.toUpperCase().slice(0, 8))}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Ex : T5 ou TERRAIN A"
          style={{ ...styles.input, flex: 1 }}
        />
        <button
          onClick={add}
          disabled={!newField.trim()}
          style={{ ...styles.btnSmall, opacity: newField.trim() ? 1 : 0.4 }}
        >
          <Plus size={12} /> AJOUTER
        </button>
      </div>
    </div>
  );
}

// Stepper de points (gagné, nul, perdu)
export function ScoringInput({ label, value, color, onChange }) {
  return (
    <div style={styles.scoringTile}>
      <div style={styles.scoringLabel}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button onClick={() => onChange(Math.max(0, value - 1))} style={styles.epBtn}>
          <MinusCircle size={14} />
        </button>
        <span style={{ fontSize: 22, fontWeight: 800, color, minWidth: 28, textAlign: 'center' }}>
          {value}
        </span>
        <button onClick={() => onChange(value + 1)} style={styles.epBtn}>
          <PlusCircle size={14} />
        </button>
      </div>
      <div style={styles.scoringPts}>PTS</div>
    </div>
  );
}

// ============================================================
// AnnouncementsManager — diffuser des annonces orga
// ============================================================
export function AnnouncementsManager({ announcements, onAdd, onRemove }) {
  const [text, setText] = useState('');
  const [type, setType] = useState('info');
  const [submitting, setSubmitting] = useState(false);

  const types = [
    { id: 'info', label: 'Info', color: '#22d3ee' },
    { id: 'success', label: 'Bon plan', color: '#34d399' },
    { id: 'warning', label: 'Attention', color: '#f59e0b' },
    { id: 'urgent', label: 'Urgent', color: '#fb7185' },
  ];

  const send = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ message: text.trim(), type });
      setText('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={styles.field}>
        <span style={styles.fieldLabel}>Type</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {types.map(t => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              style={{
                flex: 1,
                padding: '8px 6px',
                background: type === t.id ? t.color + '15' : 'rgba(15,23,42,0.5)',
                border: `1px solid ${type === t.id ? t.color : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6,
                fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                color: type === t.id ? t.color : '#64748b',
              }}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.field}>
        <span style={styles.fieldLabel}>Message</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          placeholder="Ex : Remise des prix à 17h sur le terrain principal — venez nombreux !"
          style={{ ...styles.input, minHeight: 60, resize: 'vertical', fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>{text.length}/200</span>
      </div>

      <button
        onClick={send}
        disabled={!text.trim() || submitting}
        style={{ ...styles.btnPrimary, opacity: (text.trim() && !submitting) ? 1 : 0.4 }}
      >
        <Plus size={14} /> {submitting ? 'Diffusion…' : "DIFFUSER L'ANNONCE"}
      </button>

      {announcements.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#64748b', marginTop: 6 }}>
            ANNONCES ACTIVES ({announcements.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {announcements.map(a => {
              const t = types.find(x => x.id === a.type) || types[0];
              return (
                <div key={a.id} style={{ ...styles.annListItem, borderColor: t.color + '44' }}>
                  <div style={{ ...styles.annListType, color: t.color, background: t.color + '15' }}>
                    {t.label}
                  </div>
                  <span style={styles.annListMsg}>{a.message}</span>
                  <button onClick={() => onRemove(a.id)} style={styles.btnDangerSmall}>
                    <Trash2 size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// SponsorsManager — gestion sponsors avec bibliothèque
// ============================================================
export function SponsorsManager({
  sponsors, library,
  onAdd, onRemove, onImport, onRemoveLibrary,
}) {
  const [name, setName] = useState('');
  const [logo, setLogo] = useState(null);
  const [showLib, setShowLib] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogo = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Le fichier doit être une image.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setUploadError('Image trop lourde (max 3 Mo).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const maxH = 60;
        const ratio = img.width / img.height;
        const canvas = document.createElement('canvas');
        canvas.height = maxH;
        canvas.width = Math.round(maxH * ratio);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setLogo(canvas.toDataURL('image/png', 0.85));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onAdd({ name: name.trim(), logo });
      setName('');
      setLogo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const availableInLib = (library || []).filter(s =>
    !sponsors.find(cur => cur.name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FieldText label="Nom du sponsor" value={name} onChange={setName} placeholder="Ex : Boulangerie du Pont" />

      <div style={styles.field}>
        <span style={styles.fieldLabel}>Logo (optionnel, redimensionné en 60px de haut)</span>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <label style={{ ...styles.btnSecondary, flex: 1, padding: '10px', cursor: 'pointer', justifyContent: 'center' }}>
            <input type="file" accept="image/*" onChange={handleLogo} style={{ display: 'none' }} />
            <Plus size={13} /> {logo ? 'Changer' : 'Choisir'}
          </label>
          {logo && (
            <>
              <img src={logo} alt="" style={{ height: 30, background: '#fff', padding: 4, borderRadius: 4 }} />
              <button onClick={() => setLogo(null)} style={styles.btnDangerSmall}>
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
        {uploadError && <span style={styles.fieldError}>{uploadError}</span>}
      </div>

      <button
        onClick={submit}
        disabled={!name.trim() || submitting}
        style={{ ...styles.btnPrimary, opacity: (name.trim() && !submitting) ? 1 : 0.4 }}
      >
        <Plus size={14} /> {submitting ? 'Ajout…' : 'AJOUTER LE SPONSOR'}
      </button>

      {availableInLib.length > 0 && (
        <button onClick={() => setShowLib(!showLib)} style={styles.btnSecondary}>
          <Award size={14} /> {showLib ? 'Masquer' : 'Réutiliser'} la bibliothèque ({availableInLib.length})
        </button>
      )}

      {showLib && availableInLib.length > 0 && (
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            padding: 10,
            background: 'rgba(167,139,250,0.06)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 8,
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#a78bfa', marginBottom: 4 }}>
            SPONSORS DÉJÀ ENREGISTRÉS
          </div>
          {availableInLib.map(s => (
            <div
              key={s.libraryId}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px',
                background: 'rgba(15,23,42,0.5)',
                borderRadius: 6,
              }}
            >
              {s.logo && <img src={s.logo} alt="" style={{ height: 18, background: '#fff', padding: 2, borderRadius: 3 }} />}
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: '#cbd5e1' }}>{s.name}</span>
              <button onClick={() => onImport(s.libraryId)} style={{ ...styles.btnSmall, padding: '5px 8px' }}>
                <Plus size={11} />
              </button>
              <button onClick={() => onRemoveLibrary(s.libraryId)} style={{ ...styles.btnDangerSmall, width: 24, height: 24 }}>
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {sponsors.length > 0 && (
        <>
          <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: '#64748b', marginTop: 6 }}>
            DANS CE TOURNOI ({sponsors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {sponsors.map(s => (
              <div
                key={s.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                }}
              >
                {s.logo && <img src={s.logo} alt="" style={{ height: 22, background: '#fff', padding: 3, borderRadius: 4 }} />}
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: '#f1f5f9' }}>{s.name}</span>
                <button onClick={() => onRemove(s.id)} style={styles.btnDangerSmall}>
                  <Trash2 size={11} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
