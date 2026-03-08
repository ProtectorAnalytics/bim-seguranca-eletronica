import React from 'react';
import { DEVICE_THUMBNAILS } from '@/data/device-thumbnails';
import { ICONS } from '@/icons';
import { getHiddenDevices, getDeviceOverrides } from '@/lib/helpers';

export default function DeviceCatalog({search, setSearch, collapsedCats, toggleCat, pendingDevice, setPendingDevice, setTool, customDevices, DEVICE_LIB, showEquipmentRepo, setShowEquipmentRepo, refreshKey}){
  const hiddenSet=new Set(getHiddenDevices());
  const overrides=getDeviceOverrides();
  return (
    <>
      <input className="lp-search" placeholder="Buscar dispositivo..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <button onClick={()=>setShowEquipmentRepo(true)}
        style={{width:'100%',padding:'8px 10px',marginBottom:8,background:'rgba(243,156,18,.1)',border:'1px solid #f39c12',
          borderRadius:5,color:'#f39c12',fontSize:11,fontWeight:600,cursor:'pointer',transition:'.15s'}}
        onMouseOver={e=>e.currentTarget.style.background='rgba(243,156,18,.15)'}
        onMouseOut={e=>e.currentTarget.style.background='rgba(243,156,18,.1)'}>
        📦 Repositório
      </button>
      {DEVICE_LIB.map(cat=>{
        const filtered=cat.items.filter(i=>{
          if(hiddenSet.has(i.key)) return false;
          const displayName=overrides[i.key]?.name||i.name;
          if(search&&!displayName.toLowerCase().includes(search.toLowerCase())&&!i.key.includes(search.toLowerCase())) return false;
          return true;
        });
        if(!filtered.length) return null;
        const isOpen=search||!collapsedCats[cat.cat];
        return (
          <div key={cat.cat} className="dev-category">
            <div className="dev-cat-title" style={{color:cat.color,cursor:'pointer',userSelect:'none',display:'flex',alignItems:'center',gap:4}}
              onClick={()=>toggleCat(cat.cat)}>
              <span style={{fontSize:9,transition:'.15s',transform:isOpen?'rotate(90deg)':'rotate(0deg)',display:'inline-block'}}>▶</span>
              {cat.cat} <span className="cnt">{filtered.length}</span>
            </div>
            {isOpen&&filtered.map(item=>(
              <div key={item.key} className="dev-item"
                draggable
                onDragStart={(e)=>{e.dataTransfer.setData('deviceKey',item.key);e.dataTransfer.effectAllowed='copy'}}
                onClick={()=>{setPendingDevice(item.key);setTool('device')}}
                style={pendingDevice===item.key?{background:'#EBF5FB',borderColor:cat.color}:{cursor:'grab'}}>
                <div className="di-icon">{DEVICE_THUMBNAILS[item.key]?(
                  <img src={DEVICE_THUMBNAILS[item.key]} alt={item.name} style={{width:22,height:22,objectFit:'contain'}}/>
                ):ICONS[item.icon]?.(cat.color)}</div>
                <div className="di-info">
                  <div className="di-name">{overrides[item.key]?.name||item.name}</div>
                  <div className="di-spec">{(overrides[item.key]?.specs||item.props)?.resolucao||(overrides[item.key]?.specs||item.props)?.portas||(overrides[item.key]?.specs||item.props)?.potencia||''}</div>
                </div>
                {item.poe&&<span className="di-tag tag-poe">PoE</span>}
                {item.ampDC&&<span className="di-tag tag-dc">DC</span>}
              </div>
            ))}
          </div>
        );
      })}
      {customDevices.length>0&&(
        <div className="dev-category">
          <div className="dev-cat-title" style={{color:'#f39c12'}}>
            📦 Customizados <span className="cnt">{customDevices.length}</span>
          </div>
          {customDevices.map(item=>(
            <div key={item.key} className="dev-item"
              draggable
              onDragStart={(e)=>{e.dataTransfer.setData('deviceKey',item.key);e.dataTransfer.effectAllowed='copy'}}
              onClick={()=>{setPendingDevice(item.key);setTool('device')}}
              style={pendingDevice===item.key?{background:'#fef9e7',borderColor:'#f39c12'}:{cursor:'grab'}}>
              <div className="di-icon" style={{color:'#f39c12'}}>⚙️</div>
              <div className="di-info">
                <div className="di-name">{item.name}</div>
                <div className="di-spec">{item.deviceType}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
