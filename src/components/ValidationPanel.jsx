import React from 'react';
import { REGRAS } from '@/data/validation-rules';

export default function ValidationPanel({validations, devices, setSelectedDevice, setRightTab}){
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
        <span style={{fontSize:11,fontWeight:700,color:'var(--azul)'}}>Validação IA</span>
        {validations.length===0&&devices.length>0&&
          <span style={{fontSize:9,padding:'2px 8px',borderRadius:10,background:'#E8F8F0',
            color:'var(--verde)',fontWeight:700}}>✓ OK</span>}
        {validations.length>0&&
          <span style={{fontSize:9,padding:'2px 8px',borderRadius:10,background:'#FEF5E7',
            color:'#E67E22',fontWeight:700}}>⚠ {validations.length} alerta(s)</span>}
      </div>
      {validations.map((v,i)=>(
        <div key={i} className={`val-card ${v.sev.toLowerCase()}`}>
          <div className="val-title">
            <span className={`val-sev sev-${v.sev.toLowerCase()}`}>{v.sev}</span>
            {v.cat}
          </div>
          <div className="val-body">{v.regra}</div>
          <div className="val-body" style={{fontWeight:600,marginTop:2}}>{v.msg}</div>
        </div>
      ))}
      {validations.length===0&&devices.length===0&&(
        <div style={{textAlign:'center',padding:20,color:'var(--cinza)',fontSize:11}}>
          Adicione dispositivos para validação</div>
      )}
      <div style={{marginTop:16,fontSize:10,color:'var(--cinza)',lineHeight:1.5}}>
        <strong>Regras ativas:</strong> {REGRAS.length}<br/>
        Categorias: Elétrica, Rede, CFTV, Acesso, Infra, Arquitetura
      </div>
    </div>
  );
}
