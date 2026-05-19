"""
extractor.py
============
Extração do endpoint SISVAN Estado Nutricional.

URL de referência:
  https://apidadosabertos.saude.gov.br/sisvan/estado-nutricional
  ?codigo_municipio=354390&uf=SP&idade_minima=0&idade_maxima=1&limit=100&offset=0

Estratégia:
1. Percorre faixas etárias (ex.: 0–1, 2–3, …, 17–18).
2. Em cada faixa, pagina com offset=0, 20, 40… até resposta vazia.
3. Sem filtro de competência na API (organização por ano no cleaner).
"""

import logging
import time
from urllib.parse import urlencode

import pandas as pd
import requests

logger = logging.getLogger(__name__)

ENDPOINT_ESTADO_NUTRICIONAL = "/sisvan/estado-nutricional"
CHAVE_REGISTROS = "estados_nutricionais"

MAX_RETENTATIVAS = 3
ESPERA_BASE_SEGUNDOS = 5
TIMEOUT_REQUISICAO_SEGUNDOS = 120
PAUSA_PADRAO_SEGUNDOS = 0.5

# Com limit=100 na query, a API ainda devolve ~20 registros por página.
TAMANHO_PAGINA_RESPOSTA = 20


def montar_url(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    limit: int,
    offset: int,
) -> str:
    """
    Monta a URL completa da requisição (útil para logs e depuração).

    Args:
        base_url (str): URL base da API.
        codigo_municipio (int): Código IBGE.
        uf (str): Sigla do estado.
        idade_minima (int): Idade mínima.
        idade_maxima (int): Idade máxima.
        limit (int): Parâmetro limit da query.
        offset (int): Parâmetro offset da query.

    Returns:
        str: URL com query string.
    """
    parametros = {
        "codigo_municipio": codigo_municipio,
        "uf": uf,
        "idade_minima": idade_minima,
        "idade_maxima": idade_maxima,
        "limit": limit,
        "offset": offset,
    }
    base = f"{base_url.rstrip('/')}{ENDPOINT_ESTADO_NUTRICIONAL}"
    return f"{base}?{urlencode(parametros)}"


def gerar_competencias(inicio: str, fim: str | None = None) -> list[str]:
    """
    Gera lista de competências YYYYMM (usada na carga incremental / watermark).

    Args:
        inicio (str): Competência inicial YYYYMM.
        fim (str | None): Competência final. Padrão: mês atual.

    Returns:
        list[str]: Competências em ordem crescente.
    """
    from datetime import date

    hoje = date.today()
    competencia_fim = fim or f"{hoje.year}{hoje.month:02d}"

    try:
        ano_inicio, mes_inicio = int(inicio[:4]), int(inicio[4:6])
        ano_fim, mes_fim = int(competencia_fim[:4]), int(competencia_fim[4:6])
    except (ValueError, IndexError) as erro:
        raise ValueError(
            f"Formato de competência inválido. Use 'YYYYMM'. Erro: {erro}"
        ) from erro

    competencias = []
    ano_atual, mes_atual = ano_inicio, mes_inicio

    while (ano_atual, mes_atual) <= (ano_fim, mes_fim):
        competencias.append(f"{ano_atual}{mes_atual:02d}")
        mes_atual += 1
        if mes_atual > 12:
            mes_atual = 1
            ano_atual += 1

    return competencias


def gerar_faixas_etarias(
    idade_minima: int,
    idade_maxima: int,
    anos_por_faixa: int = 2,
) -> list[tuple[int, int]]:
    """
    Divide idades em faixas para a API (ex.: 0–1, 2–3 com anos_por_faixa=2).

    Args:
        idade_minima (int): Idade mínima do projeto.
        idade_maxima (int): Idade máxima do projeto.
        anos_por_faixa (int): Largura de cada faixa (padrão 2, como na URL 0–1).

    Returns:
        list[tuple[int, int]]: Pares (idade_minima, idade_maxima).
    """
    if anos_por_faixa < 1:
        raise ValueError("anos_por_faixa deve ser >= 1.")

    faixas: list[tuple[int, int]] = []
    inicio = idade_minima

    while inicio <= idade_maxima:
        fim = min(inicio + anos_por_faixa - 1, idade_maxima)
        faixas.append((inicio, fim))
        inicio = fim + 1

    logger.info(
        "Faixas etárias (%d): %s",
        len(faixas),
        ", ".join(f"{a}–{b}" for a, b in faixas),
    )
    return faixas


def extrair_faixa_etaria(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    limit: int = 100,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Extrai todos os registros de uma faixa etária (ex.: idades 0–1).

    Paginação: offset 0, depois +20, +40… até página vazia ou incompleta.

    Args:
        base_url (str): URL base da API.
        codigo_municipio (int): Código IBGE.
        uf (str): UF.
        idade_minima (int): Idade mínima da faixa.
        idade_maxima (int): Idade máxima da faixa.
        limit (int): Parâmetro limit (recomendado: 100).
        pausa_segundos (float): Pausa entre requisições.

    Returns:
        pd.DataFrame: Registros da faixa.
    """
    paginas: list[pd.DataFrame] = []
    offset = 0
    pagina = 0
    ids_vistos: set[int | str] = set()

    logger.info(
        "  Faixa %d–%d | limit=%d | exemplo: %s",
        idade_minima,
        idade_maxima,
        limit,
        montar_url(
            base_url, codigo_municipio, uf, idade_minima, idade_maxima, limit, 0
        ),
    )

    while True:
        url = montar_url(
            base_url,
            codigo_municipio,
            uf,
            idade_minima,
            idade_maxima,
            limit,
            offset,
        )
        logger.info("    página %d | offset=%d", pagina, offset)

        dados = _fazer_requisicao(url)

        if dados is None:
            logger.warning(
                "    Falha na página %d (offset=%d) — encerrando faixa %d–%d.",
                pagina,
                offset,
                idade_minima,
                idade_maxima,
            )
            break

        if len(dados) == 0:
            logger.info(
                "    offset=%d vazio — fim da faixa %d–%d (%d registros).",
                offset,
                idade_minima,
                idade_maxima,
                sum(len(p) for p in paginas),
            )
            break

        ids_pagina = {
            registro.get("codigo_sequencial_acompanhamento")
            for registro in dados
            if registro.get("codigo_sequencial_acompanhamento") is not None
        }
        novos_ids = ids_pagina - ids_vistos
        if not novos_ids:
            logger.info(
                "    Página %d sem registros novos — fim da faixa %d–%d.",
                pagina,
                idade_minima,
                idade_maxima,
            )
            break
        ids_vistos.update(novos_ids)

        paginas.append(pd.DataFrame(dados))

        if len(dados) < TAMANHO_PAGINA_RESPOSTA:
            logger.info(
                "    Última página: %d registros (faixa %d–%d).",
                len(dados),
                idade_minima,
                idade_maxima,
            )
            break

        offset += len(dados)
        pagina += 1
        time.sleep(pausa_segundos)

    if not paginas:
        return pd.DataFrame()

    return pd.concat(paginas, ignore_index=True)


def extrair_dados(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    limit: int = 100,
    anos_por_faixa: int = 2,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Extrai dados de todas as faixas etárias e consolida.

    Args:
        base_url (str): URL base da API.
        codigo_municipio (int): Código IBGE.
        uf (str): UF.
        idade_minima (int): Idade mínima global.
        idade_maxima (int): Idade máxima global.
        limit (int): Parâmetro limit (padrão 100).
        anos_por_faixa (int): Anos por faixa (padrão 2 → 0–1, 2–3…).
        pausa_segundos (float): Pausa entre requisições.

    Returns:
        pd.DataFrame: Dados consolidados.
    """
    faixas = gerar_faixas_etarias(idade_minima, idade_maxima, anos_por_faixa)
    frames: list[pd.DataFrame] = []

    for indice, (idade_min, idade_max) in enumerate(faixas, start=1):
        logger.info(
            "[%d/%d] Extraindo idades %d–%d…",
            indice,
            len(faixas),
            idade_min,
            idade_max,
        )
        df_faixa = extrair_faixa_etaria(
            base_url=base_url,
            codigo_municipio=codigo_municipio,
            uf=uf,
            idade_minima=idade_min,
            idade_maxima=idade_max,
            limit=limit,
            pausa_segundos=pausa_segundos,
        )
        if not df_faixa.empty:
            frames.append(df_faixa)
            logger.info("  → %d registros na faixa %d–%d.", len(df_faixa), idade_min, idade_max)
        else:
            logger.info("  → sem dados na faixa %d–%d.", idade_min, idade_max)

    if not frames:
        logger.warning("Nenhum dado extraído.")
        return pd.DataFrame()

    df = pd.concat(frames, ignore_index=True)
    logger.info("Extração concluída: %d registros brutos.", len(df))
    return df


def extrair_historico(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    limit: int = 100,
    anos_por_faixa: int = 2,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Carga histórica completa via faixas etárias (sem filtro de mês na API).

    Returns:
        pd.DataFrame: Dados consolidados.
    """
    logger.info("Carga histórica por faixas etárias (sem competência na URL).")
    return extrair_dados(
        base_url=base_url,
        codigo_municipio=codigo_municipio,
        uf=uf,
        idade_minima=idade_minima,
        idade_maxima=idade_maxima,
        limit=limit,
        anos_por_faixa=anos_por_faixa,
        pausa_segundos=pausa_segundos,
    )


def _fazer_requisicao(url: str) -> list | None:
    """
    GET com re-tentativas. A URL já contém todos os parâmetros.

    Args:
        url (str): URL completa do endpoint.

    Returns:
        list | None: Lista em estados_nutricionais ou None se falhar.
    """
    headers = {"Accept": "application/json"}

    for tentativa in range(1, MAX_RETENTATIVAS + 1):
        try:
            resposta = requests.get(
                url, headers=headers, timeout=TIMEOUT_REQUISICAO_SEGUNDOS
            )

            if resposta.status_code == 200:
                try:
                    dados = resposta.json()
                except ValueError:
                    logger.error("Resposta 200 sem JSON válido: %s", url[:120])
                    dados = None

                if isinstance(dados, list):
                    return dados
                if isinstance(dados, dict):
                    registros = dados.get(CHAVE_REGISTROS)
                    if isinstance(registros, list):
                        return registros
                    for chave in ("items", "data", "results", "registros"):
                        if chave in dados and isinstance(dados[chave], list):
                            return dados[chave]
                    logger.warning("JSON inesperado. Chaves: %s", list(dados.keys()))
                    return []
                return []

            if resposta.status_code == 404:
                return []

            if resposta.status_code == 401:
                logger.error("401 — não autorizado.")
                return None

            if resposta.status_code == 429:
                espera = ESPERA_BASE_SEGUNDOS * (2**tentativa)
                logger.warning("429 — aguardando %ds…", espera)
                time.sleep(espera)
                continue

            if resposta.status_code in (502, 503, 504):
                logger.error("HTTP %d — serviço indisponível.", resposta.status_code)
            else:
                logger.error("HTTP %d — %s", resposta.status_code, url)

        except requests.exceptions.Timeout:
            logger.error("Timeout (%d/%d).", tentativa, MAX_RETENTATIVAS)
        except requests.exceptions.RequestException as erro:
            logger.error("Erro (%d/%d): %s", tentativa, MAX_RETENTATIVAS, erro)

        if tentativa < MAX_RETENTATIVAS:
            time.sleep(ESPERA_BASE_SEGUNDOS * tentativa)

    logger.error("Falha após %d tentativas: %s", MAX_RETENTATIVAS, url)
    return None
