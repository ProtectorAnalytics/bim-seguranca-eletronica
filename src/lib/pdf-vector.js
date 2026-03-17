// ====================================================================
// PDF VECTOR FLOORPLAN RENDERER
// Draws grid, connections, devices and labels as jsPDF vector primitives
// Background image is still rasterized; overlay is sharp at any zoom
// ====================================================================
import { CABLE_TYPES } from '@/data/cable-types';
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
      if (drawLabels && conn.dist) {
        const mid = Math.floor(points.length / 2);
        const mx = (points[mid - 1].x + points[mid].x) / 2;
        const my = (points[mid - 1].y + points[mid].y) / 2;
        // White background for readability
        doc.setFontSize(5);
        const labelTxt = `${conn.dist}m`;
        const labelW = doc.getTextWidth(labelTxt) + 1.5;
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

  // ── Legend ────────────────────────────────────────
  const legendW = 52;
  const legendH = 28;
  const legendX = offsetX + canvasW * scale - legendW - 2;
  const legendY = offsetY + canvasH * scale - legendH - 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 190, 200);
  doc.setLineWidth(0.3);
  doc.roundedRect(legendX, legendY, legendW, legendH, 2, 2, 'FD');

  doc.setFontSize(6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(44, 62, 80);
  doc.text('Legenda', legendX + 3, legendY + 5);
  doc.setFont('helvetica', 'normal');

  const legendItems = [
    { color: [52, 152, 219], label: 'Dados (Cat6/Fibra)' },
    { color: [231, 76, 60], label: 'Energia (AC/DC)' },
    { color: [46, 204, 113], label: 'Sinal (PP/Sensor)' },
    { color: [155, 89, 182], label: 'Automação' },
  ];

  legendItems.forEach((item, i) => {
    const ly = legendY + 9 + i * 4.5;
    doc.setDrawColor(...item.color);
    doc.setLineWidth(0.8);
    doc.line(legendX + 3, ly, legendX + 10, ly);
    doc.setFontSize(5);
    doc.setTextColor(60, 60, 60);
    doc.text(item.label, legendX + 12, ly + 1);
  });
}
