import sys
from pathlib import Path
import requests

# Permite importar a partir de supabase_data.py no mesmo diretório
sys.path.append(str(Path(__file__).resolve().parent))
from supabase_data import get_supabase_config

def verificar_banco_nuvem():
    print("=" * 60)
    print("[DIAGNOSTICO] INICIANDO AUDITORIA DE DADOS EM NUVEM (NUTRIALERTA)")
    print("=" * 60)

    config = get_supabase_config()
    print(f"-> Conectando ao Supabase URL: {config['url']}")
    print(f"-> Email de Servico da IA: {config['email']}")

    try:
        # Autentica
        print("-> Efetuando login no Auth JWT do Supabase...")
        auth_response = requests.post(
            f"{config['url']}/auth/v1/token?grant_type=password",
            headers={'apikey': config['anon_key'], 'Content-Type': 'application/json'},
            json={'email': config['email'], 'password': config['password']},
            timeout=20,
        )
        auth_response.raise_for_status()
        access_token = auth_response.json().get('access_token')
        
        headers = {
            'apikey': config['anon_key'],
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        }
        
        print("[OK] Autenticacao realizada com sucesso!")
        
        # Consulta tabela registros_saude
        print("\n1. Verificando registros de saude (tabela 'registros_saude')...")
        res_saude = requests.get(
            f"{config['url']}/rest/v1/registros_saude?select=count",
            headers={
                'apikey': config['anon_key'],
                'Authorization': f'Bearer {access_token}',
                'Prefer': 'count=exact'
            },
            timeout=20
        )
        res_saude.raise_for_status()
        # O total vem no header 'Content-Range' ou similar devido ao REST do PostgREST
        range_header = res_saude.headers.get('Content-Range', '')
        count_saude = range_header.split('/')[-1] if '/' in range_header else "Indisponivel"
        print(f"   -> Total de exames/pesagens na nuvem: {count_saude}")

        # Consulta tabela previsoes_nutricionais
        print("\n2. Verificando tabela de projecoes de IA ('previsoes_nutricionais')...")
        res_prev = requests.get(
            f"{config['url']}/rest/v1/previsoes_nutricionais?select=count",
            headers={
                'apikey': config['anon_key'],
                'Authorization': f'Bearer {access_token}',
                'Prefer': 'count=exact'
            },
            timeout=20
        )
        res_prev.raise_for_status()
        range_header_prev = res_prev.headers.get('Content-Range', '')
        count_prev = range_header_prev.split('/')[-1] if '/' in range_header_prev else "0"
        print(f"   -> Total de registros de tendencias e projecoes de IA: {count_prev}")

        if count_prev == "0" or int(count_prev) == 0:
            print("   [AVISO] A tabela 'previsoes_nutricionais' esta vazia! Rode o script de ML.")
            return

        # Busca uma amostra das projecoes futuras (2026)
        print("\n3. Amostra de Projecoes de IA para o Futuro (Ano 2026):")
        res_amostra = requests.get(
            f"{config['url']}/rest/v1/previsoes_nutricionais?select=*&ano=eq.2026&limit=5",
            headers=headers,
            timeout=20
        )
        res_amostra.raise_for_status()
        amostra = res_amostra.json()

        for idx, row in enumerate(amostra, 1):
            print(f"\n   [Registro {idx}]")
            print(f"   - CNES / Unidade: {row.get('cnes')}")
            print(f"   - Ano / Status: {row.get('ano')} ({row.get('status')})")
            print(f"   - Tipo de Projecao: {row.get('tipo_projecao')}")
            if row.get('tipo_projecao') == 'obesidade':
                ob = float(row.get('obesidade_pct', 0) or 0)
                ob_gr = float(row.get('obesidade_grave_pct', 0) or 0)
                tot = ob + ob_gr
                print(f"     * Obesidade Total (Grau I/II + Grave): {tot:.2f}%")
                print(f"     * Sobrepeso: {row.get('sobrepeso_pct')}%")
                print(f"     * Eutrofia: {row.get('eutrofia_pct')}%")
            else:
                print(f"     * Desnutricao/Magreza Acentuada: {row.get('magreza_acentuada_pct')}%")
                print(f"     * Magreza: {row.get('magreza_pct')}%")

        print("\n" + "=" * 60)
        print("COMO COMPARAR COM A INTERFACE:")
        print("Abra o dashboard da Vercel no menu de IA, escolha o ano 2026 e verifique")
        print("se os valores mostrados nos mapas/graficos batem com as porcentagens acima.")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ ERRO AO CONECTAR OU VERIFICAR OS DADOS: {e}")
        print("Dica: Verifique se suas variaveis de ambiente ou senhas estao corretas.")

if __name__ == '__main__':
    verificar_banco_nuvem()
