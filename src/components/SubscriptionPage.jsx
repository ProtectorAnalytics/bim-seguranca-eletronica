import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import LicenseRedeemForm from './LicenseRedeemForm';

export default function SubscriptionPage({ onBack, onProfile }) {
  const { profile, subscription, refreshUserData } = useAuth();
  const limits = useSubscription();
  const [plans, setPlans] = useState([]);
  const [showRedeem, setShowRedeem] = useState(false);

  useEffect(() => {
    supabase.from('plans').select('*').eq('is_active', true).order('price_brl')
      .then(({ data }) => setPlans(data || []));
  }, []);

  const currentSlug = limits.planSlug;
  const colors = { gratis: '#94a3b8', basico: '#3b82f6', pro: '#f59e0b' };

  const planFeatures = (p) => [
    { label: 'Projetos', value: p.max_projects === -1 ? 'Ilimitados' : String(p.max_projects), icon: '📁' },
    { label: 'Dispositivos/andar', value: p.max_devices_per_floor === -1 ? 'Ilimitados' : String(p.max_devices_per_floor), icon: '📡' },
    { label: 'Exportar PDF', value: p.can_export_pdf, icon: '📄' },
    { label: 'Exportar DWG', value: p.can_export_dwg, icon: '📐' },
    { label: 'Dispositivos Custom', value: p.can_custom_devices, icon: '⚙️' },
  ];

  // Status display
  const statusInfo = limits.isExpired
    ? { label: 'Expirado', color: '#ef4444', bg: 'rgba(239,68,68,.12)' }
    : limits.isTrialing
      ? { label: 'Trial', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' }
      : { label: 'Ativo', color: '#22c55e', bg: 'rgba(34,197,94,.12)' };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div style={{ maxWidth: 920, margin: '0 auto' }}>
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'linear-gradient(135deg, #f59e0b, #f97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245,158,11,.3)',
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Sua Assinatura</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'rgba(255,255,255,.45)' }}>
                Gerencie seu plano e licenças de acesso
              </p>
            </div>
          </div>

          {/* ── Current plan status card ── */}
          <div style={{
            background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)',
            borderRadius: 14, padding: 24, marginBottom: 24,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    fontSize: 24, fontWeight: 800,
                    color: colors[currentSlug] || '#e2e8f0',
                  }}>
                    {limits.planName}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.5px',
                    background: statusInfo.bg, color: statusInfo.color,
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    {statusInfo.label}
                  </span>
                </div>

                {limits.isTrialing && limits.daysLeft !== null && (
                  <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {limits.daysLeft} dia(s) restante(s) no período de avaliação
                  </div>
                )}

                {limits.isExpired && (
                  <div style={{ fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                    Sua assinatura expirou. Ative uma chave de licença para continuar.
                  </div>
                )}

                {subscription?.status === 'active' && subscription?.current_period_end && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Ativo até {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowRedeem(!showRedeem)}
                  style={{
                    background: showRedeem ? '#334155' : '#22c55e', color: showRedeem ? '#e2e8f0' : '#000',
                    border: 'none', borderRadius: 10, padding: '10px 20px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  {showRedeem ? 'Cancelar' : 'Ativar Licença'}
                </button>
                {onProfile && (
                  <button
                    onClick={onProfile}
                    style={{
                      background: 'rgba(255,255,255,.08)', color: '#e2e8f0',
                      border: '1px solid rgba(255,255,255,.15)', borderRadius: 10,
                      padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Meu Perfil
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* License redeem */}
          {showRedeem && (
            <div style={{ marginBottom: 24 }}>
              <LicenseRedeemForm
                onSuccess={() => { setShowRedeem(false); refreshUserData(); }}
                onCancel={() => setShowRedeem(false)}
              />
            </div>
          )}

          {/* ── Plan comparison ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Comparar Planos</h3>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {plans.map(p => {
              const isCurrent = p.slug === currentSlug;
              const borderColor = colors[p.slug] || '#334155';
              return (
                <div key={p.id} style={{
                  flex: '1 1 260px', minWidth: 240,
                  background: isCurrent ? 'rgba(255,255,255,.08)' : 'rgba(255,255,255,.04)',
                  border: `2px solid ${isCurrent ? borderColor : 'rgba(255,255,255,.08)'}`,
                  borderRadius: 14, padding: 24, position: 'relative',
                  boxShadow: isCurrent ? `0 0 24px ${borderColor}22` : 'none',
                  transition: 'all .2s',
                }}>
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -11, right: 14, background: borderColor, color: '#000',
                      padding: '3px 14px', borderRadius: 20, fontSize: 10, fontWeight: 700, letterSpacing: '.3px',
                    }}>SEU PLANO</div>
                  )}

                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: borderColor }}>{p.name}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#e2e8f0', marginTop: 6 }}>
                      {p.price_brl > 0 ? `R$ ${Number(p.price_brl).toFixed(2)}` : 'Grátis'}
                    </div>
                    {p.price_brl > 0 && <div style={{ fontSize: 12, color: '#64748b' }}>/mês</div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {planFeatures(p).map(f => (
                      <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>{f.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          {typeof f.value === 'boolean'
                            ? (f.value
                              ? <span style={{ color: '#22c55e' }}>✓</span>
                              : <span style={{ color: '#475569' }}>—</span>)
                            : f.value
                          }
                        </span>
                      </div>
                    ))}
                  </div>

                  {p.description && (
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 14, textAlign: 'center', lineHeight: 1.4 }}>
                      {p.description}
                    </div>
                  )}

                  {!isCurrent && p.price_brl > 0 && (
                    <button onClick={() => setShowRedeem(true)} style={{
                      width: '100%', marginTop: 16, padding: '10px 16px',
                      background: 'transparent', color: borderColor,
                      border: `1px solid ${borderColor}`, borderRadius: 10,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                    }}>
                      Ativar com Chave
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Contact box ── */}
          <div style={{
            marginTop: 24, background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)',
            borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>
                Para adquirir uma licença ou solicitar upgrade:
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#3b82f6' }}>
                contato@protectorsistemas.com.br
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
