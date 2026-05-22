"""
state_manager.py
================
Gerencia o estado de execução do pipeline ETL via arquivo state.json.

O state.json armazena a "watermark" — a última competência (ano/mês) processada
com sucesso. Isso permite diferenciar a carga histórica (first run) da incremental.

Estrutura do state.json:
{
    "ultima_competencia": "202312",  # Último YYYYMM processado
    "total_linhas_processadas": 15000,
    "ultima_execucao": "2024-01-01T00:00:00"
}
"""

import json
import logging
import os
from datetime import datetime, timezone

from .paths import CAMINHO_PARQUET, CAMINHO_STATE

logger = logging.getLogger(__name__)


def _parquet_existe() -> bool:
    """Verifica se o repositório Parquet final já foi criado."""
    caminho = os.path.abspath(CAMINHO_PARQUET)
    return os.path.isfile(caminho) and os.path.getsize(caminho) > 0


def is_first_run() -> bool:
    """
    Verifica se este é a primeira execução do pipeline.

    Conforme o PRD (seção 9.1), a carga histórica é disparada quando não há
    arquivos em data/processed ou quando o state.json está ausente/inválido.

    Returns:
        bool: True para carga histórica, False para carga incremental.
    """
    if not _parquet_existe():
        logger.info(
            "Nenhum Parquet em data/processed — modo: Carga Histórica (First Run)."
        )
        return True

    caminho = os.path.abspath(CAMINHO_STATE)
    if not os.path.exists(caminho):
        logger.info("state.json não encontrado — modo: Carga Histórica (First Run).")
        return True

    try:
        estado = _ler_state()
        if not estado.get("ultima_competencia"):
            logger.info("state.json sem watermark válida — modo: Carga Histórica.")
            return True
    except (json.JSONDecodeError, KeyError):
        logger.warning("state.json corrompido — modo: Carga Histórica (First Run).")
        return True

    logger.info(
        "Repositório existente com watermark '%s' — modo: Carga Incremental.",
        estado["ultima_competencia"],
    )
    return False


def load_state() -> dict:
    """
    Carrega e retorna o estado salvo do pipeline.

    Returns:
        dict: Dicionário com as chaves 'ultima_competencia', 'total_linhas_processadas'
              e 'ultima_execucao'. Retorna valores padrão se o arquivo não existir.
    """
    estado_padrao = {
        "ultima_competencia": None,
        "total_linhas_processadas": 0,
        "ultima_execucao": None,
    }
    try:
        estado = _ler_state()
        logger.debug("Estado carregado: %s", estado)
        return {**estado_padrao, **estado}
    except (FileNotFoundError, json.JSONDecodeError):
        logger.warning("Não foi possível carregar o estado. Retornando padrão.")
        return estado_padrao


def save_state(
    ultima_competencia: str,
    total_linhas: int,
    ultimo_sequencial: int | None = None,
) -> None:
    """
    Persiste o estado atual do pipeline no arquivo state.json.

    Args:
        ultima_competencia (str): Última competência processada no formato 'YYYYMM'.
        total_linhas (int): Total acumulado de linhas já processadas.
        ultimo_sequencial (int | None): Maior codigo_sequencial_acompanhamento coletado.
    """
    estado = {
        "ultima_competencia": ultima_competencia,
        "total_linhas_processadas": total_linhas,
        "ultima_execucao": datetime.now(timezone.utc).isoformat(),
    }
    if ultimo_sequencial is not None:
        estado["ultimo_sequencial"] = ultimo_sequencial
    caminho = os.path.abspath(CAMINHO_STATE)
    os.makedirs(os.path.dirname(caminho), exist_ok=True)

    with open(caminho, "w", encoding="utf-8") as arquivo:
        json.dump(estado, arquivo, indent=4, ensure_ascii=False)

    logger.info(
        "Estado salvo: última competência=%s | total_linhas=%d",
        ultima_competencia,
        total_linhas,
    )


def _ler_state() -> dict:
    """
    Lê o conteúdo bruto do state.json.

    Returns:
        dict: Conteúdo deserializado do JSON.

    Raises:
        FileNotFoundError: Se o arquivo state.json não existir.
        json.JSONDecodeError: Se o arquivo estiver malformado.
    """
    caminho = os.path.abspath(CAMINHO_STATE)
    with open(caminho, "r", encoding="utf-8") as arquivo:
        return json.load(arquivo)
