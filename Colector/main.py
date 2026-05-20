"""
main.py
=======
Ponto de entrada e orquestrador do pipeline ETL do SISVAN Estado Nutricional.

Este script coordena a execução dos módulos na ordem correta, detectando
automaticamente se deve executar uma Carga Histórica (first run) ou
uma Carga Incremental (atualização mensal).

Fluxo de Decisão:
─────────────────
  state.json ausente/inválido ou sem Parquet?
    └── SIM → Carga Histórica (extrai todas as fases e faixas etárias)
    └── NÃO → Carga Incremental (filtra competências após a watermark)

Uso:
    python main.py

Agendamento:
    Configurado via GitHub Actions (.github/workflows/monthly_update.yml)
    para execução automática todo dia 01 de cada mês às 00:00 UTC.
"""

import logging
import os
import sys
from datetime import date

from dotenv import load_dotenv

from src import cleaner, converter, extractor, state_manager
from src.paths import CAMINHO_CSV_BRUTO, CAMINHO_CSV_BRUTO_TEMPLATE, CAMINHO_PARQUET

# ─────────────────────────────────────────────
# Configuração de Logging
# ─────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("main")


def carregar_configuracoes() -> dict:
    """
    Carrega as variáveis de ambiente do arquivo .env e retorna um dicionário
    com todas as configurações necessárias para o pipeline.

    Returns:
        dict: Configurações do pipeline.

    Raises:
        SystemExit: Se variáveis obrigatórias estiverem ausentes ou inválidas.
    """
    load_dotenv()

    try:
        configuracoes = {
            "api_base_url": os.getenv(
                "API_BASE_URL", "https://apidadosabertos.saude.gov.br"
            ),
            "codigo_municipio": int(os.getenv("CODIGO_MUNICIPIO", "354390")),
            "uf": os.getenv("UF_FILTRO", "SP").strip().upper(),
            "idade_minima": int(os.getenv("IDADE_MINIMA", "0")),
            "idade_maxima": int(os.getenv("IDADE_MAXIMA", "18")),
            "fases_vida": extractor.parsear_fases_vida(
                os.getenv("FASES_VIDA", "1,2,3,4,5,6")
            ),
            "limit_por_pagina": int(os.getenv("LIMIT_POR_PAGINA", "100")),
            "anos_por_faixa": int(os.getenv("ANOS_POR_FAIXA", "2")),
            "pausa_entre_requisicoes": float(
                os.getenv("PAUSA_ENTRE_REQUISICOES", "0.5")
            ),
        }
    except ValueError as erro:
        logger.error("Valor inválido no .env: %s", erro)
        raise SystemExit(1) from erro

    if configuracoes["idade_minima"] > configuracoes["idade_maxima"]:
        logger.error("IDADE_MINIMA não pode ser maior que IDADE_MAXIMA.")
        raise SystemExit(1)
    if configuracoes["anos_por_faixa"] < 1:
        logger.error("ANOS_POR_FAIXA deve ser >= 1.")
        raise SystemExit(1)
    if configuracoes["limit_por_pagina"] < 1:
        logger.error("LIMIT_POR_PAGINA deve ser >= 1.")
        raise SystemExit(1)

    logger.info("Configurações carregadas:")
    logger.info("  API Base URL   : %s", configuracoes["api_base_url"])
    logger.info("  UF             : %s", configuracoes["uf"])
    logger.info("  Município IBGE : %s", configuracoes["codigo_municipio"])
    logger.info(
        "  Faixa etária   : %d – %d anos",
        configuracoes["idade_minima"],
        configuracoes["idade_maxima"],
    )
    logger.info(
        "  Fases de vida  : %s",
        ", ".join(str(f) for f in configuracoes["fases_vida"]),
    )
    logger.info("  Anos por faixa : %d", configuracoes["anos_por_faixa"])
    logger.info(
        "  Paginação      : limit=%d | offset por página (~20 registros)",
        configuracoes["limit_por_pagina"],
    )

    return configuracoes


def _salvar_csvs_brutos(df_bruto, caminho_backup: str) -> None:
    """Salva CSV principal (PRD) e cópia com sufixo de competência."""
    converter.salvar_csv_bruto(df_bruto, CAMINHO_CSV_BRUTO)
    converter.salvar_csv_bruto(df_bruto, caminho_backup)


def _atualizar_estado(df_limpo, total_linhas: int) -> None:
    """Persiste watermark e último ID sequencial no state.json."""
    ultima_competencia = cleaner.obter_ultima_competencia(df_limpo)
    ultimo_sequencial = cleaner.obter_ultimo_sequencial(df_limpo)
    if not ultima_competencia:
        hoje = date.today()
        ultima_competencia = f"{hoje.year}{hoje.month:02d}"

    state_manager.save_state(
        ultima_competencia=ultima_competencia,
        total_linhas=total_linhas,
        ultimo_sequencial=ultimo_sequencial,
    )


def executar_carga_historica(cfg: dict) -> None:
    """
    Executa a Carga Histórica: extrai todos os dados por fase de vida e faixa
    etária e cria o repositório Parquet do zero.

    Args:
        cfg (dict): Dicionário de configurações carregado do .env.
    """
    logger.info("=" * 60)
    logger.info("MODO: CARGA HISTÓRICA (FIRST RUN)")
    logger.info("=" * 60)

    hoje = date.today()

    logger.info("Iniciando extração histórica...")
    df_bruto = extractor.extrair_historico(
        base_url=cfg["api_base_url"],
        codigo_municipio=cfg["codigo_municipio"],
        uf=cfg["uf"],
        idade_minima=cfg["idade_minima"],
        idade_maxima=cfg["idade_maxima"],
        fases_vida=cfg["fases_vida"],
        limit=cfg["limit_por_pagina"],
        anos_por_faixa=cfg["anos_por_faixa"],
        pausa_segundos=cfg["pausa_entre_requisicoes"],
    )

    if df_bruto.empty:
        logger.warning("Nenhum dado foi retornado pela API. Pipeline encerrado.")
        return

    caminho_backup = CAMINHO_CSV_BRUTO_TEMPLATE.format(
        competencias=f"historico_{hoje.isoformat()}"
    )
    _salvar_csvs_brutos(df_bruto, caminho_backup)

    logger.info("Limpando dados...")
    df_limpo = cleaner.limpar(df_bruto, cfg["idade_minima"], cfg["idade_maxima"])

    if df_limpo.empty:
        logger.error("Após limpeza, o DataFrame ficou vazio. Verifique a qualidade dos dados.")
        return

    logger.info("Convertendo para Parquet...")
    converter.salvar_parquet(df_limpo, CAMINHO_PARQUET)
    _atualizar_estado(df_limpo, len(df_limpo))

    logger.info("=" * 60)
    logger.info("Carga Histórica concluída com sucesso!")
    logger.info("  Registros salvos     : %d", len(df_limpo))
    logger.info("  Arquivo Parquet      : %s", CAMINHO_PARQUET)
    logger.info("  CSV bruto (PRD)      : %s", CAMINHO_CSV_BRUTO)
    logger.info("=" * 60)


def executar_carga_incremental(cfg: dict) -> None:
    """
    Executa a Carga Incremental: lê a watermark do state.json e processa
    apenas competências posteriores à última processada.

    Args:
        cfg (dict): Dicionário de configurações carregado do .env.
    """
    logger.info("=" * 60)
    logger.info("MODO: CARGA INCREMENTAL")
    logger.info("=" * 60)

    estado_atual = state_manager.load_state()
    ultima_competencia = estado_atual["ultima_competencia"]
    total_historico = estado_atual["total_linhas_processadas"]

    if not ultima_competencia or len(str(ultima_competencia)) != 6:
        logger.error(
            "Watermark inválida no state.json: %s. Execute carga histórica novamente.",
            ultima_competencia,
        )
        return

    logger.info("Última competência processada (watermark): %s", ultima_competencia)
    logger.info("Total de linhas acumuladas anteriormente : %d", total_historico)

    ano = int(ultima_competencia[:4])
    mes = int(ultima_competencia[4:6])
    mes += 1
    if mes > 12:
        mes = 1
        ano += 1
    proxima_competencia = f"{ano}{mes:02d}"

    hoje = date.today()
    competencia_fim = f"{hoje.year}{hoje.month:02d}"

    if proxima_competencia > competencia_fim:
        logger.info(
            "Os dados já estão atualizados até %s. Nenhuma nova competência a extrair.",
            ultima_competencia,
        )
        return

    logger.info(
        "Novos meses esperados: %s → %s (filtro no cleaner).",
        proxima_competencia,
        competencia_fim,
    )

    logger.info("Iniciando extração incremental...")
    df_bruto_novo = extractor.extrair_dados(
        base_url=cfg["api_base_url"],
        codigo_municipio=cfg["codigo_municipio"],
        uf=cfg["uf"],
        idade_minima=cfg["idade_minima"],
        idade_maxima=cfg["idade_maxima"],
        fases_vida=cfg["fases_vida"],
        limit=cfg["limit_por_pagina"],
        anos_por_faixa=cfg["anos_por_faixa"],
        pausa_segundos=cfg["pausa_entre_requisicoes"],
    )

    if df_bruto_novo.empty:
        logger.warning("Nenhum dado novo retornado pela API. Pipeline encerrado.")
        return

    caminho_backup = CAMINHO_CSV_BRUTO_TEMPLATE.format(
        competencias=f"{proxima_competencia}_a_{competencia_fim}"
    )
    _salvar_csvs_brutos(df_bruto_novo, caminho_backup)

    logger.info("Limpando novos dados...")
    df_limpo_novo = cleaner.limpar(
        df_bruto_novo,
        cfg["idade_minima"],
        cfg["idade_maxima"],
        competencia_minima=proxima_competencia,
    )

    if df_limpo_novo.empty:
        logger.info(
            "Nenhum registro novo após filtro de competência >= %s.",
            proxima_competencia,
        )
        return

    logger.info("Adicionando novos dados ao Parquet existente (append)...")
    total_final = converter.append_parquet(df_limpo_novo, CAMINHO_PARQUET)

    ultima_competencia_global = cleaner.obter_ultima_competencia(df_limpo_novo)
    if ultima_competencia_global:
        ultima_competencia_final = max(
            str(ultima_competencia),
            str(ultima_competencia_global),
        )
    else:
        ultima_competencia_final = competencia_fim

    state_manager.save_state(
        ultima_competencia=ultima_competencia_final,
        total_linhas=total_final,
        ultimo_sequencial=cleaner.obter_ultimo_sequencial(df_limpo_novo),
    )

    logger.info("=" * 60)
    logger.info("Carga Incremental concluída com sucesso!")
    logger.info("  Novos registros adicionados : %d", len(df_limpo_novo))
    logger.info("  Total acumulado no Parquet  : %d", total_final)
    logger.info("  Nova watermark              : %s", ultima_competencia_final)
    logger.info("  Arquivo Parquet             : %s", CAMINHO_PARQUET)
    logger.info("=" * 60)


def main() -> None:
    """
    Ponto de entrada principal do pipeline ETL.

    Detecta automaticamente o modo de carga (histórica ou incremental)
    com base na existência e validade do state.json, e delega para o
    executor correspondente.
    """
    logger.info("Pipeline ETL SISVAN — Estado Nutricional (Rio Claro/SP, 0–18 anos)")
    logger.info("Iniciando em: %s", date.today().isoformat())

    cfg = carregar_configuracoes()

    if state_manager.is_first_run():
        executar_carga_historica(cfg)
    else:
        executar_carga_incremental(cfg)

    logger.info("Pipeline encerrado.")


if __name__ == "__main__":
    main()
