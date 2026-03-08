import React from 'react';
import { APP_VERSION } from '@/data/constants';
import { getSavedProjects, getSavedClients, getSettings, getCustomDevices } from '@/lib/helpers';

export default function Dashboard({onNewProject,onOpenProject,onClients,onRepo,onSettings,onSubscription}){
  const projects=getSavedProjects();
  const clients=getSavedClients();
  const settings=getSettings();
  const lastAccess=localStorage.getItem('bim_lastAccess')||'Nunca';

  const customDeviceCount=getCustomDevices().length;
  const activeProjectsCount=projects.filter(p=>p.status==='em_execucao').length;

  localStorage.setItem('bim_lastAccess',new Date().toLocaleDateString('pt-BR'));

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dh-left">
            <h1>PROTECTOR SISTEMAS</h1>
            <p>BIM Segurança Eletrônica</p>
            <div className="dh-version">{APP_VERSION.label}</div>
          </div>
          <div className="dh-user">
            <div className="dh-avatar">👤</div>
          </div>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-number">{projects.length}</div>
            <div className="stat-label">Projetos Ativos</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{clients.length}</div>
            <div className="stat-label">Clientes Cadastrados</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{customDeviceCount}</div>
            <div className="stat-label">Equipamentos Custom</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{lastAccess}</div>
            <div className="stat-label">Último Acesso</div>
          </div>
        </div>

        <div className="dashboard-modules">
          <div className="module-card primary" onClick={onNewProject}>
            <div className="mc-icon">📐</div>
            <div className="mc-title">Novo Projeto</div>
            <div className="mc-desc">Criar um novo projeto desde o início</div>
            <div className="mc-badge">Ação primária</div>
          </div>

          <div className="module-card" onClick={onOpenProject}>
            <div className="mc-icon">📂</div>
            <div className="mc-title">Projetos</div>
            <div className="mc-desc">{projects.length} projeto(s) salvo(s)</div>
            <div className="mc-badge">Ver lista</div>
          </div>

          <div className="module-card" onClick={onClients}>
            <div className="mc-icon">👥</div>
            <div className="mc-title">Clientes</div>
            <div className="mc-desc">{clients.length} cliente(s) cadastrado(s)</div>
            <div className="mc-badge">Gerenciar</div>
          </div>

          <div className="module-card" onClick={onRepo}>
            <div className="mc-icon">📦</div>
            <div className="mc-title">Repositório</div>
            <div className="mc-desc">Equipamentos customizados</div>
            <div className="mc-badge">Abrir</div>
          </div>

          <div className="module-card" onClick={onSettings}>
            <div className="mc-icon">⚙️</div>
            <div className="mc-title">Configurações</div>
            <div className="mc-desc">Dados da empresa</div>
            <div className="mc-badge">Configurar</div>
          </div>

          <div className="module-card" onClick={onSubscription}>
            <div className="mc-icon">💳</div>
            <div className="mc-title">Assinatura</div>
            <div className="mc-desc">Plano: Trial</div>
            <div className="mc-badge">Informações</div>
          </div>
        </div>
      </div>
    </div>
  );
}
