// ====================================================================
// PDF EXPORT ENGINE — BIM Protector
// Uses jsPDF + jspdf-autotable + html2canvas (lazy loaded)
// ====================================================================
import { APP_VERSION } from '@/data/constants';
import { CABLE_TYPES } from '@/data/cable-types';
import { drawFloorplanVector } from './pdf-vector';

// ── Color palette ──────────────────────────────────
const COLORS = {
  primary: [4, 107, 210],     // #046BD2 (Protector blue)
  dark: [44, 62, 80],         // #2c3e50
  gray: [127, 140, 141],      // #7f8c8d
  lightGray: [240, 245, 250], // #F0F5FA (Protector light)
  green: [39, 174, 96],       // #27ae60
  orange: [243, 156, 18],     // #f39c12
  white: [255, 255, 255],
};

// ── Margins & layout constants ────────────────────
const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2; // 182mm usable

// ── Utility: draw header on each page ──────────────
function drawHeader(doc, projectName, pageNum, totalPages) {
  const w = doc.internal.pageSize.getWidth();
  // Top bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 16, 'F');
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BIM Protector - ' + projectName, MARGIN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Página ${pageNum}/${totalPages}`, w - MARGIN, 11, { align: 'right' });
}

// ── Utility: draw footer ──────────────────────────
function drawFooter(doc) {
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();
  doc.setDrawColor(200, 210, 220);
  doc.line(MARGIN, h - 12, w - MARGIN, h - 12);
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(7);
  doc.text(`Gerado por BIM Protector ${APP_VERSION.full} em ${new Date().toLocaleString('pt-BR')}`, MARGIN, h - 7);
  doc.text('www.protectoranalytics.com.br', w - MARGIN, h - 7, { align: 'right' });
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

  const totalCableMeters = connections.reduce((a, c) => a + (c.distance || 0), 0);

  // ── PAGE 1: Cover ────────────────────────────────
  // Header band with Protector blue
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, w, 60, 'F');

  // Title
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Projeto de Segurança Eletrônica', MARGIN + 4, 28);

  // Project name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  const projName = project.name || 'Sem nome';
  // Truncate if too long
  const projNameTrunc = projName.length > 50 ? projName.substring(0, 48) + '...' : projName;
  doc.text(projNameTrunc, MARGIN + 4, 42);

  // Version + scenario badges
  let badgeX = MARGIN + 4;
  doc.setFillColor(255, 255, 255, 40);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(badgeX, 47, 32, 7, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.primary);
  doc.text(APP_VERSION.full, badgeX + 16, 52, { align: 'center' });
  badgeX += 36;

  if (project.scenario) {
    doc.setFillColor(...COLORS.green);
    doc.roundedRect(badgeX, 47, 42, 7, 2, 2, 'F');
    doc.setTextColor(...COLORS.white);
    doc.text(project.scenario, badgeX + 21, 52, { align: 'center' });
  }

  // Client info box
  const client = project.client || {};
  let yPos = 76;

  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(MARGIN, 68, CONTENT_W, 58, 3, 3, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Cliente', MARGIN + 6, yPos);
  yPos += 9;

  doc.setFontSize(10);

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
    doc.text(label + ':', MARGIN + 6, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    // Truncate long values to fit within box
    const valStr = String(value);
    const valTrunc = valStr.length > 55 ? valStr.substring(0, 53) + '...' : valStr;
    doc.text(valTrunc, 68, yPos);
    yPos += 7;
  });

  // Project summary box
  yPos = 142;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(MARGIN, yPos - 6, CONTENT_W, 46, 3, 3, 'F');

  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo do Projeto', MARGIN + 6, yPos);
  yPos += 9;

  doc.setFontSize(10);
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
    doc.text(label + ':', MARGIN + 6, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.primary);
    doc.text(value, 68, yPos);
    yPos += 7;
  });

  // Footer info
  yPos = 206;
  doc.setTextColor(...COLORS.gray);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Autor: ${author}`, MARGIN, yPos);
  doc.text(`Empresa: ${company}`, MARGIN, yPos + 6);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, MARGIN, yPos + 12);
  if (client.projetoRef) doc.text(`Ref: ${client.projetoRef}`, MARGIN, yPos + 18);

  drawFooter(doc);

  // ── PAGE 2: Executive Summary ────────────────────
  if (includeSummary) {
    doc.addPage();
    currentPage++;

    drawHeader(doc, project.name || '', currentPage, '?');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumo Executivo', MARGIN, 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Visão geral do projeto de segurança eletrônica', MARGIN, 37);

    let sy = 46;

    // ── Section header helper ──
    const drawSectionHeader = (title, yStart) => {
      doc.setFillColor(...COLORS.primary);
      doc.roundedRect(MARGIN, yStart - 4, CONTENT_W, 9, 2, 2, 'F');
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(title, MARGIN + 6, yStart + 2.5);
      return yStart + 12;
    };

    // ── Contagem por categoria ──
    sy = drawSectionHeader('Equipamentos por Categoria', sy);

    // Group devices by category — comprehensive classification
    const catCounts = {};
    allDevices.forEach(d => {
      const k = d.key || '';
      let cat = 'Outros';
      if (k.startsWith('cam_')) cat = 'CFTV — Câmeras';
      else if (k.startsWith('nvr_') || k.startsWith('dvr_')) cat = 'CFTV — Gravadores';
      else if (k.startsWith('sw_') || k === 'router') cat = 'Rede';
      else if (k.startsWith('wifi_') || k.startsWith('ap_') || k.startsWith('ont_')) cat = 'Wi-Fi / Rede';
      else if (k.startsWith('barreira_') || k.startsWith('sensor_') || k.startsWith('botoeira_') || k.startsWith('alarme_')) cat = 'Intrusão / Alarme';
      else if (k === 'leitor_facial' || k === 'controladora' || k === 'fechadura' || k === 'eletroima' || k === 'leitor_tag' || k === 'leitor_biometrico' || k === 'leitor_rfid' || k.startsWith('biometrico_') || k.startsWith('tag_uhf_') || k.startsWith('catraca_') || k.startsWith('torniquete_') || k.startsWith('fechadura_')) cat = 'Controle de Acesso';
      else if (k.startsWith('auto_') || k.startsWith('cancela_') || k === 'motor') cat = 'Automatização';
      else if (k === 'nobreak_ac' || k === 'nobreak_dc' || k.startsWith('fonte_nb') || k.startsWith('fonte_idpower') || k.startsWith('conversor_dc') || k === 'fonte' || k === 'bateria_ext' || k === 'modulo_bat' || k.startsWith('bateria_')) cat = 'Energia';
      else if (k.startsWith('ponto_dados_')) cat = 'Pontos de Dados';
      else if (k.startsWith('cx_passagem') || k === 'cx_piso' || k === 'cx_derivacao') cat = 'Infraestrutura';
      else if (k === 'rack' || k === 'quadro' || k === 'quadro_eletrico' || k === 'dio' || k === 'borne_sak' || k === 'patch_panel' || k === 'conversor_midia' || k === 'dps_rede' || k === 'tomada_dupla' || k === 'cabo_engate') cat = 'Infraestrutura';
      else if (k.startsWith('custom_')) cat = 'Customizados';
      else if (d._legacy) cat = 'Legado';
      if (!catCounts[cat]) catCounts[cat] = 0;
      catCounts[cat]++;
    });

    const catEntries = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);
    doc.setFontSize(10);
    catEntries.forEach(([cat, count]) => {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.dark);
      doc.text(`• ${cat}`, MARGIN + 8, sy);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.primary);
      doc.text(String(count), 110, sy, { align: 'right' });
      sy += 6;
    });

    // Total
    sy += 3;
    doc.setDrawColor(200, 210, 220);
    doc.line(MARGIN + 8, sy - 3, 120, sy - 3);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(11);
    doc.text(`Total: ${allDevices.length} dispositivos`, MARGIN + 8, sy + 1);
    sy += 14;

    // ── Cabeamento ──
    sy = drawSectionHeader('Cabeamento', sy);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.dark);
    doc.text(`• Total de conexões: ${connections.length}`, MARGIN + 8, sy);
    sy += 6;
    doc.text(`• Metragem total estimada: ${totalCableMeters}m`, MARGIN + 8, sy);
    sy += 7;

    const cableTypes = {};
    connections.forEach(c => {
      const ct = CABLE_TYPES.find(t => t.id === c.type);
      const name = ct?.name || c.type;
      if (!cableTypes[name]) cableTypes[name] = { count: 0, meters: 0 };
      cableTypes[name].count++;
      cableTypes[name].meters += c.distance || 0;
    });
    Object.entries(cableTypes).sort((a, b) => b[1].meters - a[1].meters).forEach(([name, data]) => {
      doc.text(`  > ${name}: ${data.count} lances, ${data.meters}m`, MARGIN + 8, sy);
      sy += 5.5;
    });
    sy += 8;

    // ── Validações resumo ──
    // Check if we need a new page
    if (sy > h - 60) {
      doc.addPage();
      currentPage++;
      drawHeader(doc, project.name || '', currentPage, '?');
      sy = 28;
    }

    sy = drawSectionHeader('Status de Validação', sy);

    const activeAlerts = validationResults.filter(v => v.msg);
    doc.setFontSize(10);
    if (activeAlerts.length === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...COLORS.green);
      doc.text('OK - Nenhum alerta ativo. Projeto dentro das boas praticas.', MARGIN + 8, sy);
    } else {
      const criticas = activeAlerts.filter(v => v.sev === 'CRÍTICA').length;
      const altas = activeAlerts.filter(v => v.sev === 'ALTA').length;
      const obrig = activeAlerts.filter(v => v.sev === 'OBRIGATÓRIA').length;
      doc.setFont('helvetica', 'normal');
      if (criticas) { doc.setTextColor(231, 76, 60); doc.text(`• ${criticas} alerta(s) CRÍTICA(S)`, MARGIN + 8, sy); sy += 6; }
      if (altas) { doc.setTextColor(243, 156, 18); doc.text(`• ${altas} alerta(s) ALTA(S)`, MARGIN + 8, sy); sy += 6; }
      if (obrig) { doc.setTextColor(...COLORS.orange); doc.text(`• ${obrig} alerta(s) OBRIGATÓRIA(S)`, MARGIN + 8, sy); sy += 6; }
      doc.setTextColor(...COLORS.gray);
      doc.setFontSize(9);
      doc.text('Veja a seção de Validação para detalhes completos.', MARGIN + 8, sy + 3);
    }

    drawFooter(doc);
  }

  // ── PAGE: BOM (Bill of Materials) ──────────────────
  if (includeEquipment && bom.length > 0) {
    doc.addPage();
    currentPage++;

    drawHeader(doc, project.name || '', currentPage, '?');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Lista de Materiais (BOM)', MARGIN, 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text(`${bom.length} itens únicos · ${allDevices.length} dispositivos · ${totalCableMeters}m de cabeamento`, MARGIN, 37);

    // Separate devices and cables
    const deviceItems = bom.filter(b => b.unit !== 'm');
    const cableItems = bom.filter(b => b.unit === 'm');

    let tableY = 43;

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
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 48 },
        2: { cellWidth: 44, fontSize: 7.5, textColor: COLORS.gray },
        3: { cellWidth: 36, fontSize: 7.5, fontStyle: 'normal', textColor: [4,107,210] },
        4: { cellWidth: 14, halign: 'center', fontStyle: 'bold' },
        5: { cellWidth: 12, halign: 'center' },
      } : {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 'auto', fontSize: 7.5, textColor: COLORS.gray },
        3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 14, halign: 'center' },
      };

      const devTableResult = autoTable(doc, {
        startY: tableY,
        head: devHead,
        body: devBody,
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: COLORS.primary, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: devColStyles,
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: 'auto',
        didDrawPage: (data) => {
          // Draw header on continuation pages
          if (data.pageNumber > 1) drawHeader(doc, project.name || '', '?', '?');
          drawFooter(doc);
        },
      });

      tableY = getFinalY(devTableResult, doc, tableY + 60) + 10;
    }

    // Cable table
    if (cableItems.length > 0) {
      // Check if we need a new page
      if (tableY > h - 60) {
        doc.addPage();
        currentPage++;
        drawHeader(doc, project.name || '', currentPage, '?');
        tableY = 28;
      }

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Cabeamento', MARGIN, tableY);
      tableY += 5;

      autoTable(doc, {
        startY: tableY,
        head: [['#', 'Tipo de Cabo', 'Lances', 'Metragem Total']],
        body: cableItems.map((item, i) => [
          i + 1,
          item.name,
          item.qty,
          `${item.totalMeters || item.qty}m`
        ]),
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 35, halign: 'right', fontStyle: 'bold' },
        },
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: 'auto',
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
        doc.setFillColor(...COLORS.primary);
        doc.rect(0, 0, lw, 16, 'F');
        doc.setTextColor(...COLORS.white);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('BIM Protector - Planta: ' + (project.name || ''), MARGIN, 11);

        // Current floor name
        const activeFloor = project.floors?.find(f => f.id === project.activeFloor);
        if (activeFloor) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Pavimento: ${activeFloor.name}`, lw - MARGIN, 11, { align: 'right' });
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
            project,         // pass project data for carimbo rendering
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

    drawHeader(doc, project.name || '', currentPage, '?');

    doc.setTextColor(...COLORS.dark);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Topologia de Rede', MARGIN, 30);

    // Build connection table per floor
    let yPos = 40;
    (project.floors || []).forEach(floor => {
      if (yPos > h - 50) {
        doc.addPage();
        currentPage++;
        drawHeader(doc, project.name || '', currentPage, '?');
        yPos = 28;
      }

      doc.setTextColor(...COLORS.dark);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Pavimento: ${floor.name}`, MARGIN, yPos);
      yPos += 3;

      const devs = floor.devices || [];
      const conns = floor.connections || [];

      if (conns.length === 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text('Nenhuma conexão neste pavimento.', MARGIN, yPos + 5);
        yPos += 14;
        return;
      }

      const connRows = conns.map(c => {
        const fromDev = devs.find(d => d.id === c.from);
        const toDev = devs.find(d => d.id === c.to);
        const cableType = CABLE_TYPES.find(ct => ct.id === c.type);
        return [
          fromDev?.name || c.from,
          '>>',
          toDev?.name || c.to,
          cableType?.name || c.type,
          c.distance ? `${c.distance}m` : '-',
        ];
      });

      const topoResult = autoTable(doc, {
        startY: yPos,
        head: [['Origem', '', 'Destino', 'Cabo', 'Dist.']],
        body: connRows,
        styles: { fontSize: 8, cellPadding: 2.5, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 8, halign: 'center' },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 38 },
          4: { cellWidth: 18, halign: 'right' },
        },
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: 'auto',
        didDrawPage: () => drawFooter(doc),
      });

      yPos = getFinalY(topoResult, doc, yPos + 40) + 12;
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
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Alertas de Validação', MARGIN, 30);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...COLORS.gray);
      doc.text(`${activeAlerts.length} alerta(s) detectado(s) no projeto`, MARGIN, 37);

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
        startY: 43,
        head: [['Sev.', 'Categoria', 'Regra', 'Problema Detectado']],
        body: activeAlerts.map(v => [
          sevIcons[v.sev] || v.sev,
          v.cat || '',
          v.regra || '',
          v.msg || '',
        ]),
        styles: { fontSize: 8, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.1, overflow: 'linebreak' },
        headStyles: { fillColor: COLORS.dark, textColor: COLORS.white, fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [245, 248, 252] },
        columnStyles: {
          0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 30 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 'auto', fontSize: 7.5 },
        },
        margin: { left: MARGIN, right: MARGIN },
        tableWidth: 'auto',
        didDrawCell: (data) => {
          // Color the severity cell background
          if (data.section === 'body' && data.column.index === 0) {
            const sev = activeAlerts[data.row.index]?.sev;
            const color = sevColors[sev];
            if (color) {
              doc.setFillColor(...color);
              doc.roundedRect(data.cell.x + 1, data.cell.y + 1, data.cell.width - 2, data.cell.height - 2, 1, 1, 'F');
              doc.setTextColor(255, 255, 255);
              doc.setFontSize(7);
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

  // ── Update page numbers (header + footer) ──────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    // Fix header "Página X/?" → "Página X/N" (overwrite with white rect + new text)
    if (i > 1) { // page 1 is cover, no header
      doc.setFillColor(...COLORS.primary);
      doc.rect(pw - 60, 0, 60, 16, 'F'); // cover old "Página X/?"
      doc.setTextColor(...COLORS.white);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i} / ${totalPages}`, pw - MARGIN, 11, { align: 'right' });
    }
    // Footer center page number
    doc.setTextColor(...COLORS.gray);
    doc.setFontSize(7);
    doc.text(`${i} / ${totalPages}`, pw / 2, ph - 7, { align: 'center' });
  }

  // ── Download ─────────────────────────────────────
  const safeName = (project.name || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  doc.save(`BIM_${safeName}_${dateStr}.pdf`);

  return { pages: totalPages, fileName: `BIM_${safeName}_${dateStr}.pdf` };
}
