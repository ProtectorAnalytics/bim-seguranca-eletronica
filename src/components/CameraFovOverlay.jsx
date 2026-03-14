import React from 'react';
import { isCamera } from '@/data/device-interfaces';
import { findDevDef } from '@/lib/helpers';
import { DEVICE_LIB } from '@/data/device-lib';

// FOV angles by camera subcategory / lens type
function getFovParams(dev) {
  const def = findDevDef(dev.key);
  if (!def) return null;

  // Extract lens from props
  const lente = def.props?.lente || '';
  const ir = def.props?.ir || '';

  // Determine angle based on lens
  let angle = 90; // default
  if (lente.includes('2.8mm')) angle = 102;
  else if (lente.includes('3.6mm')) angle = 80;
  else if (lente.includes('6mm')) angle = 54;
  else if (lente.includes('12mm')) angle = 28;
  else if (lente.includes('2.7-13.5mm')) angle = 100; // wide end
  else if (def.props?.fov === '360°') angle = 360;
  else if (def.props?.zoom) angle = 60; // PTZ

  // Determine range from IR distance
  let range = 60; // default pixels
  const irMatch = ir.match(/(\d+)m/);
  if (irMatch) {
    range = Math.min(parseInt(irMatch[1]) * 2.5, 200); // scale IR meters to canvas pixels
  }

  // Use custom values if device has them
  if (dev.fovAngle) angle = dev.fovAngle;
  if (dev.fovRange) range = dev.fovRange;

  return { angle, range };
}

// Determine color from category
function getCameraColor(dev) {
  const catInfo = DEVICE_LIB.find(c => c.items.some(i => i.key === dev.key));
  return catInfo?.color || '#f59e0b';
}

/**
 * Renders SVG FOV wedges for all cameras on the current floor.
 * Props: devices (array), show (boolean)
 */
export default function CameraFovOverlay({ devices, show }) {
  if (!show) return null;

  const cameras = devices.filter(d => isCamera(d.key) && !d.quadroId);

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
          // Fisheye: full circle
          return (
            <circle key={dev.id + '_fov'} cx={dev.x} cy={dev.y} r={range}
              fill={color} fillOpacity={0.08} stroke={color} strokeOpacity={0.25}
              strokeWidth={1} strokeDasharray="4 2" />
          );
        }

        // Wedge as SVG path
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
