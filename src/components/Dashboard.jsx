import React from 'react';
import { APP_VERSION } from '@/data/constants';
import { getSavedProjects, getSavedClients, getSettings, getCustomDevices } from '@/lib/helpers';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeBanner from './UpgradeBanner';
import UserMenu from './UserMenu';

export default function Dashboard({ onNewProject, onOpenProject, onClients, onRepo, onSettings, onSubscription, onAdmin, onProfile, limitMsg, onDismissLimit }) {
  const { isAdmin } = useAuth();
  const limits = useSubscription();
  const projects = getSavedProjects();
  const clients = getSavedClients();
  const customDeviceCount = getCustomDevices().length;
  const lastAccess = localStorage.getItem('bim_lastAccess') || 'Nunca';
  const activeProjectsCount = projects.filter(p => p.status === 'em_execucao').length;

  localStorage.setItem('bim_lastAccess', new Date().toLocaleDateString('pt-BR'));

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* ── Header ── */}
        <div className="dashboard-header">
          <div className="dh-left">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              {/* Logo icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,158,11,.3)', flexShrink: 0,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>PROTECTOR</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)', margin: 0 }}>BIM Segurança Eletrônica</p>
              </div>
            </div>
            <div className="dh-version">{APP_VERSION.label}</div>
          </div>

          {/* User Menu — replaces the old emoji + tiny Sair button */}
          <UserMenu
            onProfile={onProfile}
            onSubscription={onSubscription}
            onSettings={onSettings}
            onAdmin={isAdmin ? onAdmin : null}
          />
        </div>

        {/* ── Stats ── */}
        <div className="dashboard-stats">
          <StatCard
            icon={<IconFolder />}
            value={projects.length}
            label="Projetos"
            color="#3b82f6"
            sub={activeProjectsCount > 0 ? `${activeProjectsCount} em execução` : null}
          />
          <StatCard
            icon={<IconUsers />}
            value={clients.length}
            label="Clientes"
            color="#8b5cf6"
          />
          <StatCard
            icon={<IconCpu />}
            value={customDeviceCount}
            label="Equipamentos Custom"
            color="#22c55e"
          />
          <StatCard
            icon={<IconClock />}
            value={lastAccess}
            label="Último Acesso"
            color="#f59e0b"
            isDate
          />
        </div>

        {limitMsg && <UpgradeBanner message={limitMsg} onUpgrade={() => { onDismissLimit?.(); onSubscription(); }} />}

        {/* ── Module Cards ── */}
        <div className="dashboard-modules">
          {/* Primary action */}
          <div className="module-card primary" onClick={onNewProject}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <div className="mc-title">Novo Projeto</div>
            <div className="mc-desc">Criar um novo projeto de segurança eletrônica do zero</div>
            <div style={{
              fontSize: 11, background: 'rgba(245,158,11,.25)', padding: '5px 12px', borderRadius: 6,
              color: '#fbbf24', marginTop: 'auto', fontWeight: 700, letterSpacing: '.3px',
            }}>
              {limits.maxProjects === -1 ? 'ILIMITADO' : `${projects.length}/${limits.maxProjects} projetos`}
            </div>
          </div>

          <ModuleCard
            icon={<IconFolderOpen color="#3b82f6" />}
            title="Projetos"
            desc={projects.length === 0 ? 'Nenhum projeto ainda' : `${projects.length} projeto(s) salvo(s)`}
            badge={projects.length > 0 ? `${projects.length}` : null}
            badgeColor="#3b82f6"
            onClick={onOpenProject}
          />

          <ModuleCard
            icon={<IconUsersGroup color="#8b5cf6" />}
            title="Clientes"
            desc={clients.length === 0 ? 'Nenhum cliente cadastrado' : `${clients.length} cliente(s)`}
            badge={clients.length > 0 ? `${clients.length}` : null}
            badgeColor="#8b5cf6"
            onClick={onClients}
          />

          <ModuleCard
            icon={<IconBox color="#22c55e" />}
            title="Repositório"
            desc="Equipamentos customizados"
            badge={customDeviceCount > 0 ? `${customDeviceCount}` : null}
            badgeColor="#22c55e"
            onClick={onRepo}
          />

          <ModuleCard
            icon={<IconSettingsGear color="#64748b" />}
            title="Configurações"
            desc="Dados da empresa, taxas e informações fiscais"
            onClick={onSettings}
          />

          <ModuleCard
            icon={<IconCreditCard color="#f59e0b" />}
            title="Assinatura"
            desc={`Plano ${limits.planName}`}
            badge={limits.isTrialing ? 'TRIAL' : limits.isExpired ? 'EXPIRADO' : null}
            badgeColor={limits.isExpired ? '#ef4444' : '#f59e0b'}
            onClick={onSubscription}
          />

          {onAdmin && (
            <div className="module-card" onClick={onAdmin} style={{ borderColor: '#f59e0b' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div className="mc-title">Administração</div>
              <div className="mc-desc">Gerenciar usuários, planos, licenças e métricas</div>
              <div style={{
                fontSize: 10, background: '#78350f', padding: '4px 10px', borderRadius: 20,
                color: '#fbbf24', marginTop: 'auto', fontWeight: 700, letterSpacing: '.5px',
              }}>
                ADMIN
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Reusable stat card ─── */
function StatCard({ icon, value, label, color, sub, isDate }) {
  return (
    <div className="stat-card" style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: isDate ? 16 : 28, fontWeight: 800, color,
          lineHeight: 1.1, marginBottom: 2,
        }}>{value}</div>
        <div className="stat-label" style={{ fontSize: 12, textTransform: 'none', letterSpacing: 0 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Reusable module card ─── */
function ModuleCard({ icon, title, desc, badge, badgeColor, onClick }) {
  return (
    <div className="module-card" onClick={onClick}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: 'rgba(255,255,255,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        {icon}
      </div>
      <div className="mc-title">{title}</div>
      <div className="mc-desc">{desc}</div>
      {badge && (
        <div style={{
          fontSize: 11, background: `${badgeColor}25`, padding: '4px 10px', borderRadius: 6,
          color: badgeColor, marginTop: 'auto', fontWeight: 700,
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}

/* ─── SVG Icons (20×20, clean line style) ─── */
function IconFolder() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconCpu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
      <rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/>
      <line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/>
      <line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/>
      <line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/>
      <line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IconFolderOpen({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4l2 3h9a2 2 0 0 1 2 2v1"/>
      <path d="M5 19h14a2 2 0 0 0 2-2l1-7H7.5"/>
    </svg>
  );
}
function IconUsersGroup({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IconBox({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}
function IconSettingsGear({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconCreditCard({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}
