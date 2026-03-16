import React, { useState } from 'react';
import { DEVICE_LIB } from '@/data/device-lib';
import { CABLE_TYPES } from '@/data/cable-types';
import { EQUIPMENT_SCHEMAS } from '@/data/equipment-schemas';
import { ICONS, ICON_BANK, COLOR_PALETTE } from '@/icons';
import { INTERFACE_CARDINALITY } from '@/data/device-interfaces';
import { getDeviceInterfaces, getDeviceOverrides, saveDeviceOverrides, getHiddenDevices, saveHiddenDevices, getHiddenFamilies, saveHiddenFamilies } from '@/lib/helpers';

export default function EquipmentRepoModal({customDevices,onSave,onDelete,onClose,startAtStep,onRefreshDefaults}){
  // Wizard steps: 1=category, 2=base device, 3=dados gerais, 4=interfaces, 5=specs, 6=revisão
  const WIZARD_STEPS=[
    {id:1,label:'Categoria',icon:'📂'},
    {id:2,label:'Tipo Base',icon:'🔧'},
    {id:3,label:'Dados',icon:'📋'},
    {id:4,label:'Interfaces',icon:'🔌'},
    {id:5,label:'Specs',icon:'⚙️'},
    {id:6,label:'Revisão',icon:'✅'},
  ];
  const [step,setStep]=useState(startAtStep||0); // 0=list, 1-6=wizard steps
  const [editingDevice,setEditingDevice]=useState(null);
  const [repoTab,setRepoTab]=useState('custom'); // 'custom' | 'default'
  const [defSearch,setDefSearch]=useState('');
  const [defCatFilter,setDefCatFilter]=useState('all');
  const [hiddenDevices,setHiddenDevices]=useState(()=>getHiddenDevices());
  const [deviceOverrides,setDeviceOverrides]=useState(()=>getDeviceOverrides());
  const [hiddenFamilies,setHiddenFamilies]=useState(()=>getHiddenFamilies());
  const [showFamilyManager,setShowFamilyManager]=useState(false);
  const [formState,setFormState]=useState({
    category:'camera',baseDeviceType:'cam_dome',brand:'',model:'',descricao:'',
    referencia:'',preco:'',specs:{},datasheetText:'',
    customIcon:'',customColor:'',
    customIfaces:[] // [{type,cables:[],label,required,cardinality}]
  });

  const categoryLabels={
    camera:'Câmeras',acesso:'Acesso',fechadura:'Fechadura',alarme:'Alarme',sensor:'Sensores / Barreiras',
    switch_rede:'Switches / Rede',gravador:'Gravador NVR',fonte_energia:'Fonte',nobreak:'Nobreak',
    infra:'Infraestrutura',wifi:'Wi-Fi',automatizador:'Automatizadores',periferico:'Periféricos'
  };
  const categoryIcons={
    camera:'📷',acesso:'🔐',fechadura:'🔒',alarme:'🚨',sensor:'📡',
    switch_rede:'🌐',gravador:'💾',fonte_energia:'⚡',nobreak:'🔋',infra:'🏗️',
    wifi:'📶',automatizador:'🚪',periferico:'🖥️'
  };
  const categoryColors={
    camera:'#f59e0b',acesso:'#3b82f6',fechadura:'#8b5cf6',alarme:'#ef4444',sensor:'#84cc16',
    switch_rede:'#06b6d4',gravador:'#059669',fonte_energia:'#eab308',nobreak:'#dc2626',infra:'#6b7280',
    wifi:'#0ea5e9',automatizador:'#a855f7',periferico:'#374151'
  };

  const getCategoryDevices=(category)=>{
    const filterMap={
      camera:i=>i.key.startsWith('cam_'),
      acesso:i=>['leitor_facial','leitor_biometrico','leitor_rfid','controladora','leitor_tag'].includes(i.key),
      fechadura:i=>['fechadura','eletroima'].includes(i.key),
      alarme:()=>false, // kept for custom devices (no standard alarm devices in v3.19)
      sensor:i=>i.key.startsWith('barreira_'),
      switch_rede:i=>i.key.startsWith('sw_')||i.key==='router',
      gravador:i=>i.key.startsWith('nvr_'),
      fonte_energia:i=>i.key==='fonte',
      nobreak:i=>i.key==='nobreak_ac'||i.key==='nobreak_dc',
      infra:i=>['quadro','rack','dio','borne_sak','bateria_ext','modulo_bat','cabo_engate',
        'patch_panel','conversor_midia','dps_rede','tomada_dupla','quadro_eletrico'].includes(i.key),
      wifi:i=>i.key.startsWith('wifi_'),
      automatizador:i=>i.key.startsWith('auto_')||i.key.startsWith('cancela_')
    };
    const filter=filterMap[category]||(()=>false);
    return DEVICE_LIB.flatMap(c=>c.items).filter(filter);
  };

  const handleSpecChange=(key,value)=>setFormState(f=>({...f,specs:{...f.specs,[key]:value}}));
  const handleFieldChange=(key,value)=>setFormState(f=>({...f,[key]:value}));

  const IFACE_TYPE_OPTIONS=[
    {value:'data_in',label:'Entrada dados RJ45',card:'1:1'},
    {value:'data_io',label:'Dados bidirecional (switch)',card:'1:1'},
    {value:'fiber_in',label:'Entrada fibra SFP',card:'1:1'},
    {value:'power_in',label:'Entrada energia',card:'1:1'},
    {value:'power_out',label:'Saída energia (fonte)',card:'1:N'},
    {value:'signal_in',label:'Entrada sensor (NA/NF)',card:'N:1'},
    {value:'signal_out',label:'Saída contato seco (relay)',card:'1:1'},
    {value:'alarm_zone',label:'Zona de alarme',card:'N:1'},
    {value:'automation_in',label:'Entrada automação',card:'N:1'},
    {value:'automation_out',label:'Saída automação',card:'1:1'},
    {value:'video_out',label:'Saída vídeo (HDMI/VGA)',card:'1:1'},
    {value:'rs485',label:'RS-485 (barramento serial)',card:'N:1'},
    {value:'wiegand',label:'Wiegand (leitor)',card:'1:1'},
    {value:'wifi_client',label:'WiFi (cliente/AP)',card:'N:1'},
    {value:'passthrough',label:'Passagem/emenda',card:'N:1'},
  ];
  const CABLE_OPTIONS=CABLE_TYPES.map(c=>({value:c.id,label:c.name}));

  const addCustomIface=()=>setFormState(f=>({...f,
    customIfaces:[...f.customIfaces,{type:'signal_in',cables:['pp2v_05'],label:'',required:false}]}));
  const removeCustomIface=(idx)=>setFormState(f=>({...f,
    customIfaces:f.customIfaces.filter((_,i)=>i!==idx)}));
  const updateCustomIface=(idx,key,val)=>setFormState(f=>{
    const ifaces=[...f.customIfaces];
    ifaces[idx]={...ifaces[idx],[key]:val};
    return {...f,customIfaces:ifaces};
  });

  const parseDatasheet=()=>{
    const text=formState.datasheetText;const specs={...formState.specs};
    const vm=text.match(/(\d+[.,]?\d*)\s*(V|Vcc|VDC|VAC|volts?)/gi);
    if(vm&&formState.category==='fechadura') specs.tensao=vm[0].replace(/[^\d.,]/g,'').replace(',','.').substring(0,5)+' V';
    const cm=text.match(/(\d+[.,]?\d*)\s*(A|mA|ampere)/gi);
    if(cm&&formState.category==='fechadura') specs.corrente=cm[0].replace(/[^\d.,]/g,'').replace(',','.')+' A';
    const pm=text.match(/(\d+[.,]?\d*)\s*(W|VA|watts?)/gi);
    if(pm){const v=pm[0].replace(/[^\d.,]/g,'').replace(',','.');
      if(formState.category==='fonte_energia')specs.potencia=v+' W';
      if(formState.category==='nobreak')specs.potencia_w=parseInt(v)||0;}
    const rm=text.match(/(\d+)\s*MP/i);if(rm&&formState.category==='camera')specs.resolucao=rm[1]+'MP';
    const ptm=text.match(/(\d+)\s*(portas?|ports?)/i);
    if(ptm){const n=parseInt(ptm[1]);if(formState.category==='switch_rede')specs.portas=n;}
    const ipm=text.match(/IP\s*(\d{2})/i);if(ipm&&formState.category==='camera')specs.ip_rating='IP '+ipm[1];
    setFormState(f=>({...f,specs}));
  };

  const handleSave=()=>{
    if(!formState.brand||!formState.model||!formState.baseDeviceType){alert('Preencha marca, modelo e tipo base');return;}
    // Saving override for a default device
    if(editingDevice?._isDefault){
      const key=editingDevice._originalKey;
      const ov={...deviceOverrides};
      ov[key]={name:formState.brand+' '+formState.model,brand:formState.brand,model:formState.model,
        descricao:formState.descricao,referencia:formState.referencia,preco:formState.preco,
        specs:formState.specs,customIfaces:formState.customIfaces.filter(i=>i.label),
        datasheetText:formState.datasheetText,
        customIcon:formState.customIcon||'',customColor:formState.customColor||''};
      setDeviceOverrides(ov);
      saveDeviceOverrides(ov);
      onRefreshDefaults?.();
      setStep(0);setEditingDevice(null);
      setFormState({category:'camera',baseDeviceType:'',brand:'',model:'',descricao:'',referencia:'',preco:'',specs:{},datasheetText:'',customIcon:'',customColor:'',customIfaces:[]});
      return;
    }
    // Normal custom device save
    const ts=Date.now();const devId=editingDevice?.id||('custom_'+ts);const devKey=editingDevice?.key||devId;
    const customDev={id:devId,key:devKey,name:formState.brand+' '+formState.model,
      category:formState.category,deviceType:formState.baseDeviceType,
      brand:formState.brand,model:formState.model,descricao:formState.descricao,
      referencia:formState.referencia,preco:formState.preco,specs:formState.specs,
      customIfaces:formState.customIfaces.filter(i=>i.label),
      customIcon:formState.customIcon||'',customColor:formState.customColor||'',
      createdAt:new Date().toISOString().split('T')[0],datasheetText:formState.datasheetText};
    onSave(customDev);setStep(0);setEditingDevice(null);
    setFormState({category:'camera',baseDeviceType:'',brand:'',model:'',descricao:'',referencia:'',preco:'',specs:{},datasheetText:'',customIcon:'',customColor:'',customIfaces:[]});
  };

  // Edit a default device (override in localStorage)
  const startEditDefault=(item,cat)=>{
    setEditingDevice({...item, _isDefault:true, _originalKey:item.key});
    const override=deviceOverrides[item.key]||{};
    setFormState({
      category:catKeyFromLabel(cat.cat)||'camera',
      baseDeviceType:item.key,
      brand:override.brand||item.ref?.split(',')[0]?.trim()||item.name.split(' ')[0]||'',
      model:override.model||item.name,
      descricao:override.descricao||'',
      referencia:override.referencia||item.ref||'',
      preco:override.preco||'',
      specs:override.specs||item.props||{},
      datasheetText:override.datasheetText||'',
      customIcon:override.customIcon||'',customColor:override.customColor||'',
      customIfaces:override.customIfaces||[]
    });
    setStep(3);
  };

  const catKeyFromLabel=(label)=>{
    const map={'CFTV IP':'camera','CFTV IP — NVR':'gravador',
      'Controle de Acesso':'acesso','Intrusão — Barreiras':'sensor',
      'Automatizadores':'automatizador','Rede':'switch_rede','Wi-Fi':'wifi',
      'Infraestrutura':'infra','Periféricos':'periferico',
      // Legacy category names (backward compat)
      'CFTV Analógico':'camera','Fechaduras':'fechadura',
      'Alarme':'alarme','Sensores':'sensor','Switches e Rede':'switch_rede',
      'Gravadores':'gravador','Fontes de Energia':'fonte_energia','Nobreaks':'nobreak'};
    return map[label]||'camera';
  };

  const hideDefaultDevice=(key)=>{
    if(!confirm('Ocultar este dispositivo padrão? Você pode restaurá-lo depois.')) return;
    const updated=[...hiddenDevices,key];
    setHiddenDevices(updated);
    saveHiddenDevices(updated);
    onRefreshDefaults?.();
  };

  const restoreDefaultDevice=(key)=>{
    const updated=hiddenDevices.filter(k=>k!==key);
    setHiddenDevices(updated);
    saveHiddenDevices(updated);
    // Also remove override if exists
    const ov={...deviceOverrides};
    delete ov[key];
    setDeviceOverrides(ov);
    saveDeviceOverrides(ov);
    onRefreshDefaults?.();
  };

  const hiddenFamSet=new Set(hiddenFamilies);
  const toggleFamily=(catName)=>{
    const updated=hiddenFamSet.has(catName)?hiddenFamilies.filter(c=>c!==catName):[...hiddenFamilies,catName];
    setHiddenFamilies(updated);
    saveHiddenFamilies(updated);
    onRefreshDefaults?.();
  };
  const showAllFamilies=()=>{setHiddenFamilies([]);saveHiddenFamilies([]);onRefreshDefaults?.();};

  const startEdit=(dev)=>{
    setEditingDevice(dev);
    setFormState({category:dev.category,baseDeviceType:dev.deviceType,brand:dev.brand,model:dev.model,
      descricao:dev.descricao,referencia:dev.referencia,preco:dev.preco,specs:dev.specs||{},
      datasheetText:dev.datasheetText||'',customIcon:dev.customIcon||'',customColor:dev.customColor||'',
      customIfaces:dev.customIfaces||[]});
    setStep(3);
  };

  // ── STEP INDICATOR BAR ──
  const renderStepBar=()=>{
    if(step<1)return null;
    return <div style={{display:'flex',alignItems:'center',gap:0,marginBottom:20,padding:'0 4px'}}>
      {WIZARD_STEPS.map((s,i)=>{
        const isActive=step===s.id;const isDone=step>s.id;
        const color=isDone?'#22c55e':isActive?'var(--laranja)':'#d1d5db';
        return <React.Fragment key={s.id}>
          {i>0&&<div style={{flex:1,height:2,background:isDone?'#22c55e':'#e5e8eb',margin:'0 2px'}}/>}
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,minWidth:50,cursor:isDone?'pointer':'default',opacity:(step<s.id)?.5:1}}
            onClick={()=>{if(isDone)setStep(s.id);}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:isActive?'var(--laranja)':isDone?'#22c55e':'#f3f4f6',
              border:`2px solid ${color}`,display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:12,fontWeight:700,color:isActive||isDone?'#fff':'#9ca3af',transition:'.2s'}}>
              {isDone?'✓':s.icon}
            </div>
            <span style={{fontSize:8,fontWeight:isActive?700:500,color:isActive?'var(--azul)':'#9ca3af',textAlign:'center',lineHeight:1.1}}>{s.label}</span>
          </div>
        </React.Fragment>;
      })}
    </div>;
  };

  const renderNavButtons=(canNext=true,nextLabel='Próximo →')=>(
    <div style={{display:'flex',gap:8,marginTop:16,borderTop:'1px solid #e5e8eb',paddingTop:12}}>
      <button className="mc-btn mc-btn-secondary" style={{flex:1,fontSize:12}} onClick={()=>setStep(step<=1?0:step-1)}>
        ← {step<=1?'Lista':'Voltar'}
      </button>
      {step<6&&<button className="mc-btn mc-btn-primary" style={{flex:1,fontSize:12}} disabled={!canNext}
        onClick={()=>setStep(step+1)}>{nextLabel}</button>}
      {step===6&&<button className="mc-btn mc-btn-primary" style={{flex:1,fontSize:12,background:'#22c55e'}}
        onClick={handleSave}>{editingDevice?'✓ Atualizar':'✓ Criar'} Equipamento</button>}
    </div>
  );

  // ── STEP 0: DEVICE LIST ──
  if(step===0){
    const allDefDevices=DEVICE_LIB.flatMap(cat=>cat.items.map(item=>({...item,_cat:cat})));
    const filteredDef=allDefDevices.filter(item=>{
      if(defCatFilter!=='all'&&catKeyFromLabel(item._cat.cat)!==defCatFilter) return false;
      if(defSearch&&!item.name.toLowerCase().includes(defSearch.toLowerCase())&&!item.key.includes(defSearch.toLowerCase())&&!(item.ref||'').toLowerCase().includes(defSearch.toLowerCase())) return false;
      return true;
    });
    const hiddenSet=new Set(hiddenDevices);

    return <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:'min(760px, calc(100vw - 24px))',maxHeight:'85vh',overflow:'auto'}}>
        <h3 style={{fontSize:16,marginBottom:4}}>📦 Repositório de Equipamentos</h3>
        {/* Tabs */}
        <div style={{display:'flex',gap:0,marginBottom:12,borderBottom:'2px solid #e5e8eb'}}>
          <button onClick={()=>setRepoTab('custom')} style={{padding:'8px 16px',fontSize:12,fontWeight:600,
            border:'none',background:'transparent',cursor:'pointer',borderBottom:repoTab==='custom'?'2px solid var(--azul2)':'2px solid transparent',
            color:repoTab==='custom'?'var(--azul2)':'var(--cinza)',marginBottom:-2}}>
            Customizados ({customDevices.length})
          </button>
          <button onClick={()=>setRepoTab('default')} style={{padding:'8px 16px',fontSize:12,fontWeight:600,
            border:'none',background:'transparent',cursor:'pointer',borderBottom:repoTab==='default'?'2px solid var(--azul2)':'2px solid transparent',
            color:repoTab==='default'?'var(--azul2)':'var(--cinza)',marginBottom:-2}}>
            Padrão ({allDefDevices.length})
          </button>
        </div>

        {/* CUSTOM TAB */}
        {repoTab==='custom'&&<>
          <p style={{fontSize:11,color:'var(--cinza)',margin:'0 0 12px'}}>Seus equipamentos personalizados. Clique em "+ Novo" para cadastrar.</p>
          <div style={{maxHeight:360,overflowY:'auto',marginBottom:16}}>
            {customDevices.length===0?
              <div style={{textAlign:'center',padding:'40px 16px',color:'var(--cinza)',fontSize:13}}>
                Nenhum equipamento ainda.<br/>O assistente vai guiar você passo a passo.
              </div>:
              customDevices.map(dev=>{
                const cc=categoryColors[dev.category]||'#999';
                return <div key={dev.id} style={{padding:12,marginBottom:8,background:'#f8f9fa',borderRadius:8,
                  borderLeft:`4px solid ${cc}`,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:8,background:cc+'15',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {ICONS[dev.deviceType]?.(cc)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:'var(--azul)'}}>{dev.name}</div>
                    <div style={{fontSize:10,color:'var(--cinza)',marginTop:2}}>
                      <span style={{background:cc+'20',color:cc,padding:'1px 6px',borderRadius:3,fontWeight:600,fontSize:9}}>{categoryLabels[dev.category]}</span>
                      {dev.referencia&&<span style={{marginLeft:6}}>SKU: {dev.referencia}</span>}
                      {dev.customIfaces?.length>0&&<span style={{marginLeft:6}}>+{dev.customIfaces.length} interfaces</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:4}}>
                    <button onClick={()=>startEdit(dev)} style={{padding:'5px 12px',fontSize:10,background:'var(--azul2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Editar</button>
                    <button onClick={()=>onDelete(dev.key)} style={{padding:'5px 12px',fontSize:10,background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>×</button>
                  </div>
                </div>;
              })}
          </div>
        </>}

        {/* DEFAULT TAB */}
        {repoTab==='default'&&<>
          <p style={{fontSize:11,color:'var(--cinza)',margin:'0 0 8px'}}>Dispositivos da biblioteca padrão. Edite para personalizar specs ou oculte os que não utiliza.</p>
          {/* Family manager toggle */}
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}>
            <button onClick={()=>setShowFamilyManager(!showFamilyManager)}
              style={{padding:'5px 10px',fontSize:10,fontWeight:600,border:'1px solid #94a3b8',borderRadius:5,cursor:'pointer',
                background:showFamilyManager?'var(--azul2)':'#f8fafc',color:showFamilyManager?'#fff':'#475569',transition:'.15s'}}>
              👁️ Famílias ({DEVICE_LIB.length-hiddenFamilies.length}/{DEVICE_LIB.length})
            </button>
            {hiddenFamilies.length>0&&(
              <button onClick={showAllFamilies}
                style={{padding:'5px 10px',fontSize:10,fontWeight:600,border:'none',borderRadius:5,cursor:'pointer',
                  background:'#dbeafe',color:'#2563eb'}}>
                Exibir todas
              </button>
            )}
          </div>
          {showFamilyManager&&(
            <div style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:10,marginBottom:10}}>
              <div style={{fontSize:10,fontWeight:700,color:'var(--azul)',marginBottom:6}}>Visibilidade de famílias na paleta</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:4}}>
                {DEVICE_LIB.map(cat=>{
                  const isHidden=hiddenFamSet.has(cat.cat);
                  return (
                    <div key={cat.cat} onClick={()=>toggleFamily(cat.cat)}
                      style={{display:'flex',alignItems:'center',gap:6,padding:'5px 8px',borderRadius:6,cursor:'pointer',
                        background:isHidden?'#fef2f2':'#f0fdf4',border:`1px solid ${isHidden?'#fca5a5':'#bbf7d0'}`,transition:'.12s',opacity:isHidden?.6:1}}>
                      <div style={{width:22,height:14,borderRadius:7,background:isHidden?'#e5e7eb':'#22c55e',
                        position:'relative',transition:'.15s',flexShrink:0}}>
                        <div style={{width:10,height:10,borderRadius:5,background:'#fff',position:'absolute',top:2,
                          left:isHidden?2:10,transition:'.15s',boxShadow:'0 1px 2px rgba(0,0,0,.2)'}}/>
                      </div>
                      <div style={{width:6,height:6,borderRadius:'50%',background:cat.color,flexShrink:0}}/>
                      <span style={{fontSize:9,fontWeight:600,color:isHidden?'#9ca3af':'#374151',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cat.cat}</span>
                    </div>
                  );
                })}
              </div>
              {hiddenFamilies.length>0&&(
                <div style={{marginTop:6,fontSize:9,color:'#dc2626',textAlign:'center'}}>
                  {hiddenFamilies.length} família{hiddenFamilies.length!==1?'s':''} oculta{hiddenFamilies.length!==1?'s':''}
                </div>
              )}
            </div>
          )}
          <div style={{display:'flex',gap:6,marginBottom:10,flexWrap:'wrap'}}>
            <input value={defSearch} onChange={e=>setDefSearch(e.target.value)} placeholder="Buscar..."
              style={{flex:1,minWidth:120,fontSize:11,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:5}}/>
            <select value={defCatFilter} onChange={e=>setDefCatFilter(e.target.value)}
              style={{fontSize:11,padding:'5px 8px',border:'1px solid #d1d5db',borderRadius:5}}>
              <option value="all">Todas categorias</option>
              {Object.entries(categoryLabels).map(([k,v])=><option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={{maxHeight:340,overflowY:'auto',marginBottom:16}}>
            {filteredDef.length===0?
              <div style={{textAlign:'center',padding:'30px 16px',color:'var(--cinza)',fontSize:12}}>Nenhum dispositivo encontrado.</div>:
              filteredDef.map(item=>{
                const cc=item._cat.color;const isHidden=hiddenSet.has(item.key);const isOverridden=!!deviceOverrides[item.key];
                const displayName=isOverridden?(deviceOverrides[item.key].name||item.name):item.name;
                return <div key={item.key} style={{padding:10,marginBottom:6,background:isHidden?'#fef2f2':'#f8f9fa',borderRadius:8,
                  borderLeft:`4px solid ${isHidden?'#fca5a5':cc}`,display:'flex',alignItems:'center',gap:10,opacity:isHidden?.5:1}}>
                  <div style={{width:36,height:36,borderRadius:8,background:cc+'15',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    {ICONS[item.icon||item.key]?.(cc)}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontWeight:700,fontSize:12,color:'var(--azul)',display:'flex',alignItems:'center',gap:4}}>
                      {displayName}
                      {isOverridden&&<span style={{fontSize:8,background:'#dbeafe',color:'#2563eb',padding:'1px 5px',borderRadius:3}}>editado</span>}
                      {isHidden&&<span style={{fontSize:8,background:'#fee2e2',color:'#dc2626',padding:'1px 5px',borderRadius:3}}>oculto</span>}
                    </div>
                    <div style={{fontSize:9,color:'var(--cinza)',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                      {item._cat.cat} {item.ref?`• ${item.ref}`:''} {Object.entries(item.props||{}).slice(0,3).map(([_k,v])=>`• ${v}`).join(' ')}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:4,flexShrink:0}}>
                    {isHidden?
                      <button onClick={()=>restoreDefaultDevice(item.key)} style={{padding:'4px 10px',fontSize:9,background:'#dcfce7',color:'#16a34a',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Restaurar</button>:
                      <>
                        <button onClick={()=>startEditDefault(item,item._cat)} style={{padding:'4px 10px',fontSize:9,background:'var(--azul2)',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Editar</button>
                        <button onClick={()=>hideDefaultDevice(item.key)} style={{padding:'4px 10px',fontSize:9,background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:5,cursor:'pointer',fontWeight:600}}>Ocultar</button>
                      </>
                    }
                  </div>
                </div>;
              })}
          </div>
          {hiddenDevices.length>0&&<p style={{fontSize:10,color:'var(--cinza)',marginBottom:8}}>
            {hiddenDevices.length} dispositivo(s) oculto(s). Use o filtro para encontrá-los e restaurar.
          </p>}
        </>}

        <div style={{display:'flex',gap:8}}>
          <button className="mc-btn mc-btn-secondary" onClick={onClose} style={{fontSize:12}}>Fechar</button>
          <button className="mc-btn mc-btn-primary" onClick={()=>{setStep(1);setEditingDevice(null);
            setFormState({category:'camera',baseDeviceType:'',brand:'',model:'',descricao:'',referencia:'',preco:'',specs:{},datasheetText:'',customIcon:'',customColor:'',customIfaces:[]});}}
            style={{fontSize:12}}>+ Novo equipamento</button>
        </div>
      </div>
    </div>;
  }

  // ── WIZARD CONTAINER ──
  return <div className="modal-overlay" onClick={onClose}>
    <div className="modal-card" onClick={e=>e.stopPropagation()} style={{maxWidth:'min(620px, calc(100vw - 24px))',maxHeight:'88vh',overflow:'auto'}}>
      {renderStepBar()}

      {/* STEP 1: CATEGORY */}
      {step===1&&<>
        <h3 style={{fontSize:14,marginBottom:12}}>Selecione a categoria</h3>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
          {Object.entries(categoryLabels).map(([cat,label])=>{
            const cc=categoryColors[cat];const sel=formState.category===cat;
            return <button key={cat} onClick={()=>{handleFieldChange('category',cat);handleFieldChange('baseDeviceType','');}}
              style={{padding:14,border:`2px solid ${sel?cc:'#e5e8eb'}`,background:sel?cc+'10':'#fafafa',borderRadius:10,
                fontSize:12,fontWeight:600,cursor:'pointer',transition:'.15s',textAlign:'left',display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:18}}>{categoryIcons[cat]}</span>
              <span style={{color:sel?cc:'#374151'}}>{label}</span>
            </button>;
          })}
        </div>
        {renderNavButtons(!!formState.category)}
      </>}

      {/* STEP 2: BASE DEVICE */}
      {step===2&&<>
        <h3 style={{fontSize:14,marginBottom:4}}>Tipo base: {categoryLabels[formState.category]}</h3>
        <p style={{fontSize:10,color:'var(--cinza)',margin:'0 0 12px'}}>Herda ícone e interfaces padrão. Você poderá adicionar mais interfaces depois.</p>
        <div style={{maxHeight:280,overflowY:'auto'}}>
          {getCategoryDevices(formState.category).map(dev=>{
            const sel=formState.baseDeviceType===dev.key;const cc=categoryColors[formState.category];
            const ifaces=getDeviceInterfaces(dev.key)||[];
            return <button key={dev.key} onClick={()=>handleFieldChange('baseDeviceType',dev.key)}
              style={{display:'flex',width:'100%',textAlign:'left',padding:12,marginBottom:6,
                border:`2px solid ${sel?cc:'#e5e8eb'}`,background:sel?cc+'08':'#fafafa',borderRadius:8,cursor:'pointer',alignItems:'center',gap:10}}>
              <div style={{width:36,height:36,borderRadius:8,background:'#f3f4f6',display:'flex',alignItems:'center',justifyContent:'center'}}>
                {ICONS[dev.key]?.(sel?cc:'#6b7280')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,color:sel?cc:'var(--azul)',fontSize:12}}>{dev.name}</div>
                <div style={{fontSize:9,color:'var(--cinza)',marginTop:2}}>
                  {ifaces.length} interface(s) • {ifaces.filter(i=>i.required).length} obrigatória(s)
                </div>
              </div>
              {sel&&<span style={{color:cc,fontWeight:700,fontSize:14}}>✓</span>}
            </button>;
          })}
        </div>
        {renderNavButtons(!!formState.baseDeviceType)}
      </>}

      {/* STEP 3: GENERAL DATA + ICON/COLOR */}
      {step===3&&<>
        <h3 style={{fontSize:14,marginBottom:12,color:'#1f2937'}}>Dados do equipamento</h3>
        <div style={{maxHeight:400,overflowY:'auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Marca *</label>
              <input value={formState.brand} onChange={e=>handleFieldChange('brand',e.target.value)} placeholder="Ex: Intelbras, Hikvision"
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Modelo *</label>
              <input value={formState.model} onChange={e=>handleFieldChange('model',e.target.value)} placeholder="Ex: VIP 3230 D"
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>
            </div>
          </div>

          {/* Icon & Color selection */}
          <div style={{marginBottom:12,padding:10,background:'#f8fafc',borderRadius:8,border:'1px solid #e2e8f0'}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
              <div style={{width:44,height:44,borderRadius:10,
                background:(formState.customColor||categoryColors[formState.category])+'15',
                border:`2px solid ${formState.customColor||categoryColors[formState.category]}`,
                display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                {ICONS[formState.customIcon||formState.baseDeviceType]?.(formState.customColor||categoryColors[formState.category])}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:11,fontWeight:700,color:'#374151',marginBottom:4}}>Ícone e Cor</div>
                <div style={{fontSize:9,color:'#6b7280'}}>Personalize a aparência do equipamento no canvas</div>
              </div>
            </div>
            {/* Color palette */}
            <div style={{marginBottom:6}}>
              <label style={{fontSize:9,fontWeight:600,color:'#64748b',marginBottom:3,display:'block'}}>Cor</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {COLOR_PALETTE.map(c=>(
                  <div key={c} onClick={()=>handleFieldChange('customColor',formState.customColor===c?'':c)}
                    style={{width:20,height:20,borderRadius:4,background:c,cursor:'pointer',
                      border:formState.customColor===c?'2px solid #1e293b':'2px solid transparent',
                      boxShadow:formState.customColor===c?'0 0 0 2px #fff, 0 0 0 4px '+c:'none',
                      transition:'.1s'}}/>
                ))}
              </div>
            </div>
            {/* Icon bank */}
            <div>
              <label style={{fontSize:9,fontWeight:600,color:'#64748b',marginBottom:3,display:'block'}}>Ícone</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:3,maxHeight:100,overflowY:'auto'}}>
                {ICON_BANK.map(ib=>{
                  const sel=formState.customIcon===ib.id;
                  const cc=formState.customColor||categoryColors[formState.category];
                  return <div key={ib.id} title={ib.label}
                    onClick={()=>handleFieldChange('customIcon',sel?'':ib.id)}
                    style={{width:32,height:32,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',
                      cursor:'pointer',background:sel?cc+'20':'#fff',border:sel?`2px solid ${cc}`:'1px solid #e2e8f0',
                      transition:'.1s'}}>
                    <div style={{transform:'scale(0.65)'}}>{ICONS[ib.id]?.(sel?cc:'#94a3b8')}</div>
                  </div>;
                })}
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
            <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Descrição</label>
            <textarea value={formState.descricao} onChange={e=>handleFieldChange('descricao',e.target.value)}
              style={{minHeight:50,fontSize:11,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff',resize:'vertical'}} placeholder="Breve descrição do equipamento"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Referência (SKU)</label>
              <input value={formState.referencia} onChange={e=>handleFieldChange('referencia',e.target.value)}
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:4}}>
              <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Preço (R$)</label>
              <input value={formState.preco} onChange={e=>handleFieldChange('preco',e.target.value)} type="number"
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>Datasheet (colar texto)</label>
            <textarea value={formState.datasheetText} onChange={e=>handleFieldChange('datasheetText',e.target.value)}
              style={{minHeight:60,fontSize:9,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff',resize:'vertical'}} placeholder="Cole texto do datasheet para extração automática"/>
            {formState.datasheetText&&<button onClick={parseDatasheet}
              style={{marginTop:4,padding:'4px 10px',fontSize:9,background:'var(--azul2)',color:'#fff',border:'none',borderRadius:4,cursor:'pointer'}}>
              🔍 Extrair specs</button>}
          </div>
        </div>
        {renderNavButtons(!!(formState.brand&&formState.model))}
      </>}

      {/* STEP 4: INTERFACES (Painel de Recursos) */}
      {step===4&&<>
        <h3 style={{fontSize:14,marginBottom:4}}>Painel de Recursos — Conexões</h3>
        <p style={{fontSize:10,color:'var(--cinza)',margin:'0 0 10px'}}>
          Defina as interfaces de conexão. Cada tipo tem cardinalidade: <b>1:1</b> (uma conexão por porta), <b>N:1</b> (várias entradas na mesma porta), <b>1:N</b> (uma saída alimenta vários).
        </p>

        {/* Inherited interfaces table */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--azul)',marginBottom:6}}>Interfaces do tipo base ({formState.baseDeviceType})</div>
          <div style={{border:'1px solid #e2e8f0',borderRadius:6,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'110px 1fr 50px 50px',background:'#f1f5f9',padding:'4px 8px',fontSize:8,fontWeight:700,color:'#64748b',textTransform:'uppercase',letterSpacing:'0.5px'}}>
              <span>Tipo</span><span>Descrição</span><span>Card.</span><span>Status</span>
            </div>
            {(getDeviceInterfaces(formState.baseDeviceType)||[]).map((iface,i)=>{
              const card=INTERFACE_CARDINALITY[iface.type]||'1:1';
              const cardColor=card==='N:1'?'#059669':card==='1:N'?'#d97706':'#6b7280';
              return <div key={i} style={{display:'grid',gridTemplateColumns:'110px 1fr 50px 50px',padding:'5px 8px',fontSize:10,
                borderTop:'1px solid #f1f5f9',alignItems:'center',background:i%2===0?'#fff':'#fafbfc'}}>
                <span style={{fontWeight:600,color:'#16a34a',fontSize:9}}>{iface.type}</span>
                <span style={{color:'#374151',fontSize:9,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{iface.label}</span>
                <span style={{fontSize:8,fontWeight:700,color:cardColor,background:cardColor+'15',padding:'1px 4px',borderRadius:3,textAlign:'center'}}>{card}</span>
                <span style={{fontSize:8,color:iface.required?'#dc2626':'#9ca3af'}}>{iface.required?'obrig.':'opc.'}</span>
              </div>;
            })}
          </div>
        </div>

        {/* Custom interfaces */}
        <div style={{marginBottom:8}}>
          <div style={{fontSize:10,fontWeight:700,color:'var(--laranja)',marginBottom:6,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span>Interfaces adicionais</span>
            <button onClick={addCustomIface} style={{padding:'3px 10px',fontSize:9,background:'var(--laranja)',color:'#000',border:'none',borderRadius:4,cursor:'pointer',fontWeight:700}}>+ Adicionar</button>
          </div>
          {formState.customIfaces.length===0&&<div style={{fontSize:10,color:'#9ca3af',padding:8,textAlign:'center',background:'#fafafa',borderRadius:6,border:'1px dashed #d1d5db'}}>
            Nenhuma interface adicional. Adicione RS-485, Wiegand, zonas de alarme, saída vídeo, etc.
          </div>}
          {formState.customIfaces.map((iface,idx)=>{
            const opt=IFACE_TYPE_OPTIONS.find(o=>o.value===iface.type);
            const card=opt?.card||INTERFACE_CARDINALITY[iface.type]||'1:1';
            const cardColor=card==='N:1'?'#059669':card==='1:N'?'#d97706':'#6b7280';
            return <div key={idx} style={{padding:8,marginBottom:6,background:'#fffbeb',borderRadius:6,border:'1px solid #fde68a'}}>
              <div style={{display:'flex',gap:6,marginBottom:4,alignItems:'center'}}>
                <select value={iface.type} onChange={e=>updateCustomIface(idx,'type',e.target.value)}
                  style={{flex:1,fontSize:10,padding:'3px 4px',borderRadius:4,border:'1px solid #d1d5db'}}>
                  {IFACE_TYPE_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label} ({o.card})</option>)}
                </select>
                <span style={{fontSize:8,fontWeight:700,color:cardColor,background:cardColor+'15',padding:'2px 6px',borderRadius:3,whiteSpace:'nowrap'}}>{card}</span>
                <label style={{fontSize:9,display:'flex',alignItems:'center',gap:3,whiteSpace:'nowrap'}}>
                  <input type="checkbox" checked={iface.required} onChange={e=>updateCustomIface(idx,'required',e.target.checked)}/>Obrig.
                </label>
                <button onClick={()=>removeCustomIface(idx)} style={{fontSize:12,color:'#dc2626',background:'none',border:'none',cursor:'pointer',fontWeight:700}}>×</button>
              </div>
              <input value={iface.label} onChange={e=>updateCustomIface(idx,'label',e.target.value)}
                placeholder="Descrição (ex: Entrada botoeira NA/NF, Saída HDMI)" style={{width:'100%',fontSize:10,padding:'3px 6px',borderRadius:4,border:'1px solid #d1d5db',marginBottom:4}}/>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {CABLE_OPTIONS.map(o=>{
                  const sel=(iface.cables||[]).includes(o.value);
                  return <div key={o.value} onClick={()=>{
                    const cables=sel?(iface.cables||[]).filter(c=>c!==o.value):[...(iface.cables||[]),o.value];
                    updateCustomIface(idx,'cables',cables);
                  }} style={{fontSize:8,padding:'2px 6px',borderRadius:3,cursor:'pointer',fontWeight:sel?700:400,
                    background:sel?'#dbeafe':'#f3f4f6',color:sel?'#1d4ed8':'#6b7280',
                    border:sel?'1px solid #93c5fd':'1px solid #e5e7eb',transition:'.1s'}}>
                    {o.label}
                  </div>;
                })}
              </div>
            </div>;
          })}
        </div>
        {renderNavButtons()}
      </>}

      {/* STEP 5: SPECS */}
      {step===5&&<>
        <h3 style={{fontSize:14,marginBottom:12,color:'#1f2937'}}>Especificações técnicas</h3>
        <div style={{maxHeight:340,overflowY:'auto'}}>
          {(EQUIPMENT_SCHEMAS[formState.category]||[]).map(field=>(
            <div key={field.key} style={{display:'flex',flexDirection:'column',gap:4,marginBottom:10}}>
              <label style={{fontSize:11,fontWeight:600,color:'#374151'}}>{field.label}{field.required?' *':''}{field.unit?` (${field.unit})`:''}</label>
              {field.type==='text'&&<input value={formState.specs[field.key]||''} onChange={e=>handleSpecChange(field.key,e.target.value)}
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>}
              {field.type==='number'&&<input value={formState.specs[field.key]||''} onChange={e=>handleSpecChange(field.key,e.target.value)} type="number"
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}/>}
              {field.type==='select'&&<select value={formState.specs[field.key]||''} onChange={e=>handleSpecChange(field.key,e.target.value)}
                style={{fontSize:12,padding:'6px 8px',borderRadius:5,border:'1px solid #d1d5db',color:'#1f2937',background:'#fff'}}>
                <option value="">Selecionar...</option>{field.options.map(o=><option key={o} value={o}>{o}</option>)}</select>}
              {field.type==='bool'&&<label style={{display:'flex',alignItems:'center',gap:6}}>
                <input type="checkbox" checked={!!formState.specs[field.key]} onChange={e=>handleSpecChange(field.key,e.target.checked)}/><span style={{fontSize:11,color:'#374151'}}>{field.label}</span></label>}
            </div>
          ))}
          {(EQUIPMENT_SCHEMAS[formState.category]||[]).length===0&&<div style={{textAlign:'center',padding:20,color:'#9ca3af',fontSize:11}}>Sem especificações padrão para esta categoria.</div>}
        </div>
        {renderNavButtons()}
      </>}

      {/* STEP 6: REVIEW */}
      {step===6&&<>
        <h3 style={{fontSize:14,marginBottom:12,color:'#1f2937'}}>Revisão final</h3>
        <div style={{background:'#f8f9fa',borderRadius:10,padding:14,marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{width:44,height:44,borderRadius:10,
              background:(formState.customColor||categoryColors[formState.category])+'15',
              border:`2px solid ${formState.customColor||categoryColors[formState.category]}`,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {ICONS[formState.customIcon||formState.baseDeviceType]?.(formState.customColor||categoryColors[formState.category])}
            </div>
            <div>
              <div style={{fontWeight:700,fontSize:14,color:'#1e40af'}}>{formState.brand} {formState.model}</div>
              <div style={{fontSize:10,color:'#6b7280'}}>
                <span style={{background:categoryColors[formState.category]+'20',color:categoryColors[formState.category],padding:'1px 6px',borderRadius:3,fontWeight:600,fontSize:9}}>{categoryLabels[formState.category]}</span>
                <span style={{marginLeft:6}}>Base: {formState.baseDeviceType}</span>
              </div>
            </div>
          </div>
          {formState.descricao&&<p style={{fontSize:10,color:'#6b7280',margin:'0 0 8px'}}>{formState.descricao}</p>}
          <div style={{display:'flex',gap:12,flexWrap:'wrap',fontSize:10,color:'#374151'}}>
            {formState.referencia&&<span>SKU: {formState.referencia}</span>}
            {formState.preco&&<span>R$ {formState.preco}</span>}
          </div>
        </div>

        {/* Interfaces summary */}
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>Interfaces ({(getDeviceInterfaces(formState.baseDeviceType)||[]).length} base + {formState.customIfaces.filter(i=>i.label).length} custom)</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {(getDeviceInterfaces(formState.baseDeviceType)||[]).map((iface,i)=>
              <span key={i} style={{fontSize:8,background:'#dcfce7',color:'#166534',padding:'2px 6px',borderRadius:3}}>{iface.type}: {iface.label.substring(0,30)}</span>)}
            {formState.customIfaces.filter(i=>i.label).map((iface,i)=>
              <span key={'c'+i} style={{fontSize:8,background:'#fef3c7',color:'#92400e',padding:'2px 6px',borderRadius:3}}>{iface.type}: {iface.label.substring(0,30)}</span>)}
          </div>
        </div>

        {/* Specs summary */}
        {Object.keys(formState.specs).length>0&&<div style={{marginBottom:10}}>
          <div style={{fontSize:11,fontWeight:700,marginBottom:4}}>Especificações</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
            {Object.entries(formState.specs).filter(([,v])=>v).map(([k,v])=>
              <span key={k} style={{fontSize:8,background:'#e5e8eb',color:'#374151',padding:'2px 6px',borderRadius:3}}>{k}: {String(v)}</span>)}
          </div>
        </div>}
        {renderNavButtons()}
      </>}
    </div>
  </div>;
}
