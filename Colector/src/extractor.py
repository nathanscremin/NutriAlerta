"""
extractor.py
============
Extração do endpoint SISVAN Estado Nutricional.

URL de referência:
  https://apidadosabertos.saude.gov.br/sisvan/estado-nutricional
  ?codigo_municipio=354390&uf=SP&idade_minima=0&idade_maxima=0
  &codigo_fase_vida=1&limit=100&offset=0

Estratégia:
1. Percorre fases de vida (codigo_fase_vida: 1–6 para 0–18 anos).
2. Em cada fase, percorre faixas etárias (ex.: 0–1, 2–3, …, 17–18).
3. Em cada combinação, pagina com offset até resposta vazia ou sem IDs novos.
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

# Com limit=100 na query, a API devolve ~20 registros por página.
TAMANHO_PAGINA_RESPOSTA = 20

# Fases de vida cobrindo crianças e adolescentes (0–18 anos no projeto).
FASES_VIDA_PADRAO = (1, 2, 3, 4, 5, 6)


def parsear_fases_vida(valor: str | None) -> tuple[int, ...]:
    """
    Converte variável de ambiente em tupla de códigos de fase de vida.

    Args:
        valor (str | None): Lista separada por vírgula, ex. "1,2,3,4,5,6".

    Returns:
        tuple[int, ...]: Códigos de fase de vida a consultar na API.
    """
    if not valor or not valor.strip():
        return FASES_VIDA_PADRAO

    fases: list[int] = []
    for parte in valor.split(","):
        parte = parte.strip()
        if not parte:
            continue
        codigo = int(parte)
        if codigo < 1:
            raise ValueError(f"Código de fase de vida inválido: {codigo}")
        fases.append(codigo)

    if not fases:
        return FASES_VIDA_PADRAO

    return tuple(sorted(set(fases)))


def montar_url(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    codigo_fase_vida: int,
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
        codigo_fase_vida (int): Código da fase de vida (obrigatório na API).
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
        "codigo_fase_vida": codigo_fase_vida,
        "limit": limit,
        "offset": offset,
    }
    base = f"{base_url.rstrip('/')}{ENDPOINT_ESTADO_NUTRICIONAL}"
    return f"{base}?{urlencode(parametros)}"


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
        anos_por_faixa (int): Largura de cada faixa (padrão 2).

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

    return faixas


def extrair_segmento(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    codigo_fase_vida: int,
    idade_minima: int,
    idade_maxima: int,
    limit: int = 100,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Extrai todos os registros de uma combinação fase de vida + faixa etária.

    Paginação: offset 0, depois +N (tamanho da página) até página vazia.

    Args:
        base_url (str): URL base da API.
        codigo_municipio (int): Código IBGE.
        uf (str): UF.
        codigo_fase_vida (int): Código da fase de vida.
        idade_minima (int): Idade mínima da faixa.
        idade_maxima (int): Idade máxima da faixa.
        limit (int): Parâmetro limit (recomendado: 100).
        pausa_segundos (float): Pausa entre requisições.

    Returns:
        pd.DataFrame: Registros do segmento.
    """
    paginas: list[pd.DataFrame] = []
    offset = 0
    pagina = 0
    ids_vistos: set[int | str] = set()

    logger.info(
        "  fase=%d | idades %d–%d | exemplo: %s",
        codigo_fase_vida,
        idade_minima,
        idade_maxima,
        montar_url(
            base_url,
            codigo_municipio,
            uf,
            idade_minima,
            idade_maxima,
            codigo_fase_vida,
            limit,
            0,
        ),
    )

    while True:
        url = montar_url(
            base_url,
            codigo_municipio,
            uf,
            idade_minima,
            idade_maxima,
            codigo_fase_vida,
            limit,
            offset,
        )
        logger.info("    página %d | offset=%d", pagina, offset)

        dados = _fazer_requisicao(url)

        if dados is None:
            logger.warning(
                "    Falha na página %d (offset=%d) — encerrando segmento.",
                pagina,
                offset,
            )
            break

        if len(dados) == 0:
            logger.info(
                "    offset=%d vazio — fim do segmento (%d registros).",
                offset,
                sum(len(p) for p in paginas),
            )
            break

        ids_pagina = {
            registro.get("codigo_sequencial_acompanhamento")
            for registro in dados
            if registro.get("codigo_sequencial_acompanhamento") is not None
        }
        novos_ids = ids_pagina - ids_vistos
        if ids_pagina and not novos_ids:
            logger.info(
                "    Página %d sem registros novos — fim do segmento.",
                pagina,
            )
            break
        ids_vistos.update(novos_ids)

        paginas.append(pd.DataFrame(dados))

        if len(dados) < TAMANHO_PAGINA_RESPOSTA:
            logger.info("    Última página: %d registros.", len(dados))
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
    fases_vida: tuple[int, ...] = FASES_VIDA_PADRAO,
    limit: int = 100,
    anos_por_faixa: int = 2,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Extrai dados de todas as fases de vida e faixas etárias e consolida.

    Args:
        base_url (str): URL base da API.
        codigo_municipio (int): Código IBGE.
        uf (str): UF.
        idade_minima (int): Idade mínima global.
        idade_maxima (int): Idade máxima global.
        fases_vida (tuple[int, ...]): Códigos de fase de vida a consultar.
        limit (int): Parâmetro limit (padrão 100).
        anos_por_faixa (int): Anos por faixa (padrão 2 → 0–1, 2–3…).
        pausa_segundos (float): Pausa entre requisições.

    Returns:
        pd.DataFrame: Dados consolidados.
    """
    faixas = gerar_faixas_etarias(idade_minima, idade_maxima, anos_por_faixa)
    logger.info(
        "Fases de vida: %s | Faixas etárias (%d): %s",
        ", ".join(str(f) for f in fases_vida),
        len(faixas),
        ", ".join(f"{a}–{b}" for a, b in faixas),
    )

    frames: list[pd.DataFrame] = []
    total_segmentos = len(fases_vida) * len(faixas)
    indice_global = 0

    for codigo_fase in fases_vida:
        for idade_min, idade_max in faixas:
            indice_global += 1
            logger.info(
                "[%d/%d] Extraindo fase=%d, idades %d–%d…",
                indice_global,
                total_segmentos,
                codigo_fase,
                idade_min,
                idade_max,
            )
            df_segmento = extrair_segmento(
                base_url=base_url,
                codigo_municipio=codigo_municipio,
                uf=uf,
                codigo_fase_vida=codigo_fase,
                idade_minima=idade_min,
                idade_maxima=idade_max,
                limit=limit,
                pausa_segundos=pausa_segundos,
            )
            if not df_segmento.empty:
                frames.append(df_segmento)
                logger.info(
                    "  → %d registros (fase=%d, %d–%d).",
                    len(df_segmento),
                    codigo_fase,
                    idade_min,
                    idade_max,
                )
            else:
                logger.info(
                    "  → sem dados (fase=%d, %d–%d).",
                    codigo_fase,
                    idade_min,
                    idade_max,
                )

    if not frames:
        logger.warning("Nenhum dado extraído.")
        return pd.DataFrame()

    df = pd.concat(frames, ignore_index=True)
    if "codigo_sequencial_acompanhamento" in df.columns:
        antes = len(df)
        df = df.drop_duplicates(
            subset=["codigo_sequencial_acompanhamento"], keep="last"
        )
        if len(df) < antes:
            logger.info(
                "  Duplicatas entre segmentos removidas: %d", antes - len(df)
            )

    logger.info("Extração concluída: %d registros brutos.", len(df))
    return df


def extrair_historico(
    base_url: str,
    codigo_municipio: int,
    uf: str,
    idade_minima: int,
    idade_maxima: int,
    fases_vida: tuple[int, ...] = FASES_VIDA_PADRAO,
    limit: int = 100,
    anos_por_faixa: int = 2,
    pausa_segundos: float = PAUSA_PADRAO_SEGUNDOS,
) -> pd.DataFrame:
    """
    Carga histórica completa (todas as fases e faixas, sem filtro na API).

    Returns:
        pd.DataFrame: Dados consolidados.
    """
    logger.info("Carga histórica: fases de vida + faixas etárias.")
    return extrair_dados(
        base_url=base_url,
        codigo_municipio=codigo_municipio,
        uf=uf,
        idade_minima=idade_minima,
        idade_maxima=idade_maxima,
        fases_vida=fases_vida,
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
                if not resposta.text.strip():
                    logger.warning("Resposta 200 vazia: %s", url[:120])
                    return []

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
