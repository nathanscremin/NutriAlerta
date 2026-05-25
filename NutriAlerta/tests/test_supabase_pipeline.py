import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'models'
SPEC = importlib.util.spec_from_file_location('supabase_data', ROOT / 'supabase_data.py')
SUPABASE_DATA = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SUPABASE_DATA)


class TestSupabasePipeline(unittest.TestCase):
    def test_build_model_snapshot_aggregates_health_data_by_cnes(self):
        schools = [
            {
                'id': 'sch-1',
                'nome': 'Escola Municipal Teste',
            }
        ]

        pois = [
            {
                'nome': 'Escola Municipal Teste',
                'bairro': 'Centro',
                'regiao_ubs': 'UBS Jardim Chervezon “Dr. Nicolino Maziotti”',
                'lat': -22.385236150603358,
                'lon': -47.564888689845596,
            }
        ]

        records = [
            {
                'data_coleta': '2024-03-01T10:00:00+00:00',
                'peso': 20,
                'altura': 1.3,
                'escola_id': 'sch-1',
            },
            {
                'data_coleta': '2024-03-02T10:00:00+00:00',
                'peso': 30,
                'altura': 1.3,
                'escola_id': 'sch-1',
            },
        ]

        snapshot = SUPABASE_DATA.build_model_snapshot(records, schools, pois)

        self.assertEqual(snapshot['CNES'].tolist(), ['2074362'])
        self.assertEqual(snapshot['Ano'].tolist(), [2024])
        self.assertEqual(snapshot['Faixa_Etaria'].tolist(), ['0 a 18 anos'])
        self.assertTrue({'Magreza_Pct', 'Obesidade_Pct', 'Sobrepeso_Pct', 'Eutrofia_Pct'}.issubset(snapshot.columns))


if __name__ == '__main__':
    unittest.main()
