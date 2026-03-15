import React from 'react';
import { CABLE_TYPES, ROUTE_TYPES } from '@/data/cable-types';
import EnvironmentFilterBar from './EnvironmentFilterBar';
import { ENV_COLORS } from '@/data/constants';

/**
 * ToolbarPanel — horizontal toolbar with tools, cable options, layers and status
 */
export default function ToolbarPanel({
  tool, setTool,
  setPendingDevice, setCableMode, setMeasureStart,
  cableType, setCableType,
  routeType, setRouteType,
  autoCable,
  setShowMigrationWizard, legacyCount,
  iconSize, changeIconSize,
  showCableLabels, setShowCableLabels,
  deviceLabel, setDeviceLabel,
  snapToGrid, setSnapToGrid,
  layers, toggleLayer, applyLayerPreset,
  undo, redo,
  devices, connections, validations,
  envFilterTag, setEnvFilterTag,
}) {
  const selectTool = (t) => {
    setTool(t);
    setPendingDevice(null);
    if (t !== 'cable') setCableMode(null);
    if (t !== 'measure') setMeasureStart(null);
  };

  return (
    <div className="toolbar">
      {/* Ferramentas de edicao */}
      <div className="tool-group">
        <button className={`tool-btn ${tool==='select'?'active':''}`} title="Selecionar (V)"
          onClick={()=>selectTool('select')}>🖱️</button>
        <button className={`tool-btn ${tool==='pan'?'active':''}`} title="Mao / Arrastar (H / Space / Scroll-click)"
          onClick={()=>selectTool('pan')}>✋</button>
        <button className={`tool-btn ${tool==='cable'?'active':''}`} title="Cabear"
          onClick={()=>{setTool('cable');setPendingDevice(null);setMeasureStart(null)}}>🔗</button>
        <button className={`tool-btn ${tool==='env'?'active':''}`} title="Ambiente"
          onClick={()=>selectTool('env')}>🏠</button>
        <button className={`tool-btn ${tool==='measure'?'active':''}`} title="Cotas / Medir distancia"
          onClick={()=>{setTool('measure');setPendingDevice(null)}}>📏</button>
      </div>

      {/* Acoes rapidas */}
      <div className="tool-group">
        <button className="tool-btn" title="Auto Cabear" onClick={autoCable}>⚡</button>
        <button className="tool-btn" title="Migration Wizard — substituir dispositivos legados"
          onClick={()=>setShowMigrationWizard(true)}
          style={{position:'relative'}}>
          🔄
          {legacyCount>0&&<span style={{position:'absolute',top:-4,right:-4,background:'#f59e0b',color:'#fff',
            fontSize:8,fontWeight:700,borderRadius:'50%',width:14,height:14,display:'flex',alignItems:'center',
            justifyContent:'center',lineHeight:1}}>{legacyCount}</span>}
        </button>
      </div>

      {/* Opcoes de cabo (aparece so no modo cabo) */}
      {tool==='cable'&&(
        <div className="tool-group">
          <select value={cableType} onChange={e=>setCableType(e.target.value)}
            style={{padding:'4px 8px',border:'1px solid var(--cinzaM)',borderRadius:4,fontSize:11}}>
            <optgroup label="🌐 Dados">
              {CABLE_TYPES.filter(c=>c.group==='data').map(ct=><option key={ct.id} value={ct.id}>{ct.name}</option>)}
            </optgroup>
            <optgroup label="📡 Sinal / PP 2 vias">
              {CABLE_TYPES.filter(c=>c.group==='signal').map(ct=><option key={ct.id} value={ct.id}>{ct.name}{ct.secao?' (auto por dist.)':''}</option>)}
            </optgroup>
            <optgroup label="⚡ Energia">
              {CABLE_TYPES.filter(c=>c.group==='power').map(ct=><option key={ct.id} value={ct.id}>{ct.name}</option>)}
            </optgroup>
            <optgroup label="🔧 Automacao / PP 4 vias">
              {CABLE_TYPES.filter(c=>c.group==='automation').map(ct=><option key={ct.id} value={ct.id}>{ct.name}{ct.secao?' (auto por dist.)':''}</option>)}
            </optgroup>
          </select>
          <div style={{display:'flex',gap:2,marginLeft:4}}>
            {ROUTE_TYPES.map(rt=>(
              <button key={rt.id} className={`tool-btn ${routeType===rt.id?'active':''}`}
                title={`Rota: ${rt.name}`} style={{width:30,height:30,fontSize:14}}
                onClick={()=>setRouteType(rt.id)}>{rt.icon}</button>
            ))}
          </div>
        </div>
      )}

      {/* Icon size P/M/G */}
      <div className="tool-group">
        <span style={{fontSize:10,color:'var(--cinza)',fontWeight:600,marginRight:2}}>Icone:</span>
        {[{id:'sm',label:'P',title:'Pequeno (36px)'},{id:'md',label:'M',title:'Medio (46px)'},{id:'normal',label:'G',title:'Normal (58px)'}].map(s=>(
          <button key={s.id} className={`tool-btn ${iconSize===s.id?'active':''}`}
            style={{width:26,height:26,fontSize:11,fontWeight:700}} title={s.title}
            onClick={()=>changeIconSize(s.id)}>{s.label}</button>
        ))}
      </div>

      {/* Toggles de visualizacao */}
      <div className="tool-group" style={{borderLeft:'1px solid var(--cinzaM)',paddingLeft:8,position:'relative'}}>
        <button className={`tool-btn ${showCableLabels?'active':''}`} title={showCableLabels?'Ocultar nomes dos cabos':'Mostrar nomes dos cabos'}
          style={{width:30,height:30,fontSize:12}} onClick={()=>setShowCableLabels(v=>!v)}>Aa</button>
        <button className={`tool-btn ${deviceLabel!=='none'?'active':''}`}
          title={deviceLabel==='card'?'Modo: Card completo → Label':'Modo: '+(deviceLabel==='label'?'Label → Oculto':'Oculto → Card completo')}
          style={{width:30,height:30,fontSize:12}}
          onClick={()=>setDeviceLabel(v=>v==='card'?'label':v==='label'?'none':'card')}>
          {deviceLabel==='card'?'📋':deviceLabel==='label'?'🏷️':'⊘'}</button>
        <button className={`tool-btn ${snapToGrid?'active':''}`} title={snapToGrid?'Desativar snap na grade':'Ativar snap na grade'}
          style={{width:30,height:30,fontSize:13}} onClick={()=>setSnapToGrid(v=>!v)}>⊞</button>
        {/* Layers dropdown */}
        <div style={{position:'relative',display:'inline-block'}}>
          <button className={`tool-btn ${Object.values(layers).some(v=>!v)?'active':''}`}
            title="Camadas (Layers)" style={{width:30,height:30,fontSize:13}}
            onClick={(e)=>{
              const dd=e.currentTarget.nextElementSibling;
              dd.style.display=dd.style.display==='block'?'none':'block';
            }}>◧</button>
          <div style={{display:'none',position:'absolute',top:'100%',left:0,zIndex:100,
            background:'#ffffff',border:'1px solid #E2E8F0',borderRadius:8,padding:'6px 0',
            minWidth:160,boxShadow:'0 8px 24px rgba(0,0,0,.12)'}}>
            <div style={{fontSize:10,color:'#64748b',padding:'2px 10px 4px',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Camadas</div>
            {applyLayerPreset&&<>
              <div style={{fontSize:9,color:'#94a3b8',padding:'2px 10px 2px',fontWeight:600}}>Presets</div>
              {[{id:'client',label:'👤 Cliente',desc:'Limpo, sem cabos'},
                {id:'installer',label:'🔧 Instalador',desc:'Cabos + cotas'},
                {id:'engineer',label:'⚙️ Engenheiro',desc:'Tudo visível'}
              ].map(p=>(
                <div key={p.id} onClick={()=>applyLayerPreset(p.id)}
                  style={{padding:'4px 10px',cursor:'pointer',fontSize:10,color:'#046BD2',
                    display:'flex',justifyContent:'space-between',gap:8}}
                  onMouseOver={e=>e.currentTarget.style.background='#F0F5FA'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <span>{p.label}</span>
                  <span style={{color:'#94a3b8',fontSize:9}}>{p.desc}</span>
                </div>
              ))}
              <div style={{borderTop:'1px solid #E2E8F0',margin:'4px 0'}}/>
            </>}
            {[
              {key:'devices',label:'Dispositivos',icon:'📦'},
              {key:'cables',label:'Cabos',icon:'🔗'},
              {key:'environments',label:'Ambientes',icon:'🏠'},
              {key:'grid',label:'Grade',icon:'⊞'},
              {key:'bg',label:'Planta Fundo',icon:'🖼️'},
              {key:'dimensions',label:'Cotas',icon:'📏'},
              {key:'fov',label:'Campo de Visão',icon:'👁️'},
              {key:'heatmap',label:'Heatmap Cobertura',icon:'🔥'}
            ].map(l=>(
              <div key={l.key} onClick={()=>toggleLayer(l.key)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'5px 10px',cursor:'pointer',
                  fontSize:11,color:layers[l.key]?'#1e293b':'#94a3b8',transition:'.15s',
                  background:'transparent'}}
                onMouseOver={e=>e.currentTarget.style.background='#F0F5FA'}
                onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                <span style={{width:14,height:14,borderRadius:3,border:'1.5px solid',
                  borderColor:layers[l.key]?'#046BD2':'#cbd5e1',background:layers[l.key]?'#046BD2':'transparent',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:'#fff',flexShrink:0}}>
                  {layers[l.key]?'✓':''}
                </span>
                <span>{l.icon} {l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Undo / Redo / Print */}
      <div className="tool-group" style={{borderLeft:'1px solid var(--cinzaM)',paddingLeft:8}}>
        <button className="tool-btn" title="Desfazer (Ctrl+Z)" style={{width:30,height:30,fontSize:16}}
          onClick={undo}>↩</button>
        <button className="tool-btn" title="Refazer (Ctrl+Y)" style={{width:30,height:30,fontSize:16}}
          onClick={redo}>↪</button>
        <button className="tool-btn" title="Imprimir planta (Ctrl+P)" style={{width:30,height:30,fontSize:14}}
          onClick={()=>window.print()}>🖨️</button>
      </div>

      {/* Status */}
      <div className="sim-toggle">
        <span className="tool-label">Dispositivos: {devices.reduce((s,d)=>s+(d.qty||1),0)}</span>
        <span className="tool-label">|</span>
        <span className="tool-label">Conexoes: {connections.length}</span>
        <span className="tool-label">|</span>
        <span className="tool-label">Alertas: {validations.length}</span>
        {validations.length>0&&<span className="sb-dot sb-warn"/>}
        {validations.length===0&&devices.length>0&&<span className="sb-dot sb-ok"/>}
      </div>
      <EnvironmentFilterBar devices={devices} envFilterTag={envFilterTag}
        setEnvFilterTag={setEnvFilterTag} ENV_COLORS={ENV_COLORS}/>
    </div>
  );
}
