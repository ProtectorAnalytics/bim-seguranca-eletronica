import React from 'react';
import TopoNode from './TopoNode';

export default function TopologyPanel({topology, devices, floorName, setSelectedDevice, setRightTab}){
  return (
    <div>
      <div style={{fontSize:11,fontWeight:700,color:'var(--azul)',marginBottom:8}}>
        Topologia de Rede — {floorName}
      </div>
      {topology.map((node,i)=><TopoNode key={i} node={node} devices={devices} level={0}
        onSelect={(id)=>{setSelectedDevice(id);setRightTab('props')}}/>)}
      {devices.length===0&&<div style={{textAlign:'center',padding:20,color:'var(--cinza)',fontSize:11}}>
        Sem dispositivos no piso</div>}
    </div>
  );
}
