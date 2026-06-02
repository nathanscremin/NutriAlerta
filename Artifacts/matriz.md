# Matriz RACI: Ecossistema NutriAlerta & Nutri-for-Schools

Esta matriz define a divisão individual de responsabilidades e atribuições do projeto interdisciplinar, mapeando as tarefas reais do Trello e as entregas estratégicas recentes (LGPD, Responsividade Mobile e Apresentação do Showcase).

---

## 👥 Papéis do Time (Nomes Formais)

*   **Nathan** (Product Owner - PO)
*   **Gabriel** (Scrum Master - SM)
*   **Nicolas** (Developer - Dev)
*   **Arthur** (Developer - Dev / ML)
*   **Pedro** (Developer - Dev / NLP)
*   **Matheus** (Developer - Dev / DB)

---

## 📊 Matriz RACI Individual

> **Legenda:**
> *   **R (Responsible):** Quem executa a tarefa.
> *   **A (Accountable):** Quem responde pelo resultado final, valida a entrega e toma decisões estratégicas. *(Apenas 1 por tarefa)*.
> *   **C (Consulted):** Quem é consultado para apoiar com conhecimento técnico ou visão de negócios.
> *   **I (Informed):** Quem é notificado sobre a conclusão ou atualizações da tarefa.

| Atividades & Entregáveis (Trello + Ecossistema) | Nathan (PO) | Gabriel (SM) | Nicolas (Dev) | Arthur (Dev) | Pedro (Dev) | Matheus (Dev) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1. Concepção e Gestão do Projeto** | | | | | | |
| Definição de Requisitos e Backlog Geral (PRD/User Stories) | **A** | **R** | **C** | **C** | **C** | **C** |
| Gestão do Backlog, Facilitação Ágil e Ritos das Sprints | **A** | **R** | **I** | **I** | **I** | **I** |
| Elaboração de Documentações Técnicas (Modelo de IA, Manual) | **A** | **C** | **R** | **R** | **R** | **R** |
| **2. Tarefas de Engenharia de Dados & ETL** | | | | | | |
| Validação de Extração dos Dados Iniciais (SISVAN/DATASUS) | **R, A** | **I** | **R** | **R** | **I** | **R** |
| Ingestão e ETL de Comorbidades (DATASUS + SISVAN) | **A** | **I** | **R** | **C** | **I** | **R** |
| Criação de API e Mock de Ingestão do SISVAN | **R, A** | **I** | **C** | **R** | **I** | **I** |
| **3. Georreferenciamento & Mapas** | | | | | | |
| Mapeamento de Rio Claro via Geopandas (Base do Modelo) | **R, A** | **I** | **C** | **R** | **I** | **I** |
| Modelo Visual do Site (Layout Inicial do Portal Gestor) | **R, A** | **R** | **R** | **C** | **R** | **R** |
| Integração do Portal com o Mapa de Calor / Risco | **R, A** | **I** | **C** | **R** | **I** | **I** |
| **4. Desenvolvimento de IA & Modelagem** | | | | | | |
| Modelo Preditivo Classificador (Treinamento Random Forest) | **R, A** | **R** | **R** | **R** | **C** | **I** |
| Algoritmo Gerador de Dados de Nutrição Sintéticos | **A** | **I** | **C** | **R** | **I** | **I** |
| **5. Desenvolvimento de Software** | | | | | | |
| Login do NutriAlerta e Regras de Acesso Supabase | **R, A** | **C** | **R** | **C** | **I** | **R** |
| Desenvolvimento do Coletor Escolar (Nutri-for-Schools) | **A** | **I** | **R** | **C** | **I** | **R** |
| **6. Integração de Chatbot & RAG** | | | | | | |
| Desenvolvimento do Chatbot Inicial | **A** | **R** | **C** | **I** | **R** | **I** |
| RAG do Modo Consultor (API Gemini para insights epidemiológicos) | **A** | **R** | **C** | **I** | **R** | **I** |
| **7. Implantação e Infraestrutura** | | | | | | |
| Upload do NutriAlerta na Nuvem (Deploy na Vercel) | **R** | **R, A** | **R** | **R** | **I** | **I** |
| Configuração de Pipelines de CI/CD (GitHub Actions para ML) | **I** | **R, A** | **C** | **R** | **I** | **I** |
| **8. Entregas e Homologações Finais** | | | | | | |
| Auditoria de Conformidade e Anonimização de Dados (LGPD) | **R, A** | **C** | **R** | **R** | **I** | **I** |
| Ajuste de Responsividade Mobile e Drawer de Filtros | **A** | **R** | **R** | **I** | **R** | **I** |
| Roteiro de Pitch e Apresentação para a Banca (Showcase FATEC) | **R, A** | **R** | **R** | **R** | **R** | **R** |
