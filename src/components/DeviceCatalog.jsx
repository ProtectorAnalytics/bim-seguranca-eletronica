import React, { useState, useRef, useEffect } from 'react';
import { DEVICE_THUMBNAILS } from '@/data/device-thumbnails';
import { ICONS } from '@/icons';
import { getHiddenDevices, getDeviceOverrides, getHiddenFamilies, saveHiddenFamilies } from '@/lib/helpers';

export default function DeviceCatalog({search, setSearch, collapsedCats, toggleCat, pendingDevice, setPendingDevice, setTool, customDevices, DEVICE_LIB, showEquipmentRepo, setShowEquipmentRepo, refreshKey}){
  const hiddenSet=new Set(getHiddenDevices());
  const overrides=getDeviceOverrides();
  const [hiddenFamilies,setHiddenFamilies]=useState(()=>getHiddenFamilies());
  const [showFamilyMgr,setShowFamilyMgr]=useState(false);
  const familyMgrRef=useRef(null);

  // Close popover on outside click
  useEffect(()=>{
    if(!showFamilyMgr) return;
    const handler=(e)=>{
      if(familyMgrRef.current&&!familyMgrRef.current.contains(e.target)) setShowFamilyMgr(false);
    };
    document.addEventListener('mousedown',handler);
    return ()=>document.removeEventListener('mousedown',handler);
  },[showFamilyMgr]);

  const hiddenFamSet=new Set(hiddenFamilies);

  const toggleFamily=(catName)=>{
    const updated=hiddenFamSet.has(catName)
      ? hiddenFamilies.filter(c=>c!==catName)
      : [...hiddenFamilies,catName];
    setHiddenFamilies(updated);
    saveHiddenFamilies(updated);
  };

  const showAllFamilies=()=>{
    setHiddenFamilies([]);
    saveHiddenFamilies([]);
  };

  return (
    <>
      <input className="lp-search" placeholder="Buscar dispositivo..." value={search} onChange={e=>setSearch(e.target.value)}/>
      <div style={{display:'flex',gap:4,marginBottom:8}}>
        <button onClick={()=>setShowEquipmentRepo(true)}
          style={{flex:1,padding:'8px 10px',background:'rgba(243,156,18,.1)',border:'1px solid #f39c12',
            borderRadius:5,color:'#f39c12',fontSize:11,fontWeight:600,cursor:'pointer',transition:'.15s'}}
          onMouseOver={e=>e.currentTarget.style.background='rgba(243,156,18,.15)'}
          onMouseOut={e=>e.currentTarget.style.background='rgba(243,156,18,.1)'}>
          📦 Repositório
        </button>
        <div style={{position:'relative'}} ref={familyMgrRef}>
          <button onClick={()=>setShowFamilyMgr(!showFamilyMgr)}
            style={{padding:'8px 10px',background:showFamilyMgr?'var(--azul2)':hiddenFamilies.length>0?'rgba(239,68,68,.1)':'rgba(100,116,139,.08)',
              border:`1px solid ${showFamilyMgr?'var(--azul2)':hiddenFamilies.length>0?'#ef4444':'#94a3b8'}`,
              borderRadius:5,color:showFamilyMgr?'#fff':hiddenFamilies.length>0?'#ef4444':'#64748b',fontSize:11,fontWeight:600,cursor:'pointer',transition:'.15s',
              whiteSpace:'nowrap'}}>
            {hiddenFamilies.length>0?`👁️ ${DEVICE_LIB.length-hiddenFamilies.length}/${DEVICE_LIB.length}`:'👁️'}
          </button>

          {/* Family visibility popover */}
          {showFamilyMgr&&(
            <div style={{position:'absolute',top:'100%',right:0,marginTop:4,background:'#fff',border:'1px solid #e2e8f0',
              borderRadius:8,boxShadow:'0 8px 24px rgba(0,0,0,.15)',zIndex:999,width:220,maxHeight:380,overflow:'auto',padding:8}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,paddingBottom:6,borderBottom:'1px solid #e5e8eb'}}>
                <span style={{fontSize:11,fontWeight:700,color:'var(--azul)'}}>Famílias visíveis</span>
                {hiddenFamilies.length>0&&(
                  <button onClick={showAllFamilies}
                    style={{fontSize:9,padding:'2px 8px',background:'#dbeafe',color:'#2563eb',border:'none',borderRadius:4,cursor:'pointer',fontWeight:600}}>
                    Exibir todas
                  </button>
                )}
              </div>
              {DEVICE_LIB.map(cat=>{
                const isHidden=hiddenFamSet.has(cat.cat);
                const visibleCount=cat.items.filter(i=>!hiddenSet.has(i.key)&&!i.deprecated).length;
                return (
                  <div key={cat.cat}
                    onClick={()=>toggleFamily(cat.cat)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'6px 8px',marginBottom:2,borderRadius:6,
                      cursor:'pointer',transition:'.12s',background:isHidden?'#fef2f2':'transparent',
                      opacity:isHidden?.6:1}}
                    onMouseOver={e=>e.currentTarget.style.background=isHidden?'#fee2e2':'#f1f5f9'}
                    onMouseOut={e=>e.currentTarget.style.background=isHidden?'#fef2f2':'transparent'}>
                    {/* Toggle switch */}
                    <div style={{width:28,height:16,borderRadius:8,background:isHidden?'#e5e7eb':'#22c55e',
                      position:'relative',transition:'.15s',flexShrink:0}}>
                      <div style={{width:12,height:12,borderRadius:6,background:'#fff',position:'absolute',top:2,
                        left:isHidden?2:14,transition:'.15s',boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}/>
                    </div>
                    {/* Color dot + name */}
                    <div style={{width:8,height:8,borderRadius:'50%',background:cat.color,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:11,fontWeight:600,color:isHidden?'#9ca3af':'#374151',
                        overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.cat}</div>
                      <div style={{fontSize:8,color:'#9ca3af'}}>{visibleCount} dispositivo{visibleCount!==1?'s':''}</div>
                    </div>
                  </div>
                );
              })}
              {hiddenFamilies.length>0&&(
                <div style={{marginTop:6,paddingTop:6,borderTop:'1px solid #e5e8eb',fontSize:9,color:'#9ca3af',textAlign:'center'}}>
                  {hiddenFamilies.length} família{hiddenFamilies.length!==1?'s':''} oculta{hiddenFamilies.length!==1?'s':''}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {DEVICE_LIB.map(cat=>{
        // Skip hidden families
        if(hiddenFamSet.has(cat.cat)) return null;
        const filtered=cat.items.filter(i=>{
          if(hiddenSet.has(i.key)) return false;
          if(i.deprecated) return false;
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
      {/* Hidden families summary */}
      {hiddenFamilies.length>0&&!search&&(
        <div style={{padding:'10px 8px',margin:'4px 0',background:'#fef2f2',borderRadius:6,border:'1px dashed #fca5a5',textAlign:'center'}}>
          <span style={{fontSize:10,color:'#dc2626'}}>
            {hiddenFamilies.length} família{hiddenFamilies.length!==1?'s':''} oculta{hiddenFamilies.length!==1?'s':''}
          </span>
          <button onClick={()=>setShowFamilyMgr(true)}
            style={{display:'block',margin:'4px auto 0',fontSize:9,padding:'2px 10px',background:'#fee2e2',color:'#dc2626',
              border:'none',borderRadius:4,cursor:'pointer',fontWeight:600}}>
            Gerenciar
          </button>
        </div>
      )}
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
