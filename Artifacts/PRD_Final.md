# 📋 Documento de Requisitos de Produto (PRD) Consolidado
## 🥗 Ecossistema NutriAlerta & Nutri-for-Schools
> **Vigilância Epidemiológica Municipal e Monitoramento Antropométrico Escolar**  
> *Projeto Interdisciplinar do 3º Semestre · FATEC Rio Claro · Versão Final Homologada*

---

## 1. 🏛️ Visão Geral do Ecossistema e Objetivos
O ecossistema **NutriAlerta & Nutri-for-Schools** é um conjunto unificado de soluções de software e inteligência artificial projetado para combater a desnutrição, o sobrepeso e a obesidade infantil no município de **Rio Claro - SP**. 

O projeto preenche o ciclo completo de ponta a ponta (E2E) exigido para a gestão pública de saúde:
1. **Entrada de Dados:** Registro descentralizado e 100% anônimo de pesagens e dados antropométricos efetuado exclusivamente pelas escolas públicas através do portal escolar.
2. **Processamento Inteligente:** Análise automatizada de risco baseada no Z-score da OMS e projeções de tendências epidemiológicas geradas em tempo real por um classificador de Aprendizado de Máquina (*Random Forest*).
3. **Interface de Saída:** Mapas interativos (Voronoi + Coroplético), painéis estatísticos e assistente de IA conversacional (**NutriBot**) para suporte à decisão do gestor municipal de saúde.

---

## 👥 2. Equipe do Projeto & Framework Ágil (Scrum)
O desenvolvimento seguiu rigorosamente o framework Scrum, utilizando rituais ágeis (Sprints quinzenais, Daily standups assíncronos e Definition of Done) para garantir qualidade extrema.

### 👥 Estrutura de Papéis
*   **Scrum Master:** Gabriel Vinicios Nanetti (Gestão ágil, facilitação de rituais, remoção de impedimentos e conformidade de processo).
*   **Product Owner:** Nathan Scremin (Visão de produto, priorização do backlog de alto valor, homologação de histórias).
*   **Dev Team (Engenharia de Software, Dados & Machine Learning):**
    *   Nicolas Ferreira da Silva
    *   Arthur Araujo Leite
    *   Pedro Henrique Carvalho de Paula
    *   Matheus Henrique Domingos da Silva

### ⚙️ Critérios de Qualidade (Definition of Done - DoD)
Para mover qualquer item para a coluna "Concluído" (*Done*), a entrega precisou satisfazer os seguintes critérios:
1. **Versionamento Estrito:** Código integrado na branch principal (`main`), sem conflitos e com mensagens semânticas de commit.
2. **Ausência de Mock em Produção:** O processamento, banco de dados (Supabase) e algoritmos de ML rodam sobre a base de dados consolidada real (não mockada).
3. **Segurança Garantida:** Dados sensíveis criptografados e chaves fora do código-fonte (em variáveis de ambiente seguras).
4. **Validação de Tipagem:** Build de produção sem nenhum erro de linting ou quebra de tipos TypeScript/TypeScript Compiler (`npm run type-check` bem-sucedido).

---

## 📁 3. Backlog de Épicos & Histórias de Usuário (Status: 100% Homologado)

Ambos os portais foram completamente implementados e testados. Abaixo está o status do backlog final homologado pelo Product Owner:

### 3.1. Quadro de Épicos do Projeto

| ID | Épico | Entregável Final | Responsável | Status |
| :--- | :--- | :--- | :--- | :--- |
| **EP-01** | Geoespacial Base | Mapeamento interativo de Rio Claro, contendo tooltips, popups e polígonos das UBS e escolas. | Equipe do Projeto | **[Concluído]** |
| **EP-02** | Validação SISVAN | ETL e consistência histórica da série epidemiológica do SISVAN. | Equipe do Projeto | **[Concluído]** |
| **EP-03** | Dashboard Web | Interface com gráficos temporais, filtros dinâmicos e painéis de UBS. | Equipe do Projeto | **[Concluído]** |
| **EP-04** | Correlacionamento | Cruzamento de dados de desnutrição e obesidade por sub-regiões e bairros censitários. | Equipe do Projeto | **[Concluído]** |
| **EP-05** | Modelagem preditiva | Modelo preditivo classificador *Random Forest* (ML) treinado e gerando projeções para 2026/2027. | Equipe do Projeto | **[Concluído]** |
| **EP-06** | Mapa de Risco | Visualização espacial de Voronoi e coroplética por níveis de gravidade da desnutrição/sobrepeso. | Equipe do Projeto | **[Concluído]** |
| **EP-07** | Relatório de Produção | Homologação final, documentações e deploy seguro integrado na nuvem da Vercel. | Equipe do Projeto | **[Concluído]** |

---

### 3.2. Histórias de Usuário (User Stories) e Efetivação Técnica

Com base nas demandas registradas no Trello e nas necessidades da vigilância epidemiológica municipal, as seguintes Histórias de Usuário foram formuladas e implementadas:

#### 🗺️ US-01: Visualização Territorial (Vínculo: EP-01 & EP-06)
*   **Declaração:** *Como gestor municipal de saúde, quero visualizar um mapa interativo dos bairros de Rio Claro, para identificar áreas com maior vulnerabilidade e desvios nutricionais.*
*   **Efetivação no Projeto:** Implementação de mapas coropléticos interativos baseados em Leaflet no portal do gestor ([ConflictMap.tsx](file:///c:/Users/natha/Documents/GitHub/NutriAlerta/NutriAlerta/project/nutri-alerta/src/components/ConflictMap.tsx) e [RiskMap.tsx](file:///c:/Users/natha/Documents/GitHub/NutriAlerta/NutriAlerta/project/nutri-alerta/src/components/RiskMap.tsx)). As divisões geográficas são renderizadas dinamicamente a partir de arquivos GeoJSON que delimitam os bairros e as regiões sob a cobertura territorial de cada Unidade Básica de Saúde (UBS).

#### 📊 US-02: Cruzamento Epidemiológico (Vínculo: EP-02 & EP-04)
*   **Declaração:** *Como cientista de dados do projeto, quero cruzar os dados históricos do SISVAN com os setores censitários do IBGE para encontrar correlações socioeconômicas e comorbidades.*
*   **Efetivação no Projeto:** Criação do script de inteligência artificial e processamento de dados (`unified_ML.py`), que realiza o cruzamento de variáveis do censo (infraestrutura, renda média familiar e saneamento por bairro) com o histórico de registros antropométricos e morbidades locais do DATASUS e SISVAN, gerando a base de dados integrada de treinamento do modelo.

#### 📈 US-03: Dashboard Analítico para Gestão (Vínculo: EP-03)
*   **Declaração:** *Como gestor municipal de saúde, quero acessar um dashboard web com visualizações do estado nutricional das crianças por escola e UBS, facilitando o monitoramento e a tomada de decisão.*
*   **Efetivação no Projeto:** Desenvolvimento do painel principal de visualização de dados (**NutriAlerta**), contendo gráficos de séries temporais empilhadas, comparativos dinâmicos de prevalência de distúrbios alimentares entre as diferentes UBSs do município, pirâmides demográficas e gráficos analíticos de conflito urbano alimentar.

#### 🔮 US-04: Antecipação de Tendências Preditivas (Vínculo: EP-05 & EP-06)
*   **Declaração:** *Como gestor municipal de saúde, quero visualizar no mapa de Rio Claro o nível de risco nutricional predito por região para os próximos anos, permitindo ações proativas.*
*   **Efetivação no Projeto:** Integração do modelo *Random Forest Regressor* treinado ao banco de dados Supabase. O mapa do gestor utiliza diagramas de Voronoi para regionalizar as previsões e colorir os polígonos correspondentes com as projeções de prevalência de eutrofia, sobrepeso, obesidade e desnutrição para os anos de 2026 e 2027.

#### 🏫 US-05: Coleta de Dados Descentralizada e Anônima (Vínculo: EP-05)
*   **Declaração:** *Como diretor de uma escola, quero saber se estou entregando a melhor alimentação possível para os estudantes com base nos seus dados antropométricos, de forma rápida e segura.*
*   **Efetivação no Projeto:** Desenvolvimento do portal **Nutri-for-Schools**, um ambiente de coleta isolado e simplificado para as secretarias escolares. A interface permite a inserção rápida de registros antropométricos individuais (calculando na hora o IMC e sua classificação com base nos parâmetros da OMS) e a importação massiva via planilhas CSV, exibindo gráficos estatísticos de eutrofia específicos de cada unidade de ensino para auditoria do cardápio escolar. O portal é a única porta de entrada ativa do ecossistema e atua sem coletar dados pessoais identificáveis (PII), garantindo anonimização desde a origem.

#### 💬 US-06: Suporte de Decisão em Linguagem Natural (Vínculo: EP-04)
*   **Declaração:** *Como usuário leigo em análise de dados, gostaria de um chatbot interativo para facilitar minha navegação, extração de relatórios e entendimento dos dados epidemiológicos.*
*   **Efetivação no Projeto:** Implementação do **NutriBot** ([ConsultantView.tsx](file:///c:/Users/natha/Documents/GitHub/NutriAlerta/NutriAlerta/project/nutri-alerta/src/components/ConsultantView.tsx)), um agente de suporte cognitivo que consome a API do Google Gemini. Ele é munido do contexto das estatísticas do município filtradas pela seleção do usuário na tela (UBS, bairro ou escola selecionada), respondendo dúvidas complexas, correlacionando estatísticas e traduzindo dados brutos de saúde em relatórios legíveis em linguagem natural.

---

## 🔐 4. Checklist de Ética, Segurança & LGPD (Auditoria Final)

Sob a ótica de segurança cibernética e de governança ética em Inteligência Artificial, o ecossistema foi estruturado sobre os seguintes pilares de conformidade estrita:

### 🛡️ 4.1. Conformidade com a LGPD (Lei Geral de Proteção de Dados)
Como lidamos com prontuários nutricionais e dados antropométricos de **menores de idade** (crianças e adolescentes de 0 a 18 anos), implementamos uma arquitetura de **Privacy-by-Design absoluto** focada em anonimização nativa na origem:
*   **Zero Coleta de Dados Pessoais Identificáveis (PII):** A triagem de pesagem escolar **não** coleta, transmite ou armazena qualquer Dado Pessoal Identificável (como nomes de alunos, CPFs, RGs ou dados de responsáveis). A tabela `registros_saude` no banco central na nuvem (Supabase) persiste exclusivamente dimensões biométricas e demográficas anônimas (`escola_id`, `genero`, `idade`, `peso`, `altura` e data da coleta). Conforme o Artigo 12 da LGPD, dados anonimizados não sofrem incidência de vazamentos ou penalidades de privacidade, pois a identidade civil dos alunos nunca entra no sistema.
*   **Isolamento Rígido de Responsabilidades:** O portal **NutriAlerta (Gestor)** opera como uma ferramenta estritamente analítica e passiva de **somente leitura**, consumindo as predições de inteligência artificial e os agregados estatísticos. O portal **Nutri-for-Schools (Escolar)** é o único e exclusivo canal de coleta descentralizada do ecossistema, onde profissionais escolares inserem os dados antropométricos de forma rápida, fluindo as métricas anônimas diretamente para o banco de dados na nuvem.
*   **Bypass Seguro com Row Level Security (RLS):** A proteção do banco de dados na nuvem é exercida por regras ativas de RLS no Supabase, garantindo que mesmo os registros de medição anônimos só possam ser lidos ou gravados por conexões autenticadas via SSO cross-port ou tokens de JWT administrativos devidamente autorizados.
*   **Orquestração Isolada de Segredos:** Chaves de API do Supabase e credenciais da engine de IA são tratadas como segredos de servidor e inseridas de forma isolada via variáveis de ambiente nas plataformas de deploy (Vercel e GitHub Actions), mantendo o código público 100% livre de segredos expostos.

### 🤖 4.2. Ética em Inteligência Artificial e Modelos Preditivos
*   **Equidade e Prevenção de Viés (Fairness):** O modelo *Random Forest* foi calibrado com amostragem real e balanceado utilizando dados demográficos locais. Ele não discrimina escolas ou UBS com base em fatores estritamente socioeconômicos descontextualizados, limitando-se a prever riscos puramente antropométricos baseados no histórico epidemiológico real.
*   **Explicabilidade do Modelo (Explainability):** As classificações de IMC seguem à risca a lógica matemática de curvas Z-score da **Organização Mundial da Saúde (OMS)**. Qualquer tomada de decisão da IA é perfeitamente auditável e justificada através dos cálculos antropométricos exibidos nas interfaces e comparativos das UBS.
*   **Responsabilidade (Accountability) e Alerta Legal:** O assistente virtual baseados em IA (**NutriBot**) exibe em seu rodapé e respostas um aviso ético destacando que suas análises são **meramente orientativas** e não substituem o diagnóstico clínico de pediatras, nutricionistas ou auditoria médica da Secretaria Municipal de Saúde de Rio Claro. O profissional humano retém o controle absolut da decisão final (*Human-in-the-loop*).
