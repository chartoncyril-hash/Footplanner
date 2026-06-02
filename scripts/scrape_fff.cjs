const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cmldxjlbxtcfmhzfvnyd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtbGR4amxieHRjZm1oemZ2bnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgyNTEyMiwiZXhwIjoyMDkzNDAxMTIyfQ.NZOBj5CB9_aCfrEoIXQe1Xku5VyDcSV3KfqZp6b2cbM'
);

function fetchClubs(name, page = 1) {
  return new Promise((resolve, reject) => {
    const path = `/api/clubs?name=${encodeURIComponent(name)}&page=${page}&itemsPerPage=30`;
    const req = https.request({
      hostname: 'api-dofa.fff.fr',
      path,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve([]); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  let total = 0;

  for (const letter of letters) {
    console.log(`\n=== Scraping clubs commençant par ${letter} ===`);
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const clubs = await fetchClubs(letter, page);
      if (!clubs || clubs.length === 0) { hasMore = false; break; }

      const rows = clubs.map(c => ({
        cl_no: c.cl_no,
        name: c.name,
        short_name: c.short_name,
        location: c.location,
        postal_code: c.postal_code,
        district: c.district?.name,
        district_short: c.district?.short_name,
        department_code: c.department_code?.toString(),
        logo_url: c.logo,
        latitude: c.latitude,
        longitude: c.longitude,
        affiliation_number: c.affiliation_number?.toString(),
      }));

      const { error } = await supabase.from('clubs_fff').upsert(rows, { onConflict: 'cl_no' });
      if (error) console.error('Insert error:', error.message);
      else {
        total += rows.length;
        console.log(`  Page ${page}: ${rows.length} clubs insérés (total: ${total})`);
      }

      hasMore = clubs.length === 30;
      page++;
      await sleep(300);
    }
  }

  console.log(`\n=== TERMINÉ: ${total} clubs au total ===`);
}

main().catch(console.error);
