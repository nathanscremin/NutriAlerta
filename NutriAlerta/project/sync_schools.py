import json
import csv
import os

def main():
    # Caminhos relativos
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "nutri-alerta", "src", "lib", "extractedPois.json")
    csv_path = os.path.join(script_dir, "csv", "escolas_prontas (1).csv")
    
    if not os.path.exists(json_path):
        # Tenta a partir do diretório pai se rodando de outro lugar
        json_path = os.path.join(script_dir, "..", "project", "nutri-alerta", "src", "lib", "extractedPois.json")
        csv_path = os.path.join(script_dir, "..", "project", "csv", "escolas_prontas (1).csv")
        
    print(f"Lendo JSON de: {json_path}")
    print(f"Escrevendo CSV em: {csv_path}")
    
    with open(json_path, 'r', encoding='utf-8') as f:
        pois = json.load(f)
        
    # Filtrar escolas (categoria 'Educação' ou id contendo 'school')
    escolas = []
    for p in pois:
        if p.get("categoria") == "Educação" or str(p.get("id", "")).startswith("school"):
            escolas.append(p)
            
    print(f"Total de escolas encontradas: {len(escolas)}")
    
    # Gravar CSV
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Cabeçalho com as métricas nutricionais
        writer.writerow(["nome", "lat", "lon", "desnutricao", "obesidade", "sobrepeso", "eutrofia"])
        
        for esc in escolas:
            writer.writerow([
                esc.get("nome"),
                esc.get("lat"),
                esc.get("lon"),
                esc.get("desnutricao", 0.0),
                esc.get("obesidade", 0.0),
                esc.get("sobrepeso", 0.0),
                esc.get("eutrofia", 0.0)
            ])
            
    print("Sincronização concluída com sucesso!")

if __name__ == "__main__":
    main()
