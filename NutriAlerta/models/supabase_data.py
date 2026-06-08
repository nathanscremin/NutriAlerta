import json
import os
from pathlib import Path

import pandas as pd
import requests
from sklearn.preprocessing import LabelEncoder

BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BASE_DIR / 'project'
NUTRI_ALERTA_DIR = PROJECT_DIR / 'nutri-alerta'

DEFAULT_SUPABASE_URL = 'https://peqvaslchaxrewhtxltc.supabase.co'
DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_knBFAKhSyTfdfRwMYaQGeg_pF5D6w33'
DEFAULT_SUPABASE_EMAIL = 'nutrialerta@gmail.com'
DEFAULT_SUPABASE_PASSWORD = '#Pangam123@'
HEALTH_TABLE = 'registros_saude'

UBS_CNES = {
    'UBS Jardim Chervezon “Dr. Nicolino Maziotti”': '2074362',
    'UBS 29 “Oreste Armando Giovani”': '2031922',
    'UBS Wenzel “Dr. Mario Fittipaldi”': '2030462',
    'UBS Vila Cristina “Dr. Sílvio Arnaldo Piva”': '2073943',
    'USF Assistência': '2055821',
    'USF Ferraz': '6222629',
    'USF Nosso Teto/Boa Vista “Dr. Antonio R.M. Santomauro”': '2055902',
    'USF Ajapi/Ferraz': '2049163',
    'USF Mãe PretaI/II': '2071665',
    'USF Palmeiras I/II “Dr. Gilson Giovanni”': '2033186',
    'USF Jardim Novo I E II “Dr. Dirceu Ferreira Penteado”': '2074214',
    'USF Benjamin de Castro': '7058865',
    'USF Bonsucesso/Novo Wenzel “Célia Aparecida Ceccato da Silva”': '2055902',
    'USF Jardim das Flores “Dr. Moacir Camargo”': '2074419',
    'USF Guanabara “Dr. Celestino Donato”': '2074222',
    'USF Panorama “Dr. Osvaldo Akamine”': '2074346',
    'USF Terra Nova': '7533032',
}


def _read_env_file(path):
    if not path.exists():
        return {}

    values = {}
    for line in path.read_text(encoding='utf-8').splitlines():
        if not line or line.strip().startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def get_supabase_config():
    env_values = {}
    for path in (
        NUTRI_ALERTA_DIR / '.env.local',
        BASE_DIR / '.env.local',
        PROJECT_DIR / 'nutri-alerta' / '.env.local',
    ):
        env_values.update(_read_env_file(path))

    env_values.update(os.environ)
    return {
        'url': env_values.get('NEXT_PUBLIC_SUPABASE_URL', DEFAULT_SUPABASE_URL),
        'anon_key': env_values.get('NEXT_PUBLIC_SUPABASE_ANON_KEY', DEFAULT_SUPABASE_ANON_KEY),
        'email': env_values.get('SUPABASE_EMAIL') or env_values.get('SUPABASE_ADMIN_EMAIL') or DEFAULT_SUPABASE_EMAIL,
        'password': env_values.get('SUPABASE_PASSWORD') or env_values.get('SUPABASE_ADMIN_PASSWORD') or DEFAULT_SUPABASE_PASSWORD,
    }


def locate_file(name):
    candidates = [
        Path(name),
        BASE_DIR / name,
        (BASE_DIR / 'project' / 'csv' / name),
        (PROJECT_DIR / 'csv' / name),
        (NUTRI_ALERTA_DIR / 'src' / 'lib' / name),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return Path(name)


def load_poi_cache():
    candidates = [
        NUTRI_ALERTA_DIR / 'src' / 'lib' / 'extractedPois.json',
        BASE_DIR / 'project' / 'nutri-alerta' / 'src' / 'lib' / 'extractedPois.json',
        PROJECT_DIR / 'nutri-alerta' / 'src' / 'lib' / 'extractedPois.json',
    ]
    for candidate in candidates:
        if candidate.exists():
            return json.loads(candidate.read_text(encoding='utf-8'))
    return []


def normalize_text(value):
    if value is None:
        return ''
    import unicodedata

    normalized = unicodedata.normalize('NFKD', str(value))
    return ''.join(ch for ch in normalized if not ch.isdigit()).strip().upper()


def classify_bmi(weight, height):
    if weight is None or height is None or height <= 0:
        return 'Eutrofia'

    imc = float(weight) / float(height) ** 2
    if imc < 16.0:
        return 'Magreza_Acentuada'
    if imc < 18.5:
        return 'Magreza'
    if imc < 25.0:
        return 'Eutrofia'
    if imc < 30.0:
        return 'Sobrepeso'
    if imc < 35.0:
        return 'Obesidade'
    return 'Obesidade_Grave'


def map_public_transport():
    url = 'https://overpass-api.de/api/interpreter'
    headers = {'User-Agent': 'NutriAlerta-ML-Pipeline/1.0'}
    query = """
    [out:json][timeout:90];
    (
      node["highway"="bus_stop"](-22.50, -47.65, -22.30, -47.45);
      node["amenity"="bus_station"](-22.50, -47.65, -22.30, -47.45);
    );
    out center;
    """

    try:
        response = requests.get(url, params={'data': query}, headers=headers, timeout=10)
        response.raise_for_status()
        elements = response.json().get('elements', [])
        return pd.DataFrame([{'lat': element['lat'], 'lon': element['lon']} for element in elements])
    except Exception:
        return pd.DataFrame()


def calcular_distancia(lat1, lon1, lat2, lon2):
    from math import asin, cos, radians, sin, sqrt

    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    return 2 * asin(sqrt(sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2)) * 6371


def load_local_geospatial_frames():
    df_ubs = pd.read_csv(locate_file('ubs_rio_claro (1).csv'))
    df_escolas = pd.read_csv(locate_file('escolas_prontas (1).csv'))
    df_ambiente = pd.read_csv(locate_file('ambiente_alimentar_rio_claro.csv'))
    df_oasis = pd.read_csv(locate_file('oasis_alimentares_rio_claro.csv'))
    df_esporte = pd.read_csv(locate_file('esporte_lazer_rio_claro.csv'))
    df_transporte = map_public_transport()

    if 'cnes' in df_ubs.columns:
        df_ubs = df_ubs.dropna(subset=['cnes'])
        df_ubs['cnes'] = df_ubs['cnes'].astype(int).astype(str).str.strip()
    if 'nome' in df_escolas.columns:
        df_escolas['tipo_rede'] = df_escolas['nome'].astype(str).str.contains('E.M.|E.E.', regex=True, na=False).map(
            lambda is_public: 'publica' if is_public else 'privada'
        )

    return df_ubs, df_escolas, df_ambiente, df_oasis, df_esporte, df_transporte


def build_spatial_features(df_ubs, df_escolas, df_ambiente, df_oasis, df_esporte, df_transporte):
    global_mean_desnutricao = float(df_escolas.get('desnutricao', pd.Series([0])).mean())
    global_mean_obesidade = float(df_escolas.get('obesidade', pd.Series([0])).mean())
    global_mean_sobrepeso = float(df_escolas.get('sobrepeso', pd.Series([0])).mean())
    global_mean_eutrofia = float(df_escolas.get('eutrofia', pd.Series([0])).mean())

    features = []
    for _, ubs in df_ubs.iterrows():
        lat_u = float(ubs['lat'])
        lon_u = float(ubs['lon'])

        escolas_entorno = []
        escolas_pub = 0
        escolas_priv = 0

        for _, escola in df_escolas.iterrows():
            dist = calcular_distancia(lat_u, lon_u, float(escola['lat']), float(escola['lon']))
            if dist <= 1.5:
                escolas_entorno.append(escola)
                if escola.get('tipo_rede', 'privada') == 'publica':
                    escolas_pub += 1
                else:
                    escolas_priv += 1

        if escolas_entorno:
            esc_media_desnutricao = float(pd.Series([e['desnutricao'] for e in escolas_entorno]).mean())
            esc_media_obesidade = float(pd.Series([e['obesidade'] for e in escolas_entorno]).mean())
            esc_media_sobrepeso = float(pd.Series([e['sobrepeso'] for e in escolas_entorno]).mean())
            esc_media_eutrofia = float(pd.Series([e['eutrofia'] for e in escolas_entorno]).mean())
        else:
            esc_media_desnutricao = global_mean_desnutricao
            esc_media_obesidade = global_mean_obesidade
            esc_media_sobrepeso = global_mean_sobrepeso
            esc_media_eutrofia = global_mean_eutrofia

        fastfood = sum(1 for _, ambiente in df_ambiente.iterrows() if calcular_distancia(lat_u, lon_u, float(ambiente['lat']), float(ambiente['lon'])) <= 1.5)
        supermercados = sum(1 for _, oasis in df_oasis.iterrows() if calcular_distancia(lat_u, lon_u, float(oasis['lat']), float(oasis['lon'])) <= 1.5)
        pracas = sum(1 for _, esporte in df_esporte.iterrows() if calcular_distancia(lat_u, lon_u, float(esporte['lat']), float(esporte['lon'])) <= 1.5)

        if df_transporte.empty:
            onibus = int((fastfood + supermercados) / 2) + 1
        else:
            onibus = sum(1 for _, transporte in df_transporte.iterrows() if calcular_distancia(lat_u, lon_u, float(transporte['lat']), float(transporte['lon'])) <= 1.0)

        features.append({
            'cnes': str(ubs['cnes']),
            'lat_ubs': lat_u,
            'lon_ubs': lon_u,
            'qtd_esc_publicas': escolas_pub,
            'qtd_esc_privadas': escolas_priv,
            'esc_media_desnutricao': esc_media_desnutricao,
            'esc_media_obesidade': esc_media_obesidade,
            'esc_media_sobrepeso': esc_media_sobrepeso,
            'esc_media_eutrofia': esc_media_eutrofia,
            'qtd_fastfood': fastfood,
            'qtd_supermercados': supermercados,
            'qtd_pracas_esporte': pracas,
            'acesso_transporte': onibus,
        })

    return pd.DataFrame(features)


def build_school_lookup(schools, pois):
    school_lookup = {}
    poi_map = {}

    for poi in pois:
        poi_key = normalize_text(poi.get('nome') or '')
        if poi_key:
            poi_map[poi_key] = poi

    for school in schools:
        school_name = str(school.get('nome') or school.get('name') or '')
        school_key = normalize_text(school_name)

        match = poi_map.get(school_key)
        if not match:
            for poi_key, poi in poi_map.items():
                if school_key and (school_key in poi_key or poi_key in school_key):
                    match = poi
                    break

        school_lookup[str(school.get('id') or school_name)] = {
            'nome': school_name,
            'bairro': match.get('bairro', 'Desconhecido') if match else 'Desconhecido',
            'regiao_ubs': match.get('regiao_ubs', 'UBS Jardim Chervezon “Dr. Nicolino Maziotti”') if match else 'UBS Jardim Chervezon “Dr. Nicolino Maziotti”',
            'lat': float(match.get('lat', -22.41)) if match else -22.41,
            'lon': float(match.get('lon', -47.56)) if match else -47.56,
        }

    return school_lookup


def build_model_snapshot(records, schools, pois=None):
    pois = pois if pois is not None else load_poi_cache()
    school_lookup = build_school_lookup(schools, pois)

    grouped = {}
    for record in records:
        try:
            date_value = record.get('data_coleta') or record.get('date')
            if not date_value:
                continue

            school_id = str(record.get('escola_id') or record.get('school_id') or '')
            if school_id not in school_lookup and record.get('escola_nome'):
                school_id = str(record.get('escola_nome'))
            if school_id not in school_lookup:
                continue

            school_meta = school_lookup[school_id]
            year = int(str(date_value)[:4])
            cnes = UBS_CNES.get(school_meta['regiao_ubs'], '2005565')
            key = (cnes, year)

            if key not in grouped:
                grouped[key] = {
                    'CNES': cnes,
                    'Ano': year,
                    'Faixa_Etaria': '0 a 18 anos',
                    'Magreza_Acentuada_Qtd': 0,
                    'Magreza_Qtd': 0,
                    'Eutrofia_Qtd': 0,
                    'Sobrepeso_Qtd': 0,
                    'Obesidade_Qtd': 0,
                    'Obesidade_Grave_Qtd': 0,
                    'Total': 0,
                }

            classification = classify_bmi(record.get('peso'), record.get('altura'))
            grouped[key][f'{classification}_Qtd'] += 1
            grouped[key]['Total'] += 1
        except Exception:
            continue

    if not grouped:
        return pd.DataFrame(columns=['CNES', 'Ano', 'Faixa_Etaria', 'Magreza_Acentuada_Qtd', 'Magreza_Qtd', 'Eutrofia_Qtd', 'Sobrepeso_Qtd', 'Obesidade_Qtd', 'Obesidade_Grave_Qtd', 'Total'])

    df = pd.DataFrame(list(grouped.values()))
    df['Magreza_Acentuada_Pct'] = (df['Magreza_Acentuada_Qtd'] / df['Total'] * 100).round(6)
    df['Magreza_Pct'] = (df['Magreza_Qtd'] / df['Total'] * 100).round(6)
    df['Eutrofia_Pct'] = (df['Eutrofia_Qtd'] / df['Total'] * 100).round(6)
    df['Sobrepeso_Pct'] = (df['Sobrepeso_Qtd'] / df['Total'] * 100).round(6)
    df['Obesidade_Pct'] = (df['Obesidade_Qtd'] / df['Total'] * 100).round(6)
    df['Obesidade_Grave_Pct'] = (df['Obesidade_Grave_Qtd'] / df['Total'] * 100).round(6)

    return df


def fetch_supabase_snapshot():
    config = get_supabase_config()
    try:
        auth_response = requests.post(
            f"{config['url']}/auth/v1/token?grant_type=password",
            headers={'apikey': config['anon_key'], 'Content-Type': 'application/json'},
            json={'email': config['email'], 'password': config['password']},
            timeout=20,
        )
        auth_response.raise_for_status()
        access_token = auth_response.json().get('access_token')
        if not access_token:
            raise RuntimeError('Supabase auth response did not contain an access token.')

        headers = {
            'apikey': config['anon_key'],
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }

        def fetch_table(table_name):
            rows = []
            offset = 0
            limit = 1000
            while True:
                response = requests.get(
                    f"{config['url']}/rest/v1/{table_name}?select=*&order=id.asc&limit={limit}&offset={offset}",
                    headers=headers,
                    timeout=30,
                )
                response.raise_for_status()
                page = response.json()
                if not page:
                    break
                rows.extend(page)
                if len(page) < limit:
                    break
                offset += limit
            return rows

        print(f'[Supabase] consultando tabela {HEALTH_TABLE}')
        return {
            'records': fetch_table(HEALTH_TABLE),
            'schools': fetch_table('escolas'),
        }
    except Exception as exc:
        raise RuntimeError(f'Falha ao carregar dados do Supabase: {exc}')


def build_master_dataset():
    df_ubs, df_escolas, df_ambiente, df_oasis, df_esporte, df_transporte = load_local_geospatial_frames()
    df_geo = build_spatial_features(df_ubs, df_escolas, df_ambiente, df_oasis, df_esporte, df_transporte)

    try:
        snapshot = fetch_supabase_snapshot()
        records = snapshot['records']
        schools = snapshot['schools']
        if records:
            print('[Supabase] fonte ativa: registros_saude e escolas')
        else:
            print('[Supabase] registros_saude retornou 0 linhas; usando fallback local.')
        if not schools:
            print('[Supabase] escolas retornou 0 linhas; usando fallback local.')
    except Exception as exc:
        print(f'[Supabase] fallback local ativado: {exc}')
        records = []
        schools = []

    if records and schools:
        df_nutri = build_model_snapshot(records, schools)
    else:
        df_nutri = pd.read_csv(locate_file('Base_Nutricional_Consolidada_Final.csv'))
        df_nutri = df_nutri[df_nutri['Faixa_Etaria'] == '0 a 18 anos']
        df_nutri = df_nutri.dropna(subset=['CNES'])
        df_nutri['CNES'] = df_nutri['CNES'].astype(float).astype(int).astype(str).str.strip()

    df_master = pd.merge(df_nutri, df_geo, left_on='CNES', right_on='cnes', how='inner')
    df_master['Faixa_Etaria_Cod'] = LabelEncoder().fit_transform(df_master['Faixa_Etaria'].astype(str))
    df_master = df_master.sort_values(by=['CNES', 'Ano'])
    return df_master
