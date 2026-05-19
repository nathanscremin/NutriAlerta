

## INTELIGÊNCIA ARTIFICIAL

Documento PRD

## 3º Semestre  ·  2026  · Saúde Pública

- Formação de Equipe e Papéis
A equipe é composta por 6 integrantes organizados no framework Scrum. O Scrum Master é
responsável por garantir os rituais ágeis e remover impedimentos; o Product Owner detém a visão
do produto e prioriza o backlog; o Dev Team executa e entrega os incrementos a cada sprint.


## Nome Completo

## Papel

## Responsabilidades

## Gabriel Vinicios Nanetti
## Scrum Master

Gestão ágil, coordenação de sprints, remoção de
impedimentos
## Nathan Scremin
## Product Owner

Backlog, priorização de features, alinhamento com
objetivos
Nicolas Ferreira da Silva
## Dev Team
Desenvolvimento, ETL, modelagem preditiva
## Arthur Araujo Leite
## Dev Team
Desenvolvimento, ETL, modelagem preditiva
## Pedro Henrique Carvalho
de Paula
## Dev Team
Desenvolvimento, ETL, modelagem preditiva
## Matheus Henrique
Domingos da Silva
## Dev Team
Desenvolvimento, ETL, modelagem preditiva


- Configuração do Board de Gestão — Trello
Será utilizado o Trello como ferramenta de rastreabilidade de tarefas e controle de Sprints. O
board segue o fluxo Kanban adaptado ao Scrum, com as seguintes colunas:


## Coluna

## Descrição

Exemplo de card

## Backlog

Todas as tarefas priorizadas do
projeto

API SISVAN, Dashbord web

## Sprint Backlog

Tarefas comprometidas para a sprint
atual

Coleta série histórica

Em andamento

WIP — máx. 2 por membro ativo

Feature engineering com lags

Em revisão

Pull Request aberto / code review

Random Forest — validação
cronológica

## Concluído

Tarefa aceita pelo PO com DoD
cumprida

Mapa choropleth final


Cada card deve conter: título descritivo, responsável, prazo da sprint, checklist de subtarefas e link
para artefato (script, notebook ou documento) quando aplicável.




- Cadência de Dailies e Critérios de Qualidade
## 3.1 Daily Standup
Formato assíncrono via grupo do projeto (Discord/WhatsApp), com check-in diário de até 5 linhas
por membro, respondendo:

- O que fiz desde ontem?
- O que farei hoje?
- Há algum impedimento?
Sprint Review e Retrospectiva: ao final de cada sprint (quinzenal), reunião síncrona de 30 min
para demonstrar o incremento ao PO e registrar melhorias no processo.


3.2 Definition of Done (DoD)
Um card só é movido para 'Concluído' quando todos os critérios abaixo forem satisfeitos:

## #

Critério de Qualidade (Definition of Done)

## 1
Código versionado no repositório com mensagem de commit descritiva
## 2
Dados/scripts testados com amostra real (não apenas mock)
## 3
Outputs documentados no README ou comentários inline
## 4
Card movido para 'Em revisão' com evidência (print, log ou gráfico)
## 5
Revisado e aceito pelo PO antes de mover para 'Concluído'


- Tema: Área da Saúde
4.1 Descrição do Projeto
Sistema de mapeamento preditivo de casos de nutrição e obesidade no estado de São Paulo e
densidade populacional para descobrir regiões com falta de recursos alimentares.
Correlacionando com as escolas municipais da região, dessa forma pode-se realizar uma análise
da merenda oferecida para direcionar melhor os recursos.

A proposta está alinhada com as competências do PPC do curso nas disciplinas de Ciência de
Dados, Banco de Dados e Programação, aplicando aprendizado de máquina supervisionado
(Random Forest) sobre dados reais de saúde pública.


## 4.2 Stack Tecnológica Definida
- Python 3.14  ·  VS Code  ·  Windows · Antigravity
- GeoPandas 1.1.3, pandas, numpy, matplotlib, shapely, pyproj, Folium, sklearn
## • SISVAN · IBGE · DATASUS
- Random Forest com split cronológico
- Saída: choropleth por bairro com índice de risco predito e dashboard web




4.3 Backlog Inicial — Épicos e Responsáveis
O backlog abaixo representa os épicos da 1ª versão do projeto, priorizados pelo PO:

## ID

## Épico

## Descrição

## Responsável

## Status

## EP-01

## Geoespacial
base
Shapefile IBGE Censo 2022 (28
bairros Rio Claro) + mapa Folium
com polígonos, tooltip e popup
## Nicolas
## ✔
## Concluído

## EP-02

## Validação
dos dados do
## SISVAN

Pesquisa por dados do SISVAN,
de forma a analisar se eram de
fácil acesso
## Nathan ·
## Matheus
## ✔
## Concluído

## EP-03

Criação de
modelo
dashboard
Desenvolvimento de modelo para
dashboard
## Arthur ·
## Pedro
## ✔
## Concluído

## EP-04

## Correlaciona
mento de
dados
Análise de datasets(desnutrição e
obesidade) para relacionar por
bairros e alimentar o dataset
A definir
## Pendente

## EP-05
Modelagem Treinar Random Forest Classifier  A definir
## Pendente

## EP-06

Mapa de
## Risco
Cruzar saída do modelo com
shapefile no GeoPandas; gerar
choropleth por nível de risco
A definir
## Pendente

## EP-07

## Relatório
final
Documentação, métricas do
modelo (F1, recall por bairro) e
apresentação dos resultados
## Todos
## Pendente




























4.4 Histórias de Usuário

EP-01 — Geoespacial Base
Como gestor municipal de saúde, quero visualizar um mapa interativo dos bairros de Rio Claro,
para identificar geograficamente as regiões de interesse antes de qualquer análise.
EP-02 — Correlacionamento de Dados
Como cientista de dados do projeto, quero cruzar os dados do SISVAN com os setores censitários
do IBGE por bairro, para construir um dataset unificado que relaciona indicadores nutricionais com
características socioeconômicas de cada região.
EP-03 — Modelo de Dashboard
Como gestor municipal de saúde, quero acessar um dashboard web com visualizações do estado
nutricional por região, para ter uma visão consolidada sem precisar acessar o SISVAN
diretamente.
EP-04 — Mapa de Risco
Como gestor municipal de saúde, quero visualizar no mapa de Rio Claro o nível de risco
nutricional predito para cada bairro, para priorizar onde direcionar agentes comunitários e recursos
de busca ativa.
EP-05 — Coordenação Escolar
Como diretor de uma escola, quero saber se estou entregando a melhor alimentação possível
para os estudantes.














## Inteligência Artificial — 3º Semestre  ·  2026
Responsável pela postagem: Gabriel Nanetti (Scrum Master)
