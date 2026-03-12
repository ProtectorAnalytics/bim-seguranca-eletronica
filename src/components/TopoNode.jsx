import React from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { DEVICE_THUMBNAILS } from '@/data/device-thumbnails';
import { ICONS } from '@/icons';
import { findDevDef, getDeviceIconKey } from '@/lib/helpers';

export default function TopoNode({node,devices,level,onSelect}){
  const def=findDevDef(node.device.key);
  const catInfo=DEVICE_LIB.find(c=>c.items.some(i=>i.key===node.device.key));
  const isSwitch=node.device.key.startsWith('sw_');
  const usedPorts=node.children.length;
  const totalPorts=isSwitch?parseInt(String(def?.props?.portas||'8').split('+')[0]):0;

  return (
    <div>
      <div className={`topo-node ${node.disconnected?'topo-disconnected':''}`}
        style={{marginLeft:level*16,cursor:'pointer'}} onClick={()=>onSelect(node.device.id)}>
        <div className="tn-icon">{DEVICE_THUMBNAILS[node.device.key]?(
          <img src={DEVICE_THUMBNAILS[node.device.key]} alt={node.device.name} style={{width:18,height:18,objectFit:'contain'}}/>
        ):ICONS[getDeviceIconKey(node.device.key)]?.(catInfo?.color||'#999')}</div>
        <div className="tn-info">
          <div className="tn-name">{node.device.name}</div>
          <div className="tn-detail">{node.device.model||node.device.key}</div>
        </div>
        {isSwitch&&(
          <span className={`tn-ports ${usedPorts>=totalPorts?'ports-full':usedPorts>totalPorts*0.7?'ports-warn':'ports-ok'}`}>
            {usedPorts}/{totalPorts}
          </span>
        )}
        {node.disconnected&&<span style={{fontSize:9,color:'var(--vermelho)',fontWeight:700}}>⚠ Desconectado</span>}
      </div>
      {node.children.map((child,i)=>(
        <TopoNode key={i} node={child} devices={devices} level={level+1} onSelect={onSelect}/>
      ))}
    </div>
  );
}
