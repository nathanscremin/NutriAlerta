"""
cleaner.py
==========
Limpeza e organização dos dados SISVAN Estado Nutricional.

Os registros podem vir desordenados da API. Este módulo:
- Padroniza colunas e tipos
- Deriva ano/mês a partir de ano_mes_competencia
- Remove nulos críticos, duplicatas e idades inválidas (> 18 anos)
- Ordena por ano e mês de competência
"""

import logging

import pandas as pd

logger = logging.getLogger(__name__)

IDADE_MAXIMA_PROJETO = 18

COLUNAS_CRITICAS = [
    "codigo_municipio",
    "uf",
    "idade_anos",
    "ano_mes_competencia",
]

MAPEAMENTO_COLUNAS = {
    "codigo_municipio": "codigo_municipio",
    "uf": "uf",
    "municipio": "municipio",
    "codigo_cnes": "codigo_cnes",
    "idade": "idade_anos",
    "codigo_fase_vida": "codigo_fase_vida",
    "fase_vida": "descricao_fase_vida",
    "sexo": "sexo",
    "codigo_raca_cor": "codigo_raca_cor",
    "raca_cor": "raca_cor",
    "codigo_povo_comunidade": "codigo_povo_comunidade",
    "povo_comunidade": "povo_comunidade",
    "status_participacao": "status_participacao",
    "ano_mes_competencia": "ano_mes_competencia",
    "data_acompanhamento": "data_acompanhamento",
}


def limpar(
    df: pd.DataFrame,
    idade_minima: int = 0,
    idade_maxima: int = IDADE_MAXIMA_PROJETO,
    competencia_minima: str | None = None,
    competencia_maxima: str | None = None,
) -> pd.DataFrame:
    """
    Aplica o pipeline completo de limpeza e organização.

    Args:
        df (pd.DataFrame): Dados brutos da API.
        idade_minima (int): Idade mínima aceita após validação local.
        idade_maxima (int): Idade máxima aceita (limitada a 18 anos no projeto).
        competencia_minima (str | None): Mantém competências >= este YYYYMM.
        competencia_maxima (str | None): Mantém competências <= este YYYYMM.

    Returns:
        pd.DataFrame: Dados limpos, ordenados por ano e mês.
    """
    if df.empty:
        logger.warning("DataFrame de entrada vazio. Nada a limpar.")
        return df

    idade_maxima = min(idade_maxima, IDADE_MAXIMA_PROJETO)
    total_inicial = len(df)
    logger.info("Iniciando limpeza... (%d registros recebidos)", total_inicial)

    df = _renomear_colunas(df)
    df = _normalizar_competencia(df)
    df = _remover_duplicatas(df)
    df = _converter_tipos(df)
    df = _filtrar_por_competencia(df, competencia_minima, competencia_maxima)
    df = _remover_nulos_criticos(df)
    df = _validar_faixa_etaria(df, idade_minima, idade_maxima)
    df = _organizar_por_ano(df)

    total_final = len(df)
    removidos = total_inicial - total_final
    logger.info(
        "Limpeza concluída: %d válidos | %d removidos (%.1f%%).",
        total_final,
        removidos,
        (removidos / total_inicial * 100) if total_inicial > 0 else 0,
    )
    return df


def obter_ultima_competencia(df: pd.DataFrame) -> str | None:
    """
    Retorna a maior competência (YYYYMM) presente no DataFrame limpo.

    Args:
        df (pd.DataFrame): DataFrame já limpo.

    Returns:
        str | None: Competência máxima ou None se ausente.
    """
    if df.empty or "ano_mes_competencia" not in df.columns:
        return None
    return str(df["ano_mes_competencia"].max())


def _renomear_colunas(df: pd.DataFrame) -> pd.DataFrame:
    """Padroniza nomes de colunas para snake_case."""
    df = df.rename(columns=MAPEAMENTO_COLUNAS)
    df.columns = [col.lower().replace(" ", "_") for col in df.columns]
    return df


def _normalizar_competencia(df: pd.DataFrame) -> pd.DataFrame:
    """
    Garante ano_mes_competencia válido e deriva colunas ano e mes.

    Args:
        df (pd.DataFrame): DataFrame com possível coluna ano_mes_competencia.

    Returns:
        pd.DataFrame: Com ano_mes_competencia, ano e mes preenchidos quando possível.
    """
    if "ano_mes_competencia" not in df.columns:
        logger.warning(
            "Coluna 'ano_mes_competencia' ausente. Organização por ano limitada."
        )
        return df

    competencia_numerica = pd.to_numeric(
        df["ano_mes_competencia"], errors="coerce"
    )
    competencia_texto = competencia_numerica.apply(
        lambda valor: f"{int(valor):06d}" if pd.notna(valor) else ""
    )
    competencia_valida = competencia_texto.str.match(r"^\d{6}$")
    invalidos = (~competencia_valida).sum()
    if invalidos > 0:
        logger.info("  Competências inválidas descartadas: %d", invalidos)

    df = df.loc[competencia_valida].copy()
    df["ano_mes_competencia"] = competencia_texto.loc[competencia_valida].to_numpy()
    df["ano"] = df["ano_mes_competencia"].str[:4].astype(int)
    df["mes"] = df["ano_mes_competencia"].str[4:6].astype(int)

    return df


def _filtrar_por_competencia(
    df: pd.DataFrame,
    competencia_minima: str | None,
    competencia_maxima: str | None,
) -> pd.DataFrame:
    """Filtra registros fora da janela de competência desejada."""
    if df.empty or "ano_mes_competencia" not in df.columns:
        return df

    antes = len(df)
    if competencia_minima:
        df = df[df["ano_mes_competencia"] >= str(competencia_minima)]
    if competencia_maxima:
        df = df[df["ano_mes_competencia"] <= str(competencia_maxima)]

    removidos = antes - len(df)
    if removidos > 0:
        logger.info(
            "  Registros fora da janela de competência removidos: %d", removidos
        )
    return df


def _remover_duplicatas(df: pd.DataFrame) -> pd.DataFrame:
    """Remove linhas duplicadas (prioriza ID sequencial da API quando existir)."""
    antes = len(df)
    if "codigo_sequencial_acompanhamento" in df.columns:
        df = df.drop_duplicates(subset=["codigo_sequencial_acompanhamento"], keep="last")
    else:
        df = df.drop_duplicates()
    removidos = antes - len(df)
    if removidos > 0:
        logger.info("  Duplicatas removidas: %d", removidos)
    return df


def _converter_tipos(df: pd.DataFrame) -> pd.DataFrame:
    """Converte colunas para tipos adequados."""
    colunas_numericas = [
        "codigo_municipio",
        "codigo_cnes",
        "idade_anos",
        "codigo_fase_vida",
        "codigo_povo_comunidade",
        "codigo_sequencial_acompanhamento",
        "ano",
        "mes",
        "peso",
        "altura",
        "imc",
    ]
    colunas_decimal_texto = ["peso", "altura", "imc"]
    for coluna in colunas_decimal_texto:
        if coluna in df.columns:
            df[coluna] = (
                df[coluna]
                .astype(str)
                .str.replace(",", ".", regex=False)
                .replace({"NAN": None, "NONE": None, "": None})
            )
    colunas_data = ["data_acompanhamento"]
    colunas_texto = [
        "uf",
        "municipio",
        "descricao_fase_vida",
        "sexo",
        "raca_cor",
        "povo_comunidade",
        "ano_mes_competencia",
    ]

    for coluna in colunas_numericas:
        if coluna in df.columns:
            df[coluna] = pd.to_numeric(df[coluna], errors="coerce")

    for coluna in colunas_data:
        if coluna in df.columns:
            df[coluna] = pd.to_datetime(df[coluna], errors="coerce")

    for coluna in colunas_texto:
        if coluna in df.columns:
            df[coluna] = df[coluna].astype(str).str.strip().str.upper()

    return df


def _remover_nulos_criticos(df: pd.DataFrame) -> pd.DataFrame:
    """Remove registros com nulos em colunas críticas."""
    colunas_presentes = [c for c in COLUNAS_CRITICAS if c in df.columns]
    if not colunas_presentes:
        logger.warning(
            "Nenhuma coluna crítica encontrada. Colunas: %s", list(df.columns)
        )
        return df

    antes = len(df)
    df = df.dropna(subset=colunas_presentes)
    removidos = antes - len(df)
    if removidos > 0:
        logger.info("  Removidos por nulos críticos: %d", removidos)
    return df


def _validar_faixa_etaria(
    df: pd.DataFrame, idade_minima: int, idade_maxima: int
) -> pd.DataFrame:
    """
    Remove idades inválidas: negativas, acima do teto do projeto (18) ou fora da faixa.

    A API já filtra por idade_minima/idade_maxima, mas os dados podem vir inconsistentes.
    """
    if "idade_anos" not in df.columns:
        logger.warning("Coluna 'idade_anos' ausente. Validação de idade ignorada.")
        return df

    antes = len(df)
    teto = min(idade_maxima, IDADE_MAXIMA_PROJETO)
    mask_valida = df["idade_anos"].between(idade_minima, teto, inclusive="both")
    df = df[mask_valida]

    removidos = antes - len(df)
    if removidos > 0:
        logger.info(
            "  Registros com idade inválida removidos (%d–%d anos, máx. %d): %d",
            idade_minima,
            idade_maxima,
            IDADE_MAXIMA_PROJETO,
            removidos,
        )
    return df


def _organizar_por_ano(df: pd.DataFrame) -> pd.DataFrame:
    """
    Ordena os dados por ano, mês e idade para facilitar análise.

    Args:
        df (pd.DataFrame): DataFrame já validado.

    Returns:
        pd.DataFrame: DataFrame ordenado.
    """
    colunas_ordenacao = [
        c for c in ("ano", "mes", "ano_mes_competencia", "idade_anos")
        if c in df.columns
    ]
    if not colunas_ordenacao:
        return df

    df = df.sort_values(colunas_ordenacao, kind="stable").reset_index(drop=True)

    if "ano" in df.columns:
        anos = df["ano"].dropna().unique()
        logger.info(
            "  Dados organizados por ano | %d–%d | %d ano(s) distintos.",
            int(anos.min()),
            int(anos.max()),
            len(anos),
        )
    return df


def agregar_para_modelo(df_limpo: pd.DataFrame, df_ubs_caminho: str, base_existente_caminho: str) -> None:
    """
    Agrega os dados de visitas brutas do SISVAN no formato consolidado da Base_Nutricional_Consolidada_Final.csv,
    e faz o upsert (atualização) na base histórica existente.
    """
    import os
    import numpy as np

    if df_limpo.empty:
        logger.warning("DataFrame vazio na agregação para o modelo.")
        return

    # 1. Carregar base de UBSs para mapear EAS (nome da unidade)
    try:
        df_ubs = pd.read_csv(df_ubs_caminho)
        df_ubs['cnes'] = df_ubs['cnes'].astype(str).str.strip()
        mapeamento_eas = dict(zip(df_ubs['cnes'], df_ubs['nome']))
    except Exception as e:
        logger.error("Erro ao carregar base de UBSs para mapeamento de EAS: %s", e)
        mapeamento_eas = {}

    # 2. Derivar a coluna faixa_etaria no df_limpo
    df_limpo = df_limpo.copy()
    df_limpo['codigo_cnes'] = df_limpo['codigo_cnes'].astype(str).str.strip().str.split('.').str[0]
    
    # Limpar classificações para evitar problemas de acentuação/case
    for col in ['peso_x_idade', 'crianca_imc_x_idade', 'adolescente_imc_x_idade']:
        if col in df_limpo.columns:
            df_limpo[col] = df_limpo[col].astype(str).str.strip().str.upper()

    agregados = []

    # Gerar para as 3 faixas etárias
    for faixa, cond in [
        ('0 a 5 anos', df_limpo['idade_anos'].between(0, 5)),
        ('6 a 10 anos', df_limpo['idade_anos'].between(6, 10)),
        ('10 a 19 anos', df_limpo['idade_anos'].between(11, 19))
    ]:
        df_faixa = df_limpo[cond]
        if df_faixa.empty:
            continue
            
        grouped = df_faixa.groupby(['codigo_cnes', 'ano'])
        
        for (cnes, ano), group in grouped:
            total = len(group)
            if total == 0:
                continue
                
            # Dicionário base com os metadados comuns
            row = {
                'UF': group['uf'].iloc[0] if 'uf' in group.columns else 'SP',
                'IBGE': int(group['codigo_municipio'].iloc[0]) if 'codigo_municipio' in group.columns else 354390,
                'Municipio': group['municipio'].iloc[0] if 'municipio' in group.columns else 'RIO CLARO',
                'CNES': cnes,
                'EAS': mapeamento_eas.get(cnes, f"UBS CNES {cnes}"),
                'Total': float(total),
                'Local': 'SP',
                'Ano': int(ano),
                'Faixa_Etaria': faixa
            }
            
            # Inicializar todas as colunas de quantidade e porcentagem
            colunas_qtd_pct = [
                'Peso_Muito_Baixo_Quantidade', 'Peso_Muito_Baixo_Porcentagem',
                'Peso_Baixo_Quantidade', 'Peso_Baixo_Porcentagem',
                'Peso_Adequado_Quantidade', 'Peso_Adequado_Porcentagem',
                'Peso_Elevado_Quantidade', 'Peso_Elevado_Porcentagem',
                'Magreza_Acentuada_Qtd', 'Magreza_Acentuada_Pct',
                'Magreza_Qtd', 'Magreza_Pct',
                'Eutrofia_Qtd', 'Eutrofia_Pct',
                'Sobrepeso_Qtd', 'Sobrepeso_Pct',
                'Obesidade_Qtd', 'Obesidade_Pct',
                'Obesidade_Grave_Qtd', 'Obesidade_Grave_Pct'
            ]
            for col in colunas_qtd_pct:
                row[col] = np.nan
                
            if faixa in ('0 a 5 anos', '6 a 10 anos'):
                # Contar categorias de peso_x_idade
                contagens = group['peso_x_idade'].value_counts() if 'peso_x_idade' in group.columns else pd.Series()
                
                muito_baixo = float(contagens.get('MUITO BAIXO PESO PARA A IDADE', 0.0) or contagens.filter(like='MUITO BAIXO').sum())
                baixo = float(contagens.get('BAIXO PESO PARA A IDADE', 0.0) or contagens.filter(like='BAIXO PESO').sum())
                adequado = float(contagens.get('PESO ADEQUADO PARA A IDADE', 0.0) or contagens.filter(like='PESO ADEQUADO').sum())
                elevado = float(contagens.get('PESO ELEVADO PARA A IDADE', 0.0) or contagens.filter(like='PESO ELEVADO').sum())
                
                total_validos = muito_baixo + baixo + adequado + elevado
                if total_validos > 0:
                    row['Total'] = total_validos
                    row['Peso_Muito_Baixo_Quantidade'] = muito_baixo
                    row['Peso_Muito_Baixo_Porcentagem'] = muito_baixo / total_validos * 100
                    row['Peso_Baixo_Quantidade'] = baixo
                    row['Peso_Baixo_Porcentagem'] = baixo / total_validos * 100
                    row['Peso_Adequado_Quantidade'] = adequado
                    row['Peso_Adequado_Porcentagem'] = adequado / total_validos * 100
                    row['Peso_Elevado_Quantidade'] = elevado
                    row['Peso_Elevado_Porcentagem'] = elevado / total_validos * 100
                    agregados.append(row)
                    
            elif faixa == '10 a 19 anos':
                # Contar categorias de adolescente_imc_x_idade
                contagens = group['adolescente_imc_x_idade'].value_counts() if 'adolescente_imc_x_idade' in group.columns else pd.Series()
                
                magreza_ac = float(contagens.get('MAGREZA ACENTUADA', 0.0) or contagens.filter(like='ACENTUADA').sum())
                magreza = float(contagens.get('MAGREZA', 0.0) or contagens.filter(like='MAGREZA').sum() - magreza_ac)
                eutrofia = float(contagens.get('EUTROFIA', 0.0) or contagens.filter(like='EUTROFIA').sum())
                sobrepeso = float(contagens.get('SOBREPESO', 0.0) or contagens.filter(like='SOBREPESO').sum())
                obesidade = float(contagens.get('OBESIDADE', 0.0) or contagens.filter(like='OBESIDADE').sum() - contagens.filter(like='GRAVE').sum())
                obesidade_gr = float(contagens.get('OBESIDADE GRAVE', 0.0) or contagens.filter(like='GRAVE').sum())
                
                total_validos = magreza_ac + magreza + eutrofia + sobrepeso + obesidade + obesidade_gr
                if total_validos > 0:
                    row['Total'] = total_validos
                    row['Magreza_Acentuada_Qtd'] = magreza_ac
                    row['Magreza_Acentuada_Pct'] = magreza_ac / total_validos * 100
                    row['Magreza_Qtd'] = magreza
                    row['Magreza_Pct'] = magreza / total_validos * 100
                    row['Eutrofia_Qtd'] = eutrofia
                    row['Eutrofia_Pct'] = eutrofia / total_validos * 100
                    row['Sobrepeso_Qtd'] = sobrepeso
                    row['Sobrepeso_Pct'] = sobrepeso / total_validos * 100
                    row['Obesidade_Qtd'] = obesidade
                    row['Obesidade_Pct'] = obesidade / total_validos * 100
                    row['Obesidade_Grave_Qtd'] = obesidade_gr
                    row['Obesidade_Grave_Pct'] = obesidade_gr / total_validos * 100
                    agregados.append(row)

    if not agregados:
        logger.warning("Nenhum registro foi agregado.")
        return

    df_novos_agregados = pd.DataFrame(agregados)
    df_novos_agregados['CNES'] = df_novos_agregados['CNES'].astype(str)
    df_novos_agregados['Ano'] = df_novos_agregados['Ano'].astype(int)
    df_novos_agregados['Faixa_Etaria'] = df_novos_agregados['Faixa_Etaria'].astype(str)

    # 3. Upsert com a base existente
    if os.path.exists(base_existente_caminho):
        logger.info("Mesclando dados novos com a base existente: '%s'", base_existente_caminho)
        df_existente = pd.read_csv(base_existente_caminho)
        df_existente['CNES'] = df_existente['CNES'].astype(str).str.strip().str.split('.').str[0]
        df_existente['Ano'] = df_existente['Ano'].astype(int)
        df_existente['Faixa_Etaria'] = df_existente['Faixa_Etaria'].astype(str)
        
        chaves_novas = set(zip(df_novos_agregados['CNES'], df_novos_agregados['Ano'], df_novos_agregados['Faixa_Etaria']))
        
        mask_existente_manter = df_existente.apply(
            lambda r: (str(r['CNES']), int(r['Ano']), str(r['Faixa_Etaria'])) not in chaves_novas,
            axis=1
        )
        df_existente_filtrado = df_existente[mask_existente_manter]
        
        df_final = pd.concat([df_existente_filtrado, df_novos_agregados], ignore_index=True)
    else:
        logger.info("Criando nova base consolidada: '%s'", base_existente_caminho)
        df_final = df_novos_agregados

    # Ordenar colunas
    ordem_colunas = [
        'UF', 'IBGE', 'Municipio', 'CNES', 'EAS',
        'Peso_Muito_Baixo_Quantidade', 'Peso_Muito_Baixo_Porcentagem',
        'Peso_Baixo_Quantidade', 'Peso_Baixo_Porcentagem',
        'Peso_Adequado_Quantidade', 'Peso_Adequado_Porcentagem',
        'Peso_Elevado_Quantidade', 'Peso_Elevado_Porcentagem',
        'Total', 'Local', 'Ano', 'Faixa_Etaria',
        'Magreza_Acentuada_Qtd', 'Magreza_Acentuada_Pct',
        'Magreza_Qtd', 'Magreza_Pct',
        'Eutrofia_Qtd', 'Eutrofia_Pct',
        'Sobrepeso_Qtd', 'Sobrepeso_Pct',
        'Obesidade_Qtd', 'Obesidade_Pct',
        'Obesidade_Grave_Qtd', 'Obesidade_Grave_Pct'
    ]
    for col in ordem_colunas:
        if col not in df_final.columns:
            df_final[col] = np.nan
            
    df_final = df_final[ordem_colunas]
    df_final = df_final.sort_values(by=['CNES', 'Ano', 'Faixa_Etaria']).reset_index(drop=True)
    
    os.makedirs(os.path.dirname(os.path.abspath(base_existente_caminho)), exist_ok=True)
    df_final.to_csv(base_existente_caminho, index=False)
    logger.info("Base consolidada final atualizada com sucesso! Total de linhas: %d", len(df_final))

