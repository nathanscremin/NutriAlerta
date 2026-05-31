# 🚀 Guia Oficial de Deploy Duplo na Vercel & Automação Gratuita de IA
> **Como hospedar o Ecossistema NutriAlerta e o Portal Nutri for Schools de forma profissional e gratuita**  
> *Projeto Interdisciplinar · Versão de Produção*

Este guia técnico descreve detalhadamente o passo a passo para colocar em produção ambos os portais do ecossistema (**NutriAlerta** para gestão municipal e **Nutri for Schools** para pesagem e exames escolares) na nuvem da **Vercel**, conectando-os ao banco de dados Supabase com sincronização automática e acionamento gratuito da inteligência artificial via **GitHub Actions**.

---

## 🏛️ 1. Arquitetura de Produção Unificada (Monorepo Híbrido)

Ambas as aplicações Next.js estão hospedadas no mesmo repositório do GitHub (Monorepo), mas rodam de forma isolada na nuvem. A Vercel gerencia ambos de forma totalmente gratuita através da criação de dois projetos individuais a partir do mesmo repositório:

```
                  ┌──────────────────────────────┐
                  │   Tela de Login Unificada    │
                  │   (https://nutrialerta...)   │
                  └──────────────┬───────────────┘
                                 │
                 Selecione o Sistema no Slide
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

Esta arquitetura garante que:
1. Os dois portais fiquem isolados, garantindo a divisão de privilégios de acesso.
2. Eles sincronizem as sessões de login de forma segura no navegador através de parâmetros de criptografia na URL de Redirecionamento (`access_token` e `refresh_token`).
3. O deploy, o tráfego de dados e as execuções do pipeline de IA permaneçam **100% gratuitos**.

---

## 🤖 Passo 1: Configurar a Automação da IA (GitHub Actions)

Antes de subir o frontend, configure o processador de inteligência artificial na nuvem para garantir que os dados estejam prontos. Substituímos a necessidade de servidores pagos (como o Render Cron/Background Workers) pelo pipeline gratuito do GitHub Actions:

1. Acesse a página do seu repositório no **GitHub**.
2. Vá nas configurações em **Settings ➔ Secrets and variables ➔ Actions**.
3. Clique no botão **New repository secret** para cadastrar as 4 chaves secretas necessárias:

| Nome da Secret | Valor Recomendado | Finalidade |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Sua URL do Supabase* | Link de conexão com o banco de dados. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Sua Anon Key do Supabase* | Chave anônima de leitura rápida. |
| `SUPABASE_EMAIL` | `nutrialerta@gmail.com` | Email de serviço da IA. |
| `SUPABASE_PASSWORD` | `#Pangam123@` | Senha da conta de serviço para realizar o bypass RLS. |

4. **Para testar a IA:** Vá até a aba **Actions** no topo do GitHub, selecione **NutriAlerta ML Predictor** à esquerda, clique em **Run workflow** ➔ **Run workflow** (botão verde). O script rodará o RandomForest, treinará a IA e persistirá as projeções do ano 2026 no Supabase na nuvem em segundos!

---

## 🎨 Passo 2: Hospedar o Portal do Gestor (Projeto Vercel 1)

O primeiro projeto hospedará o portal principal do município (**NutriAlerta**), que gerencia os mapas epidemiológicos, gráficos temporais e contém a tela de login integrada:

1. Acesse [vercel.com](https://vercel.com) e faça login integrado com sua conta do GitHub.
2. Clique em **"Add New" ➔ "Project"** e selecione o seu repositório `NutriAlerta`.
3. Nas configurações do projeto, defina os seguintes parâmetros:
   *   **Project Name:** `nutrialerta` (ou similar)
   *   **Framework Preset:** `Next.js`
   *   **Root Directory (Pasta Raiz):** Clique em *Edit* e selecione a pasta:
       `NutriAlerta/project/nutri-alerta`
4. Expanda a seção **Environment Variables** e adicione exatamente as seguintes chaves do seu arquivo `.env.local`:

| Nome da Variável | Valor Recomendado |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Sua URL do Supabase* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Sua Anon Key do Supabase* |
| `SUPABASE_ADMIN_EMAIL` | `nutrialerta@gmail.com` |
| `SUPABASE_ADMIN_PASSWORD` | `#Pangam123@` |
| `GEMINI_API_KEY` | *Sua Chave do Google Gemini* (Alimenta o chatbot NutriBot) |
| `NEXT_PUBLIC_NUTRISCHOOLS_URL` | `https://[SUBDOMINIO-DO-SEU-PROJETO-ESCOLAR].vercel.app` |

*(A variável `NEXT_PUBLIC_NUTRISCHOOLS_URL` deve apontar para o link público do segundo projeto que será criado no Passo 3. Se você ainda não o criou, pode cadastrá-la com uma URL temporária e atualizá-la depois nas configurações da Vercel).*

5. Clique em **Deploy**. A Vercel compilará a aplicação e gerará uma URL criptografada HTTPS gratuita (exemplo: `https://nutrialerta.vercel.app`).

---

## 🏫 Passo 3: Hospedar o Portal de Pesagem Escolar (Projeto Vercel 2)

O segundo projeto hospedará a interface do portal coletor escolar (**Nutri for Schools**), onde as escolas registram a pesagem e exames antropométricos dos alunos:

1. No dashboard da Vercel, clique em **Add New ➔ Project**.
2. Selecione o **mesmo repositório** `NutriAlerta`.
3. Configure os parâmetros da seguinte forma:
   *   **Project Name:** `nutriforschools` (ou similar)
   *   **Framework Preset:** `Next.js`
   *   **Root Directory (Pasta Raiz):** Clique em *Edit* e aponte para a subpasta:
       `Nutri for Schools/project/nutri-alerta`
4. Expanda a seção **Environment Variables** e configure as variáveis de ambiente:

| Nome da Variável | Valor Recomendado |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | *Sua URL do Supabase* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *Sua Anon Key do Supabase* |
| `NEXT_PUBLIC_NUTRIALERTA_URL` | `https://[SEU-SITE-NUTRIALERTA-DO-PASSO-2].vercel.app` |

*(A variável `NEXT_PUBLIC_NUTRIALERTA_URL` deve conter a URL pública gerada no Passo 2 pelo portal principal, garantindo que o sistema de segurança redirecione os alunos sem sessão de volta à tela de login).*

5. Clique em **Deploy**. O portal escolar estará no ar! (exemplo: `https://nutriforschools.vercel.app`).

---

## ⚡ Passo 4: Atualizando o Cache do Vercel KV (Bypass)

O portal NutriAlerta utiliza o cache em nuvem Vercel KV para otimizar as conexões e evitar custos adicionais de banco de dados, retendo as informações da API por **6 horas**. 

Sempre que a IA rodar no GitHub Actions ou você inserir novas pesagens, você pode forçar a atualização imediata do cache global na nuvem acessando uma vez no seu navegador o seguinte link de API com a flag de bypass:

```
https://[SEU-SITE-DO-GESTOR].vercel.app/api/data?refresh=true
```

Ao fazer isso:
1. O Next.js ignora o cache antigo.
2. Consulta as projeções recalculadas e as pesagens diretamente no Supabase em tempo real.
3. Grava o novo conjunto de dados atualizado de volta no cache para todos os usuários.
4. O dashboard apresentará os novos dados instantaneamente!

---

## 🔄 Fluxo de Teste End-to-End no Ar

Com os dois deploys verdes e ativos na Vercel:
1. Acesse o portal escolar (`https://nutriforschools.vercel.app`). Como não há sessão ativa, o middleware irá redirecioná-lo automaticamente para o portal principal (`https://nutrialerta.vercel.app`) contendo a flag de logout.
2. Faça login escolhendo a opção **"Nutri for Schools"** e inserindo as credenciais.
3. Você será redirecionado para a página escolar automaticamente com a sessão sincronizada de forma transparente. Cadastre uma pesagem de teste de obesidade infantil na **UBS Jardim Chervezon**.
4. Acesse o **GitHub Actions** e clique em **Run workflow** para re-treinar a IA na nuvem.
5. Visite `https://[SEU-SITE-DO-GESTOR].vercel.app/api/data?refresh=true` para atualizar o cache.
6. Ao abrir o portal do gestor e mudar o seletor de ano para **2026**, as tendências da IA da UBS Chervezon estarão adaptadas para incluir as novas pesagens simuladas em tempo real!
