import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getSavedProjects, saveProjects, getSavedClients, saveClients, syncUid, dedupDeviceIds, migrateProjectKeys, setCachedProject } from '@/lib/helpers';
import { debouncedSaveCloud, cancelPendingSave, loadCloudProject } from '@/lib/projectStorage';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ProjectListPage from './ProjectListPage';
import ClientForm from './ClientForm';
// ScenarioSelect merged into ClientForm
import ClientListPage from './ClientListPage';
import EquipmentRepoPage from './EquipmentRepoPage';
import SettingsPage from './SettingsPage';
import SubscriptionPage from './SubscriptionPage';
import ProfilePage from './ProfilePage';
import AdminPage from './AdminPage';
import InviteRegisterPage from './InviteRegisterPage';
import ResetPasswordPage from './ResetPasswordPage';
import UpgradeBanner from './UpgradeBanner';
import VersionBadge from './VersionBadge';
import ProjectApp from './ProjectApp';
import { useSubscription } from '../hooks/useSubscription';
import { useProjectHistory } from '../hooks/useProjectHistory';

export default function App(){
  const { user, loading: authLoading, isAdmin, configError, getAccessToken } = useAuth();
  const limits = useSubscription();
  const [screen,setScreen]=useState('dashboard');
  const [project,_setProject]=useState(null);
  const { pushSnapshot, undo, redo, clearHistory, skipNext } = useProjectHistory(_setProject);
  const setProject=(updaterOrVal)=>{
    _setProject(prev=>{
      try{
        const next=typeof updaterOrVal==='function'?updaterOrVal(prev):updaterOrVal;
        if(!skipNext.current && prev && next){
          try{
            const ps=JSON.stringify(prev);const ns=JSON.stringify(next);
            if(ps!==ns) pushSnapshot(prev);
          }catch(e){console.warn('History snapshot failed',e)}
        }
        skipNext.current=false;
        return next;
      }catch(e){console.error('setProject error',e);skipNext.current=false;return prev;}
    });
  };
  const [editingProjectId,setEditingProjectId]=useState(null);
  const [storageMode,setStorageMode]=useState('cloud'); // 'cloud' | 'local'
  const [cloudSaveStatus,setCloudSaveStatus]=useState(null); // null | 'saving' | 'saved' | 'error'
  const [clientData,setClientData]=useState({
    nome:'',razaoSocial:'',cnpj:'',cpf:'',tipo:'pj',
    endereco:'',cidade:'',uf:'',cep:'',
    contato:'',telefone:'',email:'',
    projetoNome:'',projetoRef:'',obs:''
  });

  // ── Auto-save: always localStorage + cloud if storageMode=cloud ──
  useEffect(()=>{
    if(!project || !editingProjectId) return;

    // 1. Always save to localStorage (instant cache)
    const projects=getSavedProjects();
    const idx=projects.findIndex(p=>p.id===editingProjectId);
    const updated={
      id:editingProjectId,
      name:project.name,
      client:{...project.client},
      scenario:project.scenario,
      floors:project.floors,
      activeFloor:project.activeFloor,
      settings:project.settings,
      crossFloorConnections:project.crossFloorConnections||[],
      storageMode: storageMode,
      createdAt:idx>=0?projects[idx].createdAt:new Date().toISOString().split('T')[0],
      updatedAt:new Date().toISOString().split('T')[0],
      deviceCount:project.floors.flatMap(f=>f.devices).length,
      status:'rascunho'
    };
    if(idx>=0) projects[idx]=updated;
    else projects.push(updated);
    saveProjects(projects);

    // 2. If cloud mode + logged in: debounced cloud save
    if(storageMode === 'cloud' && user){
      setCloudSaveStatus('saving');
      getAccessToken().then(token => {
        if(!token) { setCloudSaveStatus('error'); return; }
        debouncedSaveCloud(project, editingProjectId, user.id, token, 2000);
        // Mark saved after debounce + estimated save time
        setTimeout(() => setCloudSaveStatus('saved'), 3000);
      });
      // Also cache locally for offline access
      setCachedProject(editingProjectId, updated);
    }
  },[project,editingProjectId]);

  // Cancel pending save when leaving project
  useEffect(() => {
    return () => cancelPendingSave(editingProjectId);
  }, [editingProjectId]);

  const [limitMsg,setLimitMsg]=useState('');
  const onStartNewProject=()=>{
    const projects=getSavedProjects();
    const localCount = projects.filter(p => !p.storageMode || p.storageMode === 'local').length;
    // For cloud projects, the limit is enforced by the DB trigger
    // For local projects, enforce client-side
    if(limits.maxProjects !== -1 && projects.length >= limits.maxProjects){
      setLimitMsg(`Limite de ${limits.maxProjects} projeto(s) no plano ${limits.planName}. Faça upgrade para criar mais projetos.`);
      return;
    }
    setLimitMsg('');
    setStorageMode('cloud'); // default to cloud for new projects
    setClientData({nome:'',razaoSocial:'',cnpj:'',cpf:'',tipo:'pj',endereco:'',cidade:'',uf:'',cep:'',contato:'',telefone:'',email:'',projetoNome:'',projetoRef:'',obs:''});
    setScreen('client');
  };

  const onOpenProject = useCallback(async (proj) => {
    // If cloud project without floors loaded, fetch from Supabase
    if (proj.storageMode === 'cloud' && (!proj.floors || proj.floors.length === 0 || proj._needsCloudLoad)) {
      const token = await getAccessToken();
      if (token) {
        const { project: cloudProj, error } = await loadCloudProject(proj.id, token);
        if (!error && cloudProj) {
          clearHistory(); // Clear history only after successful cloud load
          const p = {
            name: cloudProj.name, scenario: cloudProj.scenario, client: { ...cloudProj.client },
            floors: cloudProj.floors.map(f => ({ ...f, racks: f.racks || [], quadros: f.quadros || [] })),
            activeFloor: cloudProj.activeFloor, settings: cloudProj.settings,
            crossFloorConnections: cloudProj.crossFloorConnections || [],
          };
          migrateProjectKeys(p); syncUid(p); dedupDeviceIds(p);
          setProject(p);
          setEditingProjectId(proj.id);
          setStorageMode('cloud');
          setScreen('project');
          return;
        }
        console.warn('[App] Cloud load failed, trying local cache:', error?.message);
      }
    }

    // Local project or fallback
    clearHistory(); // Clear history for local/fallback load
    const p = {
      name: proj.name, scenario: proj.scenario, client: { ...proj.client },
      floors: (proj.floors || []).map(f => ({ ...f, racks: f.racks || [], quadros: f.quadros || [] })),
      activeFloor: proj.activeFloor, settings: proj.settings,
      crossFloorConnections: proj.crossFloorConnections || [],
    };
    migrateProjectKeys(p); syncUid(p); dedupDeviceIds(p);
    setProject(p);
    setEditingProjectId(proj.id);
    setStorageMode(proj.storageMode || 'local');
    setScreen('project');
  }, [clearHistory, getAccessToken]);

  // Config error guard
  if(configError) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#F0F5FA',color:'#1e293b',fontFamily:'system-ui,sans-serif'}}>
      <div style={{textAlign:'center',maxWidth:500,padding:40}}>
        <div style={{fontSize:48,marginBottom:16}}>⚙️</div>
        <h2 style={{marginBottom:8}}>Configuração Pendente</h2>
        <p style={{color:'#94a3b8',fontSize:14,lineHeight:1.6}}>
          As variáveis de ambiente do Supabase não foram configuradas.<br/>
          Configure <code style={{background:'rgba(4,107,210,.08)',padding:'2px 6px',borderRadius:4}}>VITE_SUPABASE_URL</code> e{' '}
          <code style={{background:'rgba(4,107,210,.08)',padding:'2px 6px',borderRadius:4}}>VITE_SUPABASE_ANON_KEY</code> no
          painel do Vercel (Settings → Environment Variables) e faça um novo deploy.
        </p>
      </div>
    </div>
  );

  // ── URL-based flows (invite / password recovery) ──
  const urlParams = new URLSearchParams(window.location.search)
  const inviteToken = urlParams.get('invite')
  const urlType = urlParams.get('type')

  // Auth guard
  if(authLoading) return <><LoadingScreen/><VersionBadge/></>;

  // Invite registration (no auth required)
  if(inviteToken) return <><InviteRegisterPage token={inviteToken} onDone={() => { window.history.replaceState({}, '', '/'); window.location.reload() }} /><VersionBadge/></>;

  // Password recovery (user arrives authenticated via Supabase recovery link)
  if(urlType === 'recovery' && user) return <><ResetPasswordPage onDone={() => { window.history.replaceState({}, '', '/'); window.location.reload() }} /><VersionBadge/></>;

  if(!user) return <><LoginPage/><VersionBadge/></>;

  let content;

  if(screen==='admin' && isAdmin) content = <AdminPage onBack={()=>setScreen('dashboard')}/>;

  else if(screen==='dashboard') content = <Dashboard
    onNewProject={onStartNewProject}
    onOpenProject={()=>setScreen('projects')}
    onClients={()=>setScreen('clients')}
    onRepo={()=>setScreen('repo')}
    onSettings={()=>setScreen('settings')}
    onSubscription={()=>setScreen('subscription')}
    onProfile={()=>setScreen('profile')}
    onAdmin={isAdmin?()=>setScreen('admin'):null}
    limitMsg={limitMsg}
    onDismissLimit={()=>setLimitMsg('')}
  />;

  else if(screen==='projects') content = <ProjectListPage onBack={()=>setScreen('dashboard')} onOpenProject={onOpenProject}/>;

  else if(screen==='client') content = <ClientForm data={clientData} setData={setClientData} storageMode={storageMode} onStorageModeChange={setStorageMode} onBack={()=>setScreen('dashboard')} onStart={(scenario)=>{
    const projId='proj_'+Date.now();
    const newProj={
      name:clientData.projetoNome||'Novo Projeto',
      scenario,
      client:{...clientData},
      floors:[{id:'f1',name:'Térreo',number:0,devices:[],connections:[],environments:[],racks:[],quadros:[],bgScale:1.0}],
      activeFloor:'f1',
      settings:{taxRate:0,additionalFees:[]},
    };
    setProject(newProj);
    setEditingProjectId(projId);
    const clients=getSavedClients();
    const existing=clients.findIndex(c=>c.id===clientData.id);
    if(existing>=0) clients[existing]={...clientData,id:clientData.id||'cli_'+Date.now()};
    else clients.push({...clientData,id:'cli_'+Date.now()});
    saveClients(clients);
    setScreen('project');
  }}/>;

  else if(screen==='clients') content = <ClientListPage onBack={()=>setScreen('dashboard')} onSelectClient={(client)=>{ setClientData(client); setScreen('client'); }}/>;

  else if(screen==='repo') content = <EquipmentRepoPage onBack={()=>setScreen('dashboard')} />;

  else if(screen==='settings') content = <SettingsPage onBack={()=>setScreen('dashboard')} />;

  else if(screen==='profile') content = <ProfilePage onBack={()=>setScreen('dashboard')} />;

  else if(screen==='subscription') content = <SubscriptionPage onBack={()=>setScreen('dashboard')} onProfile={()=>setScreen('profile')} />;

  else content = <ProjectApp project={project} setProject={setProject} undo={undo} redo={redo} cloudSaveStatus={cloudSaveStatus} storageMode={storageMode} onBack={()=>setScreen('dashboard')}/>;

  return <>{content}{screen!=='client'&&<VersionBadge/>}</>;
}
