const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'ConsultantView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 2. Replace Imports
const oldImports = `import { Bot, Send, BrainCircuit, Sparkles, MapPin, Search, Globe, Trash2, Hospital, Home, School } from 'lucide-react';`;
const newImports = `import { Bot, Send, BrainCircuit, Sparkles, MapPin, Search, Globe, Trash2, Hospital, Home, School, ArrowUp, Users } from 'lucide-react';`;
content = content.replace(oldImports, newImports);

// 3. Inject Helper Variables
const oldTotalAvaliadosStr = `  const totalAvaliadosStr = React.useMemo(() => {
    if (!totalAvaliados) return 'N/D';
    return totalAvaliados >= 1000 ? \`\${(totalAvaliados / 1000).toFixed(1)}K\` : String(totalAvaliados);
  }, [totalAvaliados]);`;

const newHelpers = `  const totalAvaliadosStr = React.useMemo(() => {
    if (!totalAvaliados) return 'N/D';
    return totalAvaliados >= 1000 ? \`\${(totalAvaliados / 1000).toFixed(1)}K\` : String(totalAvaliados);
  }, [totalAvaliados]);

  // Dynamic evaluated students for active scope
  const selectedScopeAvaliados = React.useMemo(() => {
    if (analysisLevel === 'escola' && selectedSchoolName) {
      return schoolMetrics[selectedSchoolName]?.anos?.[cleanYear]?.total_avaliados || 0;
    }
    if (analysisLevel === 'bairro' && selectedBairroName) {
      return bairroMetrics[selectedBairroName]?.anos?.[cleanYear]?.total_avaliados || 0;
    }
    if (analysisLevel === 'ubs' && selectedUbs) {
      let ubsTotal = 0;
      Object.values(schoolMetrics || {}).forEach((sch) => {
        if (sch.regiao_ubs === selectedUbs && sch.anos?.[cleanYear]?.total_avaliados) {
          ubsTotal += sch.anos[cleanYear].total_avaliados;
        }
      });
      return ubsTotal || regionalData[cleanYear]?.[selectedUbs]?.total_avaliados || 0;
    }
    return totalAvaliados;
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs, schoolMetrics, bairroMetrics, regionalData, cleanYear, totalAvaliados]);

  const selectedScopeAvaliadosStr = React.useMemo(() => {
    if (!selectedScopeAvaliados) return 'N/D';
    return selectedScopeAvaliados >= 1000 ? \`\${(selectedScopeAvaliados / 1000).toFixed(1)}K\` : String(selectedScopeAvaliados);
  }, [selectedScopeAvaliados]);

  // suggested questions for focus level
  const suggestedQuestions = React.useMemo(() => {
    if (analysisLevel === 'escola' && selectedSchoolName) {
      const schClean = selectedSchoolName.replace(/^(E\\.M\\.E\\.F\\.|E\\.E\\.|E\\.M\\.)\\s/, '').split(' “')[0];
      return [
        { label: 'Fatores de risco local', text: \`Quais são os principais fatores de risco nutricional na escola \${schClean}?\` },
        { label: 'Plano de Ação Escolar', text: \`Sugira um plano de ação e gincanas para combater a obesidade na escola \${schClean}.\` },
        { label: 'Projeção futura de saúde', text: \`Como deve evoluir a saúde nutricional dos alunos da escola \${schClean} nos próximos anos?\` }
      ];
    }
    if (analysisLevel === 'bairro' && selectedBairroName) {
      return [
        { label: 'Escolas mais críticas', text: \`Quais são as escolas mais críticas localizadas no bairro \${selectedBairroName}?\` },
        { label: 'Panorama do bairro', text: \`Faça um diagnóstico completo do perfil nutricional infantil no bairro \${selectedBairroName}.\` },
        { label: 'Comparação municipal', text: \`Como a prevalência de obesidade no bairro \${selectedBairroName} se compara com o resto de Rio Claro?\` }
      ];
    }
    if (analysisLevel === 'ubs' && selectedUbs) {
      const ubsClean = selectedUbs.replace(/^(UBS|USF)\\s/, '').split(' “')[0];
      return [
        { label: 'Bairros vulneráveis', text: \`Sob a cobertura da UBS \${ubsClean}, quais bairros apresentam maior vulnerabilidade nutricional?\` },
        { label: 'Desempenho da UBS', text: \`Como as taxas de peso saudável na área da UBS \${ubsClean} se comparam com as metas municipais?\` },
        { label: 'Ações comunitárias', text: \`Sugira estratégias de intervenção comunitária para as equipes de saúde da UBS \${ubsClean}.\` }
      ];
    }
    return [
      { label: 'UBS de maior risco', text: 'Quais são as 3 Unidades de Saúde (UBS) com maior prevalência de obesidade infantil no município?' },
      { label: 'Diagnóstico Geral', text: 'Faça um resumo executivo da situação de segurança alimentar e nutricional infantil em Rio Claro.' },
      { label: 'Projeções 2026/2027', text: 'Quais são as projeções do modelo de IA para os indicadores de obesidade e desnutrição infantil nos próximos anos?' }
    ];
  }, [analysisLevel, selectedSchoolName, selectedBairroName, selectedUbs]);

  const handleSuggestionClick = (text) => {
    setInput(text);
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.focus();
      setTimeout(() => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 160) + 'px';
      }, 50);
    }
  };`;

content = content.replace(oldTotalAvaliadosStr, newHelpers);

// 4. Replace Input box completely
const oldInput = `        {/* Input */}
        <div className="p-5 border-t border-slate-200 dark:border-[#2c2c2e] bg-slate-50/50 dark:bg-[#1c1c1e]/50">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Faça uma pergunta sobre os dados epidemiológicos..."
              className="w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-[#2c2c2e] rounded-2xl py-3.5 pl-5 pr-14 text-xs font-semibold text-slate-800 dark:text-[#f5f5f7] placeholder:text-slate-400 dark:placeholder:text-zinc-655 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]"
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-95 text-white"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
          <p className="text-[9px] font-black tracking-widest text-slate-400 dark:text-zinc-500 mt-3 text-center uppercase">
            IA baseada nos dados reais Nutri for Schools/CNES de Rio Claro
          </p>
        </div>`;

const newInput = `        {/* Input */}
        <div className="px-5 pb-5 pt-3 bg-white dark:bg-[#1c1c1e] border-t border-slate-100 dark:border-[#2c2c2e]">
          <div className="flex flex-col gap-2.5 bg-slate-50/80 dark:bg-[#2c2c2e]/45 border border-slate-200/80 dark:border-zinc-700/50 rounded-2xl p-3 focus-within:ring-2 focus-within:ring-teal-500/25 focus-within:border-teal-400/50 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={e => {
                setInput(e.target.value);
                // auto-resize
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
              }}
              onKeyDown={handleKey}
              placeholder={\`Pergunte ao NutriBot sobre \${
                analysisLevel === 'escola' ? (selectedSchoolName ? selectedSchoolName.replace(/^(E\\.M\\.E\\.F\\.|E\\.E\\.|E\\.M\\.)\\s/, '').split(' “')[0] : 'esta escola') :
                analysisLevel === 'bairro' ? (selectedBairroName ?? 'este bairro') :
                analysisLevel === 'ubs' ? (selectedUbs ? selectedUbs.replace(/^(UBS|USF)\\s/, '') : 'esta UBS') : 'o município'
              }...\`}
              className="w-full bg-transparent text-sm font-medium text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none resize-none leading-relaxed min-h-[44px] max-h-[160px] overflow-y-auto"
              style={{ height: '44px' }}
            />
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-800/40 pt-2 shrink-0 select-none">
              {/* Context status indicator pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 dark:bg-teal-950/20 border border-teal-100/30 dark:border-teal-900/30 text-[10px] font-bold text-teal-650 dark:text-teal-400">
                <Sparkles className="w-3 h-3 text-teal-500" />
                <span>
                  Foco: \${
                    analysisLevel === 'municipio' ? 'Rio Claro (Geral)' :
                    analysisLevel === 'ubs' ? (selectedUbs ?? 'UBS').replace(/^(UBS|USF)\\s/, '') :
                    analysisLevel === 'bairro' ? (selectedBairroName ?? 'Bairro') :
                    (selectedSchoolName ?? 'Escola').replace(/^(E\\.M\\.E\\.F\\.|E\\.E\\.|E\\.M\\.)\\s/, '').split(' “')[0]
                  }
                </span>
              </div>
              
              {/* Send button */}
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-teal-500 hover:bg-teal-600 disabled:opacity-35 disabled:cursor-not-allowed text-white transition-all duration-200 cursor-pointer active:scale-95 shadow-sm shadow-teal-500/30 shrink-0"
                title="Enviar mensagem"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-650 mt-2 text-center font-medium">
            Contexto atualizado automaticamente pelo filtro lateral
          </p>
        </div>`;

content = content.replace(oldInput, newInput);

// 5. Replace List completely!
// We'll cut from '        {/* List content */}' down to the closing div of the panel.
const listStartIndex = content.indexOf('        {/* List content */}');
if (listStartIndex === -1) {
  console.error('Could not find list start marker!');
  process.exit(1);
}

// Find the index of right context panel end which has the matching </div>\n    </motion.div>
const restContent = content.substring(listStartIndex);
const closeDivsIndex = restContent.indexOf('      </div>\n    </motion.div>');
if (closeDivsIndex === -1) {
  console.error('Could not find right panel closing divs!');
  process.exit(1);
}

const listEndIndex = listStartIndex + closeDivsIndex;

const newListContent = `        {/* List content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">

          {/* Municipio */}
          {analysisLevel === 'municipio' && (() => {
            const badge = getRiskBadge(dadosAno[indicador] || 0, indicador);
            return (
              <div className="space-y-4">
                <div className="m-3 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/35 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all">
                  {/* Header of Dossier */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-200/40 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                        <Globe className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7] truncate leading-snug">
                          Rio Claro (Visão Geral)
                        </h4>
                        <p className="text-[9px] font-semibold text-slate-450 dark:text-zinc-500 mt-0.5 leading-none">
                          Monitoramento Nutricional Consolidado
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status / Badge */}
                  <div className="mb-4">
                    <span className={\`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border \${badge.bg}\`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      \${badge.label}
                    </span>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                      <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Peso Adequado
                      </div>
                      <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                        {dadosAno.eutrofia.toFixed(1)}<span className="text-xs font-bold text-slate-450 dark:text-zinc-550">%</span>
                      </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                      <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        Obesidade
                      </div>
                      <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                        {dadosAno.obesidade.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                      </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                      <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Sobrepeso
                      </div>
                      <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                        {dadosAno.sobrepeso.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                      </p>
                    </div>

                    <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                      <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Desnutrição
                      </div>
                      <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                        {dadosAno.desnutricao.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                      </p>
                    </div>
                  </div>

                  {/* Evaluated & Model Info */}
                  <div className="flex items-center justify-between text-[10px] text-slate-455 dark:text-zinc-555 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
                    <span className="flex items-center gap-1 font-bold">
                      <Users className="w-3.5 h-3.5" />
                      Alunos Avaliados: <strong className="text-slate-700 dark:text-zinc-300 font-mono ml-0.5">{selectedScopeAvaliadosStr}</strong>
                    </span>
                    <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/20 dark:border-zinc-800/20 font-black tracking-wide">
                      <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                      {dadosAno.isPrevisao ? 'PROJEÇÃO ML' : 'DADO REAL'}
                    </span>
                  </div>
                </div>

                {/* Suggested Questions */}
                <div className="mx-3 mb-4">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-teal-500" /> Perguntas Sugeridas
                  </h5>
                  <div className="space-y-1.5">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(q.text)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/55 bg-white dark:bg-zinc-900/10 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-900/55 hover:bg-slate-100/45 dark:hover:bg-zinc-900/35 hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-all cursor-pointer flex items-center gap-2 group shadow-[0_1px_2px_rgba(0,0,0,0.01)] active:scale-[0.99]"
                      >
                        <span className="w-4 h-4 rounded bg-teal-500/10 dark:bg-teal-950/30 flex items-center justify-center shrink-0 text-teal-650 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 font-black">
                          ?
                        </span>
                        <span className="truncate flex-1">{q.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* UBS list */}
          {analysisLevel === 'ubs' && (
            <div className="space-y-3">
              {/* Dossier or Empty State */}
              {selectedUbs ? (() => {
                const badge = getRiskBadge(dadosAno[indicador] || 0, indicador);
                const ubsTotalSchools = schoolsList.filter(s => s.regiao_ubs === selectedUbs).length;
                return (
                  <div className="space-y-4">
                    <div className="m-3 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/35 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all">
                      {/* Header of Dossier */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-200/40 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7] truncate leading-snug">
                              {selectedUbs}
                            </h4>
                            <p className="text-[9px] font-semibold text-slate-450 dark:text-zinc-550 mt-0.5 leading-none">
                              {ubsTotalSchools} escolas atendidas nesta região
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSelection('municipio', null, null, null)}
                          className="text-[9px] font-bold text-rose-500 dark:text-rose-455 bg-rose-500/10 dark:bg-rose-955/20 px-2 py-1 rounded-lg border border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-500/20 transition-all cursor-pointer select-none shrink-0"
                          title="Limpar seleção e voltar ao Geral"
                        >
                          × Fechar
                        </button>
                      </div>

                      {/* Status / Badge */}
                      <div className="mb-4">
                        <span className={\`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border \${badge.bg}\`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          \${badge.label}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Peso Adequado
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.eutrofia.toFixed(1)}<span className="text-xs font-bold text-slate-450 dark:text-zinc-550">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Obesidade
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.obesidade.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sobrepeso
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.sobrepeso.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Desnutrição
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.desnutricao.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>
                      </div>

                      {/* Evaluated & Model Info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-455 dark:text-zinc-550 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
                        <span className="flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          Alunos Avaliados: <strong className="text-slate-700 dark:text-zinc-300 font-mono ml-0.5">{selectedScopeAvaliadosStr}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/20 dark:border-zinc-800/20 font-black tracking-wide">
                          <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                          {dadosAno.isPrevisao ? 'PROJEÇÃO ML' : 'DADO REAL'}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Questions */}
                    <div className="mx-3 mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-500" /> Perguntas Sugeridas
                      </h5>
                      <div className="space-y-1.5">
                        {suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(q.text)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/55 bg-white dark:bg-zinc-900/10 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-900/55 hover:bg-slate-100/45 dark:hover:bg-zinc-900/35 hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-all cursor-pointer flex items-center gap-2 group shadow-[0_1px_2px_rgba(0,0,0,0.01)] active:scale-[0.99]"
                          >
                            <span className="w-4 h-4 rounded bg-teal-500/10 dark:bg-teal-950/30 flex items-center justify-center shrink-0 text-teal-650 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 font-black">
                              ?
                            </span>
                            <span className="truncate flex-1">{q.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="mx-3 my-6 p-6 rounded-2xl border border-dashed border-slate-250 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/5 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-550 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-zinc-550 animate-pulse" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                    Nenhuma UBS Selecionada
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-650 leading-relaxed font-semibold max-w-[240px]">
                    Selecione uma Unidade de Saúde na lista abaixo para visualizar seu dossiê clínico detalhado e acessar perguntas guiadas.
                  </p>
                </div>
              )}

              {/* Sub-header for list */}
              <div className="px-4 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-450 dark:text-zinc-550 border-t border-slate-100 dark:border-zinc-800/30 mt-3 select-none">
                Todas as Unidades de Saúde ({filteredUbs.length})
              </div>

              {/* Scrollable list items */}
              <div className="p-2 space-y-1">
                {filteredUbs.map((ubs) => {
                  const isSelected = selectedUbs === ubs.nome;
                  const ubsData = regionalData[cleanYear]?.[ubs.nome];
                  let val = ubsData ? ubsData[indicador] : (indicador === 'desnutricao' ? 2.62 : indicador === 'obesidade' ? 12.93 : indicador === 'sobrepeso' ? 16.3 : 61.2);
                  let finalVal = 0;
                  if (indicador === 'eutrofia') {
                    const dObs = ubsData ? ubsData.obesidade : 12.93;
                    const dDes = ubsData ? ubsData.desnutricao : 2.62;
                    const dSob = ubsData ? ubsData.sobrepeso : 16.3;
                    const dEut = ubsData ? ubsData.eutrofia : 61.2;
                    const scaleDes = Number((dDes * multDes).toFixed(2));
                    const scaleObs = Number((dObs * multObs).toFixed(2));
                    const scaleSob = Number((dSob * ((multObs + 1) / 2)).toFixed(2));
                    const beforeSum = dDes + dObs + dSob;
                    const afterSum = scaleDes + scaleObs + scaleSob;
                    finalVal = Math.max(10, Number((dEut - (afterSum - beforeSum)).toFixed(2)));
                  } else {
                    const multiplier = indicador === 'desnutricao' ? multDes : multObs;
                    finalVal = Number((val * multiplier).toFixed(2));
                  }
                  const badge = getRiskBadge(finalVal, indicador);
                  let ubsTotalEvaluated = 0;
                  Object.values(schoolMetrics || {}).forEach((sch) => {
                    if (sch.regiao_ubs === ubs.nome && sch.anos?.[cleanYear]?.total_avaliados) ubsTotalEvaluated += sch.anos[cleanYear].total_avaliados;
                  });
                  const totalAv = ubsTotalEvaluated > 0 ? ubsTotalEvaluated : (ubsData?.total_avaliados || 1200);

                  return (
                    <button
                      key={ubs.nome}
                      onClick={() => isSelected ? setSelection('municipio', null, null, null) : setSelection('ubs', ubs.nome, null, null)}
                      className={\`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 \${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50 shadow-sm'
                          : 'bg-white dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800/65 hover:border-slate-200 dark:hover:border-zinc-700/60 hover:shadow-sm'
                      }\`}
                    >
                      <div className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 \${
                        isSelected ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                      }\`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 truncate">{ubs.nome.replace(/^(UBS|USF)\\s/, '')}</p>
                          <span className={\`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border \${badge.bg} shrink-0\`}>{badge.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 dark:text-zinc-550">
                          <span>{mainLabel}: <strong className="text-slate-655 dark:text-zinc-300">{finalVal.toFixed(1)}%</strong></span>
                          <span>{totalAv} alunos</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredUbs.length === 0 && <p className="p-8 text-center text-xs text-slate-400 dark:text-zinc-650 italic">Nenhuma unidade encontrada.</p>}
              </div>
            </div>
          )}

          {/* Bairro list */}
          {analysisLevel === 'bairro' && (
            <div className="space-y-3">
              {/* Dossier or Empty State */}
              {selectedBairroName ? (() => {
                const badge = getRiskBadge(dadosAno[indicador] || 0, indicador);
                const parentUbsClean = (uniqueBairrosList.find(b => b.nome === selectedBairroName)?.parentUbs || '–').replace(/^(UBS|USF)\\s/, '');
                return (
                  <div className="space-y-4">
                    <div className="m-3 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/35 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all">
                      {/* Header of Dossier */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-200/40 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7] truncate leading-snug">
                              {selectedBairroName}
                            </h4>
                            <p className="text-[9px] font-semibold text-slate-450 dark:text-zinc-500 mt-0.5 leading-none">
                              Região de Saúde: UBS {parentUbsClean}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSelection('municipio', null, null, null)}
                          className="text-[9px] font-bold text-rose-500 dark:text-rose-455 bg-rose-500/10 dark:bg-rose-955/20 px-2 py-1 rounded-lg border border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-500/20 transition-all cursor-pointer select-none shrink-0"
                          title="Limpar seleção e voltar ao Geral"
                        >
                          × Fechar
                        </button>
                      </div>

                      {/* Status / Badge */}
                      <div className="mb-4">
                        <span className={\`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border \${badge.bg}\`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          \${badge.label}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Peso Adequado
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.eutrofia.toFixed(1)}<span className="text-xs font-bold text-slate-450 dark:text-zinc-550">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Obesidade
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.obesidade.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-805/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sobrepeso
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.sobrepeso.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-850/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Desnutrição
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.desnutricao.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>
                      </div>

                      {/* Evaluated & Model Info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-455 dark:text-zinc-550 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
                        <span className="flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          Alunos Avaliados: <strong className="text-slate-700 dark:text-zinc-300 font-mono ml-0.5">{selectedScopeAvaliadosStr}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/20 dark:border-zinc-800/20 font-black tracking-wide">
                          <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                          {dadosAno.isPrevisao ? 'PROJEÇÃO ML' : 'DADO REAL'}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Questions */}
                    <div className="mx-3 mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-500" /> Perguntas Sugeridas
                      </h5>
                      <div className="space-y-1.5">
                        {suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(q.text)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/55 bg-white dark:bg-zinc-900/10 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-900/55 hover:bg-slate-100/45 dark:hover:bg-zinc-900/35 hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-all cursor-pointer flex items-center gap-2 group shadow-[0_1px_2px_rgba(0,0,0,0.01)] active:scale-[0.99]"
                          >
                            <span className="w-4 h-4 rounded bg-teal-500/10 dark:bg-teal-950/30 flex items-center justify-center shrink-0 text-teal-650 dark:text-teal-400 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 font-black">
                              ?
                            </span>
                            <span className="truncate flex-1">{q.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="mx-3 my-6 p-6 rounded-2xl border border-dashed border-slate-250 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/5 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-550 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <MapPin className="w-5 h-5 text-slate-400 dark:text-zinc-550 animate-pulse" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                    Nenhum Bairro Selecionado
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-655 leading-relaxed font-semibold max-w-[240px]">
                    Selecione um bairro na listagem abaixo para carregar as métricas exclusivas de saúde infantil local.
                  </p>
                </div>
              )}

              {/* Sub-header for list */}
              <div className="px-4 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550 border-t border-slate-100 dark:border-zinc-800/30 mt-3 select-none">
                Bairros e Setores Disponíveis ({filteredBairros.length})
              </div>

              {/* Scrollable list items */}
              <div className="p-2 space-y-1">
                {filteredBairros.map((b) => {
                  const isSelected = selectedBairroName === b.nome;
                  const parentUbs = b.parentUbs;
                  const ubsData = regionalData[cleanYear]?.[parentUbs];
                  const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                  const baseDes = ubsData && typeof ubsData.desnutricao === 'number' ? ubsData.desnutricao : globalRec.desnutricao;
                  const baseObs = ubsData && typeof ubsData.obesidade === 'number' ? ubsData.obesidade : globalRec.obesidade;
                  const baseSob = ubsData && typeof ubsData.sobrepeso === 'number' ? ubsData.sobrepeso : (globalRec as any).sobrepeso || 16.3;
                  const baseEut = ubsData && typeof ubsData.eutrofia === 'number' ? ubsData.eutrofia : (globalRec as any).eutrofia || 61.2;
                  const bMetric = bairroMetrics[b.nome];
                  const bYearData = bMetric?.anos?.[cleanYear];
                  let pDes = bYearData ? bYearData.desnutricao : baseDes;
                  let pObs = bYearData ? bYearData.obesidade : baseObs;
                  let pSob = bYearData ? bYearData.sobrepeso : baseSob;
                  let pEut = bYearData ? bYearData.eutrofia : baseEut;
                  const scaleDes = Number((pDes * multDes).toFixed(2));
                  const scaleObs = Number((pObs * multObs).toFixed(2));
                  const scaleSob = Number((pSob * ((multObs + 1) / 2)).toFixed(2));
                  const bBefore = pDes + pObs + pSob;
                  const bAfter = scaleDes + scaleObs + scaleSob;
                  const scaleEut = Math.max(10, Number((pEut - (bAfter - bBefore)).toFixed(2)));
                  let finalVal = indicador === 'desnutricao' ? scaleDes : indicador === 'obesidade' ? scaleObs : indicador === 'sobrepeso' ? scaleSob : scaleEut;
                  const badge = getRiskBadge(finalVal, indicador);

                  return (
                    <button
                      key={b.nome}
                      onClick={() => isSelected ? setSelection('ubs', b.parentUbs || null, null, null) : setSelection('bairro', b.parentUbs || null, b.nome, null)}
                      className={\`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 \${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50 shadow-sm'
                          : 'bg-white dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800/65 hover:border-slate-200 dark:hover:border-zinc-700/60 hover:shadow-sm'
                      }\`}
                    >
                      <div className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 \${
                        isSelected ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500'
                      }\`}>
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 truncate">{b.nome}</p>
                          <span className={\`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border \${badge.bg} shrink-0\`}>{badge.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-450 dark:text-zinc-550">
                          <span>{mainLabel}: <strong className="text-slate-655 dark:text-zinc-300">{finalVal.toFixed(1)}%</strong></span>
                          <span className="truncate max-w-[120px]">{b.parentUbs.replace(/^(UBS|USF)\\s/, '')}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredBairros.length === 0 && <p className="p-8 text-center text-xs text-slate-400 dark:text-zinc-655 italic">Nenhum bairro encontrado.</p>}
              </div>
            </div>
          )}

          {/* Escola list */}
          {analysisLevel === 'escola' && (
            <div className="space-y-3">
              {/* Dossier or Empty State */}
              {selectedSchoolName ? (() => {
                const badge = getRiskBadge(dadosAno[indicador] || 0, indicador);
                const schMetric = schoolMetrics[selectedSchoolName];
                const schClean = selectedSchoolName.replace(/^(E\\.M\\.E\\.F\\.|E\\.E\\.|E\\.M\\.)\\s/, '').split(' “')[0];
                return (
                  <div className="space-y-4">
                    <div className="m-3 p-4 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/35 relative overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.01)] transition-all">
                      {/* Header of Dossier */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-200/40 dark:border-teal-900/40 flex items-center justify-center shrink-0">
                            <School className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-[#f5f5f7] truncate leading-snug">
                              {schClean}
                            </h4>
                            <p className="text-[9px] font-semibold text-slate-450 dark:text-zinc-550 mt-0.5 leading-none truncate max-w-[180px]">
                              Bairro: {schMetric?.bairro || '–'} · UBS: {(schMetric?.regiao_ubs || '–').replace(/^(UBS|USF)\\s/, '')}
                            </p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => setSelection('municipio', null, null, null)}
                          className="text-[9px] font-bold text-rose-500 dark:text-rose-455 bg-rose-500/10 dark:bg-rose-955/20 px-2 py-1 rounded-lg border border-rose-100/50 dark:border-rose-900/30 hover:bg-rose-500/20 transition-all cursor-pointer select-none shrink-0"
                          title="Limpar seleção e voltar ao Geral"
                        >
                          × Fechar
                        </button>
                      </div>

                      {/* Status / Badge */}
                      <div className="mb-4">
                        <span className={\`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border \${badge.bg}\`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                          \${badge.label}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Peso Adequado
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.eutrofia.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-550">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            Obesidade
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.obesidade.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Sobrepeso
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.sobrepeso.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>

                        <div className="bg-white dark:bg-zinc-800/40 rounded-xl p-2.5 border border-slate-200/50 dark:border-zinc-700/30">
                          <div className="flex items-center gap-1.5 mb-1 text-[8.5px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            Desnutrição
                          </div>
                          <p className="text-base font-black text-slate-800 dark:text-zinc-100 font-mono">
                            {dadosAno.desnutricao.toFixed(1)}<span className="text-xs font-bold text-slate-455 dark:text-zinc-555">%</span>
                          </p>
                        </div>
                      </div>

                      {/* Evaluated & Model Info */}
                      <div className="flex items-center justify-between text-[10px] text-slate-455 dark:text-zinc-550 border-t border-slate-200/40 dark:border-zinc-800/40 pt-2.5">
                        <span className="flex items-center gap-1 font-bold">
                          <Users className="w-3.5 h-3.5" />
                          Alunos Avaliados: <strong className="text-slate-700 dark:text-zinc-300 font-mono ml-0.5">{selectedScopeAvaliadosStr}</strong>
                        </span>
                        <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 border border-slate-200/20 dark:border-zinc-800/20 font-black tracking-wide">
                          <Sparkles className="w-2.5 h-2.5 text-teal-500" />
                          {dadosAno.isPrevisao ? 'PROJEÇÃO ML' : 'DADO REAL'}
                        </span>
                      </div>
                    </div>

                    {/* Suggested Questions */}
                    <div className="mx-3 mb-4">
                      <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-500 mb-2 px-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-teal-500" /> Perguntas Sugeridas
                      </h5>
                      <div className="space-y-1.5">
                        {suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(q.text)}
                            className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/55 bg-white dark:bg-zinc-900/10 text-[11px] font-bold text-slate-700 dark:text-zinc-300 hover:border-teal-300 dark:hover:border-teal-900/55 hover:bg-slate-100/45 dark:hover:bg-zinc-900/35 hover:text-slate-900 dark:hover:text-[#f5f5f7] transition-all cursor-pointer flex items-center gap-2 group shadow-[0_1px_2px_rgba(0,0,0,0.01)] active:scale-[0.99]"
                          >
                            <span className="w-4 h-4 rounded bg-teal-500/10 dark:bg-teal-950/30 flex items-center justify-center shrink-0 text-teal-655 dark:text-teal-450 group-hover:bg-teal-500 group-hover:text-white transition-all duration-300 font-black">
                              ?
                            </span>
                            <span className="truncate flex-1">{q.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })() : (
                <div className="mx-3 my-6 p-6 rounded-2xl border border-dashed border-slate-250 dark:border-zinc-800/80 bg-slate-50/20 dark:bg-zinc-900/5 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-zinc-900 border border-slate-200/40 dark:border-zinc-850 flex items-center justify-center text-slate-400 dark:text-zinc-550 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                    <School className="w-5 h-5 text-slate-400 dark:text-zinc-550 animate-pulse" />
                  </div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-zinc-200 mb-1">
                    Nenhuma Escola Selecionada
                  </h4>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-655 leading-relaxed font-semibold max-w-[240px]">
                    Selecione uma instituição de ensino na listagem abaixo para carregar as métricas detalhadas e iniciar o diagnóstico por IA.
                  </p>
                </div>
              )}

              {/* Sub-header for list */}
              <div className="px-4 pt-2.5 pb-1 text-[9px] font-black uppercase tracking-wider text-slate-455 dark:text-zinc-550 border-t border-slate-100 dark:border-zinc-800/30 mt-3 select-none">
                Escolas Monitoradas Disponíveis ({filteredSchools.length})
              </div>

              {/* Scrollable list items */}
              <div className="p-2 space-y-1">
                {filteredSchools.map((s) => {
                  const isSelected = selectedSchoolName === s.nome;
                  const parentUbs = s.regiao_ubs || '';
                  const ubsRecord = parentUbs ? regionalData[cleanYear]?.[parentUbs] : null;
                  const globalRec = temporalData.find(t => t.ano.replace('★', '').trim() === cleanYear) || { desnutricao: 2.62, obesidade: 12.93, sobrepeso: 16.3, eutrofia: 61.2 };
                  const baseDes = ubsRecord && typeof ubsRecord.desnutricao === 'number' ? ubsRecord.desnutricao : globalRec.desnutricao;
                  const baseObs = ubsRecord && typeof ubsRecord.obesidade === 'number' ? ubsRecord.obesidade : globalRec.obesidade;
                  const baseSob = ubsRecord && typeof ubsRecord.sobrepeso === 'number' ? ubsRecord.sobrepeso : (globalRec as any).sobrepeso || 16.3;
                  const baseEut = ubsRecord && typeof ubsRecord.eutrofia === 'number' ? ubsRecord.eutrofia : (globalRec as any).eutrofia || 61.2;
                  const sMetric = schoolMetrics[s.nome];
                  const sYearData = sMetric?.anos?.[cleanYear];
                  let pDes = sYearData ? sYearData.desnutricao : baseDes;
                  let pObs = sYearData ? sYearData.obesidade : baseObs;
                  let pSob = sYearData ? sYearData.sobrepeso : baseSob;
                  let pEut = sYearData ? sYearData.eutrofia : baseEut;
                  const sumN = pDes + pObs + pSob + pEut;
                  if (sumN > 0) { pDes = (pDes / sumN) * 100; pObs = (pObs / sumN) * 100; pSob = (pSob / sumN) * 100; pEut = (pEut / sumN) * 100; }
                  const scaleDes = Number((pDes * multDes).toFixed(2));
                  const scaleObs = Number((pObs * multObs).toFixed(2));
                  const scaleSob = Number((pSob * ((multObs + 1) / 2)).toFixed(2));
                  const sBefore = pDes + pObs + pSob;
                  const sAfter = scaleDes + scaleObs + scaleSob;
                  const scaleEut = Math.max(10, Number((pEut - (sAfter - sBefore)).toFixed(2)));
                  let finalVal = indicador === 'desnutricao' ? scaleDes : indicador === 'obesidade' ? scaleObs : indicador === 'sobrepeso' ? scaleSob : scaleEut;
                  const badge = getRiskBadge(finalVal, indicador);

                  return (
                    <button
                      key={s.nome}
                      onClick={() => isSelected ? setSelection('bairro', parentUbs || null, s.bairro || null, null) : setSelection('escola', parentUbs || null, s.bairro || null, s.nome)}
                      className={\`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center gap-3 \${
                        isSelected
                          ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50 shadow-sm'
                          : 'bg-white dark:bg-zinc-900/30 border-slate-100 dark:border-zinc-800/65 hover:border-slate-200 dark:hover:border-zinc-700/60 hover:shadow-sm'
                      }\`}
                    >
                      <div className={\`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 \${
                        isSelected ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-550'
                      }\`}>
                        <School className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5 mb-0.5">
                          <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 truncate">{s.nome}</p>
                          <span className={\`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border \${badge.bg} shrink-0\`}>{badge.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-450 dark:text-zinc-550">
                          <span>{mainLabel}: <strong className="text-slate-655 dark:text-zinc-300">{finalVal.toFixed(1)}%</strong></span>
                          <span className="truncate max-w-[120px]">{parentUbs.replace(/^(UBS|USF)\\s/, '')}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {filteredSchools.length === 0 && <p className="p-8 text-center text-xs text-slate-400 dark:text-zinc-650 italic">Nenhuma escola encontrada.</p>}
              </div>
            </div>
          )}
        </div>
      </div>`;

content = content.substring(0, listStartIndex) + newListContent + content.substring(listEndIndex);

// Write back
fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ ConsultantView.tsx successfully updated with beautiful dossiers, search navigations, and click suggestions!');
