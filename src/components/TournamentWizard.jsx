import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Calendar, MapPin, Users, GitBranch, Layers, Trophy, X } from 'lucide-react';
import { STANDARD_CATEGORIES } from '../utils/categoryHelpers';

const STEPS = [
  { id: 'basics',   label: 'Bases',      icon: Calendar },
  { id: 'format',   label: 'Format',     icon: GitBranch },
  { id: 'categories', label: 'Categories', icon: Layers },
  { id: 'recap',    label: 'Recap',      icon: Check },
];

export function TournamentWizard(props) {
  const onClose = props.onClose;
  const onCreate = props.onCreate;
  const onUpdate = props.onUpdate;
  const existingTournament = props.existingTournament;
  const isEditing = !!existingTournament;

  const [stepIdx, setStepIdx] = useState(0);
  const [data, setData] = useState(() => {
    if (existingTournament) {
      // Préremplir depuis le tournoi existant
      const t = existingTournament;
      const fieldsCount = Array.isArray(t.fields) ? t.fields.length : 2;
      return {
        name: t.name || '',
        date: t.date || new Date().toISOString().slice(0, 10),
        location: t.location || '',
        fields: fieldsCount,
        matchDurationMin: t.matchDuration || 12,
        pauseMin: t.breakBetweenMatches || 3,
        hasKnockout: t.hasKnockout !== false,
        hasThirdPlace: t.hasThirdPlace !== false,
        hasConsolation: t.hasConsolation === true,
        knockoutFields: Array.isArray(t.knockoutFields) ? t.knockoutFields : null,
        knockoutFormat: t.knockoutFormat || 'standard',
        qualifiedPerPool: t.knockoutFromTopN || 2,
        categories: Array.isArray(t.categories) ? t.categories : [],
        customCategory: '',
      };
    }
    return {
      name: '',
      date: new Date().toISOString().slice(0, 10),
      location: '',
      fields: 2,
      matchDurationMin: 12,
      pauseMin: 3,
      hasKnockout: true,
      hasConsolation: false,
      hasThirdPlace: true,
      knockoutFields: null,
      knockoutFormat: 'standard',
      qualifiedPerPool: 2,
      categories: [],
      customCategory: '',
    };
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const currentStep = STEPS[stepIdx];

  const update = (patch) => setData(prev => ({ ...prev, ...patch }));

  const canGoNext = () => {
    if (currentStep.id === 'basics') return !!(data.name.trim() && data.date);
    if (currentStep.id === 'format') return data.fields >= 1 && data.matchDurationMin >= 5;
    if (currentStep.id === 'categories') return data.categories.length > 0;
    return true;
  };

  const handleNext = () => {
    if (!canGoNext()) {
      setError('Merci de remplir les champs obligatoires.');
      return;
    }
    setError('');
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  };

  const handlePrev = () => {
    setError('');
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  const toggleCategory = (cat) => {
    setData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter(c => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const addCustomCategory = () => {
    const trimmed = data.customCategory.trim();
    if (!trimmed) return;
    if (data.categories.includes(trimmed)) {
      setError('Cette categorie existe deja.');
      return;
    }
    setData(prev => ({
      ...prev,
      categories: [...prev.categories, trimmed],
      customCategory: '',
    }));
    setError('');
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      const fieldsCount = parseInt(data.fields, 10);
      const fieldsArray = Array.from({ length: fieldsCount }, (_, i) => 'T' + (i + 1));

      const payload = {
        name: data.name.trim(),
        date: data.date,
        location: data.location.trim() || null,
        fields: fieldsArray,
        matchDuration: parseInt(data.matchDurationMin, 10),
        breakBetweenMatches: parseInt(data.pauseMin, 10),
        hasThirdPlace: data.hasKnockout && data.hasThirdPlace,
        hasKnockout: data.hasKnockout,
        hasThirdPlace: data.hasKnockout && data.hasThirdPlace,
        hasConsolation: data.hasKnockout && data.knockoutFormat !== 'multicup' && data.hasConsolation,
        knockoutFields: data.hasKnockout ? data.knockoutFields : null,
        knockoutFormat: data.hasKnockout ? data.knockoutFormat : 'standard',
        knockoutFromTopN: data.hasKnockout ? data.qualifiedPerPool : 0,
        categories: data.categories,
      };

      if (isEditing && onUpdate) {
        await onUpdate(payload);
      } else if (onCreate) {
        await onCreate(payload);
      }
    } catch (e) {
      console.error('Submit failed', e);
      setError(e.message || (isEditing ? 'Erreur lors de la mise a jour.' : 'Erreur lors de la creation.'));
      setSubmitting(false);
    }
  };

   return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, maxHeight: '90vh',
          background: '#0a0e1a',
          border: '1px solid rgba(34,211,238,0.25)',
          borderRadius: 16, padding: 24,
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'linear-gradient(135deg, #22d3ee, #67e8f9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(34,211,238,0.4)',
          }}>
            <Trophy size={18} color="#0a0e1a" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#f1f5f9', letterSpacing: 1 }}>
              {isEditing ? 'MODIFIER LE TOURNOI' : 'NOUVEAU TOURNOI'}
            </div>
            <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>
              Etape {stepIdx + 1} sur {STEPS.length} · {currentStep.label}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: 6, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 7, color: '#94a3b8',
              cursor: 'pointer', display: 'flex',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20 }}>
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              style={{
                flex: 1, height: 3,
                background: i <= stepIdx ? '#22d3ee' : 'rgba(255,255,255,0.08)',
                borderRadius: 2,
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 20 }}>
          {currentStep.id === 'basics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nom du tournoi *">
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Spring Cup 2026..."
                  autoFocus
                  style={inputStyle}
                />
              </Field>
              <Field label="Date *">
                <input
                  type="date"
                  value={data.date}
                  onChange={(e) => update({ date: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Lieu (optionnel)">
                <input
                  type="text"
                  value={data.location}
                  onChange={(e) => update({ location: e.target.value })}
                  placeholder="Stade des Marais, Bourg-en-Bresse..."
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {currentStep.id === 'format' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label="Nombre de terrains">
                <input
                  type="number"
                  min="1" max="10"
                  value={data.fields}
                  onChange={(e) => update({ fields: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Duree d'un match (minutes)">
                <input
                  type="number"
                  min="5" max="90"
                  value={data.matchDurationMin}
                  onChange={(e) => update({ matchDurationMin: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Pause entre matchs (minutes)">
                <input
                  type="number"
                  min="0" max="15"
                  value={data.pauseMin}
                  onChange={(e) => update({ pauseMin: e.target.value })}
                  style={inputStyle}
                />
              </Field>
              <Field label="Phase finale">
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => update({ hasKnockout: true })}
                    style={data.hasKnockout ? toggleActive : toggleInactive}
                  >
                    OUI (recommande)
                  </button>
                  <button
                    onClick={() => update({ hasKnockout: false })}
                    style={!data.hasKnockout ? toggleActive : toggleInactive}
                  >
                    NON
                  </button>
                </div>
              </Field>
              {data.hasKnockout && (
                <Field label="Petite finale (match 3e / 4e place)">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => update({ hasThirdPlace: true })}
                      style={data.hasThirdPlace ? toggleActive : toggleInactive}
                    >
                      OUI
                    </button>
                    <button
                      onClick={() => update({ hasThirdPlace: false })}
                      style={!data.hasThirdPlace ? toggleActive : toggleInactive}
                    >
                      NON
                    </button>
                  </div>
                </Field>
              )}
              {data.hasKnockout && data.knockoutFormat !== 'multicup' && (
                <Field label="Consolation (matchs 5e/6e et 7e/8e place)">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => update({ hasConsolation: true })}
                      style={data.hasConsolation ? toggleActive : toggleInactive}
                    >
                      OUI
                    </button>
                    <button
                      onClick={() => update({ hasConsolation: false })}
                      style={!data.hasConsolation ? toggleActive : toggleInactive}
                    >
                      NON
                    </button>
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, lineHeight: 1.4 }}>
                    Pour gros tournois (8+ qualifies). Les perdants des quarts s'affrontent pour le classement 5e a 8e.
                  </div>
                </Field>
              )}
              {data.hasKnockout && (
                <Field label="Terrains utilises en phase finale">
                  <div style={{ fontSize: 10, color: '#64748b', marginBottom: 6, lineHeight: 1.4 }}>
                    Decoche les terrains que tu veux liberer en phase finale (ex: pour tirs au but, echauffement).
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Array.from({ length: parseInt(data.fields, 10) || 0 }, (_, i) => 'T' + (i + 1)).map(t => {
                      // Si knockoutFields est null, tous les terrains sont actifs (defaut)
                      const isActive = data.knockoutFields === null || (data.knockoutFields || []).includes(t);
                      return (
                        <button
                          key={t}
                          onClick={() => {
                            const allFields = Array.from({ length: parseInt(data.fields, 10) || 0 }, (_, i) => 'T' + (i + 1));
                            const current = data.knockoutFields === null ? allFields : (data.knockoutFields || []);
                            const next = isActive
                              ? current.filter(f => f !== t)
                              : [...current, t];
                            // Si tous cochés, on remet null (defaut)
                            update({ knockoutFields: next.length === allFields.length ? null : next });
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
                </Field>
              )}
              {data.hasKnockout && (
                <Field label="Format de la phase finale">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { v: 'standard', l: 'Standard', d: '1er A vs 2e B / 1er B vs 2e A (croisement classique)' },
                      { v: 'crossed', l: 'Croisé', d: '1er A vs 2e A / 1er B vs 2e B (chaque poule garde ses équipes)' },
                      { v: 'multicup', l: 'Multi-cup (Coupe Or / Argent)', d: 'Coupes séparées : 1ers entre eux, 2es entre eux. Recommandé pour 16+ équipes.' },
                    ].map(opt => {
                      const isActive = data.knockoutFormat === opt.v;
                      // Multi-cup désactivé si moins de 16 équipes au total (on l'estime à partir du nombre de poules visées)
                      // Pour simplifier : on ne désactive pas dans le wizard (à la création on ne sait pas combien d'équipes)
                      return (
                        <button
                          key={opt.v}
                          onClick={() => update({ knockoutFormat: opt.v })}
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
                </Field>
              )}
              {data.hasKnockout && (
                <Field label="Qualifies par poule">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { v: 1, l: 'Le 1er de chaque poule' },
                      { v: 2, l: 'Les 2 premiers de chaque poule' },
                      { v: 3, l: 'Les 2 premiers + meilleurs 3emes' },
                    ].map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => update({ qualifiedPerPool: opt.v })}
                        style={{
                          padding: '10px 12px',
                          background: data.qualifiedPerPool === opt.v ? 'rgba(34,211,238,0.12)' : 'transparent',
                          border: data.qualifiedPerPool === opt.v ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 7,
                          color: data.qualifiedPerPool === opt.v ? '#22d3ee' : '#94a3b8',
                          fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        {opt.l}
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>
          )}

          {currentStep.id === 'categories' && (
            <div>
              <div style={{
                fontSize: 11, color: '#64748b', marginBottom: 12,
                lineHeight: 1.5,
              }}>
                Selectionne au moins une categorie d'age pour ton tournoi.
              </div>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                color: '#64748b', marginBottom: 8,
              }}>
                CATEGORIES STANDARD
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
                {STANDARD_CATEGORIES.map(cat => {
                  const isActive = data.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      style={{
                        padding: '6px 12px',
                        background: isActive ? 'rgba(167,139,250,0.15)' : 'transparent',
                        border: isActive ? '1px solid rgba(167,139,250,0.5)' : '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 7,
                        color: isActive ? '#a78bfa' : '#94a3b8',
                        fontSize: 12, fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {isActive ? '✓ ' : ''}{cat}
                    </button>
                  );
                })}
              </div>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                color: '#64748b', marginBottom: 8,
              }}>
                CATEGORIE PERSONNALISEE
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                <input
                  type="text"
                  value={data.customCategory}
                  onChange={(e) => update({ customCategory: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomCategory(); }}
                  placeholder="Ex: U11 Filles, Veterans..."
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={addCustomCategory}
                  style={{
                    padding: '8px 14px',
                    background: '#22d3ee', border: 'none',
                    borderRadius: 7, color: '#0a0e1a',
                    fontSize: 11, fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  AJOUTER
                </button>
              </div>
              {data.categories.length > 0 && (
                <div style={{
                  padding: 10,
                  background: 'rgba(167,139,250,0.06)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 8,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
                    color: '#a78bfa', marginBottom: 6,
                  }}>
                    SELECTIONNEES ({data.categories.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {data.categories.map(cat => (
                      <span
                        key={cat}
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(167,139,250,0.15)',
                          borderRadius: 5,
                          color: '#a78bfa',
                          fontSize: 11, fontWeight: 700,
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep.id === 'recap' && (
            <div>
              <div style={{
                fontSize: 11, color: '#64748b', marginBottom: 14,
                lineHeight: 1.5,
              }}>
                Verifie tes choix avant de creer le tournoi.
              </div>
              <RecapSection title="BASES">
                <RecapRow label="Nom" value={data.name} />
                <RecapRow label="Date" value={data.date} />
                {data.location && <RecapRow label="Lieu" value={data.location} />}
              </RecapSection>
              <RecapSection title="FORMAT">
                <RecapRow label="Terrains" value={data.fields} />
                <RecapRow label="Duree match" value={data.matchDurationMin + ' min'} />
                <RecapRow label="Pause" value={data.pauseMin + ' min'} />
                <RecapRow label="Phase finale" value={data.hasKnockout ? 'Oui' : 'Non'} />
                {data.hasKnockout && (
                  <>
                    <RecapRow label="Petite finale" value={data.hasThirdPlace ? 'Oui' : 'Non'} />
                    {data.knockoutFormat !== 'multicup' && (
                      <RecapRow label="Consolation 5-8" value={data.hasConsolation ? 'Oui' : 'Non'} />
                    )}
                    <RecapRow label="Terrains phase finale" value={
                      data.knockoutFields === null || data.knockoutFields.length === parseInt(data.fields, 10)
                        ? 'Tous'
                        : (data.knockoutFields || []).join(', ')
                    } />
                    <RecapRow label="Format phase finale" value={
                      data.knockoutFormat === 'crossed' ? 'Croisé' :
                      data.knockoutFormat === 'multicup' ? 'Champions / Europa League' :
                      'Standard'
                    } />
                    <RecapRow label="Qualifies" value={
                      data.qualifiedPerPool === 1 ? '1er de chaque poule' :
                      data.qualifiedPerPool === 2 ? '2 premiers' :
                      '2 premiers + meilleurs 3emes'
                    } />
                  </>
                )}
              </RecapSection>
              <RecapSection title="CATEGORIES">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                  {data.categories.map(cat => (
                    <span
                      key={cat}
                      style={{
                        padding: '3px 8px',
                        background: 'rgba(167,139,250,0.15)',
                        borderRadius: 5,
                        color: '#a78bfa',
                        fontSize: 11, fontWeight: 700,
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </RecapSection>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: '8px 12px', marginBottom: 12,
            background: 'rgba(251,113,133,0.1)',
            border: '1px solid rgba(251,113,133,0.3)',
            borderRadius: 7, color: '#fb7185',
            fontSize: 11,
          }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handlePrev}
            disabled={stepIdx === 0}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: stepIdx === 0 ? '#475569' : '#94a3b8',
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronLeft size={13} /> PRECEDENT
          </button>
          <div style={{ flex: 1 }} />
          {stepIdx < STEPS.length - 1 ? (
            <button
              onClick={handleNext}
              style={{
                padding: '10px 18px',
                background: '#22d3ee', border: 'none',
                borderRadius: 8, color: '#0a0e1a',
                fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              SUIVANT <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 22px',
                background: submitting ? 'rgba(34,211,238,0.3)' : '#22d3ee',
                border: 'none',
                borderRadius: 8, color: '#0a0e1a',
                fontSize: 12, fontWeight: 800, letterSpacing: 1,
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {submitting
                ? (isEditing ? 'ENREGISTREMENT...' : 'CREATION...')
                : (isEditing ? 'ENREGISTRER' : 'CREER LE TOURNOI')
              } <Check size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
        color: '#64748b', marginBottom: 6,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function RecapSection({ title, children }) {
  return (
    <div style={{
      marginBottom: 14,
      padding: 12,
      background: 'rgba(15,23,42,0.5)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 8,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 1.5,
        color: '#22d3ee', marginBottom: 8,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function RecapRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{value}</span>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: '#0f172a',
  border: '1px solid rgba(34,211,238,0.25)',
  borderRadius: 8, color: '#f1f5f9',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

const toggleActive = {
  flex: 1, padding: '10px',
  background: 'rgba(34,211,238,0.12)',
  border: '1px solid rgba(34,211,238,0.4)',
  borderRadius: 7,
  color: '#22d3ee',
  fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
  cursor: 'pointer',
};

const toggleInactive = {
  flex: 1, padding: '10px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 7,
  color: '#94a3b8',
  fontSize: 11, fontWeight: 800, letterSpacing: 0.5,
  cursor: 'pointer',
}; 