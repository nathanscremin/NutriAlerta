# Arquitetura de Pastas

Para manter a organização entre ETL e Modelagem, siga esta estrutura:

- `/data/raw`: Arquivos originais do SISVAN, IBGE (Censo 2022) e DATASUS.
- `/data/processed`: Datasets unificados e limpos após o cruzamento de bairros.
- `/src/etl`: Scripts de limpeza e correlação (Épico EP-04).
- `/src/models`: Treinamento do Random Forest (Épico EP-05).
- `/src/visualization`: Geração dos mapas Folium e Dashboards.
- `/notebooks`: Experimentos iniciais de análise exploratória.