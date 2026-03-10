import React from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { CABLE_TYPES } from '@/data/cable-types';
import { MODEL_CATALOG } from '@/data/model-catalog';
import { DEVICE_THUMBNAILS } from '@/data/device-thumbnails';
import { ENV_COLORS } from '@/data/constants';
import { ICONS } from '@/icons';
import {
  isCamera, isSwitch, isGravador, needsPoE, needsIPConfig,
  getNvrChannels, getNvrUsedChannels, autoAssignCameras,
  canMountInRack, canMountInQuadro, getSwitchPorts
} from '@/data/device-interfaces';
import { findDevDef, getDeviceIconKey, isValidIPv4, isValidVLAN } from '@/lib/helpers';
import { getRackOccupancy } from '@/lib/rack-helpers';

/* ── Section header (replaces repeated inline fontSize:10 style) ── */
function SectionTitle({children, extra}){
  return (
    <div className="dp-section-title">
      <span>{children}</span>
      {extra}
    </div>
  );
}

/* ── Progress bar for ports/channels ── */
function ProgressBar({used, total}){
  const pct = Math.min(100, Math.round(used / total * 100));
  const isOver = used > total;
  const bg = isOver ? '#ef4444' : pct > 80 ? '#f59e0b' : '#22c55e';
  return (
    <div className="dp-progress">
      <div className="dp-progress-fill" style={{width: pct + '%', background: bg}}/>
    </div>
  );
}

/* ── Clickable device row (NVR cameras, switch ports, etc.) ── */
function DeviceListItem({name, qty, dotColor, suffix, onClick}){
  return (
    <div className="dp-list-item" onClick={onClick}>
      <span className="dp-dot" style={{background: dotColor}}/>
      <span className="dp-list-name">{name}{qty > 1 ? ` ×${qty}` : ''}</span>
      {suffix && <span className="dp-list-suffix">{suffix}</span>}
    </div>
  );
}

/* ── Main Component ── */
export default function DevicePropertiesPanel({
  dev, devices, connections, racks, quadros, iconSize,
  updateDevice, deleteConnection, copyDevice, deleteDevice,
  setSelectedDevice, setRightTab, setCableMode, setTool,
  showConnToast, assignDeviceToRackAction, unassignDeviceFromRack,
  assignDeviceToQuadro, unassignDeviceFromQuadro
}){
  if (!dev) return null;

  const def = findDevDef(dev.key);
  const catInfo = DEVICE_LIB.find(c => c.items.some(i => i.key === dev.key));
  const color = catInfo?.color || '#64748b';

  /* ── Header ── */
  const header = (
    <div className="prop-header">
      <div className="ph-icon">
        {DEVICE_THUMBNAILS[dev.key]
          ? <img src={DEVICE_THUMBNAILS[dev.key]} alt={dev.name} style={{width:32,height:32,objectFit:'contain'}}/>
          : ICONS[getDeviceIconKey(dev.key)]?.(color)}
      </div>
      <div className="ph-info">
        <div className="ph-name">{dev.name}</div>
        <div className="ph-model">{catInfo?.cat} · {dev.key}</div>
      </div>
      <span className="ph-replace">Substituir</span>
    </div>
  );

  /* ── Basic fields ── */
  const basicFields = (
    <div className="prop-section">
      <div className="prop-row">
        <span className="pr-label">Nome:</span>
        <span className="pr-value">
          <input value={dev.name} onChange={e => updateDevice(dev.id, {name: e.target.value})}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Modelo:</span>
        <span className="pr-value">
          <input value={dev.model || ''} placeholder="Ex: DS-2CD2143G2-I"
            onChange={e => updateDevice(dev.id, {model: e.target.value})}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Ambiente:</span>
        <span className="pr-value">
          <select value={dev.ambiente || ''} onChange={e => updateDevice(dev.id, {ambiente: e.target.value || null})}>
            <option value="">Nenhum</option>
            {ENV_COLORS.map(env => <option key={env.name} value={env.name}>{env.name}</option>)}
            <option value="">---</option>
            {Array.from(new Set(devices.map(d => d.ambiente).filter(a => a && !ENV_COLORS.find(e => e.name === a)))).map(amb =>
              <option key={amb} value={amb}>{amb}</option>
            )}
          </select>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Tamanho:</span>
        <span className="pr-value">
          <select value={dev.iconSize || ''} onChange={e => updateDevice(dev.id, {iconSize: e.target.value || null})}>
            <option value="">Padrão ({iconSize === 'sm' ? 'Pequeno' : iconSize === 'md' ? 'Médio' : 'Normal'})</option>
            <option value="sm">Pequeno</option>
            <option value="md">Médio</option>
            <option value="normal">Normal</option>
          </select>
        </span>
      </div>
    </div>
  );

  /* ── Specifications ── */
  const specs = def?.props ? (
    <>
      <SectionTitle>Especificações</SectionTitle>
      {Object.entries(def.props).map(([k, v]) => (
        <div key={k} className="prop-row">
          <span className="pr-label" style={{textTransform: 'capitalize'}}>{k}:</span>
          <span className="pr-value dp-spec-value">{v}</span>
        </div>
      ))}
      {def?.poe && (
        <div className="prop-row">
          <span className="pr-label">PoE:</span>
          <span className="pr-value" style={{fontWeight: 600, color: 'var(--verde)'}}>{def.poeW}W</span>
        </div>
      )}
    </>
  ) : null;

  /* ── NVR Assignment (for cameras) ── */
  const nvrSection = isCamera(dev.key) ? (() => {
    const allNvrs = devices.filter(d => isGravador(d.key));
    const totalQty = dev.qty || 1;
    const assignments = dev.nvrAssignments || [];
    const assignedTotal = assignments.reduce((s, a) => s + (a.qty || 0), 0);
    const unassigned = totalQty - assignedTotal;

    if (allNvrs.length === 0) {
      return (
        <div className="dp-empty-hint">
          ⚠ Nenhum NVR no andar. Adicione um NVR para atribuir gravação.
        </div>
      );
    }

    return (
      <div>
        <SectionTitle extra={
          unassigned > 0
            ? <span className="dp-badge-warn">{unassigned} sem NVR</span>
            : assignedTotal > 0 ? <span className="dp-badge-ok">✓</span> : null
        }>Gravação ({assignedTotal}/{totalQty})</SectionTitle>

        {allNvrs.map(nvr => {
          const nvrCh = getNvrChannels(nvr);
          const nvrUsed = getNvrUsedChannels(nvr.id, devices);
          const myAssign = assignments.find(a => a.nvrId === nvr.id);
          const myQty = myAssign?.qty || 0;
          const isOver = nvrUsed > nvrCh;
          return (
            <div key={nvr.id} className="dp-list-item">
              <span className="dp-dot" style={{background: isOver ? '#ef4444' : '#22c55e'}}/>
              <span className="dp-list-name" style={{fontWeight: myQty > 0 ? 700 : 400,
                color: myQty > 0 ? 'var(--azul)' : 'var(--cinza)'}}>
                {nvr.name}
                <span className="dp-list-meta" style={{color: isOver ? '#ef4444' : undefined}}>
                  {nvrUsed}/{nvrCh}ch
                </span>
              </span>
              <div className="dp-stepper">
                <button className="dp-stepper-btn" disabled={myQty <= 0}
                  onDoubleClick={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    if (myQty <= 0) return;
                    let newA = assignments.map(a => a.nvrId === nvr.id ? {...a, qty: a.qty - 1} : a).filter(a => a.qty > 0);
                    updateDevice(dev.id, {nvrAssignments: newA});
                  }}>−</button>
                <span className="dp-stepper-val" style={{color: myQty > 0 ? 'var(--azul)' : '#94a3b8'}}>{myQty}</span>
                <button className="dp-stepper-btn dp-stepper-plus" disabled={unassigned <= 0}
                  onDoubleClick={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    if (unassigned <= 0) return;
                    let newA = [...assignments];
                    const ex = newA.find(a => a.nvrId === nvr.id);
                    if (ex) ex.qty++; else newA.push({nvrId: nvr.id, qty: 1});
                    updateDevice(dev.id, {nvrAssignments: newA});
                  }}>+</button>
              </div>
            </div>
          );
        })}
        {unassigned > 0 && (
          <button className="dp-auto-btn"
            onClick={() => {
              const updates = autoAssignCameras(devices, connections);
              if (updates.length) {
                updates.forEach(u => updateDevice(u.id, {nvrAssignments: u.nvrAssignments}));
                showConnToast(updates.length + ' câmera(s) atribuídas automaticamente', 'success');
              } else showConnToast('Nenhum NVR alcançável via rede', 'warn');
            }}>⚡ Auto-distribuir ({unassigned} câmeras)</button>
        )}
      </div>
    );
  })() : null;

  /* ── Nobreak AC Config ── */
  const nobreakACSection = dev.key === 'nobreak_ac' ? (
    <>
      <SectionTitle>Configuração</SectionTitle>
      <div className="prop-row">
        <span className="pr-label">Modelo:</span>
        <span className="pr-value">
          <select value={dev.config?.modelId || ''}
            onChange={e => {
              const model = MODEL_CATALOG.nobreak_ac.find(m => m.id === e.target.value);
              updateDevice(dev.id, {config: {...dev.config, modelId: e.target.value, modelData: model}, model: model?.model || ''});
            }}>
            <option value="">Personalizado</option>
            {MODEL_CATALOG.nobreak_ac.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}
          </select>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">SNMP:</span>
        <span className="pr-value">
          <input type="checkbox" checked={dev.config?.snmp || false}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, snmp: e.target.checked}})}/>
          <span className="dp-check-label">Com placa SNMP</span>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Tomadas 10A:</span>
        <span className="pr-value">
          <input type="number" min="0" max="20" value={dev.config?.tomadas_10a || 0}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, tomadas_10a: parseInt(e.target.value) || 0}})}
            style={{width: '60px'}}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Tomadas 20A:</span>
        <span className="pr-value">
          <input type="number" min="0" max="20" value={dev.config?.tomadas_20a || 0}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, tomadas_20a: parseInt(e.target.value) || 0}})}
            style={{width: '60px'}}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Potência VA:</span>
        <span className="pr-value">
          <input type="number" min="600" max="10000" step="100" value={dev.config?.potenciaVA || 3000}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, potenciaVA: parseInt(e.target.value) || 3000}})}
            style={{width: '80px'}}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Bateria Ext:</span>
        <span className="pr-value">
          <input type="checkbox" checked={dev.config?.batExterna || false}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, batExterna: e.target.checked}})}/>
          <span className="dp-check-label">Módulo externo</span>
        </span>
      </div>
    </>
  ) : null;

  /* ── Nobreak DC Config ── */
  const nobreakDCSection = dev.key === 'nobreak_dc' ? (
    <>
      <SectionTitle>Configuração</SectionTitle>
      <div className="prop-row">
        <span className="pr-label">Modelo:</span>
        <span className="pr-value">
          <select value={dev.config?.modelId || ''}
            onChange={e => {
              const model = MODEL_CATALOG.nobreak_dc.find(m => m.id === e.target.value);
              updateDevice(dev.id, {config: {...dev.config, modelId: e.target.value, modelData: model}, model: model?.model || ''});
            }}>
            <option value="">Personalizado</option>
            {MODEL_CATALOG.nobreak_dc.map(m => <option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}
          </select>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Corrente (A):</span>
        <span className="pr-value">
          <select value={dev.config?.correnteSaida || 5}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, correnteSaida: parseInt(e.target.value) || 5}})}>
            <option value="5">5A</option>
            <option value="10">10A</option>
          </select>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Bat. Interna:</span>
        <span className="pr-value">
          <input type="checkbox" checked={dev.config?.batInterna || false}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, batInterna: e.target.checked}})}/>
          <span className="dp-check-label">Compartimento interno</span>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Bat. Externa:</span>
        <span className="pr-value">
          <input type="checkbox" checked={dev.config?.batExterna || false}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, batExterna: e.target.checked}})}/>
          <span className="dp-check-label">Módulo externo</span>
        </span>
      </div>
    </>
  ) : null;

  /* ── NVR Channel Map (when NVR is selected) ── */
  const nvrChannelSection = isGravador(dev.key) ? (() => {
    const totalCh = getNvrChannels(dev);
    const usedCh = getNvrUsedChannels(dev.id, devices);
    const isOver = usedCh > totalCh;
    const assignedCams = devices.filter(d => isCamera(d.key) && d.nvrAssignments?.some(a => a.nvrId === dev.id));
    return (
      <>
        <SectionTitle extra={isOver ? <span className="dp-badge-warn">⚠ EXCEDIDO</span> : null}>
          Canais ({usedCh}/{totalCh})
        </SectionTitle>
        <ProgressBar used={usedCh} total={totalCh}/>
        <div className="prop-row">
          <span className="pr-label">Canais totais:</span>
          <span className="pr-value">
            <input type="number" min="1" max="256" value={totalCh}
              onChange={e => updateDevice(dev.id, {config: {...dev.config, channels: parseInt(e.target.value) || 16}})}
              style={{width: '60px'}}/>
          </span>
        </div>
        {assignedCams.length > 0 ? assignedCams.map(cam => {
          const a = cam.nvrAssignments.find(x => x.nvrId === dev.id);
          return (
            <DeviceListItem key={cam.id} name={cam.name} qty={cam.qty || 1}
              dotColor="#3b82f6" suffix={`${a?.qty || 0}ch`}
              onClick={() => {setSelectedDevice(cam.id); setRightTab('props')}}/>
          );
        }) : (
          <div className="dp-empty-hint">
            Nenhuma câmera atribuída. Selecione uma câmera e atribua a este NVR.
          </div>
        )}
        {assignedCams.length === 0 && (
          <button className="dp-auto-btn" onClick={() => {
            const updates = autoAssignCameras(devices, connections);
            if (updates.length) {
              updates.forEach(u => updateDevice(u.id, {nvrAssignments: u.nvrAssignments}));
              showConnToast(updates.length + ' câmera(s) atribuídas automaticamente', 'success');
            } else showConnToast('Nenhuma câmera alcançável via rede', 'warn');
          }}>⚡ Auto-distribuir câmeras</button>
        )}
      </>
    );
  })() : null;

  /* ── Switch Port Usage ── */
  const switchSection = isSwitch(dev.key) ? (() => {
    const totalPorts = getSwitchPorts(dev);
    const connected = connections.filter(c => c.from === dev.id || c.to === dev.id)
      .map(c => { const oid = c.from === dev.id ? c.to : c.from; return devices.find(d => d.id === oid) }).filter(Boolean);
    const poeDevs = connected.filter(d => needsPoE(d.key));
    const uplinkDevs = connected.filter(d => !needsPoE(d.key));
    const usedPoePorts = poeDevs.reduce((s, d) => s + (d.qty || 1), 0);
    const usedUplinks = uplinkDevs.length;
    const isOver = usedPoePorts > totalPorts;
    return (
      <>
        <SectionTitle extra={isOver ? <span className="dp-badge-warn">⚠ {usedPoePorts - totalPorts} EXCEDENTES</span> : null}>
          Portas PoE ({usedPoePorts}/{totalPorts})
        </SectionTitle>
        <ProgressBar used={usedPoePorts} total={totalPorts}/>
        <div className="prop-row">
          <span className="pr-label">Portas totais:</span>
          <span className="pr-value">
            <input type="number" min="1" max="48" value={totalPorts}
              onChange={e => updateDevice(dev.id, {config: {...dev.config, portCount: parseInt(e.target.value) || 8}})}
              style={{width: '60px'}}/>
          </span>
        </div>
        {poeDevs.length > 0 && <div className="dp-sub-header">DISPOSITIVOS PoE</div>}
        {poeDevs.map(d => (
          <DeviceListItem key={d.id} name={d.name} qty={d.qty || 1}
            dotColor="#3b82f6" suffix={`${d.qty || 1}p`}
            onClick={() => {setSelectedDevice(d.id); setRightTab('props')}}/>
        ))}
        {uplinkDevs.length > 0 && <div className="dp-sub-header">UPLINKS ({usedUplinks})</div>}
        {uplinkDevs.map(d => (
          <DeviceListItem key={d.id} name={d.name} qty={1}
            dotColor="#f59e0b" suffix="1p"
            onClick={() => {setSelectedDevice(d.id); setRightTab('props')}}/>
        ))}
      </>
    );
  })() : null;

  /* ── Rack assignment ── */
  const rackAssignment = canMountInRack(dev.key) && racks.length > 0 ? (
    <div className="prop-row">
      <span className="pr-label">Rack:</span>
      <span className="pr-value">
        <select value={dev.parentRack || ''} onChange={e => {
          const rackId = e.target.value;
          if (rackId) assignDeviceToRackAction(dev.id, rackId);
          else if (dev.parentRack) unassignDeviceFromRack(dev.id);
        }}>
          <option value="">Não montado</option>
          {racks.map(r => {
            const occ = getRackOccupancy(r, devices);
            return <option key={r.id} value={r.id}>{r.name} ({r.tag}) — {occ.freeU}U livres</option>;
          })}
        </select>
      </span>
    </div>
  ) : null;

  /* ── Quadro assignment ── */
  const quadroAssignment = canMountInQuadro(dev.key) && quadros.length > 0 ? (
    <div className="prop-row">
      <span className="pr-label">Quadro:</span>
      <span className="pr-value">
        <select value={dev.quadroId || ''} onChange={e => {
          const qcId = e.target.value;
          if (qcId) assignDeviceToQuadro(dev.id, qcId);
          else if (dev.quadroId) unassignDeviceFromQuadro(dev.id);
        }}>
          <option value="">Não atribuído</option>
          {quadros.map(qc => {
            const cnt = devices.filter(d => d.quadroId === qc.id).length;
            return <option key={qc.id} value={qc.id}>{qc.tag} — {qc.name} ({cnt} itens)</option>;
          })}
        </select>
      </span>
    </div>
  ) : null;

  /* ── IP / VLAN Config ── */
  const ipSection = needsIPConfig(dev.key) ? (
    <>
      <SectionTitle>Rede (IP/VLAN)</SectionTitle>
      <div className="prop-row">
        <span className="pr-label">Endereço IP:</span>
        <span className="pr-value" style={{position: 'relative'}}>
          <input type="text" placeholder="192.168.1.100"
            value={dev.config?.ipAddress || ''}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, ipAddress: e.target.value}})}
            className="dp-ip-input"
            style={{borderColor: dev.config?.ipAddress && !isValidIPv4(dev.config.ipAddress) ? '#ef4444' : undefined}}/>
          {dev.config?.ipAddress && !isValidIPv4(dev.config.ipAddress) && (
            <span className="dp-ip-error">⚠ inválido</span>
          )}
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Máscara:</span>
        <span className="pr-value">
          <select value={dev.config?.subnetMask || '255.255.255.0'}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, subnetMask: e.target.value}})}
            className="dp-ip-input">
            <option value="255.255.255.0">/24 (255.255.255.0)</option>
            <option value="255.255.255.128">/25 (255.255.255.128)</option>
            <option value="255.255.255.192">/26 (255.255.255.192)</option>
            <option value="255.255.254.0">/23 (255.255.254.0)</option>
            <option value="255.255.252.0">/22 (255.255.252.0)</option>
            <option value="255.255.0.0">/16 (255.255.0.0)</option>
          </select>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">Gateway:</span>
        <span className="pr-value">
          <input type="text" placeholder="192.168.1.1"
            value={dev.config?.gateway || ''}
            onChange={e => updateDevice(dev.id, {config: {...dev.config, gateway: e.target.value}})}
            className="dp-ip-input"
            style={{borderColor: dev.config?.gateway && !isValidIPv4(dev.config.gateway) ? '#ef4444' : undefined}}/>
        </span>
      </div>
      <div className="prop-row">
        <span className="pr-label">VLAN ID:</span>
        <span className="pr-value">
          <input type="number" min="1" max="4094" placeholder="—"
            value={dev.config?.vlanId || ''}
            onChange={e => {
              const v = e.target.value;
              updateDevice(dev.id, {config: {...dev.config, vlanId: v ? parseInt(v) : null}});
            }}
            style={{width: '70px', fontFamily: 'monospace', fontSize: 12,
              borderColor: dev.config?.vlanId && !isValidVLAN(dev.config.vlanId) ? '#ef4444' : undefined}}/>
          {dev.config?.vlanId && !isValidVLAN(dev.config.vlanId) && (
            <span className="dp-ip-error" style={{position: 'static', marginLeft: 4}}>⚠ 1-4094</span>
          )}
        </span>
      </div>
    </>
  ) : null;

  /* ── Connections list ── */
  const devConnections = connections.filter(c => c.from === dev.id || c.to === dev.id);
  const connectionsSection = (
    <>
      <SectionTitle>Conexões ({devConnections.length})</SectionTitle>
      {devConnections.map(conn => {
        const otherId = conn.from === dev.id ? conn.to : conn.from;
        const other = devices.find(d => d.id === otherId);
        const ct = CABLE_TYPES.find(c => c.id === conn.type);
        const purposeIcon = ct?.group === 'power' ? '⚡' : ct?.group === 'signal' ? '📡' : '🌐';
        return (
          <div key={conn.id} className="dp-conn-item">
            <span className="dp-dot" style={{background: ct?.color || '#999'}}/>
            <span className="dp-conn-info">
              <div className="dp-conn-name">{other?.name || '?'}</div>
              <div className="dp-conn-detail">{purposeIcon} {ct?.name} · {conn.distance}m · {conn.purpose || 'dados'}{conn.ifaceLabel ? ` · ${conn.ifaceLabel.split('(')[0].trim()}` : ''}</div>
            </span>
            <span className="dp-conn-del" onClick={() => deleteConnection(conn.id)}>✕</span>
          </div>
        );
      })}
      <button className="dp-add-conn-btn"
        onClick={() => {setCableMode({from: dev.id}); setTool('cable')}}>
        + Adicionar Conexão
      </button>
    </>
  );

  /* ── Actions ── */
  const actions = (
    <div className="prop-actions" style={{marginTop: 16}}>
      <button className="btn-copy" onClick={() => copyDevice(dev.id)}>📋 Copiar</button>
      <button className="btn-delete" onClick={() => deleteDevice(dev.id)}>🗑️ Excluir</button>
    </div>
  );

  return (
    <div>
      {header}
      {basicFields}
      {specs}
      {nvrSection}
      {nobreakACSection}
      {nobreakDCSection}
      {nvrChannelSection}
      {switchSection}
      {rackAssignment}
      {quadroAssignment}
      {ipSection}
      {connectionsSection}
      {actions}
    </div>
  );
}
