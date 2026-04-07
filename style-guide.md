# Style Guide — Nutrição & Saúde Pública 2026

Este guia define os padrões visuais e de experiência de usuário (UX) para o sistema de mapeamento preditivo de Rio Claro. O objetivo é garantir que a interface seja **elegante** para apresentações executivas e **intuitiva** para a tomada de decisão por gestores municipais

---

## 🏛️ 1. Princípios de Design
**Clareza sobre Estética:** A função dos dados preditivos (Random Forest) deve sempre ser o foco principal
* **Simplicidade para Gestores:** Reduzir a carga cognitiva; gestores precisam entender o risco por bairro em menos de 5 segundos.
* **Acessibilidade:** Cores contrastantes para leitura em telas variadas (tablets de campo ou monitores de gabinete).

---

## 🎨 2. Paleta de Cores (Saúde Pública)
Utilizamos uma paleta baseada em tons de azul e verde para transmitir confiança e saúde, com cores de destaque para alertas de risco nutricional.

| Cor | Hex | Aplicação |
| :--- | :--- | :--- |
| **Primary Blue** | `#1A5F7A` | Cabeçalhos, botões principais e identidade institucional. |
| **Health Green** | `#86C8BC` | Áreas de baixo risco e sucesso nutricional. |
| **Warning Orange**| `#F2994A` | Alerta moderado para falta de recursos alimentares. |
| **Danger Red** | `#EB5757` | Áreas críticas de obesidade/desnutrição (foco do Random Forest). |
| **Neutral Grey** | `#F2F2F2` | Background e áreas de conteúdo secundário. |

---

## 🔡 3. Tipografia
Focada em legibilidade máxima para dados numéricos e relatórios
* **Títulos:** *Inter* ou *Roboto* (Bold) — Peso visual para métricas principais.
* **Corpo:** *Inter* (Regular) — Limpo e moderno.
* **Dados:** Fontes monoespaçadas (apenas para coordenadas geográficas, se necessário).

---

## 🗺️ 4. Componentes de Visualização (UX)

### 4.1 Mapa Choropleth (Folium)
* **Bordas:** Devem ser nítidas para delimitar os 28 bairros de Rio Claro.
* **Tooltips:** Ao passar o mouse, exibir: "Bairro", "Índice de Risco" e "Status da Merenda".
* **Popups:** Devem conter um mini-gráfico (matplotlib) com a tendência histórica.

### 4.2 Dashboard Web
* **Cards de Resumo:** Devem apresentar o "Nº de Bairros em Risco Crítico" em destaque no topo.
* **Gráficos:** Use `matplotlib` com o estilo `seaborn-v0_8-muted` para manter a elegância.

---

## 💻 5. Padrões de Código Front-end/Output
Como o projeto utiliza **Python 3.14** e **Folium**, as regras de implementação são:

* **HTML Interno (Folium):** Use templates limpos para os popups (evite inline CSS pesado).
* **Comentários:** Devem ser em Inglês (como padrão do time de dev), mas os rótulos de interface (UI) **obrigatoriamente** em Português para os gestores.
* **Responsividade:** O dashboard deve se ajustar automaticamente entre o VS Code Windows (ambiente de dev) e navegadores web padrão.

---

## 📐 6. Ícones e Ilustrações
* Utilizar ícones minimalistas (ex: Lucide ou FontAwesome) para representar:
    * 🍎 Escolas municipais
    * 📊 Dados do SISVAN.
    * 📍 Localização/Bairros.

---

### ✅ Checklist de Qualidade (UI/UX)
- [ ] O mapa carrega os polígonos do IBGE 2022 sem lentidão? 
- [ ] O contraste entre as cores do mapa é visível para daltônicos?
- [ ] O relatório final gerado (EP-07) segue este guia de cores? 

