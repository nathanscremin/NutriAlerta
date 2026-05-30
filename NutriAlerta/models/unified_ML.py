import argparse
import time
import json
from pathlib import Path

import numpy as np
import pandas as pd
import requests
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from supabase_data import build_master_dataset, get_supabase_config


def obter_caminho_salvamento(nome_arquivo):
    script_dir = Path(__file__).resolve().parent
    candidatos = [
        script_dir.parent / 'project' / 'csv' / nome_arquivo,
        Path('project') / 'csv' / nome_arquivo,
        script_dir / nome_arquivo,
        Path(nome_arquivo),
    ]
    for candidato in candidatos:
        if candidato.parent.exists() or candidato.parent == Path('.'):
            return candidato
    return Path(nome_arquivo)


def criar_tendencias(df_master):
    df = df_master.copy()
    df['Ano'] = pd.to_numeric(df['Ano'], errors='coerce')

    if 'Obesidade_Grave_Pct' in df.columns and 'Obesidade_Pct' in df.columns:
        df['Obesidade_Total_Pct'] = df['Obesidade_Pct'] + df['Obesidade_Grave_Pct']
    else:
        df['Obesidade_Total_Pct'] = df.get('Obesidade_Pct', 0.0)

    metricas = [
        ('Magreza_Acentuada_Pct', 'Tendencia_Desnutricao', 'Desnutricao_Ano_Anterior', 'Delta_Desnutricao'),
        ('Magreza_Pct', 'Tendencia_Magreza', 'Magreza_Ano_Anterior', 'Delta_Magreza'),
        ('Eutrofia_Pct', 'Tendencia_Eutrofia', 'Eutrofia_Ano_Anterior', 'Delta_Eutrofia'),
        ('Sobrepeso_Pct', 'Tendencia_Sobrepeso', 'Sobrepeso_Ano_Anterior', 'Delta_Sobrepeso'),
        ('Obesidade_Total_Pct', 'Tendencia_Obesidade', 'Obesidade_Ano_Anterior', 'Delta_Obesidade'),
    ]

    for fonte, tendencia, anterior, delta in metricas:
        df[tendencia] = df.groupby('CNES')[fonte].transform(lambda s: s.rolling(window=3, min_periods=1).mean())
        df[anterior] = df.groupby('CNES')[tendencia].shift(1)
        df[delta] = df[tendencia] - df[anterior]

    return df


def treinar_modelo_indicador(df_modelo, coluna_anterior, coluna_delta, nome_indicador):
    df_temp = df_modelo.dropna(subset=[coluna_anterior, coluna_delta]).copy()

    features = [
        'Ano',
        'Faixa_Etaria_Cod',
        coluna_anterior,
        'qtd_esc_publicas',
        'qtd_esc_privadas',
        'esc_media_desnutricao',
        'esc_media_obesidade',
        'esc_media_sobrepeso',
        'esc_media_eutrofia',
        'qtd_fastfood',
        'qtd_supermercados',
        'qtd_pracas_esporte',
        'acesso_transporte',
    ]

    anos_disponiveis = sorted(df_temp['Ano'].unique())
    maes = []
    r2s = []
    
    # Se houver pelo menos 3 anos, realizamos a validação cruzada temporal walk-forward
    if len(anos_disponiveis) >= 3:
        for ano_teste in anos_disponiveis[2:]:
            train_mask = df_temp['Ano'] < ano_teste
            test_mask = df_temp['Ano'] == ano_teste
            
            X_tr, y_tr = df_temp.loc[train_mask, features], df_temp.loc[train_mask, coluna_delta]
            X_te, y_te = df_temp.loc[test_mask, features], df_temp.loc[test_mask, coluna_delta]
            
            if len(X_tr) > 0 and len(X_te) > 0:
                fold_model = RandomForestRegressor(n_estimators=300, random_state=42, max_depth=8)
                fold_model.fit(X_tr, y_tr)
                preds = fold_model.predict(X_te)
                
                maes.append(float(mean_absolute_error(y_te, preds)))
                try:
                    r2s.append(float(r2_score(y_te, preds)))
                except:
                    r2s.append(0.0)
                    
    mae_medio = float(np.mean(maes)) if maes else 0.0
    r2_medio = float(np.mean(r2s)) if r2s else 0.0
    
    print(f"\n[ML - {nome_indicador.upper()}] Validação Cruzada Temporal Walk-Forward:")
    print(f"  -> MAE Médio (Variação do Indicador): {mae_medio:.4f}%")
    print(f"  -> R² Médio: {r2_medio:.4f}")
    if maes:
        print(f"  -> MAE por Fold (Anos {anos_disponiveis[2:]}): {[round(m, 4) for m in maes]}")
    print("-" * 50)

    # Treina o modelo final com 100% dos dados para máxima acurácia preditiva dos anos futuros
    X_train = df_temp[features]
    y_train = df_temp[coluna_delta]

    modelo = RandomForestRegressor(n_estimators=300, random_state=42, max_depth=8)
    modelo.fit(X_train, y_train)
    return modelo, features, {"mae_medio": mae_medio, "r2_medio": r2_medio}


def normalizar_percentuais(df):
    for idx, row in df.iterrows():
        valores = np.array([
            max(0.0, float(row['Tendencia_Desnutricao'])),
            max(0.0, float(row['Tendencia_Magreza'])),
            max(0.0, float(row['Tendencia_Eutrofia'])),
            max(0.0, float(row['Tendencia_Sobrepeso'])),
            max(0.0, float(row['Tendencia_Obesidade'])),
        ])
        total = float(valores.sum())
        if total > 0:
            valores = (valores / total) * 100
        else:
            valores = np.array([2.0, 3.0, 70.0, 15.0, 10.0])

        df.at[idx, 'Tendencia_Desnutricao'] = float(np.round(valores[0], 2))
        df.at[idx, 'Tendencia_Magreza'] = float(np.round(valores[1], 2))
        df.at[idx, 'Tendencia_Eutrofia'] = float(np.round(valores[2], 2))
        df.at[idx, 'Tendencia_Sobrepeso'] = float(np.round(valores[3], 2))
        df.at[idx, 'Tendencia_Obesidade'] = float(np.round(valores[4], 2))

    return df


def gerar_projecoes(df_master, modelos):
    max_ano = int(df_master['Ano'].max())
    df_anchor = df_master[df_master['Ano'] == max_ano].copy()

    df_proj1 = df_anchor.copy()
    df_proj1['Ano'] = max_ano + 1
    df_proj1['Status'] = 'PREVISÃO FUTURA'

    for nome, info in modelos.items():
        anterior = {
            'obesidade': 'Obesidade_Ano_Anterior',
            'desnutricao': 'Desnutricao_Ano_Anterior',
            'magreza': 'Magreza_Ano_Anterior',
            'sobrepeso': 'Sobrepeso_Ano_Anterior',
            'eutrofia': 'Eutrofia_Ano_Anterior',
        }[nome]
        tendencia = {
            'obesidade': 'Tendencia_Obesidade',
            'desnutricao': 'Tendencia_Desnutricao',
            'magreza': 'Tendencia_Magreza',
            'sobrepeso': 'Tendencia_Sobrepeso',
            'eutrofia': 'Tendencia_Eutrofia',
        }[nome]
        delta_col = {
            'obesidade': 'Delta_Predito_Obesidade',
            'desnutricao': 'Delta_Predito_Desnutricao',
            'magreza': 'Delta_Predito_Magreza',
            'sobrepeso': 'Delta_Predito_Sobrepeso',
            'eutrofia': 'Delta_Predito_Eutrofia',
        }[nome]

        df_proj1[anterior] = df_anchor[tendencia]
        df_proj1[delta_col] = info['modelo'].predict(df_proj1[info['features']])
        df_proj1[tendencia] = df_proj1[anterior] + df_proj1[delta_col]

    df_proj1 = normalizar_percentuais(df_proj1)

    df_proj2 = df_proj1.copy()
    df_proj2['Ano'] = max_ano + 2
    df_proj2['Status'] = 'PREVISÃO FUTURA'

    for nome, info in modelos.items():
        anterior = {
            'obesidade': 'Obesidade_Ano_Anterior',
            'desnutricao': 'Desnutricao_Ano_Anterior',
            'magreza': 'Magreza_Ano_Anterior',
            'sobrepeso': 'Sobrepeso_Ano_Anterior',
            'eutrofia': 'Eutrofia_Ano_Anterior',
        }[nome]
        tendencia = {
            'obesidade': 'Tendencia_Obesidade',
            'desnutricao': 'Tendencia_Desnutricao',
            'magreza': 'Tendencia_Magreza',
            'sobrepeso': 'Tendencia_Sobrepeso',
            'eutrofia': 'Tendencia_Eutrofia',
        }[nome]
        delta_col = {
            'obesidade': 'Delta_Predito_Obesidade',
            'desnutricao': 'Delta_Predito_Desnutricao',
            'magreza': 'Delta_Predito_Magreza',
            'sobrepeso': 'Delta_Predito_Sobrepeso',
            'eutrofia': 'Delta_Predito_Eutrofia',
        }[nome]

        df_proj2[anterior] = df_proj1[tendencia]
        df_proj2[delta_col] = info['modelo'].predict(df_proj2[info['features']])
        df_proj2[tendencia] = df_proj2[anterior] + df_proj2[delta_col]

    df_proj2 = normalizar_percentuais(df_proj2)

    df_hist = df_master.copy()
    df_hist['Status'] = 'DADO HISTÓRICO'
    df_hist['Delta_Predito_Obesidade'] = 0.0
    df_hist['Delta_Predito_Desnutricao'] = 0.0
    df_hist['Delta_Predito_Magreza'] = 0.0
    df_hist['Delta_Predito_Sobrepeso'] = 0.0
    df_hist['Delta_Predito_Eutrofia'] = 0.0

    return pd.concat([df_hist, df_proj1, df_proj2], ignore_index=True)


def _get_supabase_headers():
    """Autentica no Supabase e retorna os headers prontos para uso via REST API.
    Segue o mesmo padrão de autenticação de fetch_supabase_snapshot em supabase_data.py.
    """
    config = get_supabase_config()
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
    return {
        'apikey': config['anon_key'],
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
    }, config['url']


def upsert_previsoes_supabase(df, tipo_projecao):
    """Faz upsert do DataFrame na tabela previsoes_nutricionais do Supabase.

    Usa requests puro via REST API, seguindo o mesmo padrão de supabase_data.py.
    A chave de conflito esperada na tabela é (cnes, ano, faixa_etaria_cod, status, tipo_projecao).
    'tipo_projecao' diferencia as duas projeções ('obesidade' | 'desnutricao') na mesma tabela.
    """
    BATCH_SIZE = 500

    registros = []
    for _, row in df.iterrows():
        registros.append({
            'cnes':                      str(row['CNES']),
            'ano':                       int(row['Ano']),
            'faixa_etaria_cod':          int(row['Faixa_Etaria_Cod']),
            'status':                    str(row['Status']),
            'tipo_projecao':             tipo_projecao,
            'magreza_acentuada_pct':     float(row.get('Magreza_Acentuada_Pct', 0.0) or 0.0),
            'magreza_pct':               float(row.get('Magreza_Pct', 0.0) or 0.0),
            'eutrofia_pct':              float(row.get('Eutrofia_Pct', 0.0) or 0.0),
            'sobrepeso_pct':             float(row.get('Sobrepeso_Pct', 0.0) or 0.0),
            'obesidade_pct':             float(row.get('Obesidade_Pct', 0.0) or 0.0),
            'obesidade_grave_pct':       float(row.get('Obesidade_Grave_Pct', 0.0) or 0.0),
            'delta_predito':             float(row.get('Delta_Predito', 0.0) or 0.0),
            'delta_predito_obesidade':   float(row.get('Delta_Predito_Obesidade', 0.0) or 0.0),
            'delta_predito_desnutricao': float(row.get('Delta_Predito_Desnutricao', 0.0) or 0.0),
            'delta_predito_magreza':     float(row.get('Delta_Predito_Magreza', 0.0) or 0.0),
            'delta_predito_sobrepeso':   float(row.get('Delta_Predito_Sobrepeso', 0.0) or 0.0),
            'delta_predito_eutrofia':    float(row.get('Delta_Predito_Eutrofia', 0.0) or 0.0),
        })

    try:
        headers, base_url = _get_supabase_headers()
    except Exception as e:
        print(f"[ERRO] Falha na autenticação Supabase para upsert '{tipo_projecao}': {e}")
        return

    url = f"{base_url}/rest/v1/previsoes_nutricionais"
    total = len(registros)
    erros = 0
    for i in range(0, total, BATCH_SIZE):
        lote = registros[i:i + BATCH_SIZE]
        try:
            response = requests.post(url, headers=headers, json=lote, timeout=30)
            response.raise_for_status()
        except Exception as e:
            erros += 1
            print(f"[ERRO] Upsert lote {i // BATCH_SIZE + 1} ({tipo_projecao}): {e}")

    if erros == 0:
        print(f"[OK] Upsert '{tipo_projecao}': {total} registros gravados em previsoes_nutricionais.")
    else:
        print(f"[AVISO] Upsert '{tipo_projecao}': {total} registros, {erros} lote(s) com erro.")


def run_pipeline(df_master=None):
    if df_master is None:
        df_master = build_master_dataset()

    df_master = df_master.copy()
    df_master['Ano'] = pd.to_numeric(df_master['Ano'], errors='coerce')

    if df_master.empty or df_master['Ano'].isna().all():
        raise ValueError(
            'Nenhum dado histórico disponível para treinar o ML. '
            'Confirme se o Supabase retornou registros_saude e se o CSV Base_Nutricional_Consolidada_Final.csv não está vazio.'
        )

    df_master = criar_tendencias(df_master)

    modelos = {}
    metricas_consolidadas = {}
    for nome, anterior, delta in [
        ('desnutricao', 'Desnutricao_Ano_Anterior', 'Delta_Desnutricao'),
        ('magreza', 'Magreza_Ano_Anterior', 'Delta_Magreza'),
        ('sobrepeso', 'Sobrepeso_Ano_Anterior', 'Delta_Sobrepeso'),
        ('eutrofia', 'Eutrofia_Ano_Anterior', 'Delta_Eutrofia'),
        ('obesidade', 'Obesidade_Ano_Anterior', 'Delta_Obesidade'),
    ]:
        modelo, features, metrics = treinar_modelo_indicador(df_master, anterior, delta, nome)
        modelos[nome] = {'modelo': modelo, 'features': features}
        metricas_consolidadas[nome] = metrics

    # Salva as métricas de validação cruzada do modelo em um arquivo JSON
    caminho_metricas = obter_caminho_salvamento('NutriAlerta_ML_Metricas.json')
    try:
        with open(caminho_metricas, 'w', encoding='utf-8') as f:
            json.dump(metricas_consolidadas, f, indent=2, ensure_ascii=False)
        print(f"[OK] Métricas de validação salvas em {caminho_metricas}")
    except Exception as e:
        print(f"[ERRO] Falha ao salvar arquivo de métricas: {e}")

    df_consolidado = gerar_projecoes(df_master, modelos)

    df_final_futura = df_consolidado.copy()
    df_final_futura['Magreza_Acentuada_Pct'] = df_final_futura['Tendencia_Desnutricao']
    df_final_futura['Magreza_Pct'] = df_final_futura['Tendencia_Magreza']
    df_final_futura['Eutrofia_Pct'] = df_final_futura['Tendencia_Eutrofia']
    df_final_futura['Sobrepeso_Pct'] = df_final_futura['Tendencia_Sobrepeso']
    df_final_futura['Obesidade_Pct'] = df_final_futura['Tendencia_Obesidade']
    if 'Obesidade_Grave_Pct' in df_final_futura.columns:
        future_mask = df_final_futura['Status'] == 'PREVISÃO FUTURA'
        df_final_futura.loc[future_mask, 'Obesidade_Grave_Pct'] = 0.0

    df_final_futura['Delta_Predito'] = df_final_futura.get('Delta_Predito_Obesidade', 0.0)
    df_final_futura['Delta_Obesidade'] = df_final_futura['Delta_Predito_Obesidade']

    upsert_previsoes_supabase(df_final_futura, tipo_projecao='obesidade')

    df_final_desnutricao = df_consolidado.copy()
    df_final_desnutricao['Magreza_Acentuada_Pct'] = df_final_desnutricao['Tendencia_Desnutricao']
    df_final_desnutricao['Magreza_Pct'] = df_final_desnutricao['Tendencia_Magreza']
    df_final_desnutricao['Eutrofia_Pct'] = df_final_desnutricao['Tendencia_Eutrofia']
    df_final_desnutricao['Sobrepeso_Pct'] = df_final_desnutricao['Tendencia_Sobrepeso']
    df_final_desnutricao['Obesidade_Pct'] = df_final_desnutricao['Tendencia_Obesidade']
    if 'Obesidade_Grave_Pct' in df_final_desnutricao.columns:
        future_mask = df_final_desnutricao['Status'] == 'PREVISÃO FUTURA'
        df_final_desnutricao.loc[future_mask, 'Obesidade_Grave_Pct'] = 0.0

    df_final_desnutricao['Delta_Predito'] = df_final_desnutricao['Delta_Predito_Desnutricao']
    df_final_desnutricao['Delta_Desnutricao'] = df_final_desnutricao['Delta_Predito_Desnutricao']

    upsert_previsoes_supabase(df_final_desnutricao, tipo_projecao='desnutricao')

    print('[OK] Upsert concluído para projeções de obesidade e desnutricao no Supabase.')
    return df_consolidado


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--watch', action='store_true', help='Executa o pipeline em loop e reexecuta quando houver mudança nos dados.')
    parser.add_argument('--interval', type=int, default=60)
    args = parser.parse_args()

    if not args.watch:
        run_pipeline()
        return

    ultimo_hash = None
    while True:
        try:
            df_master = build_master_dataset()
            signature = str(pd.util.hash_pandas_object(df_master, index=True).sum())
            if signature != ultimo_hash:
                run_pipeline(df_master)
                ultimo_hash = signature
            print(f'[watch] aguardando nova atualização ({args.interval}s)')
        except Exception as exc:
            print(f'[watch] erro ao sincronizar: {exc}')
        time.sleep(args.interval)


if __name__ == '__main__':
    main()
