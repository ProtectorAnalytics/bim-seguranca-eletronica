import React from 'react';
import { APP_VERSION } from '@/data/constants';
import { getSavedProjects, getSavedClients, getSettings, getCustomDevices, getCachedCloudProjects } from '@/lib/helpers';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import UpgradeBanner from './UpgradeBanner';
import UserMenu from './UserMenu';
import {
  FolderOpen, Users, Cpu, Clock, Plus, Folder, Package, Settings, CreditCard, ShieldAlert, CircleAlert
} from 'lucide-react';

export default function Dashboard({ onNewProject, onOpenProject, onClients, onRepo, onSettings, onSubscription, onAdmin, onProfile, limitMsg, onDismissLimit }) {
  const { isAdmin, authDebug, profile } = useAuth();
  const limits = useSubscription();
  const localProjects = getSavedProjects();
  const cloudProjects = getCachedCloudProjects();
  // Merge and deduplicate
  const projectMap = new Map();
  cloudProjects.forEach(p => projectMap.set(p.id, p));
  localProjects.forEach(p => { if(!projectMap.has(p.id)) projectMap.set(p.id, p); });
  const projects = Array.from(projectMap.values());
  const cloudCount = cloudProjects.length;
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
              <img src="/logo-proti.png" alt="Protector" style={{
                height: 44, flexShrink: 0, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,.2))'
              }} />
              <div>
                <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>PROTECTOR</h1>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>BIM Seguranca Eletronica</p>
              </div>
            </div>
            <div className="dh-version">{APP_VERSION.label}</div>
          </div>

          <UserMenu
            onProfile={onProfile}
            onSubscription={onSubscription}
            onSettings={onSettings}
            onAdmin={isAdmin ? onAdmin : null}
          />
        </div>

        {/* ── Auth Debug (only show if fallback active) ── */}
        {authDebug && (
          <div style={{
            padding: '10px 16px', marginBottom: 12, borderRadius: 8, fontSize: 12,
            background: 'rgba(245,158,11,.08)', color: '#92400e', border: '1px solid rgba(245,158,11,.2)',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CircleAlert size={14} color="#d97706" />
            <span>{authDebug}</span>
          </div>
        )}

        {/* ── Stats ── */}
        <div className="dashboard-stats">
          <StatCard
            icon={<Folder size={22} color="#046bd2" strokeWidth={2} />}
            value={projects.length}
            label="Projetos"
            color="#046bd2"
            sub={cloudCount > 0 ? `${cloudCount} na nuvem` : activeProjectsCount > 0 ? `${activeProjectsCount} em execucao` : null}
          />
          <StatCard
            icon={<Users size={22} color="#8b5cf6" strokeWidth={2} />}
            value={clients.length}
            label="Clientes"
            color="#8b5cf6"
          />
          <StatCard
            icon={<Cpu size={22} color="#22c55e" strokeWidth={2} />}
            value={customDeviceCount}
            label="Equipamentos Custom"
            color="#22c55e"
          />
          <StatCard
            icon={<Clock size={22} color="#f59e0b" strokeWidth={2} />}
            value={lastAccess}
            label="Ultimo Acesso"
            color="#f59e0b"
            isDate
          />
        </div>

        {limitMsg && <UpgradeBanner message={limitMsg} onUpgrade={() => { onDismissLimit?.(); onSubscription(); }} />}

        {/* ── Module Cards ── */}
        <div className="dashboard-modules">
          {/* Primary action */}
          <div className="module-card primary" onClick={onNewProject}>
            <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(4,107,210,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <Plus size={24} color="#046bd2" strokeWidth={2.5} />
            </div>
            <div className="mc-title">Novo Projeto</div>
            <div className="mc-desc">Criar um novo projeto de seguranca eletronica do zero</div>
            <div style={{
              fontSize: 11, background: 'rgba(4,107,210,.08)', padding: '5px 12px', borderRadius: 6,
              color: '#046bd2', marginTop: 'auto', fontWeight: 700, letterSpacing: '.3px',
            }}>
              {limits.maxProjects === -1 ? 'ILIMITADO' : `${projects.length}/${limits.maxProjects} projetos`}
            </div>
          </div>

          <ModuleCard
            icon={<FolderOpen size={24} color="#046bd2" strokeWidth={1.8} />}
            title="Projetos"
            desc={projects.length === 0 ? 'Nenhum projeto ainda' : `${projects.length} projeto(s) salvo(s)`}
            badge={projects.length > 0 ? `${projects.length}` : null}
            badgeColor="#046bd2"
            onClick={onOpenProject}
          />

          <ModuleCard
            icon={<Users size={24} color="#8b5cf6" strokeWidth={1.8} />}
            title="Clientes"
            desc={clients.length === 0 ? 'Nenhum cliente cadastrado' : `${clients.length} cliente(s)`}
            badge={clients.length > 0 ? `${clients.length}` : null}
            badgeColor="#8b5cf6"
            onClick={onClients}
          />

          <ModuleCard
            icon={<Package size={24} color="#22c55e" strokeWidth={1.8} />}
            title="Repositorio"
            desc="Equipamentos customizados"
            badge={customDeviceCount > 0 ? `${customDeviceCount}` : null}
            badgeColor="#22c55e"
            onClick={onRepo}
          />

          <ModuleCard
            icon={<Settings size={24} color="#64748b" strokeWidth={1.8} />}
            title="Configuracoes"
            desc="Dados da empresa, taxas e informacoes fiscais"
            onClick={onSettings}
          />

          <ModuleCard
            icon={<CreditCard size={24} color="#f59e0b" strokeWidth={1.8} />}
            title="Assinatura"
            desc={`Plano ${limits.planName}`}
            badge={limits.isTrialing ? 'TRIAL' : limits.isExpired ? 'EXPIRADO' : null}
            badgeColor={limits.isExpired ? '#ef4444' : '#f59e0b'}
            onClick={onSubscription}
          />

          {onAdmin && (
            <div className="module-card" onClick={onAdmin} style={{ borderColor: '#046bd2' }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'rgba(4,107,210,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <ShieldAlert size={24} color="#046bd2" strokeWidth={1.8} />
              </div>
              <div className="mc-title">Administracao</div>
              <div className="mc-desc">Gerenciar usuarios, planos, licencas e metricas</div>
              <div style={{
                fontSize: 10, background: 'rgba(4,107,210,.08)', padding: '4px 10px', borderRadius: 20,
                color: '#046bd2', marginTop: 'auto', fontWeight: 700, letterSpacing: '.5px',
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
    <div className="stat-card anim-slide-up" style={{ textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: 14, padding: '18px 20px' }}>
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
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
        {sub && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ─── Reusable module card ─── */
function ModuleCard({ icon, title, desc, badge, badgeColor, onClick }) {
  return (
    <div className="module-card anim-slide-up" onClick={onClick}>
      <div style={{
        width: 48, height: 48, borderRadius: 10,
        background: 'rgba(4,107,210,.06)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        {icon}
      </div>
      <div className="mc-title">{title}</div>
      <div className="mc-desc">{desc}</div>
      {badge && (
        <div style={{
          fontSize: 11, background: `${badgeColor}20`, padding: '4px 10px', borderRadius: 6,
          color: badgeColor, marginTop: 'auto', fontWeight: 700,
        }}>
          {badge}
        </div>
      )}
    </div>
  );
}
