# PRD - Pipeline de Extração e Processamento de Dados (ETL)

## 1. Visão Geral

Este projeto consiste no desenvolvimento de um pipeline de dados modular em Python. O objetivo é demonstrar o fluxo de dados desde a coleta via API externa até o armazenamento otimizado em formato Parquet, priorizando a organização do código e a legibilidade para fins acadêmicos.

## 2. Objetivos do Projeto

* **API Alvo:** Endpoint v1/sisvan/estado-nutricional.
* **Modularização:** Separar as responsabilidades de extração, limpeza e conversão em scripts distintos.
* **Eficiência de Armazenamento:** Converter dados brutos (CSV) para um formato colunar (Parquet).
* **Qualidade de Dados:** Garantir que o dataset final não contenha registros nulos ou inconsistentes.
* **Segurança:** Utilizar variáveis de ambiente para gerenciar credenciais de API.

## 3. Arquitetura do Sistema

O projeto será dividido em quatro componentes principais:

1. **Orquestrador (`main.py`):** Ponto de entrada que coordena a execução dos módulos na ordem correta.
2. **Extrator (`extractor.py`):** Responsável pela comunicação com a API e salvamento do CSV bruto.
3. **Transformador/Limpador (`cleaner.py`):** Responsável pela leitura do CSV, validação e remoção de dados vazios.
4. **Conversor (`converter.py`):** Responsável pela persistência dos dados limpos em formato `.parquet`.

## 4. Requisitos Técnicos

### 4.1 Tecnologias e Bibliotecas

* **Linguagem:** Python 3.x
* **Requisições HTTP:** `requests`
* **Manipulação de Dados:** `pandas`
* **Motor de Escrita Parquet:** `pyarrow`
* **Gestão de Configurações:** `python-dotenv`

### 4.2 Fluxo de Dados (Step-by-Step)

| Etapa | Ação | Saída Esperada |
| --- | --- | --- |
| **Extração** | Consumir endpoint da API e tratar paginação/erros. | `dados_brutos.csv` |
| **Limpeza** | Identificar nulos e aplicar `dropna()` ou preenchimento. | `Dataframe` em memória |
| **Conversão** | Aplicar tipagem correta e salvar como colunar. | `dados_finais.parquet` |

## 5. Estrutura de Pastas Sugerida

```text
project/
├── data/
│   ├── raw/          # CSVs originais
│   └── processed/    # Arquivos Parquet
├── src/
│   ├── extractor.py
│   ├── cleaner.py
│   └── converter.py
├── .env              # Chaves de API e URLs
├── main.py           # Script principal
└── requirements.txt  # Dependências do projeto

```

## 6. Requisitos Não Funcionais (Qualidade Acadêmica)

* **Docstrings:** Todas as funções devem conter explicações sobre parâmetros e retornos.
* **Tratamento de Exceções:** Implementar blocos `try-except` especialmente na extração (erros de rede).
* **Logging Simples:** Exibir mensagens no console indicando o progresso de cada etapa (ex: "Limpando dados...", "Convertendo para Parquet...").
* **Variáveis Semânticas:** Nomes de variáveis que descrevam exatamente o que o dado representa.

## 7. Critérios de Aceite

1. O script `main.py` deve rodar do início ao fim sem intervenção manual.
2. O arquivo Parquet final deve ser significativamente menor que o CSV original.
3. Nenhum valor `NaN` ou `Null` deve estar presente nas colunas críticas do arquivo final.

## 8. Estratégia de Automação (Cronjob)
Para garantir a atualização mensal dos dados, o projeto seguirá a abordagem de agendamento externo:

* **Ferramenta:** GitHub Actions (ou Crontab).
* **Frequência:** Todo dia 01 de cada mês, às 00:00 UTC.
* **Execução:** O agendador chamará o ambiente virtual e executará o comando `python main.py`.
* **Vantagem:** Garante que o script não precise de um loop infinito em memória, respeitando os princípios de eficiência computacional.

## 9. Estratégia de Carga de Dados

O sistema deve operar de forma híbrida, diferenciando a primeira execução das subsequentes.

### 9.1 Carga Histórica (First Run)
* **Gatilho:** Ausência de arquivos na pasta `/data/processed` ou banco de dados de controle.
* **Comportamento:** O `extractor.py` deve realizar requisições à API sem filtros de data (ou com a data inicial padrão do projeto) para capturar todo o histórico disponível.

### 9.2 Carga Incremental (Monthly Update)
* **Gatilho:** Execução agendada (todo dia 01) com presença de dados anteriores.
* **Comportamento:** 1. O sistema lê o valor da "última data processada" (Watermark).
    2. A requisição para a API é filtrada para trazer apenas registros onde `data_registro > ultima_data_processada`.
    3. Os novos dados são processados e anexados ao repositório Parquet.

## 10. Gestão de Estado
Para garantir a consistência, o projeto utilizará um arquivo simples de metadados (`state.json` ou o próprio nome dos arquivos Parquet) para armazenar:
* Data da última execução com sucesso.
* Quantidade de linhas processadas.
* Último ID ou Timestamp coletado.

---