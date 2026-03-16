import React from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { canMountInQuadro, isSwitchPoE, isFonteNobreak, isONT } from '@/data/device-interfaces';

/**
 * Right panel tab for Quadro de Conectividade management.
 */
export default function QuadroDetailPanel({
  quadros, devices, connections: _connections, selectedQuadroId, setSelectedQuadroId,
  addQuadro, updateQuadro, deleteQuadro,
  assignDeviceToQuadro, unassignDeviceFromQuadro,
  setSelectedDevice, setRightTab
}) {
  const getQuadroBom = (qc) => {
    const qcDevices = devices.filter(d => d.quadroId === qc.id);
    const bom = [];
    bom.push({ name: `Caixa hermética ${qc.caixa || '50x40x20'}cm`, qty: 1 });
    bom.push({ name: 'Canaleta vazada 30×50mm', qty: 2 });
    bom.push({ name: `Disjuntor ${qc.disjuntor?.tipo || 'bipolar'} ${qc.disjuntor?.amperagem || 16}A`, qty: 1 });
    if (qcDevices.some(d => isSwitchPoE(d.key)) && qcDevices.some(d => isFonteNobreak(d.key)))
      bom.push({ name: 'Conversor DC/DC 12V 3A', qty: 1 });
    if (qcDevices.some(d => isONT(d.key))) {
      bom.push({ name: 'Roseta óptica', qty: 1 });
      bom.push({ name: 'Acoplador (emenda óptica)', qty: 1 });
      bom.push({ name: 'Cordão óptico SC/APC', qty: 1 });
    }
    if (qc.aterramento === 'individual') {
      bom.push({ name: 'Haste de aterramento', qty: 1 });
      bom.push({ name: 'Barramento de terra', qty: 1 });
      bom.push({ name: 'Caixa de aterramento', qty: 1 });
      bom.push({ name: 'Conector GTDU', qty: 1 });
    }
    if ((qc.prensaCabo || 0) > 0) bom.push({ name: 'Prensa-cabo', qty: qc.prensaCabo });
    return bom;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#166534' }}>📦 Quadros de Conectividade</div>
        <button onClick={() => addQuadro()} style={{
          padding: '4px 10px', border: '1px solid #16a34a',
          background: '#f0fdf4', color: '#166534', borderRadius: 6, fontSize: 10, cursor: 'pointer', fontWeight: 700
        }}>
          + Novo QC
        </button>
      </div>
      {quadros.length === 0 && (
        <div style={{ textAlign: 'center', padding: '30px 16px', color: '#86efac' }}>
          <div style={{ fontSize: 28, opacity: .4, marginBottom: 8 }}>📦</div>
          <p style={{ fontSize: 11, color: '#64748b' }}>Nenhum quadro criado</p>
          <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>Clique "+ Novo QC" para adicionar</p>
        </div>
      )}
      {quadros.map(qc => {
        const qcDevices = devices.filter(d => d.quadroId === qc.id);
        const isSel = selectedQuadroId === qc.id;
        return (
          <div key={qc.id} style={{
            border: `1.5px solid ${isSel ? '#16a34a' : '#e5e7eb'}`, borderRadius: 8,
            marginBottom: 8, background: isSel ? '#f0fdf4' : '#fff', cursor: 'pointer', overflow: 'hidden'
          }}
            onClick={() => setSelectedQuadroId(isSel ? null : qc.id)}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderBottom: isSel ? '1px solid #dcfce7' : 'none'
            }}>
              <span style={{ fontSize: 14 }}>📦</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#166534' }}>{qc.tag}</div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{qc.name} · {qcDevices.length} dispositivos</div>
              </div>
              <span style={{
                fontSize: 8, fontWeight: 600, color: '#fff', background: '#16a34a',
                padding: '2px 6px', borderRadius: 4
              }}>{qc.caixa}</span>
            </div>
            {isSel && (
              <div style={{ padding: '8px 10px' }} onClick={e => e.stopPropagation()}>
                <div className="prop-row">
                  <span className="pr-label" style={{ fontSize: 9 }}>Nome:</span>
                  <span className="pr-value">
                    <input value={qc.name} style={{ fontSize: 10 }} onChange={e => updateQuadro(qc.id, { name: e.target.value })} />
                  </span>
                </div>
                <div className="prop-row">
                  <span className="pr-label" style={{ fontSize: 9 }}>Caixa (cm):</span>
                  <span className="pr-value">
                    <select value={qc.caixa || '50x40x20'} style={{ fontSize: 10 }}
                      onChange={e => updateQuadro(qc.id, { caixa: e.target.value })}>
                      <option value="30x30x15">30×30×15</option>
                      <option value="40x30x20">40×30×20</option>
                      <option value="50x40x20">50×40×20</option>
                      <option value="60x50x25">60×50×25</option>
                      <option value="80x60x25">80×60×25</option>
                    </select>
                  </span>
                </div>
                <div className="prop-row">
                  <span className="pr-label" style={{ fontSize: 9 }}>Aterramento:</span>
                  <span className="pr-value">
                    <select value={qc.aterramento || 'individual'} style={{ fontSize: 10 }}
                      onChange={e => updateQuadro(qc.id, { aterramento: e.target.value })}>
                      <option value="individual">Individual (haste própria)</option>
                      <option value="edificacao">Edificação (barramento geral)</option>
                      <option value="nenhum">Nenhum</option>
                    </select>
                  </span>
                </div>
                <div className="prop-row">
                  <span className="pr-label" style={{ fontSize: 9 }}>Disjuntor:</span>
                  <span className="pr-value" style={{ display: 'flex', gap: 4 }}>
                    <select value={qc.disjuntor?.tipo || 'bipolar'} style={{ fontSize: 10, flex: 1 }}
                      onChange={e => updateQuadro(qc.id, { disjuntor: { ...qc.disjuntor, tipo: e.target.value } })}>
                      <option value="unipolar">Unipolar</option>
                      <option value="bipolar">Bipolar</option>
                      <option value="tripolar">Tripolar</option>
                    </select>
                    <select value={qc.disjuntor?.amperagem || 16} style={{ fontSize: 10, width: 60 }}
                      onChange={e => updateQuadro(qc.id, { disjuntor: { ...qc.disjuntor, amperagem: parseInt(e.target.value) } })}>
                      {[6, 10, 16, 20, 25, 32, 40].map(a => <option key={a} value={a}>{a}A</option>)}
                    </select>
                  </span>
                </div>
                <div className="prop-row">
                  <span className="pr-label" style={{ fontSize: 9 }}>Prensa-cabo:</span>
                  <span className="pr-value">
                    <input type="number" min="0" max="30" value={qc.prensaCabo || 0} style={{ width: 50, fontSize: 10 }}
                      onChange={e => updateQuadro(qc.id, { prensaCabo: parseInt(e.target.value) || 0 })} />
                  </span>
                </div>

                <div style={{
                  fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: .5, marginTop: 10, marginBottom: 4
                }}>
                  Dispositivos ({qcDevices.length})
                </div>
                {qcDevices.length > 0 ? qcDevices.map(d => {
                  const catColor = DEVICE_LIB.find(c => c.items.some(it => it.key === d.key))?.color || '#6b7280';
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0',
                      fontSize: 9, borderBottom: '1px solid #f0f0f0'
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, flexShrink: 0 }} />
                      <span style={{ flex: 1, cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={(e) => { e.stopPropagation(); setSelectedDevice(d.id); setRightTab('props'); }}>
                        {d.name}
                      </span>
                      <span style={{ fontSize: 8, color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                        onClick={(e) => { e.stopPropagation(); unassignDeviceFromQuadro(d.id); }}>✕</span>
                    </div>
                  );
                }) : (
                  <div style={{ fontSize: 9, color: '#94a3b8', padding: '6px 0', textAlign: 'center' }}>
                    Nenhum dispositivo atribuído
                  </div>
                )}

                {(() => {
                  const unassigned = devices.filter(d => !d.quadroId && !d.parentRack && canMountInQuadro(d.key));
                  if (!unassigned.length) return null;
                  return (
                    <div style={{ marginTop: 6 }}>
                      <select style={{ width: '100%', fontSize: 9, padding: '3px 4px', borderRadius: 4, border: '1px solid #d1d5db' }}
                        value="" onChange={e => { if (e.target.value) assignDeviceToQuadro(e.target.value, qc.id); }}>
                        <option value="">+ Atribuir dispositivo...</option>
                        {unassigned.map(d => <option key={d.id} value={d.id}>{d.name} ({d.key})</option>)}
                      </select>
                    </div>
                  );
                })()}

                <div style={{
                  fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase',
                  letterSpacing: .5, marginTop: 10, marginBottom: 4
                }}>
                  BOM Automático
                </div>
                {getQuadroBom(qc).map((item, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 9,
                    padding: '2px 0', borderBottom: '1px solid #f8fafc', color: '#334155'
                  }}>
                    <span>{item.name}</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>{item.qty}×</span>
                  </div>
                ))}

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={(e) => { e.stopPropagation(); deleteQuadro(qc.id); }}
                    style={{
                      flex: 1, padding: '5px 8px', fontSize: 9, fontWeight: 600, background: '#fef2f2',
                      color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer'
                    }}>
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
