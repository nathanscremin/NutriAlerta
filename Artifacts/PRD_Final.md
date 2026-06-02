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
