// ====================================================================
// PROJECT STORAGE — Cloud CRUD via Supabase REST API
// Uses direct fetch (same pattern as AuthContext) to bypass SW issues
// ====================================================================
import { supabaseUrl, supabaseAnonKey } from './supabase';

const REST = `${supabaseUrl}/rest/v1`;
const HEADERS = (token) => ({
  'apikey': supabaseAnonKey,
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Prefer': 'return=minimal',
});
const HEADERS_JSON = (token) => ({
  ...HEADERS(token),
  'Prefer': 'return=representation',
});

// ── Generic REST helper ──
async function restFetch(path, token, opts = {}) {
  const url = `${REST}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || 10000);

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: opts.headers || HEADERS(token),
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      console.error(`[projectStorage] ${opts.method || 'GET'} ${path} → ${res.status}:`, body);
      return { data: null, error: { status: res.status, message: body } };
    }

    // 204 No Content or minimal prefer
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return { data: null, error: null };
    }

    const data = await res.json();
    return { data, error: null };
  } catch (err) {
    clearTimeout(timer);
    const msg = err.name === 'AbortError' ? 'Timeout' : err.message;
    console.error(`[projectStorage] ${opts.method || 'GET'} ${path} exception:`, msg);
    return { data: null, error: { status: 0, message: msg } };
  }
}

// ====================================================================
// LIST — metadata only (no floors), fast for project list
// ====================================================================
export async function listCloudProjects(token) {
  const { data, error } = await restFetch(
    '/projects?select=id,name,scenario,client,settings,active_floor,device_count,status,storage_mode,version,created_at,updated_at&order=updated_at.desc',
    token
  );
  if (error) return { projects: [], error };
  return { projects: data || [], error: null };
}

// ====================================================================
// LOAD — full project with floors (for opening a project)
// ====================================================================
export async function loadCloudProject(projectId, token) {
  // Fetch project metadata
  const { data: projArr, error: projErr } = await restFetch(
    `/projects?id=eq.${encodeURIComponent(projectId)}&select=*`,
    token
  );
  if (projErr || !projArr?.length) {
    return { project: null, error: projErr || { message: 'Project not found' } };
  }

  const proj = projArr[0];

  // Fetch floors
  const { data: floors, error: floorErr } = await restFetch(
    `/project_floors?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=floor_number.asc`,
    token
  );
  if (floorErr) {
    return { project: null, error: floorErr };
  }

  // Reassemble into app format
  const appProject = dbToApp(proj, floors || []);
  return { project: appProject, error: null };
}

// ====================================================================
// SAVE — upsert project + floors (called by debounced auto-save)
// ====================================================================
export async function saveCloudProject(project, projectId, userId, token) {
  const { meta, floors } = appToDb(project, projectId, userId);

  // Upsert project metadata
  const { error: projErr } = await restFetch(
    '/projects?on_conflict=id',
    token,
    {
      method: 'POST',
      headers: { ...HEADERS(token), 'Prefer': 'resolution=merge-duplicates,return=minimal' },
      body: meta,
    }
  );
  if (projErr) return { error: projErr };

  // Delete existing floors then insert fresh (simpler than individual upserts)
  await restFetch(
    `/project_floors?project_id=eq.${encodeURIComponent(projectId)}`,
    token,
    { method: 'DELETE' }
  );

  if (floors.length > 0) {
    const { error: floorErr } = await restFetch(
      '/project_floors',
      token,
      { method: 'POST', body: floors }
    );
    if (floorErr) return { error: floorErr };
  }

  console.log(`[projectStorage] Saved project ${projectId} (${floors.length} floors)`);
  return { error: null };
}

// ====================================================================
// DELETE — cascade deletes floors automatically
// ====================================================================
export async function deleteCloudProject(projectId, token) {
  const { error } = await restFetch(
    `/projects?id=eq.${encodeURIComponent(projectId)}`,
    token,
    { method: 'DELETE' }
  );
  return { error };
}

// ====================================================================
// TRANSFORMATIONS: app format ↔ DB format
// ====================================================================

/**
 * Convert app project object → DB rows (project meta + floor rows)
 */
function appToDb(project, projectId, userId) {
  const floors = (project.floors || []).map((f, i) => ({
    id: f.id,
    project_id: projectId,
    name: f.name || `Andar ${i}`,
    floor_number: f.number ?? i,
    data: {
      devices: f.devices || [],
      connections: f.connections || [],
      environments: f.environments || [],
      racks: f.racks || [],
      quadros: f.quadros || [],
      bgScale: f.bgScale ?? 1.0,
      bgImage: f.bgImage || null,
      bgOpacity: f.bgOpacity ?? 0.3,
    },
    updated_at: new Date().toISOString(),
  }));

  const meta = {
    id: projectId,
    user_id: userId,
    name: project.name || 'Novo Projeto',
    scenario: project.scenario || null,
    client: project.client || {},
    settings: project.settings || {},
    active_floor: project.activeFloor || 'f1',
    device_count: (project.floors || []).reduce((sum, f) => sum + (f.devices?.length || 0), 0),
    status: project.status || 'rascunho',
    storage_mode: 'cloud',
    version: (project._version || 0) + 1,
    updated_at: new Date().toISOString(),
  };

  return { meta, floors };
}

/**
 * Convert DB rows → app project object
 */
function dbToApp(proj, floorRows) {
  const floors = floorRows.map(f => ({
    id: f.id,
    name: f.name,
    number: f.floor_number,
    devices: f.data?.devices || [],
    connections: f.data?.connections || [],
    environments: f.data?.environments || [],
    racks: f.data?.racks || [],
    quadros: f.data?.quadros || [],
    bgScale: f.data?.bgScale ?? 1.0,
    bgImage: f.data?.bgImage || null,
    bgOpacity: f.data?.bgOpacity ?? 0.3,
  }));

  return {
    id: proj.id,
    name: proj.name,
    scenario: proj.scenario,
    client: proj.client || {},
    floors,
    activeFloor: proj.active_floor || 'f1',
    settings: proj.settings || {},
    status: proj.status || 'rascunho',
    storageMode: proj.storage_mode || 'cloud',
    _version: proj.version || 1,
    createdAt: proj.created_at,
    updatedAt: proj.updated_at,
    deviceCount: proj.device_count || 0,
  };
}

// ====================================================================
// DEBOUNCED SAVE — call from useEffect, auto-debounces 2s
// ====================================================================
let _saveTimer = null;
let _savePromise = null;

export function debouncedSaveCloud(project, projectId, userId, token, delayMs = 2000) {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    _savePromise = saveCloudProject(project, projectId, userId, token);
    const result = await _savePromise;
    if (result.error) {
      console.warn('[projectStorage] Auto-save failed:', result.error.message);
    }
    _savePromise = null;
  }, delayMs);
}

export function cancelPendingSave() {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
}
