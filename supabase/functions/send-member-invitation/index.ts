const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://cmldxjlbxtcfmhzfvnyd.supabase.co';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { email, first_name, last_name, role, club_name, club_color, club_logo_url, invite_token } = await req.json();

  const activationUrl = `https://www.footplanner.fr/?member=${invite_token}`;
  const accent = club_color || '#a3e635';

  const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrateur',
    assistant: 'Assistant coach',
    secretary: 'Secrétaire',
    volunteer: 'Bénévole',
  };

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;background:#060a12;color:#f1f5f9;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,${accent}33 0%,#060a12 60%);padding:24px 28px;border-bottom:1px solid ${accent}22;display:flex;align-items:center;gap:14px;">
        ${club_logo_url ? `<img src="${club_logo_url}" style="width:44px;height:44px;border-radius:10px;object-fit:cover;" />` : `<div style="width:44px;height:44px;border-radius:10px;background:${accent}33;display:flex;align-items:center;justify-content:center;font-size:22px;">⚽</div>`}
        <div>
          <div style="font-weight:800;font-size:16px;color:#f1f5f9;">${club_name || 'FootPlanner'}</div>
          <div style="font-size:12px;color:#64748b;">Invitation à rejoindre l'équipe</div>
        </div>
      </div>
      <div style="padding:28px;">
        <h2 style="font-size:20px;font-weight:800;margin:0 0 8px;color:#f1f5f9;">Bienvenue ${first_name} ! 👋</h2>
        <p style="color:#94a3b8;line-height:1.7;margin-bottom:4px;">
          <strong style="color:#f1f5f9;">${club_name}</strong> vous invite à rejoindre FootPlanner en tant que <strong style="color:${accent};">${ROLE_LABELS[role] || role}</strong>.
        </p>
        <p style="color:#94a3b8;line-height:1.7;">
          Cliquez sur le bouton ci-dessous pour créer votre mot de passe et accéder à votre espace.
        </p>
        <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:14px 18px;margin:20px 0;">
          <div style="font-size:13px;color:#64748b;margin-bottom:4px;">Votre email de connexion</div>
          <div style="font-size:15px;font-weight:700;color:#f1f5f9;">${email}</div>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${activationUrl}" style="display:inline-block;padding:16px 36px;background:${accent};color:#060a12;text-decoration:none;border-radius:12px;font-weight:800;font-size:16px;">
            Créer mon mot de passe →
          </a>
        </div>
        <p style="color:#475569;font-size:12px;text-align:center;">
          Ce lien est valable 7 jours. Si vous n'êtes pas concerné, ignorez cet email.
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
      subject: `Invitation FootPlanner — ${club_name}`,
      html,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
