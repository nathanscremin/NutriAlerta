Ambiente de Execução
Linguagem: Python 3.11.
IDE: VS Code no Windows.

Bibliotecas Obrigatórias
Processamento: pandas, numpy, entre outros
Geospacial: GeoPandas 1.1.3, shapely, pyproj, Folium, entre outros
Machine Learning: sklearn (scikit-learn).

Regras de Modelagem de Dados
Algoritmo: Utilizar obrigatoriamente Random Forest.
Validação: Aplicar obrigatoriamente Split Cronológico (não usar shuffle aleatório se houver componente temporal)
Fontes: SISVAN, IBGE (Censo 2022) e DATASUS

Estilo de Código
Utilize comentários inline para explicar lógicas complexas
Siga as métricas de performance: F1-score e Recall por bairro