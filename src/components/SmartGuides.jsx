import React, { useMemo } from 'react';

const SNAP_THRESHOLD = 3;
const GUIDE_COLOR = '#ff00ff';
const CANVAS_SIZE = 4000;

function SmartGuidesInner({ draggedId, devices, getDevR, show }) {
  const guides = useMemo(() => {
    if (!show || !draggedId || !devices || devices.length < 2) return { lines: [], labels: [] };

    const dragged = devices.find(d => d.id === draggedId);
    if (!dragged) return { lines: [], labels: [] };

    const dR = getDevR(dragged);
    const dCx = dragged.x + dR;
    const dCy = dragged.y + dR;

    const lines = [];
    const labels = [];
    const others = devices.filter(d => d.id !== draggedId);

    // Collect centers of other devices
    const otherCenters = others.map(d => {
      const r = getDevR(d);
      return { id: d.id, cx: d.x + r, cy: d.y + r };
    });

    // Horizontal alignment (centers within threshold vertically)
    for (const o of otherCenters) {
      if (Math.abs(o.cy - dCy) <= SNAP_THRESHOLD) {
        const x1 = Math.min(dCx, o.cx);
        const x2 = Math.max(dCx, o.cx);
        const y = dCy;
        const dist = Math.round(x2 - x1);
        lines.push({ x1, y1: y, x2, y2: y, key: `h-${o.id}` });
        labels.push({ x: (x1 + x2) / 2, y: y - 6, text: `${dist}px`, key: `hl-${o.id}` });
      }
    }

    // Vertical alignment (centers within threshold horizontally)
    for (const o of otherCenters) {
      if (Math.abs(o.cx - dCx) <= SNAP_THRESHOLD) {
        const y1 = Math.min(dCy, o.cy);
        const y2 = Math.max(dCy, o.cy);
        const x = dCx;
        const dist = Math.round(y2 - y1);
        lines.push({ x1: x, y1, x2: x, y2, key: `v-${o.id}` });
        labels.push({ x: x + 6, y: (y1 + y2) / 2, text: `${dist}px`, key: `vl-${o.id}` });
      }
    }

    // Equal spacing detection
    // Sort others by x for horizontal spacing
    const sortedByX = [...otherCenters].sort((a, b) => a.cx - b.cx);
    for (let i = 0; i < sortedByX.length; i++) {
      for (let j = i + 1; j < sortedByX.length; j++) {
        const a = sortedByX[i];
        const b = sortedByX[j];
        // Check if dragged is between a and b horizontally
        if (dCx > a.cx && dCx < b.cx) {
          const distA = dCx - a.cx;
          const distB = b.cx - dCx;
          if (Math.abs(distA - distB) <= SNAP_THRESHOLD) {
            const avgY = dCy;
            // Left spacing indicator
            lines.push({ x1: a.cx, y1: avgY, x2: dCx, y2: avgY, key: `eqh-l-${a.id}-${b.id}` });
            labels.push({ x: (a.cx + dCx) / 2, y: avgY - 6, text: `${Math.round(distA)}px`, key: `eqhl-l-${a.id}-${b.id}` });
            // Right spacing indicator
            lines.push({ x1: dCx, y1: avgY, x2: b.cx, y2: avgY, key: `eqh-r-${a.id}-${b.id}` });
            labels.push({ x: (dCx + b.cx) / 2, y: avgY - 6, text: `${Math.round(distB)}px`, key: `eqhl-r-${a.id}-${b.id}` });
          }
        }
      }
    }

    // Sort others by y for vertical spacing
    const sortedByY = [...otherCenters].sort((a, b) => a.cy - b.cy);
    for (let i = 0; i < sortedByY.length; i++) {
      for (let j = i + 1; j < sortedByY.length; j++) {
        const a = sortedByY[i];
        const b = sortedByY[j];
        if (dCy > a.cy && dCy < b.cy) {
          const distA = dCy - a.cy;
          const distB = b.cy - dCy;
          if (Math.abs(distA - distB) <= SNAP_THRESHOLD) {
            const avgX = dCx;
            lines.push({ x1: avgX, y1: a.cy, x2: avgX, y2: dCy, key: `eqv-t-${a.id}-${b.id}` });
            labels.push({ x: avgX + 6, y: (a.cy + dCy) / 2, text: `${Math.round(distA)}px`, key: `eqvl-t-${a.id}-${b.id}` });
            lines.push({ x1: avgX, y1: dCy, x2: avgX, y2: b.cy, key: `eqv-b-${a.id}-${b.id}` });
            labels.push({ x: avgX + 6, y: (dCy + b.cy) / 2, text: `${Math.round(distB)}px`, key: `eqvl-b-${a.id}-${b.id}` });
          }
        }
      }
    }

    return { lines, labels };
  }, [draggedId, devices, getDevR, show]);

  if (!show || !draggedId || guides.lines.length === 0) return null;

  return (
    <svg
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 8,
      }}
    >
      {guides.lines.map(l => (
        <line
          key={l.key}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={GUIDE_COLOR}
          strokeWidth={1}
          strokeDasharray="4 3"
        />
      ))}
      {guides.labels.map(lb => (
        <text
          key={lb.key}
          x={lb.x}
          y={lb.y}
          fill={GUIDE_COLOR}
          fontSize={10}
          fontFamily="Inter, sans-serif"
          textAnchor="middle"
        >
          {lb.text}
        </text>
      ))}
    </svg>
  );
}

const SmartGuides = React.memo(SmartGuidesInner);

export default SmartGuides;
