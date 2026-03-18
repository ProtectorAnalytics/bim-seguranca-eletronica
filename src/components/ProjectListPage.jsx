import React, { useState, useEffect } from 'react';
import { ArrowLeft, Cloud, HardDrive, Trash2, Upload, Download, Loader2, FolderOpen, AlertTriangle } from 'lucide-react';
import { getSavedProjects, saveProjects, getCachedCloudProjects, setCachedCloudProjects, removeCachedProject } from '@/lib/helpers';
import { listCloudProjects, deleteCloudProject, saveCloudProject } from '@/lib/projectStorage';
import { validateProjectData } from '@/lib/projectValidator';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from './Toast';

const SCENARIO_LABELS = { residencial: 'Residencial', comercial: 'Comercial', industrial: 'Industrial', condominio: 'Condomínio', educacional: 'Educacional' };
const STATUS_LABELS = { rascunho: 'Rascunho', em_andamento: 'Em andamento', finalizado: 'Finalizado', aprovado: 'Aprovado' };
const STATUS_COLORS = { rascunho: '#94a3b8', em_andamento: '#f59e0b', finalizado: '#22c55e', aprovado: '#046BD2' };

export default function ProjectListPage({ onBack, onOpenProject }) {
  const { user, getAccessToken } = useAuth();
  const showToast = useToast();
  const [localProjects, setLocalProjects] = useState(getSavedProjects());
  const [cloudProjects, setCloudProjects] = useState(getCachedCloudProjects());
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [search, setSearch] = useState('');
  const [migrating, setMigrating] = useState(null);
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch cloud projects on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoadingCloud(true);
      const token = await getAccessToken();
      if (!token) { setLoadingCloud(false); return; }
      const { projects, error } = await listCloudProjects(token);
      if (!error) {
        setCloudProjects(projects);
        setCachedCloudProjects(projects);
      }
      setLoadingCloud(false);

      // Check for migration: user has local projects but no cloud ones
      const localOnly = getSavedProjects().filter(p => !p.storageMode || p.storageMode === 'local');
      if (localOnly.length > 0 && projects.length === 0) {
        setShowMigrationDialog(true);
      }
    })();
  }, [user]);

  // Merge local + cloud, deduplicate by id
  const allProjects = React.useMemo(() => {
    const map = new Map();
    cloudProjects.forEach(p => map.set(p.id, { ...p, _source: 'cloud', storageMode: 'cloud', _needsCloudLoad: true }));
    localProjects.forEach(p => {
      if (!map.has(p.id)) {
        map.set(p.id, { ...p, _source: p.storageMode === 'cloud' ? 'cloud-cached' : 'local' });
      }
    });
    return Array.from(map.values());
  }, [localProjects, cloudProjects]);

  const filtered = allProjects.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.nome || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleDeleteConfirmed = async () => {
    const proj = confirmDelete;
    setConfirmDelete(null);

    if (proj.storageMode === 'cloud' || proj._source === 'cloud') {
      const token = await getAccessToken();
      if (!token) { showToast('Erro: sem autenticação. Faça login novamente.', 'error'); return; }
      const { error } = await deleteCloudProject(proj.id, token);
      if (error) { showToast('Erro ao deletar do cloud: ' + error.message, 'error'); return; }
      setCloudProjects(prev => prev.filter(p => p.id !== proj.id));
      setCachedCloudProjects(cloudProjects.filter(p => p.id !== proj.id));
      removeCachedProject(proj.id);
    }

    const updated = localProjects.filter(p => p.id !== proj.id);
    setLocalProjects(updated);
    saveProjects(updated);
    showToast('Projeto removido com sucesso.', 'success');
  };

  const handleMoveToCloud = async (proj) => {
    setMigrating(proj.id);
    const token = await getAccessToken();
    if (!token) { showToast('Erro: sem token de acesso', 'error'); setMigrating(null); return; }

    const fullProj = localProjects.find(p => p.id === proj.id);
    if (!fullProj) { setMigrating(null); return; }

    const appProj = { name: fullProj.name, scenario: fullProj.scenario, client: fullProj.client, floors: fullProj.floors, activeFloor: fullProj.activeFloor, settings: fullProj.settings };
    const { error } = await saveCloudProject(appProj, proj.id, user.id, token);

    if (error) {
      showToast('Erro ao mover para nuvem: ' + error.message, 'error');
      setMigrating(null);
      return;
    }

    const updated = localProjects.map(p => p.id === proj.id ? { ...p, storageMode: 'cloud' } : p);
    setLocalProjects(updated);
    saveProjects(updated);

    const { projects } = await listCloudProjects(token);
    if (projects) { setCloudProjects(projects); setCachedCloudProjects(projects); }
    setMigrating(null);
    showToast('Projeto movido para a nuvem com sucesso!', 'success');
  };

  const handleMigrateAll = async () => {
    setShowMigrationDialog(false);
    const token = await getAccessToken();
    if (!token) return;

    const localOnly = localProjects.filter(p => !p.storageMode || p.storageMode === 'local');
    for (const proj of localOnly) {
      setMigrating(proj.id);
      const appProj = { name: proj.name, scenario: proj.scenario, client: proj.client, floors: proj.floors, activeFloor: proj.activeFloor, settings: proj.settings };
      const { error } = await saveCloudProject(appProj, proj.id, user.id, token);
      if (error) {
        console.warn('[migrate] Failed:', proj.id, error.message);
        break;
      }
    }
    const updated = localProjects.map(p => ({ ...p, storageMode: 'cloud' }));
    setLocalProjects(updated);
    saveProjects(updated);

    const { projects } = await listCloudProjects(token);
    if (projects) { setCloudProjects(projects); setCachedCloudProjects(projects); }
    setMigrating(null);
    showToast('Projetos migrados para a nuvem com sucesso!', 'success');
  };

  const handleExport = (proj) => {
    const fullProj = localProjects.find(p => p.id === proj.id) || proj;
    const exportData = {
      _format: 'bim-protector',
      _version: 1,
      exportedAt: new Date().toISOString(),
      project: {
        id: fullProj.id, name: fullProj.name, scenario: fullProj.scenario,
        client: fullProj.client, floors: fullProj.floors,
        activeFloor: fullProj.activeFloor, settings: fullProj.settings,
      }
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(fullProj.name || 'projeto').replace(/[^a-zA-Z0-9]/g, '_')}.bim.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.bim.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          const { valid, errors, project: validatedProj } = validateProjectData(data, file.size);
          if (!valid || !validatedProj) {
            showToast('Erro na validação: ' + errors.join('; '), 'error');
            return;
          }
          if (errors.length > 0) {
            console.warn('[import] Warnings:', errors);
          }
          const proj = validatedProj;
          proj.id = 'proj_' + Date.now();
          proj.storageMode = 'local';
          proj.createdAt = new Date().toISOString().split('T')[0];
          proj.updatedAt = new Date().toISOString().split('T')[0];
          proj.deviceCount = (proj.floors || []).flatMap(f => f.devices || []).length;
          proj.status = 'rascunho';
          const updated = [...localProjects, proj];
          setLocalProjects(updated);
          saveProjects(updated);
          showToast('Projeto importado com sucesso!', 'success');
        } catch (err) {
          showToast('Erro ao importar: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        <button
          className="modal-back-btn"
          onClick={onBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={15} style={{ flexShrink: 0 }} />
          Voltar
        </button>

        <div className="dashboard-list" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Projetos Salvos</h3>
            <button
              onClick={handleImport}
              style={{
                background: '#fff', border: '1px solid #E2E8F0', color: '#046BD2',
                padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600,
                transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; e.currentTarget.style.borderColor = '#046BD2'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <Download size={14} /> Importar .bim.json
            </button>
          </div>

          <input type="text" className="search-input" placeholder="Buscar por nome ou cliente..." value={search} onChange={e => setSearch(e.target.value)} />

          {loadingCloud && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', fontSize: 12, color: '#64748b' }}>
              <Loader2 size={14} className="spin" /> Carregando projetos da nuvem...
            </div>
          )}

          {showMigrationDialog && (
            <div style={{
              padding: '16px 20px', marginBottom: 12, borderRadius: 10,
              background: '#EFF6FF', border: '1px solid #BFDBFE',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#046BD2', fontWeight: 600, marginBottom: 8 }}>
                <Cloud size={16} />
                Sincronizar projetos com a nuvem?
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px' }}>
                Você tem <strong>{localProjects.filter(p => !p.storageMode || p.storageMode === 'local').length} projeto(s)</strong> salvo(s) localmente.
                Mova para a nuvem para manter tudo seguro e acessível de qualquer lugar.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleMigrateAll} style={{
                  background: '#046BD2', color: '#fff', border: 'none',
                  padding: '7px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>
                  Sim, mover para nuvem
                </button>
                <button onClick={() => setShowMigrationDialog(false)} style={{
                  background: 'transparent', color: '#64748b', border: '1px solid #E2E8F0',
                  padding: '7px 16px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                }}>
                  Depois
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <FolderOpen size={40} style={{ color: '#CBD5E1', display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>
                {search ? 'Nenhum projeto corresponde à busca' : 'Nenhum projeto encontrado'}
              </div>
              {!search && <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Crie um novo projeto no dashboard para começar.</div>}
            </div>
          ) : (
            filtered.map(p => (
              <div key={p.id} className="list-item" style={{ position: 'relative' }}>
                <div className="list-item-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h4 style={{ margin: 0 }}>{p.name}</h4>
                    {(p.storageMode === 'cloud' || p._source === 'cloud') ? (
                      <span title="Salvo na nuvem" style={{ color: '#046BD2', display: 'flex', alignItems: 'center' }}>
                        <Cloud size={13} />
                      </span>
                    ) : (
                      <span title="Salvo localmente" style={{ color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                        <HardDrive size={13} />
                      </span>
                    )}
                    {p.status && (
                      <span style={{
                        fontSize: 10, fontWeight: 600,
                        color: STATUS_COLORS[p.status] || '#94a3b8',
                        background: (STATUS_COLORS[p.status] || '#94a3b8') + '18',
                        padding: '2px 7px', borderRadius: 20,
                      }}>
                        {STATUS_LABELS[p.status] || p.status}
                      </span>
                    )}
                    {p.scenario && (
                      <span style={{ fontSize: 10, color: '#64748b', background: '#F1F5F9', padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>
                        {SCENARIO_LABELS[p.scenario] || p.scenario}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: 0 }}>
                    {p.client?.nome ? `${p.client.nome} · ` : ''}
                    {(p.device_count ?? p.deviceCount ?? 0)} dispositivos
                    {(p.updated_at?.split('T')[0] || p.updatedAt) ? ` · ${p.updated_at?.split('T')[0] || p.updatedAt}` : ''}
                  </p>
                </div>
                <div className="list-actions" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {migrating === p.id && <Loader2 size={14} className="spin" style={{ color: '#046BD2' }} />}

                  {(!p.storageMode || p.storageMode === 'local') && p._source !== 'cloud' && (
                    <button
                      className="list-btn"
                      title="Mover para nuvem"
                      aria-label="Mover para nuvem"
                      onClick={() => handleMoveToCloud(p)}
                      disabled={migrating === p.id}
                      style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Upload size={12} /> Nuvem
                    </button>
                  )}

                  <button
                    className="list-btn"
                    title="Exportar JSON"
                    aria-label={`Exportar projeto ${p.name}`}
                    onClick={() => handleExport(p)}
                    style={{ padding: '4px 8px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Download size={12} />
                  </button>
                  <button className="list-btn" onClick={() => onOpenProject(p)}>Abrir</button>
                  <button
                    className="list-btn"
                    aria-label={`Deletar projeto ${p.name}`}
                    onClick={() => setConfirmDelete(p)}
                    style={{ color: '#f87171' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(15,23,42,.45)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px',
          }}
          onClick={() => setConfirmDelete(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-delete-title"
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 12, padding: '24px 28px',
              maxWidth: 380, width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ background: '#FEF2F2', borderRadius: 8, padding: 8, display: 'flex', flexShrink: 0 }}>
                <AlertTriangle size={18} color="#dc2626" />
              </div>
              <h4 id="confirm-delete-title" style={{ margin: 0, fontSize: 15, color: '#0F172A', fontWeight: 700 }}>
                Deletar projeto?
              </h4>
            </div>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
              O projeto <strong>"{confirmDelete.name}"</strong> será removido permanentemente.
              Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmDelete(null)}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  background: '#F1F5F9', color: '#475569', border: 'none',
                  borderRadius: 8, cursor: 'pointer', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
                onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirmed}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  background: '#dc2626', color: '#fff', border: 'none',
                  borderRadius: 8, cursor: 'pointer', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
