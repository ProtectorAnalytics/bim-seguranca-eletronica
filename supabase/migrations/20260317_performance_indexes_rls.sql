-- ============================================================
-- PERFORMANCE: Índices e RLS otimizados
-- Baseado em: Supabase Postgres Best Practices
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. ÍNDICES EM FK COLUMNS (schema-foreign-key-indexes)
--    Postgres NÃO cria índices automaticamente em FK.
--    Falta de índice = full table scan em JOINs e CASCADE.
-- ============================================================

-- subscriptions.user_id → auth.users (CRÍTICO — RLS filtra por user_id)
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON subscriptions (user_id);

-- subscriptions.plan_id → plans
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
  ON subscriptions (plan_id);

-- license_keys.plan_id → plans
CREATE INDEX IF NOT EXISTS idx_license_keys_plan_id
  ON license_keys (plan_id);

-- license_keys.redeemed_by → profiles
CREATE INDEX IF NOT EXISTS idx_license_keys_redeemed_by
  ON license_keys (redeemed_by)
  WHERE redeemed_by IS NOT NULL;

-- invite_links.plan_id → plans
CREATE INDEX IF NOT EXISTS idx_invite_links_plan_id
  ON invite_links (plan_id);

-- invite_links.created_by → profiles
CREATE INDEX IF NOT EXISTS idx_invite_links_created_by
  ON invite_links (created_by);

-- project_floors.project_id → projects (CRÍTICO — toda query de floors filtra por project_id)
CREATE INDEX IF NOT EXISTS idx_project_floors_project_id
  ON project_floors (project_id);

-- projects.user_id → auth.users (CRÍTICO — RLS filtra por user_id)
CREATE INDEX IF NOT EXISTS idx_projects_user_id
  ON projects (user_id);

-- project_shares.created_by → auth.users (usado na RLS policy)
CREATE INDEX IF NOT EXISTS idx_project_shares_created_by
  ON project_shares (created_by)
  WHERE created_by IS NOT NULL;

-- ============================================================
-- 2. ÍNDICES PARCIAIS (query-partial-indexes)
--    Índice menor = write mais rápido + query mais rápida.
--    Útil para colunas com filtros constantes (status, is_active).
-- ============================================================

-- invite_links: só tokens ativos são consultados no fluxo de cadastro
CREATE INDEX IF NOT EXISTS idx_invite_links_token_active
  ON invite_links (token)
  WHERE status = 'active';

-- license_keys: só chaves disponíveis são buscadas para resgate
CREATE INDEX IF NOT EXISTS idx_license_keys_key_active
  ON license_keys (key)
  WHERE status = 'active';

-- project_shares: só shares ativos são acessados via link
CREATE INDEX IF NOT EXISTS idx_project_shares_active
  ON project_shares (token)
  WHERE is_active = true;

-- plans: SubscriptionPage filtra is_active = true
CREATE INDEX IF NOT EXISTS idx_plans_active_price
  ON plans (price_brl)
  WHERE is_active = true;

-- ============================================================
-- 3. ÍNDICES COMPOSTOS (query-composite-indexes)
--    Equality columns primeiro, range/order columns por último.
-- ============================================================

-- subscriptions: RLS filtra user_id + app filtra status
-- Cobre: WHERE user_id = ? (RLS) e WHERE user_id = ? AND status = 'active'
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions (user_id, status);

-- invite_links: consulta típica filtra status + verifica expires_at
-- Cobre: WHERE status = 'active' AND (expires_at IS NULL OR expires_at > now())
CREATE INDEX IF NOT EXISTS idx_invite_links_status_expires
  ON invite_links (status, expires_at);

-- projects: listagem filtra user_id + ordena por updated_at DESC
-- Cobre: WHERE user_id = ? ORDER BY updated_at DESC
CREATE INDEX IF NOT EXISTS idx_projects_user_updated
  ON projects (user_id, updated_at DESC);

-- ============================================================
-- 4. FIX RLS PERFORMANCE (security-rls-performance)
--    auth.uid() chamado sem SELECT = executado POR LINHA.
--    Wrapping em (select auth.uid()) = executado UMA vez e cacheado.
--    Impacto: até 100x mais rápido em tabelas grandes.
-- ============================================================

-- Fix: project_shares — policy owner_manage_shares
DROP POLICY IF EXISTS "owner_manage_shares" ON project_shares;

CREATE POLICY "owner_manage_shares" ON project_shares
  FOR ALL USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM projects
      WHERE id = project_shares.project_id
        AND user_id = (SELECT auth.uid())
    )
  );

-- Fix: project_shares — policy anyone_read_active_share
-- Esta policy não usa auth.uid(), mas garante filtro de is_active
-- (já está correta; apenas re-criando para uniformidade)
DROP POLICY IF EXISTS "anyone_read_active_share" ON project_shares;

CREATE POLICY "anyone_read_active_share" ON project_shares
  FOR SELECT USING (is_active = true);

-- ============================================================
-- NOTA: Para as demais tabelas (projects, subscriptions, etc.)
-- aplique o mesmo padrão nas policies existentes via Dashboard:
--
--   ANTES:  using (user_id = auth.uid())
--   DEPOIS: using (user_id = (select auth.uid()))
--
-- Isso é especialmente importante em:
--   - projects: policy de acesso por user_id
--   - subscriptions: policy de acesso por user_id
--   - profiles: policy de acesso por id = auth.uid()
-- ============================================================

-- ============================================================
-- 5. VERIFICAÇÃO — queries para diagnóstico
-- Execute para confirmar que os índices foram criados:
-- ============================================================
/*
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'subscriptions', 'license_keys', 'invite_links',
    'project_floors', 'projects', 'project_shares', 'plans'
  )
ORDER BY tablename, indexname;
*/

-- Para encontrar FK columns sem índice no futuro:
/*
SELECT
  conrelid::regclass AS table_name,
  a.attname AS fk_column
FROM pg_constraint c
JOIN pg_attribute a
  ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f'
  AND NOT EXISTS (
    SELECT 1 FROM pg_index i
    WHERE i.indrelid = c.conrelid AND a.attnum = ANY(i.indkey)
  )
ORDER BY table_name, fk_column;
*/
