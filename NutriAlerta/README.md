# 📊 NutriAlerta — Portal de Vigilância Nutricional Preditiva
> **Mapeamento geoespacial e inteligência artificial para o direcionamento de recursos community-health em Rio Claro - SP.**  
> *Componente de Mapeamento Municipal do Ecossistema NutriAlerta*

---

## 💡 Proposta do NutriAlerta
O **NutriAlerta** é um portal estratégico de tomada de decisões para **Gestores Municipais de Saúde Pública**. A partir da consolidação de registros demográficos, séries históricas do SISVAN e cadastros de saúde, a plataforma fornece previsões baseadas em aprendizado de máquina para direcionar ações comunitárias preventivas, busca ativa de desnutrição e combate à obesidade infantil.

---

## 🌟 Funcionalidades Principais

1.  **Mapeamento Geoespacial de Risco (Voronoi & Choropleth):**
    *   Visualização da prevalência nutricional por bairros de Rio Claro.
    *   Geração de polígonos de Voronoi dinâmicos para representar as zonas de abrangência de cada uma das **18 Unidades Básicas de Saúde (UBS)**.
    *   Destaque interativo de indicadores críticos (Obesidade, Desnutrição, Sobrepeso, Eutrofia).
2.  **Modelo Preditivo de Machine Learning (Random Forest):**
    *   Algoritmo treinado com dados demográficos e séries históricas.
    *   Previsões de prevalência e variações (*deltas*) projetadas para os anos de **2026 e 2027**, indicando quais bairros tendem a sofrer pioras nos índices nutricionais.
3.  **HUD Reativa Municipal & Comparador de UBSs:**
    *   Consolidação em tempo real dos dados baseada nas escolas do território (~8.5K alunos avaliados em 2025).
    *   Tabelas comparativas de taxas de prevalência entre unidades de saúde para identificar disparidades regionais.
4.  **NutriBot (Assistente de Decisão Epidemiológica):**
    *   Chatbot embarcado alimentado com o modelo **Gemini 1.5/3.5**, que consome o contexto epidemiológico ativo (ano selecionado, taxas regionais de prevalência e índices preditos).
    *   Ajuda gestores a desenharem relatórios, interpretarem dados de risco e formularem políticas públicas.
5.  **Acesso Seguro e Interface Premium:**
    *   Autenticação robusta integrada via **Supabase Auth**.
    *   Interface com suporte completo a **Modo Escuro (Dark Mode)**, com o botão de controle de tema estrategicamente posicionado no canto superior direito do cabeçalho.

---

## 🛠️ Stack Tecnológica

*   **Framework principal:** Next.js (com roteamento App Router)
*   **Visualização de Dados:** Recharts (Gráficos temporais e de distribuição)
*   **Cartografia:** Leaflet e React-Leaflet (Mapas interativos)
*   **Gerenciador de Estado:** Zustand (Sincronização global de seleção de UBS, ano e indicador)
*   **Banco de Dados & Autenticação:** Supabase
*   **IA Generativa:** Gemini API (Google Generative AI SDK)
*   **Animações:** Framer Motion (Transições fluidas e interfaces dinâmicas)

---

## 📋 Integrantes do Time
*   **Scrum Master:** Gabriel Vinicios Nanetti
*   **Product Owner:** Nathan Scremin
*   **Dev Team:** Nicolas Ferreira, Arthur Araujo Leite, Pedro Henrique Carvalho, Matheus Henrique Domingos

---

## 🚀 Como Executar o App

1.  **Navegue até a pasta do aplicativo:**
    ```bash
    cd project/nutri-alerta
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Configure o arquivo `.env.local` na pasta do app:**
    ```env
    NEXT_PUBLIC_SUPABASE_URL=seu-url-supabase
    NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-supabase
    GEMINI_API_KEY=sua-chave-api-gemini
    ```
4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    *O aplicativo rodará na porta padrão `3000` (http://localhost:3000).*

---

## 🔄 Fluxo de Processamento de Dados (ETL & ML)

```mermaid
graph LR
    A[Bases de Dados SISVAN] -->|ETL em Python| B[Agregação por Coordenadas]
    C[Shapefiles IBGE Bairros] -->|GeoPandas Centroides| D[Unificação Geográfica]
    B --> E[Modelo Random Forest]
    D --> E
    E -->|Predições de Tendências 2026/27| F[Dashboard Next.js / API Data]
```
