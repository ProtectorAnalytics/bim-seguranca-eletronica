import React from 'react';
import { SCENARIOS, APP_VERSION } from '@/data/constants';
import { Cloud, HardDrive } from 'lucide-react';

export default function ScenarioSelect({clientData,storageMode,onStorageModeChange,onBack,onStart}){
  const displayName=clientData.razaoSocial||clientData.nome||'Cliente';
  return (
    <div className="landing">
      <img src="/logo-proti.png" alt="Protector" style={{height:48,marginBottom:8,filter:'drop-shadow(0 2px 8px rgba(0,0,0,.15))'}}/>
      <div style={{fontSize:11,color:'#94a3b8',marginBottom:8}}>{APP_VERSION.label} · {APP_VERSION.date}</div>
      <div style={{fontSize:13,color:'var(--azul)',marginBottom:4,fontWeight:600}}>{displayName}</div>
      <div className="landing-sub">Selecione o cenário do projeto</div>

      {/* Storage mode toggle */}
      {onStorageModeChange && (
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,marginBottom:16}}>
          <span style={{fontSize:11,color:'#64748b'}}>Salvar em:</span>
          <button
            onClick={()=>onStorageModeChange('cloud')}
            style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
              border: storageMode==='cloud' ? '2px solid var(--azul)' : '1px solid var(--cinzaM)',
              background: storageMode==='cloud' ? 'rgba(4,107,210,.08)' : 'var(--branco)',
              color: storageMode==='cloud' ? 'var(--azul)' : '#64748b',
              transition:'.2s',fontWeight:600,
            }}
          >
            <Cloud size={13}/> Nuvem
          </button>
          <button
            onClick={()=>onStorageModeChange('local')}
            style={{
              display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:6,fontSize:11,cursor:'pointer',
              border: storageMode==='local' ? '2px solid #64748b' : '1px solid var(--cinzaM)',
              background: storageMode==='local' ? 'rgba(100,116,139,.08)' : 'var(--branco)',
              color: storageMode==='local' ? '#1e293b' : '#94a3b8',
              transition:'.2s',fontWeight:600,
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
      <button onClick={onBack} style={{marginTop:24,background:'var(--branco)',border:'1px solid var(--cinzaM)',
        color:'#64748b',padding:'8px 20px',borderRadius:8,fontSize:11,cursor:'pointer',transition:'.2s',fontWeight:600}}>
        ← Voltar aos dados do cliente
      </button>
    </div>
  );
}
