const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'DataEntrySection.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replacements for Emerald -> Teal
content = content.replace(/bg-emerald-950\/30/g, 'bg-teal-950/30');
content = content.replace(/bg-emerald-50\/80/g, 'bg-teal-50/80');
content = content.replace(/border-emerald-200\/60/g, 'border-teal-200/60');
content = content.replace(/text-emerald-800/g, 'text-teal-800');
content = content.replace(/bg-emerald-955\/20/g, 'bg-teal-950/20');
content = content.replace(/border-teal-900\/30/g, 'border-teal-900/30'); // Keep or adjust
content = content.replace(/text-emerald-600/g, 'text-teal-600');
content = content.replace(/text-emerald-400/g, 'text-teal-400');
content = content.replace(/text-emerald-700/g, 'text-teal-700');
content = content.replace(/text-emerald-450/g, 'text-teal-450');
content = content.replace(/border-emerald-200\/50/g, 'border-teal-200/50');
content = content.replace(/bg-emerald-50/g, 'bg-teal-50');
content = content.replace(/bg-emerald-500/g, 'bg-teal-500');
content = content.replace(/text-emerald-500/g, 'text-teal-500');
content = content.replace(/bg-emerald-950\/15/g, 'bg-teal-950/15');
content = content.replace(/border-emerald-300\/50/g, 'border-teal-300/50');
content = content.replace(/border-emerald-800\/50/g, 'border-teal-800/50');

// Replacements for Red/Emerald specific triage classes
content = content.replace(/'bg-red-50 dark:bg-red-950\/30 text-red-700 dark:text-red-450 border border-red-200\/50'/g, "'bg-rose-50 dark:bg-rose-955/20 text-rose-700 dark:text-rose-455 border border-rose-200/50'");
content = content.replace(/'bg-emerald-50 dark:bg-emerald-950\/30 text-emerald-700 dark:text-emerald-450 border border-emerald-200\/50'/g, "'bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-450 border border-teal-200/50'");

// Replacements for Red -> Rose
content = content.replace(/bg-red-500/g, 'bg-rose-500');
content = content.replace(/bg-red-400\/25/g, 'bg-rose-400/25');
content = content.replace(/dark:bg-red-500\/10/g, 'dark:bg-rose-500/10');
content = content.replace(/text-red-600/g, 'text-rose-600');
content = content.replace(/text-red-400/g, 'text-rose-455');
content = content.replace(/text-red-700/g, 'text-rose-700');
content = content.replace(/bg-red-50/g, 'bg-rose-50');
content = content.replace(/bg-red-950\/30/g, 'bg-rose-955/20');
content = content.replace(/border-red-200\/50/g, 'border-rose-200/50');
content = content.replace(/text-red-450/g, 'text-rose-455');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ DataEntrySection.tsx successfully patched with Teal and Rose colors.');
