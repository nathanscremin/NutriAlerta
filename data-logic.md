# Lógica de Dados e Negócio

## 🔄 ETL e Cruzamento (EP-04)
- **Chave de Ligação:** O cruzamento entre SISVAN e IBGE deve ser feito pelo nome do bairro ou código de setor censitário de Rio Claro.
- **Dados Geo:** Utilize o Shapefile do IBGE Censo 2022 para os 28 bairros.

## 🧠 Modelagem (EP-05)
- **Target:** Nível de risco nutricional (obesidade/desnutrição).
- **Split Cronológico:** Treine com anos anteriores e valide com o ano mais recente para simular predição futura.
- **Métricas:** F1-score e Recall por bairro são as métricas de sucesso obrigatórias.