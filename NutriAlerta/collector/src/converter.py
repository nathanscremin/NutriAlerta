"""
converter.py
============
Responsável pela persistência dos dados limpos em formato Apache Parquet,
utilizando o motor PyArrow para eficiência de armazenamento e leitura.

Estratégias de escrita:
- **overwrite**: Substitui completamente o arquivo Parquet existente.
  Usada na carga histórica (first run).
- **append**: Lê o arquivo existente, concatena com os novos dados e reescreve.
  Usada na carga incremental para preservar o histórico acumulado.
"""

import logging
import os

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

logger = logging.getLogger(__name__)


def salvar_parquet(df: pd.DataFrame, caminho: str) -> None:
    """
    Salva o DataFrame em formato Parquet, sobrescrevendo qualquer arquivo
    existente no caminho informado (modo 'overwrite').

    Usado na carga histórica (first run) para criar o repositório inicial.

    Args:
        df (pd.DataFrame): DataFrame limpo a ser persistido.
        caminho (str): Caminho completo do arquivo Parquet de destino.
                       Ex: 'data/processed/dados_finais.parquet'

    Raises:
        ValueError: Se o DataFrame estiver vazio.
    """
    if df.empty:
        raise ValueError("Não é possível salvar um DataFrame vazio no Parquet.")

    _garantir_diretorio(caminho)

    tabela_arrow = pa.Table.from_pandas(df, preserve_index=False)
    pq.write_table(tabela_arrow, caminho, compression="snappy")

    tamanho_mb = os.path.getsize(caminho) / (1024 * 1024)
    logger.info(
        "Parquet salvo (overwrite): '%s' | %d registros | %.2f MB",
        caminho,
        len(df),
        tamanho_mb,
    )


def append_parquet(df_novo: pd.DataFrame, caminho: str) -> int:
    """
    Adiciona novos dados ao arquivo Parquet existente (modo 'append').

    Lê o arquivo Parquet atual, concatena com os novos dados e reescreve.
    Garante que não haja duplicatas entre os dados existentes e os novos.

    Usado na carga incremental para atualizar o repositório sem apagar o histórico.

    Args:
        df_novo (pd.DataFrame): DataFrame com os novos registros a adicionar.
        caminho (str): Caminho completo do arquivo Parquet existente.

    Returns:
        int: Total de registros no arquivo Parquet após o append.

    Raises:
        ValueError: Se df_novo estiver vazio.
    """
    if df_novo.empty:
        raise ValueError("DataFrame de novos dados está vazio. Append cancelado.")

    _garantir_diretorio(caminho)

    if os.path.exists(caminho):
        logger.info("Lendo Parquet existente para append: '%s'", caminho)
        df_existente = pq.read_table(caminho).to_pandas()
        total_existente = len(df_existente)
        logger.info("  Registros existentes: %d", total_existente)

        df_consolidado = pd.concat([df_existente, df_novo], ignore_index=True)
        chave_dedup = "codigo_sequencial_acompanhamento"
        if chave_dedup in df_consolidado.columns:
            df_consolidado = df_consolidado.drop_duplicates(
                subset=[chave_dedup], keep="last"
            )
        else:
            df_consolidado = df_consolidado.drop_duplicates()

        duplicatas_removidas = len(df_existente) + len(df_novo) - len(df_consolidado)
        if duplicatas_removidas > 0:
            logger.info(
                "  Duplicatas removidas no append: %d", duplicatas_removidas
            )
    else:
        logger.info(
            "Arquivo Parquet não encontrado. Criando novo via append: '%s'", caminho
        )
        df_consolidado = df_novo

    tabela_arrow = pa.Table.from_pandas(df_consolidado, preserve_index=False)
    pq.write_table(tabela_arrow, caminho, compression="snappy")

    tamanho_mb = os.path.getsize(caminho) / (1024 * 1024)
    total_final = len(df_consolidado)
    logger.info(
        "Parquet atualizado (append): '%s' | %d registros totais | %.2f MB",
        caminho,
        total_final,
        tamanho_mb,
    )
    return total_final


def salvar_csv_bruto(df: pd.DataFrame, caminho: str) -> None:
    """
    Salva o DataFrame bruto em formato CSV para auditoria e backup.

    Usado logo após a extração, antes da limpeza, para preservar os dados
    originais conforme a especificação do PRD.

    Args:
        df (pd.DataFrame): DataFrame com os dados brutos da API.
        caminho (str): Caminho completo do arquivo CSV de destino.
                       Ex: 'data/raw/dados_brutos_202401.csv'
    """
    if df.empty:
        logger.warning("DataFrame vazio. Arquivo CSV bruto não será salvo.")
        return

    _garantir_diretorio(caminho)
    df.to_csv(caminho, index=False, encoding="utf-8-sig")

    tamanho_kb = os.path.getsize(caminho) / 1024
    logger.info(
        "CSV bruto salvo: '%s' | %d registros | %.1f KB",
        caminho,
        len(df),
        tamanho_kb,
    )


def _garantir_diretorio(caminho_arquivo: str) -> None:
    """
    Cria o diretório pai do arquivo caso ele não exista.

    Args:
        caminho_arquivo (str): Caminho completo do arquivo alvo.
    """
    diretorio = os.path.dirname(os.path.abspath(caminho_arquivo))
    os.makedirs(diretorio, exist_ok=True)
