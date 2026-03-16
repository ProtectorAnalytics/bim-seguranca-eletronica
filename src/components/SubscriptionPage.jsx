import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabase';
import LicenseRedeemForm from './LicenseRedeemForm';
import { CreditCard, Clock, XCircle, Lock, User, Mail, LayoutGrid } from 'lucide-react';

export default function SubscriptionPage({ onBack, onProfile }) {
  const { subscription, refreshUserData } = useAuth();
  const limits = useSubscription();
  const [plans, setPlans] = useState([]);
  const [showRedeem, setShowRedeem] = useState(false);

  useEffect(() => {
    supabase.from('plans').select('*').eq('is_active', true).order('price_brl')
      .then(({ data }) => setPlans(data || []));
  }, []);

  const currentSlug = limits.planSlug;
  const colors = { gratis: '#94a3b8', basico: '#046bd2', pro: '#f59e0b' };

  const planFeatures = (p) => [
    { label: 'Projetos', value: p.max_projects === -1 ? 'Ilimitados' : String(p.max_projects) },
    { label: 'Dispositivos/andar', value: p.max_devices_per_floor === -1 ? 'Ilimitados' : String(p.max_devices_per_floor) },
    { label: 'Exportar PDF', value: p.can_export_pdf },
    { label: 'Exportar DWG', value: p.can_export_dwg },
    { label: 'Dispositivos Custom', value: p.can_custom_devices },
  ];

  const statusInfo = limits.isExpired
    ? { label: 'Expirado', color: '#ef4444', bg: 'rgba(239,68,68,.12)' }
    : limits.isTrialing
      ? { label: 'Trial', color: '#f59e0b', bg: 'rgba(245,158,11,.12)' }
      : { label: 'Ativo', color: '#22c55e', bg: 'rgba(34,197,94,.12)' };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button className="modal-back-btn" onClick={onBack}>← Voltar</button>

        <div style={{ maxWidth: 920, margin: '0 auto' }} className="anim-fade">
          {/* ── Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: 'linear-gradient(135deg, #046bd2, #045cb4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(4,107,210,.3)',
            }}>
              <CreditCard size={26} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Sua Assinatura</h2>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>
                Gerencie seu plano e licencas de acesso
              </p>
            </div>
          </div>

          {/* ── Current plan status card ── */}
          <div style={{
            background: '#ffffff', border: '1px solid #E2E8F0',
            borderRadius: 8, padding: 24, marginBottom: 24,
            boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,.08))',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ flex: '1 1 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    fontSize: 24, fontWeight: 800,
                    color: colors[currentSlug] || '#1e293b',
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
                    <Clock size={14} color="#f59e0b" />
                    {limits.daysLeft} dia(s) restante(s) no periodo de avaliacao
                  </div>
                )}

                {limits.isExpired && (
                  <div style={{ fontSize: 13, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <XCircle size={14} color="#ef4444" />
                    Sua assinatura expirou. Ative uma chave de licenca para continuar.
                  </div>
                )}

                {subscription?.status === 'active' && subscription?.current_period_end && (
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Ativo ate {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowRedeem(!showRedeem)}
                  style={{
                    background: showRedeem ? '#E2E8F0' : '#22c55e', color: showRedeem ? '#64748b' : '#000',
                    border: 'none', borderRadius: 6, padding: '10px 20px',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <Lock size={16} />
                  {showRedeem ? 'Cancelar' : 'Ativar Licenca'}
                </button>
                {onProfile && (
                  <button
                    onClick={onProfile}
                    style={{
                      background: 'transparent', color: '#64748b',
                      border: '1px solid #E2E8F0', borderRadius: 6,
                      padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all .2s', display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <User size={14} />
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
            <LayoutGrid size={20} color="#94a3b8" strokeWidth={2} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Comparar Planos</h3>
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {plans.map(p => {
              const isCurrent = p.slug === currentSlug;
              const borderColor = colors[p.slug] || '#334155';
              return (
                <div key={p.id} className="anim-slide-up" style={{
                  flex: '1 1 260px', minWidth: 240,
                  background: isCurrent ? '#ffffff' : '#F0F5FA',
                  border: `2px solid ${isCurrent ? borderColor : '#E2E8F0'}`,
                  borderRadius: 8, padding: 24, position: 'relative',
                  boxShadow: isCurrent ? `0 0 24px ${borderColor}22` : 'var(--shadow-xs, none)',
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
                    <div style={{ fontSize: 32, fontWeight: 800, color: '#1e293b', marginTop: 6 }}>
                      {p.price_brl > 0 ? `R$ ${Number(p.price_brl).toFixed(2)}` : 'Gratis'}
                    </div>
                    {p.price_brl > 0 && <div style={{ fontSize: 12, color: '#64748b' }}>/mes</div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {planFeatures(p).map(f => (
                      <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                        <span style={{ color: '#94a3b8' }}>{f.label}</span>
                        <span style={{ fontWeight: 600 }}>
                          {typeof f.value === 'boolean'
                            ? (f.value
                              ? <span style={{ color: '#22c55e' }}>✓</span>
                              : <span style={{ color: '#475569' }}>\u2014</span>)
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
                      border: `1px solid ${borderColor}`, borderRadius: 6,
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
            marginTop: 24, background: '#ffffff', border: '1px solid #E2E8F0',
            borderRadius: 8, padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10,
              background: 'rgba(4,107,210,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Mail size={22} color="#046bd2" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 2 }}>
                Para adquirir uma licenca ou solicitar upgrade:
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#046bd2' }}>
                contato@protectorsistemas.com.br
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
