import React from 'react';

export default function CablePropertiesPanel({conn, cableType, fromDev, toDev, updateConnection, onDelete, onClose}){
  if(!conn) return null;
  return (
    <div>
      <div className="prop-header">
        <div className="ph-icon" style={{fontSize:20}}>🔌</div>
        <div className="ph-info">
          <div className="ph-name">{conn.label||'Cabo sem nome'}</div>
          <div className="ph-model">{cableType?.name}</div>
        </div>
        <span className="ph-replace" onClick={onClose} style={{cursor:'pointer'}}>✕</span>
      </div>
      <div className="prop-section">
        <div className="prop-row">
          <span className="pr-label">Nome:</span>
          <span className="pr-value">
            <input value={conn.label||''} onChange={e=>updateConnection(conn.id,{label:e.target.value})} placeholder="Ex: Cabo A"/>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Tipo:</span>
          <span className="pr-value" style={{fontWeight:600,color:'var(--azul)'}}>{cableType?.name}</span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Metragem:</span>
          <span className="pr-value">
            <input type="number" min="0" value={conn.distance||0} onChange={e=>updateConnection(conn.id,{distance:parseFloat(e.target.value)||0})} style={{width:'60px'}}/>
            <span style={{marginLeft:6,fontSize:10}}>m</span>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Cor:</span>
          <span className="pr-value">
            <input type="color" value={conn.cableColor||cableType?.color||'#3b82f6'} onChange={e=>updateConnection(conn.id,{cableColor:e.target.value})} style={{width:40,height:28,border:'1px solid #ddd',borderRadius:4,cursor:'pointer'}}/>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Tag/ID:</span>
          <span className="pr-value">
            <input value={conn.tag||''} onChange={e=>updateConnection(conn.id,{tag:e.target.value})} placeholder="Ex: CB-001"/>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Seção (mm²):</span>
          <span className="pr-value">
            <select value={conn.secao||''} onChange={e=>updateConnection(conn.id,{secao:e.target.value?parseFloat(e.target.value):undefined})}>
              <option value="">Nenhuma</option>
              <option value="0.5">0,5</option>
              <option value="0.75">0,75</option>
              <option value="1.0">1,0</option>
              <option value="1.5">1,5</option>
              <option value="2.5">2,5</option>
              <option value="4.0">4,0</option>
              <option value="6.0">6,0</option>
              <option value="10.0">10,0</option>
            </select>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Rota/Percurso:</span>
          <span className="pr-value">
            <input value={conn.rota||''} onChange={e=>updateConnection(conn.id,{rota:e.target.value})} placeholder="Ex: Eletrocalha superior → Rack CPD"/>
          </span>
        </div>
        <div className="prop-row">
          <span className="pr-label">De:</span>
          <span className="pr-value" style={{fontWeight:600,color:'var(--azul)'}}>{fromDev?.name||'?'}</span>
        </div>
        <div className="prop-row">
          <span className="pr-label">Para:</span>
          <span className="pr-value" style={{fontWeight:600,color:'var(--azul)'}}>{toDev?.name||'?'}</span>
        </div>
      </div>
      <div className="prop-actions" style={{marginTop:16}}>
        <button className="btn-delete" onClick={onDelete}>🗑️ Excluir cabo</button>
      </div>
    </div>
  );
}
