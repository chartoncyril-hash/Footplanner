const SUPABASE_URL = 'https://cmldxjlbxtcfmhzfvnyd.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbGR4amxieHRjZm1oemZ2bnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyNTEyMiwiZXhwIjoyMDkzNDAxMTIyfQ.NZOBj5CB9_aCfrEoIXQe1Xku5VyDcSV3KfqZp6b2cbM';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { email, password, token } = await req.json();
  console.log('create-member-account:', email, token);

  // Chercher si l'utilisateur existe déjà
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=${encodeURIComponent(email)}&per_page=1`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  const listData = await listRes.json();
  console.log('listData:', JSON.stringify(listData));
  const existingUser = listData.users?.[0];

  let userId = existingUser?.id;

  if (existingUser) {
    // Mettre à jour le mot de passe + confirmer email
    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${existingUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ password, email_confirm: true }),
    });
    const updateData = await updateRes.json();
    console.log('updateData:', JSON.stringify(updateData));
  } else {
    // Créer le compte
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    const createData = await createRes.json();
    console.log('createData:', JSON.stringify(createData));
    userId = createData.id;
  }

  // Mettre à jour club_members
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/club_members?invite_token=eq.${token}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ status: 'active', user_id: userId }),
  });
  console.log('patchRes status:', patchRes.status);

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
