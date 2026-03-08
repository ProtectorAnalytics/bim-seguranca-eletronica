import React from 'react';

export default function RackElevationModal({rack, devices, onClose}){
  if(!rack) return null;
  const rackUs=parseInt(rack.config?.rackU||42)||42;
  const uH=18;
  const installedDevices=devices.filter(d=>d.rackPos&&d.rackPos.rackId===rack.id).sort((a,b)=>(b.rackPos.u||0)-(a.rackPos.u||0));
  const usedUs=new Set();
  installedDevices.forEach(d=>{
    const startU=d.rackPos.u;
    const qty=d.rackPos.qty||1;
    for(let i=0;i<qty;i++) usedUs.add(startU+i);
  });
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:400}}>
        <h3>📦 Elevação do Rack - {rack.name}</h3>
        <div style={{display:'flex',gap:20}}>
          <div style={{flex:1}}>
            <div style={{background:'#1e293b',borderRadius:6,padding:8,border:'1px solid #334155',minHeight:400,position:'relative'}}>
              {Array.from({length:rackUs}).map((_,i)=>{
                const uNum=rackUs-i;
                const isUsed=usedUs.has(uNum);
                const dev=installedDevices.find(d=>d.rackPos.u===uNum);
                return (
                  <div key={uNum} style={{height:uH,borderBottom:'1px solid #334155',display:'flex',alignItems:'center',
                    padding:'0 6px',background:isUsed?'rgba(59,130,246,.12)':'transparent',fontSize:9,color:'#cbd5e1',
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    <span style={{width:24,textAlign:'right',fontWeight:700,color:'#94a3b8',marginRight:6}}>U{uNum}</span>
                    {dev&&<span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',color:'#dbeafe'}}>
                      {dev.name} ×{dev.rackPos.qty||1}
                    </span>}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{width:120}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',marginBottom:8}}>Resumo</div>
            <div style={{fontSize:11,marginBottom:12}}>
              <div>Total: <strong style={{color:'var(--azul)'}}>{rackUs}U</strong></div>
              <div>Usado: <strong style={{color:'#3b82f6'}}>{usedUs.size}U</strong></div>
              <div>Livre: <strong style={{color:'#22c55e'}}>{rackUs-usedUs.size}U</strong></div>
            </div>
            <div style={{fontSize:10,color:'var(--cinza)',padding:8,background:'#f8fafc',borderRadius:4}}>
              {installedDevices.length} dispositivo{installedDevices.length!==1?'s':''} instalado{installedDevices.length!==1?'s':''}
            </div>
          </div>
        </div>
        <div style={{display:'flex',gap:8,marginTop:16}}>
          <button className="mc-btn mc-btn-secondary" onClick={onClose} style={{flex:1}}>Fechar</button>
        </div>
      </div>
    </div>
  );
}
