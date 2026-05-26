const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'ConsultantView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Exact replacement for getRiskBadge function
const originalFunc = `function getRiskBadge(value: number, indicator: string) {
  if (indicator === 'eutrofia') {
    if (value >= 68.0) return { label: 'Peso Saudável', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value >= 55.0) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Desvio Crítico', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  }
  if (indicator === 'desnutricao') {
    if (value < 2.0) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 3.2) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 18) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  } else {
    if (value < 8) return { label: 'Risco Baixo', bg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50' };
    if (value < 13.5) return { label: 'Risco Médio', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Risco Alto', bg: 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900/50' };
  }
}`;

const replacementFunc = `function getRiskBadge(value: number, indicator: string) {
  if (indicator === 'eutrofia') {
    if (value >= 68.0) return { label: 'Peso Saudável', bg: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' };
    if (value >= 55.0) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Acompanhamento Prioritário', bg: 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50' };
  }
  if (indicator === 'desnutricao') {
    if (value < 2.0) return { label: 'Monitoramento Geral', bg: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' };
    if (value < 3.2) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Acompanhamento Prioritário', bg: 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50' };
  } else if (indicator === 'sobrepeso') {
    if (value < 12) return { label: 'Monitoramento Geral', bg: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' };
    if (value < 18) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Acompanhamento Prioritário', bg: 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50' };
  } else {
    if (value < 8) return { label: 'Monitoramento Geral', bg: 'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50' };
    if (value < 13.5) return { label: 'Atenção Preventiva', bg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' };
    return { label: 'Acompanhamento Prioritário', bg: 'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50' };
  }
}`;

const norm = (str) => str.replace(/\r\n/g, '\n').trim();

if (norm(content).includes(norm(originalFunc))) {
  let normContent = content.replace(/\r\n/g, '\n');
  normContent = normContent.replace(originalFunc.replace(/\r\n/g, '\n'), replacementFunc);
  fs.writeFileSync(filePath, normContent, 'utf8');
  console.log('✅ ConsultantView.tsx successfully patched with Teal and Rose colors (normalized).');
} else {
  console.log('❌ Exact match not found, applying regex patches instead...');
  content = content.replace(/label:\s*'Desvio Crítico'/g, "label: 'Acompanhamento Prioritário'");
  content = content.replace(/label:\s*'Risco Alto'/g, "label: 'Acompanhamento Prioritário'");
  content = content.replace(/label:\s*'Risco Baixo'/g, "label: 'Monitoramento Geral'");
  content = content.replace(/label:\s*'Risco Médio'/g, "label: 'Atenção Preventiva'");
  
  // Replace emerald styles
  content = content.replace(/bg-emerald-50 dark:bg-emerald-950\/30 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900\/50/g, "bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 border-teal-100 dark:border-teal-900/50");
  
  // Replace red styles
  content = content.replace(/bg-red-50 dark:bg-red-950\/30 text-red-700 dark:text-red-400 border-red-100 dark:border-red-900\/50/g, "bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ ConsultantView.tsx successfully regex-patched.');
}
