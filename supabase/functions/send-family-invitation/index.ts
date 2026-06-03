const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { email, token, licencie_name, club_name } = await req.json();

  const inviteUrl = `https://www.footplanner.fr/?invitation=${token}`;

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#060a12;color:#f1f5f9;padding:40px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="color:#a3e635;font-size:28px;margin:0;">FOOT<span style="color:#f1f5f9;">PLANNER</span></h1>
      </div>
      <h2 style="font-size:20px;margin-bottom:12px;">Invitation espace famille</h2>
      <p style="color:#94a3b8;line-height:1.7;">
        <strong style="color:#f1f5f9;">${club_name}</strong> vous invite à rejoindre l'espace famille de 
        <strong style="color:#a3e635;">${licencie_name}</strong> sur FootPlanner.
      </p>
      <p style="color:#94a3b8;line-height:1.7;">
        Créez votre compte pour accéder aux documents, suivre les convocations et rester informé.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${inviteUrl}" style="display:inline-block;padding:14px 32px;background:#a3e635;color:#060a12;text-decoration:none;border-radius:10px;font-weight:800;font-size:16px;">
          Créer mon espace famille →
        </a>
      </div>
      <p style="color:#475569;font-size:12px;text-align:center;">
        Ce lien est valable 7 jours. Si vous n'êtes pas concerné, ignorez cet email.
      </p>
    </div>
  `;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
    body: JSON.stringify({
      from: 'FootPlanner <contact@footplanner.fr>',
      to: email,
      subject: `Invitation espace famille — ${licencie_name}`,
      html,
    }),
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), { 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
});