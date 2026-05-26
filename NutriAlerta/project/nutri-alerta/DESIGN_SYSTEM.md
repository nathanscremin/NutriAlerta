# 🎨 CSS Variables & Design System - Quick Reference

## 📦 Spacing System

```css
--spacing-xs: 0.25rem;   /* 4px */
--spacing-sm: 0.5rem;    /* 8px */
--spacing-md: 1rem;      /* 16px */
--spacing-lg: 1.5rem;    /* 24px */
--spacing-xl: 2rem;      /* 32px */
--spacing-2xl: 2.5rem;   /* 40px */
--spacing-3xl: 3rem;     /* 48px */
```

**Uso em Tailwind**:
- `px-6` = 24px horizontal
- `px-8` = 32px horizontal
- `py-5` = 20px vertical
- `gap-3` = 12px gap
- `gap-4` = 16px gap

---

## 🎯 Border Radius System

```css
--radius-sm: 6px;    /* Pequenos elementos */
--radius-md: 10px;   /* Inputs, small cards */
--radius-lg: 12px;   /* Buttons, cards */
--radius-xl: 16px;   /* Large cards, modals */
```

**Mapeamento Tailwind**:
- `rounded-lg` = --radius-md (10px)
- `rounded-xl` = --radius-lg (12px)

---

## 💫 Shadow System

```css
/* Subtle, natural shadows */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.01);
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.01);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.01);
```

**Uso**:
- Cards padrão: `shadow-sm`
- Hover de cards: `shadow-md hover:-translate-y-0.5`
- Tooltips: `shadow-md`
- Sem sombra: remova a classe

---

## 🎨 Color Palette

### Light Mode
```
Background:     #fafbfc
Card:           #ffffff
Text Primary:   #0c0e11
Text Secondary: #6b7280
Text Muted:     #9ca3af

Borders:        #e4e6eb (use com /50 para sutil)
Accent:         #0d9488 (Teal)
```

### Dark Mode
```
Background:     #0f1117
Card:           #1c1f26
Text Primary:   #f8f9fb
Text Secondary: #8b949e
Text Muted:     #6e7681

Borders:        #30363d (use com /50 para sutil)
Accent:         #0d9488 (Teal)
```

### Semantic Colors
```
Success:  emerald-500 / emerald-600
Warning:  amber-500 / amber-600
Error:    red-500 / red-600
Info:     blue-500 / blue-600
```

---

## ✍️ Typography System

### Font Stack
```css
--font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", sans-serif;
--font-mono: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace;
```

### Scale
```
h1:  text-2xl, font-bold,     line-height 1.2
h2:  text-xl,  font-bold,     line-height 1.2
h3:  text-lg,  font-semibold, line-height 1.2

Body:     text-base (15px), font-normal, line-height 1.5
Small:    text-sm (14px),   font-medium
Tiny:     text-xs (12px),   font-medium
```

### Line Heights
```css
--line-height-tight:   1.2    /* Titles */
--line-height-normal:  1.5    /* Body text */
--line-height-relaxed: 1.65   /* Long form */
```

### Letter Spacing
```css
--letter-spacing-tight:  -0.01em
--letter-spacing-normal:  0
--letter-spacing-wide:    0.025em
```

---

## 🎬 Animations & Transitions

### Transition Default
```css
transition: all duration-300 ease-in-out;
```

### States
```
Hover:   duration-200
Focus:   duration-200
Active:  scale-95, immediate
```

### Custom Animations
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 🧩 Utility Classes Personalizadas

### Card Base
```tsx
className="bg-card dark:bg-slate-950 border border-card-border dark:border-zinc-800 rounded-xl transition-all duration-300 shadow-sm"
```

### Card Hover
```tsx
className="hover:border-card-hover dark:hover:border-zinc-700 hover:shadow-md hover:-translate-y-0.5"
```

### Button Base
```tsx
className="inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50"
```

### Button Primary
```tsx
className="button-base bg-accent text-white hover:bg-accent/90"
```

### Button Secondary
```tsx
className="button-base bg-slate-100 dark:bg-zinc-800 text-foreground hover:bg-slate-200 dark:hover:bg-zinc-700"
```

### Text Gradient
```tsx
className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-zinc-300 bg-clip-text text-transparent"
```

---

## 📱 Responsive Breakpoints

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

**Padrão de Uso**:
```tsx
{/* Mobile first */}
className="flex flex-col md:flex-row gap-4 md:gap-6"

{/* Stack vertically on mobile, horizontally on tablet+ */}
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
```

---

## 🎯 Component Patterns

### Standard Card
```tsx
<div className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 shadow-sm transition-all duration-300">
  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Title</h3>
  {/* Content */}
</div>
```

### Interactive Card
```tsx
<div className="group bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
  {/* Content */}
</div>
```

### Icon with Label
```tsx
<div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
    <Icon className="w-4 h-4" />
  </div>
  <div>
    <p className="text-sm font-semibold text-slate-900 dark:text-white">Title</p>
    <p className="text-xs text-slate-500 dark:text-zinc-400">Description</p>
  </div>
</div>
```

### Form Input
```tsx
<input 
  className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
  placeholder="Placeholder text"
/>
```

### Badge
```tsx
<span className="px-2.5 py-1 bg-accent/10 dark:bg-accent/20 text-accent dark:text-accent border border-accent/20 dark:border-accent/30 rounded-md text-xs font-semibold">
  Badge
</span>
```

---

## 🔍 Dark Mode Implementation

### Classe dark aplicada no root
```tsx
// In page.tsx or layout.tsx
if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}
```

### Padrão de cor com dark:
```tsx
{/* Light mode classes, then dark: prefix for dark mode */}
className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
```

---

## ⚡ Performance Tips

1. **Avoid excessive shadows**: Use `shadow-sm` por padrão
2. **Simplify borders**: Use `/50` opacity em vez de múltiplas colors
3. **Batch transitions**: `transition-all duration-200` é suficiente
4. **Limit font sizes**: Usar escala definida (não custom sizes)
5. **Group state styles**: Usar `group` e `group-hover` para elementos pai/filho

---

## 📊 Before & After Comparison

### Before
```tsx
className="bg-white/80 dark:bg-[#0c0d10]/95 backdrop-blur-xl border-slate-200/80 dark:border-[#1f2229]/65 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
```

### After
```tsx
className="bg-white dark:bg-slate-950 border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 shadow-sm"
```

**Benefícios**:
- ✅ Mais limpo e legível
- ✅ Mais fácil de manter
- ✅ Confiável com variáveis CSS
- ✅ Melhor performance
- ✅ Consistência visual

---

## 🧪 Testing Checklist

- [ ] Light mode looks good
- [ ] Dark mode looks good
- [ ] Hover states work smoothly
- [ ] Focus states visible
- [ ] Mobile responsive
- [ ] Shadows are subtle (not heavy)
- [ ] Text contrast WCAG AA
- [ ] Animations smooth (no jank)
- [ ] Load time not affected

---

## 📞 Quick Copy-Paste Templates

### Full Page Container
```tsx
<main className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-8">
  <div className="max-w-6xl mx-auto space-y-6">
    {/* Content */}
  </div>
</main>
```

### Modal/Dialog
```tsx
<div className="fixed inset-0 bg-black/50 flex items-center justify-center">
  <div className="bg-white dark:bg-slate-950 rounded-xl p-8 shadow-lg max-w-lg w-full mx-4">
    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Title</h2>
    {/* Content */}
  </div>
</div>
```

### Tabs
```tsx
<div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 gap-1 border border-slate-200 dark:border-zinc-800">
  {[...].map(tab => (
    <button 
      key={tab.id}
      className={`px-4 py-2 rounded-md font-semibold text-sm transition-all ${
        active 
          ? 'bg-white dark:bg-slate-950 text-accent' 
          : 'text-slate-600 dark:text-zinc-400'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

---

✨ **Design System Completo e Pronto para Uso!**

