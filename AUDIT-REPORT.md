# Auditoria Completa — BIM Segurança Eletrônica v3.38.x

**Data:** 2026-03-14
**Escopo:** Análise de ponta a ponta de 65 arquivos / ~14.800 linhas
**Testes:** 52/52 passando (3 suites)

---

## 1. BUGS E CORREÇÕES

### 1.1 CRÍTICOS (bloqueiam usuário ou perda de dados)

| # | Bug | Arquivo:Linha | Impacto |
|---|-----|---------------|---------|
| B1 | **Debounce global no auto-save** — `_saveTimer` e `_savePromise` são variáveis de módulo, não por projeto. Se o usuário alterna entre projetos rapidamente, o save do Projeto A é cancelado pelo debounce do Projeto B. | `projectStorage.js:230-243` | Perda silenciosa de dados |
| B2 | **Delete-then-insert sem rollback** — Ao salvar floors, primeiro deleta todos e depois inserta. Se o INSERT falha (rede, validação), os floors são permanentemente perdidos sem rollback. | `projectStorage.js:116-121` | Corrupção de projeto |
| B3 | **clearHistory() antes do load cloud** — `onOpenProject` limpa o histórico de undo antes de verificar se o load do cloud deu certo. Se falhar, não há como voltar. | `App.jsx:115-116` | UX degradada |
| B4 | **Token de delete cloud sem token** — Se `getAccessToken()` retorna null, o código pula o delete remoto mas ainda remove o projeto da UI local, dessincronizando. | `ProjectListPage.jsx:58-66` | Dessincronização local/cloud |
| B5 | **Subscription criada sem verificação** — `InviteRegisterPage` cria subscription e marca invite como usado sem checar se o insert da subscription deu certo. Usuário fica sem plano. | `InviteRegisterPage.jsx:125-141` | Usuário sem plano |

### 1.2 MÉDIOS (funcionalidade degradada)

| # | Bug | Arquivo:Linha | Impacto |
|---|-----|---------------|---------|
| B6 | **Retry sem refresh de token** — AuthContext retry usa o mesmo access token. Se expirou entre tentativa 1 e 2, a segunda falha também. | `AuthContext.jsx:119-124` | Login falha intermitente |
| B7 | **Erro de profile update silenciado** — UserTable faz 5 retries de profile update mas só loga `console.warn` se todos falharem. Mostra "sucesso" para o admin. | `UserTable.jsx:92-105` | Admin vê sucesso falso |
| B8 | **Reativação fixa em 30 dias** — SubscriptionManager define `current_period_end` = now + 30 dias ao reativar, ignorando a duração real do plano. | `SubscriptionManager.jsx:55-63` | Período truncado |
| B9 | **Limite de projetos conta local + cloud junto** — Verifica `projects.length >= limits.maxProjects` incluindo ambos, mas a mensagem sugere apenas local. | `App.jsx:105` | Confusão no limite |
| B10 | **calcCableDistance ignora bgScale** — Cálculo de metragem de cabo usa `pxPerMeter=40` fixo, sem multiplicar pelo `bgScale` do andar. | `helpers.js:254-263` | Metragem incorreta |
| B11 | **LicenseRedeemForm sem verificação de erro** — Insert/update de subscription não verifica `error` no retorno. | `LicenseRedeemForm.jsx:70-74` | Ativação silenciosa falha |
| B12 | **Email não validado em convites pre_register** — Apenas checa se está vazio, não valida formato. | `InviteLinkManager.jsx:80-82` | Emails inválidos no DB |

### 1.3 BAIXOS (edge cases)

| # | Bug | Arquivo:Linha |
|---|-----|---------------|
| B13 | Race condition `didFetch` + `fetchInProgress` sobrepostos no AuthContext | `AuthContext.jsx:62,98,230` |
| B14 | Dedup de IDs incompleto para cabos de energia (apenas dados) | `helpers.js:193-227` |
| B15 | IP validation não rejeita ranges reservados (0.0.0.0, 169.254.x.x) | `helpers.js:268-290` |
| B16 | Legacy device classifiers (`_legacy`) não filtrados em todos os fluxos downstream | `helpers.js:156-176` |

---

## 2. MELHORIAS DE UX/LÓGICA

### 2.1 Feedback ausente

| # | Problema | Onde |
|---|----------|------|
| U1 | **Sem toast de sucesso** ao criar/editar plano no admin | `PlanEditor.jsx:246` |
| U2 | **Sem loading spinner** durante migração de projeto para cloud | `ProjectListPage.jsx:74-98` |
| U3 | **Sem loading** ao gerar convite (botão não desabilita) | `InviteLinkManager.jsx:78-118` |
| U4 | **Reset de senha** enviado sem verificar retorno — mostra sucesso mesmo se falhou | `UserTable.jsx:120-135` |
| U5 | **Sem empty state** quando admin tem 0 métricas (mostra zeros) | `AdminPage.jsx:234-276` |

### 2.2 Confirmações e proteções

| # | Problema | Onde |
|---|----------|------|
| U6 | Delete de projeto usa `window.confirm` nativo em vez de modal in-app | `ProjectListPage.jsx:56` |
| U7 | Revogar license key sem possibilidade de desfazer | `LicenseKeyManager.jsx:90-104` |
| U8 | Sem confirmação ao sair do editor de projeto com alterações não salvas | `App.jsx / ProjectApp.jsx` |

### 2.3 Acessibilidade

| # | Problema | Onde |
|---|----------|------|
| U9 | Inputs usam placeholder em vez de `<label>` em vários formulários | `LicenseRedeemForm.jsx`, modais |
| U10 | Modais não trapam foco nem suportam Escape para fechar | Modais diversos |
| U11 | Sem suporte a navegação por teclado no canvas Konva | `ProjectApp.jsx` |

---

## 3. MELHORIAS TÉCNICAS

### 3.1 Componentes grandes demais (devem ser quebrados)

| Arquivo | Linhas | Sugestão de Split |
|---------|--------|-------------------|
| `ProjectApp.jsx` | **2.794** | Extrair: `CanvasArea`, `ToolbarPanel`, `DevicePlacer`, `CableRouter`, `RackManager`, `QuadroManager`, `TopologyView`, `FloorManager` |
| `pdf-export.js` | 712 | Extrair: `PdfCoverPage`, `PdfDeviceTable`, `PdfTopology`, `PdfRackDiagram` |
| `EquipmentRepoModal.jsx` | 622 | Extrair: `CategoryFilter`, `DeviceCard`, `SearchBar` |
| `DevicePropertiesPanel.jsx` | 561 | Extrair por tipo de device: `CameraProps`, `NvrProps`, `SwitchProps` |
| `ExportModal.jsx` | 453 | Extrair: `ExportPdf`, `ExportPng`, `ExportCsv` |

### 3.2 Código duplicado

| Problema | Arquivos |
|----------|----------|
| Validação de senha (mesmas regras em 3 locais) | `LoginPage.jsx:6-12`, `InviteRegisterPage.jsx:6-12`, `ResetPasswordPage.jsx:4-10` |
| Cores hardcoded (`#046BD2`, `#22c55e`, `#f59e0b`) espalhadas | Todos os componentes admin |
| Pattern de fetch + error handling repetido | `UserTable`, `SubscriptionManager`, `LicenseKeyManager`, `InviteLinkManager` |

### 3.3 Performance

| # | Problema | Onde | Fix |
|---|----------|------|-----|
| T1 | `floor`, `devices`, `connections` recalculados a cada render sem `useMemo` | `ProjectApp.jsx:155+` | Memoizar derivações |
| T2 | Handlers inline sem `useCallback` causam re-render de filhos | Admin panels, `ProjectApp` | Extrair com `useCallback` |
| T3 | **Sem paginação** — admin carrega TODOS os registros de cada tabela | `UserTable:41`, `SubscriptionManager:20`, `LicenseKeyManager:50`, `InviteLinkManager:55` | Paginar com `range()` |
| T4 | Device library inteira na memória (74 devices) | `device-lib.js` | OK por agora, lazy-load futuro |
| T5 | Sem cache de métricas admin (refetch a cada troca de aba) | `AdminPage.jsx:181-232` | Cache com TTL de 30s |

### 3.4 Testes faltantes

| Área sem cobertura |
|-------------------|
| `validateConnection()` — lógica complexa de interfaces |
| `projectStorage.js` — nenhum teste (REST fetch, debounce, save/load) |
| `AuthContext.jsx` — nenhum teste (race conditions, fallback) |
| Componentes React — zero testes de componente |
| `calcPPSection()` — edge cases (distance=0, values muito altos) |
| Dedup com cabos de energia (só dados testado) |

---

## 4. BENCHMARK — Comparação com Plataformas de Referência

### Legenda: ✅ Temos | ⚠️ Parcial | ❌ Não temos

| Funcionalidade | BIM Seg. | AutoCAD Web | Bluebeam | PlanGrid | Procore | D-Tools SI |
|---------------|----------|-------------|----------|----------|---------|------------|
| **Canvas 2D** | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Biblioteca de devices** | ✅ | ✅ | N/A | N/A | N/A | ✅ |
| **Topologia de rede** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Rack U calculation** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Quadro elétrico** | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| **Validação de projeto** | ✅ | ⚠️ | ❌ | ❌ | ❌ | ✅ |
| **Export PDF/PNG/CSV** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Multi-tenant/planos** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Colaboração real-time | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Comentários/markup em planta | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Versionamento/histórico | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| BOM (lista de materiais) | ❌ | ❌ | ❌ | ⚠️ | ✅ | ✅ |
| Proposta/orçamento | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Labor estimation (mão de obra) | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Wire pull sheets | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Signal flow diagrams | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| RFI / submittals | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Compartilhamento view-only | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Approval workflows | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| App mobile / PWA | ⚠️ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Integração ERP/CRM | ❌ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| API pública | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Templates de projeto | ❌ | ✅ | ❌ | ✅ | ✅ | ✅ |
| Dashboard analytics | ❌ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Notificações (email/push) | ❌ | ✅ | ✅ | ✅ | ✅ | ❌ |
| DWG/DXF import | ❌ | ✅ | ✅ | ⚠️ | ❌ | ⚠️ |
| Layers / camadas | ❌ | ✅ | ✅ | ❌ | ❌ | ⚠️ |
| Medição em planta (scale tool) | ❌ | ✅ | ✅ | ✅ | ❌ | ⚠️ |
| Offline mode | ❌ | ❌ | ✅ | ✅ | ⚠️ | ✅ |

### 4.1 Features-chave que nos faltam (por prioridade de mercado)

**TIER 1 — Diferencial competitivo imediato (D-Tools é o concorrente direto):**
1. **BOM (Bill of Materials)** — Gerar lista de materiais completa com quantidades, modelos, preços. D-Tools faz isso automaticamente.
2. **Proposta comercial / orçamento** — Gerar PDF de proposta com custos de equipamento + instalação. Core feature do D-Tools.
3. **Labor estimation** — Calcular horas de mão-de-obra por tipo de dispositivo/cabeamento. Padrão no D-Tools.
4. **Wire pull sheets** — Lista de puxada de cabos com origem, destino, tipo, metragem. D-Tools e integradores usam diariamente.

**TIER 2 — Paridade com plataformas de construção:**
5. **Colaboração real-time** — Múltiplos usuários editando simultâneamente (como Google Docs). AutoCAD Web, Bluebeam, PlanGrid todos têm.
6. **Comentários/markup** — Anotar diretamente na planta com texto, setas, destaques. Bluebeam é referência.
7. **Versionamento** — Histórico de alterações com diff visual e rollback. Já está no roadmap.
8. **Compartilhamento view-only** — Link público para cliente visualizar sem editar. Básico em todas as plataformas.

**TIER 3 — Profissionalização:**
9. **DWG/DXF import** — Importar plantas base de AutoCAD. Muitos integradores trabalham com DWG.
10. **Layers/camadas** — Separar câmeras, cabos, rede, elétrica em camadas toggleáveis.
11. **Templates de projeto** — Projetos modelo pré-configurados (escola, condomínio, galpão).
12. **Medição em planta** — Ferramenta de régua com escala real.

**TIER 4 — Crescimento:**
13. **API pública** — Integração com ERPs, CRMs, sistemas de compra.
14. **Dashboard analytics** — Métricas de uso, projetos, dispositivos populares.
15. **Notificações** — Email/push para atualizações de projeto, vencimento de plano.
16. **Offline mode completo** — PWA com service worker para trabalho offline.

---

## 5. MATRIZ DE PRIORIZAÇÃO (Impacto × Esforço)

```
                        ALTO IMPACTO
                            │
    ┌───────────────────────┼───────────────────────┐
    │                       │                       │
    │   🔥 FAZER PRIMEIRO   │   📋 PLANEJAR         │
    │                       │                       │
    │  B1 Debounce/projeto  │  Split ProjectApp     │
    │  B2 Rollback floors   │  Colaboração RT       │
    │  B5 Subscription chk  │  Versionamento        │
    │  B4 Token null guard  │  DWG/DXF import       │
    │  B10 bgScale cable    │  BOM generation       │
    │  U8 Unsaved changes   │  Proposta/orçamento   │
    │  T3 Paginação admin   │  Wire pull sheets     │
    │                       │  Layers/camadas       │
 BAIXO ─────────────────────┼──────────────────────── ALTO
 ESFORÇO                    │                       ESFORÇO
    │                       │                       │
    │   ✅ QUICK WINS       │   ⏳ BACKLOG          │
    │                       │                       │
    │  B6 Token refresh     │  Testes componentes   │
    │  B7 Profile error msg │  API pública          │
    │  B8 Período do plano  │  App mobile nativo    │
    │  B11 License err chk  │  Integração ERP       │
    │  B12 Email validation │  Offline mode         │
    │  U1 Toast sucesso     │  Dashboard analytics  │
    │  U2 Loading spinner   │  Signal flow diagrams │
    │  U6 Modal confirm     │  Notificações push    │
    │  Dedup senha rules    │  Templates projeto    │
    │  Constantes de cor    │  Medição em planta    │
    │                       │                       │
    └───────────────────────┼───────────────────────┘
                            │
                       BAIXO IMPACTO
```

### Ordem de execução recomendada:

#### Sprint 1 — Bugs críticos (1-2 dias)
1. **B1** — Refatorar debounce para ser por projectId (Map em vez de global)
2. **B2** — Usar UPSERT em vez de DELETE+INSERT para floors
3. **B4** — Adicionar `return` quando `!token` no delete cloud
4. **B5** — Verificar `error` no insert de subscription antes de marcar invite
5. **B3** — Mover `clearHistory()` para depois do load bem-sucedido

#### Sprint 2 — Quick wins de UX (1 dia)
6. **U1-U5** — Adicionar toasts/loading em ações admin
7. **B6** — Refresh token antes de retry no AuthContext
8. **B7** — Propagar erro de profile update ao admin
9. **B8** — Usar duração do plano em vez de 30 dias fixo
10. **B12** — Validar formato de email em convites

#### Sprint 3 — Qualidade técnica (2-3 dias)
11. **T3** — Paginação nas tabelas admin (Supabase `.range()`)
12. Extrair validação de senha para `lib/passwordValidation.js`
13. Criar `lib/colors.js` com constantes do design system
14. **U8** — Warning de "alterações não salvas" ao sair do editor
15. **B10** — Aplicar `bgScale` no cálculo de metragem

#### Sprint 4 — Refactoring (1 semana)
16. Split `ProjectApp.jsx` (2794 linhas → 8-10 componentes)
17. Memoizar derivações com `useMemo`/`useCallback`
18. Adicionar testes para `projectStorage.js` e `AuthContext`

#### Sprint 5+ — Features competitivas (roadmap)
19. BOM (lista de materiais automática)
20. Proposta comercial em PDF
21. Compartilhamento view-only
22. Versionamento de projetos
23. Layers/camadas no canvas
24. Wire pull sheets
25. Colaboração real-time (WebSocket/Supabase Realtime)

---

## Resumo Executivo

| Categoria | Total | Críticos | Médios | Baixos |
|-----------|-------|----------|--------|--------|
| Bugs | 16 | 5 | 7 | 4 |
| UX | 11 | — | 8 | 3 |
| Técnico | 11 | — | 5 | 6 |
| Features faltantes (benchmark) | 16 | 4 (Tier 1) | 4 (Tier 2) | 8 (Tier 3-4) |
| **TOTAL** | **54** | **9** | **24** | **21** |

**Saúde geral do projeto:** O app tem uma base sólida com boa cobertura de testes (52/52) e arquitetura clara. Os 5 bugs críticos são todos de race condition / error handling — nenhum é arquitetural. A maior dívida técnica é o `ProjectApp.jsx` com 2794 linhas. Em termos de mercado, o app já supera D-Tools em topologia de rede e quadro elétrico, mas precisa de BOM, propostas e wire pull sheets para competir diretamente no nicho de segurança eletrônica.
