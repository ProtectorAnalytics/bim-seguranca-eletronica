-- ============================================================
-- MIGRATION: Índices FK/parciais/compostos + RLS otimizado
-- Aplicado diretamente via Supabase MCP em 2026-03-17
-- Todos os advisors de WARN/ERROR zerados após aplicação
-- ============================================================

-- ==== 1. Fix is_admin(): auth.uid() → (select auth.uid()) ====
-- Sem este fix, auth.uid() é chamado POR LINHA dentro da função
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
    AND role = 'admin'
  );
$$;

-- ==== 2. Índices FK ausentes (schema-foreign-key-indexes) ====
-- Postgres NÃO cria índices em FKs automaticamente.
-- Falta → full table scan em JOINs e ON DELETE CASCADE.
CREATE INDEX IF NOT EXISTS idx_invite_links_created_by     ON public.invite_links (created_by);
CREATE INDEX IF NOT EXISTS idx_invite_links_plan_id        ON public.invite_links (plan_id);
CREATE INDEX IF NOT EXISTS idx_invite_links_used_by        ON public.invite_links (used_by) WHERE used_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_license_keys_plan_id        ON public.license_keys (plan_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_redeemed_by    ON public.license_keys (redeemed_by) WHERE redeemed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_project_shares_created_by   ON public.project_shares (created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id       ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id       ON public.subscriptions (plan_id);
CREATE INDEX IF NOT EXISTS idx_project_floors_project_id   ON public.project_floors (project_id);
-- idx_projects_user já existe; idx_projects_user_id foi dropado (duplicata)

-- ==== 3. Índices parciais (query-partial-indexes) ====
-- Só indexa linhas que realmente serão consultadas → índice até 80% menor
CREATE INDEX IF NOT EXISTS idx_invite_links_token_active   ON public.invite_links (token) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_license_keys_key_active     ON public.license_keys (key)   WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_project_shares_active       ON public.project_shares (token) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_plans_active_price          ON public.plans (price_brl)     WHERE is_active = true;

-- ==== 4. Índices compostos (query-composite-indexes) ====
-- Equality columns primeiro, range/order por último
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status   ON public.subscriptions (user_id, status);
CREATE INDEX IF NOT EXISTS idx_invite_links_status_expires ON public.invite_links (status, expires_at);
CREATE INDEX IF NOT EXISTS idx_projects_user_updated       ON public.projects (user_id, updated_at DESC);

-- ==== 5. RLS — profiles ====
-- ANTES: 2 policies SELECT + 2 policies UPDATE (multiple_permissive_policies WARN)
-- DEPOIS: 1 policy SELECT + 1 policy UPDATE com condição combinada
DROP POLICY IF EXISTS "Users read own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Admin read all profiles"  ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING ((select auth.uid()) = id OR is_admin());

DROP POLICY IF EXISTS "Users update own profile"  ON public.profiles;
DROP POLICY IF EXISTS "Admin update all profiles" ON public.profiles;
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE
  USING ((select auth.uid()) = id OR is_admin());

-- ==== 6. RLS — subscriptions ====
DROP POLICY IF EXISTS "Users read own sub"   ON public.subscriptions;
DROP POLICY IF EXISTS "Admin manages subs"   ON public.subscriptions;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT
  USING (user_id = (select auth.uid()) OR is_admin());
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE
  USING (is_admin());
CREATE POLICY "subscriptions_delete" ON public.subscriptions FOR DELETE
  USING (is_admin());

-- ==== 7. RLS — license_keys ====
DROP POLICY IF EXISTS "Users read own redeemed" ON public.license_keys;
DROP POLICY IF EXISTS "Admin manages keys"      ON public.license_keys;
CREATE POLICY "license_keys_select" ON public.license_keys FOR SELECT
  USING (redeemed_by = (select auth.uid()) OR is_admin());
CREATE POLICY "license_keys_insert" ON public.license_keys FOR INSERT
  WITH CHECK (is_admin());
-- Admin atualiza qualquer chave; usuário só pode resgatar chave disponível
CREATE POLICY "license_keys_update" ON public.license_keys FOR UPDATE
  USING  (is_admin() OR (status = 'available' AND redeemed_by IS NULL))
  WITH CHECK (is_admin() OR (redeemed_by = (select auth.uid()) AND status = 'redeemed'));
CREATE POLICY "license_keys_delete" ON public.license_keys FOR DELETE
  USING (is_admin());

-- ==== 8. RLS — plans ====
DROP POLICY IF EXISTS "Anyone can read active plans" ON public.plans;
DROP POLICY IF EXISTS "Admin manages plans"          ON public.plans;
CREATE POLICY "plans_select" ON public.plans FOR SELECT
  USING (is_active = true OR is_admin());
CREATE POLICY "plans_insert" ON public.plans FOR INSERT
  WITH CHECK (is_admin());
CREATE POLICY "plans_update" ON public.plans FOR UPDATE
  USING (is_admin());
CREATE POLICY "plans_delete" ON public.plans FOR DELETE
  USING (is_admin());

-- ==== 9. RLS — invite_links ====
DROP POLICY IF EXISTS "admins_full_access"              ON public.invite_links;
DROP POLICY IF EXISTS "anyone_can_read_active_by_token" ON public.invite_links;
CREATE POLICY "invite_links_select" ON public.invite_links FOR SELECT
  USING (status = 'active' OR is_admin());
CREATE POLICY "invite_links_insert" ON public.invite_links FOR INSERT
  WITH CHECK (is_admin());
-- Admin + usuário convidado pode marcar como usado (fluxo de cadastro via convite)
CREATE POLICY "invite_links_update" ON public.invite_links FOR UPDATE
  USING  (is_admin() OR status = 'active')
  WITH CHECK (is_admin() OR status IN ('used', 'expired'));
CREATE POLICY "invite_links_delete" ON public.invite_links FOR DELETE
  USING (is_admin());

-- ==== 10. RLS — projects (auth_rls_initplan: 4 policies) ====
DROP POLICY IF EXISTS "Users can view own projects"   ON public.projects;
DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING ((select auth.uid()) = user_id);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING  ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ==== 11. RLS — project_floors (auth_rls_initplan: 4 policies) ====
DROP POLICY IF EXISTS "Users can view own project floors"   ON public.project_floors;
DROP POLICY IF EXISTS "Users can insert own project floors" ON public.project_floors;
DROP POLICY IF EXISTS "Users can update own project floors" ON public.project_floors;
DROP POLICY IF EXISTS "Users can delete own project floors" ON public.project_floors;
CREATE POLICY "project_floors_select" ON public.project_floors FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_floors.project_id AND p.user_id = (select auth.uid())
  ));
CREATE POLICY "project_floors_insert" ON public.project_floors FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_floors.project_id AND p.user_id = (select auth.uid())
  ));
CREATE POLICY "project_floors_update" ON public.project_floors FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_floors.project_id AND p.user_id = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_floors.project_id AND p.user_id = (select auth.uid())
  ));
CREATE POLICY "project_floors_delete" ON public.project_floors FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = project_floors.project_id AND p.user_id = (select auth.uid())
  ));

-- ==== 12. RLS — project_shares ====
DROP POLICY IF EXISTS "owner_manage_shares"      ON public.project_shares;
DROP POLICY IF EXISTS "anyone_read_active_share" ON public.project_shares;
CREATE POLICY "project_shares_select" ON public.project_shares FOR SELECT
  USING (
    is_active = true
    OR created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
        AND projects.user_id = (select auth.uid())
    )
  );
CREATE POLICY "project_shares_insert" ON public.project_shares FOR INSERT
  WITH CHECK (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
        AND projects.user_id = (select auth.uid())
    )
  );
CREATE POLICY "project_shares_update" ON public.project_shares FOR UPDATE
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
        AND projects.user_id = (select auth.uid())
    )
  );
CREATE POLICY "project_shares_delete" ON public.project_shares FOR DELETE
  USING (
    created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_shares.project_id
        AND projects.user_id = (select auth.uid())
    )
  );

-- ==== 13. Remover índice duplicado ====
DROP INDEX IF EXISTS public.idx_projects_user_id;
