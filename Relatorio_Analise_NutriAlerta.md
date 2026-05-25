# 📊 Relatório de Análise de Estrutura e Diagnóstico — NutriAlerta

Este relatório apresenta uma análise detalhada da estrutura de diretórios do ecossistema **NutriAlerta & Nutri for Schools**, documenta os arquivos inúteis que foram removidos do repositório, identifica erros e inconsistências de desenvolvimento e oferece recomendações técnicas para otimização e organização do código.

---

## 🏛️ 1. Visão Geral da Estrutura do Ecossistema

O repositório está organizado como um ecossistema unificado contendo duas aplicações principais baseadas no framework **Next.js (App Router)** e integradas através de bases de dados locais e conexões com o **Supabase**:

1. **`NutriAlerta/` (Portal do Gestor Público):** Focado na vigilância epidemiológica municipal. Roda na porta `3000` e inclui modelos de Machine Learning (Random Forest) e o assistente virtual NutriBot.
2. **`Nutri for Schools/` (Portal Escolar Local):** Focado no acompanhamento local e conformidade de merendas das 88 escolas de Rio Claro - SP. Roda na porta `3001`.
3. **`Colector/` (Scraping/Extração):** Script para raspagem e consolidação automática de dados epidemiológicos do SISVAN.

---

## 🧹 2. Limpeza de Arquivos Inutilizados e Redundantes

Para otimizar o espaço do repositório e evitar poluição visual e confusão no controle de versão (Git), foram identificados e **excluídos com sucesso** os seguintes arquivos e diretórios inúteis:

### 📁 Arquivos Removidos
| Caminho do Arquivo | Tipo / Descrição | Motivo da Remoção |
| :--- | :--- | :--- |
| `NutriAlerta/project/nutri-alerta/src/lib/extractedPois.json.bak` | Cópia de Backup (`.bak`) | Arquivo de backup temporário não utilizado pela aplicação. |
| `NutriAlerta/project/nutri-alerta/src/lib/extractedPois.json.bak_schools` | Cópia de Backup (`.bak_schools`) | Outro arquivo de backup temporário inútil. |
| `NutriAlerta/models/project/csv/NutriAlerta_Projecao_Demografica.json` | Duplicado Gigante (6.78 MB) | Criado incorretamente em diretório aninhado por erro de execução de caminhos no script de Machine Learning. |
| `NutriAlerta/project/nutri-alerta/project/csv/NutriAlerta_Projecao_Demografica.json` | Duplicado Gigante (6.78 MB) | Outro arquivo duplicado gigante gerado em pasta aninhada errônea pelo mesmo script. |
| `NutriAlerta/escolas_analisadas.txt` | Cópia Duplicada (Root) | Duplicado desnecessário do arquivo existente na pasta de dados do projeto. |
| `NutriAlerta/project/escolas_analisadas.txt` | Cópia Duplicada (Project) | Outro duplicado desnecessário. A versão definitiva é a `NutriAlerta/project/csv/escolas_analisadas.txt`. |

### 📂 Diretórios Redundantes Removidos
Os seguintes diretórios vazios ou aninhados criados incorretamente foram completamente limpos e excluídos:
* `NutriAlerta/models/project/csv/`
* `NutriAlerta/models/project/`
* `NutriAlerta/project/nutri-alerta/project/csv/`
* `NutriAlerta/project/nutri-alerta/project/`

> **Resultado da Limpeza:** Foram liberados mais de **13.5 MB** de armazenamento desnecessário no repositório, otimizando o controle do Git e removendo diretórios "fantasmas".

---

## 🔍 3. Erros Encontrados e Inconsistências

Durante a análise estática e varredura do ecossistema, identificamos os seguintes erros de lógica de diretórios, inconsistências ortográficas e redundâncias:

### ⚠️ Erro 1: Bug de Caminho Relativo no Pipeline de Machine Learning (`unified_ML.py`)
No arquivo `NutriAlerta/models/unified_ML.py` (e nos modelos individuais correspondentes), a função `salvar_json_demografico` contém a seguinte lista de caminhos de salvamento:

```python
caminhos_salvamento = [
    os.path.join(script_dir, "..", "project", "csv", "NutriAlerta_Projecao_Demografica.json"),
    os.path.join("project", "csv", "NutriAlerta_Projecao_Demografica.json"), # <-- BUG!
    os.path.join(script_dir, "..", "..", "Nutri for Schools", "project", "csv", "NutriAlerta_Projecao_Demografica.json"),
]
```

#### O problema:
O segundo caminho (`os.path.join("project", "csv", ...)`) usa um caminho **relativo ao diretório de execução do terminal (CWD)**, em vez do diretório do script (`script_dir`).
* Se você iniciar os servidores usando o arquivo `iniciar_servidores.bat` na raiz, o script de ML é executado a partir de `NutriAlerta/project/nutri-alerta` (CWD). Isso faz com que a função crie a pasta `NutriAlerta/project/nutri-alerta/project/csv/` e grave o arquivo JSON de 6.78MB lá dentro.
* Se você executar o script a partir da pasta `NutriAlerta/models`, ele criará a pasta `NutriAlerta/models/project/csv/`.

#### Correção Recomendada:
Para corrigir esse comportamento sem alterar o funcionamento lógico da aplicação, o segundo item deve ser removido ou alterado para usar um caminho absoluto baseado em `script_dir`, por exemplo:
```python
# Correção ideal no unified_ML.py:
caminhos_salvamento = [
    os.path.join(script_dir, "..", "project", "csv", "NutriAlerta_Projecao_Demografica.json"),
    os.path.join(script_dir, "..", "..", "Nutri for Schools", "project", "csv", "NutriAlerta_Projecao_Demografica.json"),
]
```

---

### ⚠️ Erro 2: Redundância de Arquivos de Projeção no Pipeline (`unified_ML.py`)
O script de ML unificado e as rotas de API salvam e procuram por dois arquivos idênticos na mesma pasta:
* `NutriAlerta_Projecao_Futura.csv`
* `NutriAlerta_Projecao_Futura-2.csv`

No arquivo Next.js `route.ts`, a busca é feita da seguinte forma:
```typescript
const obesityPath = await findCSVFile(['NutriAlerta_Projecao_Futura-2.csv', 'NutriAlerta_Projecao_Futura.csv']);
```
#### Diagnóstico:
Esses dois arquivos são sempre cópias exatas gravadas sequencialmente. Isso é uma redundância desnecessária de armazenamento. A rota Next.js está programada para dar preferência ao arquivo `-2.csv` e cair para o normal se não encontrar. O ideal seria padronizar a aplicação para utilizar apenas `NutriAlerta_Projecao_Futura.csv` e remover as referências ao `-2.csv`.

---

### ⚠️ Erro 3: Inconsistência de Grafia de Arquivos de Documentação
No repositório existem documentos de arquitetura idênticos, mas com grafias diferentes:
* **NutriAlerta:** `NutriAlerta/architecture.md` (Grafia correta em inglês)
* **Nutri for Schools:** `Nutri for Schools/architeture.md` (Falta a letra **'c'** - grafia incorreta: *architeture*)

Embora não afete o código funcional diretamente, essa inconsistência prejudica a padronização de qualidade do projeto acadêmico.

---

### ⚠️ Erro 4: Pasta de Configuração do Coletor Deslocada e com Erro Ortográfico (`Colector/`)
Na raiz do repositório existe uma pasta chamada `Colector` (com apenas um 'l', enquanto o padrão do projeto é `collector` com dois). Esta pasta contém apenas um arquivo `.env` de configuração do raspador SISVAN.
#### Diagnóstico:
Esta pasta foi criada por um erro ortográfico ou de organização de arquivos. Como os códigos do coletor estão dentro de `NutriAlerta/collector/` e `Nutri for Schools/collector/`, o arquivo `.env` deveria estar localizado dentro das respectivas pastas de execução do coletor, e a pasta `Colector/` da raiz deveria ser removida.

---

## 📁 4. Relatório Detalhado da Estrutura de Arquivos

Abaixo está o mapeamento dos arquivos funcionais e estruturais de cada área do projeto que foram mantidos intactos para garantir o funcionamento das aplicações:

### 📱 4.1. Portal do Gestor — `NutriAlerta/`
Esta é a aplicação principal de gestão de Rio Claro.
* **`NutriAlerta/project/nutri-alerta/src/`**: Contém o código Next.js (App Router).
  * **`app/api/data/route.ts`**: Core API do dashboard. Faz sincronização em nuvem com o banco Supabase, calcula as médias locais, normaliza as porcentagens para somarem exatamente 100% e aplica as projeções geradas pelo modelo de IA aos dados escolares.
  * **`app/api/chat/route.ts`**: API do NutriBot, que utiliza a IA do Gemini para gerar recomendações e planos de intervenção epidemiológica para o gestor.
  * **`app/dashboard/`**: Páginas do painel do gestor (mapas Voronoi, choropleth e gráficos recharts).
  * **`lib/`**: Armazena as bases espaciais essenciais como `rio_claro_bairros.json` (polígonos do município), `rio_claro_boundary.json` (limite da cidade) e `dbConsolidatedData.json` (cache consolidado das escolas).
* **`NutriAlerta/models/`**: Scripts de treinamento do Random Forest.
  * **`unified_ML.py`**: Pipeline unificado que treina os modelos de regressão de obesidade, desnutrição, sobrepeso e eutrofia e gera previsões roladas para 2026/2027.
  * **`bias_audit.py`**: Script de auditoria ética para verificar se o modelo preditivo apresenta viés geográfico ou socioeconômico.

### 🏫 4.2. Portal Escolar — `Nutri for Schools/`
Focado na gestão de merenda e dados de saúde de alunos locais.
* **`Nutri for Schools/project/nutri-alerta/src/`**: Next.js customizado para escolas.
  * **`app/`**: Painel escolar simplificado com acompanhamento local e taxas de eutrofia, sobrepeso e desnutrição.
  * **`lib/`**: Bases e mocks para login local das diretorias escolares.
* **`Nutri for Schools/models/`**: Contém versões simplificadas e específicas dos scripts `obesidade_ML.py` e `desnutricao_ML.py` voltados para o portal local.

### 🌐 4.3. Script Coletor SISVAN — `NutriAlerta/collector` & `Nutri for Schools/collector`
* **`main.py`**: Pipeline principal de extração de dados abertos do SISVAN para o município de Rio Claro.
* **`src/`**: Módulos auxiliares (`extractor.py`, `cleaner.py`, `converter.py`, `state_manager.py`).

---

## 💡 5. Recomendações Técnicas

1. **Ajustar os Caminhos no `unified_ML.py`**: Substitua o caminho relativo no pipeline de Machine Learning conforme demonstrado na seção **Erro 1** para evitar que novas execuções voltem a criar pastas fantasmas de dados.
2. **Corrigir a Grafia da Pasta do Coletor**: Mover o arquivo `.env` de `Colector/` na raiz para dentro de `NutriAlerta/collector/` (renomeando para `.env`) e excluir a pasta duplicada `Colector/` da raiz.
3. **Renomear `architeture.md`**: Corrija o nome do arquivo em `Nutri for Schools/architeture.md` para `architecture.md` para garantir uma padronização visual perfeita.
4. **Padronizar as Projeções no Frontend**: Mude no código da API Next.js a referência ao arquivo duplicado `NutriAlerta_Projecao_Futura-2.csv` para apontar unicamente para `NutriAlerta_Projecao_Futura.csv`, excluindo a geração redundante do segundo arquivo.

---
*Relatório gerado em 25 de Maio de 2026 como parte da Auditoria de Estrutura do Ecossistema NutriAlerta.*
