import React from 'react';

export default function EnvironmentFilterBar({devices, envFilterTag, setEnvFilterTag, ENV_COLORS}){
  const ambientes=Array.from(new Set(devices.map(d=>d.ambiente).filter(Boolean)));
  if(!ambientes.length) return null;
  return (
    <div style={{display:'flex',gap:4,marginLeft:8,paddingLeft:8,borderLeft:'1px solid #555',flexWrap:'wrap',alignItems:'center'}}>
      <span style={{fontSize:10,color:'#94a3b8',whiteSpace:'nowrap'}}>Ambiente:</span>
      {ambientes.map(amb=>{
        const envColor=ENV_COLORS.find(e=>e.name===amb)||{color:'#6b7280',name:amb};
        return (
          <button key={amb} className={`tool-btn ${envFilterTag===amb?'active':''}`}
            title={`Filtrar: ${amb}`}
            style={{width:'auto',height:28,fontSize:10,padding:'0 8px',background:envFilterTag===amb?envColor.color:'transparent',
              color:envFilterTag===amb?'#fff':'#cbd5e1',border:`1px solid ${envColor.color}`,borderRadius:4}}
            onClick={()=>setEnvFilterTag(envFilterTag===amb?null:amb)}>
            {amb}
          </button>
        );
      })}
    </div>
  );
}
