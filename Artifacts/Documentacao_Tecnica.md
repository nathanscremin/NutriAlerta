# 📖 Dossiê de Documentação Técnica Assistida
## 🥗 Ecossistema NutriAlerta & Nutri for Schools
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
    │      [NutriAlerta]    │                 │  [Nutri for Schools]  │
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

## 🔐 4. Protocolo de Segurança, LGPD & Criptografia

A proteção de dados sensíveis e pessoais de menores de idade é efetuada no servidor Next.js através de técnicas rigorosas:

### 4.1. Pseudonimização (SHA-256 HMAC com Salt)
O CPF do aluno nunca é salvo de forma legível. O CPF e o Salt do servidor são convertidos em um ID imutável:
```typescript
function pseudonymize(cpf: string): string {
  const normalizedCpf = cpf.replace(/\D/g, ''); // Remove pontuações
  return crypto.createHmac('sha256', process.env.HASH_SALT).update(normalizedCpf).digest('hex');
}
```

### 4.2. Criptografia Simétrica (AES-256-GCM)
Dados de identificação como o nome do aluno e do responsável são criptografados:
*   **Algoritmo:** `aes-256-gcm` (criptografia simétrica com autenticação de integridade de dados).
*   **Chave:** `ENCRYPTION_KEY` de exatamente 256 bits (32 caracteres).
*   **IV (Initialization Vector):** 12 bytes aleatórios gerados a cada nova criptografia, garantindo que o mesmo nome resulte em cifras diferentes a cada salvamento.

---

## 🔄 5. Protocolo de Sincronização de Login (SSO Cross-Port)

Para prover uma experiência premium e integrada sem que o usuário tenha de autenticar em cada porta separadamente, desenvolvemos um fluxo de **Single Sign-On (SSO)** seguro:

1.  **Login Unificado:** O usuário se autentica na porta `3000` (`NutriAlerta`) e seleciona o destino "Nutri for Schools".
2.  **Redirecionamento Criptográfico via Hash:**
    O servidor da porta 3000 autentica as credenciais com o Supabase e redireciona o usuário para:
    `https://nutriforschools.vercel.app/auth/sync#access_token=XXX&refresh_token=YYY`
3.  **Estabelecimento da Sessão Local (Sem Trânsito de Senhas):**
    O portal escolar lê o fragmento de hash (`#`) do navegador client-side (o hash nunca é enviado nas requisições HTTP ao servidor, prevenindo interceptações). O script estabelece a sessão local no Supabase do cliente e cria o cookie seguro correspondente:
    `document.cookie = "sb-<project-ref>-auth-token=XXX; path=/; max-age=604800; SameSite=Lax"`
4.  **Middleware Gateway:**
    O `middleware.ts` do portal escolar intercepta as requisições protegidas, valida a presença e validade do cookie `sb-*-auth-token`, permitindo o acesso ao `/dashboard` ou redirecionando-o defensivamente à página de login unificada caso esteja deslogado.
