const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// send-stage-email
// Types : confirmation | approval | payment_link | rejection | announcement | opening
// ============================================================

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const {
    type,           // 'confirmation'|'approval'|'rejection'|'announcement'|'opening'
    email,          // destinataire
    participant_name,
    stage_name,
    stage_date_start,
    stage_date_end,
    stage_location,
    stage_price,
    payment_info,
    club_name,
    club_color,
    club_logo_url,
    stage_url,      // lien inscription publique
    opening_date,   // pour annonce : date d'ouverture
    rejection_reason,
  } = await req.json();

  const accent = club_color || '#f97316';

  const header = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#060a12;color:#f1f5f9;border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,${accent}33 0%,#060a12 60%);padding:28px 32px;border-bottom:1px solid ${accent}22;display:flex;align-items:center;gap:14px;">
      ${club_logo_url ? `<img src="${club_logo_url}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;" />` : `<div style="width:44px;height:44px;border-radius:10px;background:${accent}33;display:flex;align-items:center;justify-content:center;font-size:22px;">🏕️</div>`}
      <div>
        <div style="font-weight:800;font-size:16px;color:#f1f5f9;">${club_name || 'FootPlanner'}</div>
        <div style="font-size:12px;color:#64748b;">Stage de football</div>
      </div>
    </div>
    <div style="padding:32px;">
  `;
  const footer = `
    </div>
    <div style="padding:16px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
      <p style="color:#475569;font-size:11px;margin:0;">FootPlanner · Gestion de clubs et tournois de football</p>
    </div>
    </div>
  `;

  const stageInfo = `
    <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:16px 20px;margin:16px 0;">
      <div style="font-weight:800;font-size:15px;color:#f1f5f9;margin-bottom:8px;">🏕️ ${stage_name}</div>
      ${stage_date_start ? `<div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">📅 ${stage_date_start}${stage_date_end ? ` → ${stage_date_end}` : ''}</div>` : ''}
      ${stage_location ? `<div style="font-size:13px;color:#94a3b8;">📍 ${stage_location}</div>` : ''}
    </div>
  `;

  let subject = '';
  let html = '';

  // ── CONFIRMATION ──────────────────────────────────────────
  if (type === 'confirmation') {
    subject = `Inscription reçue — ${stage_name}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Demande d'inscription reçue ✅</h2>
      <p style="color:#94a3b8;line-height:1.7;margin-bottom:4px;">Bonjour <strong style="color:#f1f5f9;">${participant_name}</strong>,</p>
      <p style="color:#94a3b8;line-height:1.7;">Votre demande d'inscription a bien été reçue. Le club va l'examiner et vous informer de la suite.</p>
      ${stageInfo}
      <p style="color:#64748b;font-size:13px;margin-top:16px;">Vous recevrez un email de confirmation dès que votre inscription sera validée.</p>
    ` + footer;
  }

  // ── APPROBATION ───────────────────────────────────────────
  else if (type === 'approval') {
    subject = `Inscription validée — ${stage_name}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Inscription validée 🎉</h2>
      <p style="color:#94a3b8;line-height:1.7;">Bonjour <strong style="color:#f1f5f9;">${participant_name}</strong>,</p>
      <p style="color:#94a3b8;line-height:1.7;">Bonne nouvelle ! Votre inscription au stage a été <strong style="color:#34d399;">validée</strong> par le club.</p>
      ${stageInfo}
      ${stage_price > 0 && payment_info ? `
        <div style="background:rgba(249,115,22,0.08);border:1px solid rgba(249,115,22,0.25);border-radius:10px;padding:16px 20px;margin:16px 0;">
          <div style="font-weight:800;font-size:14px;color:#f97316;margin-bottom:6px;">💳 Paiement — ${stage_price}€</div>
          <div style="font-size:13px;color:#94a3b8;white-space:pre-line;">${payment_info}</div>
        </div>
      ` : ''}
      <p style="color:#64748b;font-size:13px;">Une confirmation définitive vous sera envoyée dès réception du paiement.</p>
    ` + footer;
  }

  // ── RELANCE ───────────────────────────────────────────────
  else if (type === 'reminder') {
    subject = `Rappel — Plus que ${days_left} jour${days_left > 1 ? 's' : ''} pour s'inscrire — ${stage_name}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">⏰ Plus que ${days_left} jour${days_left > 1 ? 's' : ''} !</h2>
      <p style="color:#94a3b8;line-height:1.7;">Bonjour <strong style="color:#f1f5f9;">${participant_name}</strong>,</p>
      <p style="color:#94a3b8;line-height:1.7;">Les inscriptions au stage <strong style="color:#f1f5f9;">${stage_name}</strong> se terminent dans <strong style="color:${accent};">${days_left} jour${days_left > 1 ? 's' : ''}</strong>.</p>
      ${stageInfo}
      ${registration_close ? `<div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.25);border-radius:10px;padding:12px 16px;margin:16px 0;text-align:center;">
        <p style="color:#f59e0b;font-weight:800;font-size:14px;margin:0;">⏰ Clôture le ${registration_close}</p>
      </div>` : ''}
      <div style="text-align:center;margin:28px 0;">
        <a href="${stage_url}" style="display:inline-block;padding:16px 36px;background:${accent};color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;">
          S'inscrire maintenant →
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;">Ne tardez plus, les places sont limitées !</p>
    ` + footer;
  }

  // ── REJET ─────────────────────────────────────────────────
  else if (type === 'rejection') {
    subject = `Inscription non retenue — ${stage_name}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Inscription non retenue</h2>
      <p style="color:#94a3b8;line-height:1.7;">Bonjour <strong style="color:#f1f5f9;">${participant_name}</strong>,</p>
      <p style="color:#94a3b8;line-height:1.7;">Nous avons le regret de vous informer que votre inscription au stage n'a pas pu être retenue.</p>
      ${stageInfo}
      ${rejection_reason ? `<div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.2);border-radius:10px;padding:14px 18px;margin:16px 0;font-size:13px;color:#94a3b8;">${rejection_reason}</div>` : ''}
      <p style="color:#64748b;font-size:13px;">N'hésitez pas à contacter le club pour plus d'informations.</p>
    ` + footer;
  }

  // ── ANNONCE (inscriptions pas encore ouvertes) ─────────────
  else if (type === 'announcement') {
    subject = `À venir — ${stage_name} · Inscriptions le ${opening_date}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Un stage arrive bientôt ! 🏕️</h2>
      <p style="color:#94a3b8;line-height:1.7;">Le club <strong style="color:#f1f5f9;">${club_name}</strong> organise un stage de football.</p>
      ${stageInfo}
      <div style="background:${accent}15;border:1px solid ${accent}33;border-radius:10px;padding:16px 20px;margin:16px 0;text-align:center;">
        <div style="font-size:13px;color:#94a3b8;margin-bottom:6px;">📅 Inscriptions ouvertes à partir du</div>
        <div style="font-size:18px;font-weight:900;color:${accent};">${opening_date}</div>
      </div>
      ${is_priority ? `<div style="background:rgba(129,140,248,0.1);border:1px solid rgba(129,140,248,0.3);border-radius:10px;padding:12px 16px;margin:16px 0;text-align:center;">
        <p style="color:#818cf8;font-weight:800;font-size:13px;margin:0;">⭐ En tant que licencié, vous bénéficiez d'un accès prioritaire !</p>
      </div>` : ''}
      ${registration_close ? `<p style="color:#f59e0b;font-size:13px;text-align:center;">⏰ Date limite d'inscription : ${registration_close}</p>` : ''}
      <div style="text-align:center;margin:24px 0;">
        <a href="${stage_url}" style="display:inline-block;padding:14px 28px;background:${accent};color:#fff;text-decoration:none;border-radius:10px;font-weight:800;font-size:15px;">
          ${is_priority ? 'Accéder en priorité →' : 'Voir le stage →'}
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;">Le lien s'ouvrira automatiquement à la date d'inscription.</p>
    ` + footer;
  }

  // ── OUVERTURE (inscriptions maintenant ouvertes) ───────────
  else if (type === 'opening') {
    subject = `Les inscriptions sont ouvertes — ${stage_name}`;
    html = header + `
      <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;">Les inscriptions sont ouvertes ! 🚀</h2>
      <p style="color:#94a3b8;line-height:1.7;">Le club <strong style="color:#f1f5f9;">${club_name}</strong> ouvre les inscriptions pour son stage de football.</p>
      ${stageInfo}
      ${stage_price > 0 ? `<p style="color:#94a3b8;font-size:14px;">Tarif : <strong style="color:${accent};">${stage_price}€</strong> par participant</p>` : '<p style="color:#34d399;font-size:14px;font-weight:700;">Stage gratuit ✓</p>'}
      <div style="text-align:center;margin:28px 0;">
        <a href="${stage_url}" style="display:inline-block;padding:16px 36px;background:${accent};color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;">
          S'inscrire maintenant →
        </a>
      </div>
      <p style="color:#64748b;font-size:12px;text-align:center;">Places limitées — inscrivez-vous rapidement !</p>
    ` + footer;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'FootPlanner <contact@footplanner.fr>',
      to: email,
      subject,
      html,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
