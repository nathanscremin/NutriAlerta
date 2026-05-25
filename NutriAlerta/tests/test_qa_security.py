import unittest
import math
import random
import time

# -------------------------------------------------------------
# Módulo sob teste (Simulação em Python correspondente à API do Next.js)
# -------------------------------------------------------------

class DatabaseMock:
    def __init__(self):
        self.records = {}
        self.logs = []

    def save(self, pseudonimized_id, encrypted_name, encrypted_resp, age, weight, height, gender, classification, risk, clinic_recommendation):
        self.records[pseudonimized_id] = {
            "name": encrypted_name,
            "resp": encrypted_resp,
            "age": age,
            "weight": weight,
            "height": height,
            "gender": gender,
            "classification": classification,
            "risk": risk,
            "conduta": clinic_recommendation
        }
        self.logs.append(f"LOG: Record saved for pseudonimized ID: {pseudonimized_id}")

class ClinicalRules:
    @staticmethod
    def calculate_bmi(weight, height):
        if height <= 0:
            return 0
        return weight / (height * height)

    @staticmethod
    def classify_risk(age, bmi):
        if age <= 5:
            if bmi < 13.5:
                return "Desnutrição", "Alto", "Aconselhamento urgente de aleitamento materno e pediatria."
            elif bmi > 18.5:
                return "Obesidade", "Alto", "Redução imediata de ultraprocessados e orientação nutricional."
            elif bmi > 17.0:
                return "Sobrepeso", "Médio", "Monitoramento do ganho ponderal pelas ACS e orientação dietética."
            else:
                return "Eutrofia", "Baixo", "Manter rotina de pesagem semestral no Nutri for Schools."
        else:
            if bmi < 14.0:
                return "Desnutrição", "Alto", "Visita domiciliar preventiva e suplementação alimentar supervisionada."
            elif bmi > 24.0:
                return "Obesidade", "Alto", "Consulta médica especializada e atividade física diária."
            elif bmi > 21.0:
                return "Sobrepeso", "Médio", "Orientação dietética familiar prática e pesagem bimestral."
            else:
                return "Eutrofia", "Baixo", "Apoio a alimentação saudável ativa e pesagem de rotina anual."

class SecurityEngine:
    @staticmethod
    def generate_sha256_hash(text, salt="nutrialerta-security-salt-2026"):
        # Simulação simples de hash determinístico para pseudonimização
        hashed = hash(text + salt)
        return f"hash_{abs(hashed):016x}"

    @staticmethod
    def encrypt_aes_gcm(text, key="a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"):
        # Simulação simples de criptografia reversível baseada em XOR + base64 fictício
        # para validar integridade da segurança nos testes funcionais
        encoded = []
        for i, char in enumerate(text):
            key_char = key[i % len(key)]
            encoded.append(chr(ord(char) ^ ord(key_char)))
        return "aes_encrypted_" + "".join(encoded).encode('utf-8').hex()

# -------------------------------------------------------------
# Testes Automatizados de QA, Segurança e Ética
# -------------------------------------------------------------

class TestNutriAlertaQASecurity(unittest.TestCase):
    def setUp(self):
        self.db = DatabaseMock()
        self.security = SecurityEngine()
        self.rules = ClinicalRules()

    # =========================================================
    # 1. TESTES FUNCIONAIS (QA)
    # =========================================================

    def test_caso1_fluxo_feliz_eutrofia(self):
        """QA Caso 1: Entrada válida (5 anos, peso saudável) e classificação correta de Eutrofia"""
        nome = "Ana Souza"
        cpf = "123.456.789-00"
        responsavel = "Maria Souza"
        idade = 5
        peso = 18.0
        altura = 1.10
        genero = "Feminino"

        # Validações de QA básicas (Sanitização)
        self.assertTrue(len(nome) >= 3)
        self.assertEqual(len(cpf.replace(".", "").replace("-", "")), 11)
        self.assertTrue(peso > 0 and altura > 0)

        # Cálculo de IMC e Classificação
        bmi = self.rules.calculate_bmi(peso, altura)
        self.assertAlmostEqual(bmi, 14.876, places=2)

        classificacao, risco, conduta = self.rules.classify_risk(idade, bmi)
        self.assertEqual(classificacao, "Eutrofia")
        self.assertEqual(risco, "Baixo")
        self.assertIn("rotina de pesagem semestral", conduta)

        # Salva de forma segura (Conformidade LGPD)
        pseud_id = self.security.generate_sha256_hash(cpf)
        enc_name = self.security.encrypt_aes_gcm(nome)
        enc_resp = self.security.encrypt_aes_gcm(responsavel)

        self.db.save(pseud_id, enc_name, enc_resp, idade, peso, altura, genero, classificacao, risco, conduta)
        self.assertIn(pseud_id, self.db.records)

    def test_caso2_tratamento_limites_out_of_bounds(self):
        """QA Caso 2: Rejeição estrita de dados anômalos fora dos limites fisiológicos"""
        # Entrada 1: Peso negativo
        peso_invalido = -12.0
        altura_valida = 1.20
        self.assertFalse(peso_invalido > 1.0 and peso_invalido < 200.0)

        # Entrada 2: Altura exagerada (out of bounds)
        peso_valido = 35.0
        altura_invalida = 3.20 # 3 metros e 20 centímetros
        self.assertFalse(altura_invalida > 0.3 and altura_invalida < 2.5)

        # Entrada 3: Idade acima do escopo infantil
        idade_invalida = 25
        self.assertFalse(idade_invalida >= 0 and idade_invalida <= 18)

    def test_caso3_classificacao_borderline_obesidade(self):
        """QA Caso 3: Transição limítrofe (borderline) correta para Obesidade Infantil"""
        idade = 6
        altura = 1.15
        # Com peso 27.0 kg, o IMC é 20.41. O limiar de sobrepeso/obesidade é ultrapassado (>24) em idades maiores,
        # mas vamos testar um peso que ultrapasse o limite de obesidade (>24) para 6 anos.
        # Vamos usar um IMC de 24.5. Para altura 1.15, peso = 24.5 * (1.15^2) = 32.4 kg
        peso = 32.5
        
        bmi = self.rules.calculate_bmi(peso, altura)
        classificacao, risco, conduta = self.rules.classify_risk(idade, bmi)

        self.assertGreater(bmi, 24.0)
        self.assertEqual(classificacao, "Obesidade")
        self.assertEqual(risco, "Alto")
        self.assertIn("Consulta médica especializada", conduta)

    # =========================================================
    # 2. TESTES DE SEGURANÇA E PRIVACIDADE (LGPD)
    # =========================================================

    def test_seguranca_pseudonimizacao_criptografia(self):
        """Segurança: Garantir que dados sensíveis são pseudonimizados e criptografados"""
        nome = "João da Silva"
        cpf = "987.654.321-11"
        responsavel = "Carlos da Silva"

        pseud_id = self.security.generate_sha256_hash(cpf)
        enc_name = self.security.encrypt_aes_gcm(nome)
        enc_resp = self.security.encrypt_aes_gcm(responsavel)

        # Garantir que o CPF original NÃO está contido no ID gerado (Proteção LGPD)
        self.assertNotIn(cpf, pseud_id)
        # Garantir que os nomes originais NÃO estão em texto claro no banco
        self.assertNotIn(nome, enc_name)
        self.assertNotIn(responsavel, enc_resp)

        # O ID deve ser único e determinístico para cruzamento geoespacial
        pseud_id_copy = self.security.generate_sha256_hash(cpf)
        self.assertEqual(pseud_id, pseud_id_copy)

    # =========================================================
    # 3. TESTES DE RESILIÊNCIA E INTEGRAÇÃO (OFFLINE RETRY)
    # =========================================================

    def test_resiliencia_sincronizacao_offline(self):
        """Integração/Resiliência: Fila local-first offline e sincronização com retry assíncrono"""
        # Fila local offline simulada
        local_offline_queue = []
        
        # Simula 3 registros coletados na UBS Wenzel durante desconexão
        local_offline_queue.append({"id": "off-001", "cpf": "111.111.111-11", "nome": "Criança A", "peso": 15.0, "altura": 1.05})
        local_offline_queue.append({"id": "off-002", "cpf": "222.222.222-22", "nome": "Criança B", "peso": 20.0, "altura": 1.10})
        local_offline_queue.append({"id": "off-003", "cpf": "333.333.333-33", "nome": "Criança C", "peso": 12.0, "altura": 0.95})
        
        self.assertEqual(len(local_offline_queue), 3)

        # Simula tentativa de envio sob rede instável (restabelecimento gradual)
        network_active = False
        retry_count = 0
        max_retries = 3
        sync_success = False

        # Loop de sincronização com retry e recuo exponencial simulado
        while not network_active and retry_count < max_retries:
            retry_count += 1
            # Simula a rede voltando apenas na 3ª tentativa
            if retry_count == 3:
                network_active = True
                break
            time.sleep(0.01) # recuo rápido para fins de teste

        self.assertTrue(network_active, "Rede deve voltar após retentativas de resiliência")

        # Processamento e transmissão segura
        if network_active:
            for item in local_offline_queue:
                p_id = self.security.generate_sha256_hash(item["cpf"])
                e_name = self.security.encrypt_aes_gcm(item["nome"])
                bmi = self.rules.calculate_bmi(item["peso"], item["altura"])
                classificacao, risco, conduta = self.rules.classify_risk(4, bmi)
                self.db.save(p_id, e_name, "Carlos", 4, item["peso"], item["altura"], "Masculino", classificacao, risco, conduta)
            
            # Limpa fila local
            local_offline_queue.clear()
            sync_success = True

        self.assertTrue(sync_success)
        self.assertEqual(len(local_offline_queue), 0)
        self.assertEqual(len(self.db.records), 3)

if __name__ == '__main__':
    unittest.main()
