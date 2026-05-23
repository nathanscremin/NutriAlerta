# 🏫 Nutri for Schools — Portal de Monitoramento Nutricional Escolar
> **Acompanhamento individualizado e diagnóstico nutricional das escolas públicas e privadas de Rio Claro - SP.**  
> *Componente Escolar e de Merenda do Ecossistema NutriAlerta*

---

## 💡 Proposta do Nutri for Schools
O **Nutri for Schools** é um sistema desenvolvido para **Diretorias de Escolas, Equipes Pedagógicas e Nutricionistas da Merenda Escolar**. Focado em uma análise micro (escola por escola, aluno por aluno), o portal permite realizar pesagens periódicas, calcular automaticamente curvas de IMC, identificar alunos em situação de vulnerabilidade nutricional e certificar a adequação dos cardápios e merendas servidas.

---

## 🌟 Funcionalidades Principais

1.  **Monitoramento Nutricional por Escola:**
    *   Painel estatístico focado nas **88 escolas** de Rio Claro.
    *   Divisão e filtros dinâmicos por faixas etárias, categorias escolares (Educação Infantil, Ensino Fundamental, Ensino Médio) e dependências administrativas (Estadual, Municipal).
2.  **Cálculo Automatizado de IMC & Classificação:**
    *   Registro rápido de dados individuais de peso (kg) e altura (m).
    *   Classificação imediata com base nas curvas de referência: Eutrofia (Peso Saudável), Sobrepeso, Obesidade e Desnutrição.
3.  **Auditoria e Planejamento da Merenda Escolar:**
    *   Verificação da adequação do cardápio escolar em relação aos índices de saúde da escola.
    *   Alinhamento de recursos para reforçar proteínas ou reduzir açúcares dependendo da prevalência local de distúrbios de peso.
4.  **HUD Reativa da Escola:**
    *   Visualização de dados históricos e acompanhamento de evoluções anuais das métricas da escola.
    *   Geração automática de relatórios de saúde por classe.
5.  **Acesso Seguro e Interface Premium:**
    *   Autenticação robusta integrada via **Supabase Auth**.
    *   Suporte a **Modo Escuro (Dark Mode)**, com botão de controle de tema no canto superior direito para melhor visualização em salas de aula ou refeitórios.

---

## 🛠️ Stack Tecnológica

*   **Framework principal:** Next.js (App Router)
*   **Visualização de Dados:** Recharts (Distribuição de IMC por faixa etária, tendências anuais)
*   **Cartografia Local:** Leaflet (Visualização de escolas vizinhas e UBS de referência)
*   **Gerenciador de Estado:** Zustand (Sincronização global da escola, ano e filtros de alunos)
*   **Banco de Dados & Autenticação:** Supabase
*   **Animações:** Framer Motion (Interfaces fluidas e gráficos animados)

---

## 📋 Integrantes do Time
*   **Scrum Master:** Gabriel Vinicios Nanetti
*   **Product Owner:** Nathan Scremin
*   **Dev Team:** Nicolas Ferreira, Arthur Araujo Leite, Pedro Henrique Carvalho, Matheus Henrique Domingos

---

## 🚀 Como Executar o App

Para evitar colisões com o painel municipal do NutriAlerta, este portal foi configurado para rodar na **porta 3001**:

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
    ```
4.  **Execute o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    *O aplicativo rodará na porta configurada `3001` (http://localhost:3001).*

---

## 📋 Critérios de Qualidade (Definition of Done)
Qualquer novo incremento, ajuste de IMC ou cadastro no portal escolar segue estritamente a política de qualidade do time:
1.  Código versionado com commits descritivos.
2.  Cálculos de IMC testados com amostras reais de estudantes.
3.  Estilos adaptados e testados para modo claro e escuro.
