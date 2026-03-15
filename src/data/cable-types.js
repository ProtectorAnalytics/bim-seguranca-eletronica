// Cable types — data + power
export const CABLE_TYPES = [
  // Data cables
  {id:'cat5e',name:'CAT5E',color:'#3b82f6',speed:'1Gbps',maxLen:90,group:'data'},
  {id:'cat6',name:'CAT6',color:'#2563eb',speed:'10Gbps',maxLen:55,group:'data'},
  {id:'cat6a',name:'CAT6A',color:'#1d4ed8',speed:'10Gbps',maxLen:90,group:'data'},
  {id:'smf',name:'SM Fibra',color:'#f59e0b',speed:'100Gbps+',maxLen:40000,group:'data'},
  {id:'mmf',name:'MM Fibra',color:'#ef4444',speed:'10Gbps',maxLen:300,group:'data'},
  {id:'hdmi',name:'Cabo HDMI',color:'#1e293b',speed:'4K 60Hz',maxLen:15,group:'data'},
  {id:'usb',name:'Cabo USB',color:'#475569',speed:'480Mbps',maxLen:5,group:'data'},
  {id:'coaxial',name:'Coaxial RG59',color:'#374151',speed:'Analógico',maxLen:300,group:'signal'},
  {id:'wireless',name:'Wireless/Mesh',color:'#8b5cf6',speed:'WiFi6',maxLen:100,group:'data'},
  // PP Cables — standard for electronic security installations
  {id:'pp2v_05',name:'PP 2×0,50mm²',color:'#6b7280',speed:'Sinal/sensor',maxLen:30,group:'signal',vias:2,secao:0.5},
  {id:'pp2v_10',name:'PP 2×1,00mm²',color:'#6b7280',speed:'Sinal/12VDC',maxLen:60,group:'signal',vias:2,secao:1.0},
  {id:'pp2v_15',name:'PP 2×1,50mm²',color:'#9ca3af',speed:'12VDC',maxLen:100,group:'power',vias:2,secao:1.5},
  {id:'pp2v_25',name:'PP 2×2,50mm²',color:'#a3a3a3',speed:'12VDC',maxLen:180,group:'power',vias:2,secao:2.5},
  {id:'pp4v_05',name:'PP 4×0,50mm²',color:'#a855f7',speed:'Automação',maxLen:30,group:'automation',vias:4,secao:0.5},
  {id:'pp4v_10',name:'PP 4×1,00mm²',color:'#9333ea',speed:'Automação+GND',maxLen:60,group:'automation',vias:4,secao:1.0},
  {id:'pp4v_15',name:'PP 4×1,50mm²',color:'#7c3aed',speed:'Automação HD',maxLen:100,group:'automation',vias:4,secao:1.5},
  {id:'pp4v_25',name:'PP 4×2,50mm²',color:'#6d28d9',speed:'Automação+pot.',maxLen:180,group:'automation',vias:4,secao:2.5},
  // Power cables (AC)
  {id:'ac_power',name:'Cabo Força AC',color:'#dc2626',speed:'110/220V',maxLen:100,group:'power'},
  {id:'pp_flex',name:'PP/Flex 3×1,5mm²',color:'#b91c1c',speed:'AC',maxLen:50,group:'power'},
  // Cable engate (Anderson connectors)
  {id:'sb50_48v',name:'Cabo Engate SB50 (48V)',color:'#dc2626',speed:'48VDC',maxLen:3,group:'power'},
  {id:'sb50_12v',name:'Cabo Engate SB50 (12V)',color:'#ea580c',speed:'12VDC',maxLen:3,group:'power'},
];

// Route types for connection lines
export const ROUTE_TYPES = [
  {id:'straight',name:'Reto',icon:'━'},
  {id:'curve',name:'Curva',icon:'⌒'},
  {id:'angle',name:'Ângulo',icon:'⌐'},
];
