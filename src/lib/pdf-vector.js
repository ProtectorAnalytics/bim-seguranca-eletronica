// ====================================================================
// PDF VECTOR FLOORPLAN RENDERER
// Draws grid, connections, devices and labels as jsPDF vector primitives
// Background image is still rasterized; overlay is sharp at any zoom
// ====================================================================
import { CABLE_TYPES } from '@/data/cable-types';
import { APP_VERSION } from '@/data/constants';
import { findDevDef } from './helpers';

// Cable type → PDF line color [R, G, B]
const CABLE_COLORS = {
  data: [52, 152, 219],       // blue
  power: [231, 76, 60],       // red
  signal: [46, 204, 113],     // green
  automation: [155, 89, 182], // purple
};

function getCableColor(cableTypeId) {
  const ct = CABLE_TYPES.find(c => c.id === cableTypeId);
  return CABLE_COLORS[ct?.group] || [100, 100, 100];
}

/**
 * drawFloorplanVector — Render the floorplan as vector graphics in a jsPDF page
 *
 * @param {jsPDF} doc — the jsPDF document instance (page already added in landscape A4)
 * @param {object} floor — the floor object with devices, connections, environments, etc.
 * @param {object} opts — { offsetX, offsetY, scaleX, scaleY, drawGrid, drawConnections, drawDevices }
 */
export function drawFloorplanVector(doc, floor, opts = {}) {
  const devices = floor.devices || [];
  const connections = floor.connections || [];

  const {
    offsetX = 14,    // left margin in mm
    offsetY = 22,    // top margin in mm
    areaW = 269,     // drawable area width in mm (297 - 28 margins)
    areaH = 174,     // drawable area height in mm (210 - 36 margins)
    canvasW = 2000,  // canvas pixel width
    canvasH = 1400,  // canvas pixel height
    drawGrid = true,
    drawConnections = true,
    drawDevices = true,
    drawLabels = true,
    project = null,  // project data for carimbo
  } = opts;

  // Conversion: canvas pixels → PDF mm
  const sx = areaW / canvasW;
  const sy = areaH / canvasH;
  const scale = Math.min(sx, sy); // uniform scale to fit
  const tx = (px) => offsetX + px * scale;
  const ty = (py) => offsetY + py * scale;

  // ── Grid ─────────────────────────────────────────
  if (drawGrid) {
    doc.setDrawColor(200, 210, 220);
    doc.setLineWidth(0.1);
    const gridPx = 40; // canvas grid is 40px
    for (let x = 0; x <= canvasW; x += gridPx) {
      doc.line(tx(x), offsetY, tx(x), offsetY + canvasH * scale);
    }
    for (let y = 0; y <= canvasH; y += gridPx) {
      doc.line(offsetX, ty(y), offsetX + canvasW * scale, ty(y));
    }
  }

  // ── Connections (cables) ─────────────────────────
  if (drawConnections) {
    doc.setLineWidth(0.5);
    connections.forEach(conn => {
      const fromDev = devices.find(d => d.id === conn.from);
      const toDev = devices.find(d => d.id === conn.to);
      if (!fromDev || !toDev) return;

      const color = getCableColor(conn.type);
      doc.setDrawColor(...color);

      // Build point chain: from → waypoints → to
      const points = [
        { x: fromDev.x, y: fromDev.y },
        ...(conn.waypoints || []),
        { x: toDev.x, y: toDev.y },
      ];

      for (let i = 1; i < points.length; i++) {
        doc.line(
          tx(points[i - 1].x), ty(points[i - 1].y),
          tx(points[i].x), ty(points[i].y)
        );
      }

      // Cable label at midpoint
      const cableDist = conn.distance || conn.dist;
      if (drawLabels && cableDist) {
        const mid = Math.floor(points.length / 2);
        const mx = (points[mid - 1].x + points[mid].x) / 2;
        const my = (points[mid - 1].y + points[mid].y) / 2;
        const ct = CABLE_TYPES.find(c => c.id === conn.type);
        const labelTxt = ct ? `${ct.name} ${cableDist}m` : `${cableDist}m`;
        doc.setFontSize(5);
        const labelW = doc.getTextWidth(labelTxt) + 2;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(tx(mx) - labelW / 2, ty(my) - 3, labelW, 3.5, 0.5, 0.5, 'F');
        doc.setTextColor(...color);
        doc.text(labelTxt, tx(mx), ty(my) - 0.5, { align: 'center' });
      }
    });
  }

  // ── Devices ──────────────────────────────────────
  if (drawDevices) {
    const devRadius = 3.5; // mm radius for device marker
    devices.forEach(dev => {
      const def = findDevDef(dev.key);
      const x = tx(dev.x);
      const y = ty(dev.y);

      // Marker color based on device type
      let fillColor = [100, 116, 139]; // default gray
      if (dev.key.startsWith('cam_')) fillColor = [4, 107, 210]; // Protector blue (cameras)
      else if (dev.key.startsWith('nvr_') || dev.key.startsWith('dvr_')) fillColor = [155, 89, 182]; // purple (recorders)
      else if (dev.key.startsWith('sw_')) fillColor = [46, 204, 113]; // green (switches)
      else if (dev.key.startsWith('nobreak_') || dev.key.startsWith('fonte_') || dev.key.startsWith('conversor_dc')) fillColor = [231, 76, 60]; // red (power)
      else if (dev.key.startsWith('alarme_') || dev.key.startsWith('barreira_') || dev.key.startsWith('sensor_')) fillColor = [243, 156, 18]; // orange (security)
      else if (dev.key.startsWith('leitor_') || dev.key.startsWith('catraca_') || dev.key.startsWith('fechadura')) fillColor = [52, 73, 94]; // dark (access)
      else if (dev.key.startsWith('auto_') || dev.key.startsWith('cancela_') || dev.key === 'motor') fillColor = [142, 68, 173]; // purple (automation)

      // Draw marker circle with border
      doc.setFillColor(...fillColor);
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.5);
      doc.circle(x, y, devRadius, 'FD');

      // Device label with background
      if (drawLabels) {
        const label = dev.name || def?.name || dev.key;
        const shortLabel = label.length > 22 ? label.substring(0, 20) + '..' : label;
        doc.setFontSize(5);
        const labelW = doc.getTextWidth(shortLabel) + 2;
        const labelX = x - labelW / 2;
        const labelY = y + devRadius + 1;
        // White background pill
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(200, 210, 220);
        doc.setLineWidth(0.1);
        doc.roundedRect(labelX, labelY, labelW, 4, 1, 1, 'FD');
        doc.setTextColor(44, 62, 80);
        doc.text(shortLabel, x, labelY + 3, { align: 'center' });
      }
    });
  }

  // ── Carimbo Técnico (bottom-right) ──────────────────
  const carimboW = 80;
  const carimboH = 32;
  const carimboX = offsetX + canvasW * scale - carimboW - 2;
  const carimboY = offsetY + canvasH * scale - carimboH - 2;

  // Background
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(4, 107, 210);
  doc.setLineWidth(0.5);
  doc.roundedRect(carimboX, carimboY, carimboW, carimboH, 1.5, 1.5, 'FD');

  // Header bar
  doc.setFillColor(4, 107, 210);
  doc.rect(carimboX, carimboY, carimboW, 6, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(5.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PROTECTOR SISTEMAS', carimboX + 2, carimboY + 4.2);
  doc.setFontSize(4);
  doc.setFont('helvetica', 'normal');
  doc.text(`BIM ${APP_VERSION.full}`, carimboX + carimboW - 2, carimboY + 4.2, { align: 'right' });

  // Body — project info
  const cy0 = carimboY + 8;
  doc.setDrawColor(200, 210, 220);
  doc.setLineWidth(0.1);

  const projName = project?.name || '—';
  const clientName = project?.client?.razaoSocial || project?.client?.nome || '—';
  const floorName = floor?.name || '—';
  const dateStr = new Date().toLocaleDateString('pt-BR');

  // Row 1: Projeto | Cliente
  doc.setFontSize(3.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PROJETO', carimboX + 2, cy0);
  doc.text('CLIENTE', carimboX + carimboW / 2 + 1, cy0);
  doc.setFontSize(5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  const pTrunc = projName.length > 18 ? projName.substring(0, 16) + '..' : projName;
  const cTrunc = clientName.length > 18 ? clientName.substring(0, 16) + '..' : clientName;
  doc.text(pTrunc, carimboX + 2, cy0 + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(cTrunc, carimboX + carimboW / 2 + 1, cy0 + 3.5);
  // Divider
  doc.line(carimboX + carimboW / 2, cy0 - 1.5, carimboX + carimboW / 2, cy0 + 4.5);
  doc.line(carimboX, cy0 + 5.5, carimboX + carimboW, cy0 + 5.5);

  // Row 2: Pavimento | Data | Resumo
  const cy1 = cy0 + 7;
  doc.setFontSize(3.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PAVIMENTO', carimboX + 2, cy1);
  doc.text('DATA', carimboX + 28, cy1);
  doc.text('RESUMO', carimboX + 50, cy1);
  doc.setFontSize(5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.text(floorName, carimboX + 2, cy1 + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(dateStr, carimboX + 28, cy1 + 3.5);
  doc.text(`${devices.length} disp / ${connections.length} cabos`, carimboX + 50, cy1 + 3.5);

  // ── Legenda de cabos (bottom-left of carimbo) ──────
  const legendW = 52;
  const legendH = 22;
  const legendX = carimboX - legendW - 4;
  const legendY = carimboY + (carimboH - legendH);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.2);
  doc.roundedRect(legendX, legendY, legendW, legendH, 1, 1, 'FD');

  doc.setFontSize(5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Legenda', legendX + 2, legendY + 4);
  doc.setFont('helvetica', 'normal');

  const legendItems = [
    { color: [52, 152, 219], label: 'Dados (Cat6/Fibra)' },
    { color: [231, 76, 60], label: 'Energia (AC/DC)' },
    { color: [46, 204, 113], label: 'Sinal (PP/Sensor)' },
    { color: [155, 89, 182], label: 'Automação' },
  ];

  legendItems.forEach((item, i) => {
    const ly = legendY + 7.5 + i * 3.5;
    doc.setDrawColor(...item.color);
    doc.setLineWidth(0.8);
    doc.line(legendX + 2, ly, legendX + 8, ly);
    doc.setFontSize(4.5);
    doc.setTextColor(60, 60, 60);
    doc.text(item.label, legendX + 10, ly + 0.8);
  });
}
