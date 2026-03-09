import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import LicenseRedeemForm from './LicenseRedeemForm';

export default function SubscriptionPage({onBack}){
  const { profile, subscription, refreshUserData } = useAuth();
  const limits = useSubscription();
  const [plans, setPlans] = useState([]);
  const [showRedeem, setShowRedeem] = useState(false);

  useEffect(() => {
    supabase.from('plans').select('*').eq('is_active', true).order('price_brl')
      .then(({ data }) => setPlans(data || []));
  }, []);

  const currentSlug = limits.planSlug;

  const planFeatures = (p) => {
    const f = [];
    f.push({ label: 'Projetos', value: p.max_projects === -1 ? 'Ilimitados' : String(p.max_projects) });
    f.push({ label: 'Dispositivos/andar', value: p.max_devices_per_floor === -1 ? 'Ilimitados' : String(p.max_devices_per_floor) });
    f.push({ label: 'Exportar PDF', value: p.can_export_pdf ? '✅' : '❌' });
    f.push({ label: 'Exportar DWG', value: p.can_export_dwg ? '✅' : '❌' });
    f.push({ label: 'Dispositivos Custom', value: p.can_custom_devices ? '✅' : '❌' });
    return f;
  };

  const colors = { gratis: '#94a3b8', basico: '#3b82f6', pro: '#f59e0b' };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div style={{maxWidth:900,margin:'0 auto'}}>
          <h3 style={{marginBottom:8}}>Sua Assinatura</h3>

          {/* Current plan status */}
          <div style={{
            background:'#1e293b', border:'1px solid #334155', borderRadius:10, padding:20, marginBottom:24,
            display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16
          }}>
            <div>
              <div style={{fontSize:11,color:'#94a3b8',textTransform:'uppercase',letterSpacing:1,marginBottom:4}}>Plano Atual</div>
              <div style={{fontSize:22,fontWeight:700,color:colors[currentSlug]||'#e2e8f0'}}>{limits.planName}</div>
              {limits.isTrialing && limits.daysLeft !== null && (
                <div style={{fontSize:12,color:'#f59e0b',marginTop:4}}>
                  ⏳ Trial: {limits.daysLeft} dia(s) restante(s)
                </div>
              )}
              {limits.isExpired && (
                <div style={{fontSize:12,color:'#ef4444',marginTop:4}}>
                  ⚠️ Assinatura expirada. Ative uma chave de licença ou entre em contato.
                </div>
              )}
              {subscription?.status === 'active' && subscription?.current_period_end && (
                <div style={{fontSize:11,color:'#94a3b8',marginTop:4}}>
                  Ativo até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
            <button onClick={()=>setShowRedeem(!showRedeem)} style={{
              background:'#22c55e',color:'#000',border:'none',borderRadius:8,
              padding:'10px 20px',fontSize:13,fontWeight:700,cursor:'pointer'
            }}>
              🔑 {showRedeem ? 'Cancelar' : 'Usar Chave de Licença'}
            </button>
          </div>

          {/* License redeem form */}
          {showRedeem && (
            <div style={{marginBottom:24}}>
              <LicenseRedeemForm
                onSuccess={() => { setShowRedeem(false); refreshUserData(); }}
                onCancel={() => setShowRedeem(false)}
              />
            </div>
          )}

          {/* Plan comparison cards */}
          <h4 style={{marginBottom:12,fontSize:14}}>Comparar Planos</h4>
          <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
            {plans.map(p => {
              const isCurrent = p.slug === currentSlug;
              const borderColor = colors[p.slug] || '#334155';
              return (
                <div key={p.id} style={{
                  flex:'1 1 250px',minWidth:230,background:'#1e293b',
                  border:`2px solid ${isCurrent ? borderColor : '#334155'}`,
                  borderRadius:12,padding:20,position:'relative',
                  boxShadow: isCurrent ? `0 0 20px ${borderColor}33` : 'none'
                }}>
                  {isCurrent && (
                    <div style={{
                      position:'absolute',top:-10,right:12,background:borderColor,color:'#000',
                      padding:'2px 12px',borderRadius:20,fontSize:10,fontWeight:700
                    }}>SEU PLANO</div>
                  )}
                  <div style={{textAlign:'center',marginBottom:16}}>
                    <div style={{fontSize:18,fontWeight:700,color:borderColor}}>{p.name}</div>
                    <div style={{fontSize:28,fontWeight:800,color:'#e2e8f0',marginTop:4}}>
                      {p.price_brl > 0 ? `R$ ${Number(p.price_brl).toFixed(2)}` : 'Grátis'}
                    </div>
                    {p.price_brl > 0 && <div style={{fontSize:11,color:'#94a3b8'}}>/mês</div>}
                  </div>

                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {planFeatures(p).map(f => (
                      <div key={f.label} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                        <span style={{color:'#94a3b8'}}>{f.label}</span>
                        <span style={{fontWeight:600}}>{f.value}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{fontSize:11,color:'#94a3b8',marginTop:12,textAlign:'center'}}>{p.description}</div>

                  {!isCurrent && p.price_brl > 0 && (
                    <button onClick={()=>setShowRedeem(true)} style={{
                      width:'100%',marginTop:12,padding:'8px 14px',
                      background:borderColor,color:'#000',border:'none',borderRadius:8,
                      fontSize:12,fontWeight:700,cursor:'pointer'
                    }}>Ativar com Chave</button>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            marginTop:24,background:'#1e293b',border:'1px solid #334155',borderRadius:10,padding:16,
            textAlign:'center'
          }}>
            <p style={{fontSize:13,color:'#94a3b8',margin:0}}>
              Para adquirir uma licença ou upgrade, entre em contato:
            </p>
            <p style={{fontSize:15,fontWeight:600,color:'#3b82f6',margin:'8px 0 0'}}>
              📧 contato@protectorsistemas.com.br
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
