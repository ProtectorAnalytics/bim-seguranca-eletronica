# BIM Segurança Eletrônica — Protector Sistemas

## Projeto
App SaaS de projetos de segurança eletrônica (BIM 2D). Permite projetar plantas com câmeras, sensores, racks, cabeamento e topologia de rede. Multi-tenant com planos/assinaturas.

## Stack
- **Frontend**: Vite 7 + React 19 (SPA, sem React Router)
- **Backend/Auth/DB**: Supabase (JS v2) — projeto `zelltyqwclansyqcuobn`, região sa-east-1
- **Deploy**: Vercel (auto-deploy via GitHub push em `main`)
- **Repo**: github.com/ProtectorAnalytics/bim-seguranca-eletronica
- **Versão atual**: 3.38.x (ver package.json)

## Comandos
- Build: `npm run build`
- Testes: `npm test` (Vitest, 52+ testes)
- Dev: `npm run dev`
- Lint: integrado ao build do Vite

## Arquitetura

### Navegação (SEM React Router)
Usa `useState('screen')` no App.jsx. Cada tela é um estado. URL params são lidos manualmente:
- `?invite=TOKEN` → InviteRegisterPage
- `?type=recovery` → ResetPasswordPage
- Sem params → fluxo normal (auth guard → dashboard)

### Estrutura de Pastas
```
src/
├── components/          # Todos os componentes React
│   ├── admin/           # Painéis admin (UserTable, PlanEditor, etc.)
│   ├── App.jsx          # Entry point, roteamento por estado
│   ├── LoginPage.jsx    # Login + cadastro + esqueci senha
│   ├── ProjectApp.jsx   # Canvas 2D principal (Konva)
│   └── Dashboard.jsx    # Tela principal pós-login
├── contexts/
│   └── AuthContext.jsx   # Auth Supabase + perfil + subscription
├── lib/
│   ├── supabase.js       # Cliente Supabase (anon key)
│   ├── projectStorage.js # CRUD projetos no Supabase
│   └── __tests__/        # Testes Vitest
└── data/                 # Definições de dispositivos (device-lib)
```

### Autenticação
- Supabase Auth com `onAuthStateChange` como ÚNICO trigger
- NÃO usar `getSession()` dentro de `onAuthStateChange` (causa deadlock no Supabase v2)
- Perfil: tabela `profiles` com trigger automático no signup
- Roles: `admin` ou `user` (via `profiles.role` e `app_metadata`)
- Recovery: `resetPasswordForEmail()` + `updatePassword()`

### Banco de Dados (Supabase Postgres)
Tabelas principais:
- `profiles` (id, email, full_name, company, role, avatar_url)
- `plans` (id, name, slug, max_projects, max_devices, price, features)
- `subscriptions` (id, user_id, plan_id, status, current_period_end)
- `license_keys` (token, plan_id, status, redeemed_by)
- `invite_links` (token, type, email, plan_id, status, max_uses, used_count, expires_at)
- `projects`, `project_data` (armazenamento de projetos)
- RLS habilitado em TODAS as tabelas

### Design System — Protector Lombada
- Background: branco (#FFFFFF) e light (#F0F5FA)
- Primário: azul (#046BD2)
- Borders: #E2E8F0
- Font: Inter (Google Fonts)
- Radius: 12px cards, 8px inputs
- **NUNCA usar tema escuro** — todo o app foi migrado para tema claro

## Convenções de Código
- JSX com export default function
- Inline styles (não Tailwind, não CSS modules)
- Hooks customizados em contexts (useAuth, useSubscription)
- Ícones: Lucide React (NUNCA usar thumbnails/imagens para ícones de dispositivos)
- Commit messages em português com prefixo convencional (feat, fix, chore, etc.)
- Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com> no final de cada commit

## Sistema de Convites
- Tipo `pre_register`: vinculado a email específico, uso único
- Tipo `self_register`: link aberto, configurável (max_uses, expires_at)
- Admin gera via aba "Convites" no painel admin
- UserTable tem botões "Reenviar Email" e "Gerar Convite" por usuário

## Sistema de Planos/Assinaturas
- Plans: Grátis, Pro, Enterprise (+ custom)
- Subscriptions com trial e período de validade
- License keys para ativação direta
- `current_period_end = null` significa "sem validade" (ilimitado)
- Admin pode criar, editar, excluir planos e gerenciar assinaturas

## Funcionalidades Principais Implementadas
- Canvas 2D interativo (Konva) com dispositivos de segurança
- Topologia de rede automática
- Painel de racks com cálculo de Us
- Quadro elétrico (QGBT)
- Validação de projeto
- Exportação PDF/PNG/CSV
- CRUD de projetos com salvamento no Supabase
- Painel admin completo (usuários, planos, assinaturas, licenças, convites)
- Multi-ambiente por projeto (cenários)

## Projeção Futura / Roadmap
- [ ] Email templates customizados (Supabase email templates)
- [ ] Dashboard analytics para admin (métricas de uso)
- [ ] Compartilhamento de projetos entre usuários
- [ ] Versionamento de projetos (histórico de alterações)
- [ ] App mobile (React Native ou PWA)
- [ ] Integração com ERPs de segurança
- [ ] Marketplace de templates de projetos
- [ ] API pública para integrações

## GitHub API
- **PAT Token**: salvo em `~/.github_pat` (ler com `cat ~/.github_pat`)
- Usar para criar PRs e merge via API quando push direto para `main` estiver bloqueado
- Repo: `ProtectorAnalytics/bim-seguranca-eletronica`
- Sempre fazer merge após criar PR (auto-deploy Vercel depende do merge em main)

## Gotchas / Cuidados
- **Supabase v2 deadlock**: NUNCA chamar `getSession()` dentro de `onAuthStateChange`
- **SPA routing**: Vercel usa rewrite `"source": "/(.*)", "destination": "/index.html"` no vercel.json
- **Anon key**: toda operação usa anon key + RLS (não há admin API key no frontend)
- **Cores de planos**: geradas via hash do nome (não hardcoded)
- **Testes**: rodar `npm test` antes de cada commit — deve passar 52/52
