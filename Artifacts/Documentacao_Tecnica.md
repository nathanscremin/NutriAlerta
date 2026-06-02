# 📖 Dossiê de Documentação Técnica Assistida
## 🥗 Ecossistema NutriAlerta & Nutri-for-Schools
> **Engenharia de Software, Modelagem Preditiva (ML), Segurança LGPD e Infraestrutura**  
> *Projeto Interdisciplinar do 3º Semestre · FATEC Rio Claro · Manual Técnico Final*

---

## 1. 🏛️ Arquitetura Geral do Ecossistema

O ecossistema foi estruturado sob o conceito de **Monorepo Híbrido Isolado**. Ambas as aplicações rodam de forma independente e isolada, garantindo privacidade e divisão de privilégios de acesso, mas compartilhando o mesmo banco de dados relacional e a mesma lógica preditiva.

```
                      ┌──────────────────────────────┐
                      │   Tela de Login Unificada    │
                      │  (https://nutrialerta...)    │
                      └──────────────┬───────────────┘
                                     │
                     Selecione o Sistema no Selector
                                     │
                ┌────────────────────┴────────────────────┐
                ▼ (Dashboard Gestor)                      ▼ (Portal de Pesagem)
    ┌───────────────────────┐                 ┌───────────────────────┐
    │     Projeto Vercel 1  │                 │     Projeto Vercel 2  │
    │      [NutriAlerta]    │                 │  [Nutri-for-Schools]  │
    │   (Porta Local 3000)  │                 │   (Porta Local 3001)  │
    └───────────┬───────────┘                 └───────────┬───────────┘
                │                                         │
                │          Consultas / Escritas           │
                └────────────────────┬────────────────────┘
                                     ▼
                        ┌─────────────────────────┐
                        │      Supabase DB        │
                        │   (Tabelas Relacionais) │
                        └────────────▲────────────┘
                                     │ Upsert de Projeções (RandomForest)
                        ┌────────────┴────────────┐
                        │     GitHub Actions      │
                        │  (ML Engine Executável) │
                        └─────────────────────────┘
```

---

## 💾 2. Modelagem do Banco de Dados & RLS (Supabase)

O banco de dados relacional está hospedado na nuvem do Supabase. A segurança e privacidade dos dados são mantidas no nível mais baixo (banco de dados) através de **Row Level Security (RLS)**.

### 📊 Estrutura de Tabelas Principais

#### 1. Tabela `escolas`
Armazena a identificação e geolocalização de cada uma das escolas monitoradas de Rio Claro.
*   `id` (bigint, Primary Key): Identificador único.
*   `nome` (text): Nome da escola.
*   `bairro` (text): Bairro onde está localizada.
*   `created_at` (timestamp with time zone).

#### 2. Tabela `registros_saude`
Registros antropométricos individuais de pesagem e exames antropométricos coletados das crianças.
*   `id` (bigint, Primary Key): Identificador único.
*   `escola_id` (bigint, Foreign Key ➔ `escolas.id`): Escola de origem do aluno.
*   `genero` (character(1)): `M` (Masculino) ou `F` (Feminino).
*   `idade_anos` (integer): Idade em anos do aluno.
*   `peso_kg` (numeric): Peso corporal em kg.
*   `altura_m` (numeric): Altura em metros.
*   `classificacao` (text): Classificação do estado nutricional calculada pela OMS (Eutrofia, Magreza, Desnutrição, Sobrepeso, Obesidade).
*   `alerta_risco` (boolean): Flag que sinaliza estado de risco clínico ativo.
*   `cnes_ubs` (text): CNES da Unidade Básica de Saúde vinculada ao território do aluno.

#### 3. Tabela `previsoes_nutricionais`
Tabela central que armazena os cálculos de prevalência nutricional histórica e as projeções estimadas de inteligência artificial.
*   `cnes` (text, Primary Key part): CNES identificador da UBS.
*   `ano` (integer, Primary Key part): Ano correspondente ao dado (histórico ou previsão ★).
*   `faixa_etaria_cod` (integer, Primary Key part): Código identificador da faixa etária avaliada.
*   `tipo_projecao` (text, Primary Key part): Identificador da linha da IA (`obesidade` ou `desnutricao`).
*   `status` (text): Estado do registro (`DADO HISTÓRICO` ou `PREVISÃO FUTURA`).
*   `magreza_acentuada_pct` (numeric): Taxa de desnutrição/magreza severa (%).
*   `magreza_pct` (numeric): Taxa de magreza populacional (%).
*   `eutrofia_pct` (numeric): Taxa de peso adequado/eutrofia (%).
*   `sobrepeso_pct` (numeric): Taxa de sobrepeso populacional (%).
*   `obesidade_pct` (numeric): Taxa de obesidade grau I/II (%).
*   `obesidade_grave_pct` (numeric): Taxa de obesidade grave/mórbida (%).
*   `delta_predito` (numeric): Taxa de variação predita pela IA em relação ao ano anterior.

### 🛡️ Políticas de Segurança (Row Level Security - RLS)
*   **Acesso de Leitura Pública:** Qualquer usuário autenticado (gestores e escolas) pode ler as predições e estatísticas de registro.
*   **Bypass de Escrita Administrativa:** A gravação física dos dados sensíveis e predições de ML é feita exclusivamente por JWT autenticado da conta de serviço (`nutrialerta@gmail.com`), bloqueando qualquer tentativa de injeção externa de dados.

---

## 🤖 3. Modelagem de Inteligência Artificial (ML Engine)

Para a análise de tendências epidemiológicas, foi desenvolvido um pipeline de aprendizado de máquina supervisionado em **Python**.

### 🧠 Algoritmo: Regressor Random Forest
*   **Dataset:** Dados históricos reais do SISVAN correlacionados a censos demográficos do IBGE de Rio Claro.
*   **Feature Engineering:** Mapeamento histórico por ano, UBS de origem, faixas etárias, e índices históricos de magreza, eutrofia, sobrepeso e obesidade.
*   **Pipeline de Treinamento (`unified_ML.py`):** 
    1.  O script treina estimadores paralelos de florestas de regressão (*Random Forest Regressor* com 300 estimadores).
    2.  Gera projeções matemáticas de risco para o ano de **2026** e **2027**.
    3.  Faz o Upsert em lote das predições diretamente no Supabase na nuvem e atualiza backups em CSV.
*   **Automação Gratuita (GitHub Actions):** O modelo é re-treinado automaticamente na nuvem sem custos utilizando um workflow do GitHub Actions (`run_ml.yml`), disparado por cronograma diário ou manualmente via *workflow_dispatch*.

---

## 🔐 4. Protocolo de Segurança, LGPD & Anonimização Nativa

A proteção e a privacidade dos menores no ecossistema são garantidas no nível mais alto de conformidade jurídica através de uma arquitetura defensiva focada em **Anonimização Nativa desde a Origem (Privacy-by-Design)**:

### 4.1. Ausência Total de Dados Pessoais Identificáveis (PII)
Por diretriz estrita de design e respeito aos direitos fundamentais de privacidade infantil, o ecossistema **não** coleta, trafega ou armazena qualquer dado pessoal identificável dos alunos da rede municipal (como CPF, RG, nomes civis completos ou filiação). 

### 4.2. Triagem e Armazenamento 100% Anônimo
A tabela central `registros_saude` no Supabase persiste estritamente variáveis clínicas e demográficas anônimas:
*   `escola_id` (vínculo geográfico do colégio, sem expor endereço residencial).
*   `genero` (apenas dimensão epidemiológica `M` ou `F`).
*   `idade_anos` (idade discreta).
*   `peso_kg` e `altura_m` (dimensões biométricas brutas para cálculo do IMC).
*   `data_coleta` (momento cronológico da triagem).

Essa abordagem garante que, nos termos do **Artigo 12 da Lei Geral de Proteção de Dados (LGPD - Lei 13.709/18)**, os dados antropométricos sejam considerados dados anônimos e, por consequência, fiquem fora da incidência da lei. Isso elimina por completo qualquer vetor de ataque de quebra de confidencialidade de identidade de menores.

### 4.3. Regras de Acesso e Segurança Operacional
A segurança e a integridade da base de dados são mantidas através de:
*   **Políticas de RLS (Row Level Security):** Filtros ativos a nível de banco no Supabase que barram consultas e inserções sem privilégios ou escopos apropriados.
*   **Orquestração Isolada de Variáveis Ambientais:** Todas as chaves secretas de acesso à nuvem, tokens JWT do Supabase e as chaves de API para os modelos preditivos e chatbot de IA são configuradas exclusivamente via painel administrativo de variáveis na Vercel e no GitHub Actions. Isso assegura que nenhuma credencial confidencial seja injetada no repositório de código público.
---

## 🔄 5. Protocolo de Sincronização de Login (SSO Cross-Port)

Para prover uma experiência premium e integrada sem que o usuário tenha de autenticar em cada porta separadamente, desenvolvemos um fluxo de **Single Sign-On (SSO)** seguro:

1.  **Login Unificado:** O usuário se autentica na porta `3000` (`NutriAlerta`) e seleciona o destino "Nutri-for-Schools".
2.  **Redirecionamento Criptográfico via Hash:**
    O servidor da porta 3000 autentica as credenciais com o Supabase e redireciona o usuário para:
    `https://nutriforschools.vercel.app/auth/sync#access_token=XXX&refresh_token=YYY`
3.  **Estabelecimento da Sessão Local (Sem Trânsito de Senhas):**
    O portal escolar lê o fragmento de hash (`#`) do navegador client-side (o hash nunca é enviado nas requisições HTTP ao servidor, prevenindo interceptações). O script estabelece a sessão local no Supabase do cliente e cria o cookie seguro correspondente:
    `document.cookie = "sb-<project-ref>-auth-token=XXX; path=/; max-age=604800; SameSite=Lax"`
4.  **Middleware Gateway:**
    O `middleware.ts` do portal escolar intercepta as requisições protegidas, valida a presença e validade do cookie `sb-*-auth-token`, permitindo o acesso ao `/dashboard` ou redirecionando-o defensivamente à página de login unificada caso esteja deslogado.
