import React, { useState, useCallback, useRef, useEffect } from 'react';
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

// Helper to convert deg to radians (0° = up)
const toRad = (deg) => (deg - 90) * Math.PI / 180;

// Build SVG path for a FOV wedge
function buildWedgePath(cx, cy, angle, range, rotation) {
  const startAngle = rotation - angle / 2;
  const endAngle = rotation + angle / 2;
  const x1 = cx + range * Math.cos(toRad(startAngle));
  const y1 = cy + range * Math.sin(toRad(startAngle));
  const x2 = cx + range * Math.cos(toRad(endAngle));
  const y2 = cy + range * Math.sin(toRad(endAngle));
  const largeArc = angle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${range} ${range} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

/**
 * Renders SVG FOV wedges + optional heatmap for cameras.
 * Hikvision-style: cyan fill, solid border, interactive rotation handle.
 */
export default function CameraFovOverlay({ devices, show, heatmap, updateDevice, zoom, pan, canvasRef }) {
  if (!show) return null;

  const cameras = devices.filter(d => isCamera(d.key) && !d.quadroId);
  const [dragging, setDragging] = useState(null); // { devId, startAngle }
  const dragRef = useRef(null);

  // FOV color scheme — Hikvision cyan style
  const fovFill = '#00d4d4';
  const fovFillOpacity = 0.15;
  const fovStroke = '#00b8b8';
  const fovStrokeOpacity = 0.6;
  const fovStrokeWidth = 1.5;

  // Handle rotation drag
  const handleMouseDown = useCallback((e, devId) => {
    e.stopPropagation();
    e.preventDefault();
    const dev = devices.find(d => d.id === devId);
    if (!dev || !canvasRef?.current) return;

    dragRef.current = { devId, dev };
    setDragging(devId);

    const onMouseMove = (me) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || !dragRef.current) return;
      const z = zoom || 1;
      const p = pan || { x: 0, y: 0 };
      const mx = (me.clientX - rect.left - p.x) / z;
      const my = (me.clientY - rect.top - p.y) / z;
      const dx = mx - dragRef.current.dev.x;
      const dy = my - dragRef.current.dev.y;
      let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (angle < 0) angle += 360;
      // Snap to 5° increments when not holding Shift
      if (!me.shiftKey) angle = Math.round(angle / 5) * 5;
      if (updateDevice) updateDevice(dragRef.current.devId, { fovRotation: angle });
    };

    const onMouseUp = () => {
      dragRef.current = null;
      setDragging(null);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [devices, updateDevice, zoom, pan, canvasRef]);

  // Heatmap mode
  if (heatmap && cameras.length > 0) {
    return (
      <svg className="fov-overlay" width="4000" height="4000"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 3 }}>
        {cameras.map(dev => {
          const params = getFovParams(dev);
          if (!params) return null;
          const { angle, range } = params;
          const rotation = dev.fovRotation ?? dev.rotation ?? 0;

          if (angle >= 360) {
            return (
              <circle key={dev.id + '_heat'} cx={dev.x} cy={dev.y} r={range}
                fill="#22c55e" fillOpacity={0.15} stroke="#22c55e" strokeOpacity={0.3}
                strokeWidth={1} />
            );
          }

          const d = buildWedgePath(dev.x, dev.y, angle, range, rotation);
          return (
            <path key={dev.id + '_heat'} d={d}
              fill="#22c55e" fillOpacity={0.18} stroke="#22c55e" strokeOpacity={0.4}
              strokeWidth={1.5} />
          );
        })}
        {/* DORI rings */}
        {cameras.map(dev => {
          const params = getFovParams(dev);
          if (!params) return null;
          const { range } = params;
          const rings = [
            { r: range * 0.25, color: '#22c55e' },
            { r: range * 0.5, color: '#84cc16' },
            { r: range * 0.75, color: '#eab308' },
            { r: range, color: '#f97316' },
          ];
          return rings.map((ring, i) => (
            <circle key={dev.id + '_ring_' + i} cx={dev.x} cy={dev.y} r={ring.r}
              fill="none" stroke={ring.color} strokeWidth={0.8}
              strokeDasharray="3 3" opacity={0.5} />
          ));
        })}
      </svg>
    );
  }

  // Standard FOV cones — Hikvision style
  return (
    <>
      <svg className="fov-overlay" width="4000" height="4000"
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', zIndex: 3 }}>
        <defs>
          <linearGradient id="fov-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={fovFill} stopOpacity={fovFillOpacity * 1.5} />
            <stop offset="100%" stopColor={fovFill} stopOpacity={fovFillOpacity * 0.3} />
          </linearGradient>
        </defs>
        {cameras.map(dev => {
          const params = getFovParams(dev);
          if (!params) return null;

          const { angle, range } = params;
          const rotation = dev.fovRotation ?? dev.rotation ?? 0;

          if (angle >= 360) {
            return (
              <circle key={dev.id + '_fov'} cx={dev.x} cy={dev.y} r={range}
                fill={fovFill} fillOpacity={fovFillOpacity} stroke={fovStroke}
                strokeOpacity={fovStrokeOpacity} strokeWidth={fovStrokeWidth} />
            );
          }

          const d = buildWedgePath(dev.x, dev.y, angle, range, rotation);

          return (
            <g key={dev.id + '_fov'}>
              {/* Main FOV cone — solid fill + solid border */}
              <path d={d}
                fill={fovFill} fillOpacity={fovFillOpacity}
                stroke={fovStroke} strokeOpacity={fovStrokeOpacity}
                strokeWidth={fovStrokeWidth} strokeLinejoin="round" />
              {/* Center line (direction indicator) */}
              <line
                x1={dev.x} y1={dev.y}
                x2={dev.x + range * 0.4 * Math.cos(toRad(rotation))}
                y2={dev.y + range * 0.4 * Math.sin(toRad(rotation))}
                stroke={fovStroke} strokeOpacity={0.3} strokeWidth={1}
                strokeDasharray="4 3" />
            </g>
          );
        })}
      </svg>

      {/* Rotation handles — rendered as HTML divs for pointer events */}
      {updateDevice && cameras.map(dev => {
        const params = getFovParams(dev);
        if (!params) return null;
        const { angle, range } = params;
        if (angle >= 360) return null;

        const rotation = dev.fovRotation ?? dev.rotation ?? 0;
        const z = zoom || 1;
        const p = pan || { x: 0, y: 0 };

        // Handle position at the tip of the FOV center line
        const handleDist = range * 0.7;
        const hx = dev.x + handleDist * Math.cos(toRad(rotation));
        const hy = dev.y + handleDist * Math.sin(toRad(rotation));

        // Convert canvas coords to screen coords
        const screenX = hx * z + p.x;
        const screenY = hy * z + p.y;
        const isDragging = dragging === dev.id;

        return (
          <div key={dev.id + '_handle'}
            style={{
              position: 'absolute',
              left: screenX - 7,
              top: screenY - 7,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: isDragging ? '#00b8b8' : '#fff',
              border: `2px solid ${fovStroke}`,
              cursor: 'grab',
              zIndex: 8,
              boxShadow: '0 1px 4px rgba(0,0,0,.25)',
              transition: isDragging ? 'none' : 'background .15s',
              pointerEvents: 'auto',
            }}
            title="Arraste para direcionar a câmera"
            onMouseDown={(e) => handleMouseDown(e, dev.id)}
          />
        );
      })}
    </>
  );
}
