import React, { useState, useMemo } from 'react';
import { CABLE_TYPES } from '@/data/cable-types';
import { ICONS } from '@/icons';
import {
  findDevDef, getDeviceIconKey, getDeviceInterfaces, validateConnection, calcPPSection
} from '@/lib/helpers';
import { Layers, Cable, Search, X } from 'lucide-react';

export default function CrossFloorConnectionModal({
  project, sourceDeviceId, sourceFloorId, sourceIfaceType, sourceIfaceLabel,
  onConnect, onClose
}) {
  const [selectedFloorId, setSelectedFloorId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [cableType, setCableType] = useState('cat6');
  const [distance, setDistance] = useState(10);

  const sourceFloor = project.floors.find(f => f.id === sourceFloorId);
  const sourceDev = sourceFloor?.devices?.find(d => d.id === sourceDeviceId);

  // Other floors (exclude current)
  const otherFloors = project.floors.filter(f => f.id !== sourceFloorId);

  // Devices on selected floor, filtered by search and compatibility
  const targetDevices = useMemo(() => {
    if (!selectedFloorId || !sourceDev) return [];
    const floor = project.floors.find(f => f.id === selectedFloorId);
    if (!floor) return [];
    return floor.devices.map(dev => {
      const fromKey = getDeviceIconKey(sourceDev.key);
      const toKey = getDeviceIconKey(dev.key);
      const validation = validateConnection(fromKey, toKey, null);
      const compatible = validation?.valid || (validation?.cables?.length > 0);
      return { ...dev, compatible, validCables: validation?.cables || [] };
    }).filter(dev => {
      if (search) {
        const s = search.toLowerCase();
        return (dev.name?.toLowerCase().includes(s) || dev.key?.toLowerCase().includes(s));
      }
      return true;
    });
  }, [selectedFloorId, sourceDev, search, project.floors]);

  // Available cable types for selected target
  const availableCables = useMemo(() => {
    if (!selectedTargetId || !sourceDev) return CABLE_TYPES;
    const targetDev = targetDevices.find(d => d.id === selectedTargetId);
    if (!targetDev) return CABLE_TYPES;
    const fromKey = getDeviceIconKey(sourceDev.key);
    const toKey = getDeviceIconKey(targetDev.key);
    const validation = validateConnection(fromKey, toKey, null);
    if (validation?.cables?.length > 0) return CABLE_TYPES.filter(ct => validation.cables.includes(ct.id));
    return CABLE_TYPES;
  }, [selectedTargetId, sourceDev, targetDevices]);

  const handleConnect = () => {
    if (!selectedTargetId || !selectedFloorId) return;
    // Auto-calculate PP cable section
    let finalCable = cableType;
    const ct = CABLE_TYPES.find(c => c.id === cableType);
    if (ct?.vias && ct?.secao) {
      const rec = calcPPSection(distance, ct.vias);
      if (rec.secao !== ct.secao) finalCable = rec.id;
    }
    onConnect({
      fromDeviceId: sourceDeviceId,
      fromFloorId: sourceFloorId,
      toDeviceId: selectedTargetId,
      toFloorId: selectedFloorId,
      type: finalCable,
      distance: distance,
      ifaceType: sourceIfaceType || null,
      ifaceLabel: sourceIfaceLabel || ''
    });
  };

  const selectedFloor = project.floors.find(f => f.id === selectedFloorId);
  const selectedTarget = targetDevices.find(d => d.id === selectedTargetId);
  const sourceDef = sourceDev ? findDevDef(sourceDev.key) : null;

  const cableGroups = { data: [], signal: [], power: [], automation: [] };
  availableCables.forEach(ct => {
    const g = ct.group || 'data';
    if (cableGroups[g]) cableGroups[g].push(ct);
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 16, width: 560, maxHeight: '80vh',
        boxShadow: '0 20px 60px rgba(0,0,0,.2)', overflow: 'hidden', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Layers size={20} color="#046BD2" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Conexão entre Pavimentos</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              De: <strong>{sourceDev?.name}</strong> ({sourceFloor?.name})
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6,
            display: 'flex', alignItems: 'center'
          }}><X size={18} color="#94a3b8" /></button>
        </div>

        {/* Body */}
        <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
          {/* Step 1: Select floor */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#046BD2', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ background: '#046BD2', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>1</span>
              Selecionar Pavimento de Destino
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {otherFloors.map(f => (
                <button key={f.id} onClick={() => { setSelectedFloorId(f.id); setSelectedTargetId(null); }}
                  style={{
                    padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    border: selectedFloorId === f.id ? '2px solid #046BD2' : '1px solid #E2E8F0',
                    background: selectedFloorId === f.id ? '#EBF5FB' : '#fff',
                    color: selectedFloorId === f.id ? '#046BD2' : '#475569',
                    transition: 'all .15s'
                  }}>
                  <Layers size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
                  {f.name}
                  <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8' }}>({f.devices.length} disp.)</span>
                </button>
              ))}
              {otherFloors.length === 0 && (
                <div style={{ fontSize: 12, color: '#94a3b8', padding: 10 }}>Nenhum outro pavimento no projeto. Adicione um pavimento primeiro.</div>
              )}
            </div>
          </div>

          {/* Step 2: Select device */}
          {selectedFloorId && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#046BD2', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#046BD2', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>2</span>
                Selecionar Dispositivo de Destino
              </div>
              <div style={{ position: 'relative', marginBottom: 8 }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 9, color: '#94a3b8' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar dispositivo..."
                  style={{
                    width: '100%', padding: '8px 10px 8px 30px', border: '1px solid #E2E8F0', borderRadius: 8,
                    fontSize: 12, outline: 'none', boxSizing: 'border-box'
                  }} />
              </div>
              <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E2E8F0', borderRadius: 8 }}>
                {targetDevices.length === 0 && (
                  <div style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Nenhum dispositivo encontrado</div>
                )}
                {targetDevices.map(dev => {
                  const def = findDevDef(dev.key);
                  const iconKey = getDeviceIconKey(dev.key);
                  const Icon = ICONS[iconKey] || ICONS.generic;
                  const isSelected = selectedTargetId === dev.id;
                  return (
                    <div key={dev.id} onClick={() => {
                      setSelectedTargetId(dev.id);
                      // Auto-select best cable
                      if (dev.validCables?.length > 0) {
                        const firstValid = CABLE_TYPES.find(ct => dev.validCables.includes(ct.id));
                        if (firstValid) setCableType(firstValid.id);
                      }
                    }}
                      style={{
                        padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        background: isSelected ? '#EBF5FB' : 'transparent',
                        opacity: dev.compatible ? 1 : 0.4,
                        transition: 'background .15s'
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: dev.compatible ? '#f0f9ff' : '#f1f5f9', border: isSelected ? '2px solid #046BD2' : '1px solid #e2e8f0'
                      }}>
                        <Icon style={{ width: 18, height: 18 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>{dev.name}</div>
                        <div style={{ fontSize: 10, color: '#64748b' }}>{def?.cat || ''} {dev.model ? `· ${dev.model}` : ''}</div>
                      </div>
                      {dev.compatible ? (
                        <span style={{ fontSize: 9, color: '#16a34a', fontWeight: 700, background: '#f0fdf4', padding: '2px 6px', borderRadius: 4 }}>Compatível</span>
                      ) : (
                        <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>Incompatível</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Cable type and distance */}
          {selectedTargetId && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#046BD2', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ background: '#046BD2', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>3</span>
                Tipo de Cabo e Distância
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Tipo de cabo</label>
                  <select value={cableType} onChange={e => setCableType(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: 12, outline: 'none', background: '#fff'
                    }}>
                    {Object.entries(cableGroups).map(([group, cables]) => {
                      if (cables.length === 0) return null;
                      const labels = { data: 'Dados', signal: 'Sinal', power: 'Energia', automation: 'Automação' };
                      return (
                        <optgroup key={group} label={labels[group] || group}>
                          {cables.map(ct => <option key={ct.id} value={ct.id}>{ct.name}{ct.speed ? ` (${ct.speed})` : ''}</option>)}
                        </optgroup>
                      );
                    })}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 4, display: 'block' }}>Distância (m)</label>
                  <input type="number" value={distance} min={1} max={999}
                    onChange={e => setDistance(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '100%', padding: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 8,
                      fontSize: 12, outline: 'none', boxSizing: 'border-box'
                    }} />
                </div>
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>
                A distância deve incluir o percurso vertical entre pavimentos (shafts, eletrocalhas, etc.)
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 20px', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'flex-end', gap: 8
        }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff',
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b'
          }}>Cancelar</button>
          <button onClick={handleConnect} disabled={!selectedTargetId || !selectedFloorId}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: selectedTargetId ? 'pointer' : 'not-allowed',
              background: selectedTargetId ? '#046BD2' : '#94a3b8', color: '#fff',
              fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6,
              opacity: selectedTargetId ? 1 : 0.5
            }}>
            <Cable size={14} />
            Conectar
          </button>
        </div>
      </div>
    </div>
  );
}
