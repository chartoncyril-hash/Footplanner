const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const {
    email, participant_name, event_title, event_type,
    event_date, event_time_start, event_time_end,
    event_location, event_description,
    club_name, club_color, club_logo_url,
    response_url, survey_title,
    type, cancellation_reason,
  } = await req.json();

  const accent = club_color || '#f472b6';
  const EVENT_EMOJIS: Record<string, string> = {
    training:'⚽', match:'🏆', tournament:'🥇', stage:'🏕️', meeting:'📋', other:'📌'
  };
  const emoji = EVENT_EMOJIS[event_type] || '📌';

  // Template annulation
  if (type === 'cancellation') {
    const cancelHtml = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#060a12;color:#f1f5f9;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,rgba(251,113,133,0.2) 0%,#060a12 60%);padding:24px 28px;border-bottom:1px solid rgba(251,113,133,0.2);display:flex;align-items:center;gap:14px;">
        ${club_logo_url ? `<img src="${club_logo_url}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;" />` : `<div style="width:44px;height:44px;border-radius:10px;background:rgba(251,113,133,0.2);display:flex;align-items:center;justify-content:center;font-size:22px;">${emoji}</div>`}
        <div>
          <div style="font-weight:800;font-size:16px;color:#f1f5f9;">${club_name || 'FootPlanner'}</div>
          <div style="font-size:12px;color:#fb7185;">Événement annulé</div>
        </div>
      </div>
      <div style="padding:28px;">
        <p style="font-size:16px;font-weight:600;color:#f1f5f9;margin:0 0 16px;">Bonjour ${participant_name} 👋</p>
        <div style="background:rgba(251,113,133,0.08);border:1px solid rgba(251,113,133,0.25);border-radius:12px;padding:18px;margin-bottom:20px;">
          <div style="font-size:24px;margin-bottom:8px;">❌</div>
          <div style="font-size:18px;font-weight:900;color:#fb7185;margin-bottom:8px;">${event_title} — Annulé</div>
          ${event_date ? `<div style="font-size:13px;color:#94a3b8;">📅 ${event_date}${event_time_start ? ` à ${event_time_start}` : ''}</div>` : ''}
          ${event_location ? `<div style="font-size:13px;color:#94a3b8;margin-top:4px;">📍 ${event_location}</div>` : ''}
        </div>
        ${cancellation_reason ? `
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:10px;padding:14px 18px;margin-bottom:20px;">
          <p style="color:#f59e0b;font-weight:700;font-size:13px;margin:0 0 4px;">Motif</p>
          <p style="color:#94a3b8;font-size:13px;margin:0;">${cancellation_reason}</p>
        </div>` : ''}
        <p style="font-size:13px;color:#64748b;text-align:center;">Nous vous tiendrons informés pour la suite.</p>
      </div>
      <div style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#334155;font-size:11px;margin:0;">FootPlanner · Gestion de clubs de football</p>
      </div>
    </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FootPlanner <contact@footplanner.fr>',
        to: email,
        subject: `❌ Annulé — ${event_title}`,
        html: cancelHtml,
      }),
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#060a12;color:#f1f5f9;border-radius:16px;overflow:hidden;">
      <!-- Header club -->
      <div style="background:linear-gradient(135deg,${accent}33 0%,#060a12 60%);padding:24px 28px;border-bottom:1px solid ${accent}22;display:flex;align-items:center;gap:14px;">
        ${club_logo_url ? `<img src="${club_logo_url}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;" />` : `<div style="width:44px;height:44px;border-radius:10px;background:${accent}33;display:flex;align-items:center;justify-content:center;font-size:22px;">${emoji}</div>`}
        <div>
          <div style="font-weight:800;font-size:16px;color:#f1f5f9;">${club_name || 'FootPlanner'}</div>
          <div style="font-size:12px;color:#64748b;">Invitation</div>
        </div>
      </div>
      <!-- Corps -->
      <div style="padding:28px;">
        <p style="font-size:16px;font-weight:600;color:#f1f5f9;margin:0 0 16px;">Bonjour ${participant_name} ! 👋</p>
        <!-- Événement -->
        <div style="background:rgba(255,255,255,0.04);border:1px solid ${accent}33;border-radius:12px;padding:18px;margin-bottom:20px;">
          <div style="font-size:28px;margin-bottom:8px;">${emoji}</div>
          <div style="font-size:18px;font-weight:900;color:#f1f5f9;margin-bottom:10px;">${event_title}</div>
          ${event_date ? `<div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">📅 ${event_date}${event_time_start ? ` à ${event_time_start}` : ''}${event_time_end ? ` → ${event_time_end}` : ''}</div>` : ''}
          ${event_location ? `<div style="font-size:13px;color:#94a3b8;margin-bottom:4px;">📍 ${event_location}</div>` : ''}
          ${event_description ? `<div style="font-size:13px;color:#64748b;margin-top:10px;line-height:1.6;">${event_description}</div>` : ''}
        </div>
        <p style="font-size:14px;color:#94a3b8;margin-bottom:20px;">
          Merci de confirmer ta présence en cliquant sur le bouton ci-dessous.
          ${survey_title ? `<br/><br/>📊 <strong style="color:#818cf8;">${survey_title}</strong> — réponds aussi au sondage !` : ''}
        </p>
        <!-- CTA -->
        <div style="text-align:center;margin:24px 0;">
          <a href="${response_url}" style="display:inline-block;padding:16px 36px;background:${accent};color:#fff;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;">
            Confirmer ma présence →
          </a>
        </div>
        <p style="font-size:11px;color:#334155;text-align:center;margin-top:20px;">
          Lien personnel — ne pas partager
        </p>
      </div>
      <div style="padding:14px 28px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
        <p style="color:#334155;font-size:11px;margin:0;">FootPlanner · Gestion de clubs de football</p>
      </div>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'FootPlanner <contact@footplanner.fr>',
      to: email,
      subject: `${emoji} ${event_title} — Confirme ta présence`,
      html,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
