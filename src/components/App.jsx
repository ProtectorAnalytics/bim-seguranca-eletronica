import React, { useState, useEffect, useRef } from 'react';
import { getSavedProjects, saveProjects, getSavedClients, saveClients, syncUid, dedupDeviceIds, migrateProjectKeys } from '@/lib/helpers';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';
import LoginPage from './LoginPage';
import Dashboard from './Dashboard';
import ProjectListPage from './ProjectListPage';
import ClientForm from './ClientForm';
import ScenarioSelect from './ScenarioSelect';
import ClientListPage from './ClientListPage';
import EquipmentRepoPage from './EquipmentRepoPage';
import SettingsPage from './SettingsPage';
import SubscriptionPage from './SubscriptionPage';
import AdminPage from './AdminPage';
import UpgradeBanner from './UpgradeBanner';
import ProjectApp from './ProjectApp';
import { useSubscription } from '../hooks/useSubscription';

export default function App(){
  const { user, loading: authLoading, isAdmin } = useAuth();
  const limits = useSubscription();
  const [screen,setScreen]=useState('dashboard'); // dashboard | projects | client | scenario | project | clients | repo | settings | subscription | admin
  const [project,_setProject]=useState(null);
  const _historyStore=useRef({past:[],future:[]});
  const _skipHistory=useRef(false);
  const setProject=(updaterOrVal)=>{
    _setProject(prev=>{
      try{
        const next=typeof updaterOrVal==='function'?updaterOrVal(prev):updaterOrVal;
        if(!_skipHistory.current && prev && next){
          try{
            const ps=JSON.stringify(prev);const ns=JSON.stringify(next);
            if(ps!==ns){const h=_historyStore.current;h.past.push(ps);if(h.past.length>50)h.past.shift();h.future=[];}
          }catch(e){console.warn('History snapshot failed',e)}
        }
        _skipHistory.current=false;
        return next;
      }catch(e){console.error('setProject error',e);_skipHistory.current=false;return prev;}
    });
  };
  const undo=()=>{
    try{
      const h=_historyStore.current;
      if(!h||!h.past||!h.past.length) return;
      _setProject(prev=>{
        h.future.push(JSON.stringify(prev));
        const restored=JSON.parse(h.past.pop());
        _skipHistory.current=true;
        return restored;
      });
    }catch(e){console.error('undo error',e)}
  };
  const redo=()=>{
    try{
      const h=_historyStore.current;
      if(!h||!h.future||!h.future.length) return;
      _setProject(prev=>{
        h.past.push(JSON.stringify(prev));
        const restored=JSON.parse(h.future.pop());
        _skipHistory.current=true;
        return restored;
      });
    }catch(e){console.error('redo error',e)}
  };
  const [editingProjectId,setEditingProjectId]=useState(null);
  const [clientData,setClientData]=useState({
    nome:'',razaoSocial:'',cnpj:'',cpf:'',tipo:'pj',
    endereco:'',cidade:'',uf:'',cep:'',
    contato:'',telefone:'',email:'',
    projetoNome:'',projetoRef:'',obs:''
  });

  // Auto-save project to localStorage
  useEffect(()=>{
    if(project && editingProjectId){
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
        createdAt:idx>=0?projects[idx].createdAt:new Date().toISOString().split('T')[0],
        updatedAt:new Date().toISOString().split('T')[0],
        deviceCount:project.floors.flatMap(f=>f.devices).length,
        status:'rascunho'
      };
      if(idx>=0) projects[idx]=updated;
      else projects.push(updated);
      saveProjects(projects);
    }
  },[project,editingProjectId]);

  const [limitMsg,setLimitMsg]=useState('');
  const onStartNewProject=()=>{
    const projects=getSavedProjects();
    if(projects.length >= limits.maxProjects){
      setLimitMsg(`Limite de ${limits.maxProjects} projeto(s) no plano ${limits.planName}. Faça upgrade para criar mais projetos.`);
      return;
    }
    setLimitMsg('');
    setClientData({nome:'',razaoSocial:'',cnpj:'',cpf:'',tipo:'pj',endereco:'',cidade:'',uf:'',cep:'',contato:'',telefone:'',email:'',projetoNome:'',projetoRef:'',obs:''});
    setScreen('client');
  };
  const onOpenProject=(proj)=>{ const p={name:proj.name,scenario:proj.scenario,client:{...proj.client},floors:proj.floors.map(f=>({...f,racks:f.racks||[],quadros:f.quadros||[]})),activeFloor:proj.activeFloor,settings:proj.settings}; migrateProjectKeys(p); syncUid(p); dedupDeviceIds(p); setProject(p); setEditingProjectId(proj.id); setScreen('project'); };

  // Auth guard
  if(authLoading) return <LoadingScreen/>;
  if(!user) return <LoginPage/>;

  if(screen==='admin' && isAdmin) return <AdminPage onBack={()=>setScreen('dashboard')}/>;

  if(screen==='dashboard') return <Dashboard
    onNewProject={onStartNewProject}
    onOpenProject={()=>setScreen('projects')}
    onClients={()=>setScreen('clients')}
    onRepo={()=>setScreen('repo')}
    onSettings={()=>setScreen('settings')}
    onSubscription={()=>setScreen('subscription')}
    onAdmin={isAdmin?()=>setScreen('admin'):null}
    limitMsg={limitMsg}
    onDismissLimit={()=>setLimitMsg('')}
  />;

  if(screen==='projects') return <ProjectListPage onBack={()=>setScreen('dashboard')} onOpenProject={onOpenProject}/>;

  if(screen==='client') return <ClientForm data={clientData} setData={setClientData} onNext={()=>setScreen('scenario')} onBack={()=>setScreen('dashboard')} />;

  if(screen==='scenario') return <ScenarioSelect clientData={clientData} onBack={()=>setScreen('client')} onStart={(scenario)=>{
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
    // Save client
    const clients=getSavedClients();
    const existing=clients.findIndex(c=>c.id===clientData.id);
    if(existing>=0) clients[existing]={...clientData,id:clientData.id||'cli_'+Date.now()};
    else clients.push({...clientData,id:'cli_'+Date.now()});
    saveClients(clients);
    setScreen('project');
  }}/>;

  if(screen==='clients') return <ClientListPage onBack={()=>setScreen('dashboard')} onSelectClient={(client)=>{ setClientData(client); setScreen('client'); }}/>;

  if(screen==='repo') return <EquipmentRepoPage onBack={()=>setScreen('dashboard')} />;

  if(screen==='settings') return <SettingsPage onBack={()=>setScreen('dashboard')} />;

  if(screen==='subscription') return <SubscriptionPage onBack={()=>setScreen('dashboard')} />;

  return <ProjectApp project={project} setProject={setProject} undo={undo} redo={redo} onBack={()=>setScreen('dashboard')}/>;
}
