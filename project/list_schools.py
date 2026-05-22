import json
import os

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "nutri-alerta", "src", "lib", "extractedPois.json")
    
    if not os.path.exists(json_path):
        json_path = os.path.join(script_dir, "..", "project", "nutri-alerta", "src", "lib", "extractedPois.json")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        pois = json.load(f)
        
    schools = []
    for p in pois:
        if p.get("categoria") == "Educação" or str(p.get("id", "")).startswith("school"):
            schools.append(p.get("nome"))
            
    # Remover duplicatas se houver e ordenar
    unique_schools = sorted(list(set(schools)))
    
    print(f"Total de escolas encontradas: {len(unique_schools)}")
    
    # Gravar arquivo de saída em 'project/escolas_analisadas.txt' e no root 'escolas_analisadas.txt'
    out_paths = [
        os.path.join(script_dir, "escolas_analisadas.txt"),
        os.path.join(script_dir, "..", "escolas_analisadas.txt"),
        os.path.join(script_dir, "csv", "escolas_analisadas.txt")
    ]
    
    for out_path in out_paths:
        try:
            # Garantir que a pasta existe
            os.makedirs(os.path.dirname(out_path), exist_ok=True)
            with open(out_path, 'w', encoding='utf-8') as f:
                f.write(f"=== NutriAlerta: Lista de {len(unique_schools)} Escolas Analisadas ===\n\n")
                for i, name in enumerate(unique_schools, 1):
                    f.write(f"{i}. {name}\n")
            print(f"Arquivo gravado em: {out_path}")
        except Exception as e:
            print(f"Erro ao gravar em {out_path}: {e}")

if __name__ == "__main__":
    main()
