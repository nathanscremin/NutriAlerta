# NutriAlerta — Plano de Auditoria Geral

Compilado a partir de 4 auditores paralelos cobrindo 20+ arquivos do projeto. Organizado por prioridade de impacto.

---

## 🔴 CRÍTICO — Segurança (Resolver ANTES de qualquer deploy público)

> [!CAUTION]
> Esses itens representam vazamento de credenciais e falhas de compliance LGPD.

### SEC-1 — Credenciais hardcoded no código-fonte
**Arquivos:** `data/route.ts`, `pacientes/route.ts`, `login/page.tsx`

Três arquivos expõem credenciais reais em texto plano commitadas no repositório:
- **Email e senha do admin** (`nutrialerta@gmail.com` / `#Pangam123@`) aparecem em `data/route.ts` (linha 24), `pacientes/route.ts` (linha 21) e **no bundle do cliente** em `login/page.tsx` (linha 54–81).
- **URL e chave pública do Supabase** com fallback hardcoded em vez de exigir as env vars.
- O bloco de "auto-signup de superadmin" em `login/page.tsx` é um **vetor de escalonamento de privilégio**: qualquer um que descobrir as credenciais pode se registrar como admin.

**Ação:** Remover todos os fallbacks hardcoded. Mover para `.env.local` exclusivamente. Deletar o bloco de auto-signup em `login/page.tsx`.

---

### SEC-2 — Chave AES-256 e SALT de HMAC hardcoded
**Arquivo:** `pacientes/route.ts` (linhas 34–35)

```ts
const SECRET_KEY = process.env.ENCRYPTION_KEY || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';
const SALT = process.env.HASH_SALT || 'nutrialerta-security-salt-2026';
```

Se as variáveis de ambiente não estiverem configuradas, os dados de pacientes menores de idade são criptografados com uma chave conhecida e commitada — **falha direta de compliance LGPD** para dados sensíveis de crianças.

**Ação:** Remover ambos os fallbacks. Se as env vars não existirem, a rota deve lançar um erro explícito em vez de usar valores inseguros.

---

## 🔴 BUGS — Funcionamento incorreto atual

### BUG-1 — Typo `node:` em vez de `nome:` no mockData.ts
**Arquivo:** `src/lib/mockData.ts` linha 4

```ts
{ id: 3, node: 'Escola Estadual Norte', ... }  // ← deveria ser nome:
```

`MOCK_ESCOLAS[2].nome` retorna `undefined`. Qualquer componente que renderize o nome dessa escola mostra `undefined`.

---

### BUG-2 — Inconsistência no strip do marcador `★` (vs `' ★'`)
**Arquivos:** `ExpertView.tsx` (linha 107), `Sidebar.tsx` (linha 118–119), `RiskMap.tsx`

ExpertView usa `.replace('★', '')` mas Sidebar usa `.replace(' ★', '')` (com espaço). Dependendo do formato real da string do ano armazenado no store, um dos dois sempre falha ao limpar o marcador, levando a buscas com o `★` no key — que nunca encontram dados e retornam fallback silenciosamente.

**Ação:** Criar uma constante compartilhada `const FORECAST_MARKER = ' ★'` em `lib/constants.ts` e usar `.trim().replace(FORECAST_MARKER, '').trim()` em todos os lugares.

---

### BUG-3 — Classes Tailwind inválidas (sem efeito visual silencioso)
**Arquivos:** `ExpertView.tsx`, `Sidebar.tsx`, `RiskMap.tsx`

~35+ ocorrências de classes usando escalas de cor inexistentes no Tailwind (50–950 é o range válido):
- `text-rose-455`, `bg-rose-955/20`, `text-rose-550`, `text-sky-655`
- `bg-sky-955/20`, `bg-teal-955/20`, `bg-amber-955/20`, `bg-blue-955/20`
- `dark:text-zinc-555`, `dark:text-zinc-650`, `text-slate-450`, `text-slate-550`
- `text-teal-650`, `text-teal-350`, `dark:border-zinc-800/45`

Essas classes silenciosamente não aplicam nenhum estilo. O componente pode parecer funcionar, mas cores e contrastes estão incorretos em dark mode.

**Ação:** Substituir todas por equivalentes válidos (ex: `rose-500`→`rose-500`, `zinc-555`→`zinc-500` ou `zinc-600`).

---

### BUG-4 — Classes Tailwind em strings HTML do GeoJSON (nunca aplicadas)
**Arquivo:** `RiskMap.tsx` (função `onEachFeature`, linhas 346–420)

O código injeta `className="text-slate-700"` etc. dentro de template literals que geram HTML bruto para tooltips do Leaflet. **O Tailwind não escaneia strings de runtime** — essas classes não existem no bundle CSS. Os tooltips do GeoJSON não têm estilo algum.

**Ação:** Substituir as classes Tailwind por estilos inline (`style="color: #334155"`) dentro desses template literals.

---

### BUG-5 — `safeNumber` definida duas vezes no mesmo arquivo
**Arquivo:** `RiskMap.tsx` (linha 213 e linha 228)

A definição interna dentro de `getBairroMetrics` **shadeia** a definição de módulo. Pode causar comportamento inesperado se a assinatura diferir. Remover a duplicata interna.

---

### BUG-6 — CNES `2055902` atribuído a duas UBSs distintas
**Arquivo:** `data/route.ts` (linhas 43 e 49, objeto `UBS_CNES`)

Dois nomes diferentes de UBS mapeados para o mesmo código CNES `"2055902"`. Qualquer agrupamento por CNES vai mesclar dados das duas UBSs incorretamente.

---

### BUG-7 — `cnes_ubs` comparado contra nome de UBS (nunca encontra resultados)
**Arquivo:** `pacientes/route.ts` (linha 327)

```ts
const regionalPois = extractedPois.filter((p: any) => p.regiao_ubs === cnes_ubs);
```

`cnes_ubs` é um código numérico CNES, mas `regiao_ubs` no JSON são nomes textuais. A comparação sempre retorna 0 resultados — todos os pacientes novos são silenciosamente atribuídos ao primeiro school do banco.

---

### BUG-8 — `resetForm` em DataEntrySection não reseta todos os campos
**Arquivo:** `DataEntrySection.tsx`

Após submissão bem-sucedida, os seguintes campos **não são resetados**:
- `idade`, `genero`, `ubsOrigem` — próximo paciente herda os valores do anterior
- `consentCheck`, `clinicaCheck`, `sigiloCheck`, `noloopCheck` — os 4 checkboxes de consentimento ficam marcados para o próximo paciente

---

### BUG-9 — ConsultantView não faz auto-scroll no chat
**Arquivo:** `ConsultantView.tsx`

`bottomRef` existe e está no DOM (linha 574), mas **não há `useEffect` que chame `scrollIntoView()`**. O chat não scrolla para a última mensagem. `ChatbotWidget.tsx` tem a implementação correta — copiar o padrão.

---

### BUG-10 — Lógica de sync parcial offline incorreta
**Arquivo:** `DataEntrySection.tsx` (linhas 245–253)

Se o item 2 falha mas o item 3 sucede no sync parcial, a lógica `pending.slice(syncCount)` descarta o item 3 (que sucedeu) e mantém o 2 (que falhou). Itens falhos devem ser rastreados individualmente.

---

## 🟠 ALTO — Código duplicado e manutenção

### DUP-1 — `getSeverityLevel()` duplicada entre ExpertView e RiskMap
**Arquivos:** `ExpertView.tsx` (linhas 461–488), `RiskMap.tsx` (linhas 71–98)

100% idêntica. Qualquer correção nos thresholds deve ser feita nos dois lugares.

**Ação:** Extrair para `src/lib/nutritionUtils.ts`.

---

### DUP-2 — `hudMetrics` useMemo (~60 linhas) duplicado em ExpertView e Sidebar
**Arquivos:** `ExpertView.tsx` (linhas 233–294), `Sidebar.tsx` (linhas 148–209)

Ambos os componentes estão montados simultaneamente e recalculam os mesmos valores independentemente.

**Ação:** Extrair para `src/hooks/useHudMetrics.ts`.

---

### DUP-3 — `ubsList`/`uniqueBairrosList`/`schoolsList` useMemos em 3+ componentes
**Arquivos:** `ExpertView.tsx`, `Sidebar.tsx`, `ConsultantView.tsx`, `DemographicsSection.tsx`

As mesmas derivações de listas estáticas (UNIDADES_SAUDE, ALL_POIS, etc.) são recalculadas em cada componente montado. Como os dados nunca mudam em runtime, essas listas deveriam ser constantes de módulo em `mockData.ts` ou derivadas uma vez no store.

---

### DUP-4 — `getAdminSupabaseClient()` duplicada entre as rotas
**Arquivos:** `data/route.ts` (linhas 12–33), `pacientes/route.ts` (linhas 9–30)

Função idêntica copiada. Extrair para `src/lib/supabaseAdmin.ts`.

---

### DUP-5 — `activeTemporalData` reimplementado em ConsultantView
**Arquivo:** `ConsultantView.tsx` (linhas 191–267)

~80 linhas de lógica de fallback que já existem em `buildScopedTemporalSeries()` de `metricSelectors.ts` — exatamente o que ExpertView usa.

**Ação:** Substituir pela chamada à função compartilhada.

---

### DUP-6 — Tile URLs do CartoCDN duplicadas em RiskMap e ConflictMap
**Ação:** Extrair para `src/lib/mapConfig.ts` com constantes `TILE_URL_DARK` e `TILE_URL_LIGHT`.

---

### DUP-7 — `KpiCard`/`MetricRow` implementados 3 vezes em 3 arquivos
`ExpertView.tsx`, `UrbanConflictSection.tsx`, `Sidebar.tsx` cada um tem sua variante. Unificar em um componente `<StatCard>` em `src/components/ui/`.

---

### DUP-8 — Bloco CSS de tooltip duplicado entre RiskMap e ConflictMap
O `.custom-glass-tooltip` está copiado, com variações (`border-radius: 4px` vs `8px`). Mover para `globals.css`.

---

## 🟡 MÉDIO — Código morto e valores inconsistentes

### DEAD-1 — Exports mortos em `mockData.ts`
Verificado via grep — **zero consumidores**:
- `MOCK_TEMPORAL` (deprecado, sem importadores)
- `PROPORCAO_INFRAESTRUTURA` (UrbanConflictSection calcula inline)
- `getVirtualAnchor` (comentário diz "removido por obsolescência", retorna inputs sem transformar)
- `MOCK_DISTRIBUICAO` (4 categorias inconsistentes com o gráfico de 5 categorias, não importado em lugar algum)

---

### DEAD-2 — Funções/vars mortas em ConsultantView
- `normalizeQuotes()` — definida, nunca chamada
- `filteredSearchSuggestions` — calculado em useMemo, nunca usado no JSX
- `activePoiTypes` — desestruturado do store, nunca usado

---

### DEAD-3 — Imports não utilizados
| Arquivo | Import |
|---------|--------|
| `ExpertView.tsx` | `Sparkles`, `Calendar`, `ShieldCheck`, `BarChart`, `Bar` |
| `Sidebar.tsx` | `Bot` |
| `Header.tsx` | `Menu` |
| `DemographicsSection.tsx` | `demographicData` (do store) |

---

### VAL-1 — `DEFAULT_METRICS` com valores inconsistentes e `magreza: 0`
**Arquivo:** `src/lib/metricSelectors.ts`

```ts
sobrepeso: 15.2,   // ← dado de 2018; real 2025 é 21.0
magreza: 0,        // ← epidemiologicamente incorreto
```

Quando a API falha, o fallback mostra dados de 2018 para sobrepeso e zera magreza.

---

### VAL-2 — `console.log` de debug em produção
**Arquivos:** `chat/route.ts` (3 logs, incluindo dump completo do screenData), `data/route.ts` (4 logs), `pacientes/route.ts` (4 logs)

---

### VAL-3 — `exec` Python sem verificação de existência do arquivo
**Arquivos:** `data/route.ts`, `pacientes/route.ts`

O script Python é chamado sem checar se o arquivo existe, e o path hardcoded não funciona em Vercel/Docker. O processo lento ou travado polui os logs de produção silenciosamente.

---

### PERF-1 — Computações pesadas fora de useMemo em ExpertView
- `candidateIndicators` array (linha 410–459) — recriado a cada render
- `dynamicRanking` (linhas 592–616) — itera/ordena sem memoização
- `visiblePois` em RiskMap — filtra ALL_POIS a cada render sem useMemo

---

## 🟢 BAIXO — Melhorias e limpeza

### UI-1 — Coordenadas do mapa diferem entre RiskMap e ConflictMap
`RiskMap`: `[-22.405, -47.555]` vs `ConflictMap`: `[-22.405, -47.565]` — diferença de 0.010° de longitude. Criar constante `RIO_CLARO_CENTER` compartilhada para deixar a diferença explícita se intencional.

### UI-2 — Logo no Header sem `onClick` — parece clicável mas não faz nada
O `<motion.div>` tem `whileHover` e `whileTap` mas sem handler de navegação.

### UI-3 — ChatbotWidget mostra "Online" hardcoded mesmo durante erros
Sem verificação real de conectividade.

### UI-4 — Age dropdown começa em 0 no DataEntrySection
IMC para idade 0 é inválido — dropdown deve começar em 1.

### UI-5 — Sem timeout na tela de loading do `page.tsx`
Se o Supabase travar, o spinner fica infinito. Adicionar timeout de ~5s com mensagem de erro.

### SEO-1 — Metadata incompleta em `layout.tsx`
Faltam: `openGraph`, `twitter`, `metadataBase`, `viewport` export.

### PKG-1 — Problemas no `package.json`
- `"lint": "eslint"` — sem target, não faz nada
- `@types/leaflet` em `dependencies` em vez de `devDependencies`
- `lucide-react: "^1.14.0"` — versão suspeita (latest real é ~0.4xx)
- Sem `"type-check": "tsc --noEmit"`

### CLEAN-1 — Arquivos de debug e scripts na raiz do projeto
`debug_tooltips.js`, `debug_tooltips_2.js`, `debug_tooltips_3.js`, `fix_extraction.js`, `generate_voronoi.js` — mover para `scripts/` ou adicionar ao `.gitignore`.

### CLEAN-2 — Excesso de arquivos .md na raiz
`COMPLETION_CHECKLIST.md`, `DESIGN_SYSTEM.md`, `DOCUMENTATION_MAP.md`, `QUICK_START.md`, `README_REFACTORING.md`, `REFACTORING_EXECUTIVE_SUMMARY.md`, `REFACTORING_SUMMARY.md`, `UI_UX_REFACTOR_GUIDE.md`, `VALIDATION_GUIDE.md`, `VISUAL_SUMMARY.md` — 10 arquivos de documentação de refatoração desatualizada. Consolidar em `docs/` ou deletar.

### CLEAN-3 — Stray comment em ConsultantView
Linha 8: `// commit no vercel` — remover.

### CLEAN-4 — `keyword 'lanchonete'` duplicada em `classifyFoodCategory`
`src/lib/mockData.ts` — palavra-chave repetida duas vezes no array `fastFoodKeywords`.

---

## Open Questions

> [!IMPORTANT]
> Itens que precisam da sua decisão antes de implementar:

1. **SEC-1/SEC-2**: As credenciais em `.env.local` estão configuradas corretamente no ambiente de produção atual? O fallback pode ser simplesmente removido sem quebrar o deploy?

2. **DUP-3 (listas de UBS/Bairro/Escola)**: Prefere mover para o Zustand store ou para constantes de módulo em `mockData.ts`? A questão é se essas listas devem ser reativas ao store ou são puramente estáticas.

3. **PERF (GeoJSON remounting)**: O flickering do mapa no RiskMap quando estado muda é um problema visível para você? A correção via `useCallback` no `getFeatureStyle` é moderadamente complexa.

4. **IMC Thresholds**: O DataEntrySection usa thresholds fixos (não z-scores da OMS). Isso é uma limitação conhecida do sistema ou deve ser corrigido com as curvas corretas?

5. **Python ML Script**: O script é usado em produção ou apenas localmente? Se for apenas local, podemos remover a chamada de produção e deixar apenas na rota de dev.

6. **Documentação .md na raiz**: Pode deletar tudo ou deve manter alguma delas?

---

## Resumo por Esforço

| Categoria | Itens | Esforço |
|-----------|-------|---------|
| 🔴 Segurança (SEC) | 2 itens | Baixo (remoção de strings) |
| 🔴 Bugs críticos (BUG) | 10 itens | Médio |
| 🟠 Código duplicado (DUP) | 8 itens | Alto (refatoração) |
| 🟡 Código morto (DEAD/VAL) | 8 itens | Baixo (deleção) |
| 🟡 Performance (PERF) | 3 itens | Médio |
| 🟢 UI/UX/SEO/Limpeza | 14 itens | Baixo-Médio |
