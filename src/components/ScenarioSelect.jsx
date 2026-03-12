import React from 'react';
import { SCENARIOS, APP_VERSION } from '@/data/constants';
import { Cloud, HardDrive } from 'lucide-react';

export default function ScenarioSelect({clientData,storageMode,onStorageModeChange,onBack,onStart}){
  const displayName=clientData.razaoSocial||clientData.nome||'Cliente';
  return (
    <div className="landing">
      <img src="/logo-proti.png" alt="Protector" style={{height:48,marginBottom:8,filter:'drop-shadow(0 2px 8px rgba(0,0,0,.15))'}}/>
      <div style={{fontSize:11,color:'var(--cinza)',marginBottom:8}}>{APP_VERSION.label} · {APP_VERSION.date}</div>
      <div style={{fontSize:13,color:'var(--laranja)',marginBottom:4,fontWeight:600}}>{displayName}</div>
      <div className="landing-sub">Selecione o cenário do projeto</div>

      {/* Storage mode toggle */}
      {onStorageModeChange && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16}}>
          <span style={{fontSize:11,color:'rgba(255,255,255,.5)'}}>Salvar em:</span>
          <button
            onClick={()=>onStorageModeChange('cloud')}
            style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
              border: storageMode==='cloud' ? '1px solid #046bd2' : '1px solid rgba(255,255,255,.15)',
              background: storageMode==='cloud' ? 'rgba(4,107,210,.2)' : 'transparent',
              color: storageMode==='cloud' ? '#93c5fd' : 'rgba(255,255,255,.4)',
              transition:'.2s',
            }}
          >
            <Cloud size={13}/> Nuvem
          </button>
          <button
            onClick={()=>onStorageModeChange('local')}
            style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
              border: storageMode==='local' ? '1px solid #64748b' : '1px solid rgba(255,255,255,.15)',
              background: storageMode==='local' ? 'rgba(100,116,139,.2)' : 'transparent',
              color: storageMode==='local' ? '#cbd5e1' : 'rgba(255,255,255,.4)',
              transition:'.2s',
            }}
          >
            <HardDrive size={13}/> Local
          </button>
        </div>
      )}

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
