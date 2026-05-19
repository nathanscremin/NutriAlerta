# Pipeline ETL — SISVAN Estado Nutricional

Pipeline de dados modular em Python que extrai informações do endpoint **SISVAN Estado Nutricional** (API de Dados Abertos do Ministério da Saúde), limpa os registros e persiste o resultado em formato Parquet.

Escopo acadêmico: Rio Claro/SP, faixa etária 0–18 anos.

## Estrutura do Projeto

```text
Semma/
├── data/
│   ├── raw/              # CSVs brutos (backup pós-extração)
│   ├── processed/        # Parquet final (dados_finais.parquet)
│   ├── state.json        # Watermark (gerado em runtime, não versionado)
│   └── state.json.example
├── src/
│   ├── extractor.py      # Extração via API com paginação
│   ├── cleaner.py        # Limpeza, tipagem e validação
│   ├── converter.py      # Persistência CSV e Parquet
│   ├── state_manager.py  # Controle de carga histórica vs incremental
│   └── paths.py          # Caminhos centralizados do projeto
├── .github/workflows/
│   └── monthly_update.yml  # Agendamento mensal (dia 01, 00:00 UTC)
├── .env.example
├── main.py               # Orquestrador do pipeline
├── requirements.txt
└── PRD.md
```

## Fluxo de Dados

| Etapa | Módulo | Saída |
| --- | --- | --- |
| Extração | `extractor.py` | DataFrame bruto + CSV em `data/raw/` |
| Limpeza | `cleaner.py` | DataFrame sem nulos críticos |
| Conversão | `converter.py` | `data/processed/dados_finais.parquet` |

## Modos de Execução

**Carga histórica (first run)** — quando não existe Parquet em `data/processed/` ou o `state.json` está ausente/inválido. Extrai todas as faixas etárias (offset 0, 1, 2… por idade).

**Carga incremental** — quando já existem Parquet e watermark válida. Extrai apenas competências posteriores à última processada e faz append ao arquivo existente.

## Configuração

1. Clone o repositório e crie o ambiente virtual:

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

2. Copie as variáveis de ambiente:

```bash
copy .env.example .env
```

3. Ajuste os filtros no `.env` se necessário (município, UF, faixa etária, competência inicial).

## Execução

```bash
python main.py
```

O pipeline detecta automaticamente o modo (histórico ou incremental) e registra o progresso no console via logging.

## Automação (GitHub Actions)

O workflow `monthly_update.yml` executa `python main.py` todo dia **01** de cada mês às **00:00 UTC**. O cache `sisvan-pipeline-data` preserva o Parquet e o `state.json` entre execuções. Os artefatos ficam disponíveis por 90 dias no painel do Actions.

## Critérios de Aceite (PRD)

- [x] `main.py` executa o pipeline completo sem intervenção manual
- [x] Parquet com compressão Snappy (menor que o CSV bruto)
- [x] Colunas críticas sem valores nulos após limpeza
- [x] Credenciais e URLs via `.env`
- [x] Docstrings, logging e tratamento de exceções na extração

## Referência

Documento de requisitos: [PRD.md](PRD.md)
