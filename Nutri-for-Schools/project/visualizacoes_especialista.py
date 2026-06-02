import streamlit as st
import pandas as pd
import pydeck as pdk
import plotly.express as px
import plotly.graph_objects as go
import os

# Configuração de Página (Apenas para uso isolado, no seu app você pode remover isso)
st.set_page_config(page_title="NutriAlerta Pro - Modo Especialista", layout="wide", initial_sidebar_state="collapsed")

# Estilização CSS Customizada para os "Cards"
st.markdown("""
<style>
    .card {
        background-color: #1e2130;
        border-radius: 10px;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        margin-bottom: 20px;
        border: 1px solid #333;
    }
    .metric-value {
        font-size: 2rem;
        font-weight: bold;
        color: #fff;
    }
    .metric-label {
        font-size: 1rem;
        color: #aaa;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def carregar_dados():
    # Caminhos para os arquivos CSV
    base_path = "csv"
    
    try:
        df_mercados = pd.read_csv(os.path.join(base_path, 'mercados_gerais_rio_claro.csv'))
        df_esporte = pd.read_csv(os.path.join(base_path, 'esporte_lazer_rio_claro.csv'))
        df_ambiente = pd.read_csv(os.path.join(base_path, 'ambiente_alimentar_rio_claro.csv'))
    except FileNotFoundError:
        st.error("Arquivos CSV não encontrados na pasta 'csv'. Verifique o diretório.")
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

    # Tratamento e Categorização
    df_mercados['categoria'] = 'Oásis Alimentar (Mercados)'
    df_mercados['grupo'] = 'Fator Protetivo'
    df_mercados['color'] = [[46, 204, 113, 200]] * len(df_mercados) # Verde
    
    df_esporte['categoria'] = 'Infra. Esportiva (Parques/Praças)'
    df_esporte['grupo'] = 'Fator Protetivo'
    df_esporte['color'] = [[52, 152, 219, 200]] * len(df_esporte) # Azul
    
    df_ambiente['categoria'] = 'Ambiente Obesogênico (Fast Food/Conv.)'
    df_ambiente['grupo'] = 'Fator de Risco'
    df_ambiente['color'] = [[231, 76, 60, 200]] * len(df_ambiente) # Vermelho
    
    df_completo = pd.concat([df_mercados, df_esporte, df_ambiente], ignore_index=True)
    
    return df_mercados, df_esporte, df_ambiente, df_completo

df_mercados, df_esporte, df_ambiente, df_completo = carregar_dados()

if not df_completo.empty:
    st.title("🔬 Modo Especialista: Análise de Conflito Urbano")
    st.markdown("Visão gerencial de infraestrutura urbana, identificando Pântanos Alimentares e Oásis de Saúde.")

    # Layout em Cards usando colunas
    col1, col2 = st.columns([2, 1])

    with col1:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("🗺️ Mapa de Calor de Conflito Urbano (Pântanos Alimentares)")
        st.markdown("""
        **Como ler este mapa:**
        A zona de calor (vermelho/amarelo) indica alta densidade de **Ambientes Obesogênicos**. 
        Os pontos azuis/verdes representam **Fatores Protetivos**. Regiões quentes sem pontos azuis/verdes indicam os graves **Pântanos Alimentares**.
        """)
        
        # Centro do Mapa (Rio Claro)
        lat_center = df_completo['lat'].mean()
        lon_center = df_completo['lon'].mean()
        
        # Camada de Calor para Ambiente Obesogênico
        heatmap_layer = pdk.Layer(
            "HeatmapLayer",
            data=df_ambiente,
            opacity=0.8,
            get_position=["lon", "lat"],
            aggregation="SUM",
            get_weight="1",
            radiusPixels=60,
        )

        # Camada de Dispersão para Fatores Protetivos (Mercados e Esportes)
        scatter_layer_protetores = pdk.Layer(
            "ScatterplotLayer",
            data=pd.concat([df_mercados, df_esporte]),
            get_position=["lon", "lat"],
            get_color="color",
            get_radius=80,
            pickable=True,
            opacity=0.9,
            stroked=True,
            filled=True,
            radius_scale=1,
            radius_min_pixels=3,
            radius_max_pixels=10,
            line_width_min_pixels=1,
        )

        # Renderizar Mapa PyDeck
        deck = pdk.Deck(
            map_style="mapbox://styles/mapbox/dark-v10", # Tema dark combinando com dashboard
            initial_view_state=pdk.ViewState(
                latitude=lat_center,
                longitude=lon_center,
                zoom=12,
                pitch=45,
            ),
            layers=[heatmap_layer, scatter_layer_protetores],
            tooltip={"text": "{nome}\n{categoria}"}
        )
        st.pydeck_chart(deck)
        st.markdown('</div>', unsafe_allow_html=True)

    with col2:
        st.markdown('<div class="card">', unsafe_allow_html=True)
        st.subheader("📊 Proporção de Infraestrutura")
        
        # Gráfico Donut/Sunburst
        contagem = df_completo['grupo'].value_counts().reset_index()
        contagem.columns = ['Grupo', 'Quantidade']
        
        # Gráfico Donut de alta qualidade usando Plotly
        fig_donut = px.pie(
            contagem, 
            values='Quantidade', 
            names='Grupo', 
            hole=0.6,
            color='Grupo',
            color_discrete_map={
                'Fator Protetivo': '#2ecc71', # Verde Moderno
                'Fator de Risco': '#e74c3c'   # Vermelho Moderno
            }
        )
        
        fig_donut.update_layout(
            annotations=[dict(text='Perfil<br>Urbano', x=0.5, y=0.5, font_size=20, showarrow=False)],
            showlegend=True,
            legend=dict(orientation="h", yanchor="bottom", y=-0.2, xanchor="center", x=0.5),
            margin=dict(t=30, b=0, l=0, r=0),
            paper_bgcolor='rgba(0,0,0,0)',
            plot_bgcolor='rgba(0,0,0,0)',
            font=dict(color='#fff')
        )
        
        st.plotly_chart(fig_donut, use_container_width=True)

        st.markdown("---")
        st.subheader("💡 Insights Gerenciais")
        
        risco = contagem[contagem['Grupo'] == 'Fator de Risco']['Quantidade'].sum()
        protetivo = contagem[contagem['Grupo'] == 'Fator Protetivo']['Quantidade'].sum()
        total = risco + protetivo
        
        # Indicadores em Grid
        st.markdown(f'''
        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <div>
                <div class="metric-value" style="color: #2ecc71;">{protetivo}</div>
                <div class="metric-label">Locais de Proteção</div>
            </div>
            <div style="text-align: right;">
                <div class="metric-value" style="color: #e74c3c;">{risco}</div>
                <div class="metric-label">Locais de Risco</div>
            </div>
        </div>
        ''', unsafe_allow_html=True)

        if risco > protetivo:
            st.warning(f"**Atenção Crítica:** O município possui uma infraestrutura voltada para o ambiente obesogênico. Existem {(risco/total)*100:.1f}% de opções de risco.")
        else:
            st.success(f"**Indicador Positivo:** Predominância de fatores de proteção urbana ({(protetivo/total)*100:.1f}%). Priorize áreas isoladas do mapa de calor.")
            
        st.markdown('</div>', unsafe_allow_html=True)
