import pandas as pd
import numpy as np
import requests
import warnings
import os
from math import radians, cos, sin, asin, sqrt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import r2_score
from sklearn.preprocessing import LabelEncoder

warnings.filterwarnings('ignore')

# Função para encontrar ficheiros em caminhos alternativos do projeto
def localizacao_arquivo(nome_arquivo):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    caminhos_busca = [
        nome_arquivo,  # Diretório de execução atual
        os.path.join(script_dir, nome_arquivo),  # Mesmo diretório do script
        os.path.join(script_dir, "..", nome_arquivo),  # Diretório pai do script
        os.path.join(script_dir, "..", "project", "csv", nome_arquivo),  # project/csv/ do diretório pai
        os.path.join("project", "csv", nome_arquivo),  # project/csv relativo ao diretório de execução
    ]
    for p in caminhos_busca:
        if os.path.exists(p):
            return p
    return nome_arquivo  # Fallback caso não seja encontrado

# Função para obter caminho correto de gravação
def obter_caminho_salvamento(nome_arquivo):
    script_dir = os.path.dirname(os.path.abspath(__file__))
    caminhos_busca = [
        os.path.join(script_dir, "..", "project", "csv", nome_arquivo),
        os.path.join("project", "csv", nome_arquivo),
        os.path.join(script_dir, nome_arquivo),
        nome_arquivo
    ]
    for p in caminhos_busca:
        dir_name = os.path.dirname(p)
        if dir_name == '' or os.path.exists(dir_name):
            return p
    return nome_arquivo

# 1. Função Auxiliar: Mapeamento de Transporte Público
def mapear_transporte_publico():
    print("A iniciar o mapeamento: Rede de Transporte Público...")
    url = "https://overpass-api.de/api/interpreter"
    headers = {'User-Agent': 'Projeto_NutriAlerta_Universitario/1.0'}
    
    query_onibus = """
    [out:json][timeout:90];
    (
      node["highway"="bus_stop"](-22.50, -47.65, -22.30, -47.45);
      node["amenity"="bus_station"](-22.50, -47.65, -22.30, -47.45);
    );
    out center;
    """
    try:
        resposta = requests.get(url, params={'data': query_onibus}, headers=headers)
        dados = resposta.json()
        pontos = [{'lat': e['lat'], 'lon': e['lon']} for e in dados.get('elements', [])]
        print(f" -> Encontrados: {len(pontos)} paragens de autocarro.")
        return pd.DataFrame(pontos)
    except:
        print(" -> Aviso: Falha ao extrair transportes. A prosseguir sem esta variável.")
        return pd.DataFrame()

def calcular_distancia(lat1, lon1, lat2, lon2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    return 2 * asin(sqrt(sin((lat2 - lat1)/2)**2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1)/2)**2)) * 6371

# 2. Carregar as Bases de Dados Locais
print("\nA carregar os Dataframes...")
df_nutri = pd.read_csv(localizacao_arquivo("Base_Nutricional_Consolidada_Final.csv"))
df_ubs = pd.read_csv(localizacao_arquivo("ubs_rio_claro (1).csv")) 
df_escolas = pd.read_csv(localizacao_arquivo("escolas_prontas (1).csv"))
df_ambiente = pd.read_csv(localizacao_arquivo("ambiente_alimentar_rio_claro.csv"))
df_oasis = pd.read_csv(localizacao_arquivo("oasis_alimentares_rio_claro.csv"))
df_esporte = pd.read_csv(localizacao_arquivo("esporte_lazer_rio_claro.csv"))
df_transporte = mapear_transporte_publico()

df_nutri['CNES'] = df_nutri['CNES'].astype(str)
df_ubs['cnes'] = df_ubs['cnes'].astype(str)
df_escolas['tipo_rede'] = np.where(df_escolas['nome'].str.contains('E.M.|E.E.', regex=True, na=False), 'publica', 'privada')

# 3. Engenharia de Variáveis Espaciais
print("\nA processar o cruzamento espacial (Aguarde uns segundos)...")
features_espaciais = []

for _, ubs in df_ubs.iterrows():
    lat_u, lon_u = ubs['lat'], ubs['lon']
    
    escolas_pub = sum(1 for _, e in df_escolas[df_escolas['tipo_rede']=='publica'].iterrows() if calcular_distancia(lat_u, lon_u, e['lat'], e['lon']) <= 1.5)
    escolas_priv = sum(1 for _, e in df_escolas[df_escolas['tipo_rede']=='privada'].iterrows() if calcular_distancia(lat_u, lon_u, e['lat'], e['lon']) <= 1.5)
    fastfood = sum(1 for _, a in df_ambiente.iterrows() if calcular_distancia(lat_u, lon_u, a['lat'], a['lon']) <= 1.5)
    supermercados = sum(1 for _, o in df_oasis.iterrows() if calcular_distancia(lat_u, lon_u, o['lat'], o['lon']) <= 1.5)
    pracas = sum(1 for _, e in df_esporte.iterrows() if calcular_distancia(lat_u, lon_u, e['lat'], e['lon']) <= 1.5)
    onibus = sum(1 for _, t in df_transporte.iterrows() if calcular_distancia(lat_u, lon_u, t['lat'], t['lon']) <= 1.0) if not df_transporte.empty else 0
    
    features_espaciais.append({
        'cnes': ubs['cnes'], 'lat_ubs': lat_u, 'lon_ubs': lon_u,
        'qtd_esc_publicas': escolas_pub, 'qtd_esc_privadas': escolas_priv,
        'qtd_fastfood': fastfood, 'qtd_supermercados': supermercados,
        'qtd_pracas_esporte': pracas, 'acesso_transporte': onibus
    })

df_geo = pd.DataFrame(features_espaciais)
df_master = pd.merge(df_nutri, df_geo, left_on='CNES', right_on='cnes', how='inner').dropna(subset=['Obesidade_Pct'])
df_master['Faixa_Etaria_Cod'] = LabelEncoder().fit_transform(df_master['Faixa_Etaria'].astype(str))
df_master = df_master.sort_values(by=['CNES', 'Ano'])

# 4. O SEGREDO: PREVER A VARIAÇÃO (DELTA) E NÃO O NÚMERO ABSOLUTO
print("\nA aplicar a engenharia de variação temporal (Cálculo do Delta)...")
df_master['Tendencia_Obesidade'] = df_master.groupby('CNES')['Obesidade_Pct'].transform(lambda x: x.rolling(window=3, min_periods=1).mean())
df_master['Obesidade_Ano_Anterior'] = df_master.groupby('CNES')['Tendencia_Obesidade'].shift(1)

# Calcular o Delta (Quanto subiu ou desceu em relação ao ano anterior)
df_master['Delta_Obesidade'] = df_master['Tendencia_Obesidade'] - df_master['Obesidade_Ano_Anterior']

df_modelo = df_master.dropna(subset=['Obesidade_Ano_Anterior', 'Delta_Obesidade']).copy()

features = [
    'Ano', 'Faixa_Etaria_Cod', 'Obesidade_Ano_Anterior',
    'qtd_esc_publicas', 'qtd_esc_privadas', 'qtd_fastfood', 
    'qtd_supermercados', 'qtd_pracas_esporte', 'acesso_transporte'
]

X = df_modelo[features]
# A variável alvo agora é o Delta!
y = df_modelo['Delta_Obesidade']

train_mask = df_modelo['Ano'] < 2024
test_mask = df_modelo['Ano'] >= 2024
X_train, y_train = X[train_mask], y[train_mask]
X_test, y_test = X[test_mask], y[test_mask]

# 5. Treinar a Inteligência Artificial (Mais Agressiva)
print("\nA treinar a Inteligência Artificial no modelo de Crescimento...")
modelo = RandomForestRegressor(n_estimators=300, random_state=42, max_depth=8)
modelo.fit(X_train, y_train)

# 6. A Nova Máquina do Tempo (Projeções com o Delta)
print("\nA gerar projeções dinâmicas para 2026 e 2027...")
df_2025 = df_modelo[df_modelo['Ano'] == 2025].copy()

# Previsão para 2026
df_2026 = df_2025.copy()
df_2026['Ano'] = 2026
df_2026['Obesidade_Ano_Anterior'] = df_2025['Tendencia_Obesidade']

# A IA prevê o crescimento (Delta)
df_2026['Delta_Predito'] = modelo.predict(df_2026[features])
df_2026['Delta_Obesidade'] = df_2026['Delta_Predito']
# A Tendência real é o Ano Anterior + O Delta que a IA calculou
df_2026['Tendencia_Obesidade'] = df_2026['Obesidade_Ano_Anterior'] + df_2026['Delta_Predito']
df_2026['Status'] = 'PREVISÃO FUTURA'

# Previsão para 2027
df_2027 = df_2026.copy()
df_2027['Ano'] = 2027
df_2027['Obesidade_Ano_Anterior'] = df_2026['Tendencia_Obesidade']

# A IA prevê o crescimento de novo
df_2027['Delta_Predito'] = modelo.predict(df_2027[features])
df_2027['Delta_Obesidade'] = df_2027['Delta_Predito']
# Soma-se o novo Delta à base de 2026
df_2027['Tendencia_Obesidade'] = df_2027['Obesidade_Ano_Anterior'] + df_2027['Delta_Predito']
df_2027['Status'] = 'PREVISÃO FUTURA'

# Guardar o histórico (Para os anos passados, a tendência é o valor que já tínhamos)
df_modelo['Status'] = 'DADO HISTÓRICO'

df_final = pd.concat([df_modelo, df_2026, df_2027], ignore_index=True)

# Guardar o novo ficheiro no caminho adequado do projeto
caminho_salvar = obter_caminho_salvamento("NutriAlerta_Projecao_Futura.csv")
df_final.to_csv(caminho_salvar, index=False)

print(f"\n✅ Fluxo Concluído! O modelo aprendeu a prever o CRESCIMENTO do risco.")
print(f"Ficheiro '{caminho_salvar}' gerado com sucesso!")