// ====================================================================
// EQUIPMENT SCHEMAS - Type-specific field definitions
// ====================================================================
export const EQUIPMENT_SCHEMAS = {
  camera: [
    {key:'resolucao',label:'Resolução',type:'select',required:false,options:['2MP','4MP','5MP','8MP','12MP']},
    {key:'lente',label:'Lente',type:'text',required:false,unit:'mm'},
    {key:'ir',label:'Alcance IR',type:'text',required:false,unit:'m'},
    {key:'poeW',label:'Consumo PoE',type:'number',required:false,unit:'W'},
    {key:'protocolo',label:'Protocolo',type:'select',required:false,options:['ONVIF','CGI']},
    {key:'ip_rating',label:'IP Rating',type:'text',required:false},
    {key:'fov',label:'Campo de visão',type:'text',required:false,unit:'°'}
  ],
  acesso: [
    {key:'faces',label:'Capacidade faces',type:'number',required:false},
    {key:'tela',label:'Tamanho tela',type:'text',required:false,unit:'polegadas'},
    {key:'protocolo',label:'Protocolo',type:'select',required:false,options:['Wiegand','RS485','TCP-IP']},
    {key:'saidas_relay',label:'Saídas relay',type:'number',required:false},
    {key:'temp',label:'Leitura temperatura',type:'bool',required:false}
  ],
  fechadura: [
    {key:'tipo',label:'Tipo',type:'select',required:false,options:['Eletroímã','Solenóide','Fail-safe','Fail-secure']},
    {key:'forca',label:'Força',type:'text',required:false,unit:'kgf'},
    {key:'tensao',label:'Tensão',type:'text',required:false,unit:'V'},
    {key:'corrente',label:'Corrente',type:'text',required:false,unit:'A'}
  ],
  alarme: [
    {key:'zonas',label:'Zonas',type:'number',required:false},
    {key:'particoes',label:'Partições',type:'number',required:false},
    {key:'comunicacao',label:'Comunicação',type:'text',required:false},
    {key:'expansivel',label:'Expansível',type:'bool',required:false}
  ],
  sensor: [
    {key:'tipo_sensor',label:'Tipo',type:'select',required:false,options:['Barreira','Magnético','Vibração']},
    {key:'alcance',label:'Alcance',type:'text',required:false,unit:'m'},
    {key:'angulo',label:'Ângulo',type:'text',required:false,unit:'°'},
    {key:'feixes',label:'Feixes',type:'number',required:false}
  ],
  switch_rede: [
    {key:'portas',label:'Portas',type:'number',required:false},
    {key:'poe_budget',label:'PoE Budget',type:'number',required:false,unit:'W'},
    {key:'throughput',label:'Throughput',type:'text',required:false},
    {key:'vlan',label:'VLAN',type:'bool',required:false},
    {key:'sfp',label:'Portas SFP',type:'number',required:false},
    {key:'tensao_entrada',label:'Tensão entrada',type:'text',required:false,unit:'V'}
  ],
  gravador: [
    {key:'canais',label:'Canais',type:'number',required:false},
    {key:'hd_max',label:'HD máximo',type:'text',required:false},
    {key:'raid',label:'RAID',type:'bool',required:false},
    {key:'resolucao_max',label:'Resolução máxima',type:'text',required:false}
  ],
  fonte_energia: [
    {key:'potencia',label:'Potência',type:'text',required:false,unit:'W'},
    {key:'tensao_saida',label:'Tensão saída',type:'text',required:false,unit:'V'},
    {key:'corrente_saida',label:'Corrente saída',type:'text',required:false,unit:'A'},
    {key:'entradas_saida',label:'Entradas/saídas',type:'number',required:false}
  ],
  nobreak: [
    {key:'potencia_va',label:'Potência VA',type:'number',required:false,unit:'VA'},
    {key:'potencia_w',label:'Potência W',type:'number',required:false,unit:'W'},
    {key:'tensao_saida',label:'Tensão saída',type:'text',required:false,unit:'V'},
    {key:'autonomia_base',label:'Autonomia base',type:'text',required:false}
  ],
  automatizador: [
    {key:'tipo_motor',label:'Tipo',type:'select',required:false,options:['Deslizante','Basculante','Pivotante','Cancela','Porta']},
    {key:'peso_max',label:'Peso máximo',type:'text',required:false,unit:'kg'},
    {key:'velocidade',label:'Velocidade',type:'text',required:false,unit:'m/s'},
    {key:'tensao',label:'Tensão',type:'text',required:false,unit:'V'}
  ],
  wifi: [
    {key:'padrao',label:'Padrão',type:'select',required:false,options:['Wi-Fi 5','Wi-Fi 6','Wi-Fi 6E']},
    {key:'banda',label:'Banda',type:'select',required:false,options:['2.4 GHz','5 GHz','Dual-band','Tri-band']},
    {key:'velocidade',label:'Velocidade',type:'text',required:false,unit:'Mbps'},
    {key:'cobertura',label:'Cobertura',type:'text',required:false,unit:'m²'}
  ],
  infra: [
    {key:'material',label:'Material',type:'text',required:false},
    {key:'dimensoes',label:'Dimensões',type:'text',required:false},
    {key:'peso',label:'Peso',type:'text',required:false,unit:'kg'}
  ]
};
