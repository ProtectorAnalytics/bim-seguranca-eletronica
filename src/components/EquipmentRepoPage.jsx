import React, { useState } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { getCustomDevices, saveCustomDevices } from '@/lib/helpers';
import EquipmentRepoModal from './EquipmentRepoModal';

const CAT_COLORS = {
  camera: '#f59e0b', acesso: '#3b82f6', fechadura: '#ef4444',
  alarme: '#f97316', sensor: '#84cc16', switch_rede: '#06b6d4',
  gravador: '#8b5cf6', fonte_energia: '#ec4899', nobreak: '#f43f5e', infra: '#6b7280',
};

const CAT_LABELS = {
  camera: 'Câmeras', acesso: 'Controle de Acesso', fechadura: 'Fechadura',
  alarme: 'Alarme', sensor: 'Sensores', switch_rede: 'Switches/Rede',
  gravador: 'Gravador', fonte_energia: 'Fonte de Energia', nobreak: 'Nobreak', infra: 'Infraestrutura',
};

function EquipmentRepoAddButton({ customDevices, onSave }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '10px 20px', fontSize: 13,
          background: 'var(--azul2, #046BD2)', color: '#fff',
          border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
          transition: 'background .15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#0359b5'}
        onMouseLeave={e => e.currentTarget.style.background = 'var(--azul2, #046BD2)'}
      >
        <Plus size={15} />
        Novo equipamento
      </button>
      {showModal && (
        <EquipmentRepoModal
          customDevices={customDevices}
          onSave={(dev) => { onSave(dev); setShowModal(false); }}
          onDelete={() => {}}
          onClose={() => setShowModal(false)}
          startAtStep={2}
        />
      )}
    </>
  );
}

export default function EquipmentRepoPage({ onBack }) {
  const [customDevices, setCustomDevices] = useState(() => getCustomDevices());
  const [editingDevice, setEditingDevice] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleSave = (device) => {
    const updated = [...customDevices.filter(d => d.key !== device.key), device];
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  const handleDelete = (key) => {
    const updated = customDevices.filter(d => d.key !== key);
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  return (
    <div className="dashboard-container" style={{ background: 'var(--cinzaL, #F0F5FA)', minHeight: '100vh' }}>
      <div className="dashboard-content" style={{ maxWidth: 780, margin: '0 auto', padding: '24px 20px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            className="modal-back-btn"
            onClick={onBack}
            style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ArrowLeft size={15} style={{ flexShrink: 0 }} />
            Voltar
          </button>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--azul2, #046BD2)', margin: 0 }}>
            Repositório de Equipamentos
          </h2>
        </div>

        <div className="anim-fade" style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,.08))' }}>
          <p style={{ fontSize: 13, color: 'var(--cinza)', marginBottom: 20, marginTop: 0 }}>
            Gerencie seus equipamentos personalizados para uso em projetos.
            Equipamentos criados aqui ficam disponíveis na paleta do canvas.
          </p>

          {/* Equipment list */}
          <div style={{ marginBottom: 20 }}>
            {customDevices.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px 16px',
                border: '2px dashed #E2E8F0', borderRadius: 10,
              }}>
                <Package size={40} style={{ color: '#CBD5E1', display: 'block', margin: '0 auto 12px' }} />
                <div style={{ fontWeight: 600, color: '#475569', fontSize: 13, marginBottom: 4 }}>Nenhum equipamento personalizado</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>Clique em <strong>"Novo equipamento"</strong> para cadastrar.</div>
              </div>
            ) : (
              customDevices.map(dev => {
                const catColor = CAT_COLORS[dev.category] || '#999';
                const isHovered = hoveredCard === dev.id;
                return (
                  <div
                    key={dev.id}
                    className="anim-slide-up"
                    onMouseEnter={() => setHoveredCard(dev.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      padding: '14px 16px', marginBottom: 10,
                      background: isHovered ? '#F8FAFC' : '#fff',
                      borderRadius: 10,
                      border: `1px solid ${isHovered ? catColor + '50' : '#E2E8F0'}`,
                      borderLeft: `4px solid ${catColor}`,
                      transition: 'all .15s ease',
                      boxShadow: isHovered ? '0 4px 12px rgba(0,0,0,.06)' : '0 1px 3px rgba(0,0,0,.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, marginBottom: 5 }}>{dev.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{
                            background: catColor + '15', color: catColor,
                            padding: '2px 8px', borderRadius: 20,
                            fontWeight: 600, fontSize: 10, letterSpacing: '0.3px',
                          }}>
                            {CAT_LABELS[dev.category] || dev.category}
                          </span>
                          <span style={{ fontSize: 11, color: '#64748b' }}>Base: {dev.deviceType}</span>
                          {dev.referencia && (
                            <span style={{ fontSize: 11, color: '#64748b' }}>Ref: {dev.referencia}</span>
                          )}
                        </div>
                        {dev.specs && Object.keys(dev.specs).length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                            {Object.entries(dev.specs).slice(0, 5).map(([k, v]) => (
                              <span key={k} style={{
                                background: '#F1F5F9', color: '#475569',
                                padding: '2px 7px', borderRadius: 4, fontSize: 10,
                              }}>
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          onClick={() => setEditingDevice(dev)}
                          aria-label={`Editar ${dev.name}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', fontSize: 11,
                            background: 'var(--azul2, #046BD2)', color: '#fff',
                            border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                            transition: 'background .15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#0359b5'}
                          onMouseLeave={e => e.currentTarget.style.background = 'var(--azul2, #046BD2)'}
                        >
                          <Pencil size={12} /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(dev.key)}
                          aria-label={`Remover ${dev.name}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', fontSize: 11,
                            background: '#FEF2F2', color: '#dc2626',
                            border: '1px solid #FECACA',
                            borderRadius: 6, cursor: 'pointer', fontWeight: 600,
                            transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = '#dc2626'; }}
                        >
                          <Trash2 size={12} /> Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', gap: 10, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', fontSize: 13,
                background: '#F1F5F9', color: '#475569',
                border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#E2E8F0'}
              onMouseLeave={e => e.currentTarget.style.background = '#F1F5F9'}
            >
              <ArrowLeft size={14} /> Voltar
            </button>
            <EquipmentRepoAddButton customDevices={customDevices} onSave={handleSave} />
          </div>
        </div>
      </div>

      {editingDevice && (
        <EquipmentRepoModal
          customDevices={customDevices}
          onSave={(dev) => { handleSave(dev); setEditingDevice(null); }}
          onDelete={() => { handleDelete(editingDevice.key); setEditingDevice(null); }}
          onClose={() => setEditingDevice(null)}
          startAtStep={2}
        />
      )}
    </div>
  );
}
