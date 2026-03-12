# Protector Design System v1.0

> Identidade visual unificada para todos os apps da familia **Protector Sistemas** (appps.com.br).
> Referencia principal: [protector-lombada.vercel.app](https://protector-lombada.vercel.app)

---

## 1. Paleta de Cores

### Primarias
| Token | Hex | Uso |
|-------|-----|-----|
| `--azul` | `#045cb4` | Hover de botoes primarios, links ativos |
| `--azul2` | `#046BD2` | **Cor principal** — botoes, headers, icones, badges |
| `--azulD` | `#033d7a` | Textos enfatizados, gradientes escuros |

### Semanticas
| Token | Hex | Uso |
|-------|-----|-----|
| `--verde` | `#22C55E` | Sucesso, status ativo, badges verdes |
| `--vermelho` | `#EF4444` | Erro, alerta critico, status expirado |
| `--laranja` | `#F39C12` | Warning, destaque, trial |
| `--roxo` | `#8B5CF6` | Secundario, clientes, categorias |

### Neutras
| Token | Hex | Uso |
|-------|-----|-----|
| `--branco` | `#FFFFFF` | Background de cards, headers, surfaces |
| `--cinzaL` | `#F0F5FA` | Background geral da pagina |
| `--cinzaM` | `#E2E8F0` | Bordas de cards, divisores, inputs |
| `--cinza` | `#5D6D7E` | Textos secundarios |
| `--surface` | `#1E293B` | Texto principal body |

### Sombras
```css
--shadow-xs: 0 1px 2px rgba(0,0,0,.05);
--shadow-sm: 0 1px 3px rgba(0,0,0,.08), 0 2px 8px rgba(0,0,0,.04);
--shadow-md: 0 4px 12px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
--shadow-lg: 0 8px 24px rgba(0,0,0,.12), 0 4px 8px rgba(0,0,0,.06);
--shadow-xl: 0 12px 40px rgba(0,0,0,.15), 0 8px 16px rgba(0,0,0,.08);
```

---

## 2. Tipografia

**Font family:** `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`

Carregar via Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
```

### Escala
| Token | Size | Weight | Uso |
|-------|------|--------|-----|
| `--fs-xs` | 11px | 400-600 | Badges, labels pequenos |
| `--fs-sm` | 13px | 400-600 | Subtitulos, descricoes |
| `--fs-base` | 15px | 400 | Texto corrido |
| `--fs-md` | 16px | 600 | Subtitulos de secao |
| `--fs-lg` | 18px | 700 | Titulos de card |
| `--fs-xl` | 22px | 800 | Titulos de pagina |
| Hero | 28px | 800 | H1 principal do dashboard |

---

## 3. Componentes Padrao

### Header / Topbar
```css
.header {
  height: 54px;
  background: #FFFFFF;
  border-bottom: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  display: flex;
  align-items: center;
  padding: 0 18px;
  gap: 14px;
}
.header .logo {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #046BD2;
}
```

### Card
```css
.card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: box-shadow .2s, transform .2s;
}
.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.08);
  transform: translateY(-2px);
}
```

### Stat Card
```css
.stat-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.stat-card .value {
  font-size: 28px;
  font-weight: 800;
  color: #046BD2; /* ou cor semantica */
  line-height: 1.1;
}
.stat-card .label {
  font-size: 12px;
  color: #64748B;
}
```

### Botao Primario
```css
.btn-primary {
  background: #046BD2;
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: .15s;
}
.btn-primary:hover {
  background: #045cb4;
  filter: brightness(1.1);
}
```

### Botao Secundario
```css
.btn-secondary {
  background: transparent;
  color: #64748B;
  border: 1px solid #E2E8F0;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: .15s;
}
.btn-secondary:hover {
  background: #F0F5FA;
  color: #046BD2;
  border-color: #046BD2;
}
```

### Badge / Tag
```css
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  /* Verde: */ background: rgba(34,197,94,.1); color: #22C55E;
  /* Vermelho: */ background: rgba(239,68,68,.1); color: #EF4444;
  /* Azul: */ background: rgba(4,107,210,.08); color: #046BD2;
  /* Laranja: */ background: rgba(245,158,11,.1); color: #F59E0B;
}
```

### Input / Search
```css
.input {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  color: #1E293B;
  outline: none;
  transition: .2s;
}
.input:focus {
  border-color: #046BD2;
  box-shadow: 0 0 0 3px rgba(4,107,210,.1);
}
```

---

## 4. Layout

### Background da pagina
`background: #F0F5FA` (cinza azulado muito claro)

### Container principal
```css
.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
```

### Grid de cards
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
```

### Spacing tokens
| Token | Value |
|-------|-------|
| `--sp-1` | 4px |
| `--sp-2` | 8px |
| `--sp-3` | 12px |
| `--sp-4` | 16px |
| `--sp-6` | 24px |
| `--sp-8` | 32px |

---

## 5. Icones

**Biblioteca:** [Lucide React](https://lucide.dev) — tree-shakeable, consistente, stroke-width 1.8-2.0

```jsx
import { Folder, Users, Settings, Plus } from 'lucide-react';
<Folder size={22} color="#046bd2" strokeWidth={2} />
```

Icones de acao usam `strokeWidth={2.5}`. Icones decorativos usam `strokeWidth={1.8}`.

---

## 6. Animacoes

```css
@keyframes fadeIn   { from { opacity:0 }              to { opacity:1 } }
@keyframes slideUp  { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
@keyframes scaleIn  { from { opacity:0; transform:scale(.95) }       to { opacity:1; transform:scale(1) } }
```

Usar `.anim-fade`, `.anim-slide-up`, `.anim-scale` nas classes.

Cards e modais: `transition: box-shadow .2s, transform .2s;`

---

## 7. Meta / PWA

```html
<meta name="theme-color" content="#046BD2" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

Favicon: quadrado azul `#046BD2` com letra P branca.

---

## 8. Prompt Template para Novos Apps

Use este prompt ao solicitar um novo app Protector a uma IA:

```
Crie um app web React (Vite) chamado "Protector [NOME DO MODULO]" seguindo
o design system Protector Sistemas:

IDENTIDADE VISUAL:
- Font: Inter (Google Fonts) — weights 400, 500, 600, 700, 800
- Cor principal: #046BD2 (azul Protector)
- Cor hover: #045cb4
- Background geral: #F0F5FA (cinza azulado claro)
- Cards: fundo branco, border 1px #E2E8F0, border-radius 12px, shadow sutil
- Header: fundo branco, border-bottom 1px #E2E8F0, logo azul, altura 54px
- Botao primario: bg #046BD2, texto branco, radius 6px, font-weight 700
- Botao secundario: border #E2E8F0, texto #64748B, hover azul
- Status: verde #22C55E, vermelho #EF4444, laranja #F59E0B
- Icones: Lucide React (strokeWidth 1.8-2.0)
- Animacoes: fadeIn, slideUp nos cards ao carregar

CSS VARIABLES (copiar no :root):
--azul: #045cb4;
--azul2: #046BD2;
--azulD: #033d7a;
--cinzaL: #F0F5FA;
--cinzaM: #E2E8F0;
--branco: #FFF;
--radius: 6px;
--radius-lg: 12px;
--sombra: 0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);

PADRAO DE CODIGO:
- React funcional com hooks
- CSS em arquivo globals.css (sem CSS-in-JS)
- Componentes em src/components/
- Mobile-first, breakpoints: 640px, 768px, 1024px
- Deploy: Vercel (auto-deploy de GitHub main)

FUNCIONALIDADE: [descreva aqui o que o app deve fazer]
```

---

## 9. Apps da Familia Protector

| App | URL | Descricao |
|-----|-----|-----------|
| Protector Lombada | protector-lombada.vercel.app | Controle de trafego |
| Protector BIM | bim-seguranca-eletronica.vercel.app | Projetos de seguranca eletronica |
| *(novos apps aqui)* | | |

---

**Mantido por:** Protector Sistemas (appps.com.br)
**Versao:** 1.0 — Março 2026
