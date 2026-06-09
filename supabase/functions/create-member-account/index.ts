const SUPABASE_URL = 'https://cmldxjlbxtcfmhzfvnyd.supabase.co';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbGR4amxieHRjZm1oemZ2bnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyNTEyMiwiZXhwIjoyMDkzNDAxMTIyfQ.NZOBj5CB9_aCfrEoIXQe1Xku5VyDcSV3KfqZp6b2cbM';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const { email, password, token } = await req.json();
  console.log('create-member-account: token=', token, 'email=', email);

  // 1. Récupérer le club_member par token (vérification d'identité)
  const cmRes = await fetch(`${SUPABASE_URL}/rest/v1/club_members?invite_token=eq.${encodeURIComponent(token)}&select=*`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  const cmData = await cmRes.json();
  console.log('club_member lookup:', JSON.stringify(cmData));

  if (!cmData || cmData.length === 0) {
    return new Response(JSON.stringify({ error: 'Token invalide' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const member = cmData[0];
  const expectedEmail = member.email;

  // Vérifier que l'email correspond
  if (expectedEmail !== email) {
    return new Response(JSON.stringify({ error: 'Email ne correspond pas au token' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. Chercher l'utilisateur EXACT par email avec filter strict
  // L'Admin API utilise une recherche LIKE par défaut, on doit filtrer manuellement
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
  });
  const listData = await listRes.json();
  const existingUser = (listData.users || []).find((u: any) => u.email === expectedEmail);
  console.log('existing user found:', existingUser ? existingUser.id : 'none');

  let userId = existingUser?.id;

  if (existingUser) {
    // Mettre à jour mot de passe + confirmer email
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
    console.log('update result:', JSON.stringify(updateData));
  } else {
    // Créer le compte
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
      },
      body: JSON.stringify({ email: expectedEmail, password, email_confirm: true }),
    });
    const createData = await createRes.json();
    console.log('create result:', JSON.stringify(createData));
    userId = createData.id;
  }

  if (!userId) {
    return new Response(JSON.stringify({ error: 'Impossible de créer/récupérer l\'utilisateur' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 3. Mettre à jour club_members
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/club_members?invite_token=eq.${encodeURIComponent(token)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({ status: 'active', user_id: userId }),
  });
  const patchData = await patchRes.json();
  console.log('patch result:', patchRes.status, JSON.stringify(patchData));

  return new Response(JSON.stringify({ success: true, user_id: userId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
