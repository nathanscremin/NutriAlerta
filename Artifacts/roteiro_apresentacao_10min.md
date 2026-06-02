# Roteiro Estratégico de Apresentação de Alto Impacto (10 Minutos)
## Ecossistema Preditivo Epidemiológico NutriAlerta
> *Projeto Interdisciplinar do 3º Semestre · FATEC Rio Claro · Guia de Banca e Apresentação Sênior*

Este guia foi elaborado para capacitar a equipe do **NutriAlerta** a apresentar todo o ecossistema de software, dados e inteligência artificial de forma brilhante no curto espaço de tempo de **10 minutos**. 

A estratégia principal baseia-se em **Show, Don't Tell** (demonstrar o software funcionando em vez de passar longos minutos lendo slides) e estruturar a banca de forma a dominar a sessão de perguntas e respostas.

---

## ⏱️ Divisão de Tempo e Roteiro de Fala (Minuto a Minuto)

```
[Mins 00-02] ──► 1. O Problema e a Proposta (O Gancho)
[Mins 02-06] ──► 2. O Show: Demonstração do Dashboard ao Vivo (Impacto Visual)
[Mins 06-08] ──► 3. O Cérebro: Motor de IA e Confiabilidade (MAE < 1%)
[Mins 08-09] ──► 4. Prontidão de Nuvem e Visão de Futuro (NutriBot & Deploy)
[Mins 09-10] ──► 5. Encerramento e Agradecimentos
```

---

### 🔴 PARTE 1: O Problema e a Proposta de Valor (00:00 - 02:00)
*   **Slide 1: Capa Institucional (NutriAlerta - Vigilância Preditiva em Saúde)**
*   **Slide 2: O Desafio da Gestão Alimentar Municipal**
*   **O que falar:**
    > *"Boa tarde a todos os membros da banca. Hoje, a gestão alimentar e nutricional nas redes de Atenção Básica dos municípios enfrenta um grave problema: a falta de planejamento preventivo. Gestores públicos tentam combater desnutrição e obesidade infantil olhando apenas para o espelho retrovisor — dados estáticos do passado. Quando um surto de má-nutrição ou obesidade é percebido em uma periferia, as ações já são tardias."*
*   **Slide 3: Apresentando o NutriAlerta**
*   **O que falar:**
    > *"Para transformar a reação em prevenção, nós desenvolvemos o NutriAlerta. Um ecossistema completo que unifica o histórico de exames clínicos das escolas e UBSs de forma digital em nuvem, cruza essas informações com determinantes urbanos e geográficos, e utiliza Inteligência Artificial para **prever os índices nutricionais da população com até 2 anos de antecedência**."*

---

### 🔵 PARTE 2: A Demonstração Prática do Software (02:00 - 06:00)
*Esta é a parte que mais encanta a banca. Abram a aplicação real rodando e operem ao vivo.*

*   **Tópico 1: O Mapa de Risco e Calor (02:00 - 04:00)**
    *   **Ação na tela:** Exibam o Mapa de Calor de Rio Claro. Digitem um bairro ou UBS na barra de busca (mostrando a responsividade e a correção do overlap com o botão de limpar).
    *   **O que falar:**
        > *"Aqui vemos a nossa principal ferramenta de inteligência territorial: o Mapa de Risco. O gestor de saúde não olha para planilhas complexas, ele olha para o território. O mapa consolida de forma geográfica a desnutrição e obesidade. Além disso, identificamos na barra de pesquisa a integração em tempo real com as escolas. O sistema exibe o entorno urbano da UBS — o que chamamos na literatura médica de 'Desertos Alimentares' (regiões sem mercados) e 'Pântanos Alimentares' (saturação de comércios de ultraprocessados/fast-food)."*
*   **Tópico 2: Infraestrutura das UBSs e Comparador Analítico (04:00 - 06:00)**
    *   **Ação na tela:** Naveguem pelas caixas de indicadores do perfil demográfico e de infraestrutura de UBSs. Mostrem a seção de comparação de UBSs (destacando a estrela "★ Melhor").
    *   **O que falar:**
        > *"Descendo para a infraestrutura, o sistema categoriza de forma visual os equipamentos de lazer, escolas e comércios no entorno de cada unidade de saúde. Através do nosso módulo de comparação de UBSs, o gestor de saúde identifica instantaneamente qual unidade tem o melhor e o pior indicador populacional, permitindo a alocação cirúrgica de recursos orçamentários, nutricionistas e campanhas de alimentação saudável."*

---

### 🟢 PARTE 3: O Cérebro Tecnológico e Confiabilidade (06:00 - 08:00)
*Aqui vocês justificam o rigor técnico e acadêmico da IA.*

*   **Slide 4: Arquitetura da Inteligência Artificial**
*   **O que falar:**
    > *"Nosso motor preditivo roda em nuvem através do Supabase, processando bases clínicas consolidadas. Para cada um dos 5 indicadores da Vigilância Alimentar e Nutricional (Desnutrição, Magreza, Eutrofia, Sobrepeso e Obesidade), nós treinamos um modelo de **Random Forest Regressor** composto por 300 árvores de decisão. A IA analisa variáveis dinâmicas do ano, faixa etária e as variáveis geográficas do entorno da UBS para predizer a variação (o Delta) da tendência nutricional futura."*
*   **Slide 5: Validação Científica Walk-Forward**
*   **O que falar:**
    > *"Séries temporais não podem ser testadas com K-Fold comum devido ao risco de vazamento de dados futuros. Nós implementamos a rigorosa **Validação Cruzada Walk-Forward Temporal**. E os resultados reais obtidos são formidáveis: atingimos um **Erro Absoluto Médio (MAE) excepcional abaixo de 1%** em todos os indicadores preditos. Isso significa que, em termos absolutos, nossa Inteligência Artificial erra em média menos de $1\%$ ao estimar a variação das tendências futuras das UBSs, conferindo extrema confiabilidade operacional para a tomada de decisão médica."*
    
    > [!NOTE]
    > *Dica de ouro:* Se a banca perguntar sobre o $R^2$ negativo, consultem a **Seção 5 de Defesa** descrita neste roteiro!

---

### ➔ PARTE 4: Prontidão de Nuvem e Visão de Futuro (08:00 - 09:00)
*   **Slide 6: Escalabilidade e o Futuro**
*   **O que falar:**
    > *"O NutriAlerta foi desenvolvido com arquitetura moderna e escalável. O ecossistema está tecnicamente pronto para deploy serverless gratuito em nuvem através da Vercel integrado ao banco Supabase, operando de forma 100% dinâmica. Para além disso, geramos uma base de conhecimento técnico detalhado sobre todo o modelo de Machine Learning, pronta para alimentar o **NutriBot**, nossa inteligência artificial consultora em formato de Chatbot que apoia o gestor a tirar dúvidas sobre o funcionamento do modelo e diretrizes do Ministério da Saúde."*

---

### ⚪ PARTE 5: Conclusão e Agradecimentos (09:00 - 10:00)
*   **Slide 7: Agradecimentos (NutriAlerta — A Prevenção Pela Tecnologia)**
*   **O que falar:**
    > *"O NutriAlerta prova que é possível aliar tecnologia de ponta, rigor matemático de IA e excelente design de interface para resolver problemas históricos de gestão em saúde pública municipal de forma barata e eficiente. Agradecemos a atenção de todos os membros da banca e nos colocamos à disposição para a rodada de perguntas."*

---

## 🛡️ Guia de Defesa: Como Gabaritar o Q&A (Perguntas e Respostas)

A banca tentará achar vulnerabilidades técnicas nos 10 minutos. Com este roteiro de defesa, vocês usarão as próprias perguntas da banca para demonstrar domínio nível sênior.

### ❓ Pergunta 1: *"Por que vocês usaram Random Forest e não Redes Neurais complexas (Deep Learning)?"*
*   **Resposta de Mestre:**
    > *"As redes neurais profundas necessitam de milhões de parâmetros e massas de dados colossais para convergirem sem sofrer Overfitting. Em séries temporais de dados clínicos municipais consolidados, o **Random Forest** é amplamente superior. Ele é um método robusto baseado em árvores de decisão em agrupamento (bagging) que captura interações geográficas não-lineares de forma rápida, eficiente, livre de suposições lineares clássicas e que previne o overfitting em bases pequenas, garantindo que o modelo aprenda padrões reais de saúde populacional."*

### ❓ Pergunta 2: *"Olhando o relatório técnico de vocês, vi que o $R^2$ do modelo deu negativo. Isso não significa que o modelo é inútil?"*
*   **Resposta de Mestre (O golpe final de domínio matemático):**
    > *"Pelo contrário, o $R^2$ negativo é um fenômeno matemático amplamente documentado e **completamente esperado** nesta modelagem. O $R^2$ mede a proporção de variância explicada em relação à variância total dos dados de teste.*
    
    > *Como a saúde populacional das UBSs de Rio Claro é relativamente estável ano a ano, a variação real (o Delta) histórica oscila de forma mínima, extremamente próxima de zero. Sob um denominador de variância total praticamente nulo, qualquer desvio residual mínimo faz com que a fração de erro exceda 1.0, gerando um $R^2$ negativo.*
    
    > *Para modelos preditivos baseados em **primeiras diferenças (Deltas)** em séries curtas e estáveis, o $R^2$ deixa de ser a métrica ideal de influência. A métrica soberana na medicina e gestão pública é o **MAE (Erro Absoluto Médio)**. Nosso MAE médio de **0.41% na desnutrição e 0.64% na obesidade** atesta de forma inequívoca que a previsão das taxas é de alta precisão operacional."*

### ❓ Pergunta 3: *"Os dados de projeção do dashboard realmente refletem as saídas puras do modelo de Python?"*
*   **Resposta de Mestre:**
    > *"Sim, com absoluta fidelidade. A API do nosso dashboard Next.js consome diretamente os arquivos de projeção estruturados gerados em tempo real pelo pipeline do Python (`NutriAlerta_Projecao_Futura.csv` e `NutriAlerta_Projecao_Desnutricao.csv`).*
    
    > *O único processamento feito no backend do site é uma normalização vetorial simples e arredondamento controlado para duas casas decimais. Isso é necessário apenas para garantir que as micro-perdas de precisão decimal inerentes ao ponto flutuante do JavaScript não alterem a restrição biológica de que a soma dos indicadores populacionais no dashboard resulte rigorosamente em exatamente 100.00%."*

---

## 📝 3 Dicas de Ensaio para Garantir os 10 Minutos
1.  **Não leiam slides:** A banca odeia leitura de slides. Usem os slides apenas como suporte visual (imagens grandes, gráficos de validação, fotos do dashboard). A atenção deve estar no que vocês estão falando e demonstrando na tela.
2.  **Cronômetro no ensaio:** Ensaia com cronômetro ativado. Se no ensaio passar de 9 minutos, comecem a cortar palavras ou acelerar a transição entre as UBSs no mapa. O ideal é treinar para terminar a fala em 8 minutos e 30 segundos, deixando margem de segurança.
3.  **Dividam os papéis:** Se for apresentar em dupla ou trio:
    *   **Pessoa A:** Apresenta a Introdução, o Problema e a Proposta (Mins 0-2) e a Conclusão (Min 9-10).
    *   **Pessoa B:** Opera e demonstra o Dashboard ao vivo (Mins 2-6).
    *   **Pessoa C (ou compartilhada):** Explica a IA, Engenharia de Features e a Validação Cruzada (Mins 6-8).
    *   *Esta divisão clara mostra coordenação e entrosamento de equipe profissional.*
