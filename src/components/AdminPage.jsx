import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import UserTable from './admin/UserTable'
import SubscriptionManager from './admin/SubscriptionManager'
import PlanEditor from './admin/PlanEditor'
import LicenseKeyManager from './admin/LicenseKeyManager'

/* ─── SVG Icons ─── */
const I = {
  dashboard: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>,
  users: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  creditCard: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  sliders: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>,
  key: (c='currentColor') => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
  shield: (c='currentColor') => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  back: (c='currentColor') => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
};

const TABS = [
  { id: 'overview', label: 'Painel Geral', icon: I.dashboard, color: '#3b82f6' },
  { id: 'users', label: 'Usuários', icon: I.users, color: '#8b5cf6' },
  { id: 'subs', label: 'Assinaturas', icon: I.creditCard, color: '#22c55e' },
  { id: 'plans', label: 'Planos', icon: I.sliders, color: '#f59e0b' },
  { id: 'keys', label: 'Chaves', icon: I.key, color: '#ef4444' },
];

export default function AdminPage({ onBack }) {
  const { isAdmin, profile } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  if (!isAdmin) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0f172a',color:'#ef4444' }}>
      <div style={{ textAlign:'center' }}>
        <h2>Acesso Negado</h2>
        <p style={{ color:'#94a3b8' }}>Você não tem permissão de administrador.</p>
        <button onClick={onBack} style={{ marginTop:16,padding:'8px 24px',background:'#334155',color:'#e2e8f0',border:'none',borderRadius:8,cursor:'pointer',fontWeight:600 }}>Voltar</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh',background:'#0b1120',color:'#e2e8f0',fontFamily:'system-ui,sans-serif' }}>
      {/* ── Top bar ── */}
      <div style={{
        background:'linear-gradient(135deg,#1e293b 0%,#0f172a 100%)',
        borderBottom:'1px solid #1e293b',padding:'16px 28px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <button onClick={onBack} style={{
            display:'flex',alignItems:'center',gap:6,
            background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',
            borderRadius:8,padding:'8px 16px',color:'#94a3b8',cursor:'pointer',
            fontSize:13,fontWeight:500,transition:'all .15s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,.1)';e.currentTarget.style.color='#e2e8f0'}}
            onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,.06)';e.currentTarget.style.color='#94a3b8'}}
          >
            {I.back()} Voltar
          </button>

          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <div style={{
              width:38,height:38,borderRadius:10,
              background:'linear-gradient(135deg,#f59e0b,#ef4444)',
              display:'flex',alignItems:'center',justifyContent:'center',
              boxShadow:'0 4px 12px rgba(245,158,11,.25)',
            }}>
              {I.shield('#fff')}
            </div>
            <div>
              <h1 style={{ margin:0,fontSize:18,fontWeight:700,letterSpacing:'-0.3px' }}>Central de Controle</h1>
              <div style={{ fontSize:11,color:'#64748b' }}>Protector Sistemas — Painel Administrativo</div>
            </div>
          </div>
        </div>

        <div style={{ display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:12,fontWeight:600,color:'#e2e8f0' }}>{profile?.full_name || 'Admin'}</div>
            <div style={{ fontSize:10,color:'#64748b' }}>{profile?.email}</div>
          </div>
          <div style={{
            fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.5px',
            background:'linear-gradient(135deg,#78350f,#92400e)',color:'#fbbf24',
            padding:'5px 12px',borderRadius:20,
            boxShadow:'0 2px 8px rgba(245,158,11,.15)',
          }}>SUPER ADMIN</div>
        </div>
      </div>

      {/* ── Sidebar + Content ── */}
      <div style={{ display:'flex',minHeight:'calc(100vh - 73px)' }}>
        {/* Sidebar navigation */}
        <nav style={{
          width:220,flexShrink:0,background:'#0f172a',borderRight:'1px solid #1e293b',
          padding:'16px 10px',display:'flex',flexDirection:'column',gap:4,
        }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{
                display:'flex',alignItems:'center',gap:10,width:'100%',
                padding:'11px 14px',border:'none',borderRadius:10,
                background: isActive ? `${tab.color}15` : 'transparent',
                color: isActive ? tab.color : '#64748b',
                cursor:'pointer',transition:'all .15s',textAlign:'left',
                borderLeft: isActive ? `3px solid ${tab.color}` : '3px solid transparent',
              }}
                onMouseEnter={e=>{if(!isActive){e.currentTarget.style.background='rgba(255,255,255,.04)';e.currentTarget.style.color='#94a3b8'}}}
                onMouseLeave={e=>{if(!isActive){e.currentTarget.style.background='transparent';e.currentTarget.style.color='#64748b'}}}
              >
                {tab.icon(isActive ? tab.color : '#64748b')}
                <span style={{ fontSize:13,fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
              </button>
            );
          })}

          {/* Sidebar footer */}
          <div style={{ marginTop:'auto',padding:'12px 14px',borderTop:'1px solid #1e293b' }}>
            <div style={{ fontSize:10,color:'#475569',lineHeight:1.5 }}>
              Sistema de gestão<br/>Protector v3.31
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main style={{ flex:1,padding:28,overflowY:'auto',maxHeight:'calc(100vh - 73px)' }}>
          {activeTab === 'overview' && <OverviewPanel onNav={setActiveTab} />}
          {activeTab === 'users' && <UserTable />}
          {activeTab === 'subs' && <SubscriptionManager />}
          {activeTab === 'plans' && <PlanEditor />}
          {activeTab === 'keys' && <LicenseKeyManager />}
        </main>
      </div>
    </div>
  );
}

/* ─── Overview Panel (replaces MetricsDashboard with a command center) ─── */
function OverviewPanel({ onNav }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  async function fetchMetrics() {
    setLoading(true);
    try {
      const [usersRes, subsRes, keysRes, plansRes] = await Promise.all([
        supabase.from('profiles').select('id, role, created_at'),
        supabase.from('subscriptions').select('id, status, plan_id, plans(price_brl)'),
        supabase.from('license_keys').select('id, status'),
        supabase.from('plans').select('*').eq('is_active', true),
      ]);
      const users = usersRes.data || [];
      const subs = subsRes.data || [];
      const keys = keysRes.data || [];

      const totalUsers = users.length;
      const admins = users.filter(u => u.role === 'admin').length;
      const activeSubs = subs.filter(s => s.status === 'active').length;
      const trialSubs = subs.filter(s => s.status === 'trialing').length;
      const expiredSubs = subs.filter(s => ['expired','cancelled','suspended'].includes(s.status)).length;
      const keysAvailable = keys.filter(k => k.status === 'available').length;
      const keysRedeemed = keys.filter(k => k.status === 'redeemed').length;
      const keysTotal = keys.length;
      const mrr = subs
        .filter(s => s.status === 'active' && s.plans?.price_brl)
        .reduce((sum, s) => sum + Number(s.plans.price_brl), 0);

      // New users this month
      const thisMonth = new Date(); thisMonth.setDate(1); thisMonth.setHours(0,0,0,0);
      const newThisMonth = users.filter(u => new Date(u.created_at) >= thisMonth).length;

      setMetrics({ totalUsers, admins, activeSubs, trialSubs, expiredSubs, keysAvailable, keysRedeemed, keysTotal, mrr, newThisMonth });
    } catch (e) {
      console.error('Metrics fetch error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div style={{ textAlign:'center',padding:60,color:'#64748b' }}>Carregando métricas...</div>;
  if (!metrics) return <div style={{ textAlign:'center',padding:60,color:'#ef4444' }}>Erro ao carregar métricas</div>;

  return (
    <div>
      {/* Section title */}
      <div style={{ marginBottom:24 }}>
        <h2 style={{ margin:0,fontSize:22,fontWeight:700 }}>Visão Geral</h2>
        <p style={{ margin:'4px 0 0',fontSize:13,color:'#64748b' }}>Métricas em tempo real do sistema Protector</p>
      </div>

      {/* ── Primary KPIs ── */}
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24 }}>
        <KpiCard label="Receita Mensal" value={`R$ ${metrics.mrr.toFixed(2)}`} color="#22c55e"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>}
        />
        <KpiCard label="Usuários Totais" value={metrics.totalUsers} sub={`+${metrics.newThisMonth} este mês`} color="#3b82f6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>}
        />
        <KpiCard label="Assinaturas Ativas" value={metrics.activeSubs} sub={`${metrics.trialSubs} em trial`} color="#8b5cf6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
        <KpiCard label="Chaves Disponíveis" value={metrics.keysAvailable} sub={`${metrics.keysRedeemed} resgatadas`} color="#f59e0b"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>}
        />
      </div>

      {/* ── Quick Actions ── */}
      <div style={{ marginBottom:24 }}>
        <h3 style={{ margin:'0 0 12px',fontSize:14,fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.5px' }}>
          Ações Rápidas
        </h3>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12 }}>
          <QuickAction label="Gerenciar Usuários" desc={`${metrics.totalUsers} cadastrados`} color="#8b5cf6" onClick={()=>onNav('users')} />
          <QuickAction label="Ver Assinaturas" desc={`${metrics.expiredSubs} expiradas`} color="#22c55e" onClick={()=>onNav('subs')} />
          <QuickAction label="Editar Planos" desc="Preços e limites" color="#f59e0b" onClick={()=>onNav('plans')} />
          <QuickAction label="Gerar Chaves" desc={`${metrics.keysAvailable} prontas`} color="#ef4444" onClick={()=>onNav('keys')} />
        </div>
      </div>

      {/* ── Status grid ── */}
      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
        {/* Users breakdown */}
        <StatusCard title="Composição de Usuários">
          <StatusRow label="Administradores" value={metrics.admins} color="#f59e0b" total={metrics.totalUsers} />
          <StatusRow label="Usuários padrão" value={metrics.totalUsers - metrics.admins} color="#3b82f6" total={metrics.totalUsers} />
          <StatusRow label="Novos este mês" value={metrics.newThisMonth} color="#22c55e" total={metrics.totalUsers} />
        </StatusCard>

        {/* Subscription breakdown */}
        <StatusCard title="Status das Assinaturas">
          <StatusRow label="Ativas" value={metrics.activeSubs} color="#22c55e" total={metrics.activeSubs + metrics.trialSubs + metrics.expiredSubs} />
          <StatusRow label="Em trial" value={metrics.trialSubs} color="#f59e0b" total={metrics.activeSubs + metrics.trialSubs + metrics.expiredSubs} />
          <StatusRow label="Expiradas" value={metrics.expiredSubs} color="#ef4444" total={metrics.activeSubs + metrics.trialSubs + metrics.expiredSubs} />
        </StatusCard>

        {/* License keys */}
        <StatusCard title="Chaves de Licença">
          <StatusRow label="Disponíveis" value={metrics.keysAvailable} color="#22c55e" total={metrics.keysTotal} />
          <StatusRow label="Resgatadas" value={metrics.keysRedeemed} color="#3b82f6" total={metrics.keysTotal} />
          <StatusRow label="Total geradas" value={metrics.keysTotal} color="#64748b" total={metrics.keysTotal} />
        </StatusCard>

        {/* System info */}
        <StatusCard title="Informações do Sistema">
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            <InfoRow label="Versão" value="v3.31.0" />
            <InfoRow label="Banco de dados" value="Supabase PostgreSQL" />
            <InfoRow label="Autenticação" value="Supabase Auth" />
            <InfoRow label="Hospedagem" value="Vercel Edge" />
          </div>
        </StatusCard>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function KpiCard({ label, value, sub, color, icon }) {
  return (
    <div style={{
      background:'#111827',border:'1px solid #1e293b',borderRadius:14,
      padding:'20px 18px',position:'relative',overflow:'hidden',
    }}>
      <div style={{
        position:'absolute',top:12,right:12,width:36,height:36,borderRadius:10,
        background:`${color}12`,display:'flex',alignItems:'center',justifyContent:'center',
      }}>{icon}</div>
      <div style={{ fontSize:11,color:'#64748b',fontWeight:600,textTransform:'uppercase',letterSpacing:'.3px',marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:28,fontWeight:800,color,lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11,color:'#475569',marginTop:6 }}>{sub}</div>}
    </div>
  );
}

function QuickAction({ label, desc, color, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:'#111827',border:'1px solid #1e293b',borderRadius:12,
      padding:'16px 14px',cursor:'pointer',transition:'all .15s',textAlign:'left',
      color:'#e2e8f0',display:'flex',flexDirection:'column',gap:4,
      borderLeft:`3px solid ${color}`,
    }}
      onMouseEnter={e=>{e.currentTarget.style.background='#1e293b';e.currentTarget.style.borderColor='#334155'}}
      onMouseLeave={e=>{e.currentTarget.style.background='#111827';e.currentTarget.style.borderColor='#1e293b'}}
    >
      <div style={{ fontSize:13,fontWeight:600 }}>{label}</div>
      <div style={{ fontSize:11,color:'#64748b' }}>{desc}</div>
    </button>
  );
}

function StatusCard({ title, children }) {
  return (
    <div style={{
      background:'#111827',border:'1px solid #1e293b',borderRadius:14,padding:20,
    }}>
      <h4 style={{ margin:'0 0 16px',fontSize:13,fontWeight:600,color:'#94a3b8' }}>{title}</h4>
      <div style={{ display:'flex',flexDirection:'column',gap:12 }}>{children}</div>
    </div>
  );
}

function StatusRow({ label, value, color, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
        <span style={{ fontSize:12,color:'#94a3b8' }}>{label}</span>
        <span style={{ fontSize:12,fontWeight:700,color }}>{value}</span>
      </div>
      <div style={{ height:4,background:'#1e293b',borderRadius:2,overflow:'hidden' }}>
        <div style={{ height:'100%',width:`${pct}%`,background:color,borderRadius:2,transition:'width .5s' }} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12 }}>
      <span style={{ color:'#64748b' }}>{label}</span>
      <span style={{ color:'#94a3b8',fontWeight:500 }}>{value}</span>
    </div>
  );
}
