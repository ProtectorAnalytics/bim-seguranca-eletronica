-- ============================================================
-- PROJECT SHARING — Compartilhamento de projetos
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabela de compartilhamentos
CREATE TABLE IF NOT EXISTS project_shares (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  token uuid DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  permission text NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  requires_auth boolean DEFAULT false,
  password_hash text,
  label text,
  max_uses integer,
  used_count integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

ALTER TABLE project_shares ENABLE ROW LEVEL SECURITY;

-- Index para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_project_shares_token ON project_shares(token);
CREATE INDEX IF NOT EXISTS idx_project_shares_project ON project_shares(project_id);

-- 2. RLS: Dono do projeto pode gerenciar seus shares
CREATE POLICY "owner_manage_shares" ON project_shares
  FOR ALL USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM projects WHERE id = project_shares.project_id AND user_id = auth.uid())
  );

-- 3. RLS: Qualquer pessoa pode ler share ativo por token (para validar links)
CREATE POLICY "anyone_read_active_share" ON project_shares
  FOR SELECT USING (is_active = true);

-- 4. Função RPC para acessar projeto compartilhado (SECURITY DEFINER = bypassa RLS)
CREATE OR REPLACE FUNCTION get_shared_project(share_token uuid, share_password text DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share project_shares%ROWTYPE;
  v_project json;
  v_floors json;
BEGIN
  -- Buscar share
  SELECT * INTO v_share
  FROM project_shares
  WHERE token = share_token AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Link inválido ou expirado');
  END IF;

  -- Verificar expiração
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN
    RETURN json_build_object('error', 'Link expirado');
  END IF;

  -- Verificar uso máximo
  IF v_share.max_uses IS NOT NULL AND v_share.used_count >= v_share.max_uses THEN
    RETURN json_build_object('error', 'Limite de acessos atingido');
  END IF;

  -- Verificar senha (se exigida)
  IF v_share.password_hash IS NOT NULL AND v_share.password_hash != '' THEN
    IF share_password IS NULL OR share_password = '' THEN
      RETURN json_build_object('error', 'password_required');
    END IF;
    IF v_share.password_hash != crypt(share_password, v_share.password_hash) THEN
      RETURN json_build_object('error', 'Senha incorreta');
    END IF;
  END IF;

  -- Incrementar contador de uso
  UPDATE project_shares SET used_count = used_count + 1 WHERE id = v_share.id;

  -- Buscar projeto
  SELECT json_build_object(
    'id', p.id,
    'name', p.name,
    'scenario', p.scenario,
    'client', p.client,
    'settings', p.settings,
    'active_floor', p.active_floor,
    'owner_name', COALESCE(pr.full_name, pr.email, 'Anônimo')
  ) INTO v_project
  FROM projects p
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE p.id = v_share.project_id;

  IF v_project IS NULL THEN
    RETURN json_build_object('error', 'Projeto não encontrado');
  END IF;

  -- Buscar pavimentos
  SELECT json_agg(
    json_build_object(
      'id', f.id,
      'name', f.name,
      'floor_number', f.floor_number,
      'data', f.data
    ) ORDER BY f.floor_number
  ) INTO v_floors
  FROM project_floors f
  WHERE f.project_id = v_share.project_id;

  RETURN json_build_object(
    'project', v_project,
    'floors', COALESCE(v_floors, '[]'::json),
    'permission', v_share.permission,
    'requires_auth', v_share.requires_auth,
    'share_id', v_share.id
  );
END;
$$;

-- 5. Função para salvar alterações de projeto compartilhado (edit)
CREATE OR REPLACE FUNCTION save_shared_project(
  share_token uuid,
  floor_updates json
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_share project_shares%ROWTYPE;
  v_floor json;
BEGIN
  -- Validar share com permissão de edição
  SELECT * INTO v_share
  FROM project_shares
  WHERE token = share_token AND is_active = true AND permission = 'edit';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Sem permissão de edição');
  END IF;

  -- Verificar expiração
  IF v_share.expires_at IS NOT NULL AND v_share.expires_at < now() THEN
    RETURN json_build_object('error', 'Link expirado');
  END IF;

  -- Atualizar cada pavimento
  FOR v_floor IN SELECT * FROM json_array_elements(floor_updates)
  LOOP
    UPDATE project_floors
    SET data = (v_floor->>'data')::jsonb,
        updated_at = now()
    WHERE id = (v_floor->>'id')
      AND project_id = v_share.project_id;
  END LOOP;

  -- Atualizar timestamp do projeto
  UPDATE projects
  SET updated_at = now(),
      version = version + 1
  WHERE id = v_share.project_id;

  RETURN json_build_object('success', true);
END;
$$;

-- 6. Habilitar extensão pgcrypto para hash de senhas (se não estiver habilitada)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
