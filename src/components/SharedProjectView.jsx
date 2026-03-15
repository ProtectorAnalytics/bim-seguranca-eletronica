import React, { useState, useEffect, useCallback, useRef } from 'react';
import { accessSharedProject, saveSharedProject } from '@/lib/projectSharing';
import { syncUid, migrateProjectKeys, dedupDeviceIds } from '@/lib/helpers';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import ProjectApp from './ProjectApp';
import { Lock, AlertTriangle, LogIn, Cloud, CloudOff, Loader2 } from 'lucide-react';
import LoginPage from './LoginPage';

export default function SharedProjectView({ shareToken, onExit }) {
  const { user, loading: authLoading, getAccessToken } = useAuth();
  const [state, setState] = useState('loading'); // loading | password | auth_required | error | ready
  const [project, setProjectRaw] = useState(null);
  const [permission, setPermission] = useState('view');
  const [ownerName, setOwnerName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'saved' | 'error'
  const saveTimer = useRef(null);
  const initialLoad = useRef(true); // Skip save on first load

  const loadProject = useCallback(async (pwd) => {
    setState('loading');
    setErrorMsg('');

    const authToken = user ? await getAccessToken() : null;
    const { result, error } = await accessSharedProject(shareToken, pwd || null, authToken);

    if (error) {
      if (error.message === 'password_required') {
        setState('password');
        return;
      }
      if (error.message?.includes('login') || error.message?.includes('auth')) {
        setState('auth_required');
        return;
      }
      setErrorMsg(error.message || 'Erro ao acessar projeto');
      setState('error');
      return;
    }

    // Check if auth required but user not logged in
    if (result.requires_auth && !user) {
      setState('auth_required');
      return;
    }

    // Build project object from shared data
    const proj = result.project;
    const floors = (result.floors || []).map(f => ({
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

    const settings = proj.settings || {};
    const crossFloorConnections = settings.crossFloorConnections || [];
    const { crossFloorConnections: _cfc, ...cleanSettings } = settings;

    const p = {
      name: proj.name,
      scenario: proj.scenario,
      client: proj.client || {},
      floors,
      activeFloor: proj.active_floor || floors[0]?.id || 'f1',
      settings: cleanSettings,
      crossFloorConnections,
    };

    migrateProjectKeys(p);
    syncUid(p);
    dedupDeviceIds(p);

    setProjectRaw(p);
    setPermission(result.permission);
    setOwnerName(proj.owner_name || '');
    setState('ready');
  }, [shareToken, user, getAccessToken]);

  useEffect(() => {
    if (!authLoading) loadProject();
  }, [authLoading, user]);

  // Auto-save for edit permission (debounced)
  const setProject = useCallback((updaterOrVal) => {
    setProjectRaw(prev => {
      const next = typeof updaterOrVal === 'function' ? updaterOrVal(prev) : updaterOrVal;
      return next;
    });
  }, []);

  useEffect(() => {
    if (!project || permission !== 'edit') return;

    // Skip the first render (project just loaded, no changes yet)
    if (initialLoad.current) {
      initialLoad.current = false;
      return;
    }

    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const authToken = user ? await getAccessToken() : null;
        const { error } = await saveSharedProject(shareToken, project.floors, authToken);
        if (error) {
          console.warn('[SharedProject] Save failed:', error.message);
          setSaveStatus('error');
        } else {
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus(null), 3000);
        }
      } catch (e) {
        console.error('[SharedProject] Save exception:', e);
        setSaveStatus('error');
      }
    }, 2000);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [project]);

  // Loading state
  if (state === 'loading') return <LoadingScreen />;

  // Password required
  if (state === 'password') return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <Lock size={40} color="#046BD2" />
        <h2 style={{ fontSize: 18, color: '#1e293b', margin: '12px 0 4px' }}>Projeto protegido</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
          Este projeto requer uma senha para acessar
        </p>
        <input
          type="password"
          placeholder="Digite a senha"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadProject(password)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 8,
            border: '1.5px solid #E2E8F0', fontSize: 14, outline: 'none',
            fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
            marginBottom: 12,
          }}
          autoFocus
        />
        {errorMsg && <p style={{ color: '#dc2626', fontSize: 12, margin: '0 0 8px' }}>{errorMsg}</p>}
        <button onClick={() => loadProject(password)} style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: '#046BD2', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        }}>
          Acessar
        </button>
        <button onClick={onExit} style={linkBtnStyle}>Voltar</button>
      </div>
    </div>
  );

  // Auth required
  if (state === 'auth_required') {
    if (showLogin) return <LoginPage onSuccess={() => { setShowLogin(false); loadProject(); }} />;
    return (
      <div style={centerStyle}>
        <div style={cardStyle}>
          <LogIn size={40} color="#046BD2" />
          <h2 style={{ fontSize: 18, color: '#1e293b', margin: '12px 0 4px' }}>Login necessário</h2>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
            O dono deste projeto exige que você faça login para acessar
          </p>
          <button onClick={() => setShowLogin(true)} style={{
            width: '100%', padding: '10px', borderRadius: 8, border: 'none',
            background: '#046BD2', color: '#fff', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>
            Fazer Login
          </button>
          <button onClick={onExit} style={linkBtnStyle}>Voltar</button>
        </div>
      </div>
    );
  }

  // Error
  if (state === 'error') return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <AlertTriangle size={40} color="#f59e0b" />
        <h2 style={{ fontSize: 18, color: '#1e293b', margin: '12px 0 4px' }}>Não foi possível acessar</h2>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>{errorMsg}</p>
        <button onClick={() => loadProject()} style={{
          width: '100%', padding: '10px', borderRadius: 8, border: 'none',
          background: '#046BD2', color: '#fff', fontSize: 14, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'Inter, sans-serif', marginBottom: 8,
        }}>
          Tentar novamente
        </button>
        <button onClick={onExit} style={linkBtnStyle}>Voltar ao início</button>
      </div>
    </div>
  );

  // Ready — show project
  if (!project) return <LoadingScreen />;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Shared project banner */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        padding: '6px 16px', background: permission === 'edit' ? '#dcfce7' : '#eff6ff',
        borderBottom: '1px solid #E2E8F0', fontSize: 12, fontFamily: 'Inter, sans-serif',
        flexShrink: 0,
      }}>
        <span style={{ color: '#64748b' }}>
          Projeto compartilhado por <strong style={{ color: '#1e293b' }}>{ownerName}</strong>
        </span>
        <span style={{
          padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 600,
          background: permission === 'edit' ? '#16a34a' : '#046BD2',
          color: '#fff',
        }}>
          {permission === 'edit' ? 'Edição' : 'Visualização'}
        </span>
        {permission === 'edit' && saveStatus && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, color: saveStatus === 'error' ? '#dc2626' : saveStatus === 'saving' ? '#d97706' : '#16a34a',
          }}>
            {saveStatus === 'saving' && <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}><Loader2 size={10} /></span> Salvando...</>}
            {saveStatus === 'saved' && <><Cloud size={10} /> Salvo</>}
            {saveStatus === 'error' && <><CloudOff size={10} /> Erro ao salvar</>}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </span>
        )}
        <button onClick={onExit} style={{
          marginLeft: 'auto', background: 'none', border: '1px solid #E2E8F0',
          borderRadius: 6, padding: '3px 10px', fontSize: 11, cursor: 'pointer',
          color: '#64748b', fontFamily: 'Inter, sans-serif',
        }}>
          Sair
        </button>
      </div>

      {/* Project canvas */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ProjectApp
          project={project}
          setProject={permission === 'edit' ? setProject : () => {}}
          undo={() => {}}
          redo={() => {}}
          cloudSaveStatus={null}
          storageMode="shared"
          onBack={onExit}
          readOnly={permission === 'view'}
          shareToken={shareToken}
        />
      </div>
    </div>
  );
}

const centerStyle = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  height: '100vh', background: '#F0F5FA', fontFamily: 'Inter, sans-serif',
};

const cardStyle = {
  background: '#fff', borderRadius: 16, padding: '40px 32px',
  textAlign: 'center', maxWidth: 380, width: '90%',
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
};

const linkBtnStyle = {
  display: 'block', width: '100%', padding: '8px',
  background: 'none', border: 'none', fontSize: 13,
  color: '#046BD2', cursor: 'pointer', marginTop: 8,
  fontFamily: 'Inter, sans-serif',
};
