import React, { useState } from 'react';
import { buildFacePlan, getRackOccupancy, generateDeviceTag } from '@/lib/rack-helpers';
import { canMountInRack, getDeviceUSize } from '@/data/device-interfaces';
import { MODEL_CATALOG } from '@/data/model-catalog';

export default function RackPanel({
  racks, devices, selectedRackId,
  onSelectRack, onCreateRack, onUpdateRack, onDeleteRack,
  onAssignDevice, onUnassignDevice, onSelectDevice
}) {
  const [editingName, setEditingName] = useState(false);
  const rack = racks.find(r => r.id === selectedRackId);
  const occupancy = rack ? getRackOccupancy(rack, devices) : null;
  const facePlan = rack ? buildFacePlan(rack, devices) : [];
  const mountableDevices = devices.filter(d => canMountInRack(d.key) && !d.parentRack);

  // ── Empty state ────────────────────────────────────────────────────
  if (!racks.length) {
    return (
      <div className="rack-empty-state">
        <div style={{fontSize:36,marginBottom:12}}>🗄️</div>
        <div style={{fontSize:13,fontWeight:700,color:'#334155',marginBottom:4}}>Nenhum Rack Cadastrado</div>
        <div style={{fontSize:11,color:'#94a3b8',marginBottom:16,lineHeight:1.5}}>
          Crie um rack para organizar switches, NVRs, nobreaks e gerar o Plano de Faces profissional.
        </div>
        <button className="rack-btn-primary" onClick={onCreateRack}>
          + Criar Rack
        </button>
      </div>
    );
  }

  // ── Main panel ─────────────────────────────────────────────────────
  return (
    <div className="rack-panel">
      {/* Rack selector */}
      <div className="rack-selector">
        <select value={selectedRackId || ''} onChange={e => onSelectRack(e.target.value)}
          style={{flex:1,fontSize:11,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:4}}>
          <option value="">Selecionar rack...</option>
          {racks.map(r => {
            const occ = getRackOccupancy(r, devices);
            return <option key={r.id} value={r.id}>{r.name} ({r.tag}) — {occ.percent}% ocupado</option>;
          })}
        </select>
        <button className="rack-btn-sm" onClick={onCreateRack} title="Criar novo rack">+</button>
      </div>

      {!rack ? (
        <div style={{padding:16,fontSize:11,color:'#94a3b8',textAlign:'center'}}>
          Selecione um rack acima ou crie um novo.
        </div>
      ) : (
        <>
          {/* Rack info */}
          <div className="rack-info">
            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
              <span style={{fontSize:9,fontWeight:700,color:'#64748b',background:'#f1f5f9',
                padding:'2px 6px',borderRadius:3}}>{rack.tag}</span>
              {editingName ? (
                <input autoFocus value={rack.name} style={{flex:1,fontSize:12,fontWeight:700,
                  padding:'2px 6px',border:'1px solid var(--azul2)',borderRadius:3,outline:'none'}}
                  onChange={e => onUpdateRack(rack.id, {name: e.target.value})}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={e => { if(e.key==='Enter') setEditingName(false) }}/>
              ) : (
                <span style={{flex:1,fontSize:12,fontWeight:700,color:'#1e293b',cursor:'pointer'}}
                  onClick={() => setEditingName(true)} title="Clique para editar">{rack.name}</span>
              )}
              <span style={{cursor:'pointer',fontSize:14,color:'#ef4444',opacity:.6,fontWeight:700}}
                title="Excluir rack" onClick={() => {
                  if(confirm(`Excluir "${rack.name}"? Dispositivos serão desatribuídos.`)) onDeleteRack(rack.id);
                }}>✕</span>
            </div>

            {/* Config row */}
            <div style={{display:'flex',gap:8,marginBottom:8}}>
              <div style={{flex:1}}>
                <label style={{fontSize:9,color:'#64748b',fontWeight:600}}>Altura</label>
                <select value={rack.alturaU} style={{width:'100%',fontSize:10,padding:'3px 4px',
                  border:'1px solid #d1d5db',borderRadius:3}}
                  onChange={e => onUpdateRack(rack.id, {alturaU: parseInt(e.target.value)})}>
                  {[5,7,9,12,16,20,24,28,32,36,42,44].map(u => <option key={u} value={u}>{u}U</option>)}
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:9,color:'#64748b',fontWeight:600}}>Profundidade</label>
                <select value={rack.profundidade} style={{width:'100%',fontSize:10,padding:'3px 4px',
                  border:'1px solid #d1d5db',borderRadius:3}}
                  onChange={e => onUpdateRack(rack.id, {profundidade: e.target.value})}>
                  <option value="300mm">300mm</option>
                  <option value="450mm">450mm</option>
                  <option value="570mm">570mm</option>
                  <option value="600mm">600mm</option>
                  <option value="800mm">800mm</option>
                </select>
              </div>
              <div style={{flex:1}}>
                <label style={{fontSize:9,color:'#64748b',fontWeight:600}}>Local</label>
                <input value={rack.location||''} placeholder="Ex: Sala TI"
                  style={{width:'100%',fontSize:10,padding:'3px 4px',border:'1px solid #d1d5db',borderRadius:3}}
                  onChange={e => onUpdateRack(rack.id, {location: e.target.value})}/>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="rack-occupancy">
              <div style={{display:'flex',justifyContent:'space-between',fontSize:9,color:'#64748b',marginBottom:3}}>
                <span>{occupancy.deviceCount} dispositivos</span>
                <span style={{fontWeight:700,
                  color:occupancy.percent>=90?'#ef4444':occupancy.percent>=70?'#f59e0b':'#22c55e'}}>
                  {occupancy.usedU}/{occupancy.totalU}U ({occupancy.percent}%)
                </span>
              </div>
              <div style={{height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden'}}>
                <div style={{height:'100%',borderRadius:3,transition:'width .3s',
                  width:`${occupancy.percent}%`,
                  background:occupancy.percent>=90?'#ef4444':occupancy.percent>=70?'#f59e0b':'#22c55e'}}/>
              </div>
            </div>
          </div>

          {/* Face plan table */}
          <div style={{fontSize:11,fontWeight:700,color:'#334155',padding:'8px 10px 4px',
            textTransform:'uppercase',letterSpacing:.5}}>
            Plano de Faces
          </div>
          <div className="rack-face-table">
            <table>
              <thead>
                <tr>
                  <th style={{width:45}}>POS.</th>
                  <th>DESCRIÇÃO</th>
                  <th style={{width:90}}>IDENTIFIC.</th>
                </tr>
              </thead>
              <tbody>
                {facePlan.map((row, i) => (
                  <tr key={i} className={row.device ? 'rack-face-occupied' : 'rack-face-free'}
                    style={{cursor: row.device ? 'pointer' : 'default'}}
                    onClick={() => { if(row.device) onSelectDevice(row.device.id) }}>
                    <td className="rack-face-pos">{row.pos}U</td>
                    <td className="rack-face-desc">
                      {row.device ? (
                        <div style={{display:'flex',alignItems:'center',gap:4}}>
                          <span style={{flex:1,fontWeight:600}}>{row.description}</span>
                          {row.uSize > 1 && <span style={{fontSize:8,color:'#94a3b8'}}>{row.uSize}U</span>}
                          <span style={{fontSize:10,color:'#ef4444',cursor:'pointer',opacity:.5,fontWeight:700,
                            padding:'0 3px'}} title="Remover do rack"
                            onClick={e => { e.stopPropagation(); onUnassignDevice(row.device.id) }}>✕</span>
                        </div>
                      ) : (
                        <span style={{color:'#94a3b8',fontStyle:'italic'}}>LIVRE</span>
                      )}
                    </td>
                    <td className="rack-face-id">
                      {row.identification && <span style={{fontFamily:'monospace',fontSize:10,
                        fontWeight:700,color:'#3b82f6'}}>{row.identification}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add device to rack */}
          {mountableDevices.length > 0 && (
            <div style={{padding:'8px 10px'}}>
              <select style={{width:'100%',fontSize:10,padding:'5px 6px',border:'1px solid #d1d5db',borderRadius:4}}
                value="" onChange={e => { if(e.target.value) onAssignDevice(e.target.value, rack.id); }}>
                <option value="">+ Adicionar dispositivo ao rack...</option>
                {mountableDevices.map(d => {
                  const uSize = getDeviceUSize(d.key);
                  return <option key={d.id} value={d.id}>{d.name} ({uSize}U)</option>;
                })}
              </select>
            </div>
          )}

          {/* Accessories */}
          <div style={{padding:'4px 10px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'#64748b',textTransform:'uppercase',
              letterSpacing:.5,marginBottom:4}}>
              Acessórios ({(rack.acessorios||[]).length})
            </div>
            {(rack.acessorios||[]).map((acc, i) => (
              <div key={i} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',
                fontSize:10,borderBottom:'1px solid #f0f0f0'}}>
                <span style={{flex:1}}>{acc.name}</span>
                <span style={{fontSize:8,color:'#94a3b8'}}>{acc.unidades||1}U</span>
                <span style={{cursor:'pointer',color:'#ef4444',fontSize:10}}
                  onClick={() => {
                    const accs = [...(rack.acessorios||[])];
                    accs.splice(i, 1);
                    onUpdateRack(rack.id, {acessorios: accs});
                  }}>✕</span>
              </div>
            ))}
            <select style={{width:'100%',marginTop:4,fontSize:10,padding:'4px 6px',
              border:'1px solid #d1d5db',borderRadius:4}}
              value="" onChange={e => {
                if(!e.target.value) return;
                const acc = MODEL_CATALOG.rack_acessorio?.find(a => a.id === e.target.value);
                if(acc) {
                  const accs = [...(rack.acessorios||[]), {...acc}];
                  onUpdateRack(rack.id, {acessorios: accs});
                }
                e.target.value = '';
              }}>
              <option value="">+ Adicionar acessório...</option>
              {(MODEL_CATALOG.rack_acessorio||[]).map(a =>
                <option key={a.id} value={a.id}>{a.name} ({a.unidades||1}U)</option>
              )}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
