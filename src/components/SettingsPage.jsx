import React, { useState } from 'react';
import { getSettings, saveSettings } from '@/lib/helpers';

export default function SettingsPage({onBack}){
  const [settings,setSettings]=useState(getSettings());

  const upd=(k,v)=>{
    const updated={...settings,[k]:v};
    setSettings(updated);
    saveSettings(updated);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div className="dashboard-list" style={{maxWidth:'720px'}}>
          <h3>Configurações da Empresa</h3>

          <div style={{display:'flex',flexDirection:'column',gap:18}}>
            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>Nome da Empresa</label>
              <input type="text" value={settings.nomeEmpresa||''} onChange={e=>upd('nomeEmpresa',e.target.value)}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="Protector Sistemas"/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>CNPJ</label>
              <input type="text" value={settings.cnpj||''} onChange={e=>upd('cnpj',e.target.value)}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="XX.XXX.XXX/0001-XX"/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>Endereço</label>
              <input type="text" value={settings.endereco||''} onChange={e=>upd('endereco',e.target.value)}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="Rua, número, complemento"/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>Telefone</label>
              <input type="text" value={settings.telefone||''} onChange={e=>upd('telefone',e.target.value)}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="(XX) XXXXX-XXXX"/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>E-mail</label>
              <input type="email" value={settings.email||''} onChange={e=>upd('email',e.target.value)}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="contato@empresa.com"/>
            </div>

            <div>
              <label style={{color:'rgba(255,255,255,.65)',fontSize:12,textTransform:'uppercase',fontWeight:600,letterSpacing:'.5px',display:'block',marginBottom:8}}>Taxa Padrão (%)</label>
              <input type="number" value={settings.taxaPadrao||0} onChange={e=>upd('taxaPadrao',parseFloat(e.target.value))}
                style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.1)',border:'1px solid rgba(255,255,255,.15)',borderRadius:6,color:'#fff',fontSize:14,fontFamily:'inherit',transition:'border-color .15s'}}
                placeholder="0"/>
            </div>
          </div>

          <p style={{marginTop:24,fontSize:13,color:'rgba(255,255,255,.45)'}}>As configurações são salvas automaticamente.</p>
        </div>
      </div>
    </div>
  );
}
