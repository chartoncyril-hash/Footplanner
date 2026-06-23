const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://cmldxjlbxtcfmhzfvnyd.supabase.co';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbGR4amxieHRjZm1oemZ2bnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyNTEyMiwiZXhwIjoyMDkzNDAxMTIyfQ.NZOBj5CB9_aCfrEoIXQe1Xku5VyDcSV3KfqZp6b2cbM';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const rest = (path: string) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
  }).then((r) => r.json());

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMs = new Date(todayStr + 'T00:00:00Z').getTime();

  const events = await rest(
    `club_events?select=*&date=gte.${todayStr}&status=neq.cancelled`
  );

  let sent = 0;
  for (const ev of events || []) {
    const sched = ev.reminder_schedule || {};
    const already: string[] = ev.reminders_sent || [];
    const diffDays = Math.round(
      (new Date(ev.date + 'T00:00:00Z').getTime() - todayMs) / 86400000
    );

    let palier: string | null = null;
    if (sched.j_minus_3 && diffDays === 3 && !already.includes('j_minus_3')) palier = 'j_minus_3';
    else if (sched.j_minus_1 && diffDays === 1 && !already.includes('j_minus_1')) palier = 'j_minus_1';
    if (!palier) continue;

    const resps = await rest(
      `event_responses?select=token,licencie_id&event_id=eq.${ev.id}&response=eq.pending`
    );

    if (Array.isArray(resps) && resps.length > 0) {
      const ids = resps.map((r: any) => r.licencie_id).join(',');
      const lics = await rest(
        `licencies?select=id,first_name,last_name,email&id=in.(${ids})`
      );
      const profArr = await rest(
        `profiles?select=club_name,club_color,club_logo_url&id=eq.${ev.owner_id}`
      );
      const prof = Array.isArray(profArr) ? profArr[0] : null;
      const eventDateFmt = new Date(ev.date).toLocaleDateString('fr-FR', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      });

      for (const r of resps) {
        const lic = (lics || []).find((l: any) => l.id === r.licencie_id);
        if (!lic?.email || !r.token) continue;
        await fetch(`${SUPABASE_URL}/functions/v1/send-event-email`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: lic.email,
            participant_name: `${lic.first_name} ${lic.last_name}`,
            event_title: ev.title,
            event_type: ev.type,
            event_date: eventDateFmt,
            event_time_start: ev.time_start || null,
            event_time_end: ev.time_end || null,
            event_location: ev.location || null,
            event_description: ev.description || null,
            club_name: prof?.club_name,
            club_color: prof?.club_color,
            club_logo_url: prof?.club_logo_url,
            response_url: `https://www.footplanner.fr/?event=${r.token}`,
            is_reminder: true,
          }),
        });
        sent++;
      }
    }

    await fetch(`${SUPABASE_URL}/rest/v1/club_events?id=eq.${ev.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ reminders_sent: [...already, palier] }),
    });
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
