import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { DEVICE_LIB } from '@/data/device-lib';
import { CABLE_TYPES } from '@/data/cable-types';
import { MODEL_CATALOG } from '@/data/model-catalog';
import { SCENARIOS, ENV_COLORS, APP_VERSION } from '@/data/constants';
import { REGRAS } from '@/data/validation-rules';
import { ICONS } from '@/icons';
import {
  isCamera, isSwitch, isSwitchPoE, isGravador, isDVR,
  isCentralAlarme, isCentralIncendio, isDetectorIncendio, isSirene,
  isPerifericoAlarme, isAutomatizador, isCameraMHD, isNobreak, isFonte,
  isFonteNobreak, isONT, isBateria,
  isSensorZona, needsPoE, needsACPower, needsDCPower,
  getNvrChannels, getNvrUsedChannels, getPortUsage,
  getConnectedNetDevices, trimNvrAssignments, autoAssignCameras,
  canMountInQuadro,
  getSwitchPorts
} from '@/data/device-interfaces';
import {
  findDevDef, uid, syncUid, dedupDeviceIds, getDeviceIconKey, getDeviceColor, getCustomDevices, saveCustomDevices,
  getDeviceInterfaces, getPortDotClass, getPortTypeName, validateConnection,
  calcPPSection, calcCableDistance, getDefaultCable, getSettings, saveSettings,
  isValidIPv4, isValidVLAN
} from '@/lib/helpers';
import {
  SlidersHorizontal, Server, LayoutGrid, GitBranch,
  ClipboardList, ShieldCheck, Zap, PanelRightClose, MessageCircle, List, Layers
} from 'lucide-react';
import ModelSelectorModal from './ModelSelectorModal';
import ExportModal from './ExportModal';
import EquipmentRepoModal from './EquipmentRepoModal';
import DeviceCatalog from './DeviceCatalog';
import CablePropertiesPanel from './CablePropertiesPanel';
import RackPanel from './RackPanel';
import ToolbarPanel from './ToolbarPanel';
import ValidationPanel from './ValidationPanel';
import TopologyPanel from './TopologyPanel';
import EquipmentPanel from './EquipmentPanel';
import MigrationWizard from './MigrationWizard';
import DevicePropertiesPanel from './DevicePropertiesPanel';
import CameraFovOverlay from './CameraFovOverlay';
import CommentsPanel from './CommentsPanel';
import CanvasContextMenu from './CanvasContextMenu';
import CanvasSearch from './CanvasSearch';
import DeviceListPanel from './DeviceListPanel';
import CrossFloorConnectionModal from './CrossFloorConnectionModal';
import { createRack, migrateRackDevices, assignDeviceToRack as calcSlot, getRackOccupancy } from '@/lib/rack-helpers';
import { autoOrthoRoute, buildOrthoPath } from '@/lib/cable-routing';

export default function ProjectApp({project,setProject,undo,redo,onBack}){
  const limits = useSubscription();
  const [rightTab,setRightTab]=useState('props'); // props | topology | equipment | validation
  const [leftTab,setLeftTab]=useState('devices'); // devices | floors
  const [selectedDevice,setSelectedDevice]=useState(null);
  const [tool,setTool]=useState('select'); // select | device | cable | env | measure | pan | calibrate
  const [pendingDevice,setPendingDevice]=useState(null);
  const [cableType,setCableType]=useState('cat6');
  const [routeType,setRouteType]=useState('straight'); // straight | curve | angle
  const [cableMode,setCableMode]=useState(null); // null | {from:deviceId, ifaceType?, ifaceLabel?}
  const [portPopup,setPortPopup]=useState(null); // null | {devId,x,y} - connection port selector popup
  const [showExport,setShowExport]=useState(false);
  const [search,setSearch]=useState('');
  const [collapsedCats,setCollapsedCats]=useState({});
  const [editingFloorId,setEditingFloorId]=useState(null);
  const [showCableLabels,setShowCableLabels]=useState(true);
  const [deviceLabel,setDeviceLabel]=useState('card'); // 'card'|'label'|'none'
  const toggleCat=(catName)=>setCollapsedCats(prev=>({...prev,[catName]:!prev[catName]}));
  const [modelSelectorModal,setModelSelectorModal]=useState(null); // null | {deviceKey,x,y}
  const [showEquipmentRepo,setShowEquipmentRepo]=useState(false);
  const [showMigrationWizard,setShowMigrationWizard]=useState(false);
  const [defRefreshKey,setDefRefreshKey]=useState(0);
  const [customDevices,setCustomDevices]=useState(()=>getCustomDevices());
  const [selectedConn,setSelectedConn]=useState(null); // selected connection id
  const [draggingWp,setDraggingWp]=useState(null); // {connId, wpIdx, startX, startY, origX, origY} or {connId, insertAfter, startX, startY, origX, origY}
  const [selectedRackId,setSelectedRackId]=useState(null);
  const [selectedQuadroId,setSelectedQuadroId]=useState(null);
  const [envFilterTag,setEnvFilterTag]=useState(null);
  const [snapToGrid,setSnapToGrid]=useState(true);
  const [gridSize]=useState(20); // snap to half-grid (visual grid is 40px)
  const [multiSelect,setMultiSelect]=useState(new Set()); // multi-selected device IDs
  const [selectionRect,setSelectionRect]=useState(null); // {startX,startY,x,y} canvas coords for lasso
  const [groupDragging,setGroupDragging]=useState(null); // {startX,startY,origPositions:[{id,x,y},...]}
  const [bgOpacity,setBgOpacity]=useState(0.3);
  // Icon size: 'sm' | 'md' | 'normal'
  const [iconSize,setIconSize]=useState(()=>getSettings().iconSize||'normal');
  // Sidebar visibility (floating panels)
  const [leftPanelOpen,setLeftPanelOpen]=useState(()=>getSettings().leftPanelOpen!==false);
  const [rightPanelOpen,setRightPanelOpen]=useState(()=>getSettings().rightPanelOpen!==false);
  const bgFileRef=useRef(null);
  const lassoEndedRef=useRef(false); // prevents click from clearing lasso selection
  const [isPanning,setIsPanning]=useState(false); // for cursor styling
  const isPanningRef=useRef(false);
  const panStartRef=useRef({x:0,y:0,panX:0,panY:0});
  const prevToolRef=useRef(null); // for space-held temporary pan
  // Clipboard for copy/paste
  const [clipboard,setClipboard]=useState(null); // {devices:[{key,name,model,...}], offset:{x,y}}
  // Canvas search
  const [showSearch,setShowSearch]=useState(false);
  const [searchHighlight,setSearchHighlight]=useState(null); // Set of device IDs to highlight
  // Cross-floor connection modal
  const [crossFloorModal,setCrossFloorModal]=useState(null); // null | {deviceId, ifaceType?, ifaceLabel?}
  // Context menu
  const [contextMenu,setContextMenu]=useState(null); // {x,y,target}
  // Smart guides
  const [guides,setGuides]=useState([]); // [{type:'h'|'v', x1,y1,x2,y2}]
  // Layers: toggle visibility of canvas elements
  const [layers,setLayers]=useState({devices:true,cables:true,grid:true,bg:true,dimensions:true,fov:false,heatmap:false});
  const toggleLayer=(k)=>setLayers(l=>({...l,[k]:!l[k]}));
  // Dimension annotations
  const [measureStart,setMeasureStart]=useState(null); // {x,y} - first click in measure tool
  // Scale calibration
  const [calibStart,setCalibStart]=useState(null); // {x,y} first calibration point
  const [calibEnd,setCalibEnd]=useState(null); // {x,y} second calibration point
  const [showCalibModal,setShowCalibModal]=useState(false); // distance input modal
  const calibInputRef=useRef(null);
  const canvasRef=useRef(null);
  const [zoom,setZoom]=useState(1);
  const [pan,setPan]=useState({x:0,y:0});
  const [dragging,setDragging]=useState(null);
  const snap=(v)=>snapToGrid?Math.round(v/gridSize)*gridSize:v;

  const floor=project.floors.find(f=>f.id===project.activeFloor);
  const devices=floor?.devices||[];
  const connections=floor?.connections||[];
  const dimensions=floor?.dimensions||[];
  const racks=floor?.racks||[];
  const quadros=floor?.quadros||[];

  // Sync bgOpacity when floor changes
  useEffect(()=>{setBgOpacity(floor?.bgOpacity??0.3)},[project.activeFloor]);

  // Icon size helpers
  const changeIconSize=(size)=>{setIconSize(size);const s=getSettings();saveSettings({...s,iconSize:size})};
  const getDevR=(dev)=>{const s=dev.iconSize||iconSize;return s==='sm'?18:s==='md'?23:29};
  // Panel toggle helpers
  const toggleLeftPanel=()=>{const next=!leftPanelOpen;setLeftPanelOpen(next);saveSettings({...getSettings(),leftPanelOpen:next})};
  const toggleRightPanel=()=>{const next=!rightPanelOpen;setRightPanelOpen(next);saveSettings({...getSettings(),rightPanelOpen:next})};

  // Responsive: auto-collapse panels on small screens
  const [isSmallScreen,setIsSmallScreen]=useState(()=>typeof window!=='undefined'&&window.innerWidth<=768);
  useEffect(()=>{
    const mq=window.matchMedia('(max-width:768px)');
    const handler=(e)=>{
      setIsSmallScreen(e.matches);
      if(e.matches){setLeftPanelOpen(false);setRightPanelOpen(false)}
    };
    mq.addEventListener('change',handler);
    // Initial check
    if(mq.matches&&leftPanelOpen){setLeftPanelOpen(false);setRightPanelOpen(false)}
    return()=>mq.removeEventListener('change',handler);
  },[]); // eslint-disable-line react-hooks/exhaustive-deps

  // Migrate legacy rack devices → floor.racks[]
  useEffect(()=>{
    if(!floor) return;
    if(floor.devices.some(d=>d.key==='rack')){
      const result=migrateRackDevices(floor);
      if(result){
        updateFloor(f=>({...f,racks:result.racks,devices:result.devices}));
      }
    }
  },[project.activeFloor]);

  // Update floor data helper
  const updateFloor=(updater)=>{
    setProject(p=>({...p,floors:p.floors.map(f=>f.id===p.activeFloor?updater(f):f)}));
  };

  // Comments on floor
  const comments=floor?.comments||[];
  const addComment=(text,x,y)=>{
    updateFloor(f=>({...f,comments:[...(f.comments||[]),{
      id:'cmt_'+Date.now(),x:x||200,y:y||200,text,author:'Você',resolved:false,createdAt:new Date().toISOString()
    }]}));
  };
  const resolveComment=(id)=>{
    updateFloor(f=>({...f,comments:(f.comments||[]).map(c=>c.id===id?{...c,resolved:true}:c)}));
  };
  const deleteComment=(id)=>{
    updateFloor(f=>({...f,comments:(f.comments||[]).filter(c=>c.id!==id)}));
  };

  // ── Copy / Paste / Duplicate ──
  const copySelected=()=>{
    const ids=multiSelect.size>0?[...multiSelect]:(selectedDevice?[selectedDevice]:[]);
    if(!ids.length) return;
    const devs=ids.map(id=>devices.find(d=>d.id===id)).filter(Boolean);
    const minX=Math.min(...devs.map(d=>d.x)),minY=Math.min(...devs.map(d=>d.y));
    setClipboard({devices:devs.map(d=>({...d,_offX:d.x-minX,_offY:d.y-minY}))});
  };
  const pasteClipboard=(px,py)=>{
    if(!clipboard?.devices?.length) return;
    const baseX=px||200,baseY=py||200;
    const newIds=[];
    const idMap={};
    clipboard.devices.forEach(d=>{
      const nid=uid();
      idMap[d.id]=nid;
      newIds.push(nid);
    });
    updateFloor(f=>{
      const newDevs=clipboard.devices.map(d=>({
        ...d,id:idMap[d.id],x:snap(baseX+d._offX),y:snap(baseY+d._offY),
        envId:null,quadroId:undefined,rackId:undefined
      }));
      // Also copy connections between copied devices
      const newConns=connections
        .filter(c=>idMap[c.from]&&idMap[c.to])
        .map(c=>({...c,id:uid(),from:idMap[c.from],to:idMap[c.to]}));
      return {...f,devices:[...f.devices,...newDevs],connections:[...(f.connections||[]),...newConns]};
    });
    setMultiSelect(new Set(newIds));
    setSelectedDevice(null);
  };
  const duplicateSelected=()=>{
    const ids=multiSelect.size>0?[...multiSelect]:(selectedDevice?[selectedDevice]:[]);
    if(!ids.length) return;
    const devs=ids.map(id=>devices.find(d=>d.id===id)).filter(Boolean);
    const minX=Math.min(...devs.map(d=>d.x));
    const minY=Math.min(...devs.map(d=>d.y));
    setClipboard({devices:devs.map(d=>({...d,_offX:d.x-minX,_offY:d.y-minY}))});
    pasteClipboard(minX+40,minY+40);
  };

  // ── Align & Distribute (multi-select) ──
  const getSelectedDevs=()=>{
    const ids=[...multiSelect];
    return ids.map(id=>devices.find(d=>d.id===id)).filter(Boolean);
  };
  const alignDevices=(axis)=>{
    const devs=getSelectedDevs();if(devs.length<2) return;
    const centers=devs.map(d=>({id:d.id,cx:d.x+getDevR(d),cy:d.y+getDevR(d),r:getDevR(d)}));
    let target;
    if(axis==='left') target=Math.min(...centers.map(c=>c.cx-c.r));
    else if(axis==='right') target=Math.max(...centers.map(c=>c.cx+c.r));
    else if(axis==='centerH'){const s=centers.reduce((a,c)=>a+c.cx,0)/centers.length;target=s;}
    else if(axis==='top') target=Math.min(...centers.map(c=>c.cy-c.r));
    else if(axis==='bottom') target=Math.max(...centers.map(c=>c.cy+c.r));
    else if(axis==='centerV'){const s=centers.reduce((a,c)=>a+c.cy,0)/centers.length;target=s;}
    updateFloor(f=>({...f,devices:f.devices.map(d=>{
      if(!multiSelect.has(d.id)) return d;
      const r=getDevR(d);
      if(axis==='left') return {...d,x:target};
      if(axis==='right') return {...d,x:target-2*r};
      if(axis==='centerH') return {...d,x:target-r};
      if(axis==='top') return {...d,y:target};
      if(axis==='bottom') return {...d,y:target-2*r};
      if(axis==='centerV') return {...d,y:target-r};
      return d;
    })}));
  };
  const distributeDevices=(dir)=>{
    const devs=getSelectedDevs();if(devs.length<3) return;
    const sorted=[...devs].sort((a,b)=>dir==='h'?a.x-b.x:a.y-b.y);
    const first=sorted[0],last=sorted[sorted.length-1];
    const totalSpan=dir==='h'?(last.x-first.x):(last.y-first.y);
    const step=totalSpan/(sorted.length-1);
    const updates={};
    sorted.forEach((d,i)=>{
      if(dir==='h') updates[d.id]={x:snap(first.x+step*i)};
      else updates[d.id]={y:snap(first.y+step*i)};
    });
    updateFloor(f=>({...f,devices:f.devices.map(d=>updates[d.id]?{...d,...updates[d.id]}:d)}));
  };

  // ── Spread overlapping devices (explode cluster) ──
  const spreadDevices=()=>{
    const ids=multiSelect.size>1?[...multiSelect]:(selectedDevice?devices.filter(d=>{
      const sel=devices.find(dd=>dd.id===selectedDevice);
      if(!sel) return false;
      const dist=Math.sqrt((d.x-sel.x)**2+(d.y-sel.y)**2);
      return dist<60&&d.id!==selectedDevice;
    }).map(d=>d.id).concat([selectedDevice]):[]);
    if(ids.length<2) return;
    const devs=ids.map(id=>devices.find(d=>d.id===id)).filter(Boolean);
    const cx=devs.reduce((s,d)=>s+d.x,0)/devs.length;
    const cy=devs.reduce((s,d)=>s+d.y,0)/devs.length;
    const radius=Math.max(60,devs.length*25);
    const updates={};
    devs.forEach((d,i)=>{
      const angle=(i/devs.length)*2*Math.PI-Math.PI/2;
      updates[d.id]={x:snap(cx+radius*Math.cos(angle)),y:snap(cy+radius*Math.sin(angle))};
    });
    updateFloor(f=>({...f,devices:f.devices.map(d=>updates[d.id]?{...d,...updates[d.id]}:d)}));
  };

  // ── Select by Type ──
  const selectByType=(deviceKey)=>{
    const ids=devices.filter(d=>d.key===deviceKey).map(d=>d.id);
    setMultiSelect(new Set(ids));
    setSelectedDevice(null);
  };

  // ── Layer Presets ──
  const applyLayerPreset=(preset)=>{
    if(preset==='client') setLayers({devices:true,cables:false,grid:false,bg:true,dimensions:false,fov:true,heatmap:true});
    else if(preset==='installer') setLayers({devices:true,cables:true,grid:true,bg:true,dimensions:true,fov:false,heatmap:false});
    else if(preset==='engineer') setLayers({devices:true,cables:true,grid:true,bg:true,dimensions:true,fov:true,heatmap:false});
  };

  // All devices across all floors
  const allDevices=useMemo(()=>project.floors.flatMap(f=>f.devices),[project.floors]);

  // Add device to canvas
  const addDevice=(deviceKey,x,y,selectedModel=null)=>{
    const def=findDevDef(deviceKey);
    if(!def) return;

    // Feature gate: device limit per floor
    const currentDevices = floor?.devices?.length || 0;
    if(currentDevices >= limits.maxDevicesPerFloor){
      alert(`Limite de ${limits.maxDevicesPerFloor} dispositivos por andar no plano ${limits.planName}. Faça upgrade para adicionar mais.`);
      return;
    }

    // If configurable and has catalog models, show modal for model selection
    const catalogMap={nobreak_ac:'nobreak_ac',nobreak_dc:'nobreak_dc',bateria_ext:'bateria',modulo_bat:'modulo_bat'};
    const hasCatalog=MODEL_CATALOG[catalogMap[deviceKey]];
    if(def.configurable && !selectedModel && hasCatalog){
      setModelSelectorModal({deviceKey,x:x||200+Math.random()*400,y:y||150+Math.random()*300});
      return;
    }

    // Build config object if model was selected
    let config={};
    if(selectedModel && selectedModel.id){
      config={modelId:selectedModel.id,modelData:selectedModel};
    }

    // For custom devices, store custom specs and inherit icon/interfaces from base device
    const isCustom=deviceKey.startsWith('custom_');
    const baseKey=isCustom?def.deviceType:deviceKey;
    if(isCustom){
      config.customSpecs=def.specs||{};
      config.brand=def.brand;
      config.model=def.model;
    }

    const newDev={id:uid(),key:deviceKey,name:def.name,x:snap(x||200+Math.random()*400),y:snap(y||150+Math.random()*300),
      model:selectedModel?.model||'',envId:null,config,props:{...def.props}};
    updateFloor(f=>({...f,devices:[...f.devices,newDev]}));
    setSelectedDevice(newDev.id);
    setRightTab('props');
    setPendingDevice(null);
    setModelSelectorModal(null);
    setTool('select');
  };

  // Move device (with snap-to-grid + auto-recalc cable distances)
  const moveDevice=(devId,x,y)=>{
    const sx=snap(x),sy=snap(y);
    updateFloor(f=>{
      const newDevs=f.devices.map(d=>d.id===devId?{...d,x:sx,y:sy}:d);
      const newConns=f.connections.map(c=>{
        if(c.from!==devId&&c.to!==devId) return c;
        const fd=newDevs.find(d=>d.id===c.from),td=newDevs.find(d=>d.id===c.to);
        if(!fd||!td) return c;
        return {...c,distance:calcCableDistance(fd.x,fd.y,td.x,td.y,c.waypoints,40,f.bgScale)};
      });
      return {...f,devices:newDevs,connections:newConns};
    });
  };

  // Delete device
  const deleteDevice=(devId)=>{
    updateFloor(f=>({
      ...f,
      devices:f.devices.filter(d=>d.id!==devId),
      connections:f.connections.filter(c=>c.from!==devId&&c.to!==devId)
    }));
    // Also remove cross-floor connections referencing this device
    if(project.crossFloorConnections?.some(xc=>xc.fromDeviceId===devId||xc.toDeviceId===devId)){
      setProject(p=>({...p,crossFloorConnections:(p.crossFloorConnections||[]).filter(xc=>xc.fromDeviceId!==devId&&xc.toDeviceId!==devId)}));
    }
    if(selectedDevice===devId) setSelectedDevice(null);
  };

  // Update device properties
  const updateDevice=(devId,updates)=>{
    updateFloor(f=>({...f,devices:f.devices.map(d=>d.id===devId?{...d,...updates}:d)}));
  };

  // Update connection properties
  const updateConnection=(connId,updates)=>{
    updateFloor(f=>({...f,connections:f.connections.map(c=>c.id===connId?{...c,...updates}:c)}));
  };

  // Migration wizard: replace legacy device with modern equivalent
  const handleMigrationReplace=(devId,newKey)=>{
    const def=findDevDef(newKey);
    if(!def) return;
    updateDevice(devId,{
      key:newKey,
      name:def.name,
      _legacy:false,
      _originalKey:undefined,
      icon:def.icon||undefined
    });
  };

  // Count legacy devices across all floors (for badge)
  const legacyCount=useMemo(()=>
    devices.filter(d=>d._legacy).length
  ,[devices]);

  // Copy device
  const copyDevice=(devId)=>{
    const dev=devices.find(d=>d.id===devId);
    if(!dev) return;
    const newDev={...dev,id:uid(),x:dev.x+40,y:dev.y+40,name:dev.name+' (cópia)'};
    updateFloor(f=>({...f,devices:[...f.devices,newDev]}));
    setSelectedDevice(newDev.id);
  };

  // Save custom device to localStorage
  const saveCustomDevice=(customDevice)=>{
    const updated=[...customDevices.filter(c=>c.id!==customDevice.id),customDevice];
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  // Delete custom device
  const deleteCustomDevice=(customId)=>{
    const updated=customDevices.filter(c=>c.id!==customId);
    setCustomDevices(updated);
    saveCustomDevices(updated);
  };

  // Connection validation toast state
  const [connToast,setConnToast]=useState(null);
  const showConnToast=(msg,type='error')=>{
    setConnToast({msg,type});
    setTimeout(()=>setConnToast(null),4000);
  };

  // Cable picker state for multi-option connections
  const [cablePicker,setCablePicker]=useState(null);

  // Add connection with validation — supports multiple connections between same pair (different ifaceType)
  const addConnection=(fromId,toId,type)=>{
    try{
    if(fromId===toId){setCableMode(null);setTool('select');return}
    const fromDev=devices.find(d=>d.id===fromId);
    const toDev=devices.find(d=>d.id===toId);
    if(!fromDev||!toDev) return;

    // Get ifaceType from cableMode (set by port popup) — allows multiple connections if different port types
    const ifaceType=cableMode?.ifaceType||null;
    const ifaceLabel=cableMode?.ifaceLabel||'';

    // Check duplicate: block only if SAME pair + SAME ifaceType (or both null)
    const dupExists=connections.some(c=>{
      const samePair=(c.from===fromId&&c.to===toId)||(c.from===toId&&c.to===fromId);
      if(!samePair) return false;
      // If both have ifaceType, block only if same type
      if(ifaceType && c.ifaceType) return c.ifaceType===ifaceType;
      // If neither has ifaceType (legacy/auto), block duplicate
      if(!ifaceType && !c.ifaceType) return true;
      return false;
    });
    if(dupExists){showConnToast('Conexão deste tipo já existe entre estes dispositivos','warn');setCableMode(null);setTool('select');return}

    // Port capacity check for data cables on network devices
    const dataCableTypes=new Set(['cat6','cat5e','fibra_sm','fibra_mm']);
    const chosenCableCheck=type||cableType;
    if(dataCableTypes.has(chosenCableCheck)){
      for(const nd of [fromDev,toDev]){
        if(isSwitch(nd.key)||isGravador(nd.key)){
          const pu=getPortUsage(nd.id,devices,connections);
          const otherDev=(nd.id===fromId)?toDev:fromDev;
          const needed=isCamera(otherDev.key)?(otherDev.qty||1):1;
          if(pu.available<needed){
            showConnToast(`${nd.name}: sem portas livres (${pu.used}/${pu.capacity}). Necessário: ${needed}`,'warn');
            setCableMode(null);setTool('select');return;
          }
        }
      }
    }

    const dist=calcCableDistance(fromDev.x,fromDev.y,toDev.x,toDev.y,[],40,floor?.bgScale);

    // Validate connection (use base device keys for custom devices)
    const chosenCable=type||cableType;
    const fromKey=getDeviceIconKey(fromDev.key);
    const toKey=getDeviceIconKey(toDev.key);
    const validation=validateConnection(fromKey,toKey,chosenCable);

    if(!validation.valid && validation.cables.length===0){
      showConnToast(`✕ ${validation.reason}`,'error');
      setCableMode(null);setTool('select');
      return;
    }

    if(!validation.valid && validation.cables.length>0){
      setCablePicker({fromId,toId,dist,cables:validation.cables,reason:validation.reason,ifaceType,ifaceLabel});
      setCableMode(null);
      return;
    }

    // Auto-calculate PP cable section if chosen cable is PP type
    let finalCable=chosenCable;
    const chosenCT=CABLE_TYPES.find(c=>c.id===chosenCable);
    if(chosenCT?.vias && chosenCT?.secao){
      const recommended=calcPPSection(dist,chosenCT.vias);
      if(recommended.secao!==chosenCT.secao){
        finalCable=recommended.id;
        showConnToast(`📐 Auto-ajuste: ${dist}m → ${recommended.label} (seção calculada pela distância)`,'info');
      }
    }

    // Valid — create connection with ifaceType metadata + route
    const purpose=validation.purpose||'dados';
    const newConn={id:uid(),from:fromId,to:toId,type:finalCable,distance:dist,purpose,
      ifaceType:ifaceType||null,ifaceLabel:ifaceLabel||'',route:routeType||'straight'};
    updateFloor(f=>{
      const updated={...f,connections:[...f.connections,newConn]};
      // Auto-assign câmeras a NVRs quando conectados (diretamente ou via switch)
      const assigns=autoAssignCameras(updated.devices,updated.connections);
      if(assigns.length>0){
        updated.devices=updated.devices.map(d=>{
          const a=assigns.find(u=>u.id===d.id);
          return a?{...d,nvrAssignments:a.nvrAssignments}:d;
        });
      }
      return updated;
    });
    const portInfo=ifaceLabel?` [${ifaceLabel}]`:'';
    const fcName=CABLE_TYPES.find(c=>c.id===finalCable)?.name||finalCable;
    showConnToast(`✓ ${fcName} · ${dist}m · ${purpose}${portInfo}`,'success');
    setCableMode(null);setTool('select');
    }catch(err){console.error('addConnection error',err);setCableMode(null);setTool('select');showConnToast('Erro ao conectar: '+err.message,'error');}
  };

  // Confirm cable from picker
  const confirmCablePick=(cableId)=>{
    if(!cablePicker) return;
    const {fromId,toId,dist,ifaceType,ifaceLabel}=cablePicker;
    const fromDev=devices.find(d=>d.id===fromId);
    const toDev=devices.find(d=>d.id===toId);
    const validation=validateConnection(fromDev.key,toDev.key,cableId);
    // Auto-calc PP section for picker too
    let pickCable=cableId;
    const pickCT=CABLE_TYPES.find(c=>c.id===cableId);
    if(pickCT?.vias&&pickCT?.secao){const rec=calcPPSection(dist,pickCT.vias);if(rec.secao!==pickCT.secao) pickCable=rec.id;}
    updateFloor(f=>({...f,connections:[...f.connections,{
      id:uid(),from:fromId,to:toId,type:pickCable,distance:dist,purpose:validation.purpose||'dados',
      ifaceType:ifaceType||null,ifaceLabel:ifaceLabel||'',route:routeType||'straight'
    }]}));
    showConnToast(`✓ ${CABLE_TYPES.find(c=>c.id===cableId)?.name} · ${dist}m`,'success');
    setCablePicker(null);
  };

  // Delete connection
  const deleteConnection=(connId)=>{
    // Also check cross-floor connections
    if(project.crossFloorConnections?.some(c=>c.id===connId)){
      setProject(p=>({...p,crossFloorConnections:(p.crossFloorConnections||[]).filter(c=>c.id!==connId)}));
      if(selectedConn===connId) setSelectedConn(null);
      return;
    }
    updateFloor(f=>({...f,connections:f.connections.filter(c=>c.id!==connId)}));
    if(selectedConn===connId) setSelectedConn(null);
  };

  // ── Cross-floor connections ──────────────────────────────────────
  const crossFloorConns=project.crossFloorConnections||[];
  // Cross-floor connections relevant to current floor
  const currentFloorCrossConns=useMemo(()=>
    crossFloorConns.filter(c=>c.fromFloorId===project.activeFloor||c.toFloorId===project.activeFloor)
  ,[crossFloorConns,project.activeFloor]);

  const addCrossFloorConnection=(data)=>{
    const fromDev=project.floors.find(f=>f.id===data.fromFloorId)?.devices?.find(d=>d.id===data.fromDeviceId);
    const toDev=project.floors.find(f=>f.id===data.toFloorId)?.devices?.find(d=>d.id===data.toDeviceId);
    if(!fromDev||!toDev) return;
    const fromKey=getDeviceIconKey(fromDev.key);
    const toKey=getDeviceIconKey(toDev.key);
    const validation=validateConnection(fromKey,toKey,data.type);
    const purpose=validation?.purpose||'dados';
    const newConn={
      id:uid(),
      fromDeviceId:data.fromDeviceId, fromFloorId:data.fromFloorId,
      toDeviceId:data.toDeviceId, toFloorId:data.toFloorId,
      type:data.type, distance:data.distance, purpose,
      ifaceType:data.ifaceType||null, ifaceLabel:data.ifaceLabel||''
    };
    setProject(p=>({...p,crossFloorConnections:[...(p.crossFloorConnections||[]),newConn]}));
    const ct=CABLE_TYPES.find(c=>c.id===data.type);
    const fromFloorName=project.floors.find(f=>f.id===data.fromFloorId)?.name;
    const toFloorName=project.floors.find(f=>f.id===data.toFloorId)?.name;
    showConnToast(`✓ Cross-floor: ${ct?.name||data.type} · ${data.distance}m · ${fromFloorName} → ${toFloorName}`,'success');
    setCrossFloorModal(null);
  };

  // ---- draw.io-style cable routing with orthogonal segments ----
  const updateConnWaypoints=(connId,waypoints)=>{
    updateFloor(f=>{
      const devs=f.devices;
      return {...f,connections:f.connections.map(c=>{
        if(c.id!==connId) return c;
        const fd=devs.find(d=>d.id===c.from),td=devs.find(d=>d.id===c.to);
        const dist=fd&&td?calcCableDistance(fd.x,fd.y,td.x,td.y,waypoints,40,f.bgScale):c.distance;
        return {...c,waypoints,distance:dist};
      })};
    });
  };
  const deleteWaypoint=(connId,wpIdx)=>{
    const conn=connections.find(c=>c.id===connId);
    if(!conn||!conn.waypoints) return;
    const wps=[...(conn.waypoints)];
    wps.splice(wpIdx,1);
    updateConnWaypoints(connId,wps.length?wps:undefined);
  };

  // Drag waypoint or segment — draw.io style
  useEffect(()=>{
    if(!draggingWp) return;
    const onMove=(e)=>{
      const rect=canvasRef.current?.getBoundingClientRect();
      if(!rect) return;
      const mx=(e.clientX-rect.left)/zoom-pan.x/zoom;
      const my=(e.clientY-rect.top)/zoom-pan.y/zoom;
      const conn=connections.find(c=>c.id===draggingWp.connId);
      if(!conn) return;
      const wps=[...(conn.waypoints||[])];
      if(draggingWp.type==='point'){
        // Drag single waypoint (draw.io blue square)
        wps[draggingWp.wpIdx]={x:mx,y:my};
        updateConnWaypoints(draggingWp.connId,wps);
      } else if(draggingWp.type==='seg'){
        // Drag entire segment — move two endpoints of the segment
        // Determine if segment is horizontal or vertical, then constrain
        const si=draggingWp.segIdx;
        const p1=wps[si],p2=wps[si+1];
        if(!p1||!p2) return;
        const isHoriz=Math.abs(p1.y-p2.y)<Math.abs(p1.x-p2.x);
        if(!isHoriz){
          // Vertical segment — move horizontally
          const dx=mx-draggingWp.lastX;
          wps[si]={x:p1.x+dx,y:p1.y};
          wps[si+1]={x:p2.x+dx,y:p2.y};
        } else {
          // Horizontal segment — move vertically
          const dy=my-draggingWp.lastY;
          wps[si]={x:p1.x,y:p1.y+dy};
          wps[si+1]={x:p2.x,y:p2.y+dy};
        }
        draggingWp.lastX=mx;
        draggingWp.lastY=my;
        updateConnWaypoints(draggingWp.connId,wps);
      } else if(draggingWp.type==='newSeg'){
        // Creating a new bend by dragging a straight segment
        // Insert two waypoints to create the bend
        const si=draggingWp.segIdx;
        const allPts=draggingWp.allPts;
        const p1=allPts[si],p2=allPts[si+1];
        if(!p1||!p2) return;
        const isHoriz=Math.abs(p1.y-p2.y)<Math.abs(p1.x-p2.x);
        // Convert to two new waypoints forming a Z-bend
        const midX=(p1.x+p2.x)/2;
        const midY=(p1.y+p2.y)/2;
        let newWps;
        if(isHoriz){
          newWps=[{x:midX,y:p1.y},{x:midX,y:my}];
          // Replace: insert 2 waypoints at the segment break
        } else {
          newWps=[{x:p1.x,y:midY},{x:mx,y:midY}];
        }
        const wpInsertIdx=si; // index in waypoints array
        const updWps=[...(conn.waypoints||[])];
        updWps.splice(wpInsertIdx,0,...newWps);
        updateConnWaypoints(draggingWp.connId,updWps);
        // Switch to segment drag mode for the newly created middle segment
        setDraggingWp({...draggingWp,type:'seg',segIdx:wpInsertIdx,lastX:mx,lastY:my});
      }
    };
    const onUp=()=>setDraggingWp(null);
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};
  },[draggingWp,zoom,pan,connections]);

  // Scale calibration confirm
  const confirmCalibration=(realMeters)=>{
    if(!calibStart||!calibEnd||!realMeters||realMeters<=0) return;
    const dx=calibEnd.x-calibStart.x,dy=calibEnd.y-calibStart.y;
    const pixelDist=Math.sqrt(dx*dx+dy*dy);
    if(pixelDist<1) return;
    const currentScale=floor?.bgScale||1;
    const newScale=(realMeters*40*currentScale)/pixelDist;
    const clamped=Math.max(0.1,Math.min(20,newScale));
    updateFloor(f=>({...f,bgScale:Math.round(clamped*1000)/1000}));
    setCalibStart(null);setCalibEnd(null);setShowCalibModal(false);setTool('select');
  };

  // Add floor
  const addFloor=()=>{
    const num=project.floors.length;
    const newFloor={id:uid(),name:`Pavimento ${num}`,number:num,devices:[],connections:[],racks:[],quadros:[],bgScale:1.0};
    setProject(p=>({...p,floors:[...p.floors,newFloor],activeFloor:newFloor.id}));
  };

  // ── Rack CRUD ──────────────────────────────────────────────────────
  const addRack=(overrides={})=>{
    const rack=createRack({...overrides,_existingTags:racks.map(r=>r.tag)});
    updateFloor(f=>({...f,racks:[...(f.racks||[]),rack]}));
    setSelectedRackId(rack.id);
    setRightTab('rack');
  };
  const updateRack=(rackId,updates)=>{
    updateFloor(f=>({...f,racks:(f.racks||[]).map(r=>r.id===rackId?{...r,...updates}:r)}));
  };
  const deleteRack=(rackId)=>{
    // Unassign all devices from this rack
    updateFloor(f=>({
      ...f,
      racks:(f.racks||[]).filter(r=>r.id!==rackId),
      devices:f.devices.map(d=>d.parentRack===rackId?{...d,parentRack:null,rackSlot:null}:d)
    }));
    if(selectedRackId===rackId) setSelectedRackId(null);
  };
  const assignDeviceToRackAction=(deviceId,rackId)=>{
    const rack=racks.find(r=>r.id===rackId);
    const device=devices.find(d=>d.id===deviceId);
    if(!rack||!device) return;
    const slot=calcSlot(rack,device,devices);
    if(slot>=0){
      updateDevice(deviceId,{parentRack:rackId,rackSlot:slot});
      showConnToast(`${device.name} montado em ${rack.name} (U${slot+1})`,'success');
    }else{
      showConnToast(`Sem espaço em ${rack.name} para ${device.name}`,'warn');
    }
  };
  const unassignDeviceFromRack=(deviceId)=>{
    const device=devices.find(d=>d.id===deviceId);
    if(!device) return;
    updateDevice(deviceId,{parentRack:null,rackSlot:null});
    showConnToast(`${device.name} removido do rack`,'info');
  };

  // ── Quadro de Conectividade CRUD ──────────────────────────────────
  const createQuadro=(overrides={})=>{
    const existingTags=(floor?.quadros||[]).map(q=>q.tag);
    let num=1;
    while(existingTags.includes(`QC-${String(num).padStart(2,'0')}`))num++;
    const tag=`QC-${String(num).padStart(2,'0')}`;
    return {
      id:uid(),name:overrides.name||`Quadro ${tag}`,
      x:overrides.x||200+Math.random()*400,y:overrides.y||200+Math.random()*300,
      caixa:'50x40x20',aterramento:'individual',
      disjuntor:{tipo:'bipolar',amperagem:16},prensaCabo:0,...overrides,tag/*always auto*/
    };
  };
  const addQuadro=(overrides={})=>{
    const qc=createQuadro(overrides);
    updateFloor(f=>({...f,quadros:[...(f.quadros||[]),qc]}));
    setSelectedQuadroId(qc.id);setRightTab('quadro');
    return qc;
  };
  const updateQuadro=(qcId,updates)=>{
    updateFloor(f=>({...f,quadros:(f.quadros||[]).map(q=>q.id===qcId?{...q,...updates}:q)}));
  };
  const deleteQuadro=(qcId)=>{
    updateFloor(f=>({
      ...f,
      quadros:(f.quadros||[]).filter(q=>q.id!==qcId),
      devices:f.devices.map(d=>d.quadroId===qcId?{...d,quadroId:null}:d)
    }));
    if(selectedQuadroId===qcId) setSelectedQuadroId(null);
  };
  const assignDeviceToQuadro=(deviceId,qcId)=>{
    updateDevice(deviceId,{quadroId:qcId});
    const dev=devices.find(d=>d.id===deviceId);
    const qc=quadros.find(q=>q.id===qcId);
    if(dev&&qc) showConnToast(`${dev.name} adicionado a ${qc.tag}`,'success');
  };
  const unassignDeviceFromQuadro=(deviceId)=>{
    updateDevice(deviceId,{quadroId:null});
    showConnToast('Dispositivo removido do quadro','info');
  };
  // Quadro BOM auto-generation
  const getQuadroBom=(qc)=>{
    const qcDevices=devices.filter(d=>d.quadroId===qc.id);
    const bom=[];
    // Always
    bom.push({name:`Caixa hermética ${qc.caixa||'50x40x20'}cm`,qty:1});
    bom.push({name:'Canaleta vazada 30×50mm',qty:2});
    bom.push({name:`Disjuntor ${qc.disjuntor?.tipo||'bipolar'} ${qc.disjuntor?.amperagem||16}A`,qty:1});
    // Conversor DC/DC if has SwitchPoE + FonteNobreak
    const hasSwitchPoE=qcDevices.some(d=>isSwitchPoE(d.key));
    const hasFonteNB=qcDevices.some(d=>isFonteNobreak(d.key));
    if(hasSwitchPoE&&hasFonteNB) bom.push({name:'Conversor DC/DC 12V 3A',qty:1});
    // Fibra optica if has ONT
    const hasONT=qcDevices.some(d=>isONT(d.key));
    if(hasONT){
      bom.push({name:'Roseta óptica',qty:1});
      bom.push({name:'Acoplador (emenda óptica)',qty:1});
      bom.push({name:'Cordão óptico SC/APC',qty:1});
    }
    // Aterramento
    if(qc.aterramento==='individual'){
      bom.push({name:'Haste de aterramento',qty:1});
      bom.push({name:'Barramento de terra',qty:1});
      bom.push({name:'Caixa de aterramento',qty:1});
      bom.push({name:'Conector GTDU',qty:1});
    }
    // Prensa-cabo
    if((qc.prensaCabo||0)>0) bom.push({name:'Prensa-cabo',qty:qc.prensaCabo});
    return bom;
  };

  // Smart Auto Cable — uses CONNECTION_RULES engine + device classification helpers
  const autoCable=()=>{
    const newConns=[...connections];
    const connectedIds=new Set();
    newConns.forEach(c=>{connectedIds.add(c.from);connectedIds.add(c.to)});

    // Classify devices using helper functions
    const sws=devices.filter(d=>isSwitch(d.key));
    const swsPoe=devices.filter(d=>isSwitchPoE(d.key));
    const routers=devices.filter(d=>d.key==='router');
    const gravadores=devices.filter(d=>isGravador(d.key));
    const nobreaks=devices.filter(d=>isNobreak(d.key));
    const fontes=devices.filter(d=>isFonte(d.key));
    const centraisAlarme=devices.filter(d=>isCentralAlarme(d.key));
    const centraisIncendio=devices.filter(d=>isCentralIncendio(d.key));
    const controladoras=devices.filter(d=>d.key==='controladora');

    const findNearest=(dev,targets)=>{
      let best=null,bestDist=Infinity;
      targets.forEach(t=>{
        const dx=dev.x-t.x,dy=dev.y-t.y,d=Math.sqrt(dx*dx+dy*dy);
        if(d<bestDist){bestDist=d;best=t}
      });
      return best?{device:best,dist:Math.max(1,Math.round(bestDist/40))}:null;
    };

    const tryAdd=(fromId,toId,fromKey,toKey)=>{
      const pairExists=newConns.some(c=>(c.from===fromId&&c.to===toId)||(c.from===toId&&c.to===fromId));
      if(pairExists) return false;
      const cable=getDefaultCable(fromKey,toKey);
      if(!cable) return false;
      const f=devices.find(d=>d.id===fromId),t=devices.find(d=>d.id===toId);
      const dist=calcCableDistance(f.x,f.y,t.x,t.y,[],40,floor?.bgScale);
      const validation=validateConnection(fromKey,toKey,cable);
      newConns.push({id:uid(),from:fromId,to:toId,type:cable,distance:dist,purpose:validation.purpose||'dados'});
      return true;
    };

    // PoE devices (IP cameras, APs) → nearest PoE switch
    devices.filter(d=>{const def=findDevDef(d.key);return def?.poe}).forEach(dev=>{
      if(swsPoe.length){const n=findNearest(dev,swsPoe);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Gravadores (NVR/DVR) → nearest switch
    gravadores.forEach(dev=>{
      if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Centrais alarme → nearest switch (TCP/IP)
    centraisAlarme.forEach(dev=>{
      if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Centrais incêndio → nearest switch (monitoramento IP)
    centraisIncendio.forEach(dev=>{
      if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Controladora → nearest switch
    controladoras.forEach(dev=>{
      if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Leitores faciais / biométricos → nearest controladora or switch
    devices.filter(d=>d.key==='leitor_facial'||d.key.startsWith('biometrico_')).forEach(dev=>{
      if(controladoras.length){const n=findNearest(dev,controladoras);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
      else if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Sensores zona (PIR, barreira, abertura) → central de alarme
    devices.filter(d=>isSensorZona(d.key)).forEach(dev=>{
      if(centraisAlarme.length){const n=findNearest(dev,centraisAlarme);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Sirenes alarme → central de alarme
    devices.filter(d=>isSirene(d.key)).forEach(dev=>{
      if(centraisAlarme.length){const n=findNearest(dev,centraisAlarme);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Periféricos alarme (teclado, comunicador, expansor) → central de alarme
    devices.filter(d=>isPerifericoAlarme(d.key)).forEach(dev=>{
      if(centraisAlarme.length){const n=findNearest(dev,centraisAlarme);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Detectores/acionadores/sirenes incêndio → central de incêndio
    devices.filter(d=>isDetectorIncendio(d.key)||d.key.startsWith('sirene_inc_')||d.key.startsWith('modulo_inc_')).forEach(dev=>{
      if(centraisIncendio.length){const n=findNearest(dev,centraisIncendio);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Fechadura → controladora
    devices.filter(d=>d.key==='fechadura').forEach(dev=>{
      if(controladoras.length){const n=findNearest(dev,controladoras);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Catracas/torniquetes → nearest switch (IP)
    devices.filter(d=>d.key.startsWith('catraca_')||d.key.startsWith('torniquete_')).forEach(dev=>{
      if(sws.length){const n=findNearest(dev,sws);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Switch ↔ Router uplink
    sws.forEach(sw=>{
      if(routers.length){const n=findNearest(sw,routers);if(n) tryAdd(sw.id,n.device.id,sw.key,n.device.key)}
    });

    // Nobreak → power to switches, gravadores, router (AC power)
    nobreaks.forEach(nb=>{
      [...sws,...gravadores,...routers].forEach(dev=>{
        tryAdd(nb.id,dev.id,nb.key,dev.key);
      });
    });

    // Fonte 12V → dispositivos DC (leitores, fechaduras, sirenes, tags)
    fontes.forEach(ft=>{
      devices.filter(d=>needsDCPower(d.key)).forEach(dev=>{
        tryAdd(ft.id,dev.id,ft.key,dev.key);
      });
    });

    // Leitor Tag / Tag UHF → nearest controladora (Wiegand/RS485)
    devices.filter(d=>d.key==='leitor_tag'||d.key.startsWith('tag_uhf_')).forEach(dev=>{
      if(controladoras.length){const n=findNearest(dev,controladoras);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    // Automation: controle acesso + cam_lpr → nearest motor/cancela (auto cable)
    const motors=devices.filter(d=>isAutomatizador(d.key));
    if(motors.length){
      devices.filter(d=>['leitor_facial','cam_lpr','leitor_tag','controladora'].includes(d.key)||d.key.startsWith('tag_uhf_')).forEach(dev=>{
        const n=findNearest(dev,motors);
        if(n){
          const pairExists=newConns.some(c=>(c.from===dev.id&&c.to===n.device.id)||(c.from===n.device.id&&c.to===dev.id));
          if(!pairExists){
            const dist=Math.round(n.dist);
            newConns.push({id:uid(),from:dev.id,to:n.device.id,type:'pp2v_10',distance:dist,purpose:'automação'});
          }
        }
      });
    }

    // Câmeras MHD/HDCVI → nearest DVR (coaxial)
    devices.filter(d=>isCameraMHD(d.key)).forEach(dev=>{
      const dvrs=devices.filter(d=>isDVR(d.key));
      if(dvrs.length){const n=findNearest(dev,dvrs);if(n) tryAdd(dev.id,n.device.id,dev.key,n.device.key)}
    });

    updateFloor(f=>({...f,connections:newConns}));
    showConnToast(`⚡ Auto-cabeamento: ${newConns.length - connections.length} conexões criadas`,'success');
  };

  // Validation (now passes connections too for power/cable checks)
  const validations=useMemo(()=>{
    const base=REGRAS.map(r=>{
      const msg=r.check(devices,connections,racks);
      return msg?{...r,msg}:null;
    }).filter(Boolean);
    // Quadro validations
    quadros.forEach(qc=>{
      const qcDevs=devices.filter(d=>d.quadroId===qc.id);
      if(!qcDevs.some(d=>d.key==='dps_rede'))
        base.push({cat:'Quadro',regra:`${qc.tag}: sem DPS`,sev:'ALTA',msg:`${qc.tag} sem DPS de rede — proteção contra surtos ausente`});
      if(!qcDevs.some(d=>isFonteNobreak(d.key)))
        base.push({cat:'Quadro',regra:`${qc.tag}: sem Fonte Nobreak`,sev:'ALTA',msg:`${qc.tag} sem Fonte Nobreak 12V — equipamentos sem alimentação DC`});
      if(!qcDevs.some(d=>isBateria(d.key)))
        base.push({cat:'Quadro',regra:`${qc.tag}: sem Bateria`,sev:'ALTA',msg:`${qc.tag} sem Bateria 12V — sem autonomia em falta de energia`});
      if(!qcDevs.some(d=>d.key==='tomada_dupla'))
        base.push({cat:'Quadro',regra:`${qc.tag}: sem Tomada`,sev:'ALTA',msg:`${qc.tag} sem tomada dupla — sem ponto de energia AC`});
      // Consumo DC vs capacidade fonte
      const fonteNBs=qcDevs.filter(d=>isFonteNobreak(d.key));
      if(fonteNBs.length){
        const capA=fonteNBs.reduce((s,d)=>{
          const def=findDevDef(d.key);
          const m=def?.props?.saida?.match(/(\d+)A/);
          return s+(m?parseInt(m[1]):5);
        },0);
        const consumoA=qcDevs.reduce((s,d)=>{
          const def=findDevDef(d.key);
          return s+(def?.ampDC||0);
        },0);
        if(consumoA>capA)
          base.push({cat:'Quadro',regra:`${qc.tag}: consumo DC excede fonte`,sev:'CRÍTICA',msg:`${qc.tag}: consumo ${consumoA}A > capacidade fonte ${capA}A`});
      }
      // Portas switch esgotadas
      const switches=qcDevs.filter(d=>isSwitch(d.key));
      switches.forEach(sw=>{
        const totalP=getSwitchPorts(sw);
        const usedP=connections.filter(c=>c.from===sw.id||c.to===sw.id)
          .map(c=>{const oid=c.from===sw.id?c.to:c.from;return devices.find(d=>d.id===oid)}).filter(Boolean)
          .reduce((s,d)=>s+(needsPoE(d.key)?(d.qty||1):1),0);
        if(usedP>totalP)
          base.push({cat:'Quadro',regra:`${qc.tag}: portas switch esgotadas`,sev:'CRÍTICA',msg:`${qc.tag} — ${sw.name}: ${usedP}/${totalP} portas`});
      });
      // Aterramento
      if(qc.aterramento==='nenhum')
        base.push({cat:'Quadro',regra:`${qc.tag}: sem aterramento`,sev:'ALTA',msg:`${qc.tag} sem aterramento configurado`});
    });
    return base;
  },[devices,connections,racks,quadros]);

  // BOM / Equipment list
  const bom=useMemo(()=>{
    const counts={};
    allDevices.forEach(d=>{
      if(!counts[d.key]) counts[d.key]={key:d.key,name:d.name,qty:0,model:d.model||'',def:findDevDef(d.key),unit:'pç'};
      counts[d.key].qty++;
    });

    // Add cables to BOM
    const cableCounts={};
    connections.forEach(c=>{
      const cableType=CABLE_TYPES.find(ct=>ct.id===c.type);
      if(!cableType) return;
      if(!cableCounts[c.type]) cableCounts[c.type]={key:c.type,name:cableType.name,qty:0,totalMeters:0,def:cableType,unit:'m'};
      cableCounts[c.type].qty++;
      cableCounts[c.type].totalMeters+=c.distance||1;
    });

    // Add cross-floor connections to cable BOM
    (project.crossFloorConnections||[]).forEach(c=>{
      const cableType=CABLE_TYPES.find(ct=>ct.id===c.type);
      if(!cableType) return;
      if(!cableCounts[c.type]) cableCounts[c.type]={key:c.type,name:cableType.name,qty:0,totalMeters:0,def:cableType,unit:'m'};
      cableCounts[c.type].qty++;
      cableCounts[c.type].totalMeters+=c.distance||1;
    });

    // Add batteries if configured on nobreak_ac (external battery support)
    allDevices.filter(d=>d.key==='nobreak_ac'&&d.config?.batExterna).forEach(nb=>{
      if(!counts['bateria_ext']) counts['bateria_ext']={key:'bateria_ext',name:'Bateria Externa',qty:0,unit:'pç',model:''};
      counts['bateria_ext'].qty++;
    });

    // Add rack entities + accessories to BOM (from floor.racks[])
    const accCounts={};
    project.floors.forEach(f=>{
      (f.racks||[]).forEach(rack=>{
        const rackKey='rack_'+rack.tag;
        if(!counts[rackKey]) counts[rackKey]={key:rackKey,name:`Rack ${rack.tag} (${rack.alturaU}U / ${rack.profundidade})`,qty:0,unit:'pç'};
        counts[rackKey].qty++;
        (rack.acessorios||[]).forEach(acc=>{
          const accKey='acc_'+acc.id;
          if(!accCounts[accKey]) accCounts[accKey]={key:accKey,name:acc.name||acc.id,qty:0,unit:'pç',rack:rack.name};
          accCounts[accKey].qty++;
        });
      });
    });

    // Add quadro entities + BOM accessories
    const qcCounts={};
    project.floors.forEach(f=>{
      (f.quadros||[]).forEach(qc=>{
        const qcKey='qc_'+qc.tag;
        if(!qcCounts[qcKey]) qcCounts[qcKey]={key:qcKey,name:`Quadro ${qc.tag}`,qty:0,unit:'pç'};
        qcCounts[qcKey].qty++;
        const qcDevs=(f.devices||[]).filter(d=>d.quadroId===qc.id);
        // BOM auto accessories
        const bomItems=[];
        bomItems.push({name:`Caixa hermética ${qc.caixa||'50x40x20'}cm`,qty:1});
        bomItems.push({name:'Canaleta vazada 30×50mm',qty:2});
        bomItems.push({name:`Disjuntor ${qc.disjuntor?.tipo||'bipolar'} ${qc.disjuntor?.amperagem||16}A`,qty:1});
        if(qcDevs.some(d=>isSwitchPoE(d.key))&&qcDevs.some(d=>isFonteNobreak(d.key)))
          bomItems.push({name:'Conversor DC/DC 12V 3A',qty:1});
        if(qcDevs.some(d=>isONT(d.key))){
          bomItems.push({name:'Roseta óptica',qty:1});
          bomItems.push({name:'Acoplador (emenda óptica)',qty:1});
          bomItems.push({name:'Cordão óptico SC/APC',qty:1});
        }
        if(qc.aterramento==='individual'){
          bomItems.push({name:'Haste de aterramento',qty:1});
          bomItems.push({name:'Barramento de terra',qty:1});
          bomItems.push({name:'Caixa de aterramento',qty:1});
          bomItems.push({name:'Conector GTDU',qty:1});
        }
        if((qc.prensaCabo||0)>0) bomItems.push({name:'Prensa-cabo',qty:qc.prensaCabo});
        bomItems.forEach(item=>{
          const bk='qcbom_'+item.name;
          if(!qcCounts[bk]) qcCounts[bk]={key:bk,name:item.name,qty:0,unit:'pç'};
          qcCounts[bk].qty+=item.qty;
        });
      });
    });

    return [...Object.values(counts),...Object.values(cableCounts),...Object.values(accCounts),...Object.values(qcCounts)];
  },[allDevices,connections,project.floors,project.crossFloorConnections]);

  // Topology tree
  const topology=useMemo(()=>{
    const roots=devices.filter(d=>d.key==='router'||isSwitch(d.key));
    if(!roots.length) return devices.map(d=>({device:d,children:[],disconnected:true}));
    const connected=new Set();
    const buildTree=(dev)=>{
      connected.add(dev.id);
      const children=connections
        .filter(c=>c.from===dev.id||c.to===dev.id)
        .map(c=>c.from===dev.id?c.to:c.from)
        .filter(id=>!connected.has(id))
        .map(id=>devices.find(d=>d.id===id))
        .filter(Boolean)
        .map(d=>buildTree(d));
      // Add cross-floor connections as virtual children
      const xfChildren=currentFloorCrossConns
        .filter(xc=>(xc.fromDeviceId===dev.id&&xc.fromFloorId===project.activeFloor)||(xc.toDeviceId===dev.id&&xc.toFloorId===project.activeFloor))
        .map(xc=>{
          const isFrom=xc.fromDeviceId===dev.id&&xc.fromFloorId===project.activeFloor;
          const remoteDevId=isFrom?xc.toDeviceId:xc.fromDeviceId;
          const remoteFloorId=isFrom?xc.toFloorId:xc.fromFloorId;
          const remoteFloor=project.floors.find(f=>f.id===remoteFloorId);
          const remoteDev=remoteFloor?.devices?.find(d=>d.id===remoteDevId);
          if(!remoteDev||connected.has(remoteDevId+'_xf')) return null;
          connected.add(remoteDevId+'_xf');
          return {device:{...remoteDev,id:remoteDevId+'_xf',name:`↕ ${remoteDev.name} (${remoteFloor?.name})`},children:[],crossFloor:true,cable:xc};
        }).filter(Boolean);
      return {device:dev,children:[...children,...xfChildren],cable:connections.find(c=>(c.from===dev.id||c.to===dev.id))};
    };
    const tree=roots.map(r=>buildTree(r));
    const disconnected=devices.filter(d=>!connected.has(d.id)).map(d=>({device:d,children:[],disconnected:true}));
    return [...tree,...disconnected];
  },[devices,connections,currentFloorCrossConns,project.activeFloor,project.floors]);

  // Canvas mouse handlers
  const handleCanvasClick=(e)=>{
    const rect=canvasRef.current?.getBoundingClientRect();
    if(!rect) return;
    const cx=(e.clientX-rect.left-pan.x)/zoom;
    const cy=(e.clientY-rect.top-pan.y)/zoom;
    if(tool==='device'&&pendingDevice){
      addDevice(pendingDevice,cx,cy);
    } else if(tool==='measure'){
      const sx=snap(cx),sy=snap(cy);
      if(!measureStart){
        setMeasureStart({x:sx,y:sy});
      } else {
        // Second click → save dimension
        const dim={id:crypto.randomUUID(),x1:measureStart.x,y1:measureStart.y,x2:sx,y2:sy};
        updateFloor(f=>({...f,dimensions:[...(f.dimensions||[]),dim]}));
        setMeasureStart(null);
      }
    } else if(tool==='calibrate'){
      // No snap — pixel precision on the background image
      if(!calibStart){
        setCalibStart({x:cx,y:cy});
      } else {
        setCalibEnd({x:cx,y:cy});
        setShowCalibModal(true);
      }
    } else if(tool==='select'){
      // Don't clear selection if a lasso drag just ended
      if(lassoEndedRef.current){lassoEndedRef.current=false;return;}
      setSelectedDevice(null);
      setSelectedConn(null);
      if(!e.shiftKey) setMultiSelect(new Set());
    }
  };

  // Lasso selection (mousedown on canvas background)
  const handleCanvasMouseDown=(e)=>{
    // Pan tool: left-click starts panning
    if(tool==='pan'&&e.button===0){
      e.preventDefault();
      isPanningRef.current=true;setIsPanning(true);
      panStartRef.current={x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y};
      return;
    }
    if(tool!=='select') return;
    if(e.button!==0) return; // only left click
    // Only start lasso on direct canvas click (not on devices)
    if(e.target.closest('.device-on-canvas')||e.target.closest('.port-popup')) return;
    // Must be inside canvas-area or canvas-transform
    if(e.target!==e.currentTarget&&!e.target.closest('.canvas-transform')&&!e.target.closest('.canvas-area')) return;
    const rect=canvasRef.current?.getBoundingClientRect();
    if(!rect) return;
    const cx=(e.clientX-rect.left-pan.x)/zoom;
    const cy=(e.clientY-rect.top-pan.y)/zoom;
    // Clear single selection when starting lasso
    setSelectedDevice(null);setSelectedConn(null);
    setSelectionRect({startX:cx,startY:cy,x:cx,y:cy});
  };

  // Lasso selection mouse handlers
  useEffect(()=>{
    if(!selectionRect) return;
    const onMove=(e)=>{
      const rect=canvasRef.current?.getBoundingClientRect();
      if(!rect) return;
      const cx=(e.clientX-rect.left-pan.x)/zoom;
      const cy=(e.clientY-rect.top-pan.y)/zoom;
      setSelectionRect(r=>r?{...r,x:cx,y:cy}:null);
    };
    const onUp=()=>{
      if(selectionRect){
        const x1=Math.min(selectionRect.startX,selectionRect.x);
        const y1=Math.min(selectionRect.startY,selectionRect.y);
        const x2=Math.max(selectionRect.startX,selectionRect.x);
        const y2=Math.max(selectionRect.startY,selectionRect.y);
        // Only select if rectangle has meaningful size
        if(Math.abs(x2-x1)>10&&Math.abs(y2-y1)>10){
          lassoEndedRef.current=true; // prevent subsequent click from clearing selection
          const selected=new Set();
          devices.forEach(d=>{
            const dcx=d.x+29,dcy=d.y+29; // center of device (R=29)
            if(dcx>=x1&&dcx<=x2&&dcy>=y1&&dcy<=y2) selected.add(d.id);
          });
          setMultiSelect(selected);
          if(selected.size>0) setSelectedDevice(null);
        }
      }
      setSelectionRect(null);
    };
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};
  },[selectionRect,zoom,pan,devices]);

  // Compute valid targets when in cable mode
  const validTargets=useMemo(()=>{
    try{
      if(!cableMode) return {};
      const fromDev=devices.find(d=>d.id===cableMode.from);
      if(!fromDev) return {};
      const map={};
      devices.forEach(dev=>{
        if(dev.id===cableMode.from) return;
        try{
          const result=validateConnection(fromDev.key,dev.key,null);
          map[dev.id]=result?.valid && result?.cables?.length>0 ? 'valid' : 'invalid';
        }catch(e){map[dev.id]='invalid';}
      });
      return map;
    }catch(e){console.error('validTargets error',e);return {};}
  },[cableMode,devices]);

  const handleDeviceClick=(e,devId)=>{
    e.stopPropagation();
    try{
      if(cableMode){
        const ifType=cableMode.ifaceType;
        let preferredCable=cableType;
        if(ifType){
          const fromDev=devices.find(d=>d.id===cableMode.from);
          if(fromDev){
            const ifaces=getDeviceInterfaces(fromDev);
            const matchIface=ifaces.find(i=>i.type===ifType);
            if(matchIface?.cables?.length && !matchIface.cables.includes(cableType)){
              preferredCable=matchIface.cables[0];
            }
          }
        }
        addConnection(cableMode.from,devId,preferredCable);
        return;
      }
      setSelectedDevice(devId);
      setRightTab('props');
    }catch(err){console.error('handleDeviceClick error',err);setCableMode(null);setTool('select');}
  };

  const handleDeviceMouseDown=(e,devId)=>{
    if(tool!=='select'&&tool!=='device') return;
    e.stopPropagation();
    e.preventDefault();

    // Shift+click toggles multi-select
    if(e.shiftKey){
      setMultiSelect(prev=>{
        const next=new Set(prev);
        if(next.has(devId)) next.delete(devId); else next.add(devId);
        return next;
      });
      return;
    }

    // If device is in multi-select group, drag the entire group
    if(multiSelect.has(devId)&&multiSelect.size>1){
      const origPositions=[...multiSelect].map(id=>{
        const d=devices.find(dev=>dev.id===id);
        return d?{id,x:d.x,y:d.y}:null;
      }).filter(Boolean);
      setGroupDragging({startX:e.clientX,startY:e.clientY,origPositions});
      return;
    }

    // Single device drag
    setMultiSelect(new Set());
    setDragging({id:devId,startX:e.clientX,startY:e.clientY,
      origX:devices.find(d=>d.id===devId)?.x||0,
      origY:devices.find(d=>d.id===devId)?.y||0});
  };

  useEffect(()=>{
    if(!dragging) return;
    const onMove=(e)=>{
      if(dragging.isQuadro){
        // Quadro entity dragging
        const nx=snap(e.clientX/zoom-dragging.offsetX);
        const ny=snap(e.clientY/zoom-dragging.offsetY);
        const qcId=dragging.id.replace('qc_','');
        updateQuadro(qcId,{x:nx,y:ny});
      } else {
        const dx=(e.clientX-dragging.startX)/zoom;
        const dy=(e.clientY-dragging.startY)/zoom;
        const nx=dragging.origX+dx,ny=dragging.origY+dy;
        moveDevice(dragging.id,nx,ny);
        // Smart guides calculation
        const dragR=getDevR(devices.find(d=>d.id===dragging.id)||{});
        const dcx=snap(nx)+dragR,dcy=snap(ny)+dragR;
        const newGuides=[];
        const THRESH=5;
        devices.forEach(d=>{
          if(d.id===dragging.id||d.quadroId) return;
          const r=getDevR(d),cx=d.x+r,cy=d.y+r;
          if(Math.abs(cy-dcy)<THRESH) newGuides.push({type:'h',x1:Math.min(cx,dcx)-20,y1:cy,x2:Math.max(cx,dcx)+20,y2:cy});
          if(Math.abs(cx-dcx)<THRESH) newGuides.push({type:'v',x1:cx,y1:Math.min(cy,dcy)-20,x2:cx,y2:Math.max(cy,dcy)+20});
        });
        setGuides(newGuides);
      }
    };
    const onUp=(e)=>{
      // Check if device was dropped onto a QC entity on canvas
      if(dragging&&!dragging.isQuadro){
        const draggedDev=devices.find(d=>d.id===dragging.id);
        if(draggedDev && canMountInQuadro(draggedDev.key)){
          const qcHit=quadros.find(qc=>{
            const qW=160,qH=120;
            return draggedDev.x>=qc.x && draggedDev.x<=qc.x+qW && draggedDev.y>=qc.y && draggedDev.y<=qc.y+qH;
          });
          if(qcHit && !draggedDev.quadroId){
            assignDeviceToQuadro(dragging.id,qcHit.id);
          }
        }
      }
      setDragging(null);setGuides([]);
    };
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};
  },[dragging,zoom,quadros,snapToGrid]);

  // Group dragging (multi-select)
  useEffect(()=>{
    if(!groupDragging) return;
    const onMove=(e)=>{
      const dx=(e.clientX-groupDragging.startX)/zoom;
      const dy=(e.clientY-groupDragging.startY)/zoom;
      updateFloor(f=>({...f,devices:f.devices.map(d=>{
        const orig=groupDragging.origPositions.find(o=>o.id===d.id);
        if(!orig) return d;
        return {...d,x:snap(orig.x+dx),y:snap(orig.y+dy)};
      })}));
    };
    const onUp=()=>setGroupDragging(null);
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};
  },[groupDragging,zoom,snapToGrid]);

  // Keyboard shortcuts
  useEffect(()=>{
    const handler=(e)=>{
      const tag=e.target.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||e.target.isContentEditable) return;

      // Delete: remove selected device(s) or connection
      if(e.key==='Delete'){
        if(multiSelect.size>0){
          multiSelect.forEach(id=>deleteDevice(id));
          setMultiSelect(new Set());
        } else if(selectedDevice) deleteDevice(selectedDevice);
        else if(selectedConn){
          const sc=connections.find(c=>c.id===selectedConn);
          if(sc?.waypoints?.length){
            updateConnWaypoints(selectedConn,undefined);
          } else {
            deleteConnection(selectedConn);
          }
        }
      }
      // Escape: cancel current action
      if(e.key==='Escape'){if(prevToolRef.current!==null)prevToolRef.current=null;setTool('select');setPendingDevice(null);setCableMode(null);setPortPopup(null);setSelectedConn(null);setMeasureStart(null);setMultiSelect(new Set());setCalibStart(null);setCalibEnd(null);setShowCalibModal(false);setSelectedQuadroId(null)}

      // Tool shortcuts
      if(!e.ctrlKey&&!e.metaKey){
        if(e.key==='v'||e.key==='V'){setTool('select');setPendingDevice(null);setCableMode(null);setMeasureStart(null)}
        if(e.key==='h'||e.key==='H'){setTool('pan');setPendingDevice(null);setCableMode(null);setMeasureStart(null)}
        // Space → temporary pan (hold to pan, release to restore previous tool)
        if(e.key===' '&&!e.repeat&&tool!=='pan'){
          e.preventDefault();
          prevToolRef.current=tool;
          setTool('pan');
        }
      }

      // Ctrl shortcuts only
      if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){e.preventDefault();undo()}
      if((e.ctrlKey||e.metaKey)&&(e.key==='y'||(e.key==='z'&&e.shiftKey))){e.preventDefault();redo()}
      if((e.ctrlKey||e.metaKey)&&e.key==='a'){e.preventDefault();setMultiSelect(new Set(devices.map(d=>d.id)));setTool('select')}
      if((e.ctrlKey||e.metaKey)&&e.key==='p'){e.preventDefault();window.print()}
      // Copy/Paste/Duplicate/Search
      if((e.ctrlKey||e.metaKey)&&e.key==='c'){e.preventDefault();copySelected()}
      if((e.ctrlKey||e.metaKey)&&e.key==='v'){e.preventDefault();pasteClipboard()}
      if((e.ctrlKey||e.metaKey)&&e.key==='d'){e.preventDefault();duplicateSelected()}
      if((e.ctrlKey||e.metaKey)&&e.key==='f'){e.preventDefault();setShowSearch(s=>!s)}
    };
    const keyupHandler=(e)=>{
      // Release Space → restore previous tool
      if(e.key===' '&&prevToolRef.current!==null){
        setTool(prevToolRef.current);
        prevToolRef.current=null;
      }
    };
    window.addEventListener('keydown',handler);
    window.addEventListener('keyup',keyupHandler);
    return ()=>{window.removeEventListener('keydown',handler);window.removeEventListener('keyup',keyupHandler)};
  },[selectedDevice,selectedConn,connections,devices,multiSelect,tool]);

  // Right-click context menu
  const handleContextMenu=(e)=>{
    e.preventDefault();
    const devEl=e.target.closest('.device-on-canvas');
    const devId=devEl?.dataset?.devId;
    const target=devId?devices.find(d=>d.id===devId):null;
    setContextMenu({x:e.clientX,y:e.clientY,target});
  };

  // Wheel zoom
  const handleWheel=(e)=>{
    e.preventDefault();
    const delta=e.deltaY>0?-0.1:0.1;
    setZoom(z=>Math.max(0.3,Math.min(3,z+delta)));
  };

  // Pan drag handlers (middle-click, hand tool, space+drag)
  useEffect(()=>{
    const onMove=(e)=>{
      if(!isPanningRef.current) return;
      const dx=e.clientX-panStartRef.current.x;
      const dy=e.clientY-panStartRef.current.y;
      setPan({x:panStartRef.current.panX+dx,y:panStartRef.current.panY+dy});
    };
    const onUp=()=>{
      if(isPanningRef.current){
        isPanningRef.current=false;
        setIsPanning(false);
      }
    };
    window.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    return ()=>{window.removeEventListener('mousemove',onMove);window.removeEventListener('mouseup',onUp)};
  },[]);

  const selectedDev=devices.find(d=>d.id===selectedDevice);

  return (
    <div className="app-shell">
      {/* ===== TOP BAR ===== */}
      <div className="app-topbar">
        <img src="/logo-proti.png" alt="Protector" style={{height:28,marginRight:4,filter:'brightness(1.1)'}}/>
        <span style={{fontSize:9,opacity:.4,marginLeft:-8}}>{APP_VERSION.full}</span>
        <span style={{width:1,height:24,background:'var(--cinzaM)'}}/>
        <input value={project.name} onChange={e=>setProject(p=>({...p,name:e.target.value}))}
          placeholder="Nome do projeto"
          className="project-name-input"
          style={{background:'transparent',border:'1px solid transparent',borderRadius:6,color:'#1e293b',fontSize:14,fontWeight:600,
            width:220,padding:'4px 8px',outline:'none',transition:'all .2s'}}
          onFocus={e=>{e.target.style.background='#F0F5FA';e.target.style.borderColor='#046BD2'}}
          onBlur={e=>{e.target.style.background='transparent';e.target.style.borderColor='transparent'}}/>
        <span style={{flex:1}}/>
        {project.client&&(project.client.razaoSocial||project.client.nome)&&(
          <span style={{fontSize:10,opacity:.5}}>👤 {project.client.razaoSocial||project.client.nome}</span>
        )}
        <span style={{fontSize:10,opacity:.5}}>Cenário: {SCENARIOS.find(s=>s.id===project.scenario)?.name}</span>
        <button className="tb-btn" onClick={()=>setShowExport(true)}>📋 Exportar</button>
        <button className="tb-btn" onClick={onBack}>← Voltar</button>
      </div>

      {/* ===== FLOOR TABS ===== */}
      <div className="floor-tabs">
        {project.floors.map(f=>(
          <div key={f.id} className={`floor-tab ${f.id===project.activeFloor?'active':''}`}
            onClick={()=>setProject(p=>({...p,activeFloor:f.id}))}>
            {f.name}
          </div>
        ))}
        <button className="floor-add" onClick={addFloor}>+ Pavimento</button>
      </div>

      {/* ===== TOOLBAR ===== */}
      <ToolbarPanel
        tool={tool} setTool={setTool}
        setPendingDevice={setPendingDevice} setCableMode={setCableMode} setMeasureStart={setMeasureStart}
        cableType={cableType} setCableType={setCableType}
        routeType={routeType} setRouteType={setRouteType}
        autoCable={autoCable}
        setShowMigrationWizard={setShowMigrationWizard} legacyCount={legacyCount}
        iconSize={iconSize} changeIconSize={changeIconSize}
        showCableLabels={showCableLabels} setShowCableLabels={setShowCableLabels}
        deviceLabel={deviceLabel} setDeviceLabel={setDeviceLabel}
        snapToGrid={snapToGrid} setSnapToGrid={setSnapToGrid}
        layers={layers} toggleLayer={toggleLayer} applyLayerPreset={applyLayerPreset}
        undo={undo} redo={redo}
        devices={devices} connections={connections} validations={validations}
        envFilterTag={envFilterTag} setEnvFilterTag={setEnvFilterTag}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-area">
        {/* Backdrop for overlay panels on small screens */}
        {isSmallScreen&&(leftPanelOpen||rightPanelOpen)&&(
          <div className="panel-backdrop visible" onClick={()=>{setLeftPanelOpen(false);setRightPanelOpen(false)}}/>
        )}
        {/* LEFT PANEL */}
        <div className={`left-panel ${!leftPanelOpen?(isSmallScreen?'responsive-collapsed':'collapsed'):''}`}>
          <div className="lp-tabs">
            <button onClick={toggleLeftPanel} title="Esconder painel"
              style={{width:28,padding:0,background:'transparent',border:'none',cursor:'pointer',
                fontSize:14,color:'var(--cinza)',flexShrink:0}}>«</button>
            <div className={`lp-tab ${leftTab==='devices'?'active':''}`} onClick={()=>setLeftTab('devices')}>Dispositivos</div>
            <div className={`lp-tab ${leftTab==='floors'?'active':''}`} onClick={()=>setLeftTab('floors')}>Piso</div>
          </div>
          <div className="lp-content">
            {leftTab==='devices'&&<DeviceCatalog search={search} setSearch={setSearch}
              collapsedCats={collapsedCats} toggleCat={toggleCat}
              pendingDevice={pendingDevice} setPendingDevice={setPendingDevice}
              setTool={setTool} customDevices={customDevices} DEVICE_LIB={DEVICE_LIB}
              showEquipmentRepo={showEquipmentRepo} setShowEquipmentRepo={setShowEquipmentRepo} refreshKey={defRefreshKey}/>}
            {leftTab==='floors'&&<>
              <div style={{fontSize:11,color:'var(--cinza)',marginBottom:8}}>Pavimentos do projeto:</div>

              {/* Floor plan background upload */}
              <div style={{background:'rgba(52,152,219,.08)',border:'1px solid rgba(52,152,219,.25)',borderRadius:6,padding:10,marginBottom:10}}>
                <div style={{fontSize:10,fontWeight:700,color:'#3498db',marginBottom:6}}>🗺️ Planta de Fundo</div>
                {floor?.bgImage?(
                  <>
                    <div style={{fontSize:10,color:'#27ae60',marginBottom:4}}>✅ Imagem carregada</div>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
                      <span style={{fontSize:9,color:'var(--cinza)',minWidth:55}}>Opacidade:</span>
                      <input type="range" min="0.05" max="0.8" step="0.05" value={bgOpacity}
                        style={{flex:1,height:4}}
                        onChange={e=>{
                          const v=parseFloat(e.target.value);
                          setBgOpacity(v);
                          updateFloor(f=>({...f,bgOpacity:v}));
                        }}/>
                      <span style={{fontSize:9,color:'var(--cinza)',minWidth:25}}>{Math.round(bgOpacity*100)}%</span>
                    </div>
                    {/* Scale calibration UI */}
                    <div style={{background:'rgba(142,68,173,.06)',border:'1px solid rgba(142,68,173,.2)',borderRadius:5,padding:8,marginBottom:6}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                        <span style={{fontSize:9,fontWeight:700,color:'#8e44ad'}}>📐 Escala</span>
                        <span style={{fontSize:9,color:'#64748b',fontWeight:600}}>{(floor?.bgScale||1).toFixed(2)}x</span>
                      </div>
                      <div style={{display:'flex',gap:4,marginBottom:4}}>
                        <button onClick={()=>{setCalibStart(null);setCalibEnd(null);setShowCalibModal(false);setTool('calibrate')}}
                          style={{flex:1,padding:'5px 6px',fontSize:9,fontWeight:600,cursor:'pointer',
                            background:tool==='calibrate'?'#8e44ad':'rgba(142,68,173,.1)',
                            color:tool==='calibrate'?'#fff':'#8e44ad',
                            border:`1px solid ${tool==='calibrate'?'#8e44ad':'rgba(142,68,173,.3)'}`,borderRadius:4,transition:'.15s'}}>
                          {tool==='calibrate'?(calibStart?'🎯 Clique ponto 2':'🎯 Clique ponto 1'):'📐 Calibrar'}
                        </button>
                        {(floor?.bgScale||1)!==1&&(
                          <button onClick={()=>updateFloor(f=>({...f,bgScale:1.0}))}
                            style={{padding:'5px 8px',fontSize:9,fontWeight:600,cursor:'pointer',
                              background:'rgba(239,68,68,.08)',color:'#ef4444',
                              border:'1px solid rgba(239,68,68,.25)',borderRadius:4}}>
                            Resetar
                          </button>
                        )}
                      </div>
                      {/* Manual scale input */}
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={{fontSize:8,color:'#94a3b8',minWidth:38}}>Manual:</span>
                        <input type="number" min="0.1" max="20" step="0.01"
                          value={floor?.bgScale||1}
                          onChange={e=>{
                            const v=parseFloat(e.target.value);
                            if(!isNaN(v)&&v>=0.1&&v<=20) updateFloor(f=>({...f,bgScale:Math.round(v*1000)/1000}));
                          }}
                          style={{flex:1,padding:'3px 6px',fontSize:9,border:'1px solid #d1d5db',borderRadius:3,
                            background:'#fff',color:'#374151',width:0}}/>
                      </div>
                      {tool==='calibrate'&&(
                        <div style={{marginTop:4,fontSize:8,color:'#8e44ad',fontStyle:'italic',lineHeight:1.3}}>
                          {!calibStart?'Clique no primeiro ponto de referência na planta':
                           !calibEnd?'Agora clique no segundo ponto de referência':'Informe a distância real...'}
                        </div>
                      )}
                    </div>
                    <button onClick={()=>{updateFloor(f=>({...f,bgImage:null,bgOpacity:0.3,bgScale:1.0}));setBgOpacity(0.3)}}
                      style={{width:'100%',padding:'4px 8px',fontSize:10,background:'#fdecea',color:'#e74c3c',
                        border:'1px solid #e74c3c',borderRadius:4,cursor:'pointer'}}>
                      🗑️ Remover planta
                    </button>
                  </>
                ):(
                  <>
                    <div style={{fontSize:10,color:'var(--cinza)',marginBottom:6}}>
                      Carregue uma imagem de planta arquitetônica como fundo do canvas.
                    </div>
                    <button onClick={()=>bgFileRef.current?.click()}
                      style={{width:'100%',padding:'6px 8px',fontSize:10,background:'#3498db',color:'#fff',
                        border:'none',borderRadius:4,cursor:'pointer',fontWeight:600}}>
                      📂 Carregar imagem (JPG/PNG)
                    </button>
                    <input ref={bgFileRef} type="file" accept="image/jpeg,image/png,image/webp"
                      style={{display:'none'}}
                      onChange={e=>{
                        const file=e.target.files?.[0];
                        if(!file) return;
                        if(file.size>10*1024*1024){alert('Imagem muito grande (máx 10MB)');return}
                        const reader=new FileReader();
                        reader.onload=ev=>{
                          updateFloor(f=>({...f,bgImage:ev.target.result,bgOpacity:bgOpacity,bgScale:1.0}));
                        };
                        reader.readAsDataURL(file);
                        e.target.value='';
                      }}/>
                  </>
                )}
              </div>
              {project.floors.map(f=>{
                const isActive=f.id===project.activeFloor;
                const isEditing=editingFloorId===f.id;
                return (
                <div key={f.id} style={{padding:'8px 10px',margin:'4px 0',borderRadius:6,
                  background:isActive?'#EBF5FB':'var(--cinzaL)',
                  border:isActive?'1px solid var(--azul2)':'1px solid transparent',
                  cursor:'pointer',fontSize:11}}
                  onClick={()=>setProject(p=>({...p,activeFloor:f.id}))}>
                  <div style={{display:'flex',alignItems:'center',gap:4}}>
                    {isEditing?(
                      <input type="text" defaultValue={f.name} autoFocus
                        style={{flex:1,fontSize:11,fontWeight:600,color:'var(--azul)',border:'1px solid var(--azul2)',borderRadius:4,padding:'2px 6px',background:'#fff'}}
                        onClick={e=>e.stopPropagation()}
                        onKeyDown={e=>{if(e.key==='Enter'){const v=e.target.value.trim();if(v){setProject(p=>({...p,floors:p.floors.map(fl=>fl.id===f.id?{...fl,name:v}:fl)}))};setEditingFloorId(null)}
                          if(e.key==='Escape')setEditingFloorId(null)}}
                        onBlur={e=>{const v=e.target.value.trim();if(v){setProject(p=>({...p,floors:p.floors.map(fl=>fl.id===f.id?{...fl,name:v}:fl)}))};setEditingFloorId(null)}}/>
                    ):(
                      <span style={{flex:1,fontWeight:600,color:'var(--azul)'}}>{f.name}</span>
                    )}
                    <button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:'2px 4px',color:'var(--cinza)',opacity:.7}}
                      title="Renomear" onClick={e=>{e.stopPropagation();setEditingFloorId(f.id)}}>✏️</button>
                    {project.floors.length>1&&<button style={{background:'none',border:'none',cursor:'pointer',fontSize:11,padding:'2px 4px',color:'#ef4444',opacity:.7}}
                      title="Excluir pavimento" onClick={e=>{e.stopPropagation();if(confirm(`Excluir "${f.name}"?`)){
                        setProject(p=>{const nf=p.floors.filter(fl=>fl.id!==f.id);return{...p,floors:nf,activeFloor:nf[0]?.id||p.activeFloor,crossFloorConnections:(p.crossFloorConnections||[]).filter(xc=>xc.fromFloorId!==f.id&&xc.toFloorId!==f.id)}})}
                      }}>🗑️</button>}
                  </div>
                  <div style={{fontSize:9,color:'var(--cinza)',marginTop:2}}>
                    {f.devices.length} dispositivos · {f.connections.length} conexões
                    {(project.crossFloorConnections||[]).filter(xc=>xc.fromFloorId===f.id||xc.toFloorId===f.id).length>0&&
                      <span style={{color:'#8b5cf6',marginLeft:4}}>· {(project.crossFloorConnections||[]).filter(xc=>xc.fromFloorId===f.id||xc.toFloorId===f.id).length} cross-floor</span>}
                  </div>
                </div>);
              })}
            </>}
          </div>
        </div>

        {/* CANVAS */}
        <div className="canvas-area" ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel} onContextMenu={handleContextMenu}
          onMouseDownCapture={(e)=>{
            // Middle-click → pan from anywhere (capture phase fires before device handlers)
            if(e.button===1){e.preventDefault();e.stopPropagation();
              isPanningRef.current=true;setIsPanning(true);
              panStartRef.current={x:e.clientX,y:e.clientY,panX:pan.x,panY:pan.y}}
          }}
          style={{cursor:isPanning?'grabbing':tool==='pan'?'grab':undefined}}
          onDragOver={(e)=>{e.preventDefault();e.dataTransfer.dropEffect='copy'}}
          onDrop={(e)=>{
            e.preventDefault();
            const deviceKey=e.dataTransfer.getData('deviceKey');
            if(!deviceKey) return;
            const rect=canvasRef.current?.getBoundingClientRect();
            if(!rect) return;
            const x=(e.clientX-rect.left-pan.x)/zoom;
            const y=(e.clientY-rect.top-pan.y)/zoom;
            addDevice(deviceKey,x,y);
          }}>
          <div className="canvas-viewport">
            <div className="canvas-transform" style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}}>
              {/* Grid */}
              <svg className="canvas-grid" width="2000" height="2000" style={{display:layers.grid?'block':'none'}}>
                <defs>
                  <pattern id="grid-dots" width="40" height="40" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="0.8" fill="#94a3b8" opacity="0.25"/>
                  </pattern>
                  <pattern id="grid-major" width="200" height="200" patternUnits="userSpaceOnUse">
                    <circle cx="20" cy="20" r="1.4" fill="#64748b" opacity="0.35"/>
                  </pattern>
                </defs>
                <rect width="2000" height="2000" fill="url(#grid-dots)"/>
                <rect width="2000" height="2000" fill="url(#grid-major)"/>
              </svg>

              {/* Background floor plan image */}
              {layers.bg&&floor?.bgImage&&(
                <img src={floor.bgImage} alt="Planta de fundo"
                  style={{position:'absolute',top:0,left:0,
                    width:2000*(floor.bgScale||1),height:2000*(floor.bgScale||1),
                    objectFit:'contain',objectPosition:'top left',
                    opacity:bgOpacity,pointerEvents:'none',userSelect:'none',zIndex:0}}
                  draggable={false}/>
              )}

              {/* Connection lines */}
              <svg className="conn-svg" width="2000" height="2000" style={{display:layers.cables?'block':'none',zIndex:4}}>
                {/* Connection anchor dot indicators on devices in cable mode */}
                {cableMode&&devices.filter(d=>!d.quadroId).map(dev=>{
                  const R=getDevR(dev);
                  const cx=dev.x+R,cy=dev.y+R;
                  const anchors=[[0,-1],[1,0],[0,1],[-1,0]];
                  const ts=validTargets[dev.id];
                  if(ts!=='valid'&&dev.id!==cableMode?.from) return null;
                  const dotColor=dev.id===cableMode?.from?'#f59e0b':'#22c55e';
                  return <g key={'anc_'+dev.id}>
                    {anchors.map(([ax,ay],i)=>(
                      <circle key={i} cx={cx+ax*(R+1)} cy={cy+ay*(R+1)} r={4}
                        fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
                        style={{pointerEvents:'none'}}/>
                    ))}
                  </g>;
                })}
                {/* Anchor dots on Quadros when they contain valid cable targets */}
                {cableMode&&quadros.map(qc=>{
                  const qcDevs=devices.filter(d=>d.quadroId===qc.id);
                  const hasValidTarget=qcDevs.some(d=>validTargets[d.id]==='valid');
                  const hasSource=qcDevs.some(d=>d.id===cableMode?.from);
                  if(!hasValidTarget&&!hasSource) return null;
                  const qW=160;const headerH=28;const slotH=22;
                  const qH=headerH+Math.max(2,qcDevs.length)*slotH+12;
                  const cx=qc.x+qW/2,cy=qc.y+qH/2;
                  const dotColor=hasSource?'#f59e0b':'#22c55e';
                  const anchors=[[0,-qH/2-4],[qW/2+4,0],[0,qH/2+4],[-qW/2-4,0]];
                  return <g key={'anc_qc_'+qc.id}>
                    {anchors.map(([ax,ay],i)=>(
                      <circle key={i} cx={cx+ax} cy={cy+ay} r={5}
                        fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
                        style={{pointerEvents:'none'}}/>
                    ))}
                  </g>;
                })}
                {connections.map(conn=>{
                  const from=devices.find(d=>d.id===conn.from);
                  const to=devices.find(d=>d.id===conn.to);
                  if(!from||!to) return null;
                  const ct=CABLE_TYPES.find(c=>c.id===conn.type)||CABLE_TYPES[0];
                  const isSel=selectedConn===conn.id;

                  // Se device está em Quadro, usar posição do Quadro como referência visual
                  const resolvePos=(dev)=>{
                    const R=getDevR(dev);
                    if(dev.quadroId){
                      const qc=quadros.find(q=>q.id===dev.quadroId);
                      if(qc) return {x:qc.x+80,y:qc.y+14,R};
                    }
                    return {x:dev.x+R,y:dev.y+R,R};
                  };
                  const fromPos=resolvePos(from);
                  const toPos=resolvePos(to);
                  const fcx=fromPos.x, fcy=fromPos.y;
                  const tcx=toPos.x, tcy=toPos.y;

                  // Offset for multiple connections between same pair
                  const pairKey=[conn.from,conn.to].sort().join('|');
                  const pairConns=connections.filter(c=>[c.from,c.to].sort().join('|')===pairKey);
                  const pairIdx=pairConns.indexOf(conn);
                  const pairTotal=pairConns.length;
                  const offsetAmt=pairTotal>1?(pairIdx-(pairTotal-1)/2)*10:0;

                  const dx=tcx-fcx;const dy=tcy-fcy;
                  const len=Math.sqrt(dx*dx+dy*dy)||1;
                  const ux=dx/len,uy=dy/len;
                  const ppx=-uy,ppy=ux;

                  const x1=fcx+ux*fromPos.R+ppx*offsetAmt;
                  const y1=fcy+uy*fromPos.R+ppy*offsetAmt;
                  const x2=tcx-ux*toPos.R+ppx*offsetAmt;
                  const y2=tcy-uy*toPos.R+ppy*offsetAmt;

                  const isPower=ct.group==='power';
                  const isSignal=ct.group==='signal';
                  const isAuto=ct.group==='automation';
                  const isWireless=conn.type==='wireless';
                  // Enhanced visual distinction per cable type
                  const dashArr=isWireless?'4 4':isPower?'8 4':isSignal?'3 3':isAuto?'8 3 2 3':'none';
                  const sw=isPower?3.2:isAuto?2.6:isSignal?2.2:isWireless?1.5:2.5;
                  const cableColor=isPower?'#dc2626':isSignal?'#16a34a':isAuto?'#7c3aed':isWireless?'#94a3b8':ct.color;
                  const purposeIcon=isPower?'⚡':isSignal?'📡':isAuto?'🔧':'';
                  const portLabel=conn.ifaceLabel?` [${conn.ifaceLabel.split('(')[0].trim()}]`:'';

                  // draw.io-style orthogonal routing
                  const wps=conn.waypoints||[];
                  const hasWps=wps.length>0;

                  // Build full points array: start → (waypoints or auto-ortho) → end
                  let allPts;
                  if(hasWps){
                    allPts=[{x:x1,y:y1},...wps,{x:x2,y:y2}];
                  } else {
                    allPts=autoOrthoRoute(x1,y1,x2,y2);
                  }

                  // Generate SVG path with rounded corners at bends
                  const pathD=buildOrthoPath(allPts,8);

                  // Label position: midpoint of the points array
                  const midIdx=Math.floor(allPts.length/2);
                  const lp=allPts[midIdx];
                  const lpPrev=allPts[Math.max(0,midIdx-1)];
                  const labelX=(lp.x+lpPrev.x)/2;
                  const labelY=(lp.y+lpPrev.y)/2-8;

                  // Click on cable to select
                  const onConnClick=(e)=>{
                    e.stopPropagation();
                    if(cableMode) return;
                    setSelectedConn(isSel?null:conn.id);
                    setSelectedDevice(null);
                  };

                  return <g key={conn.id} className={`conn-g${isSel?' conn-selected':''}`}>
                    {/* Full path hit area for selection */}
                    <path d={pathD} className="conn-hit-area" onClick={onConnClick}/>
                    {/* Visible cable path */}
                    <path d={pathD} fill="none" className="conn-line-path"
                      stroke={isSel?'#3b82f6':cableColor} strokeWidth={isSel?sw+1:sw}
                      strokeDasharray={dashArr} strokeLinejoin="round" strokeLinecap="round"
                      style={{pointerEvents:'none'}}/>
                    {/* Endpoint anchor dots */}
                    <circle cx={x1} cy={y1} r={3.5} fill={isSel?'#3b82f6':cableColor} opacity={0.8} style={{pointerEvents:'none'}}/>
                    <circle cx={x2} cy={y2} r={3.5} fill={isSel?'#3b82f6':cableColor} opacity={0.8} style={{pointerEvents:'none'}}/>
                    {/* Cable label with background box */}
                    {showCableLabels&&(()=>{
                      const lt=`${purposeIcon}${ct.name} · ${conn.distance}m${portLabel}`;
                      const estW=Math.max(lt.length*6.5+16,48);
                      return <g style={{pointerEvents:'none'}}>
                        <rect x={labelX-estW/2} y={labelY-17} width={estW} height={20}
                          rx={4} ry={4} fill="#fff" fillOpacity={0.92}
                          stroke="#cbd5e1" strokeWidth={0.5}/>
                        <text x={labelX} y={labelY} className="cable-label-v2">{lt}</text>
                      </g>;
                    })()}

                    {/* draw.io-style: segment drag handles (shown when selected) */}
                    {isSel&&allPts.slice(0,-1).map((pt,si)=>{
                      const npt=allPts[si+1];
                      const segD=`M${pt.x},${pt.y} L${npt.x},${npt.y}`;
                      return <g key={'seg'+si}>
                        {/* Invisible wide hit area for dragging segment */}
                        <path d={segD} className="seg-hit"
                          onMouseDown={(e)=>{
                            if(cableMode) return; // Don't start drag during cable creation
                            e.stopPropagation();e.preventDefault();
                            const rect=canvasRef.current?.getBoundingClientRect();
                            if(!rect) return;
                            const mx=(e.clientX-rect.left)/zoom-pan.x/zoom;
                            const my=(e.clientY-rect.top)/zoom-pan.y/zoom;
                            // If dragging an auto-generated segment (no custom waypoints yet),
                            // initialize waypoints from auto-route first
                            if(!hasWps){
                              const autoWps=autoOrthoRoute(x1,y1,x2,y2);
                              // Store inner waypoints (exclude start/end which are anchors)
                              const innerWps=autoWps.slice(1,-1);
                              updateConnWaypoints(conn.id,innerWps);
                              // Now drag the corresponding segment
                              setDraggingWp({connId:conn.id,type:'seg',segIdx:si>0?si-1:0,lastX:mx,lastY:my});
                            } else {
                              // Dragging an existing waypoint segment
                              if(si===0||si>=allPts.length-2){
                                // First or last segment — create new bend
                                setDraggingWp({connId:conn.id,type:'newSeg',segIdx:si,allPts,lastX:mx,lastY:my});
                              } else {
                                setDraggingWp({connId:conn.id,type:'seg',segIdx:si-1,lastX:mx,lastY:my});
                              }
                            }
                            setSelectedConn(conn.id);
                          }}/>
                        {/* Hover highlight */}
                        <path d={segD} className="seg-highlight"/>
                      </g>;
                    })}

                    {/* draw.io-style: square blue handles at waypoints (shown when selected) */}
                    {isSel&&wps.map((wp,wi)=>(
                      <rect key={'wph'+wi} x={wp.x-4} y={wp.y-4} width={8} height={8}
                        fill="#3b82f6" stroke="#fff" strokeWidth={1.5}
                        rx={1} style={{cursor:'move'}}
                        onMouseDown={(e)=>{
                          e.stopPropagation();e.preventDefault();
                          setDraggingWp({connId:conn.id,type:'point',wpIdx:wi});
                          setSelectedConn(conn.id);
                        }}
                        onDoubleClick={(e)=>{
                          e.stopPropagation();
                          deleteWaypoint(conn.id,wi);
                        }}/>
                    ))}
                  </g>;
                })}
                {/* Cable mode preview line from source device */}
                {cableMode&&(()=>{
                  const from=devices.find(d=>d.id===cableMode.from);
                  if(!from) return null;
                  const R=getDevR(from);
                  let cx=from.x+R,cy=from.y+R;
                  if(from.quadroId){const qc=quadros.find(q=>q.id===from.quadroId);if(qc){cx=qc.x+80;cy=qc.y+14}}
                  return <circle cx={cx} cy={cy} r={R+3} fill="none"
                    stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 3" opacity=".6"/>;
                })()}

                {/* Cross-floor connection indicators */}
                {layers.cables&&currentFloorCrossConns.map(xc=>{
                  const isFrom=xc.fromFloorId===project.activeFloor;
                  const localDevId=isFrom?xc.fromDeviceId:xc.toDeviceId;
                  const remoteDevId=isFrom?xc.toDeviceId:xc.fromDeviceId;
                  const remoteFloorId=isFrom?xc.toFloorId:xc.fromFloorId;
                  const localDev=devices.find(d=>d.id===localDevId);
                  if(!localDev) return null;
                  const remoteFloor=project.floors.find(f=>f.id===remoteFloorId);
                  const remoteDev=remoteFloor?.devices?.find(d=>d.id===remoteDevId);
                  if(!remoteDev) return null;
                  const R=getDevR(localDev);
                  let cx=localDev.x+R,cy=localDev.y+R;
                  if(localDev.quadroId){const qc=quadros.find(q=>q.id===localDev.quadroId);if(qc){cx=qc.x+80;cy=qc.y+14;}}
                  const ct=CABLE_TYPES.find(c=>c.id===xc.type)||CABLE_TYPES[0];
                  const isSel=selectedConn===xc.id;
                  const lblText=`↕ ${remoteFloor.name}: ${remoteDev.name} · ${ct.name} · ${xc.distance}m`;
                  const estW=Math.max(lblText.length*5.8+20,100);
                  return <g key={'xc-'+xc.id} style={{cursor:'pointer'}} onClick={(e)=>{e.stopPropagation();setSelectedConn(isSel?null:xc.id);setSelectedDevice(null)}}>
                    {/* Dashed circle around local device */}
                    <circle cx={cx} cy={cy} r={R+5} fill="none"
                      stroke={isSel?'#046BD2':'#8b5cf6'} strokeWidth={2} strokeDasharray="5 3" opacity={.7}/>
                    {/* Vertical arrow indicator — click to show label */}
                    <line x1={cx} y1={cy-R-5} x2={cx} y2={cy-R-22}
                      stroke={isSel?'#046BD2':'#8b5cf6'} strokeWidth={2} strokeDasharray="3 2" markerEnd="url(#xfArrow)"/>
                    {/* Clickable hit area on arrow tip */}
                    <circle cx={cx} cy={cy-R-22} r={8} fill="transparent" style={{cursor:'pointer'}}/>
                    {/* Label box — only shown when selected */}
                    {isSel&&<>
                      <rect x={cx-estW/2} y={cy-R-42} width={estW} height={18}
                        rx={4} ry={4} fill='#EBF5FB' fillOpacity={.95}
                        stroke='#046BD2' strokeWidth={.8}/>
                      <text x={cx} y={cy-R-29} textAnchor="middle"
                        style={{fontSize:9,fontWeight:600,fill:'#046BD2',pointerEvents:'none'}}>
                        {lblText}
                      </text>
                    </>}
                  </g>;
                })}

                {/* Arrow marker for cross-floor indicators */}
                <defs>
                  <marker id="xfArrow" markerWidth="8" markerHeight="6" refX="4" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6 Z" fill="#8b5cf6"/>
                  </marker>
                </defs>
              </svg>

              {/* Rack containers removed — rack is now a data entity in floor.racks[] */}

              {/* Quadro de Conectividade (QC) entities on canvas */}
              {layers.devices&&quadros.map(qc=>{
                const qcDevices=devices.filter(d=>d.quadroId===qc.id);
                const isSel=selectedQuadroId===qc.id;
                const qW=160;const headerH=28;const slotH=22;
                const qH=headerH+Math.max(2,qcDevices.length)*slotH+12;
                return (
                  <div key={'qc-'+qc.id}
                    style={{position:'absolute',left:qc.x,top:qc.y,width:qW,minHeight:qH,
                      background:'linear-gradient(180deg,#f0fdf4,#dcfce7)',
                      border:`2px solid ${isSel?'#16a34a':cableMode&&qcDevices.some(d=>validTargets[d.id]==='valid')?'#22c55e':'#86efac'}`,
                      borderRadius:8,zIndex:5,
                      boxShadow:isSel?'0 0 16px rgba(22,163,74,.4)':cableMode&&qcDevices.some(d=>validTargets[d.id]==='valid')?'0 0 16px rgba(34,197,94,.4)':'0 2px 10px rgba(0,0,0,.1)',
                      cursor:cableMode&&qcDevices.some(d=>validTargets[d.id]==='valid')?'crosshair':'move',userSelect:'none'}}
                    onClick={(e)=>{
                      e.stopPropagation();
                      // In cable mode, if Quadro has exactly 1 valid target, auto-connect on click
                      if(cableMode){
                        const qcDevs=devices.filter(d=>d.quadroId===qc.id);
                        const validDevs=qcDevs.filter(d=>validTargets[d.id]==='valid');
                        if(validDevs.length===1){handleDeviceClick(e,validDevs[0].id);return;}
                        // If multiple valid, just expand/select the quadro to show targets
                      }
                      setSelectedQuadroId(qc.id);setSelectedDevice(null);setSelectedConn(null);
                      setRightTab('quadro');
                    }}
                    onMouseDown={(e)=>{
                      if(tool!=='select') return;
                      e.stopPropagation();e.preventDefault();
                      const rect=canvasRef.current?.getBoundingClientRect();
                      if(!rect) return;
                      setDragging({id:'qc_'+qc.id,isQuadro:true,offsetX:e.clientX/zoom-qc.x,offsetY:e.clientY/zoom-qc.y});
                    }}>
                    {/* Header */}
                    <div style={{height:headerH,display:'flex',alignItems:'center',gap:6,
                      padding:'0 8px',borderBottom:'1.5px solid #bbf7d0',background:'rgba(22,163,74,.12)',
                      borderRadius:'6px 6px 0 0'}}>
                      <span style={{fontSize:12}}>📦</span>
                      <span style={{fontSize:11,fontWeight:800,color:'#166534',flex:1,overflow:'hidden',
                        textOverflow:'ellipsis',whiteSpace:'nowrap',letterSpacing:.3}}>{qc.tag}</span>
                      <span style={{fontSize:9,fontWeight:700,color:'#dcfce7',background:'#166534',
                        padding:'1px 6px',borderRadius:6,minWidth:18,textAlign:'center'}}>{qcDevices.length}</span>
                    </div>
                    {/* Device list */}
                    {qcDevices.length>0?qcDevices.slice(0,6).map(child=>{
                      const catColor=DEVICE_LIB.find(c=>c.items.some(it=>it.key===child.key))?.color||'#6b7280';
                      const cableTarget=cableMode?validTargets[child.id]:null;
                      const isCableSrc=cableMode?.from===child.id;
                      return (
                        <div key={child.id} style={{display:'flex',alignItems:'center',gap:5,padding:'2px 8px',
                          borderBottom:'1px solid #dcfce7',height:slotH,fontSize:9,
                          ...(isCableSrc?{background:'rgba(245,158,11,.15)'}:{}),
                          ...(cableTarget==='valid'?{background:'rgba(34,197,94,.12)',cursor:'crosshair'}:{}),
                          ...(cableTarget==='invalid'?{opacity:.4}:{})}}>
                          <span style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                            background:isCableSrc?'#f59e0b':cableTarget==='valid'?'#22c55e':catColor,
                            border:'1.5px solid #fff',boxShadow:'0 1px 2px rgba(0,0,0,.15)',
                            ...(cableTarget==='valid'?{animation:'pulse 1.5s infinite'}:{})}}/>
                          <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',
                            color:isCableSrc?'#f59e0b':cableTarget==='valid'?'#166534':'#334155',
                            fontWeight:cableTarget==='valid'||isCableSrc?700:500,cursor:'pointer'}}
                            onClick={(e)=>{e.stopPropagation();
                              if(cableMode&&cableTarget==='valid'){handleDeviceClick(e,child.id);return;}
                              if(!cableMode){setSelectedDevice(child.id);setRightTab('props');}
                            }}>
                            {child.name}
                          </span>
                          {cableTarget==='valid'&&<span style={{fontSize:8,color:'#22c55e',fontWeight:800,flexShrink:0}}>●</span>}
                        </div>
                      );
                    }):(
                      <div style={{padding:8,fontSize:8,color:'#86efac',textAlign:'center'}}>
                        Vazio — atribua dispositivos
                      </div>
                    )}
                    {qcDevices.length>6&&(
                      <div style={{fontSize:8,color:'#4ade80',textAlign:'center',padding:'2px 0',fontWeight:600}}>
                        +{qcDevices.length-6} mais...
                      </div>
                    )}
                    {/* Footer with summary + name */}
                    <div style={{fontSize:8,color:'#166534',textAlign:'center',padding:'3px 6px',
                      fontWeight:700,borderTop:'1.5px solid #bbf7d0',overflow:'hidden',textOverflow:'ellipsis',
                      whiteSpace:'nowrap',background:'rgba(22,163,74,.05)',borderRadius:'0 0 6px 6px',
                      display:'flex',justifyContent:'space-between',gap:4}}>
                      <span style={{overflow:'hidden',textOverflow:'ellipsis'}}>{qc.name}</span>
                      {qcDevices.length>0&&<span style={{color:'#4ade80',fontWeight:600,flexShrink:0}}>
                        {qcDevices.reduce((s,d)=>{const i=getDeviceInterfaces(d);const pConns=connections.filter(c=>c.from===d.id||c.to===d.id);return s+pConns.length},0)}cx
                      </span>}
                    </div>
                    {/* Delete button when selected */}
                    {isSel&&(
                      <div style={{position:'absolute',top:-6,right:-6,width:18,height:18,borderRadius:'50%',
                        background:'#ef4444',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',
                        cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.3)',fontSize:10,color:'#fff',fontWeight:900,zIndex:15}}
                        title="Excluir quadro"
                        onMouseDown={e=>{e.stopPropagation();e.preventDefault()}}
                        onClick={e=>{e.stopPropagation();deleteQuadro(qc.id)}}>✕</div>
                    )}
                  </div>
                );
              })}

              {/* Device nodes — hide devices that are inside a quadro (rack devices stay visible) */}
              {layers.devices&&devices.filter(d=>!d.quadroId).map(dev=>{
                const def=findDevDef(dev.key);
                const catInfo=DEVICE_LIB.find(c=>c.items.some(i=>i.key===dev.key));
                const color=getDeviceColor(dev.key)||catInfo?.color||'#6b7280';
                const targetStatus=cableMode?validTargets[dev.id]:null;
                const isSource=cableMode?.from===dev.id;
                const inRack=dev.parentRack?racks.find(r=>r.id===dev.parentRack):null;
                const devSize=dev.iconSize||iconSize;
                const sizeClass=devSize==='sm'?'device-sm':devSize==='md'?'device-md':'';
                // Compute status tags for info card
                const devTags=[];
                if(isGravador(dev.key)){const ch=getNvrChannels(dev),used=getNvrUsedChannels(dev.id,devices);
                  devTags.push({t:`${used}/${ch}ch`,c:used>ch?'#ef4444':used>0?'#22c55e':'#94a3b8'})}
                if(isSwitch(dev.key)){const tp=getSwitchPorts(dev);
                  const up=connections.filter(c=>c.from===dev.id||c.to===dev.id)
                    .map(c=>{const o=c.from===dev.id?c.to:c.from;return devices.find(d=>d.id===o)}).filter(Boolean)
                    .reduce((s,d)=>s+(needsPoE(d.key)?(d.qty||1):1),0);
                  devTags.push({t:`${up}/${tp}p`,c:up>tp?'#ef4444':up>0?'#3b82f6':'#94a3b8'})}
                if(isCamera(dev.key)){
                  if((dev.qty||1)>1) devTags.push({t:`×${dev.qty}`,c:'#3b82f6'});
                  const assigns=dev.nvrAssignments||[];
                  if(assigns.length>0){const total=dev.qty||1,asgn=assigns.reduce((s,a)=>s+(a.qty||0),0);
                    devTags.push({t:asgn>=total?'✓ NVR':`${asgn}/${total} NVR`,c:asgn>=total?'#22c55e':'#f59e0b'})}}
                // Cross-floor connection tags
                const xfConnsForDev=currentFloorCrossConns.filter(xc=>
                  (xc.fromDeviceId===dev.id&&xc.fromFloorId===project.activeFloor)||(xc.toDeviceId===dev.id&&xc.toFloorId===project.activeFloor));
                xfConnsForDev.forEach(xc=>{
                  const isFrom=xc.fromDeviceId===dev.id&&xc.fromFloorId===project.activeFloor;
                  const remFloorId=isFrom?xc.toFloorId:xc.fromFloorId;
                  const remDevId=isFrom?xc.toDeviceId:xc.fromDeviceId;
                  const remFloor=project.floors.find(f=>f.id===remFloorId);
                  const remDev=remFloor?.devices?.find(d=>d.id===remDevId);
                  if(remDev&&remFloor) devTags.push({t:`↕ ${remFloor.name}`,c:'#8b5cf6'});
                });
                return (
                  <div key={dev.id}
                    className={`device-on-canvas ${sizeClass} ${selectedDevice===dev.id?'selected':''} ${multiSelect.has(dev.id)?'multi-selected':''}`}
                    data-dev-id={dev.id}
                    style={{left:dev.x,top:dev.y,
                      ...(searchHighlight&&!searchHighlight.has(dev.id)?{opacity:.15,filter:'grayscale(0.8)'}:{}),
                      ...(inRack?{zIndex:2}:{}),
                      ...(multiSelect.has(dev.id)?{outline:'2px solid #3498db',outlineOffset:2,borderRadius:10,boxShadow:'0 0 8px rgba(52,152,219,.4)'}:{}),
                      ...(isSource?{outline:'2px solid #f59e0b',outlineOffset:2,borderRadius:10}:{}),
                      ...(targetStatus==='valid'?{outline:'2px solid #22c55e',outlineOffset:2,borderRadius:10,boxShadow:'0 0 12px rgba(34,197,94,.4)'}:{}),
                      ...(targetStatus==='invalid'?{opacity:.35,filter:'grayscale(0.8)'}:{}),
                      ...(envFilterTag&&dev.ambiente!==envFilterTag?{opacity:.3,pointerEvents:'none'}:{}),
                      cursor:cableMode?(targetStatus==='valid'?'crosshair':'not-allowed'):'pointer'
                    }}
                    onClick={(e)=>handleDeviceClick(e,dev.id)}
                    onMouseDown={(e)=>handleDeviceMouseDown(e,dev.id)}
                    onDoubleClick={(e)=>{e.stopPropagation();if(tool==='cable'||cableMode){return}
                      setCableMode({from:dev.id});setTool('cable')}}>
                    <div className="doc-icon" style={{borderColor:isSource?'#f59e0b':targetStatus==='valid'?'#22c55e':color}}>
                      {ICONS[getDeviceIconKey(dev.key)]?.(isSource?'#f59e0b':targetStatus==='valid'?'#22c55e':color)}
                    </div>
                    {/* Connection button - opens port popup */}
                    {!cableMode&&(()=>{
                      const ifaces=getDeviceInterfaces(dev);
                      if(!ifaces.length) return null;
                      return (
                        <div className="dev-conn-btn"
                          style={{top:-6,right:-6,width:20,height:20,
                            fontSize:11,zIndex:16,opacity:portPopup?.devId===dev.id?1:.75}}
                          title="Conectar porta"
                          onMouseDown={(e)=>{e.stopPropagation();e.preventDefault()}}
                          onClick={(e)=>{
                            e.stopPropagation();
                            // Use screen coordinates from click event for fixed positioning
                            const btnRect=e.currentTarget.getBoundingClientRect();
                            const popW=320,popH=450;
                            const vw=window.innerWidth,vh=window.innerHeight;
                            let px=btnRect.right+8;
                            let py=btnRect.top-10;
                            // Clamp: if overflows right, show to the left of button
                            if(px+popW>vw-12) px=Math.max(12,btnRect.left-popW-8);
                            // Clamp: if overflows bottom, push up
                            if(py+popH>vh-12) py=Math.max(12,vh-popH-12);
                            // Clamp: if overflows top
                            if(py<12) py=12;
                            // Clamp: if still overflows left
                            if(px<12) px=12;
                            setPortPopup({devId:dev.id,x:px,y:py,fixed:true});
                          }}>⚡</div>
                      );
                    })()}
                    {dev.ambiente&&(()=>{
                      const ec=ENV_COLORS.find(e=>e.name===dev.ambiente);
                      return <div style={{position:'absolute',top:-10,left:'50%',transform:'translateX(-50%)',
                        fontSize:7,fontWeight:700,padding:'1px 6px',borderRadius:8,whiteSpace:'nowrap',zIndex:14,
                        background:ec?.color||'#6b7280',color:'#fff',border:'1.5px solid #fff',
                        boxShadow:'0 1px 3px rgba(0,0,0,.2)'}}>{dev.ambiente}</div>;
                    })()}
                    {deviceLabel==='card'?(
                      <div className="doc-card" style={{borderLeftColor:color}}>
                        <div className="doc-card-name">{dev.name}</div>
                        {dev.model&&<div className="doc-card-model">{dev.model}</div>}
                        {devTags.length>0&&<div className="doc-card-sub">
                          {devTags.map((s,i)=><span key={i} className="doc-card-tag" style={{background:s.c}}>{s.t}</span>)}
                        </div>}
                      </div>
                    ):deviceLabel==='label'?(
                      <div className="doc-label">{dev.name}</div>
                    ):null}
                    {inRack&&<div style={{position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',
                      fontSize:7,background:'var(--azul)',color:'#fff',padding:'0 4px',borderRadius:3,
                      whiteSpace:'nowrap'}}>📦 {inRack.name}</div>}
                    {/* Delete button on selected device */}
                    {selectedDevice===dev.id&&!cableMode&&(
                      <div style={{position:'absolute',top:-4,left:-4,width:16,height:16,borderRadius:'50%',
                        background:'#ef4444',border:'1.5px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',
                        cursor:'pointer',boxShadow:'0 1px 3px rgba(0,0,0,.4)',fontSize:9,color:'#fff',fontWeight:900,zIndex:15}}
                        title="Excluir dispositivo"
                        onMouseDown={e=>{e.stopPropagation();e.preventDefault()}}
                        onDoubleClick={e=>e.stopPropagation()}
                        onClick={e=>{e.stopPropagation();
                          updateFloor(f=>({...f,
                            devices:f.devices.filter(d=>d.id!==dev.id),
                            connections:f.connections.filter(c=>c.from!==dev.id&&c.to!==dev.id)
                          }));
                          setSelectedDevice(null);
                        }}>✕</div>
                    )}
                    {/* Camera qty now shown inside doc-card tags */}
                    {/* Quantity setter for cameras when selected */}
                    {selectedDevice===dev.id&&isCamera(dev.key)&&!cableMode&&(
                      <div style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',
                        display:'flex',alignItems:'center',gap:2,background:'#ffffff',borderRadius:4,padding:'2px 4px',
                        boxShadow:'0 2px 8px rgba(0,0,0,.15)',border:'1px solid #E2E8F0',zIndex:15,whiteSpace:'nowrap'}}
                        onMouseDown={e=>{e.stopPropagation();e.preventDefault()}}
                        onDoubleClick={e=>e.stopPropagation()}>
                        <button style={{width:16,height:16,fontSize:12,background:'#F0F5FA',border:'1px solid #E2E8F0',borderRadius:3,
                          color:'#1e293b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                          onDoubleClick={e=>e.stopPropagation()}
                          onClick={e=>{e.stopPropagation();const cur=dev.qty||1;if(cur>1){
                            const newQty=cur-1;
                            const trimmed=trimNvrAssignments(dev,newQty);
                            updateDevice(dev.id,{qty:newQty,nvrAssignments:trimmed});
                          }}}>−</button>
                        <span style={{fontSize:10,color:'#1e293b',fontWeight:700,minWidth:16,textAlign:'center'}}>{dev.qty||1}</span>
                        <button style={{width:16,height:16,fontSize:12,background:'#F0F5FA',border:'1px solid #E2E8F0',borderRadius:3,
                          color:'#1e293b',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                          onDoubleClick={e=>e.stopPropagation()}
                          onClick={e=>{e.stopPropagation();
                            // Check port availability on connected switch
                            const netDevs=getConnectedNetDevices(dev.id,devices,connections);
                            for(const nd of netDevs){
                              const pu=getPortUsage(nd.id,devices,connections);
                              if(pu.available<=0){showConnToast(`${nd.name}: sem portas livres (${pu.used}/${pu.capacity})`,'warn');return;}
                            }
                            updateDevice(dev.id,{qty:(dev.qty||1)+1})}}>+</button>
                      </div>
                    )}
                    {/* NVR/Switch badges now shown inside doc-card tags */}
                    {targetStatus==='valid'&&<div style={{position:'absolute',top:-6,right:-6,width:18,height:18,
                      borderRadius:'50%',background:'#22c55e',display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:11,color:'#fff',fontWeight:900}}>✓</div>}
                  </div>
                );
              })}

              {/* Carimbo / Legenda profissional */}
              {layers.devices&&(()=>{
                const cw=320,ch=140,cx=2000-cw-20,cy=2000-ch-20;
                const clientName=project.client?.razaoSocial||project.client?.nome||'';
                const floorName=floor?.name||'';
                const dateStr=new Date().toLocaleDateString('pt-BR');
                return <div className="carimbo-canvas" style={{position:'absolute',left:cx,top:cy,width:cw,height:ch,
                  border:'2px solid #E2E8F0',background:'rgba(255,255,255,0.98)',
                  fontFamily:"Inter,system-ui,sans-serif",fontSize:10,color:'#1e293b',zIndex:5,
                  display:'flex',flexDirection:'column',pointerEvents:'none',userSelect:'none'}}>
                  {/* Header */}
                  <div style={{background:'#046BD2',color:'#fff',padding:'4px 8px',fontSize:11,fontWeight:700,
                    display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>PROTECTOR SISTEMAS</span>
                    <span style={{fontSize:8,opacity:.7}}>BIM {APP_VERSION.full}</span>
                  </div>
                  {/* Body */}
                  <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}>
                    <div style={{padding:'3px 8px',borderBottom:'1px solid #cbd5e1',borderRight:'1px solid #cbd5e1'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Projeto</div>
                      <div style={{fontWeight:700,fontSize:10,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{project.name||'—'}</div>
                    </div>
                    <div style={{padding:'3px 8px',borderBottom:'1px solid #cbd5e1'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Cliente</div>
                      <div style={{fontWeight:600,fontSize:9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{clientName||'—'}</div>
                    </div>
                    <div style={{padding:'3px 8px',borderBottom:'1px solid #cbd5e1',borderRight:'1px solid #cbd5e1'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Pavimento</div>
                      <div style={{fontWeight:600,fontSize:10}}>{floorName}</div>
                    </div>
                    <div style={{padding:'3px 8px',borderBottom:'1px solid #cbd5e1'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Data</div>
                      <div style={{fontWeight:600,fontSize:10}}>{dateStr}</div>
                    </div>
                    <div style={{padding:'3px 8px',borderRight:'1px solid #cbd5e1'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Escala</div>
                      <div style={{fontWeight:600,fontSize:10}}>1:{Math.round(40/zoom)}</div>
                    </div>
                    <div style={{padding:'3px 8px'}}>
                      <div style={{fontSize:7,color:'#64748b',textTransform:'uppercase',letterSpacing:.5}}>Resumo</div>
                      <div style={{fontWeight:600,fontSize:9}}>{devices.length} disp · {connections.length} cabos</div>
                    </div>
                  </div>
                </div>;
              })()}

              {/* Dimension annotations (cotas) */}
              {layers.dimensions&&(
                <svg width="2000" height="2000" style={{position:'absolute',top:0,left:0,pointerEvents:'none',zIndex:6}}>
                  {dimensions.map(dim=>{
                    const dx=dim.x2-dim.x1,dy=dim.y2-dim.y1;
                    const dist=Math.sqrt(dx*dx+dy*dy);
                    const meters=(dist/40).toFixed(2); // 40px = 1m
                    const mx=(dim.x1+dim.x2)/2,my=(dim.y1+dim.y2)/2;
                    const angle=Math.atan2(dy,dx)*180/Math.PI;
                    // offset perpendicular for the text
                    const perpX=-dy/dist*12,perpY=dx/dist*12;
                    // extension lines (small lines at endpoints)
                    const extLen=8;
                    const px=-dy/dist,py=dx/dist;
                    return <g key={dim.id}>
                      {/* Main dimension line */}
                      <line x1={dim.x1} y1={dim.y1} x2={dim.x2} y2={dim.y2}
                        stroke="#e74c3c" strokeWidth={1.2} strokeDasharray="4 2"/>
                      {/* Extension lines at endpoints */}
                      <line x1={dim.x1+px*extLen} y1={dim.y1+py*extLen} x2={dim.x1-px*extLen} y2={dim.y1-py*extLen}
                        stroke="#e74c3c" strokeWidth={1}/>
                      <line x1={dim.x2+px*extLen} y1={dim.y2+py*extLen} x2={dim.x2-px*extLen} y2={dim.y2-py*extLen}
                        stroke="#e74c3c" strokeWidth={1}/>
                      {/* Arrow heads */}
                      <circle cx={dim.x1} cy={dim.y1} r={3} fill="#e74c3c"/>
                      <circle cx={dim.x2} cy={dim.y2} r={3} fill="#e74c3c"/>
                      {/* Distance label */}
                      <text x={mx+perpX} y={my+perpY} textAnchor="middle" dominantBaseline="middle"
                        style={{fontSize:11,fontWeight:700,fill:'#e74c3c',fontFamily:'system-ui',
                          paintOrder:'stroke',stroke:'#fff',strokeWidth:3,strokeLinejoin:'round'}}>
                        {meters}m
                      </text>
                      {/* Delete button (visible in select mode) */}
                      {tool==='select'&&(
                        <circle cx={dim.x2+px*16} cy={dim.y2+py*16} r={7}
                          fill="#ef4444" stroke="#fff" strokeWidth={1.5}
                          style={{cursor:'pointer',pointerEvents:'auto'}}
                          onClick={(e)=>{e.stopPropagation();
                            updateFloor(f=>({...f,dimensions:(f.dimensions||[]).filter(d=>d.id!==dim.id)}));
                          }}/>
                      )}
                      {tool==='select'&&(
                        <text x={dim.x2+px*16} y={dim.y2+py*16} textAnchor="middle" dominantBaseline="central"
                          style={{fontSize:8,fill:'#fff',fontWeight:900,pointerEvents:'none'}}>✕</text>
                      )}
                    </g>;
                  })}
                  {/* Preview line while measuring (first point placed) */}
                  {measureStart&&(
                    <circle cx={measureStart.x} cy={measureStart.y} r={5} fill="#e74c3c" opacity={0.7}>
                      <animate attributeName="r" values="5;8;5" dur="1s" repeatCount="indefinite"/>
                    </circle>
                  )}
                  {/* Calibration preview: purple dots + dashed line */}
                  {tool==='calibrate'&&calibStart&&(
                    <>
                      <circle cx={calibStart.x} cy={calibStart.y} r={6} fill="#8e44ad" opacity={0.8}>
                        <animate attributeName="r" values="6;10;6" dur="1.2s" repeatCount="indefinite"/>
                      </circle>
                      {calibEnd&&(
                        <>
                          <line x1={calibStart.x} y1={calibStart.y} x2={calibEnd.x} y2={calibEnd.y}
                            stroke="#8e44ad" strokeWidth={2} strokeDasharray="6 3" opacity={0.7}/>
                          <circle cx={calibEnd.x} cy={calibEnd.y} r={6} fill="#8e44ad" opacity={0.8}>
                            <animate attributeName="r" values="6;10;6" dur="1.2s" repeatCount="indefinite"/>
                          </circle>
                        </>
                      )}
                    </>
                  )}
                </svg>
              )}

              {/* Camera FOV overlay */}
              <CameraFovOverlay devices={devices} show={layers.fov} heatmap={layers.heatmap}
                updateDevice={updateDevice} zoom={zoom} pan={pan} canvasRef={canvasRef}/>

              {/* Smart guides */}
              {guides.length>0&&(
                <svg width="4000" height="4000" style={{position:'absolute',top:0,left:0,pointerEvents:'none',zIndex:9}}>
                  {guides.map((g,i)=>(
                    <line key={i} x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
                      stroke="#ff00ff" strokeWidth={1} strokeDasharray="4 2" opacity={0.8}/>
                  ))}
                </svg>
              )}

              {/* Comment pins on canvas */}
              {comments.map(c=>!c.resolved&&(
                <div key={'cpin_'+c.id} style={{position:'absolute',left:c.x-8,top:c.y-8,width:16,height:16,
                  borderRadius:'50%',background:'#046BD2',border:'2px solid #fff',boxShadow:'0 1px 4px rgba(0,0,0,.3)',
                  cursor:'pointer',zIndex:7,display:'flex',alignItems:'center',justifyContent:'center',
                  fontSize:8,color:'#fff',fontWeight:700}}
                  title={c.text}
                  onClick={(e)=>{e.stopPropagation();setRightTab('comments');}}>
                  💬
                </div>
              ))}

              {/* Lasso selection rectangle */}
              {selectionRect&&(()=>{
                const x=Math.min(selectionRect.startX,selectionRect.x);
                const y=Math.min(selectionRect.startY,selectionRect.y);
                const w=Math.abs(selectionRect.x-selectionRect.startX);
                const h=Math.abs(selectionRect.y-selectionRect.startY);
                return <div style={{position:'absolute',left:x,top:y,width:w,height:h,
                  border:'1.5px dashed #3498db',background:'rgba(52,152,219,0.08)',
                  pointerEvents:'none',zIndex:100,borderRadius:2}}/>;
              })()}
            </div>
          </div>

          {/* Multi-select info badge */}
          {multiSelect.size>1&&(
            <div style={{position:'absolute',bottom:10,left:'50%',transform:'translateX(-50%)',
              background:'#3498db',color:'#fff',padding:'6px 16px',borderRadius:20,
              fontSize:11,fontWeight:600,boxShadow:'0 2px 8px rgba(0,0,0,.3)',zIndex:50,
              display:'flex',alignItems:'center',gap:8}}>
              <span>{multiSelect.size} dispositivos selecionados</span>
              <span style={{fontSize:9,opacity:.8}}>Arraste para mover grupo</span>
              <button onClick={()=>setMultiSelect(new Set())}
                style={{background:'rgba(255,255,255,.25)',border:'none',color:'#fff',
                  padding:'2px 6px',borderRadius:10,cursor:'pointer',fontSize:10}}>✕</button>
            </div>
          )}

          {/* Port connection popup */}
          {portPopup&&(()=>{
            const ppDev=devices.find(d=>d.id===portPopup.devId);
            if(!ppDev) return null;
            const ifaces=getDeviceInterfaces(ppDev);
            if(!ifaces.length) return null;
            // Check which ports are already in use
            const usedPorts=connections.filter(c=>c.from===ppDev.id||c.to===ppDev.id);
            const getPortUsage=(iface)=>{
              return usedPorts.filter(c=>c.ifaceType===iface.type).length;
            };
            const totalUsed=usedPorts.length;
            const totalPorts=ifaces.length;
            return (
              <>
                <div className="port-popup-overlay" onClick={()=>setPortPopup(null)}/>
                <div className="port-popup" style={{left:portPopup.x,top:portPopup.y,position:'fixed',maxHeight:'calc(100vh - 24px)',overflowY:'auto'}}>
                  <div className="pp-title">⚡ Portas — {ppDev.name}
                    <span style={{fontSize:10,fontWeight:400,marginLeft:8,color:totalUsed>0?'#f59e0b':'#6b7280'}}>
                      ({totalUsed}/{totalPorts} em uso)
                    </span>
                  </div>
                  {ifaces.map((iface,i)=>{
                    const usage=getPortUsage(iface);
                    const isUsed=usage>0;
                    const connectedTo=isUsed?usedPorts.filter(c=>c.ifaceType===iface.type).map(c=>{
                      const otherId=c.from===ppDev.id?c.to:c.from;
                      const otherDev=devices.find(d=>d.id===otherId);
                      return otherDev?.name||'?';
                    }).join(', '):'';
                    return (
                    <button key={i} className="port-btn" style={{opacity:isUsed?0.6:1,position:'relative'}} onClick={()=>{
                      try{
                        setCableMode({from:ppDev.id,ifaceType:iface.type||'data_io',ifaceLabel:iface.label||''});
                        setTool('cable');
                        setPortPopup(null);
                      }catch(err){console.error('Port select error',err);setPortPopup(null)}
                    }}>
                      <div className={`pb-dot ${getPortDotClass(iface.type)}`} style={isUsed?{boxShadow:'0 0 0 2px #f59e0b'}:{}}/>
                      <div className="pb-info">
                        <div className="pb-label">{iface.label}
                          {isUsed&&<span style={{marginLeft:6,fontSize:9,color:'#f59e0b',fontWeight:700}}>✓ CONECTADA → {connectedTo}</span>}
                        </div>
                        <div className="pb-type">{getPortTypeName(iface.type)} · {iface.cables?.map(c=>CABLE_TYPES.find(ct=>ct.id===c)?.name||c).join(', ')}</div>
                      </div>
                      {isUsed?<span style={{fontSize:9,color:'#f59e0b',fontWeight:700,flexShrink:0}}>EM USO</span>:
                       iface.required?<span className="pb-req">OBRIG.</span>:<span className="pb-opt">disponível</span>}
                    </button>);
                  })}
                  {/* Cross-floor connection button */}
                  {project.floors.length>1&&(
                    <button className="port-btn" style={{borderTop:'2px solid #E2E8F0',marginTop:4,background:'#f0f9ff'}}
                      onClick={()=>{
                        setCrossFloorModal({deviceId:ppDev.id});
                        setPortPopup(null);
                      }}>
                      <div style={{width:16,height:16,borderRadius:'50%',background:'#046BD2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        <Layers size={10} color="#fff"/>
                      </div>
                      <div className="pb-info">
                        <div className="pb-label" style={{color:'#046BD2',fontWeight:700}}>Conectar a outro Pavimento</div>
                        <div className="pb-type">Criar conexão entre pisos diferentes</div>
                      </div>
                      <span style={{fontSize:9,color:'#046BD2',fontWeight:700,flexShrink:0}}>CROSS-FLOOR</span>
                    </button>
                  )}
                </div>
              </>
            );
          })()}

          {/* Empty state */}
          {devices.length===0&&(
            <div className="canvas-hint">
              <div className="ch-icon">📐</div>
              <p>Arraste um dispositivo da paleta para cá</p>
              <div className="ch-sub">Ou clique no dispositivo e depois clique aqui</div>
            </div>
          )}

          {/* Pending device indicator */}
          {pendingDevice&&tool==='device'&&(
            <div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
              background:'var(--laranja)',color:'#000',padding:'6px 16px',borderRadius:20,
              fontSize:11,fontWeight:700,zIndex:20}}>
              Clique no canvas para posicionar: {findDevDef(pendingDevice)?.name}
              <span style={{marginLeft:8,opacity:.6}}>ESC para cancelar</span>
            </div>
          )}

          {/* Cable mode indicator */}
          {cableMode&&(
            <div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
              background:'#3b82f6',color:'#fff',padding:'6px 16px',borderRadius:20,
              fontSize:11,fontWeight:700,zIndex:20}}>
              🔗 {cableMode.ifaceLabel?<span style={{color:'#fde68a'}}>{cableMode.ifaceLabel.split('(')[0].trim()}</span>:null}
              {cableMode.ifaceLabel?' → ':''}Clique num dispositivo <span style={{color:'#bbf7d0'}}>verde</span> para conectar
              <span style={{marginLeft:8,opacity:.6}}>ESC para cancelar</span>
            </div>
          )}

          {/* Selected connection indicator */}
          {selectedConn&&!cableMode&&(()=>{
            const sc=connections.find(c=>c.id===selectedConn);
            if(!sc) return null;
            const sct=CABLE_TYPES.find(c=>c.id===sc.type);
            const wpCount=sc.waypoints?.length||0;
            return <div style={{position:'absolute',top:8,left:'50%',transform:'translateX(-50%)',
              background:'#1e40af',color:'#fff',padding:'6px 16px',borderRadius:20,
              fontSize:11,fontWeight:700,zIndex:20,display:'flex',gap:12,alignItems:'center'}}>
              <span>🔧 {sct?.name||sc.type} selecionado</span>
              <span style={{opacity:.7}}>Arraste segmentos ═ para mover</span>
              <span style={{opacity:.7}}>Arraste ■ nos pontos de dobra</span>
              <span style={{opacity:.7}}>Dbl-clique ■ = remover ponto</span>
              {wpCount>0&&<span style={{color:'#fde68a'}}>{wpCount} ponto{wpCount>1?'s':''}</span>}
              <span style={{opacity:.5}}>DEL = {wpCount>0?'resetar rota':'excluir cabo'}</span>
            </div>;
          })()}

          {/* Connection toast */}
          {connToast&&(
            <div style={{position:'absolute',bottom:48,left:'50%',transform:'translateX(-50%)',
              background:connToast.type==='error'?'#dc2626':connToast.type==='warn'?'#d97706':connToast.type==='info'?'#2563eb':'#16a34a',
              color:'#fff',padding:'8px 20px',borderRadius:8,fontSize:11,fontWeight:600,zIndex:30,
              boxShadow:'0 4px 20px rgba(0,0,0,.3)',maxWidth:'min(480px, calc(100vw - 32px))',textAlign:'center',
              animation:'fadeIn .2s'}}>
              {connToast.msg}
            </div>
          )}

          {/* Cable picker modal */}
          {cablePicker&&(
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
              background:'#fff',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,.25)',padding:20,
              zIndex:40,minWidth:'min(320px, calc(100vw - 32px))',maxWidth:'min(420px, calc(100vw - 32px))'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--azul)',marginBottom:4}}>
                Cabo Incompatível
              </div>
              <div style={{fontSize:11,color:'var(--cinza)',marginBottom:12,lineHeight:1.5}}>
                {cablePicker.reason}
              </div>
              <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                letterSpacing:.5,marginBottom:8}}>Cabos compatíveis:</div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {cablePicker.cables.map(cabId=>{
                  const ct=CABLE_TYPES.find(c=>c.id===cabId);
                  return (
                    <button key={cabId} onClick={()=>confirmCablePick(cabId)}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',
                        border:'1px solid #e5e7eb',borderRadius:8,background:'#fafafa',
                        cursor:'pointer',transition:'.15s',fontSize:11,textAlign:'left'}}
                      onMouseOver={e=>e.currentTarget.style.background='#EBF5FB'}
                      onMouseOut={e=>e.currentTarget.style.background='#fafafa'}>
                      <span style={{width:10,height:10,borderRadius:'50%',background:ct?.color,flexShrink:0}}/>
                      <span style={{flex:1,fontWeight:600}}>{ct?.name}</span>
                      <span style={{color:'var(--cinza)',fontSize:9}}>{ct?.speed} · max {ct?.maxLen}m</span>
                      <span style={{color:'var(--cinza)',fontSize:9}}>
                        {ct?.group==='power'?'⚡ Energia':ct?.group==='signal'?'📡 Sinal':'🌐 Dados'}
                      </span>
                    </button>
                  );
                })}
              </div>
              <button onClick={()=>setCablePicker(null)}
                style={{marginTop:12,width:'100%',padding:'6px',border:'1px solid #e5e7eb',
                  borderRadius:6,background:'transparent',color:'var(--cinza)',fontSize:10,cursor:'pointer'}}>
                Cancelar
              </button>
            </div>
          )}

          {/* Panel toggle buttons on canvas edges */}
          {!leftPanelOpen&&(
            <button onClick={toggleLeftPanel}
              style={{position:'absolute',left:8,top:'50%',transform:'translateY(-50%)',zIndex:25,
                width:24,height:48,background:'var(--branco)',border:'1px solid var(--cinzaM)',
                borderRadius:'0 8px 8px 0',cursor:'pointer',display:'flex',alignItems:'center',
                justifyContent:'center',boxShadow:'2px 0 8px rgba(0,0,0,.1)',fontSize:12,color:'var(--cinza)'}}>
              »
            </button>
          )}
          {!rightPanelOpen&&(
            <button onClick={toggleRightPanel}
              style={{position:'absolute',right:8,top:'50%',transform:'translateY(-50%)',zIndex:25,
                width:24,height:48,background:'var(--branco)',border:'1px solid var(--cinzaM)',
                borderRadius:'8px 0 0 8px',cursor:'pointer',display:'flex',alignItems:'center',
                justifyContent:'center',boxShadow:'-2px 0 8px rgba(0,0,0,.1)',fontSize:12,color:'var(--cinza)'}}>
              «
            </button>
          )}

          {/* Zoom controls */}
          <div className="canvas-controls">
            <button onClick={()=>setZoom(z=>Math.min(3,z+0.2))} title="Zoom +">+</button>
            <button onClick={()=>setZoom(z=>Math.max(0.3,z-0.2))} title="Zoom −">−</button>
            <button onClick={()=>{setZoom(1);setPan({x:0,y:0})}} title="Resetar vista">⟳</button>
          </div>
          <div className="scale-indicator">Zoom: {Math.round(zoom*100)}%</div>

          {/* Minimap */}
          {(()=>{
            const mmW=160,mmH=160,canvasW=2000,canvasH=2000;
            const sc=mmW/canvasW;
            const rect=canvasRef.current?.getBoundingClientRect();
            const vpW=rect?(rect.width/zoom)*sc:mmW;
            const vpH=rect?(rect.height/zoom)*sc:mmH;
            const vpX=(-pan.x/zoom)*sc;
            const vpY=(-pan.y/zoom)*sc;
            return (
              <div className="minimap" onMouseDown={(e)=>{
                e.stopPropagation();
                const r=e.currentTarget.getBoundingClientRect();
                const mx=(e.clientX-r.left)/sc, my=(e.clientY-r.top)/sc;
                const vw=rect?rect.width/zoom:canvasW, vh=rect?rect.height/zoom:canvasH;
                setPan({x:-(mx-vw/2)*zoom,y:-(my-vh/2)*zoom});
              }}>
                <svg width={mmW} height={mmH} style={{display:'block'}}>
                  {/* Background */}
                  <rect width={mmW} height={mmH} fill="#f8fafc" rx="4"/>
                  {/* Grid hint */}
                  <rect width={mmW} height={mmH} fill="none" stroke="#E2E8F0" strokeWidth=".5"/>
                  {/* Connections */}
                  {connections.map(conn=>{
                    const fd=devices.find(d=>d.id===conn.from),td=devices.find(d=>d.id===conn.to);
                    if(!fd||!td) return null;
                    const ct=CABLE_TYPES.find(c=>c.id===conn.type);
                    const fr=getDevR(fd),tr=getDevR(td);
                    let fx=fd.x+fr,fy=fd.y+fr,tx=td.x+tr,ty=td.y+tr;
                    if(fd.quadroId){const q=quadros.find(q=>q.id===fd.quadroId);if(q){fx=q.x+80;fy=q.y+14}}
                    if(td.quadroId){const q=quadros.find(q=>q.id===td.quadroId);if(q){tx=q.x+80;ty=q.y+14}}
                    return <line key={'mm_c_'+conn.id} x1={fx*sc} y1={fy*sc}
                      x2={tx*sc} y2={ty*sc} stroke={ct?.color||'#475569'} strokeWidth=".5" opacity=".6"/>;
                  })}
                  {/* Devices as dots (hide devices inside Quadro) */}
                  {devices.filter(d=>!d.quadroId).map(d=>{
                    const dr=getDevR(d);
                    return <circle key={'mm_d_'+d.id} cx={(d.x+dr)*sc} cy={(d.y+dr)*sc}
                      r={dr<20?1.5:dr<25?2:2.5}
                      fill={d.id===selectedDevice?'#f59e0b':multiSelect.has(d.id)?'#8b5cf6':'#3b82f6'}/>;
                  })}
                  {/* Viewport rectangle */}
                  <rect x={Math.max(0,vpX)} y={Math.max(0,vpY)}
                    width={Math.min(vpW,mmW)} height={Math.min(vpH,mmH)}
                    fill="none" stroke="#f59e0b" strokeWidth="1.5" rx="2" opacity=".8"/>
                </svg>
              </div>
            );
          })()}
        </div>

        {/* Search overlay */}
        <CanvasSearch devices={devices} show={showSearch}
          onClose={()=>{setShowSearch(false);setSearchHighlight(null)}}
          onHighlight={setSearchHighlight}
          onFocus={(d)=>{
            const el=document.querySelector('.canvas-viewport');
            if(el){el.scrollLeft=d.x-el.clientWidth/2;el.scrollTop=d.y-el.clientHeight/2;}
          }}
          onSelect={(id)=>{setSelectedDevice(id);setRightTab('props')}}/>

        {/* Context menu */}
        {contextMenu&&(
          <CanvasContextMenu x={contextMenu.x} y={contextMenu.y}
            target={contextMenu.target}
            multiSelectCount={multiSelect.size}
            hasClipboard={!!clipboard}
            onClose={()=>setContextMenu(null)}
            onCopy={()=>{copySelected();setContextMenu(null)}}
            onPaste={(x,y)=>{pasteClipboard(x,y);setContextMenu(null)}}
            onDuplicate={()=>{duplicateSelected();setContextMenu(null)}}
            onDelete={()=>{
              if(multiSelect.size>0){multiSelect.forEach(id=>deleteDevice(id));setMultiSelect(new Set())}
              else if(contextMenu.target) deleteDevice(contextMenu.target.id);
              setContextMenu(null);
            }}
            onSelectAll={()=>{setMultiSelect(new Set(devices.map(d=>d.id)));setContextMenu(null)}}
            onSelectByType={(key)=>{selectByType(key);setContextMenu(null)}}
            onAlignLeft={()=>{alignDevices('left');setContextMenu(null)}}
            onAlignCenterH={()=>{alignDevices('centerH');setContextMenu(null)}}
            onAlignRight={()=>{alignDevices('right');setContextMenu(null)}}
            onAlignTop={()=>{alignDevices('top');setContextMenu(null)}}
            onAlignCenterV={()=>{alignDevices('centerV');setContextMenu(null)}}
            onAlignBottom={()=>{alignDevices('bottom');setContextMenu(null)}}
            onDistributeH={()=>{distributeDevices('h');setContextMenu(null)}}
            onDistributeV={()=>{distributeDevices('v');setContextMenu(null)}}
            onSpread={()=>{spreadDevices();setContextMenu(null)}}
          />
        )}

        {/* RIGHT PANEL */}
        <div className={`right-panel ${!rightPanelOpen?(isSmallScreen?'responsive-collapsed':'collapsed'):''}`}>
          <div className="rp-tabs">
            <div className={`rp-tab ${rightTab==='props'?'active':''}`} onClick={()=>setRightTab('props')}
              title={selectedDev?'Propriedades':'Informações'}>
              <SlidersHorizontal size={15} strokeWidth={2}/>
              <span>{selectedDev?'Props':'Info'}</span>
            </div>
            <div className={`rp-tab ${rightTab==='rack'?'active':''}`} onClick={()=>setRightTab('rack')}
              title="Racks">
              <Server size={15} strokeWidth={2}/>
              <span>Rack</span>
              {racks.length>0&&<span className="rp-badge">{racks.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='quadro'?'active':''}`} onClick={()=>setRightTab('quadro')}
              title="Quadros de Conectividade">
              <LayoutGrid size={15} strokeWidth={2}/>
              <span>Quadro</span>
              {quadros.length>0&&<span className="rp-badge rp-badge-green">{quadros.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='topology'?'active':''}`} onClick={()=>setRightTab('topology')}
              title="Topologia de Rede">
              <GitBranch size={15} strokeWidth={2}/>
              <span>Topo</span>
            </div>
            <div className={`rp-tab ${rightTab==='equipment'?'active':''}`} onClick={()=>setRightTab('equipment')}
              title="Lista de Materiais">
              <ClipboardList size={15} strokeWidth={2}/>
              <span>Materiais</span>
            </div>
            <div className={`rp-tab ${rightTab==='validation'?'active':''}`} onClick={()=>setRightTab('validation')}
              title="Validação do Projeto">
              <ShieldCheck size={15} strokeWidth={2}/>
              <span>Válid.</span>
              {validations.length>0&&<span className="rp-badge rp-badge-red">{validations.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='unifilar'?'active':''}`} onClick={()=>setRightTab('unifilar')}
              title="Diagrama Unifilar">
              <Zap size={15} strokeWidth={2}/>
              <span>Unifilar</span>
            </div>
            <div className={`rp-tab ${rightTab==='devlist'?'active':''}`} onClick={()=>setRightTab('devlist')}
              title="Lista de Dispositivos">
              <List size={15} strokeWidth={2}/>
              <span>Lista</span>
              {devices.length>0&&<span className="rp-badge">{devices.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='comments'?'active':''}`} onClick={()=>setRightTab('comments')}
              title="Comentários">
              <MessageCircle size={15} strokeWidth={2}/>
              <span>Notas</span>
              {comments.filter(c=>!c.resolved).length>0&&<span className="rp-badge">{comments.filter(c=>!c.resolved).length}</span>}
            </div>
            <div className="rp-tab rp-tab-close" onClick={toggleRightPanel} title="Esconder painel">
              <PanelRightClose size={15} strokeWidth={2}/>
            </div>
          </div>
          <div className="rp-content">
            {/* RACK PANEL */}
            {rightTab==='rack'&&(
              <RackPanel racks={racks} devices={devices} selectedRackId={selectedRackId}
                onSelectRack={setSelectedRackId} onCreateRack={()=>addRack()}
                onUpdateRack={updateRack} onDeleteRack={deleteRack}
                onAssignDevice={assignDeviceToRackAction} onUnassignDevice={unassignDeviceFromRack}
                onSelectDevice={(id)=>{setSelectedDevice(id);setRightTab('props')}}/>
            )}
            {/* QUADRO DE CONECTIVIDADE PANEL */}
            {rightTab==='quadro'&&(
              <div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#166534'}}>📦 Quadros de Conectividade</div>
                  <button onClick={()=>addQuadro()} style={{padding:'4px 10px',border:'1px solid #16a34a',
                    background:'#f0fdf4',color:'#166534',borderRadius:6,fontSize:10,cursor:'pointer',fontWeight:700}}>
                    + Novo QC
                  </button>
                </div>
                {quadros.length===0&&(
                  <div style={{textAlign:'center',padding:'30px 16px',color:'#86efac'}}>
                    <div style={{fontSize:28,opacity:.4,marginBottom:8}}>📦</div>
                    <p style={{fontSize:11,color:'#64748b'}}>Nenhum quadro criado</p>
                    <p style={{fontSize:9,color:'#94a3b8',marginTop:4}}>Clique "+ Novo QC" para adicionar</p>
                  </div>
                )}
                {/* Quadro list */}
                {quadros.map(qc=>{
                  const qcDevices=devices.filter(d=>d.quadroId===qc.id);
                  const isSel=selectedQuadroId===qc.id;
                  return (
                    <div key={qc.id} style={{border:`1.5px solid ${isSel?'#16a34a':'#e5e7eb'}`,borderRadius:8,
                      marginBottom:8,background:isSel?'#f0fdf4':'#fff',cursor:'pointer',overflow:'hidden'}}
                      onClick={()=>setSelectedQuadroId(isSel?null:qc.id)}>
                      <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',
                        borderBottom:isSel?'1px solid #dcfce7':'none'}}>
                        <span style={{fontSize:14}}>📦</span>
                        <div style={{flex:1}}>
                          <div style={{fontSize:11,fontWeight:700,color:'#166534'}}>{qc.tag}</div>
                          <div style={{fontSize:9,color:'#64748b'}}>{qc.name} · {qcDevices.length} dispositivos</div>
                        </div>
                        <span style={{fontSize:8,fontWeight:600,color:'#fff',background:'#16a34a',
                          padding:'2px 6px',borderRadius:4}}>{qc.caixa}</span>
                      </div>
                      {/* Expanded details when selected */}
                      {isSel&&(
                        <div style={{padding:'8px 10px'}} onClick={e=>e.stopPropagation()}>
                          {/* Name */}
                          <div className="prop-row">
                            <span className="pr-label" style={{fontSize:9}}>Nome:</span>
                            <span className="pr-value">
                              <input value={qc.name} style={{fontSize:10}} onChange={e=>updateQuadro(qc.id,{name:e.target.value})}/>
                            </span>
                          </div>
                          {/* Caixa */}
                          <div className="prop-row">
                            <span className="pr-label" style={{fontSize:9}}>Caixa (cm):</span>
                            <span className="pr-value">
                              <select value={qc.caixa||'50x40x20'} style={{fontSize:10}}
                                onChange={e=>updateQuadro(qc.id,{caixa:e.target.value})}>
                                <option value="30x30x15">30×30×15</option>
                                <option value="40x30x20">40×30×20</option>
                                <option value="50x40x20">50×40×20</option>
                                <option value="60x50x25">60×50×25</option>
                                <option value="80x60x25">80×60×25</option>
                              </select>
                            </span>
                          </div>
                          {/* Aterramento */}
                          <div className="prop-row">
                            <span className="pr-label" style={{fontSize:9}}>Aterramento:</span>
                            <span className="pr-value">
                              <select value={qc.aterramento||'individual'} style={{fontSize:10}}
                                onChange={e=>updateQuadro(qc.id,{aterramento:e.target.value})}>
                                <option value="individual">Individual (haste própria)</option>
                                <option value="edificacao">Edificação (barramento geral)</option>
                                <option value="nenhum">Nenhum</option>
                              </select>
                            </span>
                          </div>
                          {/* Disjuntor */}
                          <div className="prop-row">
                            <span className="pr-label" style={{fontSize:9}}>Disjuntor:</span>
                            <span className="pr-value" style={{display:'flex',gap:4}}>
                              <select value={qc.disjuntor?.tipo||'bipolar'} style={{fontSize:10,flex:1}}
                                onChange={e=>updateQuadro(qc.id,{disjuntor:{...qc.disjuntor,tipo:e.target.value}})}>
                                <option value="unipolar">Unipolar</option>
                                <option value="bipolar">Bipolar</option>
                                <option value="tripolar">Tripolar</option>
                              </select>
                              <select value={qc.disjuntor?.amperagem||16} style={{fontSize:10,width:60}}
                                onChange={e=>updateQuadro(qc.id,{disjuntor:{...qc.disjuntor,amperagem:parseInt(e.target.value)}})}>
                                {[6,10,16,20,25,32,40].map(a=><option key={a} value={a}>{a}A</option>)}
                              </select>
                            </span>
                          </div>
                          {/* Prensa-cabo */}
                          <div className="prop-row">
                            <span className="pr-label" style={{fontSize:9}}>Prensa-cabo:</span>
                            <span className="pr-value">
                              <input type="number" min="0" max="30" value={qc.prensaCabo||0} style={{width:50,fontSize:10}}
                                onChange={e=>updateQuadro(qc.id,{prensaCabo:parseInt(e.target.value)||0})}/>
                            </span>
                          </div>

                          {/* Assigned devices */}
                          <div style={{fontSize:9,fontWeight:700,color:'#64748b',textTransform:'uppercase',
                            letterSpacing:.5,marginTop:10,marginBottom:4}}>
                            Dispositivos ({qcDevices.length})
                          </div>
                          {qcDevices.length>0?qcDevices.map(d=>{
                            const catColor=DEVICE_LIB.find(c=>c.items.some(it=>it.key===d.key))?.color||'#6b7280';
                            return (
                              <div key={d.id} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',
                                fontSize:9,borderBottom:'1px solid #f0f0f0'}}>
                                <span style={{width:6,height:6,borderRadius:'50%',background:catColor,flexShrink:0}}/>
                                <span style={{flex:1,cursor:'pointer',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}
                                  onClick={(e)=>{e.stopPropagation();setSelectedDevice(d.id);setRightTab('props')}}>
                                  {d.name}
                                </span>
                                <span style={{fontSize:8,color:'#ef4444',cursor:'pointer',fontWeight:700}}
                                  onClick={(e)=>{e.stopPropagation();unassignDeviceFromQuadro(d.id)}}>✕</span>
                              </div>
                            );
                          }):(
                            <div style={{fontSize:9,color:'#94a3b8',padding:'6px 0',textAlign:'center'}}>
                              Nenhum dispositivo atribuído
                            </div>
                          )}

                          {/* Quick-assign: show mountable unassigned devices */}
                          {(()=>{
                            const unassigned=devices.filter(d=>!d.quadroId&&!d.parentRack&&canMountInQuadro(d.key));
                            if(!unassigned.length) return null;
                            return (
                              <div style={{marginTop:6}}>
                                <select style={{width:'100%',fontSize:9,padding:'3px 4px',borderRadius:4,border:'1px solid #d1d5db'}}
                                  value="" onChange={e=>{if(e.target.value) assignDeviceToQuadro(e.target.value,qc.id)}}>
                                  <option value="">+ Atribuir dispositivo...</option>
                                  {unassigned.map(d=><option key={d.id} value={d.id}>{d.name} ({d.key})</option>)}
                                </select>
                              </div>
                            );
                          })()}

                          {/* BOM Preview */}
                          <div style={{fontSize:9,fontWeight:700,color:'#64748b',textTransform:'uppercase',
                            letterSpacing:.5,marginTop:10,marginBottom:4}}>
                            BOM Automático
                          </div>
                          {getQuadroBom(qc).map((item,i)=>(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:9,
                              padding:'2px 0',borderBottom:'1px solid #f8fafc',color:'#334155'}}>
                              <span>{item.name}</span>
                              <span style={{fontWeight:700,color:'#16a34a'}}>{item.qty}×</span>
                            </div>
                          ))}

                          {/* Actions */}
                          <div style={{display:'flex',gap:6,marginTop:10}}>
                            <button onClick={(e)=>{e.stopPropagation();deleteQuadro(qc.id)}}
                              style={{flex:1,padding:'5px 8px',fontSize:9,fontWeight:600,background:'#fef2f2',
                                color:'#ef4444',border:'1px solid #fecaca',borderRadius:4,cursor:'pointer'}}>
                              🗑️ Excluir
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* PROPERTIES */}
            {rightTab==='props'&&selectedDev&&(
              <DevicePropertiesPanel
                dev={selectedDev}
                devices={devices} connections={connections} racks={racks} quadros={quadros}
                allRacks={project.floors.flatMap(f=>(f.racks||[]).map(r=>({...r,floorName:f.name,floorId:f.id})))}
                iconSize={iconSize} updateDevice={updateDevice}
                deleteConnection={deleteConnection} copyDevice={copyDevice} deleteDevice={deleteDevice}
                setSelectedDevice={setSelectedDevice} setRightTab={setRightTab}
                setCableMode={setCableMode} setTool={setTool}
                showConnToast={showConnToast}
                assignDeviceToRackAction={assignDeviceToRackAction}
                unassignDeviceFromRack={unassignDeviceFromRack}
                assignDeviceToQuadro={assignDeviceToQuadro}
                unassignDeviceFromQuadro={unassignDeviceFromQuadro}
                crossFloorConnections={crossFloorConns}
                project={project}
                setCrossFloorModal={setCrossFloorModal}
              />
            )}
            {rightTab==='props'&&!selectedDev&&!selectedConn&&(
              <div style={{textAlign:'center',padding:'40px 20px',color:'var(--cinza)'}}>
                <div style={{fontSize:32,opacity:.3,marginBottom:12}}>🖱️</div>
                <p style={{fontSize:12}}>Selecione um dispositivo ou cabo para ver propriedades</p>
                <p style={{fontSize:10,opacity:.5,marginTop:4}}>Ou adicione dispositivos da paleta</p>
              </div>
            )}
            {rightTab==='props'&&!selectedDev&&selectedConn&&(()=>{
              const conn=connections.find(c=>c.id===selectedConn);
              if(conn){
                const ct=CABLE_TYPES.find(c=>c.id===conn.type);
                const fromDev=devices.find(d=>d.id===conn.from);
                const toDev=devices.find(d=>d.id===conn.to);
                return <CablePropertiesPanel conn={conn} cableType={ct}
                  fromDev={fromDev} toDev={toDev}
                  updateConnection={updateConnection}
                  onDelete={()=>deleteConnection(conn.id)}
                  onClose={()=>setSelectedConn(null)}/>;
              }
              // Cross-floor connection selected
              const xfConn=crossFloorConns.find(c=>c.id===selectedConn);
              if(xfConn){
                const ct=CABLE_TYPES.find(c=>c.id===xfConn.type);
                const fromFloor=project.floors.find(f=>f.id===xfConn.fromFloorId);
                const toFloor=project.floors.find(f=>f.id===xfConn.toFloorId);
                const fromDev=fromFloor?.devices?.find(d=>d.id===xfConn.fromDeviceId);
                const toDev=toFloor?.devices?.find(d=>d.id===xfConn.toDeviceId);
                return <div style={{padding:16}}>
                  <div style={{fontSize:13,fontWeight:700,color:'#6d28d9',marginBottom:12,display:'flex',alignItems:'center',gap:6}}>
                    <Layers size={16}/> Conexão Cross-Floor
                  </div>
                  <div style={{background:'#f5f3ff',borderRadius:8,padding:12,marginBottom:8}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>De:</div>
                    <div style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{fromDev?.name||'?'} <span style={{fontSize:10,color:'#8b5cf6'}}>({fromFloor?.name})</span></div>
                  </div>
                  <div style={{background:'#f5f3ff',borderRadius:8,padding:12,marginBottom:8}}>
                    <div style={{fontSize:11,color:'#64748b',marginBottom:4}}>Para:</div>
                    <div style={{fontSize:12,fontWeight:600,color:'#1e293b'}}>{toDev?.name||'?'} <span style={{fontSize:10,color:'#8b5cf6'}}>({toFloor?.name})</span></div>
                  </div>
                  <div style={{display:'flex',gap:12,marginBottom:8}}>
                    <div><span style={{fontSize:10,color:'#64748b'}}>Cabo:</span><br/><span style={{fontSize:12,fontWeight:600}}>{ct?.name||xfConn.type}</span></div>
                    <div><span style={{fontSize:10,color:'#64748b'}}>Distância:</span><br/><span style={{fontSize:12,fontWeight:600}}>{xfConn.distance}m</span></div>
                    <div><span style={{fontSize:10,color:'#64748b'}}>Finalidade:</span><br/><span style={{fontSize:12,fontWeight:600}}>{xfConn.purpose||'dados'}</span></div>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:12}}>
                    <button onClick={()=>deleteConnection(xfConn.id)} style={{flex:1,padding:'6px 12px',borderRadius:6,border:'1px solid #fecaca',background:'#fef2f2',color:'#dc2626',fontSize:11,fontWeight:600,cursor:'pointer'}}>Excluir</button>
                    <button onClick={()=>setSelectedConn(null)} style={{padding:'6px 12px',borderRadius:6,border:'1px solid #E2E8F0',background:'#fff',color:'#64748b',fontSize:11,cursor:'pointer'}}>Fechar</button>
                  </div>
                </div>;
              }
              return null;
            })()}

            {/* TOPOLOGY */}
            {rightTab==='topology'&&(
              <TopologyPanel topology={topology} devices={devices} floorName={floor?.name}
                setSelectedDevice={setSelectedDevice} setRightTab={setRightTab}/>
            )}

            {/* EQUIPMENT LIST */}
            {rightTab==='equipment'&&(
              <EquipmentPanel bom={bom} allDevices={allDevices} connections={connections} projectName={project.name}/>
            )}

            {/* VALIDATION */}
            {rightTab==='validation'&&(
              <ValidationPanel validations={validations} devices={devices}
                setSelectedDevice={setSelectedDevice} setRightTab={setRightTab}/>
            )}
            {/* DEVICE LIST */}
            {rightTab==='devlist'&&(
              <DeviceListPanel devices={devices}
                onFocus={(d)=>{
                  const el=document.querySelector('.canvas-viewport');
                  if(el){el.scrollLeft=d.x-el.clientWidth/2;el.scrollTop=d.y-el.clientHeight/2;}
                }}
                onSelect={(id)=>{setSelectedDevice(id);setRightTab('props')}}
                onSelectType={selectByType}/>
            )}
            {/* COMMENTS */}
            {rightTab==='comments'&&(
              <CommentsPanel comments={comments} onAdd={addComment}
                onResolve={resolveComment} onDelete={deleteComment}
                onFocus={(c)=>{
                  const el=document.querySelector('.canvas-viewport');
                  if(el){el.scrollLeft=c.x-el.clientWidth/2;el.scrollTop=c.y-el.clientHeight/2;}
                }}/>
            )}
            {/* UNIFILAR - Diagrama Unifilar Elétrico */}
            {rightTab==='unifilar'&&(()=>{
              // Analyze electrical topology from current project
              const tensao=230; // Default trifásico
              const fp=0.92; // Fator de potência
              // Group devices by electrical circuit
              const circuits=[];
              let circNum=1;
              // Group by ambiente label
              const envGroups={};
              devices.forEach(d=>{
                const envName=d.ambiente||'Geral';
                if(!envGroups[envName]) envGroups[envName]=[];
                envGroups[envName].push(d);
              });
              // Build circuits per environment
              Object.entries(envGroups).forEach(([envName,devs])=>{
                // Separate by power type
                const poeDevs=devs.filter(d=>{const def=findDevDef(d.key);return def?.poe});
                const acDevs=devs.filter(d=>needsACPower(d.key));
                const dcDevs=devs.filter(d=>needsDCPower(d.key)&&!findDevDef(d.key)?.poe);
                if(poeDevs.length>0){
                  const totalW=poeDevs.reduce((s,d)=>{const def=findDevDef(d.key);return s+(def?.poeW||15)},0);
                  const corrente=(totalW/(tensao*fp)).toFixed(1);
                  const secao=totalW<400?'1.5':totalW<800?'2.5':'4.0';
                  const disj=corrente<10?10:corrente<16?16:corrente<20?20:corrente<25?25:32;
                  circuits.push({num:circNum++,env:envName,desc:`CFTV/PoE (${poeDevs.length} câm.)`,
                    potencia:totalW,tensao,corrente,secao,disj,idr:true,dps:true,devs:poeDevs});
                }
                if(acDevs.length>0){
                  const totalW=acDevs.reduce((s,d)=>{
                    const def=findDevDef(d.key);
                    const p=parseInt(def?.props?.potencia)||100;return s+p},0);
                  const corrente=(totalW/(tensao*fp)).toFixed(1);
                  const secao=totalW<400?'1.5':totalW<800?'2.5':totalW<1500?'4.0':'6.0';
                  const disj=corrente<10?10:corrente<16?16:corrente<20?20:corrente<25?25:corrente<32?32:40;
                  circuits.push({num:circNum++,env:envName,desc:`Equip. AC (${acDevs.length} un.)`,
                    potencia:totalW,tensao,corrente,secao,disj,idr:true,dps:true,devs:acDevs});
                }
                if(dcDevs.length>0){
                  const totalW=dcDevs.length*5; // ~5W por device DC
                  circuits.push({num:circNum++,env:envName,desc:`Sensores/DC (${dcDevs.length} un.)`,
                    potencia:totalW,tensao:12,corrente:(totalW/12).toFixed(1),secao:'0.75',disj:6,idr:false,dps:false,devs:dcDevs});
                }
              });
              const totalPot=circuits.reduce((s,c)=>s+c.potencia,0);
              const totalCorr=(totalPot/(tensao*fp)).toFixed(1);
              const djGeral=totalCorr<25?25:totalCorr<32?32:totalCorr<40?40:totalCorr<50?50:63;
              return (
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'var(--azul)',marginBottom:8}}>⚡ Diagrama Unifilar</div>
                  {devices.length===0?(
                    <div style={{textAlign:'center',padding:20,color:'var(--cinza)',fontSize:11}}>
                      Adicione dispositivos para gerar o unifilar</div>
                  ):(
                    <div>
                      {/* QGBT Summary */}
                      <div style={{background:'#F0F5FA',borderRadius:6,padding:8,marginBottom:8,color:'#1e293b',border:'1px solid #E2E8F0'}}>
                        <div style={{fontSize:10,fontWeight:700,marginBottom:4}}>QGBT — Quadro Geral</div>
                        <div style={{fontSize:9,color:'#94a3b8',lineHeight:1.6}}>
                          Pot. Total: {totalPot}W ({(totalPot/1000).toFixed(1)}kW)<br/>
                          Corrente: {totalCorr}A @ {tensao}V<br/>
                          DJ Geral: {djGeral}A tripolar<br/>
                          IDR Geral: 30mA<br/>
                          DPS Classe II: Sim<br/>
                          Circuitos: {circuits.length}
                        </div>
                      </div>
                      {/* Circuit table */}
                      <div style={{fontSize:9,marginBottom:8}}>
                        <div style={{display:'grid',gridTemplateColumns:'24px 1fr 50px 40px 32px 28px',gap:2,
                          padding:'4px 0',borderBottom:'2px solid var(--azul)',fontWeight:700,color:'var(--azul)'}}>
                          <span>#</span><span>Circuito</span><span>W</span><span>mm²</span><span>DJ</span><span>IDR</span>
                        </div>
                        {circuits.map(c=>(
                          <div key={c.num} style={{display:'grid',gridTemplateColumns:'24px 1fr 50px 40px 32px 28px',gap:2,
                            padding:'3px 0',borderBottom:'1px solid #eee',alignItems:'center'}}>
                            <span style={{fontWeight:700,color:'var(--azul)'}}>{c.num}</span>
                            <div>
                              <div style={{fontWeight:600}}>{c.desc}</div>
                              <div style={{fontSize:8,color:'#94a3b8'}}>{c.env}</div>
                            </div>
                            <span>{c.potencia}</span>
                            <span>{c.secao}</span>
                            <span>{c.disj}A</span>
                            <span>{c.idr?'✓':'—'}</span>
                          </div>
                        ))}
                      </div>
                      {/* Legend */}
                      <div style={{fontSize:8,color:'#94a3b8',lineHeight:1.5,borderTop:'1px solid #eee',paddingTop:6}}>
                        <strong>Normas:</strong> NBR 5410 · IEC 60617<br/>
                        <strong>Condutor:</strong> Seção nominal (mm²) c/ queda tensão ≤4%<br/>
                        <strong>IDR:</strong> 30mA · <strong>DPS:</strong> Classe II em todos circuitos<br/>
                        <strong>Condutor Terra:</strong> Verde-amarelo em todos
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* STATUS BAR */}
      <div className="status-bar">
        <div className="sb-item">
          <span className={`sb-dot ${validations.length?'sb-warn':'sb-ok'}`}/>
          {validations.length?`${validations.length} alertas`:'Sistema OK'}
        </div>
        <div className="sb-item">📐 Zoom: {Math.round(zoom*100)}%</div>
        <div className="sb-item">🏗️ {floor?.name} — {devices.length} dispositivos</div>
        <div className="sb-item">🔗 {connections.length} conexões</div>
        {quadros.length>0&&<div className="sb-item">📦 {quadros.length} quadro{quadros.length>1?'s':''}</div>}
        <span style={{flex:1}}/>
        <div className="sb-item">
          <span className="shortcut">Delete</span> Excluir
          <span className="shortcut" style={{marginLeft:8}}>Dbl-Click</span> Cabear
          <span className="shortcut" style={{marginLeft:8}}>H</span> Mão
          <span className="shortcut" style={{marginLeft:8}}>Space</span> Pan
          <span className="shortcut" style={{marginLeft:8}}>ESC</span> Cancelar
        </div>
      </div>

      {/* MODEL SELECTOR MODAL */}
      {modelSelectorModal&&<ModelSelectorModal deviceKey={modelSelectorModal.deviceKey}
        onSelect={(model)=>addDevice(modelSelectorModal.deviceKey,modelSelectorModal.x,modelSelectorModal.y,model)}
        onCancel={()=>setModelSelectorModal(null)}/>}

      {/* EQUIPMENT REPOSITORY MODAL */}
      {showEquipmentRepo&&<EquipmentRepoModal customDevices={customDevices}
        onSave={saveCustomDevice} onDelete={deleteCustomDevice}
        onClose={()=>setShowEquipmentRepo(false)}
        onRefreshDefaults={()=>setDefRefreshKey(k=>k+1)}/>}

      {/* MIGRATION WIZARD MODAL */}
      {showMigrationWizard&&<MigrationWizard
        devices={devices}
        onReplace={handleMigrationReplace}
        onClose={()=>setShowMigrationWizard(false)}/>}

      {/* CALIBRATION DISTANCE MODAL */}
      {showCalibModal&&calibStart&&calibEnd&&(()=>{
        const dx=calibEnd.x-calibStart.x,dy=calibEnd.y-calibStart.y;
        const pixelDist=Math.sqrt(dx*dx+dy*dy);
        const currentScale=floor?.bgScale||1;
        const currentMeters=(pixelDist/(40*currentScale)).toFixed(2);
        return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget){setShowCalibModal(false);setCalibStart(null);setCalibEnd(null);setTool('select')}}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:'min(340px, calc(100vw - 32px))',boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
            <div style={{fontSize:14,fontWeight:700,color:'#8e44ad',marginBottom:4}}>📐 Calibrar Escala</div>
            <div style={{fontSize:10,color:'#64748b',marginBottom:16,lineHeight:1.4}}>
              Distância medida na imagem: <b>{currentMeters}m</b> (escala atual)
              <br/>Informe a distância real entre os dois pontos marcados.
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:10,fontWeight:600,color:'#374151',marginBottom:4,display:'block'}}>Distância real (metros)</label>
              <input ref={calibInputRef} type="number" min="0.1" step="0.1" autoFocus
                defaultValue=""
                placeholder="Ex: 12.5"
                onKeyDown={e=>{if(e.key==='Enter'){const v=parseFloat(e.target.value);if(v>0)confirmCalibration(v)}
                  if(e.key==='Escape'){setShowCalibModal(false);setCalibStart(null);setCalibEnd(null);setTool('select')}}}
                style={{width:'100%',padding:'10px 12px',fontSize:14,border:'2px solid #8e44ad',borderRadius:8,
                  outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={()=>{setShowCalibModal(false);setCalibStart(null);setCalibEnd(null);setTool('select')}}
                style={{flex:1,padding:'8px 12px',fontSize:11,fontWeight:600,background:'#f1f5f9',color:'#64748b',
                  border:'1px solid #d1d5db',borderRadius:6,cursor:'pointer'}}>
                Cancelar
              </button>
              <button onClick={()=>{const v=parseFloat(calibInputRef.current?.value);if(v>0)confirmCalibration(v);else calibInputRef.current?.focus()}}
                style={{flex:1,padding:'8px 12px',fontSize:11,fontWeight:600,background:'#8e44ad',color:'#fff',
                  border:'none',borderRadius:6,cursor:'pointer'}}>
                ✅ Aplicar Escala
              </button>
            </div>
          </div>
        </div>;
      })()}

      {/* EXPORT MODAL */}
      {showExport&&<ExportModal project={project} bom={bom} allDevices={allDevices}
        connections={[...project.floors.flatMap(f=>f.connections),...(project.crossFloorConnections||[])]} validationResults={validations}
        onClose={()=>setShowExport(false)}
        onImport={(importedProject)=>{
          syncUid(importedProject);
          dedupDeviceIds(importedProject);
          setProject(importedProject);
        }}/>}

      {/* RackElevationModal removed — rack is now managed via RackPanel tab */}

      {/* Cross-floor connection modal */}
      {crossFloorModal&&<CrossFloorConnectionModal
        project={project}
        sourceDeviceId={crossFloorModal.deviceId}
        sourceFloorId={project.activeFloor}
        sourceIfaceType={crossFloorModal.ifaceType}
        sourceIfaceLabel={crossFloorModal.ifaceLabel}
        onConnect={addCrossFloorConnection}
        onClose={()=>setCrossFloorModal(null)}/>}
    </div>
  );
}
