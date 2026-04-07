# 📍 Active Context - Projeto Nutrição 2026

## 🎯 Objetivo Atual: EP-04 - Correlacionamento de Dados
O foco imediato da equipe é a análise de datasets de desnutrição e obesidade para relacioná-los por bairros e alimentar o dataset principal[cite: 36]. [cite_start]Este passo é essencial para construir a base da modelagem preditiva[cite: 43].

---

## 📊 Status do Projeto (Backlog)
De acordo com o PRD do 3º Semestre de 2026:


### 🚧 Épicos em Foco / Pendentes
* **EP-04 (Correlacionamento):** Cruzamento de dados SISVAN + IBGE (Pendente)
* **EP-05 (Modelagem):** Treinamento do Random Forest Classifier (Pendente)
* **EP-06 (Mapa de Risco):** Geração de choropleth com saídas do modelo (Pendente)
* **EP-07 (Relatório Final):** Documentação e métricas F1/Recall (Pendente)

---

## 👥 Alocação da Equipe na Sprint
[cite_start]Conforme a estrutura Scrum definida[cite: 4]:
* [cite_start]**Scrum Master:** Gabriel Nanetti (Garantindo rituais e remoção de impedimentos)[cite: 8].
* [cite_start]**Product Owner:** Nathan Scremin (Validando se o cruzamento de dados atende aos objetivos de saúde)[cite: 8].
* [cite_start]**Dev Team (Nicolas, Arthur, Pedro, Matheus):** Focados na lógica de ETL para o EP-04[cite: 8, 36].

---

## 🛠️ Prioridades Técnicas Imediatas
1. [cite_start]**Unificação Geográfica:** Garantir que os dados do SISVAN e do IBGE utilizem a mesma chave (Bairro/Setor Censitário) para os 28 bairros de Rio Claro[cite: 36, 43].
2. [cite_start]**Qualidade dos Dados:** Tratar inconsistências nos dados de saúde pública antes da modelagem[cite: 23].
3. [cite_start]**Preparação para ML:** Definir as features que alimentarão o Random Forest (EP-05)[cite: 28, 32].

---

## ⚠️ Observações de Contexto
* [cite_start]O sistema deve ser simples o suficiente para gestores municipais e diretores de escola entenderem o risco em poucos segundos[cite: 40, 50].
* Toda implementação deve seguir o **Style Guide** (Cores: Primary Blue, Health Green, Danger Red).