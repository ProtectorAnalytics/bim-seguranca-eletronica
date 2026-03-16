import React from 'react';
import { CABLE_TYPES } from '@/data/cable-types';
import { Layers } from 'lucide-react';
import { getDeviceInterfaces, getPortDotClass, getPortTypeName } from '@/lib/helpers';

/**
 * Port connection popup for selecting device interfaces.
 */
export default function PortConnectionPopup({
  portPopup, devices, connections, project,
  setCableMode, setTool, setPortPopup, setCrossFloorModal
}) {
  if (!portPopup) return null;
  const ppDev = devices.find(d => d.id === portPopup.devId);
  if (!ppDev) return null;
  const ifaces = getDeviceInterfaces(ppDev);
  if (!ifaces.length) return null;

  const usedPorts = connections.filter(c => c.from === ppDev.id || c.to === ppDev.id);
  const getPortUsageCount = (iface) => usedPorts.filter(c => c.ifaceType === iface.type).length;
  const totalUsed = usedPorts.length;
  const totalPorts = ifaces.length;

  return (
    <>
      <div className="port-popup-overlay" onClick={() => setPortPopup(null)} />
      <div className="port-popup" style={{ left: portPopup.x, top: portPopup.y, position: 'fixed', maxHeight: 'calc(100vh - 24px)', overflowY: 'auto' }}>
        <div className="pp-title">⚡ Portas — {ppDev.name}
          <span style={{ fontSize: 10, fontWeight: 400, marginLeft: 8, color: totalUsed > 0 ? '#f59e0b' : '#6b7280' }}>
            ({totalUsed}/{totalPorts} em uso)
          </span>
        </div>
        {ifaces.map((iface, i) => {
          const usage = getPortUsageCount(iface);
          const isUsed = usage > 0;
          const connectedTo = isUsed ? usedPorts.filter(c => c.ifaceType === iface.type).map(c => {
            const otherId = c.from === ppDev.id ? c.to : c.from;
            const otherDev = devices.find(d => d.id === otherId);
            return otherDev?.name || '?';
          }).join(', ') : '';
          return (
            <button key={i} className="port-btn" style={{ opacity: isUsed ? 0.6 : 1, position: 'relative' }} onClick={() => {
              try {
                setCableMode({ from: ppDev.id, ifaceType: iface.type || 'data_io', ifaceLabel: iface.label || '' });
                setTool('cable');
                setPortPopup(null);
              } catch (err) { console.error('Port select error', err); setPortPopup(null); }
            }}>
              <div className={`pb-dot ${getPortDotClass(iface.type)}`} style={isUsed ? { boxShadow: '0 0 0 2px #f59e0b' } : {}} />
              <div className="pb-info">
                <div className="pb-label">{iface.label}
                  {isUsed && <span style={{ marginLeft: 6, fontSize: 9, color: '#f59e0b', fontWeight: 700 }}>✓ CONECTADA → {connectedTo}</span>}
                </div>
                <div className="pb-type">{getPortTypeName(iface.type)} · {iface.cables?.map(c => CABLE_TYPES.find(ct => ct.id === c)?.name || c).join(', ')}</div>
              </div>
              {isUsed ? <span style={{ fontSize: 9, color: '#f59e0b', fontWeight: 700, flexShrink: 0 }}>EM USO</span> :
                iface.required ? <span className="pb-req">OBRIG.</span> : <span className="pb-opt">disponível</span>}
            </button>);
        })}
        {project.floors.length > 1 && (
          <button className="port-btn" style={{ borderTop: '2px solid #E2E8F0', marginTop: 4, background: '#f0f9ff' }}
            onClick={() => {
              setCrossFloorModal({ deviceId: ppDev.id });
              setPortPopup(null);
            }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#046BD2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Layers size={10} color="#fff" />
            </div>
            <div className="pb-info">
              <div className="pb-label" style={{ color: '#046BD2', fontWeight: 700 }}>Conectar a outro Pavimento</div>
              <div className="pb-type">Criar conexão entre pisos diferentes</div>
            </div>
            <span style={{ fontSize: 9, color: '#046BD2', fontWeight: 700, flexShrink: 0 }}>CROSS-FLOOR</span>
          </button>
        )}
      </div>
    </>
  );
}
