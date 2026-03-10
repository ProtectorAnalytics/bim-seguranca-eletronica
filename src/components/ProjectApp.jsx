import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { DEVICE_LIB } from '@/data/device-lib';
import { CABLE_TYPES, ROUTE_TYPES } from '@/data/cable-types';
import { MODEL_CATALOG } from '@/data/model-catalog';
import { DEVICE_THUMBNAILS } from '@/data/device-thumbnails';
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
  canMountInRack, canMountInQuadro, canMountInQuadroEletrico, getDeviceUSize,
  getSwitchPorts
} from '@/data/device-interfaces';
import {
  findDevDef, uid, syncUid, dedupDeviceIds, getDeviceIconKey, getCustomDevices, saveCustomDevices,
  getDeviceInterfaces, getPortDotClass, getPortTypeName, validateConnection,
  calcPPSection, getDefaultCable, getSettings, saveSettings
} from '@/lib/helpers';
import TopoNode from './TopoNode';
import ModelSelectorModal from './ModelSelectorModal';
import ExportModal from './ExportModal';
import EquipmentRepoModal from './EquipmentRepoModal';
import DeviceCatalog from './DeviceCatalog';
import CablePropertiesPanel from './CablePropertiesPanel';
import RackPanel from './RackPanel';
import EnvironmentFilterBar from './EnvironmentFilterBar';
import ValidationPanel from './ValidationPanel';
import TopologyPanel from './TopologyPanel';
import EquipmentPanel from './EquipmentPanel';
import { createRack, migrateRackDevices, assignDeviceToRack as calcSlot, getRackOccupancy } from '@/lib/rack-helpers';

export default function ProjectApp({project,setProject,undo,redo,onBack}){
  const limits = useSubscription();
  const [rightTab,setRightTab]=useState('props'); // props | topology | equipment | validation
  const [leftTab,setLeftTab]=useState('devices'); // devices | environments | floors
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
  const toggleCat=(catName)=>setCollapsedCats(prev=>({...prev,[catName]:!prev[catName]}));
  const [modelSelectorModal,setModelSelectorModal]=useState(null); // null | {deviceKey,x,y}
  const [showEquipmentRepo,setShowEquipmentRepo]=useState(false);
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
  // Layers: toggle visibility of canvas elements
  const [layers,setLayers]=useState({devices:true,cables:true,environments:true,grid:true,bg:true,dimensions:true});
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
  const environments=floor?.environments||[];
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
        const dx=fd.x-td.x,dy=fd.y-td.y;
        return {...c,distance:Math.max(1,Math.round(Math.sqrt(dx*dx+dy*dy)/40))};
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

    const dx=fromDev.x-toDev.x;const dy=fromDev.y-toDev.y;
    const dist=Math.max(1,Math.round(Math.sqrt(dx*dx+dy*dy)/40)); // 40px = 1m

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
    updateFloor(f=>({...f,connections:[...f.connections,{
      id:uid(),from:fromId,to:toId,type:finalCable,distance:dist,purpose,
      ifaceType:ifaceType||null,ifaceLabel:ifaceLabel||'',route:routeType||'straight'
    }]}));
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
    updateFloor(f=>({...f,connections:f.connections.filter(c=>c.id!==connId)}));
    if(selectedConn===connId) setSelectedConn(null);
  };

  // ---- draw.io-style cable routing with orthogonal segments ----
  const updateConnWaypoints=(connId,waypoints)=>{
    updateFloor(f=>({...f,connections:f.connections.map(c=>
      c.id===connId?{...c,waypoints}:c
    )}));
  };
  const deleteWaypoint=(connId,wpIdx)=>{
    const conn=connections.find(c=>c.id===connId);
    if(!conn||!conn.waypoints) return;
    const wps=[...(conn.waypoints)];
    wps.splice(wpIdx,1);
    updateConnWaypoints(connId,wps.length?wps:undefined);
  };

  // Auto-generate orthogonal route (draw.io style) from start to end
  const autoOrthoRoute=(x1,y1,x2,y2)=>{
    // Simple L-route or Z-route for orthogonal connections
    const dx=x2-x1,dy=y2-y1;
    const absDx=Math.abs(dx),absDy=Math.abs(dy);
    if(absDx<5||absDy<5){
      // Nearly aligned — straight line
      return [{x:x1,y:y1},{x:x2,y:y2}];
    }
    // Z-route through midpoint: go horizontal, then vertical, then horizontal
    const mx=(x1+x2)/2;
    return [{x:x1,y:y1},{x:mx,y:y1},{x:mx,y:y2},{x:x2,y:y2}];
  };

  // Build polyline path from array of points (orthogonal segments with rounded corners)
  const buildOrthoPath=(pts,radius=8)=>{
    if(pts.length<2) return '';
    if(pts.length===2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;
    let d=`M${pts[0].x},${pts[0].y}`;
    for(let i=1;i<pts.length-1;i++){
      const prev=pts[i-1],curr=pts[i],next=pts[i+1];
      // Vector from prev to curr and curr to next
      const dx1=curr.x-prev.x,dy1=curr.y-prev.y;
      const dx2=next.x-curr.x,dy2=next.y-curr.y;
      const len1=Math.sqrt(dx1*dx1+dy1*dy1)||1;
      const len2=Math.sqrt(dx2*dx2+dy2*dy2)||1;
      const r=Math.min(radius,len1/2,len2/2);
      // Points before and after the corner
      const bx=curr.x-dx1/len1*r,by=curr.y-dy1/len1*r;
      const ax=curr.x+dx2/len2*r,ay=curr.y+dy2/len2*r;
      d+=` L${bx},${by} Q${curr.x},${curr.y} ${ax},${ay}`;
    }
    d+=` L${pts[pts.length-1].x},${pts[pts.length-1].y}`;
    return d;
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

  // Add environment
  const addEnvironment=(name,color,bg)=>{
    const newEnv={id:uid(),name,color,bg,x:100,y:100,w:300,h:200};
    updateFloor(f=>({...f,environments:[...f.environments,newEnv]}));
  };

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
    const newFloor={id:uid(),name:`Pavimento ${num}`,number:num,devices:[],connections:[],environments:[],racks:[],quadros:[],bgScale:1.0};
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
      const dx=f.x-t.x,dy=f.y-t.y,dist=Math.max(1,Math.round(Math.sqrt(dx*dx+dy*dy)/40));
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
  },[allDevices,connections,project.floors]);

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
      return {device:dev,children,cable:connections.find(c=>(c.from===dev.id||c.to===dev.id))};
    };
    const tree=roots.map(r=>buildTree(r));
    const disconnected=devices.filter(d=>!connected.has(d.id)).map(d=>({device:d,children:[],disconnected:true}));
    return [...tree,...disconnected];
  },[devices,connections]);

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
    if(e.target.closest('.device-on-canvas')||e.target.closest('.env-rect')||e.target.closest('.port-popup')) return;
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
        moveDevice(dragging.id,dragging.origX+dx,dragging.origY+dy);
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
      setDragging(null);
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
        <span className="logo">PROTECTOR</span>
        <span style={{fontSize:9,opacity:.4,marginLeft:-8}}>{APP_VERSION.full}</span>
        <span style={{width:1,height:24,background:'rgba(255,255,255,.2)'}}/>
        <input value={project.name} onChange={e=>setProject(p=>({...p,name:e.target.value}))}
          style={{background:'transparent',border:'none',color:'#fff',fontSize:14,fontWeight:600,width:200,outline:'none'}}/>
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
      <div className="toolbar">
        {/* Ferramentas de edição */}
        <div className="tool-group">
          <button className={`tool-btn ${tool==='select'?'active':''}`} title="Selecionar (V)"
            onClick={()=>{setTool('select');setPendingDevice(null);setCableMode(null);setMeasureStart(null)}}>🖱️</button>
          <button className={`tool-btn ${tool==='pan'?'active':''}`} title="Mão / Arrastar (H / Space / Scroll-click)"
            onClick={()=>{setTool('pan');setPendingDevice(null);setCableMode(null);setMeasureStart(null)}}>✋</button>
          <button className={`tool-btn ${tool==='cable'?'active':''}`} title="Cabear"
            onClick={()=>{setTool('cable');setPendingDevice(null);setMeasureStart(null)}}>🔗</button>
          <button className={`tool-btn ${tool==='env'?'active':''}`} title="Ambiente"
            onClick={()=>{setTool('env');setPendingDevice(null);setMeasureStart(null)}}>🏠</button>
          <button className={`tool-btn ${tool==='measure'?'active':''}`} title="Cotas / Medir distância"
            onClick={()=>{setTool('measure');setPendingDevice(null)}}>📏</button>
        </div>

        {/* Ações rápidas */}
        <div className="tool-group">
          <button className="tool-btn" title="Auto Cabear" onClick={autoCable}>⚡</button>
        </div>

        {/* Opções de cabo (aparece só no modo cabo) */}
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
              <optgroup label="🔧 Automação / PP 4 vias">
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
          <span style={{fontSize:10,color:'var(--cinza)',fontWeight:600,marginRight:2}}>Ícone:</span>
          {[{id:'sm',label:'P',title:'Pequeno (36px)'},{id:'md',label:'M',title:'Médio (46px)'},{id:'normal',label:'G',title:'Normal (58px)'}].map(s=>(
            <button key={s.id} className={`tool-btn ${iconSize===s.id?'active':''}`}
              style={{width:26,height:26,fontSize:11,fontWeight:700}} title={s.title}
              onClick={()=>changeIconSize(s.id)}>{s.label}</button>
          ))}
        </div>

        {/* Toggles de visualização — SEMPRE visíveis */}
        <div className="tool-group" style={{borderLeft:'1px solid #555',paddingLeft:8,position:'relative'}}>
          <button className={`tool-btn ${showCableLabels?'active':''}`} title={showCableLabels?'Ocultar nomes dos cabos':'Mostrar nomes dos cabos'}
            style={{width:30,height:30,fontSize:12}} onClick={()=>setShowCableLabels(v=>!v)}>Aa</button>
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
              background:'#1e293b',border:'1px solid #334155',borderRadius:6,padding:'6px 0',
              minWidth:150,boxShadow:'0 8px 24px rgba(0,0,0,.4)'}}>
              <div style={{fontSize:10,color:'#94a3b8',padding:'2px 10px 4px',fontWeight:700,textTransform:'uppercase',letterSpacing:1}}>Camadas</div>
              {[
                {key:'devices',label:'Dispositivos',icon:'📦'},
                {key:'cables',label:'Cabos',icon:'🔗'},
                {key:'environments',label:'Ambientes',icon:'🏠'},
                {key:'grid',label:'Grade',icon:'⊞'},
                {key:'bg',label:'Planta Fundo',icon:'🖼️'},
                {key:'dimensions',label:'Cotas',icon:'📏'}
              ].map(l=>(
                <div key={l.key} onClick={()=>toggleLayer(l.key)}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'4px 10px',cursor:'pointer',
                    fontSize:11,color:layers[l.key]?'#e2e8f0':'#64748b',transition:'.15s',
                    background:'transparent'}}
                  onMouseOver={e=>e.currentTarget.style.background='#334155'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{width:14,height:14,borderRadius:3,border:'1.5px solid',
                    borderColor:layers[l.key]?'#3b82f6':'#475569',background:layers[l.key]?'#3b82f6':'transparent',
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
        <div className="tool-group" style={{borderLeft:'1px solid #555',paddingLeft:8}}>
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
          <span className="tool-label">Conexões: {connections.length}</span>
          <span className="tool-label">|</span>
          <span className="tool-label">Alertas: {validations.length}</span>
          {validations.length>0&&<span className="sb-dot sb-warn"/>}
          {validations.length===0&&devices.length>0&&<span className="sb-dot sb-ok"/>}
        </div>
        <EnvironmentFilterBar devices={devices} envFilterTag={envFilterTag}
          setEnvFilterTag={setEnvFilterTag} ENV_COLORS={ENV_COLORS}/>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="main-area">
        {/* LEFT PANEL */}
        <div className={`left-panel ${!leftPanelOpen?'collapsed':''}`}>
          <div className="lp-tabs">
            <button onClick={toggleLeftPanel} title="Esconder painel"
              style={{width:28,padding:0,background:'transparent',border:'none',cursor:'pointer',
                fontSize:14,color:'var(--cinza)',flexShrink:0}}>«</button>
            <div className={`lp-tab ${leftTab==='devices'?'active':''}`} onClick={()=>setLeftTab('devices')}>Dispositivos</div>
            <div className={`lp-tab ${leftTab==='environments'?'active':''}`} onClick={()=>setLeftTab('environments')}>Ambientes</div>
            <div className={`lp-tab ${leftTab==='floors'?'active':''}`} onClick={()=>setLeftTab('floors')}>Piso</div>
          </div>
          <div className="lp-content">
            {leftTab==='devices'&&<DeviceCatalog search={search} setSearch={setSearch}
              collapsedCats={collapsedCats} toggleCat={toggleCat}
              pendingDevice={pendingDevice} setPendingDevice={setPendingDevice}
              setTool={setTool} customDevices={customDevices} DEVICE_LIB={DEVICE_LIB}
              showEquipmentRepo={showEquipmentRepo} setShowEquipmentRepo={setShowEquipmentRepo} refreshKey={defRefreshKey}/>}
            {leftTab==='environments'&&<>
              <div style={{fontSize:11,color:'var(--cinza)',marginBottom:8}}>Clique para adicionar ao piso:</div>
              {ENV_COLORS.map(ec=>(
                <div key={ec.name} className="env-badge" style={{background:ec.bg,color:ec.color,border:`1px solid ${ec.color}30`}}
                  onClick={()=>addEnvironment(ec.name,ec.color,ec.bg)}>
                  🏠 {ec.name}
                </div>
              ))}
              <div style={{marginTop:12,fontSize:10,color:'var(--cinza)'}}>
                Ambientes no piso atual:
              </div>
              {environments.map(env=>(
                <div key={env.id} style={{padding:'6px 8px',margin:'4px 0',borderRadius:4,background:env.bg,
                  borderLeft:`3px solid ${env.color}`,fontSize:11,display:'flex',alignItems:'center',gap:6}}>
                  <span style={{flex:1,fontWeight:600,color:env.color}}>{env.name}</span>
                  <span style={{fontSize:9,color:'var(--cinza)'}}>
                    {devices.filter(d=>d.envId===env.id).length} devices
                  </span>
                </div>
              ))}
            </>}
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
                        setProject(p=>{const nf=p.floors.filter(fl=>fl.id!==f.id);return{...p,floors:nf,activeFloor:nf[0]?.id||p.activeFloor}})}
                      }}>🗑️</button>}
                  </div>
                  <div style={{fontSize:9,color:'var(--cinza)',marginTop:2}}>
                    {f.devices.length} dispositivos · {f.connections.length} conexões · {f.environments.length} ambientes
                  </div>
                </div>);
              })}
            </>}
          </div>
        </div>

        {/* CANVAS */}
        <div className="canvas-area" ref={canvasRef} onClick={handleCanvasClick} onMouseDown={handleCanvasMouseDown} onWheel={handleWheel}
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
              <svg className="canvas-grid" width="2000" height="2000" style={{opacity:.15,display:layers.grid?'block':'none'}}>
                <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.5"/>
                </pattern></defs>
                <rect width="2000" height="2000" fill="url(#grid)"/>
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

              {/* Environments */}
              {layers.environments&&environments.map(env=>(
                <div key={env.id} className="env-rect" style={{left:env.x,top:env.y,width:env.w,height:env.h,
                  borderColor:env.color,background:env.bg}}>
                  <span className="env-label" style={{background:env.color}}>{env.name}</span>
                </div>
              ))}

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
                  const sw=isPower?2.8:isAuto?2.2:isSignal?1.8:isWireless?1.2:2;
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
                    <circle cx={x1} cy={y1} r={3} fill={isSel?'#3b82f6':cableColor} opacity={0.7} style={{pointerEvents:'none'}}/>
                    <circle cx={x2} cy={y2} r={3} fill={isSel?'#3b82f6':cableColor} opacity={0.7} style={{pointerEvents:'none'}}/>
                    {/* Cable label */}
                    {showCableLabels&&<text x={labelX} y={labelY} className="cable-label" style={{pointerEvents:'none'}}>
                      {purposeIcon}{ct.name} · {conn.distance}m{portLabel}
                    </text>}

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
                const color=catInfo?.color||'#6b7280';
                const targetStatus=cableMode?validTargets[dev.id]:null;
                const isSource=cableMode?.from===dev.id;
                const inRack=dev.parentRack?racks.find(r=>r.id===dev.parentRack):null;
                const devSize=dev.iconSize||iconSize;
                const sizeClass=devSize==='sm'?'device-sm':devSize==='md'?'device-md':'';
                return (
                  <div key={dev.id}
                    className={`device-on-canvas ${sizeClass} ${selectedDevice===dev.id?'selected':''} ${multiSelect.has(dev.id)?'multi-selected':''}`}
                    style={{left:dev.x,top:dev.y,
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
                    <div className="doc-icon" style={{borderColor:isSource?'#f59e0b':targetStatus==='valid'?'#22c55e':color,
                      ...(DEVICE_THUMBNAILS[dev.key]?{padding:2,overflow:'hidden'}:{})}}>
                      {DEVICE_THUMBNAILS[dev.key]?(
                        <img src={DEVICE_THUMBNAILS[dev.key]} alt={dev.name} style={{width:devSize==='sm'?24:devSize==='md'?32:40,height:devSize==='sm'?24:devSize==='md'?32:40,objectFit:'contain'}}/>
                      ):ICONS[getDeviceIconKey(dev.key)]?.(isSource?'#f59e0b':targetStatus==='valid'?'#22c55e':color)}
                    </div>
                    {/* Connection button - opens port popup */}
                    {!cableMode&&(()=>{
                      const ifaces=getDeviceInterfaces(dev);
                      if(!ifaces.length) return null;
                      return (
                        <div style={{position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',
                          background:'var(--azul2)',border:'2px solid #fff',display:'flex',alignItems:'center',
                          justifyContent:'center',cursor:'pointer',boxShadow:'0 1px 4px rgba(0,0,0,.3)',
                          fontSize:9,color:'#fff',fontWeight:900,zIndex:12,opacity:portPopup?.devId===dev.id?1:.6,
                          transition:'.15s'}}
                          title="Conectar porta"
                          onMouseDown={(e)=>{e.stopPropagation();e.preventDefault()}}
                          onClick={(e)=>{
                            e.stopPropagation();
                            const rect=canvasRef.current?.getBoundingClientRect();
                            if(!rect) return;
                            setPortPopup({devId:dev.id,
                              x:(dev.x*zoom+pan.x+50),
                              y:(dev.y*zoom+pan.y-10)});
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
                    <div className="doc-label">{dev.name}</div>
                    {dev.model&&<div className="doc-model">{dev.model}</div>}
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
                    {/* Quantity badge for cameras */}
                    {isCamera(dev.key)&&(dev.qty||1)>1&&(
                      <div style={{position:'absolute',bottom:-4,right:-4,minWidth:20,height:20,borderRadius:10,
                        background:'#3b82f6',border:'2px solid #fff',display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:11,color:'#fff',fontWeight:900,padding:'0 3px',zIndex:13,
                        boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>×{dev.qty}</div>
                    )}
                    {/* Quantity setter for cameras when selected */}
                    {selectedDevice===dev.id&&isCamera(dev.key)&&!cableMode&&(
                      <div style={{position:'absolute',bottom:-22,left:'50%',transform:'translateX(-50%)',
                        display:'flex',alignItems:'center',gap:2,background:'#1e293b',borderRadius:4,padding:'2px 4px',
                        boxShadow:'0 2px 8px rgba(0,0,0,.3)',zIndex:15,whiteSpace:'nowrap'}}
                        onMouseDown={e=>{e.stopPropagation();e.preventDefault()}}
                        onDoubleClick={e=>e.stopPropagation()}>
                        <button style={{width:16,height:16,fontSize:12,background:'#334155',border:'none',borderRadius:3,
                          color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
                          onDoubleClick={e=>e.stopPropagation()}
                          onClick={e=>{e.stopPropagation();const cur=dev.qty||1;if(cur>1){
                            const newQty=cur-1;
                            const trimmed=trimNvrAssignments(dev,newQty);
                            updateDevice(dev.id,{qty:newQty,nvrAssignments:trimmed});
                          }}}>−</button>
                        <span style={{fontSize:10,color:'#e2e8f0',fontWeight:700,minWidth:16,textAlign:'center'}}>{dev.qty||1}</span>
                        <button style={{width:16,height:16,fontSize:12,background:'#334155',border:'none',borderRadius:3,
                          color:'#fff',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}
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
                    {/* NVR capacity badge */}
                    {isGravador(dev.key)&&(()=>{
                      const ch=getNvrChannels(dev);
                      const used=getNvrUsedChannels(dev.id,devices);
                      const isOver=used>ch;
                      return (
                        <div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',
                          minWidth:32,height:18,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:10,fontWeight:800,padding:'0 5px',zIndex:13,whiteSpace:'nowrap',
                          background:isOver?'#ef4444':used>0?'#22c55e':'#94a3b8',
                          color:'#fff',border:'1.5px solid #fff',
                          boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>{used}/{ch}ch</div>
                      );
                    })()}
                    {/* Switch port badge */}
                    {isSwitch(dev.key)&&(()=>{
                      const totalP=getSwitchPorts(dev);
                      const connected=connections.filter(c=>c.from===dev.id||c.to===dev.id)
                        .map(c=>{const oid=c.from===dev.id?c.to:c.from;return devices.find(d=>d.id===oid)}).filter(Boolean);
                      const usedP=connected.reduce((s,d)=>s+(needsPoE(d.key)?(d.qty||1):1),0);
                      const isOver=usedP>totalP;
                      return usedP>0?(
                        <div style={{position:'absolute',bottom:-6,left:'50%',transform:'translateX(-50%)',
                          minWidth:32,height:18,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:10,fontWeight:800,padding:'0 5px',zIndex:13,whiteSpace:'nowrap',
                          background:isOver?'#ef4444':'#3b82f6',
                          color:'#fff',border:'1.5px solid #fff',
                          boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>{usedP}/{totalP}p</div>
                      ):null;
                    })()}
                    {/* Camera NVR indicator */}
                    {isCamera(dev.key)&&(dev.nvrAssignments||[]).length>0&&(()=>{
                      const total=dev.qty||1;
                      const assigned=(dev.nvrAssignments||[]).reduce((s,a)=>s+(a.qty||0),0);
                      const allAssigned=assigned>=total;
                      return (
                        <div style={{position:'absolute',top:-6,left:-6,minWidth:18,height:18,borderRadius:9,
                          display:'flex',alignItems:'center',justifyContent:'center',
                          fontSize:10,fontWeight:800,padding:'0 3px',zIndex:14,
                          background:allAssigned?'#22c55e':'#f59e0b',
                          color:'#fff',border:'1.5px solid #fff',
                          boxShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
                          {allAssigned?'✓':assigned+'/'+total}
                        </div>
                      );
                    })()}
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
                  border:'2px solid #334155',background:'rgba(255,255,255,0.95)',
                  fontFamily:'system-ui,sans-serif',fontSize:10,color:'#1e293b',zIndex:5,
                  display:'flex',flexDirection:'column',pointerEvents:'none',userSelect:'none'}}>
                  {/* Header */}
                  <div style={{background:'#1e293b',color:'#fff',padding:'4px 8px',fontSize:11,fontWeight:700,
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
                style={{background:'rgba(255,255,255,.2)',border:'none',color:'#fff',
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
                <div className="port-popup" style={{left:portPopup.x,top:portPopup.y}}>
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
              boxShadow:'0 4px 20px rgba(0,0,0,.3)',maxWidth:480,textAlign:'center',
              animation:'fadeIn .2s'}}>
              {connToast.msg}
            </div>
          )}

          {/* Cable picker modal */}
          {cablePicker&&(
            <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
              background:'#fff',borderRadius:12,boxShadow:'0 8px 40px rgba(0,0,0,.25)',padding:20,
              zIndex:40,minWidth:320,maxWidth:420}}>
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
                  <rect width={mmW} height={mmH} fill="#0f172a" rx="4"/>
                  {/* Grid hint */}
                  <rect width={mmW} height={mmH} fill="none" stroke="#1e293b" strokeWidth=".5"/>
                  {/* Environments */}
                  {environments.map(env=>(
                    <rect key={'mm_e_'+env.id} x={env.x*sc} y={env.y*sc} width={env.w*sc} height={env.h*sc}
                      fill={env.bg||'rgba(59,130,246,.15)'} stroke={env.color} strokeWidth=".5" rx="1"/>
                  ))}
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

        {/* RIGHT PANEL */}
        <div className={`right-panel ${!rightPanelOpen?'collapsed':''}`}>
          <div className="rp-tabs">
            <div className={`rp-tab ${rightTab==='props'?'active':''}`} onClick={()=>setRightTab('props')}>
              {selectedDev?'Props':'Info'}
            </div>
            <div className={`rp-tab ${rightTab==='rack'?'active':''}`} onClick={()=>setRightTab('rack')}>
              Rack {racks.length>0&&<span style={{background:'var(--azul2)',color:'#fff',
                borderRadius:8,padding:'0 5px',fontSize:9,marginLeft:3}}>{racks.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='quadro'?'active':''}`} onClick={()=>setRightTab('quadro')}>
              Quadro {quadros.length>0&&<span style={{background:'#16a34a',color:'#fff',
                borderRadius:8,padding:'0 5px',fontSize:9,marginLeft:3}}>{quadros.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='topology'?'active':''}`} onClick={()=>setRightTab('topology')}>
              Topo
            </div>
            <div className={`rp-tab ${rightTab==='equipment'?'active':''}`} onClick={()=>setRightTab('equipment')}>
              Materiais
            </div>
            <div className={`rp-tab ${rightTab==='validation'?'active':''}`} onClick={()=>setRightTab('validation')}>
              Válid. {validations.length>0&&<span style={{background:'var(--vermelho)',color:'#fff',
                borderRadius:8,padding:'0 5px',fontSize:9,marginLeft:3}}>{validations.length}</span>}
            </div>
            <div className={`rp-tab ${rightTab==='unifilar'?'active':''}`} onClick={()=>setRightTab('unifilar')}>
              Unifilar
            </div>
            <button onClick={toggleRightPanel} title="Esconder painel"
              style={{width:28,padding:0,background:'transparent',border:'none',cursor:'pointer',
                fontSize:14,color:'var(--cinza)',flexShrink:0}}>»</button>
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
            {rightTab==='props'&&selectedDev&&(()=>{
              const def=findDevDef(selectedDev.key);
              const catInfo=DEVICE_LIB.find(c=>c.items.some(i=>i.key===selectedDev.key));
              return (
                <div>
                  <div className="prop-header">
                    <div className="ph-icon">{DEVICE_THUMBNAILS[selectedDev.key]?(
                      <img src={DEVICE_THUMBNAILS[selectedDev.key]} alt={selectedDev.name} style={{width:32,height:32,objectFit:'contain'}}/>
                    ):ICONS[getDeviceIconKey(selectedDev.key)]?.(catInfo?.color)}</div>
                    <div className="ph-info">
                      <div className="ph-name">{selectedDev.name}</div>
                      <div className="ph-model">{catInfo?.cat} · {selectedDev.key}</div>
                    </div>
                    <span className="ph-replace">Substituir</span>
                  </div>
                  <div className="prop-section">
                    <div className="prop-row">
                      <span className="pr-label">Nome:</span>
                      <span className="pr-value">
                        <input value={selectedDev.name} onChange={e=>updateDevice(selectedDev.id,{name:e.target.value})}/>
                      </span>
                    </div>
                    <div className="prop-row">
                      <span className="pr-label">Modelo:</span>
                      <span className="pr-value">
                        <input value={selectedDev.model||''} placeholder="Ex: DS-2CD2143G2-I"
                          onChange={e=>updateDevice(selectedDev.id,{model:e.target.value})}/>
                      </span>
                    </div>
                    <div className="prop-row">
                      <span className="pr-label">Ambiente:</span>
                      <span className="pr-value">
                        <select value={selectedDev.ambiente||''} onChange={e=>updateDevice(selectedDev.id,{ambiente:e.target.value||null})}>
                          <option value="">Nenhum</option>
                          {ENV_COLORS.map(env=><option key={env.name} value={env.name}>{env.name}</option>)}
                          <option value="">---</option>
                          {Array.from(new Set(devices.map(d=>d.ambiente).filter(a=>a&&!ENV_COLORS.find(e=>e.name===a)))).map(amb=>(
                            <option key={amb} value={amb}>{amb}</option>
                          ))}
                        </select>
                      </span>
                    </div>
                    <div className="prop-row">
                      <span className="pr-label">Tamanho:</span>
                      <span className="pr-value">
                        <select value={selectedDev.iconSize||''} onChange={e=>updateDevice(selectedDev.id,{iconSize:e.target.value||null})}>
                          <option value="">Padrão ({iconSize==='sm'?'Pequeno':iconSize==='md'?'Médio':'Normal'})</option>
                          <option value="sm">Pequeno</option>
                          <option value="md">Médio</option>
                          <option value="normal">Normal</option>
                        </select>
                      </span>
                    </div>
                  </div>
                  <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                    letterSpacing:.5,marginBottom:6,marginTop:12}}>Especificações</div>
                  {def?.props&&Object.entries(def.props).map(([k,v])=>(
                    <div key={k} className="prop-row">
                      <span className="pr-label" style={{textTransform:'capitalize'}}>{k}:</span>
                      <span className="pr-value" style={{fontWeight:600,color:'var(--azul)'}}>{v}</span>
                    </div>
                  ))}
                  {def?.poe&&(
                    <div className="prop-row">
                      <span className="pr-label">PoE:</span>
                      <span className="pr-value" style={{fontWeight:600,color:'var(--verde)'}}>{def.poeW}W</span>
                    </div>
                  )}

                  {/* NVR Assignment for cameras */}
                  {isCamera(selectedDev.key)&&(()=>{
                    const allNvrs=devices.filter(d=>isGravador(d.key));
                    const totalQty=selectedDev.qty||1;
                    const assignments=selectedDev.nvrAssignments||[];
                    const assignedTotal=assignments.reduce((s,a)=>s+(a.qty||0),0);
                    const unassigned=totalQty-assignedTotal;
                    return allNvrs.length>0?(
                      <div>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                          letterSpacing:.5,marginBottom:6,marginTop:12,display:'flex',alignItems:'center',gap:6}}>
                          <span>Gravação ({assignedTotal}/{totalQty})</span>
                          {unassigned>0&&<span style={{color:'#ef4444',fontSize:9,fontWeight:600,
                            background:'#fef2f2',padding:'1px 6px',borderRadius:8}}>
                            {unassigned} sem NVR</span>}
                          {unassigned===0&&assignedTotal>0&&<span style={{color:'#22c55e',fontSize:9}}>✓</span>}
                        </div>
                        {allNvrs.map(nvr=>{
                          const nvrCh=getNvrChannels(nvr);
                          const nvrUsed=getNvrUsedChannels(nvr.id,devices);
                          const myAssign=assignments.find(a=>a.nvrId===nvr.id);
                          const myQty=myAssign?.qty||0;
                          const isOver=nvrUsed>nvrCh;
                          return (
                            <div key={nvr.id} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 0',
                              fontSize:10,borderBottom:'1px solid #f0f0f0'}}>
                              <span style={{width:8,height:8,borderRadius:'50%',flexShrink:0,
                                background:isOver?'#ef4444':'#22c55e'}}/>
                              <span style={{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',
                                whiteSpace:'nowrap',fontWeight:myQty>0?700:400,
                                color:myQty>0?'var(--azul)':'var(--cinza)'}}>
                                {nvr.name}
                                <span style={{fontSize:8,color:isOver?'#ef4444':'#94a3b8',marginLeft:4}}>
                                  {nvrUsed}/{nvrCh}ch
                                </span>
                              </span>
                              <div style={{display:'flex',alignItems:'center',gap:2}}>
                                <button style={{width:16,height:16,fontSize:11,background:myQty>0?'#fee2e2':'#f1f5f9',
                                  border:'1px solid #e2e8f0',borderRadius:3,cursor:'pointer',display:'flex',
                                  alignItems:'center',justifyContent:'center',color:myQty>0?'#ef4444':'#94a3b8'}}
                                  onDoubleClick={e=>e.stopPropagation()}
                                  onClick={e=>{e.stopPropagation();
                                    if(myQty<=0) return;
                                    let newA=assignments.map(a=>a.nvrId===nvr.id?{...a,qty:a.qty-1}:a).filter(a=>a.qty>0);
                                    updateDevice(selectedDev.id,{nvrAssignments:newA});
                                  }}>−</button>
                                <span style={{fontSize:9,fontWeight:700,minWidth:18,textAlign:'center',
                                  color:myQty>0?'var(--azul)':'#94a3b8'}}>{myQty}</span>
                                <button style={{width:16,height:16,fontSize:11,background:unassigned>0?'#dbeafe':'#f1f5f9',
                                  border:'1px solid #e2e8f0',borderRadius:3,cursor:'pointer',display:'flex',
                                  alignItems:'center',justifyContent:'center',color:unassigned>0?'#3b82f6':'#94a3b8'}}
                                  onDoubleClick={e=>e.stopPropagation()}
                                  onClick={e=>{e.stopPropagation();
                                    if(unassigned<=0) return;
                                    let newA=[...assignments];
                                    const ex=newA.find(a=>a.nvrId===nvr.id);
                                    if(ex) ex.qty++;
                                    else newA.push({nvrId:nvr.id,qty:1});
                                    updateDevice(selectedDev.id,{nvrAssignments:newA});
                                  }}>+</button>
                              </div>
                            </div>
                          );
                        })}
                        {unassigned>0&&(
                          <button style={{marginTop:6,width:'100%',padding:'4px 8px',fontSize:9,fontWeight:600,
                            background:'var(--azul2)',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}
                            onClick={()=>{
                              const updates=autoAssignCameras(devices,connections);
                              if(updates.length){
                                updates.forEach(u=>updateDevice(u.id,{nvrAssignments:u.nvrAssignments}));
                                showConnToast(updates.length+' câmera(s) atribuídas automaticamente','success');
                              } else showConnToast('Nenhum NVR alcançável via rede','warn');
                            }}>⚡ Auto-distribuir ({unassigned} câmeras)</button>
                        )}
                      </div>
                    ):(
                      <div style={{fontSize:9,color:'#f59e0b',padding:'6px 0',marginTop:8}}>
                        ⚠ Nenhum NVR no andar. Adicione um NVR para atribuir gravação.
                      </div>
                    );
                  })()}

                  {/* Configuration fields for nobreak_ac */}
                  {selectedDev.key==='nobreak_ac'&&(
                    <>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                        letterSpacing:.5,marginBottom:6,marginTop:12}}>Configuração</div>

                      <div className="prop-row">
                        <span className="pr-label">Modelo:</span>
                        <span className="pr-value">
                          <select value={selectedDev.config?.modelId||''}
                            onChange={e=>{
                              const model=MODEL_CATALOG.nobreak_ac.find(m=>m.id===e.target.value);
                              updateDevice(selectedDev.id,{config:{...selectedDev.config,modelId:e.target.value,modelData:model},model:model?.model||''});
                            }}>
                            <option value="">Personalizado</option>
                            {MODEL_CATALOG.nobreak_ac.map(m=><option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}
                          </select>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">SNMP:</span>
                        <span className="pr-value">
                          <input type="checkbox" checked={selectedDev.config?.snmp||false}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,snmp:e.target.checked}})}/>
                          <span style={{marginLeft:6,fontSize:10}}>Com placa SNMP</span>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Tomadas 10A:</span>
                        <span className="pr-value">
                          <input type="number" min="0" max="20" value={selectedDev.config?.tomadas_10a||0}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,tomadas_10a:parseInt(e.target.value)||0}})}
                            style={{width:'60px'}}/>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Tomadas 20A:</span>
                        <span className="pr-value">
                          <input type="number" min="0" max="20" value={selectedDev.config?.tomadas_20a||0}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,tomadas_20a:parseInt(e.target.value)||0}})}
                            style={{width:'60px'}}/>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Potência VA:</span>
                        <span className="pr-value">
                          <input type="number" min="600" max="10000" step="100" value={selectedDev.config?.potenciaVA||3000}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,potenciaVA:parseInt(e.target.value)||3000}})}
                            style={{width:'80px'}}/>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Bateria Ext:</span>
                        <span className="pr-value">
                          <input type="checkbox" checked={selectedDev.config?.batExterna||false}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,batExterna:e.target.checked}})}/>
                          <span style={{marginLeft:6,fontSize:10}}>Módulo externo</span>
                        </span>
                      </div>
                    </>
                  )}

                  {/* Configuration fields for nobreak_dc */}
                  {selectedDev.key==='nobreak_dc'&&(
                    <>
                      <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                        letterSpacing:.5,marginBottom:6,marginTop:12}}>Configuração</div>

                      <div className="prop-row">
                        <span className="pr-label">Modelo:</span>
                        <span className="pr-value">
                          <select value={selectedDev.config?.modelId||''}
                            onChange={e=>{
                              const model=MODEL_CATALOG.nobreak_dc.find(m=>m.id===e.target.value);
                              updateDevice(selectedDev.id,{config:{...selectedDev.config,modelId:e.target.value,modelData:model},model:model?.model||''});
                            }}>
                            <option value="">Personalizado</option>
                            {MODEL_CATALOG.nobreak_dc.map(m=><option key={m.id} value={m.id}>{m.brand} {m.model}</option>)}
                          </select>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Corrente (A):</span>
                        <span className="pr-value">
                          <select value={selectedDev.config?.correnteSaida||5}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,correnteSaida:parseInt(e.target.value)||5}})}>
                            <option value="5">5A</option>
                            <option value="10">10A</option>
                          </select>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Bateria Interna:</span>
                        <span className="pr-value">
                          <input type="checkbox" checked={selectedDev.config?.batInterna||false}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,batInterna:e.target.checked}})}/>
                          <span style={{marginLeft:6,fontSize:10}}>Compartimento interno</span>
                        </span>
                      </div>

                      <div className="prop-row">
                        <span className="pr-label">Bateria Externa:</span>
                        <span className="pr-value">
                          <input type="checkbox" checked={selectedDev.config?.batExterna||false}
                            onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,batExterna:e.target.checked}})}/>
                          <span style={{marginLeft:6,fontSize:10}}>Módulo externo</span>
                        </span>
                      </div>
                    </>
                  )}


                  {/* NVR Channel Map */}
                  {isGravador(selectedDev.key)&&(()=>{
                    const totalCh=getNvrChannels(selectedDev);
                    const usedCh=getNvrUsedChannels(selectedDev.id,devices);
                    const isOver=usedCh>totalCh;
                    const pct=Math.min(100,Math.round(usedCh/totalCh*100));
                    const assignedCams=devices.filter(d=>isCamera(d.key)&&d.nvrAssignments?.some(a=>a.nvrId===selectedDev.id));
                    return (
                      <>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                          letterSpacing:.5,marginBottom:6,marginTop:12}}>
                          Canais ({usedCh}/{totalCh})
                          {isOver&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>⚠ EXCEDIDO</span>}
                        </div>
                        <div style={{height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                          <div style={{height:'100%',borderRadius:3,transition:'width .3s',
                            width:pct+'%',background:isOver?'#ef4444':pct>80?'#f59e0b':'#22c55e'}}/>
                        </div>
                        <div className="prop-row">
                          <span className="pr-label">Canais totais:</span>
                          <span className="pr-value">
                            <input type="number" min="1" max="256" value={totalCh}
                              onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,channels:parseInt(e.target.value)||16}})}
                              style={{width:'60px'}}/>
                          </span>
                        </div>
                        {assignedCams.length>0?(
                          assignedCams.map(cam=>{
                            const a=cam.nvrAssignments.find(x=>x.nvrId===selectedDev.id);
                            return (
                              <div key={cam.id} style={{display:'flex',alignItems:'center',gap:6,padding:'4px 0',
                                fontSize:10,borderBottom:'1px solid #f0f0f0',cursor:'pointer'}}
                                onClick={()=>{setSelectedDevice(cam.id);setRightTab('props')}}>
                                <span style={{width:8,height:8,borderRadius:'50%',background:'#3b82f6',flexShrink:0}}/>
                                <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                                  {cam.name}{(cam.qty||1)>1?' ×'+(cam.qty||1):''}
                                </span>
                                <span style={{fontSize:11,fontWeight:700,color:'var(--azul)'}}>{a?.qty||0}ch</span>
                              </div>
                            );
                          })
                        ):(
                          <div style={{fontSize:10,color:'#9ca3af',padding:'6px 0'}}>
                            Nenhuma câmera atribuída. Selecione uma câmera e atribua a este NVR.
                          </div>
                        )}
                        {assignedCams.length===0&&(
                          <button style={{marginTop:6,width:'100%',padding:'6px 10px',fontSize:11,fontWeight:600,
                            background:'var(--azul2)',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}
                            onClick={()=>{
                              const updates=autoAssignCameras(devices,connections);
                              if(updates.length){
                                updates.forEach(u=>updateDevice(u.id,{nvrAssignments:u.nvrAssignments}));
                                showConnToast(updates.length+' câmera(s) atribuídas automaticamente','success');
                              } else showConnToast('Nenhuma câmera alcançável via rede','warn');
                            }}>⚡ Auto-distribuir câmeras</button>
                        )}
                      </>
                    );
                  })()}

                  {/* Switch Port Usage */}
                  {isSwitch(selectedDev.key)&&(()=>{
                    const totalPorts=getSwitchPorts(selectedDev);
                    const connected=connections.filter(c=>c.from===selectedDev.id||c.to===selectedDev.id)
                      .map(c=>{const oid=c.from===selectedDev.id?c.to:c.from;return devices.find(d=>d.id===oid)}).filter(Boolean);
                    const poeDevs=connected.filter(d=>needsPoE(d.key));
                    const uplinkDevs=connected.filter(d=>!needsPoE(d.key));
                    const usedPoePorts=poeDevs.reduce((s,d)=>s+(d.qty||1),0);
                    const usedUplinks=uplinkDevs.length;
                    const isOver=usedPoePorts>totalPorts;
                    const pct=Math.min(100,Math.round(usedPoePorts/totalPorts*100));
                    return (
                      <>
                        <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                          letterSpacing:.5,marginBottom:6,marginTop:12}}>
                          Portas PoE ({usedPoePorts}/{totalPorts})
                          {isOver&&<span style={{color:'#ef4444',marginLeft:6,fontSize:9}}>⚠ {usedPoePorts-totalPorts} EXCEDENTES</span>}
                        </div>
                        <div style={{height:6,background:'#e2e8f0',borderRadius:3,overflow:'hidden',marginBottom:8}}>
                          <div style={{height:'100%',borderRadius:3,transition:'width .3s',
                            width:pct+'%',background:isOver?'#ef4444':pct>80?'#f59e0b':'#22c55e'}}/>
                        </div>
                        <div className="prop-row">
                          <span className="pr-label">Portas totais:</span>
                          <span className="pr-value">
                            <input type="number" min="1" max="48" value={totalPorts}
                              onChange={e=>updateDevice(selectedDev.id,{config:{...selectedDev.config,portCount:parseInt(e.target.value)||8}})}
                              style={{width:'60px'}}/>
                          </span>
                        </div>
                        {poeDevs.length>0&&<div style={{fontSize:9,fontWeight:600,color:'var(--cinza)',marginTop:6,marginBottom:4}}>
                          DISPOSITIVOS PoE</div>}
                        {poeDevs.map(d=>(
                          <div key={d.id} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',
                            fontSize:10,borderBottom:'1px solid #f0f0f0',cursor:'pointer'}}
                            onClick={()=>{setSelectedDevice(d.id);setRightTab('props')}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:'#3b82f6',flexShrink:0}}/>
                            <span style={{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                              {d.name}{(d.qty||1)>1?' ×'+(d.qty||1):''}
                            </span>
                            <span style={{fontSize:11,color:'var(--cinza)'}}>{d.qty||1}p</span>
                          </div>
                        ))}
                        {uplinkDevs.length>0&&<div style={{fontSize:11,fontWeight:600,color:'var(--cinza)',marginTop:6,marginBottom:4}}>
                          UPLINKS ({usedUplinks})</div>}
                        {uplinkDevs.map(d=>(
                          <div key={d.id} style={{display:'flex',alignItems:'center',gap:6,padding:'3px 0',
                            fontSize:10,borderBottom:'1px solid #f0f0f0',cursor:'pointer'}}
                            onClick={()=>{setSelectedDevice(d.id);setRightTab('props')}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:'#f59e0b',flexShrink:0}}/>
                            <span style={{flex:1}}>{d.name}</span>
                            <span style={{fontSize:11,color:'var(--cinza)'}}>1p</span>
                          </div>
                        ))}
                      </>
                    );
                  })()}
                  {/* Rack assignment dropdown for mountable devices */}
                  {canMountInRack(selectedDev.key)&&racks.length>0&&(
                    <div className="prop-row">
                      <span className="pr-label">Rack:</span>
                      <span className="pr-value">
                        <select value={selectedDev.parentRack||''} onChange={e=>{
                          const rackId=e.target.value;
                          if(rackId){assignDeviceToRackAction(selectedDev.id,rackId)}
                          else if(selectedDev.parentRack){unassignDeviceFromRack(selectedDev.id)}
                        }}>
                          <option value="">Não montado</option>
                          {racks.map(r=>{
                            const occ=getRackOccupancy(r,devices);
                            return <option key={r.id} value={r.id}>{r.name} ({r.tag}) — {occ.freeU}U livres</option>;
                          })}
                        </select>
                      </span>
                    </div>
                  )}
                  {/* Quadro de Conectividade assignment */}
                  {canMountInQuadro(selectedDev.key)&&quadros.length>0&&(
                    <div className="prop-row">
                      <span className="pr-label">Quadro:</span>
                      <span className="pr-value">
                        <select value={selectedDev.quadroId||''} onChange={e=>{
                          const qcId=e.target.value;
                          if(qcId) assignDeviceToQuadro(selectedDev.id,qcId);
                          else if(selectedDev.quadroId) unassignDeviceFromQuadro(selectedDev.id);
                        }}>
                          <option value="">Não atribuído</option>
                          {quadros.map(qc=>{
                            const cnt=devices.filter(d=>d.quadroId===qc.id).length;
                            return <option key={qc.id} value={qc.id}>{qc.tag} — {qc.name} ({cnt} itens)</option>;
                          })}
                        </select>
                      </span>
                    </div>
                  )}

                  <div style={{fontSize:10,fontWeight:700,color:'var(--cinza)',textTransform:'uppercase',
                    letterSpacing:.5,marginBottom:6,marginTop:12}}>Conexões</div>
                  {connections.filter(c=>c.from===selectedDev.id||c.to===selectedDev.id).map(conn=>{
                    const otherId=conn.from===selectedDev.id?conn.to:conn.from;
                    const other=devices.find(d=>d.id===otherId);
                    const ct=CABLE_TYPES.find(c=>c.id===conn.type);
                    const purposeIcon=ct?.group==='power'?'⚡':ct?.group==='signal'?'📡':'🌐';
                    return (
                      <div key={conn.id} style={{display:'flex',alignItems:'center',gap:6,padding:'5px 0',
                        fontSize:10,borderBottom:'1px solid #f0f0f0'}}>
                        <span style={{width:8,height:8,borderRadius:'50%',background:ct?.color||'#999',flexShrink:0}}/>
                        <span style={{flex:1,lineHeight:1.3}}>
                          <div style={{fontWeight:600}}>{other?.name||'?'}</div>
                          <div style={{color:'var(--cinza)',fontSize:9}}>{purposeIcon} {ct?.name} · {conn.distance}m · {conn.purpose||'dados'}{conn.ifaceLabel?` · ${conn.ifaceLabel.split('(')[0].trim()}`:''}</div>
                        </span>
                        <span style={{cursor:'pointer',color:'var(--vermelho)',fontSize:12,flexShrink:0}}
                          onClick={()=>deleteConnection(conn.id)}>✕</span>
                      </div>
                    );
                  })}
                  <button style={{marginTop:8,padding:'4px 10px',border:'1px solid var(--azul2)',background:'transparent',
                    color:'var(--azul2)',borderRadius:4,fontSize:10,cursor:'pointer',fontWeight:600}}
                    onClick={()=>{setCableMode({from:selectedDev.id});setTool('cable')}}>
                    + Adicionar Conexão
                  </button>
                  <div className="prop-actions" style={{marginTop:16}}>
                    <button className="btn-copy" onClick={()=>copyDevice(selectedDev.id)}>📋 Copiar</button>
                    <button className="btn-delete" onClick={()=>deleteDevice(selectedDev.id)}>🗑️ Excluir</button>
                  </div>
                </div>
              );
            })()}
            {rightTab==='props'&&!selectedDev&&!selectedConn&&(
              <div style={{textAlign:'center',padding:'40px 20px',color:'var(--cinza)'}}>
                <div style={{fontSize:32,opacity:.3,marginBottom:12}}>🖱️</div>
                <p style={{fontSize:12}}>Selecione um dispositivo ou cabo para ver propriedades</p>
                <p style={{fontSize:10,opacity:.5,marginTop:4}}>Ou adicione dispositivos da paleta</p>
              </div>
            )}
            {rightTab==='props'&&!selectedDev&&selectedConn&&(()=>{
              const conn=connections.find(c=>c.id===selectedConn);
              if(!conn) return null;
              const ct=CABLE_TYPES.find(c=>c.id===conn.type);
              const fromDev=devices.find(d=>d.id===conn.from);
              const toDev=devices.find(d=>d.id===conn.to);
              return <CablePropertiesPanel conn={conn} cableType={ct}
                fromDev={fromDev} toDev={toDev}
                updateConnection={updateConnection}
                onDelete={()=>deleteConnection(conn.id)}
                onClose={()=>setSelectedConn(null)}/>;
            })()}

            {/* TOPOLOGY */}
            {rightTab==='topology'&&(
              <TopologyPanel topology={topology} devices={devices} floorName={floor?.name}
                setSelectedDevice={setSelectedDevice} setRightTab={setRightTab}/>
            )}

            {/* EQUIPMENT LIST */}
            {rightTab==='equipment'&&(
              <EquipmentPanel bom={bom} allDevices={allDevices} connections={connections}/>
            )}

            {/* VALIDATION */}
            {rightTab==='validation'&&(
              <ValidationPanel validations={validations} devices={devices}
                setSelectedDevice={setSelectedDevice} setRightTab={setRightTab}/>
            )}
            {/* UNIFILAR - Diagrama Unifilar Elétrico */}
            {rightTab==='unifilar'&&(()=>{
              // Analyze electrical topology from current project
              const tensao=230; // Default trifásico
              const fp=0.92; // Fator de potência
              // Group devices by electrical circuit
              const circuits=[];
              let circNum=1;
              // Group by environment
              const envGroups={};
              devices.forEach(d=>{
                const env=d.envId?environments.find(e=>e.id===d.envId):null;
                const envName=env?.name||'Geral';
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
                      <div style={{background:'#1e293b',borderRadius:6,padding:8,marginBottom:8,color:'#e2e8f0'}}>
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

      {/* CALIBRATION DISTANCE MODAL */}
      {showCalibModal&&calibStart&&calibEnd&&(()=>{
        const dx=calibEnd.x-calibStart.x,dy=calibEnd.y-calibStart.y;
        const pixelDist=Math.sqrt(dx*dx+dy*dy);
        const currentScale=floor?.bgScale||1;
        const currentMeters=(pixelDist/(40*currentScale)).toFixed(2);
        return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.5)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}
          onClick={e=>{if(e.target===e.currentTarget){setShowCalibModal(false);setCalibStart(null);setCalibEnd(null);setTool('select')}}}>
          <div style={{background:'#fff',borderRadius:12,padding:24,width:340,boxShadow:'0 20px 60px rgba(0,0,0,.3)'}}>
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
        connections={project.floors.flatMap(f=>f.connections)} validationResults={validations}
        onClose={()=>setShowExport(false)}
        onImport={(importedProject)=>{
          syncUid(importedProject);
          dedupDeviceIds(importedProject);
          setProject(importedProject);
        }}/>}

      {/* RackElevationModal removed — rack is now managed via RackPanel tab */}
    </div>
  );
}
