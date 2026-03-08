import React from 'react';
import { MODEL_CATALOG } from '@/data/model-catalog';

export default function ModelSelectorModal({deviceKey,onSelect,onCancel}){
  const catalogMap={nobreak_ac:'nobreak_ac',nobreak_dc:'nobreak_dc',bateria_ext:'bateria',modulo_bat:'modulo_bat'};
  const catalog=MODEL_CATALOG[catalogMap[deviceKey]];
  if(!catalog) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:600}}>
        <h3>Selecionar Modelo</h3>
        <div style={{fontSize:11,color:'var(--cinza)',marginBottom:16}}>
          Escolha um modelo do catálogo ou configure manualmente.
        </div>
        <div style={{maxHeight:300,overflowY:'auto',marginBottom:16}}>
          {catalog.map(model=>(
            <button key={model.id} onClick={()=>onSelect(model)}
              style={{display:'block',width:'100%',padding:10,marginBottom:6,border:'1px solid var(--cinzaM)',
                background:'#fafbfc',borderRadius:6,cursor:'pointer',textAlign:'left',transition:'.15s',fontSize:11}}
              onMouseOver={e=>e.currentTarget.style.background='#f0f7fd'}
              onMouseOut={e=>e.currentTarget.style.background='#fafbfc'}>
              <div style={{fontWeight:600,color:'var(--azul)'}}>{model.brand} {model.model}</div>
              <div style={{fontSize:9,color:'var(--cinza)',marginTop:3}}>
                {model.potenciaVA?`${model.potenciaVA}VA · `:model.potenciaW?`${model.potenciaW}W · `:''}
                {model.topologia||model.tipo}
              </div>
            </button>
          ))}
        </div>
        <div className="modal-card" style={{border:'1px solid var(--cinzaM)',padding:10,marginBottom:12,background:'#f8f9fa',borderRadius:6}}>
          <button onClick={()=>onSelect({id:'custom',custom:true})}
            style={{display:'block',width:'100%',padding:10,border:'1px dashed var(--azul2)',
              background:'transparent',borderRadius:4,cursor:'pointer',color:'var(--azul2)',fontSize:11,fontWeight:600}}>
            ⚙️ Configuração Personalizada
          </button>
        </div>
        <div className="modal-card" style={{display:'flex',gap:8}}>
          <button className="mc-btn mc-btn-secondary" onClick={onCancel} style={{flex:1}}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
