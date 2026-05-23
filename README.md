# 🥗 Ecossistema NutriAlerta & Nutri for Schools
> **Mapeamento Epidemiológico e Gestão de Saúde Nutricional Escolar**  
> *Projeto Interdisciplinar do 3º Semestre · 2026 · FATEC Rio Claro · Saúde Pública*

Este repositório unifica duas soluções complementares baseadas em dados reais de saúde e aprendizado de máquina para transformar o acompanhamento nutricional da população infantil de **Rio Claro - SP**.

---

## 👥 Equipe do Projeto (Scrum Framework)
O desenvolvimento seguiu as práticas ágeis do Scrum, com sprints quinzenais e foco em qualidade contínua (DoD):

*   **Scrum Master:** Gabriel Vinicios Nanetti (Gestão ágil, facilitação e rituais)
*   **Product Owner:** Nathan Scremin (Definição de visão, priorização do backlog)
*   **Dev Team (Desenvolvimento, Engenharia de Dados & Machine Learning):**
    *   Nicolas Ferreira da Silva
    *   Arthur Araujo Leite
    *   Pedro Henrique Carvalho de Paula
    *   Matheus Henrique Domingos da Silva

---

## 🏛️ Visão Geral do Ecossistema

O ecossistema divide-se em duas vertentes interdependentes que atuam em sintonia por meio de um banco de dados integrado:

```mermaid
graph TD
    subgraph Fontes ["Fontes de Entrada"]
        SISVAN[SISVAN: Dados Nutricionais Históricos]
        Censo[IBGE: Censo Demográfico]
        Escolas[CNES & Cadastro Escolar]
    end

    subgraph Core ["Banco de Dados Consolidado (Supabase)"]
        DB[(Banco de Dados Supabase)]
    end

    subgraph App1 ["NutriAlerta (Port 3000)"]
        NA_App[Next.js Portal do Gestor]
        Model[Modelo Preditivo RF Classifier]
        Map[Mapa Coroplético & Voronoi]
        Bot[NutriBot: Assistente de Decisão]
    end

    subgraph App2 ["Nutri for Schools (Port 3001)"]
        NFS_App[Next.js Portal Escolar]
        Stats[Estatísticas de IMC e Eutrofia]
        Auth[Gestão de Acesso e Contas]
    end

    SISVAN --> DB
    Censo --> DB
    Escolas --> DB

    DB <--> App1
    DB <--> App2

    classDef app1 fill:#0f766e,stroke:#115e59,color:#fff,stroke-width:2px;
    classDef app2 fill:#4338ca,stroke:#3730a3,color:#fff,stroke-width:2px;
    classDef db fill:#0284c7,stroke:#0369a1,color:#fff,stroke-width:2px;
    
    class NA_App,Model,Map,Bot app1;
    class NFS_App,Stats,Auth app2;
    class DB db;
```

---

## 📁 Estrutura de Diretórios

O repositório está estruturado da seguinte forma:

```bash
NutriAlerta/           # Repositório Principal
├── NutriAlerta/       # 1. Sistema do Gestor Público (Portal Municipal)
│   ├── project/
│   │   ├── csv/       # Bases históricas e projeções preditivas (.csv)
│   │   └── nutri-alerta/   # Código do app Next.js (Dashboard do Gestor)
│   └── collector/     # Script raspador/coletor independente
│
└── Nutri for Schools/ # 2. Sistema Escolar Individual (Acompanhamento Local)
    ├── project/
    │   ├── csv/
    │   └── nutri-alerta/   # Código do app Next.js (Dashboard da Escola)
    └── collector/
```

### 1. [NutriAlerta (Gestão Pública)](file:///c:/Users/natha/Documents/GitHub/NutriAlerta/NutriAlerta)
Focado no **Gestor Municipal de Saúde e Vigilância Nutricional**. Permite analisar a prevalência de obesidade, sobrepeso e desnutrição de forma agregada no município.
*   **Destaques:** Mapa de Risco Choropleth integrado com diagramas de Voronoi, modelo preditivo de Machine Learning (*Random Forest*) para os anos de 2026/2027 e assistente com IA para tomada de decisões epidemiológicas (**NutriBot**).

### 2. [Nutri for Schools (Gestão Escolar)](file:///c:/Users/natha/Documents/GitHub/NutriAlerta/Nutri%20for%20Schools)
Focado na **Diretoria Escolar e Nutricionistas da Merenda**. Trata do acompanhamento de 88 escolas municipais e estaduais de Rio Claro.
*   **Destaques:** Acompanhamento individual e por faixa etária de alunos, cálculo automático de curvas de IMC, estatísticas locais de peso saudável (eutrofia) e avaliação de conformidade da merenda oferecida.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
*   **Node.js** (versão 18 ou superior)
*   **npm** ou **yarn**
*   **Supabase** (configurado com as variáveis de ambiente corretas)

### Executando Simultaneamente
Como os dois aplicativos rodam localmente, as portas de desenvolvimento foram configuradas para evitar conflitos:
1.  **NutriAlerta** roda na porta padrão `3000`.
2.  **Nutri for Schools** roda na porta `3001`.

#### Passo 1: Inicializando o NutriAlerta (Port 3000)
```bash
cd "NutriAlerta/project/nutri-alerta"
npm install
npm run dev
```
Acesse o portal do gestor em: `http://localhost:3000`

#### Passo 2: Inicializando o Nutri for Schools (Port 3001)
```bash
cd "../../Nutri for Schools/project/nutri-alerta"
npm install
npm run dev
```
Acesse o portal escolar em: `http://localhost:3001`

---

## ⚙️ Variáveis de Ambiente (`.env.local`)
Crie um arquivo `.env.local` na raiz de cada pasta de projeto Next.js (`project/nutri-alerta/`) com o seguinte formato:
```env
NEXT_PUBLIC_SUPABASE_URL=seu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-supabase
GEMINI_API_KEY=sua-chave-api-gemini # Apenas necessário no NutriAlerta (para o NutriBot)
```

## 🔒 Credenciais de Acesso (Login de Teste)
Ambos os sistemas compartilham a mesma autenticação via Supabase Auth. Você pode usar as credenciais padrão de homologação para testes:
*   **E-mail:** `nutrialerta@gmail.com`
*   **Senha:** `#Pangam123@`
