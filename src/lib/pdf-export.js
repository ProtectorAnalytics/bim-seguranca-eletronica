// ====================================================================
// PDF EXPORT ENGINE — BIM Protector
// Uses jsPDF + jspdf-autotable + html2canvas (lazy loaded)
// ====================================================================
import { APP_VERSION } from '@/data/constants';
import { CABLE_TYPES } from '@/data/cable-types';
import { drawFloorplanVector } from './pdf-vector';

// ── Color palette ──────────────────────────────────
const COLORS = {
  primary: [52, 152, 219],    // #3498db
  dark: [44, 62, 80],         // #2c3e50
  gray: [127, 140, 141],      // #7f8c8d
  lightGray: [236, 240, 241], // #ecf0f1
  green: [39, 174, 96],       // #27ae60
  orange: [243, 156, 18],     // #f39c12
  white: [255, 255, 255],
};

// ── Utility: draw header on each page ──────────────
function drawHeader(doc, projectName, pageNum, totalPages) {
  const w = doc.internal.pageSize.getWidth();
  // Top bar
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, w, 18, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('BIM Protector — ' + projectName, 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Página ${pageNum}/${totalPages}`, w - 14, 12, { align: 'right' });
}

// ── Utility: draw footer ──────────────────────────
function drawFooter(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...COLORS.lightGray);
  doc.line(14, h - 14, w - 14, h - 14);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(6);
  doc.text(`Gerado por BIM Protector ${APP_VERSION.full} em ${new Date().toLocaleString('pt-BR')}`, 14, h - 9);
  doc.text('www.protectoranalytics.com.br', w - 14, h - 9, { align: 'right' });
}

// ── Helper: safely get finalY from autoTable result ──
function getFinalY(result, doc, fallback) {
  if (result && typeof result.finalY === 'number') return result.finalY;
  if (doc.lastAutoTable && typeof doc.lastAutoTable.finalY === 'number') return doc.lastAutoTable.finalY;
  return fallback || 200;
}

// ── Main export function ───────────────────────────
export async function exportProjectPDF({ project, bom, allDevices, connections, validationResults = [], options = {} }) {
  const {
    includeEquipment = true,
    includeTopology = true,
    includeFloorplan = true,
    includeSummary = true,
    includeValidation = true,
    author = 'Protector Sistemas',
    company = 'Protector Sistemas',
  } = options;

  // Lazy load heavy libraries (code-splitting)
  let jspdfModule, html2canvasModule, autoTableModule;
  try {
    [jspdfModule, html2canvasModule, autoTableModule] = await Promise.all([
      import('jspdf'),
      import('html2canvas'),
      import('jspdf-autotable'),
    ]);
  } catch (loadErr) {
    throw new Error('Falha ao carregar bibliotecas de PDF: ' + loadErr.message, { cause: loadErr });
  }
  // jsPDF 2.x+ uses named export, fallback to default for compatibility
  const jsPDF = jspdfModule.jsPDF || jspdfModule.default;
  if (!jsPDF) throw new Error('jsPDF não encontrado no módulo importado');
  const html2canvas = html2canvasModule.default || html2canvasModule;
  // jspdf-autotable v5.x exports a function instead of patching prototype
  const autoTable = autoTableModule.autoTable || autoTableModule.default || autoTableModule;
  if (typeof autoTable !== 'function') throw new Error('autoTable não é uma função válida');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth(); // 210
  const h = doc.internal.pageSize.getHeight(); // 297
  let currentPage = 1;

  // ── PAGE 1: Cover ────────────────────────────────
  // Dark header band
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, w, 65, 'F');

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('Projeto de Segurança Eletrônica', 14, 30);

  // Project name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(project.name || 'Sem nome', 14, 42);

  // Version badge
  doc.setFillColor(...COLORS.primary);
  doc.roundedRect(14, 48, 30, 8, 2, 2, 'F');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text(APP_VERSION.full, 29, 53.5, { align: 'center' });

  // Scenario badge
  if (project.scenario) {
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(48, 48, 40, 8, 2, 2, 'F');
    doc.text(project.scenario, 68, 53.5, { align: 'center' });
  }

  // Client info box
  const client = project.client || {};
  let yPos = 80;

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, 72, w - 28, 55, 3, 3, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.gray);

  const clientFields = [
    ['Nome / Razão Social', client.razaoSocial || client.nome || '—'],
    ['CNPJ / CPF', client.cnpj || client.cpf || '—'],
    ['Endereço', [client.endereco, client.cidade, client.uf].filter(Boolean).join(', ') || '—'],
    ['Contato', client.contato || '—'],
    ['Telefone', client.telefone || '—'],
    ['E-mail', client.email || '—'],
  ];

  clientFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(label + ':', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(String(value), 65, yPos);
    yPos += 6;
  });

  // Project summary box
  yPos = 142;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(14, yPos - 6, w - 28, 42, 3, 3, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Projeto', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const totalCableMeters = connections.reduce((a, c) => a + (c.distance || 0), 0);
  const summaryFields = [
    ['Pavimentos', String(project.floors?.length || 0)],
    ['Dispositivos', String(allDevices.length)],
    ['Conexões', String(connections.length)],
    ['Cabeamento estimado', `${totalCableMeters}m`],
    ['Itens únicos (BOM)', String(bom.length)],
  ];

  summaryFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(label + ':', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(value, 65, yPos);
    yPos += 6;
  });

  // Footer info
  yPos = 200;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Autor: ${author}`, 14, yPos);
  doc.text(`Empresa: ${company}`, 14, yPos + 5);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos + 10);
  if (client.projetoRef) doc.text(`Ref: ${client.projetoRef}`, 14, yPos + 15);

  drawFooter(doc);

  // ── PAGE 2: Executive Summary ────────────────────
  if (includeSummary) {
    doc.addPage();
    currentPage++;

    drawHeader(doc, project.name || '', currentPage, '?');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', 14, 30);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Visão geral do projeto de segurança eletrônica', 14, 36);

    let sy = 44;

    // ── Contagem por categoria ──
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, sy - 4, w - 28, 8, 2, 2, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipamentos por Categoria', 20, sy + 2);
    sy += 10;

    // Group devices by category
    const catCounts = {};
    allDevices.forEach(d => {
      const k = d.key || '';
      let cat = 'Outros';
      if (k.startsWith('cam_')) cat = 'CFTV — Câmeras';
      else if (k.startsWith('nvr_')) cat = 'CFTV — Gravadores';
      else if (k.startsWith('sw_') || k === 'router') cat = 'Rede';
      else if (k.startsWith('wifi_') || k.startsWith('ap_')) cat = 'Wi-Fi';
      else if (k.startsWith('barreira_')) cat = 'Intrusão — Barreiras';
      else if (k === 'leitor_facial' || k === 'controladora' || k === 'fechadura' || k === 'eletroima' || k === 'leitor_tag' || k === 'leitor_biometrico' || k === 'leitor_rfid' || k.startsWith('biometrico_') || k.startsWith('tag_uhf_') || k.startsWith('catraca_') || k.startsWith('torniquete_')) cat = 'Controle de Acesso';
      else if (k.startsWith('auto_') || k.startsWith('cancela_') || k === 'motor') cat = 'Automatização';
      else if (k === 'nobreak_ac' || k === 'nobreak_dc' || k === 'fonte' || k === 'bateria_ext' || k === 'modulo_bat') cat = 'Energia';
      else if (k === 'rack' || k === 'quadro' || k === 'quadro_eletrico' || k === 'dio' || k === 'borne_sak' || k === 'patch_panel' || k === 'conversor_midia' || k === 'dps_rede' || k === 'tomada_dupla' || k === 'cabo_engate') cat = 'Infraestrutura';
      // Legacy devices from deleted families
      else if (d._legacy) cat = 'Legado';
      if (!catCounts[cat]) catCounts[cat] = 0;
      catCounts[cat]++;
    });

    const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    doc.setFontSize(9);
    catEntries.forEach(([cat, count]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      doc.text(`• ${cat}`, 22, sy);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(String(count), 100, sy);
      sy += 5.5;
    });

    // Total
    sy += 2;
    doc.setDrawColor(...COLORS.lightGray);
    doc.line(22, sy - 3, 110, sy - 3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.text(`Total: ${allDevices.length} dispositivos`, 22, sy + 1);
    sy += 12;

    // ── Cabeamento ──
    const totalCableM = connections.reduce((a, c) => a + (c.distance || 0), 0);
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, sy - 4, w - 28, 8, 2, 2, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cabeamento', 20, sy + 2);
    sy += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Total de conexões: ${connections.length}`, 22, sy);
    sy += 5.5;
    doc.text(`• Metragem total estimada: ${totalCableM}m`, 22, sy);
    sy += 5.5;

    const cableTypes = {};
    connections.forEach(c => {
      const ct = CABLE_TYPES.find(t => t.id === c.type);
      const name = ct?.name || c.type;
      if (!cableTypes[name]) cableTypes[name] = { count: 0, meters: 0 };
      cableTypes[name].count++;
      cableTypes[name].meters += c.distance || 0;
    });
    Object.entries(cableTypes).sort((a, b) => b[1].meters - a[1].meters).forEach(([name, data]) => {
      doc.text(`  → ${name}: ${data.count} lances, ${data.meters}m`, 22, sy);
      sy += 5;
    });
    sy += 6;

    // ── Validações resumo ──
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, sy - 4, w - 28, 8, 2, 2, 'F');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Status de Validação', 20, sy + 2);
    sy += 10;

    const activeAlerts = validationResults.filter(v => v.msg);
    doc.setFontSize(9);
    if (activeAlerts.length === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.green);
      doc.text('OK — Nenhum alerta ativo. Projeto dentro das boas práticas.', 22, sy);
    } else {
      const criticas = activeAlerts.filter(v => v.sev === 'CRÍTICA').length;
      const altas = activeAlerts.filter(v => v.sev === 'ALTA').length;
      const obrig = activeAlerts.filter(v => v.sev === 'OBRIGATÓRIA').length;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      if (criticas) { doc.setTextColor(231, 76, 60); doc.text(`• ${criticas} alerta(s) CRÍTICA(S)`, 22, sy); sy += 5.5; }
      if (altas) { doc.setTextColor(243, 156, 18); doc.text(`• ${altas} alerta(s) ALTA(S)`, 22, sy); sy += 5.5; }
      if (obrig) { doc.setTextColor(...COLORS.orange); doc.text(`• ${obrig} alerta(s) OBRIGATÓRIA(S)`, 22, sy); sy += 5.5; }
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(8);
      doc.text('Veja a seção de Validação para detalhes completos.', 22, sy + 2);
    }

    drawFooter(doc);
  }

  // ── PAGE: BOM (Bill of Materials) ──────────────────
  if (includeEquipment && bom.length > 0) {
    doc.addPage();
    currentPage++;

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, w, 18, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BIM Protector — ' + (project.name || ''), 14, 12);

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Materiais (BOM)', 14, 30);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(`${bom.length} itens únicos · ${allDevices.length} dispositivos · ${totalCableMeters}m de cabeamento`, 14, 36);

    // Separate devices and cables
    const deviceItems = bom.filter(b => b.unit !== 'm');
    const cableItems = bom.filter(b => b.unit === 'm');

    let tableY = 42;

    // Device table — include IP column if any device has IP configured
    const hasAnyIP = deviceItems.some(item => {
      const dev = allDevices.find(d => d.key === item.key && d.config?.ipAddress);
      return !!dev;
    });
    // Build IP map: key → list of IPs
    const ipByKey = {};
    if (hasAnyIP) {
      allDevices.forEach(d => {
        if (d.config?.ipAddress) {
          if (!ipByKey[d.key]) ipByKey[d.key] = [];
          ipByKey[d.key].push(d.config.ipAddress);
        }
      });
    }

    if (deviceItems.length > 0) {
      const devHead = hasAnyIP
        ? [['#', 'Equipamento', 'Modelo / Ref', 'IP', 'Qtd', 'Un.']]
        : [['#', 'Equipamento', 'Modelo / Ref', 'Qtd', 'Un.']];
      const devBody = deviceItems.map((item, i) => {
        const row = [
          i + 1,
          item.name,
          item.model || item.def?.ref || item.key,
        ];
        if (hasAnyIP) row.push(ipByKey[item.key]?.join(', ') || '—');
        row.push(item.qty, item.unit);
        return row;
      });
      const devColStyles = hasAnyIP ? {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 50 },
        2: { cellWidth: 50, fontSize: 6, textColor: COLORS.gray },
        3: { cellWidth: 38, fontSize: 6, fontStyle: 'normal', textColor: [41,128,185] },
        4: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 10, halign: 'center', fontSize: 6 },
      } : {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 65 },
        2: { cellWidth: 70, fontSize: 6, textColor: COLORS.gray },
        3: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 10, halign: 'center', fontSize: 6 },
      };

      const devTableResult = autoTable(doc, {
        startY: tableY,
        head: devHead,
        body: devBody,
        styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: devColStyles,
        margin: { left: 14, right: 14 },
        didDrawPage: () => drawFooter(doc),
      });

      tableY = getFinalY(devTableResult, doc, tableY + 60) + 8;
    }

    // Cable table
    if (cableItems.length > 0) {
      // Check if we need a new page
      if (tableY > h - 60) {
        doc.addPage();
        currentPage++;
        tableY = 26;
      }

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Cabeamento', 14, tableY);
      tableY += 4;

      autoTable(doc, {
        startY: tableY,
        head: [['#', 'Tipo de Cabo', 'Lances', 'Metragem Total']],
        body: cableItems.map((item, i) => [
          i + 1,
          item.name,
          item.qty,
          `${item.totalMeters || item.qty}m`
        ]),
        styles: { fontSize: 7, cellPadding: 2, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 80 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: () => drawFooter(doc),
      });
    }

    drawFooter(doc);
  }

  // ── PAGE: Floor plan capture ─────────────────────
  if (includeFloorplan) {
    const canvasEl = document.querySelector('.canvas-area');
    if (canvasEl) {
      try {
        // Temporarily style for better capture
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.style.display = 'none';

        const canvas = await html2canvas(canvasEl, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        if (overlay) overlay.style.display = '';

        doc.addPage('a4', 'landscape');
        currentPage++;

        const lw = doc.internal.pageSize.getWidth();  // 297
        const lh = doc.internal.pageSize.getHeight();  // 210

        // Header
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, 0, lw, 18, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('BIM Protector — Planta: ' + (project.name || ''), 14, 12);

        // Current floor name
        const activeFloor = project.floors?.find(f => f.id === project.activeFloor);
        if (activeFloor) {
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(`Pavimento: ${activeFloor.name}`, lw - 14, 12, { align: 'right' });
        }

        // Image
        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        const imgW = lw - 28;
        const imgH = lh - 36;
        const canvasRatio = canvas.width / canvas.height;
        const fitRatio = imgW / imgH;

        let drawW, drawH, drawX, drawY;
        if (canvasRatio > fitRatio) {
          drawW = imgW;
          drawH = imgW / canvasRatio;
          drawX = 14;
          drawY = 22 + (imgH - drawH) / 2;
        } else {
          drawH = imgH;
          drawW = imgH * canvasRatio;
          drawX = 14 + (imgW - drawW) / 2;
          drawY = 22;
        }

        doc.addImage(imgData, 'JPEG', drawX, drawY, drawW, drawH);

        // Vector overlay — connections, devices & labels as sharp PDF primitives
        if (activeFloor) {
          drawFloorplanVector(doc, activeFloor, {
            offsetX: drawX,
            offsetY: drawY,
            areaW: drawW,
            areaH: drawH,
            canvasW: canvasEl.scrollWidth,
            canvasH: canvasEl.scrollHeight,
            drawGrid: false, // rasterized capture already includes the grid
          });
        }

        drawFooter(doc);
      } catch (err) {
        console.warn('Falha ao capturar planta:', err);
      }
    }
  }

  // ── PAGE: Topology text representation ───────────
  if (includeTopology) {
    doc.addPage();
    currentPage++;

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, w, 18, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BIM Protector — Topologia: ' + (project.name || ''), 14, 12);

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Topologia de Rede', 14, 30);

    // Build connection table per floor
    let yPos = 38;
    (project.floors || []).forEach(floor => {
      if (yPos > h - 40) {
        doc.addPage();
        currentPage++;
        doc.setFillColor(...COLORS.dark);
        doc.rect(0, 0, w, 18, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('BIM Protector — Topologia', 14, 12);
        yPos = 26;
      }

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pavimento: ${floor.name}`, 14, yPos);
      yPos += 2;

      const devs = floor.devices || [];
      const conns = floor.connections || [];

      if (conns.length === 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text('Nenhuma conexão neste pavimento.', 14, yPos + 5);
        yPos += 12;
        return;
      }

      const connRows = conns.map(c => {
        const fromDev = devs.find(d => d.id === c.from);
        const toDev = devs.find(d => d.id === c.to);
        const cableType = CABLE_TYPES.find(ct => ct.id === c.type);
        return [
          fromDev?.name || c.from,
          '→',
          toDev?.name || c.to,
          cableType?.name || c.type,
          c.distance ? `${c.distance}m` : '—',
        ];
      });

      const topoResult = autoTable(doc, {
        startY: yPos,
        head: [['Origem', '', 'Destino', 'Cabo', 'Dist.']],
        body: connRows,
        styles: { fontSize: 7, cellPadding: 1.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: 55 },
          1: { cellWidth: 8, halign: 'center' },
          2: { cellWidth: 55 },
          3: { cellWidth: 40 },
          4: { cellWidth: 15, halign: 'right' },
        },
        margin: { left: 14, right: 14 },
        didDrawPage: () => drawFooter(doc),
      });

      yPos = getFinalY(topoResult, doc, yPos + 40) + 10;
    });

    drawFooter(doc);
  }

  // ── PAGE: Validation Alerts ───────────────────────
  if (includeValidation && validationResults.length > 0) {
    const activeAlerts = validationResults.filter(v => v.msg);
    // Only add section if there are actual alerts
    if (activeAlerts.length > 0) {
      doc.addPage();
      currentPage++;

      drawHeader(doc, project.name || '', currentPage, '?');

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Alertas de Validação', 14, 30);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);
      doc.text(`${activeAlerts.length} alerta(s) detectado(s) no projeto`, 14, 36);

      const sevColors = {
        'CRÍTICA': [231, 76, 60],
        'ALTA': [243, 156, 18],
        'OBRIGATÓRIA': [230, 126, 34],
      };
      const sevIcons = {
        'CRÍTICA': 'CRITICA',
        'ALTA': 'ALTA',
        'OBRIGATÓRIA': 'OBRIG.',
      };

      autoTable(doc, {
        startY: 42,
        head: [['Sev.', 'Categoria', 'Regra', 'Problema Detectado']],
        body: activeAlerts.map(v => [
          sevIcons[v.sev] || v.sev,
          v.cat || '',
          v.regra || '',
          v.msg || '',
        ]),
        styles: { fontSize: 7, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1 },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 7 },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 28 },
          2: { cellWidth: 55 },
          3: { cellWidth: 75, fontSize: 6.5 },
        },
        margin: { left: 14, right: 14 },
        didDrawCell: (data) => {
          // Color the severity cell background
          if (data.section === 'body' && data.column.index === 0) {
            const sev = activeAlerts[data.row.index]?.sev;
            const color = sevColors[sev];
            if (color) {
              doc.setFillColor(...color);
              doc.roundedRect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 1, 1, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(6);
              doc.setFont('helvetica', 'bold');
              doc.text(
                sevIcons[sev] || sev,
                data.cell.x + data.cell.width / 2,
                data.cell.y + data.cell.height / 2 + 1,
                { align: 'center' }
              );
            }
          }
        },
        didDrawPage: () => drawFooter(doc),
      });

      drawFooter(doc);
    }
  }

  // ── Update page numbers ──────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Page number on footer area
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(6);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.text(`${i} / ${totalPages}`, pw / 2, ph - 9, { align: 'center' });
  }

  // ── Download ─────────────────────────────────────
  const safeName = (project.name || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`BIM_${safeName}_${dateStr}.pdf`);

  return { pages: totalPages, fileName: `BIM_${safeName}_${dateStr}.pdf` };
}
