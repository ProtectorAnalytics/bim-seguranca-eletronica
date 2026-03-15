import React from 'react';
import { isCamera } from '@/data/device-interfaces';
import { findDevDef } from '@/lib/helpers';
import { DEVICE_LIB } from '@/data/device-lib';

// FOV angles by camera subcategory / lens type
function getFovParams(dev) {
  const def = findDevDef(dev.key);
  if (!def) return null;

  const lente = def.props?.lente || '';
  const ir = def.props?.ir || '';

  let angle = 90;
  if (lente.includes('2.8mm')) angle = 102;
  else if (lente.includes('3.6mm')) angle = 80;
  else if (lente.includes('6mm')) angle = 54;
  else if (lente.includes('12mm')) angle = 28;
  else if (lente.includes('2.7-13.5mm')) angle = 100;
  else if (def.props?.fov === '360°') angle = 360;
  else if (def.props?.zoom) angle = 60;

  let range = 60;
  const irMatch = ir.match(/(\d+)m/);
  if (irMatch) {
    range = Math.min(parseInt(irMatch[1]) * 2.5, 200);
  }

  if (dev.fovAngle) angle = dev.fovAngle;
  if (dev.fovRange) range = dev.fovRange;

  return { angle, range };
}

function getCameraColor(dev) {
  const catInfo = DEVICE_LIB.find(c => c.items.some(i => i.key === dev.key));
  return catInfo?.color || '#f59e0b';
}

/**
 * Renders SVG FOV wedges + optional heatmap for cameras.
 * Props: devices (array), show (boolean), heatmap (boolean)
 */
export default function CameraFovOverlay({ devices, show, heatmap }) {
  if (!show) return null;

  const cameras = devices.filter(d => isCamera(d.key) && !d.quadroId);

  // Heatmap: canvas-based coverage density visualization
  if (heatmap && cameras.length > 0) {
    return (
      <>
        <svg className="fov-overlay" width="4000" height="4000"
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 3 }}>
          <defs>
            <radialGradient id="heatGreen">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
              <stop offset="60%" stopColor="#22c55e" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </radialGradient>
          </defs>
          {cameras.map(dev => {
            const params = getFovParams(dev);
            if (!params) return null;
            const { angle, range } = params;
            const rotation = dev.fovRotation || dev.rotation || 0;

            if (angle >= 360) {
              return (
                <circle key={dev.id + '_heat'} cx={dev.x} cy={dev.y} r={range}
                  fill="#22c55e" fillOpacity={0.15} stroke="#22c55e" strokeOpacity={0.3}
                  strokeWidth={1} />
              );
            }

            const startAngle = rotation - angle / 2;
            const endAngle = rotation + angle / 2;
            const toRad = (deg) => (deg - 90) * Math.PI / 180;
            const x1 = dev.x + range * Math.cos(toRad(startAngle));
            const y1 = dev.y + range * Math.sin(toRad(startAngle));
            const x2 = dev.x + range * Math.cos(toRad(endAngle));
            const y2 = dev.y + range * Math.sin(toRad(endAngle));
            const largeArc = angle > 180 ? 1 : 0;
            const d = `M ${dev.x} ${dev.y} L ${x1} ${y1} A ${range} ${range} 0 ${largeArc} 1 ${x2} ${y2} Z`;

            return (
              <path key={dev.id + '_heat'} d={d}
                fill="#22c55e" fillOpacity={0.18} stroke="#22c55e" strokeOpacity={0.4}
                strokeWidth={1.5} />
            );
          })}
          {/* Coverage quality rings: detect/observe/recognize/identify */}
          {cameras.map(dev => {
            const params = getFovParams(dev);
            if (!params) return null;
            const { range } = params;
            const rings = [
              { r: range * 0.25, label: 'Identificar', color: '#22c55e' },
              { r: range * 0.5, label: 'Reconhecer', color: '#84cc16' },
              { r: range * 0.75, label: 'Observar', color: '#eab308' },
              { r: range, label: 'Detectar', color: '#f97316' },
            ];
            return rings.map((ring, i) => (
              <circle key={dev.id + '_ring_' + i} cx={dev.x} cy={dev.y} r={ring.r}
                fill="none" stroke={ring.color} strokeWidth={0.8}
                strokeDasharray="3 3" opacity={0.5} />
            ));
          })}
        </svg>
      </>
    );
  }

  // Standard FOV cones
  return (
    <svg className="fov-overlay" width="4000" height="4000"
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 3 }}>
      {cameras.map(dev => {
        const params = getFovParams(dev);
        if (!params) return null;

        const { angle, range } = params;
        const color = getCameraColor(dev);
        const rotation = dev.fovRotation || dev.rotation || 0;

        if (angle >= 360) {
          return (
            <circle key={dev.id + '_fov'} cx={dev.x} cy={dev.y} r={range}
              fill={color} fillOpacity={0.08} stroke={color} strokeOpacity={0.25}
              strokeWidth={1} strokeDasharray="4 2" />
          );
        }

        const startAngle = rotation - angle / 2;
        const endAngle = rotation + angle / 2;
        const toRad = (deg) => (deg - 90) * Math.PI / 180;
        const x1 = dev.x + range * Math.cos(toRad(startAngle));
        const y1 = dev.y + range * Math.sin(toRad(startAngle));
        const x2 = dev.x + range * Math.cos(toRad(endAngle));
        const y2 = dev.y + range * Math.sin(toRad(endAngle));
        const largeArc = angle > 180 ? 1 : 0;

        const d = `M ${dev.x} ${dev.y} L ${x1} ${y1} A ${range} ${range} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        return (
          <path key={dev.id + '_fov'} d={d}
            fill={color} fillOpacity={0.08} stroke={color} strokeOpacity={0.3}
            strokeWidth={1} strokeDasharray="4 2" />
        );
      })}
    </svg>
  );
}
