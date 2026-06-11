
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { motif, message, fromEmail, clubName } = await req.json();
    if (!message || !message.trim()) throw new Error('Message vide');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: 'FootPlanner <contact@footplanner.fr>',
        to: ['contact@footplanner.fr'],
        reply_to: fromEmail || undefined,
        subject: '[Contact] ' + (motif || 'Sans motif') + ' — ' + (clubName || fromEmail || 'Utilisateur'),
        html: '<p><strong>Motif :</strong> ' + (motif || '-') + '</p>'
          + '<p><strong>De :</strong> ' + (fromEmail || '-') + (clubName ? ' (' + clubName + ')' : '') + '</p>'
          + '<hr/><p>' + String(message).replace(/\n/g, '<br/>') + '</p>',
      }),
    });
    const data = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, data }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
