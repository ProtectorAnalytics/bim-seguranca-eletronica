import React from 'react';

export default function SubscriptionPage({onBack}){
  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div className="dashboard-list" style={{maxWidth:'720px'}}>
          <h3>Informações de Assinatura</h3>

          <div style={{display:'grid',gap:20,marginTop:24}}>
            <div>
              <p style={{fontSize:12,color:'rgba(255,255,255,.55)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>PLANO ATUAL</p>
              <p style={{fontSize:20,fontWeight:700}}>Trial</p>
            </div>

            <div>
              <p style={{fontSize:12,color:'rgba(255,255,255,.55)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>VALIDADE</p>
              <p style={{fontSize:16}}>--</p>
            </div>

            <div>
              <p style={{fontSize:12,color:'rgba(255,255,255,.55)',marginBottom:6,fontWeight:600,textTransform:'uppercase',letterSpacing:'.5px'}}>STATUS</p>
              <p style={{fontSize:15,color:'rgba(255,255,255,.7)'}}>Aguardando integração com provedor</p>
            </div>

            <button style={{padding:'14px 24px',background:'var(--laranja)',color:'#000',border:'none',borderRadius:8,fontWeight:700,fontSize:14,cursor:'not-allowed',opacity:.5,marginTop:20}}>
              Gerenciar Assinatura (desabilitado)
            </button>
          </div>

          <p style={{marginTop:24,fontSize:13,color:'rgba(255,255,255,.45)'}}>Esta página será integrada com o provedor de pagamento em breve.</p>
        </div>
      </div>
    </div>
  );
}
