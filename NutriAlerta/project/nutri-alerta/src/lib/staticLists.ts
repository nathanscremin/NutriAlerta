import { UNIDADES_SAUDE, ALL_POIS, getVoronoiGeoJSON } from '@/lib/mockData';

/**
 * Centralized static and derived lists for schools, neighborhoods, and UBSs (DUP-3).
 * Derived once at module level, making the project robust, efficient, and ready to be
 * converted to reactive dynamic DB queries in the future without changing component JSX.
 */

export const UBS_LIST = UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').sort((a, b) => {
  const nameA = a.nome.replace('UBS ', '').replace('USF ', '');
  const nameB = b.nome.replace('UBS ', '').replace('USF ', '');
  return nameA.localeCompare(nameB);
});

export const SCHOOLS_LIST = ALL_POIS.filter(p => p.categoria === 'Educação').sort((a, b) => a.nome.localeCompare(b.nome));

export const UNIQUE_BAIRROS_LIST = (() => {
  const bairrosGeoJSON = getVoronoiGeoJSON();
  if (!bairrosGeoJSON || !bairrosGeoJSON.features) return [];
  const setNames = new Set<string>();
  const list: Array<{ nome: string; parentUbs: string }> = [];
  bairrosGeoJSON.features.forEach((feat: any) => {
    const name = feat.properties?.nome_real_bairro;
    const ubs = feat.properties?.nome_bairro;
    if (name && !setNames.has(name)) {
      setNames.add(name);
      list.push({ nome: name, parentUbs: ubs || '' });
    }
  });
  return list.sort((a, b) => a.nome.localeCompare(b.nome));
})();
