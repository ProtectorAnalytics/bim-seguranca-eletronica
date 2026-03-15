import React, { useState, useMemo } from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { KEY_MIGRATION_MAP, findDevDef } from '@/lib/helpers';

// Suggest modern replacements based on legacy key patterns
function suggestReplacement(legacyKey) {
  const k = legacyKey.toLowerCase();
  // CFTV MHD/HDCVI → CFTV IP equivalents
  if (k.includes('bullet') && k.includes('2mp')) return 'cam_ip_bullet_2mp';
  if (k.includes('bullet') && k.includes('3mp')) return 'cam_ip_bullet_3mp';
  if (k.includes('bullet') && k.includes('4')) return 'cam_ip_bullet_4mp';
  if (k.includes('bullet') && k.includes('8')) return 'cam_ip_bullet_8mp';
  if (k.includes('dome') && k.includes('vf')) return 'cam_ip_dome_vf_2mp';
  if (k.includes('dome') && k.includes('2mp')) return 'cam_ip_dome_2mp';
  if (k.includes('dome') && k.includes('4')) return 'cam_ip_dome_4mp';
  if (k.includes('dome') && k.includes('5')) return 'cam_ip_dome_4mp';
  if (k.includes('speed') || k.includes('ptz')) return 'cam_ip_speed_2mp';
  if (k.includes('mini')) return 'cam_ip_mini_2mp';
  if (k.includes('cam_mhd') || k.includes('cam_hdcvi')) return 'cam_ip_bullet_2mp';
  // DVR → NVR
  if (k.includes('dvr_4')) return 'nvr_4ch';
  if (k.includes('dvr_8')) return 'nvr_8ch';
  if (k.includes('dvr_16')) return 'nvr_16ch';
  if (k.includes('dvr_32')) return 'nvr_32ch';
  // Veicular — no direct equivalent
  if (k.includes('veicular')) return null;
  // Alarme → barreira
  if (k.includes('barreira')) return 'barreira_digital';
  // Incêndio — removed, no equivalent
  if (k.includes('fogo_') || k.includes('morley') || k.includes('central_inc') || k.includes('detector_') || k.includes('acionador_')) return null;
  // Iluminação emergência — removed
  if (k.includes('emerg_') || k.includes('lumin_')) return null;
  // Generic fallback
  return null;
}

export default function MigrationWizard({ devices, onReplace, onClose }) {
  const legacyDevs = useMemo(() =>
    devices.filter(d => d._legacy || (d.key in KEY_MIGRATION_MAP && KEY_MIGRATION_MAP[d.key] === null)),
    [devices]
  );

  const [selections, setSelections] = useState(() => {
    const map = {};
    legacyDevs.forEach(d => {
      const suggested = suggestReplacement(d._originalKey || d.key);
      map[d.id] = suggested || '';
    });
    return map;
  });

  const [applied, setApplied] = useState(new Set());

  // Build flat list of all available devices for replacement picker
  const allDevices = useMemo(() => {
    const items = [];
    DEVICE_LIB.forEach(cat => {
      cat.items.forEach(item => {
        if (!item.deprecated) items.push({ ...item, catColor: cat.color, catName: cat.cat });
      });
    });
    return items;
  }, []);

  const handleApply = (devId) => {
    const newKey = selections[devId];
    if (!newKey) return;
    onReplace(devId, newKey);
    setApplied(prev => new Set([...prev, devId]));
  };

  const handleApplyAll = () => {
    const toApply = legacyDevs.filter(d => selections[d.id] && !applied.has(d.id));
    toApply.forEach(d => onReplace(d.id, selections[d.id]));
    setApplied(new Set(legacyDevs.map(d => d.id)));
  };

  if (legacyDevs.length === 0) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 'min(480px, calc(100vw - 24px))', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <h3 style={{ margin: 0, fontSize: 16 }}>Nenhum dispositivo legado</h3>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
            Todos os dispositivos deste projeto são compatíveis com o catálogo atual.
          </p>
          <button onClick={onClose}
            style={{ padding: '8px 20px', background: 'var(--azul2)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const pendingCount = legacyDevs.filter(d => !applied.has(d.id) && selections[d.id]).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}
        style={{ maxWidth: 'min(640px, calc(100vw - 24px))', maxHeight: '80vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', background: '#fffbeb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>🔄</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 15 }}>Migration Wizard</h3>
              <p style={{ margin: 0, fontSize: 11, color: '#92400e' }}>
                {legacyDevs.length} dispositivo(s) legado(s) encontrado(s) — substitua por equivalentes atuais
              </p>
            </div>
          </div>
        </div>

        {/* Device list */}
        <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px' }}>
          {legacyDevs.map(dev => {
            const isDone = applied.has(dev.id);
            const selectedKey = selections[dev.id];
            const selectedDef = selectedKey ? findDevDef(selectedKey) : null;
            return (
              <div key={dev.id} style={{ padding: '10px 12px', marginBottom: 8, borderRadius: 8,
                border: `1px solid ${isDone ? '#86efac' : '#fde68a'}`,
                background: isDone ? '#f0fdf4' : '#fffbeb', transition: '.2s' }}>
                {/* Legacy device */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>{dev.name}</div>
                    <div style={{ fontSize: 10, color: '#b45309', fontFamily: 'monospace' }}>{dev._originalKey || dev.key}</div>
                  </div>
                  {isDone && <span style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>✓ Substituído</span>}
                </div>

                {!isDone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#64748b' }}>→</span>
                    <select value={selectedKey || ''} onChange={e => setSelections(prev => ({ ...prev, [dev.id]: e.target.value }))}
                      style={{ flex: 1, fontSize: 11, padding: '5px 8px', borderRadius: 4, border: '1px solid #d1d5db' }}>
                      <option value="">Selecione substituto...</option>
                      {DEVICE_LIB.map(cat => (
                        <optgroup key={cat.cat} label={cat.cat}>
                          {cat.items.filter(i => !i.deprecated).map(item => (
                            <option key={item.key} value={item.key}>{item.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <button onClick={() => handleApply(dev.id)} disabled={!selectedKey}
                      style={{ padding: '5px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4, border: 'none',
                        cursor: selectedKey ? 'pointer' : 'not-allowed',
                        background: selectedKey ? '#2563eb' : '#e5e7eb', color: selectedKey ? '#fff' : '#9ca3af' }}>
                      Aplicar
                    </button>
                  </div>
                )}

                {!isDone && selectedDef && (
                  <div style={{ marginTop: 6, padding: '4px 8px', background: '#eff6ff', borderRadius: 4, fontSize: 10, color: '#3b82f6' }}>
                    Sugerido: {selectedDef.name} {selectedDef.props?.resolucao ? `(${selectedDef.props.resolucao})` : ''}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: '#64748b' }}>
            {applied.size}/{legacyDevs.length} substituído(s)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {pendingCount > 0 && (
              <button onClick={handleApplyAll}
                style={{ padding: '7px 16px', fontSize: 11, fontWeight: 600, background: '#f59e0b', color: '#fff',
                  border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                Aplicar Todos ({pendingCount})
              </button>
            )}
            <button onClick={onClose}
              style={{ padding: '7px 16px', fontSize: 11, fontWeight: 600, background: '#64748b', color: '#fff',
                border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              {applied.size === legacyDevs.length ? 'Concluído' : 'Fechar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
