import React, { useState, useEffect } from 'react';
import { getSavedProjects, saveProjects, getCachedCloudProjects, setCachedCloudProjects, removeCachedProject } from '@/lib/helpers';
import { listCloudProjects, deleteCloudProject, saveCloudProject } from '@/lib/projectStorage';
import { validateProjectData } from '@/lib/projectValidator';
import { useAuth } from '../contexts/AuthContext';
import { Cloud, HardDrive, Trash2, Upload, Download, Loader2 } from 'lucide-react';

export default function ProjectListPage({onBack,onOpenProject}){
  const { user, getAccessToken } = useAuth();
  const [localProjects,setLocalProjects]=useState(getSavedProjects());
  const [cloudProjects,setCloudProjects]=useState(getCachedCloudProjects());
  const [loadingCloud,setLoadingCloud]=useState(false);
  const [search,setSearch]=useState('');
  const [migrating,setMigrating]=useState(null);
  const [showMigrationDialog,setShowMigrationDialog]=useState(false);

  // Fetch cloud projects on mount
  useEffect(()=>{
    if(!user) return;
    (async()=>{
      setLoadingCloud(true);
      const token = await getAccessToken();
      if(!token){ setLoadingCloud(false); return; }
      const { projects, error } = await listCloudProjects(token);
      if(!error){
        setCloudProjects(projects);
        setCachedCloudProjects(projects);
      }
      setLoadingCloud(false);

      // Check for migration: user has local projects but no cloud ones
      const localOnly = getSavedProjects().filter(p => !p.storageMode || p.storageMode === 'local');
      if(localOnly.length > 0 && projects.length === 0){
        setShowMigrationDialog(true);
      }
    })();
  },[user]);

  // Merge local + cloud, deduplicate by id
  const allProjects = React.useMemo(()=>{
    const map = new Map();
    cloudProjects.forEach(p => map.set(p.id, { ...p, _source: 'cloud', storageMode: 'cloud', _needsCloudLoad: true }));
    localProjects.forEach(p => {
      if(!map.has(p.id)){
        map.set(p.id, { ...p, _source: p.storageMode === 'cloud' ? 'cloud-cached' : 'local' });
      }
    });
    return Array.from(map.values());
  },[localProjects, cloudProjects]);

  const filtered=allProjects.filter(p=>
    (p.name||'').toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.nome||'').toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete=async(proj)=>{
    if(!confirm('Tem certeza que deseja deletar este projeto?')) return;

    if(proj.storageMode === 'cloud' || proj._source === 'cloud'){
      const token = await getAccessToken();
      if(!token){ alert('Erro: sem autenticação. Faça login novamente.'); return; }
      const { error } = await deleteCloudProject(proj.id, token);
      if(error){ alert('Erro ao deletar do cloud: '+error.message); return; }
      setCloudProjects(prev => prev.filter(p=>p.id!==proj.id));
      setCachedCloudProjects(cloudProjects.filter(p=>p.id!==proj.id));
      removeCachedProject(proj.id);
    }

    const updated=localProjects.filter(p=>p.id!==proj.id);
    setLocalProjects(updated);
    saveProjects(updated);
  };

  const handleMoveToCloud=async(proj)=>{
    setMigrating(proj.id);
    const token = await getAccessToken();
    if(!token){ alert('Erro: sem token de acesso'); setMigrating(null); return; }

    const fullProj = localProjects.find(p=>p.id===proj.id);
    if(!fullProj){ setMigrating(null); return; }

    const appProj = { name:fullProj.name, scenario:fullProj.scenario, client:fullProj.client, floors:fullProj.floors, activeFloor:fullProj.activeFloor, settings:fullProj.settings };
    const { error } = await saveCloudProject(appProj, proj.id, user.id, token);

    if(error){
      alert('Erro ao mover para nuvem: '+error.message);
      setMigrating(null);
      return;
    }

    const updated = localProjects.map(p => p.id === proj.id ? {...p, storageMode:'cloud'} : p);
    setLocalProjects(updated);
    saveProjects(updated);

    const { projects } = await listCloudProjects(token);
    if(projects){ setCloudProjects(projects); setCachedCloudProjects(projects); }
    setMigrating(null);
  };

  const handleMigrateAll=async()=>{
    setShowMigrationDialog(false);
    const token = await getAccessToken();
    if(!token) return;

    const localOnly = localProjects.filter(p => !p.storageMode || p.storageMode === 'local');
    for(const proj of localOnly){
      setMigrating(proj.id);
      const appProj = { name:proj.name, scenario:proj.scenario, client:proj.client, floors:proj.floors, activeFloor:proj.activeFloor, settings:proj.settings };
      const { error } = await saveCloudProject(appProj, proj.id, user.id, token);
      if(error){
        console.warn('[migrate] Failed:', proj.id, error.message);
        break;
      }
    }
    const updated = localProjects.map(p => ({...p, storageMode:'cloud'}));
    setLocalProjects(updated);
    saveProjects(updated);

    const { projects } = await listCloudProjects(token);
    if(projects){ setCloudProjects(projects); setCachedCloudProjects(projects); }
    setMigrating(null);
  };

  const handleExport=(proj)=>{
    const fullProj = localProjects.find(p=>p.id===proj.id) || proj;
    const exportData = {
      _format: 'bim-protector',
      _version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        id: fullProj.id, name: fullProj.name, scenario: fullProj.scenario,
        client: fullProj.client, floors: fullProj.floors,
        activeFloor: fullProj.activeFloor, settings: fullProj.settings,
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fullProj.name||'projeto').replace(/[^a-zA-Z0-9]/g,'_')}.bim.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport=()=>{
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.bim.json';
    input.onchange = (e)=>{
      const file = e.target.files[0];
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (ev)=>{
        try{
          const data = JSON.parse(ev.target.result);
          const { valid, errors, project: validatedProj } = validateProjectData(data, file.size);
          if(!valid || !validatedProj){
            alert('Erro na validação:\n' + errors.join('\n'));
            return;
          }
          if(errors.length > 0){
            console.warn('[import] Warnings:', errors);
          }
          const proj = validatedProj;
          proj.id = 'proj_' + Date.now();
          proj.storageMode = 'local';
          proj.createdAt = new Date().toISOString().split('T')[0];
          proj.updatedAt = new Date().toISOString().split('T')[0];
          proj.deviceCount = (proj.floors||[]).flatMap(f=>f.devices||[]).length;
          proj.status = 'rascunho';
          const updated = [...localProjects, proj];
          setLocalProjects(updated);
          saveProjects(updated);
        }catch(err){
          alert('Erro ao importar: '+err.message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div className="dashboard-list" style={{maxWidth:'900px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <h3 style={{margin:0}}>Projetos Salvos</h3>
            <button onClick={handleImport} style={{
              background:'rgba(4,107,210,.15)',border:'1px solid rgba(4,107,210,.3)',color:'#93c5fd',
              padding:'6px 14px',borderRadius:6,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',gap:6
            }}>
              <Download size={14}/> Importar .bim.json
            </button>
          </div>

          <input type="text" className="search-input" placeholder="Buscar por nome ou cliente..." value={search} onChange={e=>setSearch(e.target.value)}/>

          {loadingCloud && (
            <div style={{display:'flex',alignItems:'center',gap:8,padding:'12px 16px',fontSize:12,color:'#94a3b8'}}>
              <Loader2 size={14} className="spin"/> Carregando projetos da nuvem...
            </div>
          )}

          {showMigrationDialog && (
            <div style={{
              padding:'16px 20px',marginBottom:12,borderRadius:8,
              background:'rgba(4,107,210,.1)',border:'1px solid rgba(4,107,210,.25)',
            }}>
              <div style={{fontSize:13,color:'#93c5fd',fontWeight:600,marginBottom:8}}>
                <Cloud size={16} style={{verticalAlign:'middle',marginRight:6}}/>
                Sincronizar projetos com a nuvem?
              </div>
              <p style={{fontSize:12,color:'#64748b',margin:'0 0 12px'}}>
                Voce tem {localProjects.filter(p=>!p.storageMode||p.storageMode==='local').length} projeto(s) local(is).
                Deseja mover para a nuvem? Assim eles ficam seguros e acessiveis de qualquer lugar.
              </p>
              <div style={{display:'flex',gap:8}}>
                <button onClick={handleMigrateAll} style={{
                  background:'#046bd2',color:'#fff',border:'none',padding:'6px 16px',borderRadius:6,fontSize:12,cursor:'pointer'
                }}>Sim, mover para nuvem</button>
                <button onClick={()=>setShowMigrationDialog(false)} style={{
                  background:'transparent',color:'#94a3b8',border:'1px solid #E2E8F0',
                  padding:'6px 16px',borderRadius:6,fontSize:12,cursor:'pointer'
                }}>Depois</button>
              </div>
            </div>
          )}

          {filtered.length===0?(
            <p style={{color:'#94a3b8',fontSize:12,textAlign:'center',padding:'20px'}}>Nenhum projeto encontrado</p>
          ):(
            filtered.map(p=>(
              <div key={p.id} className="list-item" style={{position:'relative'}}>
                <div className="list-item-info">
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <h4 style={{margin:0}}>{p.name}</h4>
                    {(p.storageMode === 'cloud' || p._source === 'cloud') ? (
                      <span title="Salvo na nuvem" style={{color:'#60a5fa',display:'flex',alignItems:'center'}}><Cloud size={14}/></span>
                    ) : (
                      <span title="Salvo localmente" style={{color:'#94a3b8',display:'flex',alignItems:'center'}}><HardDrive size={14}/></span>
                    )}
                  </div>
                  <p>Cliente: {p.client?.nome||'--'} · {p.device_count ?? p.deviceCount ?? 0} dispositivos · {p.updated_at?.split('T')[0] || p.updatedAt || '--'}</p>
                </div>
                <div className="list-actions" style={{display:'flex',gap:6,alignItems:'center'}}>
                  {migrating === p.id && <Loader2 size={14} className="spin" style={{color:'#60a5fa'}}/>}

                  {(!p.storageMode || p.storageMode === 'local') && p._source !== 'cloud' && (
                    <button className="list-btn" title="Mover para nuvem" onClick={()=>handleMoveToCloud(p)} disabled={migrating===p.id}
                      style={{padding:'4px 8px',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                      <Upload size={12}/> Nuvem
                    </button>
                  )}

                  <button className="list-btn" title="Exportar JSON" onClick={()=>handleExport(p)} style={{padding:'4px 8px',fontSize:11,display:'flex',alignItems:'center',gap:4}}>
                    <Download size={12}/>
                  </button>
                  <button className="list-btn" onClick={()=>onOpenProject(p)}>Abrir</button>
                  <button className="list-btn" onClick={()=>handleDelete(p)} style={{color:'#f87171'}}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
