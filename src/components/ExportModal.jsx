import React, { useState } from 'react';

export default function ExportModal({project,bom,allDevices,connections,onClose}){
  const [checks,setChecks]=useState({equipment:true,topology:true,floorplan:true});
  const toggle=(k)=>setChecks(c=>({...c,[k]:!c[k]}));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <h3>📋 Exportar Relatório</h3>
        <div style={{fontSize:12,color:'var(--cinza)',marginBottom:12}}>
          Projeto: <strong>{project.name}</strong> · {allDevices.length} dispositivos · {connections.length} conexões
          {project.client&&(project.client.razaoSocial||project.client.nome)&&(
            <div style={{marginTop:4}}>Cliente: <strong>{project.client.razaoSocial||project.client.nome}</strong>
              {project.client.cnpj&&` · CNPJ: ${project.client.cnpj}`}
              {project.client.cpf&&` · CPF: ${project.client.cpf}`}
            </div>
          )}
          {project.client?.projetoRef&&<div>Ref: {project.client.projetoRef}</div>}
        </div>
        <div className="mc-row">
          <input type="checkbox" checked={checks.equipment} onChange={()=>toggle('equipment')}/>
          <label onClick={()=>toggle('equipment')}>Lista de Materiais (BOM)</label>
        </div>
        <div className="mc-row">
          <input type="checkbox" checked={checks.topology} onChange={()=>toggle('topology')}/>
          <label onClick={()=>toggle('topology')}>Topologia de Rede</label>
        </div>
        <div className="mc-row">
          <input type="checkbox" checked={checks.floorplan} onChange={()=>toggle('floorplan')}/>
          <label onClick={()=>toggle('floorplan')}>Planta por Pavimento</label>
        </div>
        <div style={{marginTop:12}}>
          <div className="prop-row">
            <span className="pr-label">Autor:</span>
            <span className="pr-value"><input defaultValue="Protector Sistemas"/></span>
          </div>
          <div className="prop-row">
            <span className="pr-label">Empresa:</span>
            <span className="pr-value"><input defaultValue="Protector Sistemas"/></span>
          </div>
        </div>
        <div className="mc-actions">
          <button className="mc-btn mc-btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="mc-btn mc-btn-primary" onClick={()=>{alert('Exportação será implementada com backend');onClose()}}>
            Exportar PDF/XLSX
          </button>
        </div>
      </div>
    </div>
  );
}
