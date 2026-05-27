const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

Deno.serve(async (req) => {
  const payload = await req.json()
  const record = payload.record

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'FootPlanner <onboarding@resend.dev>',
      to: 'chartoncyril@gmail.com',
      subject: 'Nouvel inscrit FootPlanner',
      html: `<p><b>Nouveau compte :</b></p><p>Prenom : ${record.first_name || '-'}</p><p>Nom : ${record.last_name || '-'}</p><p>Club : ${record.club_name || '-'}</p><p>Email : ${record.email || '-'}</p>`,
    }),
  })

  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
