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
Crie um arquivo `.env.local` na raiz de cada pasta de projeto Next.js (`project/nutri-alerta/`) com as seguintes chaves de configuração obrigatórias:

```env
# Conectividade Supabase
NEXT_PUBLIC_SUPABASE_URL=seu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-supabase

# Autenticação Segura & Administração (Bypass RLS no Servidor)
SUPABASE_ADMIN_EMAIL=email-do-admin-do-supabase
SUPABASE_ADMIN_PASSWORD=senha-do-admin-do-supabase

# Segurança e Criptografia de Dados Sensíveis de Menores (LGPD)
ENCRYPTION_KEY=sua-chave-aes-256-com-exatamente-32-caracteres
HASH_SALT=seu-salt-para-hashes-hmac

# Inteligência Artificial e Tomada de Decisão (Apenas no NutriAlerta para o NutriBot)
GEMINI_API_KEY=sua-chave-api-gemini
```

---

## 🔒 Segurança, LGPD & Privacidade (Complacência Total)

A arquitetura do ecossistema **NutriAlerta** passou por um rigoroso processo de auditoria de segurança e adequação à **Lei Geral de Proteção de Dados (LGPD)**:
1. **Zero Credenciais Hardcoded**: Não existem usuários, senhas de homologação ou tokens de acesso em texto plano no bundle enviado ao cliente. A autenticação do gestor e os fluxos de automação de dados ocorrem exclusivamente em ambiente de servidor seguro (SSR e API Routes).
2. **Criptografia Simétrica (AES-256-CBC)**: As informações confidenciais dos alunos menores de idade são criptografadas antes de serem persistidas no banco de dados. Caso as chaves de segurança (`ENCRYPTION_KEY` e `HASH_SALT`) estejam ausentes nas variáveis de ambiente, os endpoints do backend bloqueiam preventivamente qualquer operação para evitar vazamentos.
3. **Resiliência de Rede (Timeouts Ativos)**: Ambas as telas de carregamento inicial e de validação de sessões do dashboard possuem timeouts defensivos de 5 segundos, fornecendo opções de redirecionamento imediato em caso de instabilidades.

---

## 📈 Critérios Clínicos & Antropometria Oficial (OMS Z-score)

Abandonamos as classificações simplistas e estáticas de IMC. O ecossistema agora implementa as tabelas de referência de **desvio padrão de IMC-para-idade da Organização Mundial da Saúde (OMS Z-score)** para crianças e adolescentes de 0 a 18 anos, diferenciados rigorosamente por sexo (meninos e meninas):
* **Magreza Acentuada**: IMC < -3 DP (Desvios Padrão)
* **Magreza**: -3 DP <= IMC < -2 DP
* **Eutrofia (Peso adequado)**: -2 DP <= IMC <= +1 DP
* **Sobrepeso**: +1 DP < IMC <= +2 DP
* **Obesidade**: IMC > +2 DP

Essa calibração assegura precisão clínica absoluta para triagens em UBS e escolas do município de Rio Claro.

---

## 🛠️ Qualidade e Verificação Estática de Tipagem

O projeto Next.js foi estruturado para garantir 100% de confiabilidade e facilidade de compilação contínua (CI):
* **Validação Estática**:
  ```bash
  npm run type-check
  ```
  Executa `tsc --noEmit` para validar todas as interfaces e tipagens do TypeScript.
* **Build de Produção**:
  ```bash
  npm run build
  ```
  O otimizador do Next.js compila todas as páginas estáticas e APIs com performance premium em segundos.

