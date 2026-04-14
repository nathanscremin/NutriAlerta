**```mermaid
graph TD
    subgraph Sources ["Fontes de Dados Externas"]
        D1[SISVAN: Dados Nutricionais] -->|ETL| Proc
        D2[IBGE: Censo 2022 + Shapefiles] -->|ETL| Proc
        D3[DATASUS: Saúde Pública] -->|ETL| Proc
    end

    subgraph Process ["Processamento e Modelagem"]
        direction TB
        Proc[Limpeza e Unificação de Dados] -->|GeoPandas/pandas| EP4[Correlacionamento de Dados]
        EP4 -->|Criação do Dataset Unificado| EP5[Treinamento do Modelo]
       
        subgraph ML ["Machine Learning"]
            EP5 -->|sklearn| RF[Random Forest Classifier]
            RF -->|Split Cronológico| Valid[Validação do Modelo]
        end
       
        Valid -->|Predição de Risco| EP6[Geração do Mapa de Risco]
    end

    subgraph Outputs ["Visualização e Entrega"]
        EP6 -->|Folium| Map[Mapa Choropleth Interativo]
        ML -->|Métricas F1/Recall| Rep[Relatório Final/DoD]
        Map --> Dash[Dashboard Web]
        Dash -->|Visualização Consolidada| User1
    end

    subgraph Users ["Usuários Finais"]
        User1[Gestor Municipal de Saúde]:::health
        User2[Diretor de Escola]:::school
    end

    User1 -.->|Consulta Risco / Prioriza Recursos| Map
    User2 -.->|Analisa Merenda / Recursos| Dash

    classDef health fill:#f9f,stroke:#333,stroke-width:2px;
    classDef school fill:#ff9,stroke:#333,stroke-width:2px;
````
