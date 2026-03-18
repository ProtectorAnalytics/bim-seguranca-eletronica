import React, { memo } from 'react';
import { CABLE_TYPES } from '@/data/cable-types';
import { autoOrthoRoute, buildOrthoPath, getAnchorPoint, bestAnchorPair, nextAnchor } from '@/lib/cable-routing';

/**
 * SVG layer rendering all cable connections between devices.
 * Wrapped in React.memo — only re-renders when connections, devices or zoom/pan change.
 */
const ConnectionsLayer = memo(function ConnectionsLayer({
  connections, devices, quadros, cableMode, validTargets, selectedConn, setSelectedConn,
  setSelectedDevice, showCableLabels, getDevR, zoom, pan, canvasRef,
  updateFloor, updateConnWaypoints, setDraggingWp, snapToGrid: _snapToGrid
}) {
  return (
    <>
      {/* Connection anchor dot indicators on devices in cable mode */}
      {cableMode && devices.filter(d => !d.quadroId).map(dev => {
        const R = getDevR(dev);
        const cx = dev.x + R, cy = dev.y + R;
        const anchors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
        const ts = validTargets[dev.id];
        if (ts !== 'valid' && dev.id !== cableMode?.from) return null;
        const dotColor = dev.id === cableMode?.from ? '#f59e0b' : '#22c55e';
        return <g key={'anc_' + dev.id}>
          {anchors.map(([ax, ay], i) => (
            <circle key={i} cx={cx + ax * (R + 1)} cy={cy + ay * (R + 1)} r={4}
              fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
              style={{ pointerEvents: 'none' }} />
          ))}
        </g>;
      })}
      {/* Anchor dots on Quadros when they contain valid cable targets */}
      {cableMode && quadros.map(qc => {
        const qcDevs = devices.filter(d => d.quadroId === qc.id);
        const hasValidTarget = qcDevs.some(d => validTargets[d.id] === 'valid');
        const hasSource = qcDevs.some(d => d.id === cableMode?.from);
        if (!hasValidTarget && !hasSource) return null;
        const qW = 160; const headerH = 28; const slotH = 22;
        const qH = headerH + Math.max(2, qcDevs.length) * slotH + 12;
        const cx = qc.x + qW / 2, cy = qc.y + qH / 2;
        const dotColor = hasSource ? '#f59e0b' : '#22c55e';
        const anchorsPos = [[0, -qH / 2 - 4], [qW / 2 + 4, 0], [0, qH / 2 + 4], [-qW / 2 - 4, 0]];
        return <g key={'anc_qc_' + qc.id}>
          {anchorsPos.map(([ax, ay], i) => (
            <circle key={i} cx={cx + ax} cy={cy + ay} r={5}
              fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
              style={{ pointerEvents: 'none' }} />
          ))}
        </g>;
      })}
      {connections.map(conn => {
        const from = devices.find(d => d.id === conn.from);
        const to = devices.find(d => d.id === conn.to);
        if (!from || !to) return null;
        const ct = CABLE_TYPES.find(c => c.id === conn.type) || CABLE_TYPES[0];
        const isSel = selectedConn === conn.id;

        const resolveDevPos = (dev) => {
          const R = getDevR(dev);
          if (dev.quadroId) {
            const qc = quadros.find(q => q.id === dev.quadroId);
            if (qc) return { x: qc.x + 80 - R, y: qc.y + 14 - R, R, inQuadro: true };
          }
          return { x: dev.x, y: dev.y, R, inQuadro: false };
        };
        const fp = resolveDevPos(from);
        const tp = resolveDevPos(to);

        const aFrom = conn.anchorFrom || bestAnchorPair({ x: fp.x, y: fp.y }, fp.R, { x: tp.x, y: tp.y }, tp.R)[0];
        const aTo = conn.anchorTo || bestAnchorPair({ x: fp.x, y: fp.y }, fp.R, { x: tp.x, y: tp.y }, tp.R)[1];

        const ap1 = getAnchorPoint({ x: fp.x, y: fp.y }, fp.R, aFrom);
        const ap2 = getAnchorPoint({ x: tp.x, y: tp.y }, tp.R, aTo);

        // Offset for multiple connections between same pair
        const pairKey = [conn.from, conn.to].sort().join('|');
        const pairConns = connections.filter(c => [c.from, c.to].sort().join('|') === pairKey);
        const pairIdx = pairConns.indexOf(conn);
        const pairTotal = pairConns.length;
        const offsetAmt = pairTotal > 1 ? (pairIdx - (pairTotal - 1) / 2) * 6 : 0;

        const pdx = ap2.x - ap1.x, pdy = ap2.y - ap1.y;
        const plen = Math.sqrt(pdx * pdx + pdy * pdy) || 1;
        const ppx = -pdy / plen, ppy = pdx / plen;
        const x1 = ap1.x + ppx * offsetAmt;
        const y1 = ap1.y + ppy * offsetAmt;
        const x2 = ap2.x + ppx * offsetAmt;
        const y2 = ap2.y + ppy * offsetAmt;

        const isPower = ct.group === 'power';
        const isSignal = ct.group === 'signal';
        const isAuto = ct.group === 'automation';
        const isWireless = conn.type === 'wireless';
        const dashArr = isWireless ? '6 4' : isPower ? '10 5' : isSignal ? '4 4' : isAuto ? '10 4 3 4' : 'none';
        const sw = isPower ? 2.8 : isAuto ? 2.4 : isSignal ? 2 : isWireless ? 1.5 : 2.2;
        const cableColor = isPower ? '#dc2626' : isSignal ? '#16a34a' : isAuto ? '#7c3aed' : isWireless ? '#94a3b8' : ct.color;
        const purposeIcon = isPower ? '⚡' : isSignal ? '📡' : isAuto ? '🔧' : '';
        const portLabel = conn.ifaceLabel ? ` [${conn.ifaceLabel.split('(')[0].trim()}]` : '';

        const wps = conn.waypoints || [];
        const hasWps = wps.length > 0;

        let allPts;
        if (hasWps) {
          allPts = [{ x: x1, y: y1 }, ...wps, { x: x2, y: y2 }];
        } else {
          allPts = autoOrthoRoute(x1, y1, x2, y2, aFrom, aTo);
        }

        const pathD = buildOrthoPath(allPts, 10);

        const totalLen = allPts.length;
        const midIdx = Math.floor(totalLen / 2);
        const lp = allPts[midIdx];
        const lpPrev = allPts[Math.max(0, midIdx - 1)];
        const labelX = (lp.x + lpPrev.x) / 2;
        const labelY = (lp.y + lpPrev.y) / 2 - 10;

        const arrowSeg1 = allPts[Math.max(0, midIdx - 1)];
        const arrowSeg2 = allPts[midIdx];
        const arDx = arrowSeg2.x - arrowSeg1.x, arDy = arrowSeg2.y - arrowSeg1.y;
        const arLen = Math.sqrt(arDx * arDx + arDy * arDy) || 1;
        const arAngle = Math.atan2(arDy, arDx) * 180 / Math.PI;
        const arMx = (arrowSeg1.x + arrowSeg2.x) / 2;
        const arMy = (arrowSeg1.y + arrowSeg2.y) / 2;

        const onConnClick = (e) => {
          e.stopPropagation();
          if (cableMode) return;
          setSelectedConn(isSel ? null : conn.id);
          setSelectedDevice(null);
        };

        return <g key={conn.id} className={`conn-g${isSel ? ' conn-selected' : ''}`}>
          <path d={pathD} className="conn-hit-area" onClick={onConnClick} />
          <path d={pathD} fill="none" className="conn-line-path"
            stroke={isSel ? '#3b82f6' : cableColor} strokeWidth={isSel ? sw + 1.5 : sw}
            strokeDasharray={dashArr} strokeLinejoin="round" strokeLinecap="round"
            style={{ pointerEvents: 'none', opacity: isSel ? 1 : 0.85 }} />
          <circle cx={x1} cy={y1} r={isSel ? 4 : 3} fill={isSel ? '#3b82f6' : cableColor}
            stroke="#fff" strokeWidth={1} style={{ pointerEvents: 'none' }} />
          <circle cx={x2} cy={y2} r={isSel ? 4 : 3} fill={isSel ? '#3b82f6' : cableColor}
            stroke="#fff" strokeWidth={1} style={{ pointerEvents: 'none' }} />
          {!isPower && !isSignal && arLen > 30 && (
            <polygon
              points="-4,-3 4,0 -4,3"
              fill={isSel ? '#3b82f6' : cableColor}
              opacity={0.7}
              transform={`translate(${arMx},${arMy}) rotate(${arAngle})`}
              style={{ pointerEvents: 'none' }} />
          )}
          {showCableLabels && (() => {
            const lt = `${purposeIcon}${ct.name} · ${conn.distance}m${portLabel}`;
            const estW = Math.max(lt.length * 6.2 + 14, 44);
            return <g style={{ pointerEvents: 'none' }}>
              <rect x={labelX - estW / 2} y={labelY - 14} width={estW} height={18}
                rx={4} ry={4} fill="#fff" fillOpacity={0.94}
                stroke={isSel ? '#3b82f6' : '#e2e8f0'} strokeWidth={isSel ? 1 : 0.5} />
              <text x={labelX} y={labelY} className="cable-label-v2">{lt}</text>
            </g>;
          })()}

          {/* Segment drag handles (when selected) */}
          {isSel && allPts.slice(0, -1).map((pt, si) => {
            const npt = allPts[si + 1];
            const segD = `M${pt.x},${pt.y} L${npt.x},${npt.y}`;
            return <g key={'seg' + si}>
              <path d={segD} className="seg-hit"
                onMouseDown={(e) => {
                  if (cableMode) return;
                  e.stopPropagation(); e.preventDefault();
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const mx = (e.clientX - rect.left) / zoom - pan.x / zoom;
                  const my = (e.clientY - rect.top) / zoom - pan.y / zoom;
                  if (!hasWps) {
                    const autoWps = autoOrthoRoute(x1, y1, x2, y2, aFrom, aTo);
                    const innerWps = autoWps.slice(1, -1);
                    updateConnWaypoints(conn.id, innerWps);
                    setDraggingWp({ connId: conn.id, type: 'seg', segIdx: Math.min(si, innerWps.length - 2 > 0 ? si - 1 : 0), lastX: mx, lastY: my });
                  } else {
                    if (si === 0 || si >= allPts.length - 2) {
                      setDraggingWp({ connId: conn.id, type: 'newSeg', segIdx: si, allPts, lastX: mx, lastY: my });
                    } else {
                      setDraggingWp({ connId: conn.id, type: 'seg', segIdx: si - 1, lastX: mx, lastY: my });
                    }
                  }
                  setSelectedConn(conn.id);
                }} />
              <path d={segD} className="seg-highlight" />
            </g>;
          })}

          {/* Waypoint handles */}
          {isSel && wps.map((wp, wi) => (
            <g key={'wph' + wi}>
              <rect x={wp.x - 12} y={wp.y - 12} width={24} height={24}
                fill="transparent" style={{ cursor: 'move' }}
                onMouseDown={(e) => {
                  e.stopPropagation(); e.preventDefault();
                  setDraggingWp({ connId: conn.id, type: 'point', wpIdx: wi });
                  setSelectedConn(conn.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  const connObj = connections.find(c => c.id === conn.id);
                  if (!connObj || !connObj.waypoints) return;
                  const newWps = [...(connObj.waypoints)];
                  newWps.splice(wi, 1);
                  updateConnWaypoints(conn.id, newWps.length ? newWps : undefined);
                }} />
              <circle cx={wp.x} cy={wp.y} r={5}
                fill="#3b82f6" stroke="#fff" strokeWidth={2}
                style={{ pointerEvents: 'none' }} />
            </g>
          ))}

          {/* Anchor change buttons (N/E/S/W) */}
          {isSel && !cableMode && (() => {
            return <>
              <circle cx={ap1.x} cy={ap1.y} r={7} fill="#046BD2" stroke="#fff" strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const nxt = nextAnchor(aFrom);
                  updateFloor(f => ({
                    ...f, connections: f.connections.map(c =>
                      c.id === conn.id ? { ...c, anchorFrom: nxt, waypoints: undefined } : c)
                  }));
                }}>
                <title>Alterar saída: {aFrom} → {nextAnchor(aFrom)}</title>
              </circle>
              <text x={ap1.x} y={ap1.y + 1} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={9} fontWeight={700} style={{ pointerEvents: 'none' }}>
                {aFrom}
              </text>
              <circle cx={ap2.x} cy={ap2.y} r={7} fill="#046BD2" stroke="#fff" strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  const nxt = nextAnchor(aTo);
                  updateFloor(f => ({
                    ...f, connections: f.connections.map(c =>
                      c.id === conn.id ? { ...c, anchorTo: nxt, waypoints: undefined } : c)
                  }));
                }}>
                <title>Alterar chegada: {aTo} → {nextAnchor(aTo)}</title>
              </circle>
              <text x={ap2.x} y={ap2.y + 1} textAnchor="middle" dominantBaseline="central"
                fill="#fff" fontSize={9} fontWeight={700} style={{ pointerEvents: 'none' }}>
                {aTo}
              </text>
            </>;
          })()}
        </g>;
      })}
    </>
  );
});

export default ConnectionsLayer;
