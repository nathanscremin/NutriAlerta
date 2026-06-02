# Matriz RACI: Ecossistema NutriAlerta & Nutri-for-Schools

Esta matriz define os papéis e as responsabilidades para as principais entregas do projeto interdisciplinar, mapeando as tarefas originárias do quadro do Trello e as entregas estratégicas recentes (LGPD, Responsividade Mobile, CI/CD e Documentações).

---

## 👥 Definição dos Papéis e Integrantes

A estrutura organizacional do projeto baseia-se no framework **Scrum**, com os seguintes papéis e atribuições de responsabilidade:

1.  **Product Owner (PO):** **Nathan Scremin**
    *   *Responsabilidade:* Visão estratégica do produto, priorização do backlog de negócios, validação de regras de conformidade (LGPD) e validação final de aceitação das sprints.
2.  **Scrum Master (SM):** **Gabriel Vinicios Nanetti**
    *   *Responsabilidade:* Facilitação ágil dos ritos Scrum, remoção de impedimentos técnicos, garantia do Definition of Done (DoD) e orquestração de infraestrutura de deploy/integração.
3.  **Dev Team (Desenvolvimento, Dados & Inteligência Artificial):**
    *   **Nicolas Ferreira da Silva** *(Dev Full-stack / Integração)*
    *   **Arthur Araujo Leite** *(Engenheiro de Dados / Machine Learning)*
    *   **Pedro Henrique Carvalho de Paula (Ph)** *(Dev Front-end / IA / NLP)*
    *   **Matheus Henrique Domingos da Silva** *(Dev Back-end / Banco de Dados)*
    *   *Responsabilidade:* Implementação prática de código, modelagem de IA, Ingestão de Dados (ETL) e projeto de interfaces de usuário.

---

## 📊 Matriz RACI Unificada

> **Legenda:**
> *   **R (Responsible):** Quem executa diretamente a tarefa.
> *   **A (Accountable):** Quem responde pelo resultado final, aprova a entrega e toma decisões críticas. *(Apenas 1 por tarefa)*.
> *   **C (Consulted):** Quem é consultado para apoiar a execução (fornece insumos e conhecimento técnico).
> *   **I (Informed):** Quem é notificado sobre o progresso ou encerramento da entrega.

| Categoria / Entregáveis do Projeto | Product Owner (Nathan) | Scrum Master (Gabriel) | Dev Team (Nicolas, Arthur, Ph, Matheus) |
| :--- | :---: | :---: | :---: |
| **1. Concepção e Gestão de Produto** | | | |
| Definição de Requisitos e Backlog de Valor (User Stories / PRD) | **A** | **R** | **C** |
| Gestão Ágil e Organização de Sprints | **A** | **R** | **I** |
| Elaboração de Documentações Oficiais (Técnica, Modelo de IA) | **A** | **C** | **R** |
| **2. Engenharia de Dados & ETL (Sprints 1 e 2)** | | | |
| Extração, Ingestão e Validação de Dados Iniciais (SISVAN/DATASUS) | **A** | **I** | **R** |
| Base Geográfica e Delimitação Territorial (Geopandas - Rio Claro) | **A** | **I** | **R** |
| Criação de API de Integração e Mock de Dados do SISVAN | **A** | **I** | **R** |
| **3. Modelagem e Machine Learning (Sprints 2 e 3)** | | | |
| Desenvolvimento do Modelo Preditivo (Random Forest) | **A** | **I** | **R** |
| Gerador de Dados Nutricionais Sintéticos (Mock de Ingestão) | **A** | **I** | **R** |
| **4. Desenvolvimento de Software (Sprints 1, 2 e 3)** | | | |
| Desenvolvimento Front-end do Gestor (NutriAlerta) | **A** | **R** | **R** |
| Desenvolvimento Front-end do Coletor Escolar (Nutri-for-Schools) | **A** | **I** | **R** |
| Login Unificado, Regras Supabase e Segurança RLS | **A** | **C** | **R** |
| Integração dos Mapas Coropléticos e Voronoi (Leaflet/Turf) | **A** | **I** | **R** |
| **5. Chatbots & Assistência Inteligente (Sprint 3)** | | | |
| Desenvolvimento e Design do Chatbot Inicial | **A** | **R** | **R** |
| RAG e Integração do Modo Consultor (API Gemini) | **A** | **R** | **R** |
| **6. DevOps, Deploy e Homologação (Entregas Finais)** | | | |
| Pipeline de CI/CD (GitHub Actions para Pipeline de ML) | **I** | **A** | **R** |
| Deploy Duplo na Nuvem (Vercel - Gestor & Escolar) | **A** | **R** | **R** |
| **7. Governança e Ajustes do Ecossistema** | | | |
| Auditoria de Conformidade e Anonimização de Dados (LGPD) | **A** | **C** | **R** |
| Ajuste de Responsividade Mobile e Drawer de Filtros | **A** | **R** | **R** |
| Desenvolvimento do Roteiro de Pitch e Apresentação Final | **A** | **R** | **R** |

---

## 📝 Notas de Execução e Responsabilidade

1.  **Validação LGPD (Privacy-by-Design):** O **Product Owner** foi o principal *Accountable* para a regra de negócio que ditou o fim do cadastro de CPF no gestor, orientando a equipe de desenvolvimento (*Dev Team - Responsible*) a implementar o salvamento 100% anônimo na origem dentro do portal descentralizado **Nutri-for-Schools**.
2.  **Machine Learning:** **Arthur Araujo Leite** liderou a codificação e modelagem (*Responsible*), enquanto o **Product Owner** definiu os parâmetros preditivos de interesse de saúde pública municipal (*Accountable*).
3.  **Chatbot (NutriBot):** O **Dev Team (Ph)** e o **Scrum Master (Gabriel)** atuaram como codificadores conjuntos (*Responsible*) para estruturar as chamadas da API do Gemini e o design do chat, cabendo ao **Product Owner** atestar a fidelidade dos termos de epidemiologia gerados.
4.  **DevOps & Deploy:** O **Scrum Master** atuou como aprovação final e orquestrador principal (*Accountable* e *Responsible*) dos deploys na Vercel e do workflow de GitHub Actions.
