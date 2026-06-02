"""
paths.py
========
Centraliza os caminhos de arquivos e diretórios do pipeline ETL.

Todos os caminhos são relativos à raiz do projeto, independentemente
de onde o script seja executado.
"""

import os

# Raiz do projeto (pasta que contém main.py, data/, src/)
RAIZ_PROJETO = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Diretórios de dados
DIR_DATA = os.path.join(RAIZ_PROJETO, "data")
DIR_RAW = os.path.join(DIR_DATA, "raw")
DIR_PROCESSED = os.path.join(DIR_DATA, "processed")

# Arquivos de saída e controle
CAMINHO_PARQUET = os.path.join(DIR_PROCESSED, "dados_finais.parquet")
CAMINHO_STATE = os.path.join(DIR_DATA, "state.json")
CAMINHO_CSV_BRUTO_TEMPLATE = os.path.join(DIR_RAW, "dados_brutos_{competencias}.csv")
