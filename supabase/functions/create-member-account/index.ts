const SUPABASE_URL = 'https://cmldxjlbxtcfmhzfvnyd.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbGR4amxieHRjZm1oemZ2bnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyNTEyMiwiZXhwIjoyMDkzNDAxMTIyfQ.NZOBj5CB9_aCfrEoIXQe1Xku5VyDcSV3KfqZp6b2cbM';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { email, password, token } = await req.json();

  // 1. Créer ou récupérer le compte via Admin API
  const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true, // confirme automatiquement l'email
    }),
  });

  const userData = await createRes.json();

  if (!createRes.ok && !userData.id) {
    // Compte existe déjà — essayer de mettre à jour le mot de passe
    if (userData.msg?.includes('already been registered') || createRes.status === 422) {
      // Chercher l'user existant
      const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'apikey': SERVICE_ROLE_KEY,
        },
      });
      const listData = await listRes.json();
      const existingUser = listData.users?.[0];

      if (existingUser) {
        // Mettre à jour le mot de passe
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({ password, email_confirm: true }),
        });

        // Mettre à jour club_members
        await fetch(`${SUPABASE_URL}/rest/v1/club_members?invite_token=eq.${token}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ status: 'active', user_id: existingUser.id }),
        });

        return new Response(JSON.stringify({ success: true, user_id: existingUser.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ error: userData }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userId = userData.id;

  // 2. Mettre à jour club_members avec user_id
  await fetch(`${SUPABASE_URL}/rest/v1/club_members?invite_token=eq.${token}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ status: 'active', user_id: userId }),
  });

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
