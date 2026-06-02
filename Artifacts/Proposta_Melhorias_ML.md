# 🧠 Proposta de Evolução e Auditoria do Modelo de IA (NutriAlerta)
> **Recomendações Técnicas para Aprimoramento e Validação da Inteligência Científica do Ecossistema**  
> *Projeto Interdisciplinar · FATEC Rio Claro · 2026 · Dossiê de Artefatos*

Este documento consolida uma série de diretrizes avançadas de Ciência de Dados e Engenharia de Machine Learning para elevar a precisão, confiabilidade clínica e governança ética dos modelos preditivos de tendência do **NutriAlerta**. 

---

## 🗺️ 1. Otimizações de Entrada (Enriquecimento de Features)
Atualmente, o modelo usa variáveis escolares e de estabelecimentos locais (fast-food/supermercados). Para aumentar a capacidade explicativa e o coeficiente de determinação ($R^2$), propomos incorporar as seguintes dimensões de dados:

*   **Índice de Vulnerabilidade Social (IVS)**: Dados socioeconômicos agregados por bairro (renda média familiar, taxa de alfabetização e percentual de dependência de auxílios governamentais) baseados no Censo IBGE.
*   **Condições de Saneamento Local**: Taxa de acesso a água tratada e rede de esgoto por microbairro. Estas variáveis são estatisticamente os maiores preditores causais para surtos de desnutrição infantil extrema.
*   **Distância Linear Média até a UBS**: A distância média (calculada por geolocalização) das residências até a Unidade Básica de Saúde mais próxima, servindo como feature de "Barreira de Acesso à Saúde".
*   **Densidade de Merenda Escolar**: Volume e composição nutricional (ex: proporção de ultraprocessados servidos na merenda) por escola inserida na região geográfica da UBS.

---

## 🛡️ 2. Resiliência e Algoritmos de Próxima Geração
Embora a Floresta Aleatória (*Random Forest*) seja excelente para datasets de porte menor devido à sua imunidade natural a *overfitting*, sugerimos testar e validar algoritmos de **Gradient Boosting**:

*   **XGBoost / LightGBM**: Estes algoritmos constroem árvores sequencialmente focando nos erros das árvores anteriores. Em dados tabulares de saúde altamente correlacionados, eles costumam obter um **MAE (Erro Médio Absoluto) até 25% menor** que o Random Forest tradicional.
*   **Otimização de Hiperparâmetros Dinâmica**: Implementar busca em grade com validação cruzada (*GridSearchCV* ou *Bayesian Optimization*) para calibrar parâmetros chaves como taxa de aprendizado, profundidade das árvores e subamostragem de colunas a cada re-treinamento.

---

## 📈 3. Validação Cruzada Walk-Forward (Implementada)
Acabamos de implementar no pipeline de produção o método de **Validação Cruzada Temporal Walk-Forward (Backtesting)**. 
Esta técnica divide os dados respeitando a cronologia natural dos anos:
1.  **Fold 1**: Treina com dados anteriores a 2023 $\rightarrow$ Valida no ano de 2023.
2.  **Fold 2**: Treina com dados anteriores a 2024 $\rightarrow$ Valida no ano de 2024.
3.  **Fold 3**: Treina com dados anteriores a 2025 $\rightarrow$ Valida no ano de 2025.

Isso nos permite emitir o **MAE Médio** e o **$R^2$** real do modelo antes de usá-lo para estimar os anos futuros (2026/2027), garantindo que as projeções na tela do gestor municipal tenham um selo de precisão comprovado!

---

## ⚖️ 4. Auditoria de Viés & Justiça Algorítmica (Fairness)
Modelos de IA na saúde não podem apenas ser precisos — eles devem ser **justos**:
*   **Disparidade de Erro Geográfico**: Avaliar se a margem de erro (MAE) é sistematicamente maior em bairros carentes/vulneráveis do que em bairros de alta renda. Se o modelo errar mais na periferia, o direcionamento de recursos municipais será ineficiente.
*   **Auditoria via `bias_audit.py`**: Integrar a execução do roteiro de auditoria de viés ao console municipal, permitindo que pesquisadores e auditores do SUS visualizem o relatório de equidade de gênero e idade dos cálculos epidemiológicos.

---

## 📊 5. Transparência para o Gestor (UX de Metadados)
Para que os dados preditivos sejam úteis aos formuladores de políticas públicas, propomos a criação de um **"Widget de Confiabilidade"** no frontend:
*   Abaixo dos gráficos de previsão de 2026/2027, exibir uma etiqueta com o grau de confiança (ex: *"Grau de Confiança do Modelo: 94.2% - MAE de 0.85%"*).
*   Isso educa o gestor sobre as incertezas estatísticas e incentiva a tomada de decisões pragmáticas baseada em faixas de erro seguras.
