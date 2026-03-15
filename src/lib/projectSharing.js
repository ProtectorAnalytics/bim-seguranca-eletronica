// ====================================================================
// PROJECT SHARING — Compartilhamento de projetos via Supabase
// ====================================================================
import { supabaseUrl, supabaseAnonKey } from './supabase';

const REST = `${supabaseUrl}/rest/v1`;

function headers(token) {
  const h = {
    'apikey': supabaseAnonKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function restFetch(path, opts = {}) {
  const url = `${REST}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || 10000);

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: { ...headers(opts.token), ...(opts.extraHeaders || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { data: null, error: { status: res.status, message: body } };
    }
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return { data: null, error: null };
    }
    return { data: await res.json(), error: null };
  } catch (err) {
    clearTimeout(timer);
    return { data: null, error: { status: 0, message: err.message } };
  }
}

// ── RPC helper (calls Supabase RPC functions) ──
async function rpc(fnName, params = {}, token = null) {
  const url = `${REST}/rpc/${fnName}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify(params),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { data: null, error: { status: res.status, message: body } };
    }
    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    clearTimeout(timer);
    return { data: null, error: { status: 0, message: err.message } };
  }
}

// ====================================================================
// CREATE SHARE — owner creates a new share link
// ====================================================================
export async function createShare(projectId, userId, token, opts = {}) {
  const { data, error } = await restFetch(
    '/project_shares',
    {
      method: 'POST',
      token,
      extraHeaders: { 'Prefer': 'return=representation' },
      body: {
        project_id: projectId,
        permission: opts.permission || 'view',
        requires_auth: opts.requiresAuth || false,
        password_hash: opts.password ? opts.password : null, // Will be hashed by DB trigger if needed
        label: opts.label || null,
        max_uses: opts.maxUses || null,
        expires_at: opts.expiresAt || null,
        created_by: userId,
        is_active: true,
      },
    }
  );
  if (error) return { share: null, error };
  const share = Array.isArray(data) ? data[0] : data;
  return { share, error: null };
}

// ====================================================================
// LIST SHARES — owner lists all shares for a project
// ====================================================================
export async function listShares(projectId, token) {
  const { data, error } = await restFetch(
    `/project_shares?project_id=eq.${encodeURIComponent(projectId)}&order=created_at.desc`,
    { token }
  );
  if (error) return { shares: [], error };
  return { shares: data || [], error: null };
}

// ====================================================================
// DELETE/REVOKE SHARE
// ====================================================================
export async function revokeShare(shareId, token) {
  return restFetch(
    `/project_shares?id=eq.${encodeURIComponent(shareId)}`,
    {
      method: 'PATCH',
      token,
      extraHeaders: { 'Prefer': 'return=minimal' },
      body: { is_active: false },
    }
  );
}

export async function deleteShare(shareId, token) {
  return restFetch(
    `/project_shares?id=eq.${encodeURIComponent(shareId)}`,
    { method: 'DELETE', token }
  );
}

// ====================================================================
// ACCESS SHARED PROJECT — guest or authenticated user via share token
// Uses RPC function (SECURITY DEFINER) to bypass RLS
// ====================================================================
export async function accessSharedProject(shareToken, password = null, authToken = null) {
  const { data, error } = await rpc(
    'get_shared_project',
    { share_token: shareToken, share_password: password },
    authToken
  );
  if (error) return { result: null, error };

  // RPC returns the JSON directly
  if (data?.error) {
    return { result: null, error: { message: data.error } };
  }
  return { result: data, error: null };
}

// ====================================================================
// SAVE SHARED PROJECT — guest with edit permission saves changes
// ====================================================================
export async function saveSharedProject(shareToken, floors, authToken = null) {
  const floorUpdates = floors.map(f => ({
    id: f.id,
    data: JSON.stringify({
      devices: f.devices || [],
      connections: f.connections || [],
      environments: f.environments || [],
      racks: f.racks || [],
      quadros: f.quadros || [],
      bgScale: f.bgScale ?? 1.0,
      bgImage: f.bgImage || null,
      bgOpacity: f.bgOpacity ?? 0.3,
    }),
  }));

  // Pass as JSON object (not string) — the rpc() function handles serialization
  const { data, error } = await rpc(
    'save_shared_project',
    { share_token: shareToken, floor_updates: floorUpdates },
    authToken
  );
  if (error) return { error };
  if (data?.error) return { error: { message: data.error } };
  return { error: null };
}

// ====================================================================
// SHARE URL HELPERS
// ====================================================================
export function getShareUrl(shareToken) {
  const base = window.location.origin;
  return `${base}/?share=${shareToken}`;
}

export function getWhatsAppShareUrl(shareToken, projectName) {
  const url = getShareUrl(shareToken);
  const text = encodeURIComponent(`Confira o projeto "${projectName}": ${url}`);
  return `https://wa.me/?text=${text}`;
}

export function getEmailShareUrl(shareToken, projectName, ownerName) {
  const url = getShareUrl(shareToken);
  const subject = encodeURIComponent(`Projeto compartilhado: ${projectName}`);
  const body = encodeURIComponent(
    `Olá!\n\n${ownerName || 'Alguém'} compartilhou o projeto "${projectName}" com você.\n\nAcesse aqui: ${url}\n\nBIM Segurança Eletrônica — Protector Sistemas`
  );
  return `mailto:?subject=${subject}&body=${body}`;
}
