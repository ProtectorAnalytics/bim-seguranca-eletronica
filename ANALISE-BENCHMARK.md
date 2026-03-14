# Análise de Benchmark & Auditoria Técnica — BIM Segurança Eletrônica

**Data:** 2026-03-14 | **Versão:** 3.38.x | **Autor:** Arquiteto Técnico (Claude Opus 4.6)
**Escopo:** 65 arquivos / ~14.800 linhas | **Testes:** 52/52 passando

---

## ETAPA 1 — PESQUISA DE PLATAFORMAS DE REFERÊNCIA

### 1.1 System Surveyor (concorrente direto)

**O que eles têm e nós NÃO temos:**

| Feature | Descrição | Relevância |
|---------|-----------|------------|
| **FOV com boundaries/paredes** | Cones de visão de câmeras que se "recortam" automaticamente ao colidir com paredes desenhadas, revelando pontos cegos reais | CRÍTICA |
| **Camera Advisor** | Calculadora de pixels-por-metro: dado um modelo de câmera, calcula se resolve face/placa a X metros de distância | ALTA |
| **Google Maps satellite** | Inserir endereço e importar imagem de satélite já com escala calibrada como planta base | ALTA |
| **BOM automático em tempo real** | Lista de materiais gerada dinamicamente conforme dispositivos são colocados na planta | CRÍTICA |
| **Budget Range calculator** | Taxa de mão-de-obra + preço do dispositivo + quantidade + horas de instalação = orçamento instantâneo | ALTA |
| **Catálogo 100K+ dispositivos** | Catálogos de fabricantes (Verkada, Pelco, Allegion, etc.) com acessórios e preços | ALTA |
| **App tablet nativo (offline)** | iPad/Android nativo com sync offline para vistoria em campo | MÉDIA |
| **Fotos vinculadas a dispositivos** | Capturar foto no campo e associar ao ponto no mapa | MÉDIA |
| **Integration Marketplace** | API REST pública + conectores HubSpot/NetSuite (lançado fev/2026) | MÉDIA |
| **InfoMask (redação de dados)** | Encriptar/ocultar dados sensíveis em relatórios compartilhados | BAIXA |

**Padrões de UX superiores:**
- **Workflow tablet-first**: prep no desktop → vistoria no tablet → refinamento no desktop → entrega
- **BOM em tempo real**: cada device colocado já atualiza a lista de materiais automaticamente
- **Layers por sistema**: câmeras, controle de acesso, intrusão — cada sistema é uma camada toggleável

**Fraquezas (onde já somos melhores):**
- Sem topologia de rede (nós temos)
- Sem rack elevation / cálculo de Us (nós temos)
- Sem quadro elétrico QGBT (nós temos)
- Sem validação estruturada de projeto (nós temos)
- Sem multi-cenários por projeto (nós temos)
- PDFs de baixa qualidade (reclamação recorrente em reviews)
- Lock de edição: apenas 1 pessoa edita por vez

---

### 1.2 D-Tools System Integrator (SI)

**O que eles têm e nós NÃO temos:**

| Feature | Descrição | Relevância |
|---------|-----------|------------|
| **BOM bidirecional com canvas** | Desenho e BOM são a mesma fonte de dados — alterar um atualiza o outro automaticamente | CRÍTICA |
| **Proposta comercial com e-sign** | PDF de proposta com BOM, mão-de-obra, preços, e assinatura digital do cliente via portal | CRÍTICA |
| **Labor estimation por device** | Cada tipo de dispositivo tem tempo de instalação estimado; total calculado automaticamente | ALTA |
| **Wire pull sheets** | Lista de puxada de cabos com origem, destino, tipo, metragem, custo por metro | ALTA |
| **Signal flow diagrams** | Diagramas de fluxo de sinal mostrando caminhos áudio/vídeo/dados entre dispositivos | ALTA |
| **Catálogo 1.6M produtos** | 340+ fornecedores, 1200+ marcas, preços de distribuidor atualizados diariamente | ALTA |
| **Auto-bundling de acessórios (ML)** | IA sugere bracket + cabo + conector ao colocar câmera (machine learning) | MÉDIA |
| **Customer Portal** | Cliente visualiza proposta, comenta e assina em portal branded sem instalar nada | MÉDIA |
| **CRM + pipeline de vendas** | Gestão de leads, oportunidades, pipeline integrado ao projeto | MÉDIA |
| **Integração contábil** | QuickBooks, NetSuite, Sage — custos do projeto sincronizados com contabilidade | BAIXA |
| **Gantt chart / PM** | Dependências de tarefas, lag times, gestão de recursos | BAIXA |

**Padrões de UX superiores:**
- **Data-driven drawings**: cada shape no canvas É um registro de banco com preço/specs, não apenas visual
- **Per-meter cost engine**: custo de cabo computado do comprimento do path na planta
- **Change order tracking**: quando projeto é revisado pós-aprovação, rastreia o que mudou e o delta de custo

---

### 1.3 PlanGrid / Autodesk Build

**O que eles têm e nós NÃO temos:**

| Feature | Descrição | Relevância |
|---------|-----------|------------|
| **Markup publicável** | Anotações pessoais (draft) vs publicadas — controle de quando a equipe vê | ALTA |
| **Issues pinados na planta** | Pinos de issue com labels 3-char (ex: "CAM", "ELE") direto no drawing | ALTA |
| **Sheet versioning com comparação** | Upload de revisão auto-matcha por nome/número; overlay visual de diferenças | ALTA |
| **Forms & checklists** | Templates customizáveis com lógica condicional (resposta cria issue automaticamente) | MÉDIA |
| **AI auto-tagging de fotos** | ML identifica objetos em fotos (porta, rodapé, etc.) e aplica tags pesquisáveis | MÉDIA |
| **RFI workflow** | Draft → Open → Under Review → Closed com notificações de prazo | MÉDIA |
| **Cost tracking** | Orçamento, cash flow, forecasting por período | MÉDIA |
| **Construction IQ** | IA escaneia issues/checklists para priorizar riscos antes de ficarem custosos | BAIXA |
| **Offline completo** | Dados sync para device; alterações em fila até reconectar | MÉDIA |

**Padrões de UX superiores:**
- **Markup linking**: qualquer anotação pode linkar a issue, RFI, formulário ou foto — anotação vira hyperlink contextual
- **Filtro de markups**: por autor, data, tipo, item linkado
- **Issue reports**: relatórios automatizados semanais por email

---

### 1.4 Procore

**O que eles têm e nós NÃO temos:**

| Feature | Descrição | Relevância |
|---------|-----------|------------|
| **OCR em PDFs** | Auto-nomeia, numera e categoriza folhas a partir do title block | MÉDIA |
| **Markup com hyperlinks** | Pin no drawing vinculado a RFI, submittal, foto, punch list | ALTA |
| **RFI por email** | Arquitetos respondem RFIs direto do email sem login | MÉDIA |
| **Daily logs** | Clima, equipe, equipamentos, visitantes, notas — por dia de obra | MÉDIA |
| **Inspeções com branching** | Checklists com lógica condicional (resposta A mostra perguntas B-C) | MÉDIA |
| **Safety Hub** | Workspace dedicado para segurança do trabalho (observações, incidentes) | BAIXA |
| **Analytics dashboard** | Métricas de projeto, tendências de RFIs, issue velocity, aging | MÉDIA |
| **Templates de projeto** | Configurações, checklists, permissões carregam para novos projetos | ALTA |
| **500+ integrações** | Marketplace com QuickBooks, Sage, Teams, scheduling, payroll | BAIXA |

**Padrões de UX superiores:**
- **Color-coded markups**: RFIs em vermelho, submittals em verde, documentos em azul (convenção visual clara)
- **Publish workflow**: markups devem ser explicitamente publicados (previne compartilhamento acidental de rascunhos)
- **AI-generated locations**: cria hierarquia de locais automaticamente a partir dos drawings

---

### 1.5 Figma

**O que eles têm e nós NÃO temos:**

| Feature | Descrição | Relevância |
|---------|-----------|------------|
| **Colaboração real-time (CRDT)** | Múltiplos cursores simultâneos, last-writer-wins, WebSocket a 30fps | ALTA |
| **Componentes reutilizáveis** | Instances linkadas a master — alterar o master propaga para todas | ALTA |
| **Version history** | Snapshot automático a cada 30min + salvamentos manuais nomeados | ALTA |
| **Branching** | Branch de design para experimentar sem afetar o principal | MÉDIA |
| **Comentários no canvas** | Click em qualquer ponto → thread de discussão com @mentions e resolução | ALTA |
| **Variables/tokens** | Cores, espaçamentos, strings como variáveis reutilizáveis com modos (light/dark) | MÉDIA |
| **Auto-layout** | Elementos se reorganizam automaticamente conforme conteúdo muda | BAIXA |
| **Dev mode** | Handoff com specs, código CSS, assets exportáveis | BAIXA |
| **Plugin ecosystem** | API pública com milhares de plugins da comunidade | MÉDIA |

**Abordagem técnica para colaboração (relevante para nós):**
- **CRDTs "last-writer-wins"**: cada propriedade de cada objeto tem ID único; conflitos resolvidos por timestamp
- **WebSocket com batching a 33ms**: updates enviados a cada frame
- **Estado em memória no server**: checkpoint para storage a cada 30-60s
- **Lock por arquivo via DynamoDB**: previne split-brain entre servidores

---

## ETAPA 2 — ANÁLISE DO CÓDIGO-FONTE

### 2.1 Bugs Críticos (perda de dados / crash)

| # | Bug | Arquivo:Linha | Severidade |
|---|-----|---------------|-----------|
| B1 | **Debounce global no auto-save** — `_saveTimer` é variável de módulo, não por projeto. Alternar entre projetos cancela save do anterior | `projectStorage.js:230-243` | CRÍTICA |
| B2 | **Delete-then-insert sem rollback** — Salvar floors deleta todos e insere novamente. Se INSERT falha, floors são permanentemente perdidos | `projectStorage.js:116-121` | CRÍTICA |
| B3 | **clearHistory() antes do load cloud** — Limpa undo antes de confirmar que cloud load funcionou | `App.jsx:115-116` | ALTA |
| B4 | **Token null no delete cloud** — Se `getAccessToken()` retorna null, pula delete remoto mas remove da UI local, dessincronizando | `ProjectListPage.jsx:58-66` | ALTA |
| B5 | **Subscription sem verificação** — Cria subscription e marca invite como usado sem checar se insert deu certo | `InviteRegisterPage.jsx:125-141` | ALTA |
| B6 | **Quadro re-assign bloqueado** — Verifica `!draggedDev.quadroId` impedindo mover device de um quadro para outro | `ProjectApp.jsx:1103-1111` | MÉDIA |
| B7 | **Conflito de versão em edição concorrente** — `version++` sem verificar se remote mudou. Dois usuários editando = lost update | `projectStorage.js:185` | ALTA |

### 2.2 Bugs Médios (funcionalidade degradada)

| # | Bug | Arquivo:Linha | Descrição |
|---|-----|---------------|-----------|
| B8 | Retry sem refresh de token — usa mesmo token expirado | `AuthContext.jsx:119-124` |
| B9 | Erro de profile update silenciado — admin vê "sucesso" falso | `UserTable.jsx:92-105` |
| B10 | Reativação fixa em 30 dias — ignora duração real do plano | `SubscriptionManager.jsx:55-63` |
| B11 | `calcCableDistance` ignora `bgScale` — metragem incorreta | `helpers.js:254-263` |
| B12 | License redeem sem verificação de erro no insert/update | `LicenseRedeemForm.jsx:70-74` |
| B13 | Email não validado em convites pre_register | `InviteLinkManager.jsx:80-82` |
| B14 | `catch(e){}` vazio — localStorage corrupto falha silenciosamente | `helpers.js:247` |
| B15 | `addConnection` swallows todos os erros — sem log de RLS violations | `ProjectApp.jsx:370` |

### 2.3 Problemas de Segurança

| # | Risco | Arquivo:Linha | Severidade |
|---|-------|---------------|-----------|
| S1 | **Import JSON sem validação** — projeto importado aceito sem checar estrutura, limites, tipos. Possível DoS com arrays enormes | `ExportModal.jsx:119-147` | MÉDIA |
| S2 | **Dados sensíveis em localStorage sem criptografia** — projetos com info de cliente em texto plano | `helpers.js:73-82` (setCachedProject) | MÉDIA |
| S3 | **XSS potencial em nomes de devices** — nome de device é user-controlled e renderizado sem sanitização | `ProjectApp.jsx:1878` | MÉDIA |
| S4 | **Sem proteção CSRF** — REST calls usam apenas Bearer token sem validar origin | `projectStorage.js:21-55` | BAIXA |

### 2.4 Problemas de Performance

| # | Problema | Arquivo:Linha | Impacto |
|---|---------|---------------|---------|
| P1 | **ProjectApp.jsx = 2.794 linhas** — componente monolítico que re-renderiza inteiro a cada mudança de estado | `ProjectApp.jsx:1-2794` | ALTO |
| P2 | **validTargets recalcula N² validações** — `validateConnection` para CADA par de devices quando cableMode ativa | `ProjectApp.jsx:1011-1026` | ALTO |
| P3 | **Validações O(n×m) a cada render** — 50+ regras × todos devices/connections/racks sem cache | `ProjectApp.jsx:770-816` | ALTO |
| P4 | **Quadro device list sem memoização** — `devices.filter()` chamado para cada quadro a cada render | `ProjectApp.jsx:1705-1806` | MÉDIO |
| P5 | **Admin sem paginação** — todas as tabelas carregam TODOS os registros | `UserTable:41`, `SubscriptionManager:20`, `LicenseKeyManager:50`, `InviteLinkManager:55` | MÉDIO |
| P6 | **Sem cache de métricas admin** — refetch a cada troca de aba | `AdminPage.jsx:181-232` | BAIXO |
| P7 | **History sem limite** — undo/redo pode armazenar milhares de snapshots com projeto completo | `useProjectHistory` | MÉDIO |

### 2.5 UX — Feedback Ausente

| # | Problema | Onde |
|---|---------|------|
| U1 | Sem toast de sucesso ao criar/editar plano no admin | `PlanEditor.jsx:246` |
| U2 | Sem loading spinner durante migração para cloud | `ProjectListPage.jsx:74-98` |
| U3 | Sem loading ao gerar convite (botão não desabilita) | `InviteLinkManager.jsx:78-118` |
| U4 | Reset de senha mostra sucesso mesmo se email falhou | `UserTable.jsx:120-135` |
| U5 | `alert()` nativo para limites em vez de toast in-app | `ProjectApp.jsx:164-166` |
| U6 | Sem confirmação ao sair do editor com alterações não salvas | `App.jsx / ProjectApp.jsx` |
| U7 | Delete de projeto usa `window.confirm` em vez de modal styled | `ProjectListPage.jsx:56` |
| U8 | Sem empty state quando 0 projetos / 0 devices / 0 validações | Vários componentes |
| U9 | Cloud save status invisível — usuário não sabe se dados sincronizaram | `App.jsx:81-91` |

### 2.6 Código Duplicado / Dívida Técnica

| # | Problema | Onde |
|---|---------|------|
| D1 | Validação de senha duplicada em 3 arquivos | `LoginPage.jsx:6-12`, `InviteRegisterPage.jsx:6-12`, `ResetPasswordPage.jsx:4-10` |
| D2 | Cores hardcoded espalhadas em todos os componentes | `#046BD2`, `#22c55e`, `#f59e0b` em 20+ locais |
| D3 | Pattern de fetch+error duplicado em todos os admin panels | `UserTable`, `SubscriptionManager`, `LicenseKeyManager`, `InviteLinkManager` |
| D4 | `devices.filter(d=>!d.quadroId)` duplicado em 2 locais | `ProjectApp.jsx:1807, 2312` |
| D5 | Magic numbers sem constantes nomeadas | `ProjectApp.jsx:1540, 1556, 1818, 1994` |
| D6 | Sem TypeScript/JSDoc — devices são objetos sem schema | Todo o projeto |

### 2.7 Testes Ausentes

| Área sem cobertura |
|-------------------|
| `projectStorage.js` — zero testes (REST fetch, debounce, save/load, rollback) |
| `AuthContext.jsx` — zero testes (race conditions, fallback, token refresh) |
| `validateConnection()` — lógica complexa de interfaces sem teste |
| Componentes React — zero testes de componente |
| Import/Export de projetos — parsing de JSON sem teste |
| `calcPPSection()` edge cases (distance=0, valores extremos) |

---

## ETAPA 3 — MATRIZ DE PRIORIZAÇÃO

### Legenda
- **Impacto**: Alto (bloqueia usuários / diferencial competitivo), Médio (melhora experiência), Baixo (qualidade técnica)
- **Esforço**: P (< 1 dia), M (1-3 dias), G (> 1 semana)
- **Prioridade**: 1 = fazer primeiro, 5 = backlog

| # | Feature / Correção | Origem | Impacto | Esforço | Prioridade |
|---|-------------------|--------|---------|---------|------------|
| 1 | **Corrigir debounce global** — Map por projectId | Auditoria (B1) | Alto | P | **1** |
| 2 | **Upsert em floors** (substituir delete+insert) | Auditoria (B2) | Alto | P | **1** |
| 3 | **Guard de token null** no delete cloud | Auditoria (B4) | Alto | P | **1** |
| 4 | **Verificar erro** no insert de subscription/invite | Auditoria (B5) | Alto | P | **1** |
| 5 | **Mover clearHistory** para após load bem-sucedido | Auditoria (B3) | Alto | P | **1** |
| 6 | **BOM automático em tempo real** | System Surveyor, D-Tools | Alto | M | **2** |
| 7 | **FOV de câmeras com cones visuais** | System Surveyor | Alto | M | **2** |
| 8 | **bgScale no cálculo de cabo** | Auditoria (B11) | Alto | P | **2** |
| 9 | **Toasts de sucesso/erro** em ações admin | Auditoria (U1-U5) | Médio | P | **2** |
| 10 | **Validação de import JSON** (schema + limites) | Auditoria (S1) | Médio | P | **2** |
| 11 | **Comentários/markup na planta** | PlanGrid, Procore, Figma | Alto | M | **2** |
| 12 | **Proposta comercial em PDF** | D-Tools, System Surveyor | Alto | M | **3** |
| 13 | **Version history** com snapshots nomeados | Figma, PlanGrid | Alto | M | **3** |
| 14 | **Layers por sistema** (câmeras, cabos, rede, elétrica) | System Surveyor, Figma | Alto | M | **3** |
| 15 | **Split ProjectApp.jsx** em sub-componentes | Auditoria (P1) | Alto | G | **3** |
| 16 | **Paginação nas tabelas admin** | Auditoria (P5) | Médio | P | **3** |
| 17 | **Compartilhamento view-only** (link público) | PlanGrid, Figma, System Surveyor | Alto | M | **3** |
| 18 | **Optimistic locking** para edição concorrente | Auditoria (B7), Figma | Alto | M | **3** |
| 19 | **Labor estimation** por tipo de device | D-Tools | Alto | M | **3** |
| 20 | **Camera Advisor** (pixels/metro) | System Surveyor | Alto | M | **3** |
| 21 | **Wire pull sheets** (lista de puxada de cabos) | D-Tools | Alto | M | **3** |
| 22 | **Templates de projeto** (escola, condomínio, galpão) | Procore, D-Tools | Médio | M | **3** |
| 23 | **Confirmação de ações destrutivas** (modal styled) | Auditoria (U6, U7) | Médio | P | **3** |
| 24 | **Extrair validação de senha** para lib compartilhada | Auditoria (D1) | Baixo | P | **3** |
| 25 | **Constantes de cores** (design system) | Auditoria (D2) | Baixo | P | **3** |
| 26 | **Memoização** de derivações em ProjectApp | Auditoria (P2-P4) | Médio | M | **3** |
| 27 | **Limitar history** a 50 snapshots | Auditoria (P7) | Médio | P | **3** |
| 28 | **Issues/pins na planta** com labels | PlanGrid, Procore | Médio | M | **4** |
| 29 | **Colaboração real-time** (WebSocket/CRDT) | Figma | Alto | G | **4** |
| 30 | **DWG/DXF import** | PlanGrid, System Surveyor | Alto | G | **4** |
| 31 | **App mobile/tablet offline** | System Surveyor, PlanGrid | Alto | G | **4** |
| 32 | **Google Maps satellite** como planta base | System Surveyor | Médio | M | **4** |
| 33 | **Catálogo de fabricantes** com preços | D-Tools, System Surveyor | Alto | G | **4** |
| 34 | **Sheet comparison** (overlay de revisões) | PlanGrid, Bluebeam | Médio | G | **4** |
| 35 | **Customer Portal** (cliente visualiza sem login) | D-Tools | Médio | M | **4** |
| 36 | **API pública REST** | System Surveyor, Procore | Médio | G | **4** |
| 37 | **Dashboard analytics** (métricas de uso) | Procore, D-Tools | Médio | M | **4** |
| 38 | **Testes para projectStorage** e AuthContext | Auditoria | Médio | M | **4** |
| 39 | **Daily logs** (registro diário de obra) | Procore | Baixo | M | **5** |
| 40 | **RFI/submittal workflows** | PlanGrid, Procore | Baixo | G | **5** |
| 41 | **Forms & checklists** com lógica condicional | PlanGrid | Baixo | G | **5** |
| 42 | **Integração contábil** (QuickBooks/Sage) | D-Tools, Procore | Baixo | G | **5** |
| 43 | **CRM/pipeline** de vendas | D-Tools | Baixo | G | **5** |
| 44 | **Auto-bundling de acessórios** (ML) | D-Tools | Médio | G | **5** |
| 45 | **Signal flow diagrams** | D-Tools | Médio | G | **5** |

---

## ETAPA 4 — PLANO DE IMPLEMENTAÇÃO (Top 10)

### Item 1: Corrigir debounce global no auto-save
**Problema:** `_saveTimer` é variável de módulo — trocar de projeto cancela save do anterior.
**Implementação:**
- Substituir `let _saveTimer = null` por `const _saveTimers = new Map()`
- Key = `projectId`, value = `{ timer, promise }`
- `cancelPendingSave(projectId)` cancela apenas o timer daquele projeto
**Arquivos:** `src/lib/projectStorage.js` (linhas 230-250)
**Dependências:** Nenhuma
**Complexidade:** Baixa (< 2h)

### Item 2: Upsert em floors (substituir delete+insert)
**Problema:** DELETE + INSERT sem transação = floors perdidos se INSERT falha.
**Implementação:**
- Substituir por UPSERT usando `Prefer: resolution=merge-duplicates` no header
- Ou usar Supabase RPC com `BEGIN/COMMIT/ROLLBACK` em stored procedure
- Alternativa mais simples: `ON CONFLICT (project_id, floor_order) DO UPDATE`
**Arquivos:** `src/lib/projectStorage.js` (linhas 105-130)
**Dependências:** Verificar se constraint UNIQUE existe em `project_floors(project_id, floor_order)`
**Complexidade:** Baixa-Média (2-4h)

### Item 3: Guard de token null + verificação de subscription
**Problema:** Token null pula delete remoto mas remove da UI; subscription insert não verificado.
**Implementação:**
```javascript
// ProjectListPage.jsx:58-66
if(proj.storageMode === 'cloud' || proj._source === 'cloud'){
  const token = await getAccessToken();
  if(!token){ alert('Erro: sem autenticação'); return; } // ← ADD RETURN
  ...
}

// InviteRegisterPage.jsx:125-141
const { error: subErr } = await supabase.from('subscriptions').insert([{...}]);
if (subErr) { setError('Erro ao criar assinatura: ' + subErr.message); return; } // ← ADD CHECK
```
**Arquivos:** `src/components/ProjectListPage.jsx`, `src/components/InviteRegisterPage.jsx`
**Dependências:** Nenhuma
**Complexidade:** Baixa (< 1h)

### Item 4: Mover clearHistory para após load
**Problema:** `clearHistory()` chamado antes de saber se cloud load funcionou.
**Implementação:**
```javascript
// App.jsx:115-134 — mover clearHistory() para depois do setProject()
const onOpenProject = useCallback(async (proj) => {
  // REMOVER: clearHistory(); // era aqui
  if (proj.storageMode === 'cloud' && ...) {
    const { project: cloudProj, error } = await loadCloudProject(...);
    if (!error && cloudProj) {
      clearHistory(); // ← MOVER PARA CÁ
      setProject(p);
      ...
    }
  }
  clearHistory(); // ← E AQUI para o path local
  ...
}, [...]);
```
**Arquivos:** `src/components/App.jsx` (linhas 115-151)
**Dependências:** Nenhuma
**Complexidade:** Baixa (< 30min)

### Item 5: bgScale no cálculo de metragem de cabo
**Problema:** `calcCableDistance` usa `pxPerMeter=40` fixo, ignorando a escala da planta.
**Implementação:**
- Adicionar parâmetro `bgScale` a `calcCableDistance(from, to, connections, pxPerMeter, bgScale)`
- Multiplicar resultado por `bgScale` quando definido: `distance * (bgScale || 1)`
- Atualizar todos os chamadores para passar `floor.bgScale`
**Arquivos:** `src/lib/helpers.js` (linhas 254-263), `src/components/ProjectApp.jsx` (callers)
**Dependências:** Nenhuma
**Complexidade:** Baixa (< 1h)

### Item 6: BOM automático em tempo real
**Problema:** Não geramos lista de materiais; concorrentes geram automaticamente.
**Implementação:**
- Criar `src/components/BomPanel.jsx` — painel lateral que mostra BOM do andar/projeto
- Dados derivados de `devices` via `useMemo`: agrupar por `device.key`, contar quantidades
- Adicionar colunas: Modelo, Qtd, Preço Unit. (do device-lib), Subtotal
- Incluir cabos: tipo, metragem total (de `connections`)
- Botão "Exportar BOM" em CSV/PDF
- Integrar ao `ProjectApp.jsx` como aba no painel lateral
**Arquivos:**
- Criar: `src/components/BomPanel.jsx`
- Modificar: `src/components/ProjectApp.jsx` (adicionar aba)
- Modificar: `src/data/device-lib.js` (adicionar campo `price` por device)
**Dependências:** Campo de preço no device-lib (pode ser 0 inicialmente)
**Complexidade:** Média (2-3 dias)

### Item 7: FOV de câmeras com cones visuais
**Problema:** System Surveyor mostra campo de visão; nós só mostramos ícone.
**Implementação:**
- Criar componente Konva `CameraFovCone` — `<Wedge>` ou `<Shape>` custom
- Props: `angle` (do device-lib, ex: 90°), `distance` (alcance IR), `rotation` (orientação)
- Toggle global "Mostrar FOV" no toolbar
- Cor semi-transparente por tipo (IP = azul, MHD = verde)
- Fase 2: collision com boundaries/paredes (como System Surveyor)
**Arquivos:**
- Criar: `src/components/CameraFovCone.jsx`
- Modificar: `src/components/ProjectApp.jsx` (renderizar cones no canvas)
- Modificar: `src/data/device-lib.js` (adicionar `fovAngle`, `fovRange` por câmera)
**Dependências:** Dados de FOV no device-lib
**Complexidade:** Média (2-3 dias)

### Item 8: Toasts de sucesso/erro em ações admin
**Problema:** Ações admin (criar plano, gerar convite, etc.) são silenciosas no sucesso.
**Implementação:**
- Criar `src/components/Toast.jsx` — componente de toast reutilizável com `success/error/info`
- Criar `src/hooks/useToast.js` — hook com `showToast(message, type, duration)`
- Substituir todos os `alert()` por `showToast()`
- Adicionar toast de sucesso em: PlanEditor, InviteLinkManager, LicenseKeyManager, UserTable
**Arquivos:**
- Criar: `src/components/Toast.jsx`, `src/hooks/useToast.js`
- Modificar: `PlanEditor.jsx`, `InviteLinkManager.jsx`, `LicenseKeyManager.jsx`, `UserTable.jsx`, `ProjectApp.jsx`
**Dependências:** Nenhuma
**Complexidade:** Média (1-2 dias)

### Item 9: Validação de import JSON
**Problema:** JSON importado aceito sem validação — possível DoS ou corrupção.
**Implementação:**
- Criar `src/lib/projectValidator.js` com:
  - Schema validation: campos obrigatórios (`name`, `floors`, `client`)
  - Limits: max 50 floors, max 1000 devices/floor, max 5000 connections
  - Type checks: `id` é string, `x/y` são números, `key` existe no device-lib
  - Size check: arquivo < 50MB
- Usar no import em `ExportModal.jsx` e no load de `projectStorage.js`
**Arquivos:**
- Criar: `src/lib/projectValidator.js`
- Modificar: `src/components/ExportModal.jsx` (linhas 119-147)
**Dependências:** Nenhuma
**Complexidade:** Média (1 dia)

### Item 10: Comentários/markup na planta
**Problema:** Sem forma de anotar/discutir pontos na planta. Todas as referências têm.
**Implementação:**
- Criar `src/components/CommentPin.jsx` — pino clicável no canvas Konva
- Modelo de dados: `{ id, x, y, floorId, author, text, resolved, createdAt }`
- Armazenar em `project.floors[n].comments[]`
- Tool "Comentário" no toolbar (ícone de balão)
- Click no canvas cria pin → abre textarea → salva
- Painel lateral "Comentários" listando todos com filtro (abertos/resolvidos)
- Fase 2: threads de resposta, @mentions, markup shapes (setas, clouds)
**Arquivos:**
- Criar: `src/components/CommentPin.jsx`, `src/components/CommentsPanel.jsx`
- Modificar: `src/components/ProjectApp.jsx` (tool + rendering no canvas)
**Dependências:** Alteração no schema do projeto (adicionar `comments` por floor)
**Complexidade:** Média-Grande (3-5 dias)

---

## RESUMO EXECUTIVO

### Onde já somos superiores aos concorrentes:
- **Topologia de rede automática** — nenhum concorrente tem (System Surveyor, D-Tools, PlanGrid, Procore, Figma)
- **Rack elevation com cálculo de Us** — apenas D-Tools tem algo similar
- **Quadro elétrico (QGBT)** — nenhum concorrente tem
- **Validação estruturada de projeto** — apenas D-Tools tem parcialmente
- **Multi-cenários por projeto** — nenhum concorrente tem

### Top 5 gaps que mais impactam competitividade:
1. **BOM automático** — System Surveyor e D-Tools geram em tempo real; nós não temos
2. **FOV de câmeras** — System Surveyor tem cones com boundaries; nós só mostramos ícone
3. **Proposta comercial** — D-Tools gera PDF com BOM + labor + e-sign; nós exportamos apenas planta
4. **Comentários/markup** — PlanGrid, Procore e Figma têm; nós não temos forma de anotar
5. **Version history** — Figma e PlanGrid têm snapshots com comparação; nós não temos histórico

### Sequência recomendada:
```
Semana 1: Bugs críticos (items 1-5) ──────────── ESTABILIDADE
Semana 2: BOM + FOV + Toasts (items 6-8) ─────── DIFERENCIAL
Semana 3: Validação + Comentários (items 9-10) ── PROFISSIONALIZAÇÃO
Semana 4+: Proposta, Versioning, Layers ────────── COMPETITIVIDADE
```

### Métricas de sucesso:
| Métrica | Atual | Meta pós-implementação |
|---------|-------|----------------------|
| Bugs críticos | 7 | 0 |
| Funcionalidades vs System Surveyor | 60% | 85% |
| Funcionalidades vs D-Tools (core) | 40% | 70% |
| Testes cobrindo libs críticas | 52 | 80+ |
| Tamanho máximo de componente | 2794 linhas | < 500 linhas |
