# 🥗 Ecossistema NutriAlerta & Nutri-for-Schools
> **Mapeamento Epidemiológico, Gestão de Saúde Coletiva e Inteligência Artificial Preditiva**  
> *Projeto Interdisciplinar do 3º Semestre · FATEC Rio Claro · Saúde Pública & Inovação Tecnológica · Versão de Produção*

---

### 🌐 Link de Produção (Acesse Agora)
O portal principal do ecossistema já está publicado na nuvem da Vercel integrado em tempo real ao Supabase!  
👉 **[nutri-alerta.vercel.app](https://nutri-alerta.vercel.app/)**

---

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

O **NutriAlerta** é um ecossistema integrado de saúde pública e tecnologia que une análise de dados reais, mapeamento geoespacial interativo e inteligência artificial preditiva (*Random Forest*) para transformar a prevenção e o combate à desnutrição e à obesidade infantil na rede de ensino de **Rio Claro - SP**.

---

## 🏛️ Visão Geral e Arquitetura do Ecossistema

O ecossistema divide-se em duas vertentes interdependentes que atuam em perfeita sintonia e segurança por meio de um banco de dados integrado Supabase na nuvem:

1. **NutriAlerta (Portal do Gestor Municipal):** Painel analítico de alta performance para gestores públicos de saúde e analistas, contendo mapas epidemiológicos coropléticos, diagramas de Voronoi, projeções preditivas a dois anos e o assistente de decisão inteligente **NutriBot** (integrado ao Google Gemini). O portal atua como uma interface consultiva de **somente leitura**, sem manipulação ou inserção direta de dados.
2. **Nutri-for-Schools (Portal Escolar/Coletor):** Interface dedicada, simplificada e descentralizada nas escolas do município, sendo o **único canal de coleta ativa** do ecossistema, onde profissionais realizam o cadastro antropométrico de triagem (peso, altura e classificação de IMC pela OMS) de forma rápida e 100% anônima.

```mermaid
graph TD
    subgraph Fontes ["Fontes de Entrada de Dados"]
        SISVAN[SISVAN: Histórico Nutricional]
        Censo[IBGE: Dados Demográficos]
        Escolas[Cadastro de Escolas & CNES]
    end

    subgraph Core ["Banco de Dados em Nuvem (Supabase)"]
        DB[(PostgreSQL + RLS)]
    end

    subgraph App1 ["Portal 1: NutriAlerta (Porta 3000)"]
        NA_App[Next.js App Gestor]
        Map[Mapa Coroplético & Voronoi]
        Bot[NutriBot: Suporte de Decisão Gemini]
    end

    subgraph App2 ["Portal 2: Nutri-for-Schools (Porta 3001)"]
        NFS_App[Next.js App Escolar]
        Stats[Estatísticas de IMC e Eutrofia]
        Auth[Registro de Medições Antropométricas]
    end

    subgraph AI ["Engine de ML (GitHub Actions)"]
        Model[unified_ML.py: RandomForest]
    end

    SISVAN --> DB
    Censo --> DB
    Escolas --> DB

    DB <--> App1
    DB <--> App2
    DB <--> Model
    Model -->|Projeções de Prevalência 2026/2027| DB

    classDef app1 fill:#0f766e,stroke:#115e59,color:#fff,stroke-width:2px;
    classDef app2 fill:#4338ca,stroke:#3730a3,color:#fff,stroke-width:2px;
    classDef db fill:#0284c7,stroke:#0369a1,color:#fff,stroke-width:2px;
    classDef ai fill:#b45309,stroke:#92400e,color:#fff,stroke-width:2px;
    
    class NA_App,Map,Bot app1;
    class NFS_App,Stats,Auth app2;
    class DB db;
    class Model ai;
```

---

## 👥 A Equipe (Scrum Framework)

O desenvolvimento seguiu rigorosamente os ritos ágeis do framework **Scrum**, estruturado em sprints quinzenais, dailies assíncronas e controle rígido de Definition of Done (DoD) para garantir código limpo e homologado:

*   **Scrum Master:** Gabriel Vinicios Nanetti *(Gestão ágil, facilitação e conformidade ágil)*
*   **Product Owner:** Nathan Scremin *(Visão de produto, priorização do backlog de valor e validação)*
*   **Dev Team (Desenvolvimento, Engenharia de Dados & Machine Learning):**
    *   Nicolas Ferreira da Silva
    *   Arthur Araujo Leite
    *   Pedro Henrique Carvalho de Paula
    *   Matheus Henrique Domingos da Silva

---

## 📂 Estrutura do Repositório

O repositório está organizado como um **Monorepo Híbrido** sem espaços em pastas chave para total compatibilidade com pipelines de integração contínua (CI/CD) e hospedagem moderna na nuvem:

```bash
NutriAlerta/                   # Raiz do Repositório
├── .github/workflows/         # Automação CI/CD
│   └── run_ml.yml             # Pipeline gratuito da IA (GitHub Actions)
│
├── Artifacts/                 # Dossiê de Documentos Oficiais do Showcase
│   ├── Documentacao_Modelo_IA.md   # IA, RandomForest e Matemática de Projeções
│   ├── Documentacao_Tecnica.md     # Tabelas DB, RLS, SSO e Segurança LGPD
│   ├── Guia_Deploy_Nuvem.md        # Passo-a-passo detalhado para Deploy
│   ├── PRD_Final.md                # Requisitos de Produto, Backlog e Métricas
│   ├── Proposta_Melhorias_ML.md    # Auditoria de viés e ideias de expansão
│   ├── Roteiro_Pitch_Showcase.md   # Pitch de 3 minutos para empresas
│   └── roteiro_apresentacao_10min.md  # Roteiro de 10 minutos para Banca
│
├── NutriAlerta/               # 1. Sistema do Gestor Municipal (Porta 3000)
│   ├── models/                # Algoritmos e Motor de IA em Python
│   │   ├── unified_ML.py      # Core de ML: RandomForest & Persistência no Supabase
│   │   ├── supabase_data.py   # Interface de dados e snapshot com Supabase
│   │   └── diag_data.py       # Utilitário de auditoria do banco de dados na nuvem
│   └── project/
│       ├── csv/               # Históricos e backups das projeções da IA
│       └── nutri-alerta/      # Aplicação Next.js (Dashboard do Gestor)
│
└── Nutri-for-Schools/         # 2. Portal de Pesagem Escolar (Porta 3001)
    └── project/
        └── nutri-alerta/      # Aplicação Next.js (Coletor Escolar)
```

---

## 📖 Dossiê de Documentos de Suporte (Clique para Ler)

Para entender a fundo os detalhes do projeto, clique nos links abaixo para acessar diretamente os documentos explicativos oficiais do repositório (links relativos compatíveis com o GitHub):

*   📄 **[Requisitos de Produto & Escopo (PRD_Final.md)](Artifacts/PRD_Final.md):** Apresenta o escopo do produto, a metodologia ágil adotada pelo time, o backlog final unificado e o checklist de conformidade ética em IA.
*   📄 **[Manual e Documentação Técnica (Documentacao_Tecnica.md)](Artifacts/Documentacao_Tecnica.md):** Explica a arquitetura de software, o mapeamento de tabelas do banco Supabase (como `registros_saude` e `previsoes_nutricionais`), as regras de segurança RLS e o Single Sign-On (SSO) cross-port.
*   📄 **[Dossiê do Modelo de IA & Matemática (Documentacao_Modelo_IA.md)](Artifacts/Documentacao_Modelo_IA.md):** Fundamenta cientificamente o uso do *Random Forest Regressor*, a validação cruzada temporal *Walk-Forward*, a modelagem de Deltas, restrição L1 e a projeção recursiva a dois anos.
*   📄 **[Guia Prático de Deploy Nuvem (Guia_Deploy_Nuvem.md)](Artifacts/Guia_Deploy_Nuvem.md):** Guia com o passo a passo para orquestrar as chaves e variáveis de ambiente no deploy duplo na Vercel e disparadores automáticos no GitHub Actions.
*   📄 **[Melhorias Futuras da IA (Proposta_Melhorias_ML.md)](Artifacts/Proposta_Melhorias_ML.md):** Auditoria de viés geográfico e de gênero (*Fairness*) e sugestões avançadas de melhoria para o modelo (LightGBM/XGBoost).
*   📄 **[Roteiro de Pitch Executivo de 3 Minutos (Roteiro_Pitch_Showcase.md)](Artifacts/Roteiro_Pitch_Showcase.md):** Roteiro cronometrado focado em encantar representantes de empresas parceiras na feira do Showcase FATEC.
*   📄 **[Roteiro de Apresentação de 10 Minutos para Banca (roteiro_apresentacao_10min.md)](Artifacts/roteiro_apresentacao_10min.md):** Roteiro estratégico de slides, dicas de ensaio e as táticas de defesa de perguntas difíceis para a banca examinadora.

---

## ⚡ Como Executar Localmente

### Pré-requisitos
*   **Node.js** (versão 18 ou superior)
*   **Python** (versão 3.10 ou superior) com dependências (`numpy`, `pandas`, `scikit-learn`, `requests`) instalado.
*   Banco de dados **Supabase** configurado (credenciais mapeadas no arquivo `.env.local` na raiz de cada projeto).

### Inicialização Automatizada (Recomendado)
Para maior praticidade em demonstrações locais, o projeto conta com um script em lote que instala dependências de desenvolvimento ausentes e inicia os dois portais simultaneamente nas portas apropriadas. Basta dar dois cliques ou rodar no terminal na raiz do repositório:
```bash
./iniciar_servidores.bat
```

### Inicialização Manual
1.  **Portal do Gestor (NutriAlerta - Porta 3000):**
    ```bash
    cd "NutriAlerta/project/nutri-alerta"
    npm install
    npm run dev
    ```
2.  **Portal Escolar (Nutri-for-Schools - Porta 3001):**
    ```bash
    cd "Nutri-for-Schools/project/nutri-alerta"
    npm install
    npm run dev
    ```

---

## 🔒 Segurança, LGPD & Privacidade (Conformidade Total por Privacy-by-Design)

A engenharia do ecossistema foi projetada sob o pilar de **Privacy-by-Design absoluto** e em total conformidade com a **Lei Geral de Proteção de Dados (LGPD)**:

1.  **Zero Coleta de Dados Pessoais Identificáveis (PII)**: Por escolha de arquitetura defensiva e respeito à privacidade infantil, o sistema **não** coleta, transmite ou armazena qualquer dado pessoal identificável dos alunos (como CPF, RG, nome completo ou dados dos responsáveis). A triagem de pesagem e IMC é 100% anônima desde a origem.
2.  **Anonimização Nativa desde a Coleta**: A tabela `registros_saude` no banco centralizado na nuvem do Supabase armazena apenas dimensões biométricas e demográficas anônimas (`escola_id`, `genero`, `idade`, `peso`, `altura` e data da coleta). Conforme o Artigo 12 da LGPD, dados anonimizados não são considerados dados pessoais para fins de incidência da lei, eliminando qualquer risco à privacidade de identidade dos menores.
3.  **Bypass Seguro com Row Level Security (RLS)**: Embora os registros antropométricos sejam 100% anônimos, a segurança a nível de banco de dados no Supabase é mantida rigorosamente com RLS, permitindo que apenas sessões devidamente autorizadas (autenticadas via SSO cross-port) ou conexões JWT e tokens administrativos realizem gravações.
4.  **Zero Credenciais Expostas**: Nenhuma chave de API, segredo de banco de dados ou credencial de inteligência artificial está exposta no repositório. A orquestração das chaves ocorre de forma isolada a nível de servidor por meio de variáveis de ambiente robustas na Vercel e no GitHub Actions.
