import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ============================================================
// useFffSearch — recherche dans la base des 14 966 clubs FFF
// Centralise : recherche par nom/district/ville + listes districts/villes
// Réutilisable dans LibraryView ET le picker d'équipes
// ============================================================

export function useFffSearch({ enabled = true } = {}) {
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);

  const runSearch = useCallback(async (q, dist, c) => {
    const hasFilter = (q && q.length >= 2) || dist || c;
    if (!hasFilter) { setResults([]); return; }
    setLoading(true);
    let query = supabase.from('clubs_fff').select('*').limit(50);
    if (q && q.length >= 2) {
      const normalized = q.replace(/[.\s]+/g, '');
      query = query.or(`name.ilike.%${q}%,name.ilike.%${normalized}%`);
    }
    if (dist) query = query.eq('district_short', dist);
    if (c) query = query.ilike('location', `%${c}%`);
    const { data } = await query.order('name');
    setResults(data || []);
    setLoading(false);
  }, []);

  const loadDistricts = useCallback(async () => {
    const { data } = await supabase.rpc('get_distinct_districts');
    setDistricts(data || []);
  }, []);

  const loadCities = useCallback(async (dist) => {
    const { data } = await supabase.rpc('get_distinct_cities', { p_district: dist || null });
    setCities(data || []);
  }, []);

  // Charger districts au montage (si activé)
  useEffect(() => { if (enabled) loadDistricts(); }, [enabled, loadDistricts]);

  // Recharger villes quand district change
  useEffect(() => { if (enabled) { loadCities(district); setCity(''); } }, [district, enabled, loadCities]);

  // Relancer la recherche quand un critère change
  useEffect(() => { if (enabled) runSearch(search, district, city); }, [search, district, city, enabled, runSearch]);

  const reset = useCallback(() => {
    setSearch(''); setDistrict(''); setCity(''); setResults([]);
  }, []);

  return {
    search, setSearch,
    district, setDistrict,
    city, setCity,
    results, loading,
    districts, cities,
    reset,
  };
}
