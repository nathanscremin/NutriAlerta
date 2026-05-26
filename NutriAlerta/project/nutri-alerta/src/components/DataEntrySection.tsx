"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { UNIDADES_SAUDE } from '@/lib/mockData';
import { ShieldCheck, Heart, AlertTriangle, CloudOff, RefreshCw, CheckCircle, Database, HelpCircle, FileText } from 'lucide-react';

export default function DataEntrySection() {
  const { selectedUbs, offlineQueue, addToOfflineQueue, clearOfflineQueue } = useAppStore();

  // Formulário
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [nomeResponsavel, setNomeResponsavel] = useState('');
  const [idade, setIdade] = useState('5');
  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [genero, setGenero] = useState<'Masculino' | 'Feminino'>('Masculino');
  const [ubsOrigem, setUbsOrigem] = useState(selectedUbs || UNIDADES_SAUDE[0].nome);

  // Estados de Interface
  const [isOfflineSimulated, setIsOfflineSimulated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Checklist Ético
  const [consentCheck, setConsentCheck] = useState(false);
  const [clinicaCheck, setClinicaCheck] = useState(false);
  const [sigiloCheck, setSigiloCheck] = useState(false);
  const [noloopCheck, setNoloopCheck] = useState(false);

  // Sincroniza UBS ativa se ela mudar no dashboard global
  useEffect(() => {
    if (selectedUbs) {
      setUbsOrigem(selectedUbs);
    }
  }, [selectedUbs]);

  // Cálculo de IMC e Classificação em Tempo Real (QA e Previsão Local)
  const pesoNum = parseFloat(peso);
  const alturaNum = parseFloat(altura);
  const idadeNum = parseInt(idade, 10);
  const imc = pesoNum && alturaNum ? pesoNum / (alturaNum * alturaNum) : 0;

  let classificacao = 'Aguardando dados...';
  let alertaRisco = 'info';
  let condutaClinica = '';
  let colorBadge = 'bg-slate-100 text-slate-650 dark:bg-zinc-800 dark:text-zinc-400';

  if (imc > 0) {
    if (idadeNum <= 5) {
      if (imc < 13.5) {
        classificacao = 'Desnutrição Infantil';
        alertaRisco = 'alto';
        condutaClinica = 'Aconselhamento urgente de aleitamento materno e encaminhamento imediato à pediatria.';
        colorBadge = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450 border border-blue-200/50';
      } else if (imc > 18.5) {
        classificacao = 'Obesidade Infantil';
        alertaRisco = 'alto';
        condutaClinica = 'Redução imediata de ultraprocessados, promoção de refeições naturais e inserção na agenda nutricional.';
        colorBadge = 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50';
      } else if (imc > 17.0) {
        classificacao = 'Sobrepeso Infantil';
        alertaRisco = 'medio';
        condutaClinica = 'Monitoramento do ganho de peso ponderal mensal pelas ACS e orientação dietética familiar de apoio.';
        colorBadge = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200/50';
      } else {
        classificacao = 'Eutrofia (Peso Adequado)';
        alertaRisco = 'baixo';
        condutaClinica = 'Apoiar o aleitamento continuado, alimentação saudável ativa e agendar pesagem de rotina semestral.';
        colorBadge = 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-450 border border-teal-200/50';
      }
    } else {
      // 6 a 18 anos
      if (imc < 14.0) {
        classificacao = 'Desnutrição';
        alertaRisco = 'alto';
        condutaClinica = 'Planejar visita domiciliar imediata da equipe multiprofissional da UBS e suplementação nutricional supervisionada.';
        colorBadge = 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-450 border border-blue-200/50';
      } else if (imc > 24.0) {
        classificacao = 'Obesidade';
        alertaRisco = 'alto';
        condutaClinica = 'Consulta médica com endocrinologista e agendamento da família em grupos de atividade física preventiva da UBS.';
        colorBadge = 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50';
      } else if (imc > 21.0) {
        classificacao = 'Sobrepeso';
        alertaRisco = 'medio';
        condutaClinica = 'Orientar a redução de frituras/açúcares e reinserir no grupo de aconselhamento alimentar prático.';
        colorBadge = 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-450 border border-amber-200/50';
      } else {
        classificacao = 'Eutrofia (Peso Adequado)';
        alertaRisco = 'baixo';
        condutaClinica = 'Parabenizar a família, incentivar o consumo de frutas/verduras na rotina e manter o acompanhamento anual.';
        colorBadge = 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-450 border border-teal-200/50';
      }
    }
  }

  // Validação Ética Completa
  const isEthicsApproved = consentCheck && clinicaCheck && sigiloCheck && noloopCheck;

  // Formatar CPF com máscara automática
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    // Máscara
    if (value.length > 9) {
      value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{1,2})$/, "$1.$2.$3-$4");
    } else if (value.length > 6) {
      value = value.replace(/^(\d{3})(\d{3})(\d{1,3})$/, "$1.$2.$3");
    } else if (value.length > 3) {
      value = value.replace(/^(\d{3})(\d{1,3})$/, "$1.$2");
    }
    setCpf(value);
  };

  // Salvar registro antropométrico
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Validações de QA imediatas no formulário (Prevenção de quebras ou dados inválidos)
    if (!nome.trim() || nome.trim().length < 3) {
      setErrorMessage('Erro de Validação: Nome do menor precisa ter no mínimo 3 letras.');
      return;
    }
    if (cpf.replace(/\D/g, '').length !== 11) {
      setErrorMessage('Erro de Validação: CPF incompleto.');
      return;
    }
    if (!nomeResponsavel.trim() || nomeResponsavel.trim().length < 3) {
      setErrorMessage('Erro de Validação: Nome do responsável precisa ter no mínimo 3 letras.');
      return;
    }
    if (!peso || isNaN(pesoNum) || pesoNum <= 1.0 || pesoNum > 200.0) {
      setErrorMessage('Erro de Validação: Peso fisiologicamente aceitável de 1.0kg a 200.0kg.');
      return;
    }
    if (!altura || isNaN(alturaNum) || alturaNum <= 0.3 || alturaNum > 2.5) {
      setErrorMessage('Erro de Validação: Altura fisiologicamente aceitável de 0.3m a 2.5m.');
      return;
    }

    const payload = {
      nome,
      cpf,
      nome_responsavel: nomeResponsavel,
      idade_anos: idadeNum,
      peso_kg: pesoNum,
      altura_m: alturaNum,
      genero,
      cnes_ubs: ubsOrigem
    };

    // Caso de simulação offline ativado (Resiliência de Rede nas UBSs)
    if (isOfflineSimulated) {
      addToOfflineQueue({
        ...payload,
        id: 'off-' + Math.random().toString(36).slice(2, 9),
        classificacao,
        imc: Number(imc.toFixed(2)),
        timestamp: new Date().toLocaleTimeString('pt-BR')
      });
      setSuccessMessage('Aviso de Resiliência: UBS sem conexão! Registro salvo localmente na fila offline do navegador com sucesso.');
      resetForm();
      return;
    }

    // Fluxo Online
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMessage(`Online: Paciente registrado e triado com sucesso via API! ID Pseudonimizado (LGPD): ${data.dadosProcessados.idPseudonimizado.slice(0, 16)}...`);
        resetForm();
      } else {
        setErrorMessage(`Erro no Servidor: ${data.error}`);
      }
    } catch {
      // Fallback automático de resiliência caso a rede caia inesperadamente durante o post
      addToOfflineQueue({
        ...payload,
        id: 'off-' + Math.random().toString(36).slice(2, 9),
        classificacao,
        imc: Number(imc.toFixed(2)),
        timestamp: new Date().toLocaleTimeString('pt-BR')
      });
      setSuccessMessage('Conexão perdida! Ativado fallback de resiliência automática: dados salvos localmente na fila offline do navegador.');
      resetForm();
    }
  };

  // Reseta o formulário
  const resetForm = () => {
    setNome('');
    setCpf('');
    setNomeResponsavel('');
    setPeso('');
    setAltura('');
  };

  // Sincronizar Fila Offline com a API (Simulador de Restabelecimento de Internet)
  const syncOfflineQueue = async () => {
    if (offlineQueue.length === 0 || isSyncing) return;
    setIsSyncing(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    let syncCount = 0;
    const pending = [...offlineQueue];

    for (const item of pending) {
      try {
        const res = await fetch('/api/pacientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nome: item.nome,
            cpf: item.cpf,
            nome_responsavel: item.nome_responsavel,
            idade_anos: item.idade_anos,
            peso_kg: item.peso_kg,
            altura_m: item.altura_m,
            genero: item.genero,
            cnes_ubs: item.cnes_ubs
          })
        });
        const data = await res.json();
        if (data.success) {
          syncCount++;
        }
      } catch (err) {
        console.error("Falha ao sincronizar item offline:", err);
      }
    }

    if (syncCount === pending.length) {
      clearOfflineQueue();
      setSuccessMessage(`Sincronização Concluída! Todos os ${syncCount} registros salvos localmente foram transmitidos com segurança e pseudonimizados no servidor central.`);
    } else if (syncCount > 0) {
      // Esvazia os sincronizados
      clearOfflineQueue();
      // Recarrega os falhos se houver
      const remaining = pending.slice(syncCount);
      remaining.forEach(item => addToOfflineQueue(item));
      setErrorMessage(`Sincronização Parcial: Apenas ${syncCount} de ${pending.length} registros foram sincronizados devido à instabilidade na rede da UBS.`);
    } else {
      setErrorMessage('Erro de Rede: Não foi possível restabelecer conexão com o servidor central. Tente novamente mais tarde.');
    }
    setIsSyncing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="p-6 space-y-6 max-w-7xl mx-auto w-full transition-colors duration-300"
    >
      {/* Cabeçalho da view */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-[#f5f5f7] tracking-tight">UBS Entrada de Dados & Triagem Nutricional</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 font-semibold">
            Módulo local integrado com a infraestrutura das Unidades Básicas de Saúde (UBS) de Rio Claro.
          </p>
        </div>

        {/* Toggle para Simulação Offline (Resiliência) */}
        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800/80 px-4 py-2.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <CloudOff className={`w-4 h-4 ${isOfflineSimulated ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-[10px] font-black text-slate-600 dark:text-zinc-350 uppercase tracking-wide">Sem Sinal UBS (Simular Offline)</span>
          </div>
          <button
            onClick={() => {
              setIsOfflineSimulated(!isOfflineSimulated);
              setSuccessMessage(null);
              setErrorMessage(null);
            }}
            className={`w-10 h-6 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${isOfflineSimulated ? 'bg-amber-500' : 'bg-slate-300 dark:bg-zinc-700'}`}
          >
            <motion.div
              layout
              className="bg-white w-4 h-4 rounded-full shadow"
              animate={{ x: isOfflineSimulated ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Alertas de Sucesso/Erro */}
      <AnimatePresence mode="wait">
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className={`p-4 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-3 shadow-md transition-all duration-300 ${
              successMessage.includes('Offline') 
                ? 'bg-amber-50/80 border-amber-200/60 text-amber-800 dark:bg-amber-955/20 dark:border-amber-900/30 dark:text-amber-400' 
                : 'bg-teal-50/80 border-teal-200/60 text-teal-800 dark:bg-teal-950/20 dark:border-emerald-900/30 dark:text-teal-400'
            }`}
          >
            {successMessage.includes('Offline') ? <CloudOff className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" /> : <CheckCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />}
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            className="bg-rose-50/80 border border-rose-200/60 text-rose-800 dark:bg-rose-955/20 dark:border-rose-900/30 dark:text-rose-450 p-4 rounded-xl text-xs font-semibold leading-relaxed flex items-start gap-3 shadow-md transition-all duration-300"
          >
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Formulário - Col 7 */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" /> Registro Antropométrico e Coleta (SISVAN)
            </h3>
            <p className="text-[10px] text-slate-550 dark:text-zinc-450 mt-1 font-semibold leading-normal">
              Insira as informações antropométricas da criança ou adolescente avaliado. Validações fisiológicas de QA e criptografia de privacidade ativas.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome completo */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Nome do Paciente (Menor)</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Nome completo do avaliado"
                  className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-650 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
              </div>

              {/* CPF do Paciente */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">CPF do Avaliado (ou Responsável)</label>
                <input
                  type="text"
                  required
                  value={cpf}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-655 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Responsável */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Nome Completo do Responsável</label>
                <input
                  type="text"
                  required
                  value={nomeResponsavel}
                  onChange={e => setNomeResponsavel(e.target.value)}
                  placeholder="Nome do pai, mãe ou tutor legal"
                  className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-650 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
              </div>

              {/* UBS de Atendimento */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">UBS de Origem</label>
                <div className="relative">
                  <select
                    value={ubsOrigem}
                    onChange={e => setUbsOrigem(e.target.value)}
                    className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-slate-705 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 cursor-pointer appearance-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                  >
                    {UNIDADES_SAUDE.filter(u => u.categoria === 'UBS').map(u => (
                      <option key={u.nome} value={u.nome} className="bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7]">{u.nome.replace('UBS ', '').replace('USF ', '')}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 dark:text-zinc-550">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
              {/* Idade */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Idade</label>
                <div className="relative">
                  <select
                    value={idade}
                    onChange={e => setIdade(e.target.value)}
                    className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 pr-10 text-xs font-semibold text-slate-705 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 cursor-pointer appearance-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                  >
                    {Array.from({ length: 19 }, (_, i) => String(i)).map(val => (
                      <option key={val} value={val} className="bg-white dark:bg-[#1c1c1e] text-slate-700 dark:text-[#f5f5f7]">{val} anos</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-450 dark:text-zinc-550">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>

              {/* Genero */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Gênero</label>
                <div className="flex gap-1 bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  {(['Masculino', 'Feminino'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGenero(g)}
                      className={`flex-1 text-[9px] font-extrabold py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                        genero === g 
                          ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-[0_2px_8px_rgba(13,148,136,0.2)]' 
                          : 'text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50'
                      }`}
                    >
                      {g === 'Masculino' ? 'MASC' : 'FEM'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Peso (kg) */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={peso}
                  onChange={e => setPeso(e.target.value)}
                  placeholder="ex: 18.25"
                  className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-650 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
              </div>

              {/* Altura (m) */}
              <div>
                <label className="text-[10px] font-black text-slate-455 dark:text-zinc-500 uppercase mb-1.5 block tracking-wider">Altura (m)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={altura}
                  onChange={e => setAltura(e.target.value)}
                  placeholder="ex: 1.12"
                  className="w-full bg-slate-55/50 dark:bg-zinc-900/30 border border-slate-200/80 dark:border-zinc-800/85 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-[#f5f5f7] focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-zinc-650 shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-zinc-900/40 mt-6">
              <button
                type="submit"
                disabled={!isEthicsApproved}
                className={`w-full font-extrabold text-xs py-3.5 rounded-xl text-center shadow-lg transition-all duration-300 cursor-pointer ${
                  isEthicsApproved 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-teal-500/15 hover:shadow-teal-500/25 active:scale-[0.995]' 
                    : 'bg-slate-100 text-slate-400 dark:bg-zinc-800/80 dark:text-zinc-600 cursor-not-allowed shadow-none border border-slate-200/20 dark:border-zinc-800/20'
                }`}
              >
                {!isEthicsApproved 
                  ? 'Aceite as Diretrizes Éticas na lateral para poder Registrar' 
                  : isOfflineSimulated 
                    ? 'Salvar Registro na Fila Local (UBS Offline)' 
                    : 'Transmitir Registro e Triar Risco Nutricional (Online)'}
              </button>
            </div>
          </form>
        </div>

        {/* Painel Ético & Raciocínio IA e Fila Offline - Col 5 */}
        <div className="lg:col-span-5 space-y-6">

          {/* Card de Predição e Risco em Tempo Real (QA & IA) */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2 mb-4">
              <Heart className="w-4 h-4 text-rose-500" /> Triagem Nutricional em Tempo Real
            </h3>

            {imc > 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                {/* IMC & Classificação */}
                <div className="flex justify-between items-center bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100/60 dark:border-zinc-850 p-4 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                  <div>
                    <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none block">IMC Calculado</span>
                    <strong className="text-xl font-black text-slate-800 dark:text-zinc-200 tracking-tight leading-none mt-2 block">{imc.toFixed(2)} <span className="text-xs font-semibold text-slate-400 dark:text-zinc-550">kg/m²</span></strong>
                  </div>
                  <div className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider ${colorBadge}`}>
                    {classificacao}
                  </div>
                </div>

                {/* Régua de Classificação Visual da OMS (High-Fidelity) */}
                <div className="relative pt-6 pb-2 px-1">
                  {/* Marcador flutuante */}
                  {(() => {
                    const minImc = 10;
                    const maxImc = 30;
                    const percent = Math.max(0, Math.min(100, ((imc - minImc) / (maxImc - minImc)) * 100));
                    return (
                      <motion.div 
                        initial={{ left: 0 }}
                        animate={{ left: `${percent}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 15 }}
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 z-10"
                      >
                        <span className="text-[9px] font-extrabold text-slate-700 dark:text-[#f5f5f7] bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-lg shadow-md border border-slate-200/50 dark:border-zinc-700/60 font-mono">
                          {imc.toFixed(2)}
                        </span>
                        <div className="w-1.5 h-1.5 rotate-45 bg-white dark:bg-zinc-800 border-r border-b border-slate-200/50 dark:border-zinc-700/60 -mt-0.5" />
                      </motion.div>
                    );
                  })()}

                  <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full relative overflow-hidden p-[1px] border border-slate-200/30 dark:border-zinc-700/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] flex">
                    {/* Faixas coloridas de fundo */}
                    <div className={`h-full transition-all duration-500 rounded-l-full ${classificacao.includes('Desnutrição') ? 'bg-blue-500' : 'bg-blue-400/25 dark:bg-blue-500/10'}`} style={{ width: '22%' }} />
                    <div className={`h-full transition-all duration-500 ${classificacao.includes('Eutrofia') ? 'bg-teal-500' : 'bg-emerald-400/25 dark:bg-teal-500/10'}`} style={{ width: '22.5%' }} />
                    <div className={`h-full transition-all duration-500 ${classificacao.includes('Sobrepeso') ? 'bg-amber-500' : 'bg-amber-400/25 dark:bg-amber-500/10'}`} style={{ width: '17.5%' }} />
                    <div className={`h-full transition-all duration-500 rounded-r-full ${classificacao.includes('Obesidade') ? 'bg-rose-500' : 'bg-rose-400/25 dark:bg-rose-500/10'}`} style={{ width: '38%' }} />
                  </div>

                  <div className="flex justify-between text-[8px] text-slate-450 dark:text-zinc-500 font-black uppercase tracking-wider mt-3 px-0.5">
                    <span className={classificacao.includes('Desnutrição') ? "text-blue-600 dark:text-blue-400" : ""}>Magreza</span>
                    <span className={classificacao.includes('Eutrofia') ? "text-teal-600 dark:text-teal-400" : ""}>Eutrofia</span>
                    <span className={classificacao.includes('Sobrepeso') ? "text-amber-600 dark:text-amber-400" : ""}>Sobrepeso</span>
                    <span className={classificacao.includes('Obesidade') ? "text-rose-600 dark:text-rose-455" : ""}>Obesidade</span>
                  </div>
                </div>

                {/* Conduta Recomendada */}
                <div className="bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-800/80 p-4 rounded-xl space-y-2 relative shadow-inner overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 bg-teal-500 h-full" />
                  <span className="text-[9px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <FileText className="w-3.5 h-3.5 text-slate-450" /> Conduta Clínica Recomendada (M.S.)
                  </span>
                  <p className="text-[11px] text-slate-655 dark:text-zinc-300 leading-relaxed font-semibold">
                    {condutaClinica}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center text-[10px] text-slate-450 dark:text-zinc-550 min-h-[220px]">
                <HelpCircle className="w-7 h-7 text-slate-350 dark:text-zinc-650 mb-2.5" />
                <p className="leading-relaxed font-medium max-w-[240px]">Preencha o Peso e a Altura da criança ao lado para que a inteligência local trie e classifique o risco nutricional instantaneamente.</p>
              </div>
            )}
          </div>

          {/* Checklist Ético - Aderência a IA Responsável e LGPD */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-500" /> Diretrizes Éticas e Não-Estigmatização (LGPD)
              </h3>
              <p className="text-[10px] text-slate-550 dark:text-zinc-455 mt-1 font-semibold leading-normal">
                Para conformidade legal (Art. 14 da LGPD) e ética em IA na saúde pública, marque os termos obrigatórios abaixo antes de efetivar o registro.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <EthicCheckbox
                checked={consentCheck}
                onChange={setConsentCheck}
                title="Consentimento LGPD Ativo"
                desc="Declaro que obtive autorização expressa dos pais/responsáveis legais para o tratamento de dados de saúde do menor avaliado."
              />
              <EthicCheckbox
                checked={clinicaCheck}
                onChange={setClinicaCheck}
                title="Apoio Decisório Não-Determinista"
                desc="Compreendo que a predição da IA serve como orientação de risco clínico, sendo a palavra final soberana do profissional médico."
              />
              <EthicCheckbox
                checked={sigiloCheck}
                onChange={setSigiloCheck}
                title="Sigilo Territorial de Risco"
                desc="Comprometo-me a tratar os dados de prevalência de desnutrição/obesidade com extremo sigilo para evitar estigmatização de famílias."
              />
              <EthicCheckbox
                checked={noloopCheck}
                onChange={setNoloopCheck}
                title="Acolhimento Construtivo de Cuidado"
                desc="Garantirei que os alertas sejam convertidos em apoio nutricional e prevenção, sem rotular ou constranger os pacientes mapeados."
              />
            </div>
          </div>

          {/* Fila de Resiliência Offline (UBS Local Cache) */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-[#2c2c2e] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-[#f5f5f7] uppercase tracking-wider flex items-center gap-2">
                  <CloudOff className="w-4 h-4 text-slate-550 dark:text-zinc-450" /> Fila Local de Resiliência Offline
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1 font-semibold">
                  Cadastros salvos localmente na UBS sem internet que aguardam sincronização com a nuvem central.
                </p>
              </div>
              <span className="text-[10px] font-black text-slate-600 dark:text-[#f5f5f7] bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-lg border dark:border-zinc-700 shadow-inner font-mono shrink-0">
                {offlineQueue.length}
              </span>
            </div>

            {offlineQueue.length > 0 ? (
              <div className="space-y-4">
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border dark:border-zinc-850 rounded-xl scrollbar-thin shadow-inner bg-slate-50/20 dark:bg-zinc-900/10">
                  {offlineQueue.map((item: any) => (
                    <div key={item.id} className="p-3.5 flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-zinc-350 hover:bg-slate-50/70 dark:hover:bg-zinc-900/35 transition-colors">
                      <div>
                        <span className="block truncate w-32 text-slate-800 dark:text-[#f5f5f7]">{item.nome}</span>
                        <span className="block text-[8px] text-slate-450 dark:text-zinc-550 mt-0.5">{item.cnes_ubs.replace('UBS ', '').replace('USF ', '')} · {item.genero} ({item.idade_anos} anos)</span>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[8px] font-black bg-amber-50 text-amber-700 dark:bg-amber-955/20 border border-amber-250/20 shadow-inner animate-pulse">OFFLINE - {item.timestamp}</span>
                        <span className="text-[9px] text-slate-500 font-bold">{item.classificacao.split(' ')[0]} (IMC: {item.imc})</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={syncOfflineQueue}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold text-xs py-3.5 rounded-xl cursor-pointer shadow-md disabled:opacity-40 transition-all duration-300 hover:shadow-teal-500/10 active:scale-[0.995]"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Sincronizando dados no servidor...' : 'Sincronizar Fila com o Servidor Central'}
                </button>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-zinc-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center text-[10px] text-slate-450 dark:text-zinc-550 min-h-[100px]">
                <CheckCircle className="w-5 h-5 text-slate-350 dark:text-zinc-650 mb-1.5" />
                <p className="font-semibold leading-relaxed max-w-[200px]">Nenhum registro pendente na fila offline de Rio Claro. Tudo sincronizado com sucesso!</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </motion.div>
  );
}

function EthicCheckbox({ checked, onChange, title, desc }: { checked: boolean; onChange: (v: boolean) => void; title: string; desc: string }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      onClick={() => onChange(!checked)}
      className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-3.5 select-none ${
        checked 
          ? 'bg-teal-50/20 border-emerald-350/50 text-slate-800 dark:bg-teal-950/15 dark:border-teal-800/50 dark:text-[#f5f5f7] shadow-[0_2px_10px_rgba(16,185,129,0.05)]' 
          : 'bg-slate-50/30 dark:bg-zinc-900/10 border-slate-200/60 dark:border-zinc-800/80 text-slate-655 hover:bg-slate-50/80 hover:border-slate-350 dark:hover:bg-zinc-850/20 hover:text-slate-850 dark:text-zinc-400'
      }`}
    >
      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 border mt-0.5 transition-all duration-205 ${
        checked 
          ? 'bg-teal-500 border-emerald-500 text-white shadow-sm' 
          : 'bg-slate-150 dark:bg-zinc-850 border-slate-350 dark:border-zinc-700 text-transparent'
      }`}>
        <svg className="w-2.5 h-2.5 stroke-current stroke-[3.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <h4 className="text-[10px] font-black tracking-wide uppercase leading-none mb-1 text-slate-800 dark:text-[#f5f5f7]">{title}</h4>
        <p className="text-[9.5px] font-semibold text-slate-500 dark:text-zinc-450 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}
