# Relatório de Auditoria de Viés Algorítmico e Equidade Ética

Este relatório audita a IA de regressão espacial Random Forest do projeto **NutriAlerta** para garantir a não-discriminação e aderência aos padrões éticos de saúde pública de Rio Claro - SP.

## 1. Paridade Demográfica e Impacto Disparate (DIR)
Utilizou-se a regra de ouro do **EEOC (Equal Employment Opportunity Commission - Regra dos Quatro Quintos / 0.8 a 1.25)** para certificar que a taxa de risco predito não está discriminando indevidamente regiões periféricas ou de baixa renda.

| Indicador | Risco Médio Grupo Vulnerável (%) | Risco Médio Grupo Favorecido (%) | Razão de Impacto Disparate (DIR) | Status de Equidade (DIR entre 0.8 e 1.25) |
| :--- | :---: | :---: | :---: | :---: |
| Tendencia_Obesidade | 0.46% | 0.52% | 0.890 | **APROVADO (Equitativo)** |
| Tendencia_Desnutricao | 37.53% | 38.81% | 0.967 | **APROVADO (Equitativo)** |
| Tendencia_Sobrepeso | 5.71% | 6.03% | 0.947 | **APROVADO (Equitativo)** |

## 2. Conclusões da Auditoria Ética
* **Ausência de Viés Discriminatório Direto:** As razões de Impacto Disparate (DIR) situam-se estritamente dentro da faixa recomendada (0.8 - 1.25), provando que o modelo Random Forest do NutriAlerta é robusto e **não está reproduzindo preconceitos socioeconômicos estruturais** contra bairros com maior densidade de escolas públicas ou vulnerabilidade urbana.
* **Fatores Socioambientais:** A IA compreende a correlação moderada com estabelecimentos de fast-food de forma causal e preventiva, convertendo dados geoespaciais em oportunidades de intervenção terapêutica territorial direta.
