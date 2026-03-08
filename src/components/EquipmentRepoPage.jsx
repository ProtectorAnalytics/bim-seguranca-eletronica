import React, { useState } from 'react';
import { getCustomDevices, saveCustomDevices } from '@/lib/helpers';
import EquipmentRepoModal from './EquipmentRepoModal';

function EquipmentRepoAddButton({customDevices,onSave}){
  const [showModal,setShowModal]=useState(false);
  return <>
    <button onClick={()=>setShowModal(true)}
      style={{padding:'10px 24px',fontSize:13,background:'var(--laranja)',color:'#000',border:'none',
        borderRadius:8,cursor:'pointer',fontWeight:700}}>+ Novo equipamento</button>
    {showModal&&<EquipmentRepoModal customDevices={customDevices} onSave={(dev)=>{onSave(dev);setShowModal(false);}}
      onDelete={()=>{}} onClose={()=>setShowModal(false)} startAtStep={2}/>}
  </>;
}

export default function EquipmentRepoPage({onBack}){
  const [customDevices,setCustomDevices]=useState(()=>getCustomDevices());

  const handleSave=(device)=>{
    const updated=[...customDevices.filter(d=>d.key!==device.key),device];
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  const handleDelete=(key)=>{
    const updated=customDevices.filter(d=>d.key!==key);
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  return (
    <div className="dashboard-container" style={{background:'#F0F2F5',minHeight:'100vh'}}>
      <div className="dashboard-content" style={{maxWidth:780,margin:'0 auto',padding:'24px 20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
          <button className="modal-back-btn" onClick={onBack} style={{margin:0}}>← Voltar ao Dashboard</button>
          <h2 style={{fontSize:20,fontWeight:700,color:'var(--azul)',margin:0}}>📦 Repositório de Equipamentos</h2>
        </div>

        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'var(--sombra)'}}>
          <div style={{fontSize:13,color:'var(--cinza)',marginBottom:16}}>
            Gerencie seus equipamentos personalizados para uso em projetos.
            Equipamentos criados aqui ficam disponíveis na paleta do canvas.
          </div>

          <div style={{maxHeight:400,overflowY:'auto',marginBottom:16,borderTop:'1px solid #e5e8eb',paddingTop:12}}>
            {customDevices.length===0?(
              <div style={{textAlign:'center',padding:'40px 16px',color:'var(--cinza)',fontSize:13}}>
                Nenhum equipamento personalizado ainda.<br/>Clique em <strong>"+ Novo equipamento"</strong> para cadastrar.
              </div>
            ):(
              customDevices.map(dev=>{
                const catColor={camera:'#f59e0b',acesso:'#3b82f6',fechadura:'#ef4444',
                  alarme:'#f97316',sensor:'#84cc16',switch_rede:'#06b6d4',gravador:'#8b5cf6',
                  fonte_energia:'#ec4899',nobreak:'#f43f5e',infra:'#6b7280'}[dev.category]||'#999';
                const categoryLabels={camera:'Câmeras',acesso:'Acesso',fechadura:'Fechadura',alarme:'Alarme',sensor:'Sensores',
                  switch_rede:'Switches',gravador:'Gravador',fonte_energia:'Fonte',nobreak:'Nobreak',infra:'Infraestrutura'};
                return (
                <div key={dev.id} style={{padding:14,marginBottom:10,background:'#f8f9fa',borderRadius:8,
                  borderLeft:'4px solid '+catColor,transition:'.15s'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:700,color:'var(--azul)',fontSize:14}}>{dev.name}</div>
                      <div style={{fontSize:11,color:'var(--cinza)',marginTop:3}}>
                        <span style={{background:catColor+'20',color:catColor,padding:'2px 8px',borderRadius:4,fontWeight:600,fontSize:10}}>{categoryLabels[dev.category]||dev.category}</span>
                        <span style={{marginLeft:8}}>Base: {dev.deviceType}</span>
                        {dev.referencia&&<span style={{marginLeft:8}}>Ref: {dev.referencia}</span>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button onClick={()=>{}}
                        style={{padding:'6px 14px',fontSize:11,background:'var(--azul2)',color:'#fff',border:'none',
                          borderRadius:6,cursor:'pointer',fontWeight:600}}>Editar</button>
                      <button onClick={()=>handleDelete(dev.key)}
                        style={{padding:'6px 14px',fontSize:11,background:'#fee2e2',color:'#dc2626',border:'none',
                          borderRadius:6,cursor:'pointer',fontWeight:600}}>Remover</button>
                    </div>
                  </div>
                  {dev.specs && Object.keys(dev.specs).length>0&&(
                    <div style={{fontSize:11,color:'var(--cinza)',display:'flex',gap:10,flexWrap:'wrap',marginTop:4}}>
                      {Object.entries(dev.specs).slice(0,5).map(([k,v])=>(
                        <span key={k} style={{background:'#e5e8eb',padding:'2px 6px',borderRadius:3,fontSize:10}}>{k}: {String(v)}</span>
                      ))}
                    </div>
                  )}
                </div>);
              })
            )}
          </div>

          <div style={{display:'flex',gap:10,borderTop:'1px solid #e5e8eb',paddingTop:16}}>
            <button onClick={onBack}
              style={{padding:'10px 20px',fontSize:13,background:'#e5e8eb',color:'var(--cinza)',border:'none',
                borderRadius:8,cursor:'pointer',fontWeight:600}}>← Voltar</button>
            <EquipmentRepoAddButton customDevices={customDevices} onSave={handleSave}/>
          </div>
        </div>
      </div>
    </div>
  );
}
