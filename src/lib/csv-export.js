// ====================================================================
// CSV EXPORT — BIM Protector
// Gera CSV da lista de materiais (BOM) compatível com Excel
// Sem dependências externas
// ====================================================================

/**
 * Escapa um valor para CSV (RFC 4180)
 */
function csvEscape(val) {
  const str = String(val ?? '');
  if (str.includes('"') || str.includes(',') || str.includes(';') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Gera e baixa CSV do BOM
 * @param {Object} opts
 * @param {string} opts.projectName      — Nome do projeto
 * @param {Array}  opts.bom              — Array do BOM (de useMemo no ProjectApp)
 * @param {Array}  opts.allDevices       — Todos os dispositivos (todos os pavimentos)
 * @param {Array}  opts.connections      — Todas as conexões
 * @param {Array}  opts.floors           — Pavimentos do projeto (para pegar ambientes)
 * @param {string} opts.separator        — Separador: ',' ou ';' (padrão ';' para Excel BR)
 * @returns {{fileName:string, rows:number}}
 */
export function exportBomCSV({
  projectName = 'projeto',
  bom = [],
  allDevices = [],
  connections = [],
  floors = [],
  separator = ';',
} = {}) {
  const sep = separator;
  const lines = [];

  // Monta mapa de ambiente por deviceId
  const envMap = {};
  (floors || []).forEach(floor => {
    const envs = floor.environments || [];
    (floor.devices || []).forEach(dev => {
      if (dev.envId) {
        const env = envs.find(e => e.id === dev.envId);
        if (env) envMap[dev.id] = env.name;
      }
    });
  });

  // Conta ambientes por deviceKey
  const envByKey = {};
  allDevices.forEach(dev => {
    const env = envMap[dev.id] || '';
    if (!envByKey[dev.key]) envByKey[dev.key] = {};
    if (env) envByKey[dev.key][env] = (envByKey[dev.key][env] || 0) + 1;
  });

  // Header
  lines.push([
    '#', 'Tipo', 'Equipamento', 'Modelo / Ref', 'Qtd', 'Unidade', 'Metros', 'Ambiente(s)'
  ].map(csvEscape).join(sep));

  // ── Seção: Dispositivos ──
  const deviceItems = bom.filter(b => b.unit !== 'm');
  const cableItems = bom.filter(b => b.unit === 'm');

  if (deviceItems.length > 0) {
    lines.push(''); // linha vazia separadora
    lines.push(['', '', '=== DISPOSITIVOS ===', '', '', '', '', ''].map(csvEscape).join(sep));

    let totalDevices = 0;
    deviceItems.forEach((item, i) => {
      const envInfo = envByKey[item.key] || {};
      const envStr = Object.entries(envInfo).map(([name, count]) => `${name}(${count})`).join(' / ') || '';
      totalDevices += item.qty;

      lines.push([
        i + 1,
        'Dispositivo',
        item.name,
        item.model || item.def?.ref || item.key,
        item.qty,
        item.unit || 'pç',
        '',
        envStr
      ].map(csvEscape).join(sep));
    });

    // Subtotal dispositivos
    lines.push(['', '', 'SUBTOTAL DISPOSITIVOS', '', totalDevices, 'pç', '', ''].map(csvEscape).join(sep));
  }

  // ── Seção: Cabos ──
  if (cableItems.length > 0) {
    lines.push('');
    lines.push(['', '', '=== CABEAMENTO ===', '', '', '', '', ''].map(csvEscape).join(sep));

    let totalMeters = 0;
    let totalLances = 0;
    cableItems.forEach((item, i) => {
      const meters = item.totalMeters || item.qty;
      totalMeters += meters;
      totalLances += item.qty;

      lines.push([
        i + 1,
        'Cabo',
        item.name,
        item.def?.id || item.key,
        item.qty,
        'lances',
        `${meters}m`,
        ''
      ].map(csvEscape).join(sep));
    });

    // Subtotal cabos
    lines.push(['', '', 'SUBTOTAL CABEAMENTO', '', totalLances, 'lances', `${totalMeters}m`, ''].map(csvEscape).join(sep));
  }

  // ── Totais finais ──
  lines.push('');
  const totalDevQty = deviceItems.reduce((a, b) => a + b.qty, 0);
  const totalCableMeters = cableItems.reduce((a, b) => a + (b.totalMeters || b.qty), 0);
  lines.push([
    '', '', 'TOTAL GERAL', '',
    `${totalDevQty} dispositivos + ${cableItems.length} tipos de cabo`, '',
    `${totalCableMeters}m total`, ''
  ].map(csvEscape).join(sep));

  // ── Metadados no rodapé ──
  lines.push('');
  lines.push(['', '', `Projeto: ${projectName}`, '', '', '', '', ''].map(csvEscape).join(sep));
  lines.push(['', '', `Gerado em: ${new Date().toLocaleString('pt-BR')}`, '', '', '', '', ''].map(csvEscape).join(sep));
  lines.push(['', '', 'BIM Protector — www.protectoranalytics.com.br', '', '', '', '', ''].map(csvEscape).join(sep));

  // ── Gera o arquivo ──
  // UTF-8 BOM marker para Excel reconhecer acentos
  const BOM = '\uFEFF';
  const csvContent = BOM + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });

  const safeName = (projectName || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `BOM_${safeName}_${dateStr}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return { fileName, rows: lines.length };
}
