import React from 'react';
import { SCENARIOS, APP_VERSION } from '@/data/constants';

export default function ScenarioSelect({clientData,onBack,onStart}){
  const displayName=clientData.razaoSocial||clientData.nome||'Cliente';
  return (
    <div className="landing">
      <div className="landing-logo">PROTECTOR SISTEMAS</div>
      <div className="landing-title">BIM Segurança Eletrônica</div>
      <div style={{fontSize:11,color:'var(--cinza)',marginTop:-8,marginBottom:8}}>{APP_VERSION.label} · {APP_VERSION.date}</div>
      <div style={{fontSize:13,color:'var(--laranja)',marginBottom:4,fontWeight:600}}>📋 {displayName}</div>
      <div className="landing-sub">Selecione o cenário do projeto</div>
      <div className="scenario-grid">
        {SCENARIOS.map(s=>(
          <div key={s.id} className="scenario-card" onClick={()=>onStart(s.id)}>
            <div className="sc-icon">{s.icon}</div>
            <h4>{s.name}</h4>
            <p>{s.desc}</p>
          </div>
        ))}
      </div>
      <button onClick={onBack} style={{marginTop:24,background:'transparent',border:'1px solid rgba(255,255,255,.2)',
        color:'rgba(255,255,255,.5)',padding:'8px 20px',borderRadius:8,fontSize:11,cursor:'pointer',transition:'.2s'}}
        onMouseOver={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.4)'}
        onMouseOut={e=>e.currentTarget.style.borderColor='rgba(255,255,255,.2)'}>
        ← Voltar aos dados do cliente
      </button>
    </div>
  );
}
