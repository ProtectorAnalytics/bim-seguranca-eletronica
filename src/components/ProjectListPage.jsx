import React, { useState } from 'react';
import { getSavedProjects, saveProjects } from '@/lib/helpers';

export default function ProjectListPage({onBack,onOpenProject}){
  const [projects,setProjects]=useState(getSavedProjects());
  const [search,setSearch]=useState('');

  const filtered=projects.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())||(p.client?.nome||'').toLowerCase().includes(search.toLowerCase()));

  const handleDelete=(id)=>{
    if(confirm('Tem certeza que deseja deletar este projeto?')){
      const updated=projects.filter(p=>p.id!==id);
      setProjects(updated);
      saveProjects(updated);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div className="dashboard-list" style={{maxWidth:'900px'}}>
          <h3>Projetos Salvos</h3>
          <input type="text" className="search-input" placeholder="Buscar por nome ou cliente..." value={search} onChange={e=>setSearch(e.target.value)}/>

          {filtered.length===0?(
            <p style={{color:'rgba(255,255,255,.5)',fontSize:12,textAlign:'center',padding:'20px'}}>Nenhum projeto encontrado</p>
          ):(
            filtered.map(p=>(
              <div key={p.id} className="list-item">
                <div className="list-item-info">
                  <h4>{p.name}</h4>
                  <p>Cliente: {p.client?.nome||'--'} · {p.deviceCount} dispositivos · {p.updatedAt}</p>
                </div>
                <div className="list-actions">
                  <button className="list-btn" onClick={()=>onOpenProject(p)}>Abrir</button>
                  <button className="list-btn" onClick={()=>handleDelete(p.id)}>Deletar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
