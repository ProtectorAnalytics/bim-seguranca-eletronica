import React, { memo, useState, useCallback } from 'react';
import { CABLE_TYPES } from '@/data/cable-types';
import { ANCHORS, autoOrthoRoute, buildOrthoPath, getAnchorPoint, bestAnchorPair } from '@/lib/cable-routing';

/**
 * SVG layer rendering all cable connections between devices.
 *
 * Revolution v2 UX improvements:
 * - Ghost mid-segment handles visible on hover (no need to select first)
 * - All 4 anchor buttons shown simultaneously (no more cycling)
 * - Reset routing pill button when custom waypoints exist
 * - Larger waypoint handles (8px) with ✕ delete hint
 * - Direction-aware cursor (ns-resize / ew-resize)
 * - Right-click context menu via onConnContextMenu prop
 * - Native SVG <title> tooltip showing cable info on hover
 */
const ConnectionsLayer = memo(function ConnectionsLayer({
  connections, devices, quadros, cableMode, validTargets, selectedConn, setSelectedConn,
  setSelectedDevice, showCableLabels, getDevR, zoom, pan, canvasRef,
  updateFloor, updateConnWaypoints, setDraggingWp, snapToGrid,
  onConnContextMenu,
}) {
  const [hoveredConnId, setHoveredConnId] = useState(null);

  /** Start dragging a segment — works even when connection is not yet selected */
  const startSegDrag = useCallback((e, conn, si, allPts, hasWps, x1, y1, x2, y2, aFrom, aTo) => {
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
      // si is index in allPts; allPts[0] is anchor (not a waypoint),
      // so the waypoint index is si-1. Clamp to valid range.
      const segIdx = Math.max(0, Math.min(si - 1, innerWps.length - 2));
      setDraggingWp({ connId: conn.id, type: 'seg', segIdx, lastX: mx, lastY: my });
    } else {
      if (si === 0 || si >= allPts.length - 2) {
        setDraggingWp({ connId: conn.id, type: 'newSeg', segIdx: si, allPts, lastX: mx, lastY: my });
      } else {
        setDraggingWp({ connId: conn.id, type: 'seg', segIdx: si - 1, lastX: mx, lastY: my });
      }
    }
    setSelectedConn(conn.id);
    setSelectedDevice(null);
  }, [cableMode, zoom, pan, canvasRef, updateConnWaypoints, setDraggingWp, setSelectedConn, setSelectedDevice]);

  return (
    <>
      {/* Anchor dot indicators on devices in cable mode */}
      {cableMode && devices.filter(d => !d.quadroId).map(dev => {
        const R = getDevR(dev);
        const cx = dev.x + R, cy = dev.y + R;
        const ts = validTargets[dev.id];
        if (ts !== 'valid' && dev.id !== cableMode?.from) return null;
        const dotColor = dev.id === cableMode?.from ? '#f59e0b' : '#22c55e';
        return (
          <g key={'anc_' + dev.id}>
            {[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([ax, ay], i) => (
              <circle key={i} cx={cx + ax * (R + 1)} cy={cy + ay * (R + 1)} r={4}
                fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
                style={{ pointerEvents: 'none' }} />
            ))}
          </g>
        );
      })}

      {/* Anchor dots on Quadros in cable mode */}
      {cableMode && quadros.map(qc => {
        const qcDevs = devices.filter(d => d.quadroId === qc.id);
        const hasValidTarget = qcDevs.some(d => validTargets[d.id] === 'valid');
        const hasSource = qcDevs.some(d => d.id === cableMode?.from);
        if (!hasValidTarget && !hasSource) return null;
        const qW = 160, headerH = 28, slotH = 22;
        const qH = headerH + Math.max(2, qcDevs.length) * slotH + 12;
        const cx = qc.x + qW / 2, cy = qc.y + qH / 2;
        const dotColor = hasSource ? '#f59e0b' : '#22c55e';
        const anchorsPos = [[0, -qH / 2 - 4], [qW / 2 + 4, 0], [0, qH / 2 + 4], [-qW / 2 - 4, 0]];
        return (
          <g key={'anc_qc_' + qc.id}>
            {anchorsPos.map(([ax, ay], i) => (
              <circle key={i} cx={cx + ax} cy={cy + ay} r={5}
                fill={dotColor} stroke="#fff" strokeWidth={1.5} opacity={0.85}
                style={{ pointerEvents: 'none' }} />
            ))}
          </g>
        );
      })}

      {connections.map(conn => {
        const from = devices.find(d => d.id === conn.from);
        const to = devices.find(d => d.id === conn.to);
        if (!from || !to) return null;

        const ct = CABLE_TYPES.find(c => c.id === conn.type) || CABLE_TYPES[0];
        const isSel = selectedConn === conn.id;
        const isHov = !isSel && hoveredConnId === conn.id;

        const resolveDevPos = (dev) => {
          const R = getDevR(dev);
          if (dev.quadroId) {
            const qc = quadros.find(q => q.id === dev.quadroId);
            if (qc) return { x: qc.x + 80 - R, y: qc.y + 14 - R, R };
          }
          return { x: dev.x, y: dev.y, R };
        };
        const fp = resolveDevPos(from);
        const tp = resolveDevPos(to);

        const aFrom = conn.anchorFrom || bestAnchorPair({ x: fp.x, y: fp.y }, fp.R, { x: tp.x, y: tp.y }, tp.R)[0];
        const aTo   = conn.anchorTo   || bestAnchorPair({ x: fp.x, y: fp.y }, fp.R, { x: tp.x, y: tp.y }, tp.R)[1];

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
        const x1 = ap1.x + ppx * offsetAmt, y1 = ap1.y + ppy * offsetAmt;
        const x2 = ap2.x + ppx * offsetAmt, y2 = ap2.y + ppy * offsetAmt;

        // Cable styling
        const isPower    = ct.group === 'power';
        const isSignal   = ct.group === 'signal';
        const isAuto     = ct.group === 'automation';
        const isWireless = conn.type === 'wireless';
        const dashArr    = isWireless ? '6 4' : isPower ? '10 5' : isSignal ? '4 4' : isAuto ? '10 4 3 4' : 'none';
        const sw         = isPower ? 2.8 : isAuto ? 2.4 : isSignal ? 2 : isWireless ? 1.5 : 2.2;
        const baseCableColor = isPower ? '#dc2626' : isSignal ? '#16a34a' : isAuto ? '#7c3aed' : isWireless ? '#94a3b8' : ct.color;
        const cableColor = isSel ? '#3b82f6' : isHov ? '#60a5fa' : baseCableColor;
        const portLabel  = conn.ifaceLabel ? ` [${conn.ifaceLabel.split('(')[0].trim()}]` : '';

        const wps    = conn.waypoints || [];
        const hasWps = wps.length > 0;
        const allPts = hasWps
          ? [{ x: x1, y: y1 }, ...wps, { x: x2, y: y2 }]
          : autoOrthoRoute(x1, y1, x2, y2, aFrom, aTo);
        const pathD = buildOrthoPath(allPts, 10);

        // Label + arrow midpoint
        const midIdx  = Math.floor(allPts.length / 2);
        const lp      = allPts[midIdx];
        const lpPrev  = allPts[Math.max(0, midIdx - 1)];
        const labelX  = (lp.x + lpPrev.x) / 2;
        const labelY  = (lp.y + lpPrev.y) / 2 - 10;
        const arDx    = lp.x - lpPrev.x, arDy = lp.y - lpPrev.y;
        const arLen   = Math.sqrt(arDx * arDx + arDy * arDy) || 1;
        const arAngle = Math.atan2(arDy, arDx) * 180 / Math.PI;
        const arMx    = (lpPrev.x + lp.x) / 2, arMy = (lpPrev.y + lp.y) / 2;

        const onConnClick = (e) => {
          e.stopPropagation();
          if (cableMode) return;
          setSelectedConn(isSel ? null : conn.id);
          setSelectedDevice(null);
        };

        const tooltipText = `${ct.name} · ${conn.distance}m${portLabel}`;

        return (
          <g
            key={conn.id}
            className={`conn-g${isSel ? ' conn-selected' : isHov ? ' conn-hov' : ''}`}
            onMouseEnter={() => !cableMode && setHoveredConnId(conn.id)}
            onMouseLeave={() => setHoveredConnId(null)}
            onContextMenu={(e) => {
              e.preventDefault(); e.stopPropagation();
              if (cableMode) return;
              setSelectedConn(conn.id);
              setSelectedDevice(null);
              onConnContextMenu?.(conn.id, e.clientX, e.clientY);
            }}
          >
            {/* Wide invisible hit area — click to select */}
            <path d={pathD} className="conn-hit-area" onClick={onConnClick}>
              <title>{tooltipText}</title>
            </path>

            {/* Visual cable line */}
            <path d={pathD} fill="none" className="conn-line-path"
              stroke={cableColor}
              strokeWidth={isSel ? sw + 1.5 : isHov ? sw + 0.8 : sw}
              strokeDasharray={dashArr}
              strokeLinejoin="round" strokeLinecap="round"
              style={{ pointerEvents: 'none', opacity: isSel || isHov ? 1 : 0.85 }} />

            {/* End-point dots */}
            <circle cx={x1} cy={y1} r={isSel ? 4 : 3} fill={cableColor}
              stroke="#fff" strokeWidth={1} style={{ pointerEvents: 'none' }} />
            <circle cx={x2} cy={y2} r={isSel ? 4 : 3} fill={cableColor}
              stroke="#fff" strokeWidth={1} style={{ pointerEvents: 'none' }} />

            {/* Direction arrow */}
            {!isPower && !isSignal && arLen > 30 && (
              <polygon points="-4,-3 4,0 -4,3"
                fill={cableColor} opacity={0.7}
                transform={`translate(${arMx},${arMy}) rotate(${arAngle})`}
                style={{ pointerEvents: 'none' }} />
            )}

            {/* Cable label */}
            {showCableLabels && (() => {
              const purposeIcon = isPower ? 'PWR ' : isSignal ? 'SIG ' : isAuto ? 'AUT ' : '';
              const lt = `${purposeIcon}${ct.name} · ${conn.distance}m${portLabel}`;
              const estW = Math.max(lt.length * 6.2 + 14, 44);
              return (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={labelX - estW / 2} y={labelY - 14} width={estW} height={18}
                    rx={4} ry={4} fill="#fff" fillOpacity={0.94}
                    stroke={isSel ? '#3b82f6' : '#e2e8f0'} strokeWidth={isSel ? 1 : 0.5} />
                  <text x={labelX} y={labelY} className="cable-label-v2">{lt}</text>
                </g>
              );
            })()}

            {/* ── Ghost mid-segment handles ──────────────────────────────
                Visible on hover (gray) OR selection (blue).
                Drag directly without needing to select first.
                Each handle sits at the midpoint of its segment.
            ─────────────────────────────────────────────────────────── */}
            {(isSel || isHov) && !cableMode && allPts.slice(0, -1).map((pt, si) => {
              const npt = allPts[si + 1];
              const segLen = Math.sqrt((npt.x - pt.x) ** 2 + (npt.y - pt.y) ** 2);
              if (segLen < 20) return null;
              const midX = (pt.x + npt.x) / 2;
              const midY = (pt.y + npt.y) / 2;
              const isHorizSeg = Math.abs(pt.y - npt.y) < Math.abs(pt.x - npt.x);
              const cursor = isHorizSeg ? 'ns-resize' : 'ew-resize';
              const r = isSel ? 7 : 5;
              const fill = isSel ? '#3b82f6' : '#94a3b8';

              return (
                <g key={'gm' + si}>
                  {/* Large transparent hit zone for easy grabbing */}
                  <circle cx={midX} cy={midY} r={16}
                    fill="transparent"
                    style={{ cursor, pointerEvents: 'all' }}
                    onMouseDown={(e) => startSegDrag(e, conn, si, allPts, hasWps, x1, y1, x2, y2, aFrom, aTo)}
                  />
                  {/* Visible handle dot */}
                  <circle cx={midX} cy={midY} r={r}
                    fill={fill} stroke="#fff" strokeWidth={2}
                    style={{ pointerEvents: 'none' }} />
                  {/* Direction tick (shows drag axis) */}
                  {isSel && (isHorizSeg
                    ? <line x1={midX} y1={midY - 3} x2={midX} y2={midY + 3}
                        stroke="#fff" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
                    : <line x1={midX - 3} y1={midY} x2={midX + 3} y2={midY}
                        stroke="#fff" strokeWidth={1.5} style={{ pointerEvents: 'none' }} />
                  )}
                </g>
              );
            })}

            {/* ── Waypoint drag handles (large, with ✕ delete hint) ─── */}
            {isSel && wps.map((wp, wi) => (
              <g key={'wph' + wi}>
                <rect x={wp.x - 18} y={wp.y - 18} width={36} height={36}
                  fill="transparent" style={{ cursor: 'move' }}
                  onMouseDown={(e) => {
                    e.stopPropagation(); e.preventDefault();
                    setDraggingWp({ connId: conn.id, type: 'point', wpIdx: wi });
                    setSelectedConn(conn.id);
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    const c = connections.find(c => c.id === conn.id);
                    if (!c?.waypoints) return;
                    const nw = [...c.waypoints];
                    nw.splice(wi, 1);
                    updateConnWaypoints(conn.id, nw.length ? nw : undefined);
                  }} />
                <circle cx={wp.x} cy={wp.y} r={8}
                  fill="#3b82f6" stroke="#fff" strokeWidth={2.5}
                  style={{ pointerEvents: 'none' }} />
                <text x={wp.x} y={wp.y} textAnchor="middle" dominantBaseline="central"
                  fill="#fff" fontSize={8} fontWeight={800} style={{ pointerEvents: 'none' }}>
                  ✕
                </text>
              </g>
            ))}

            {/* ── Anchor buttons — FROM device ──────────────────────────
                Auto mode  (conn.anchorFrom = null): dashed outline blue
                  → sistema calculou o melhor ângulo automaticamente
                Fixed mode (conn.anchorFrom = dir): solid blue filled
                  → usuário travou essa direção
                Clicar na direção ativa travada → destrava (volta ao auto)
                Clicar em qualquer outra → trava nessa direção
            ─────────────────────────────────────────────────────────── */}
            {isSel && !cableMode && ANCHORS.map(dir => {
              const pos     = getAnchorPoint({ x: fp.x, y: fp.y }, fp.R, dir);
              const isAct   = dir === aFrom;            // currently active (auto or fixed)
              const isFixed = conn.anchorFrom === dir;  // explicitly locked by user
              return (
                <g key={'af_' + dir} style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Click on locked anchor → unlock (auto); click on any other → lock
                    const newVal = isFixed ? undefined : dir;
                    updateFloor(f => ({
                      ...f, connections: f.connections.map(c =>
                        c.id === conn.id ? { ...c, anchorFrom: newVal, waypoints: undefined } : c)
                    }));
                  }}>
                  <circle cx={pos.x} cy={pos.y}
                    r={isAct ? 9 : 6}
                    fill={isFixed ? '#046BD2' : isAct ? '#eff6ff' : '#f8fafc'}
                    stroke={isFixed ? '#fff' : isAct ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isFixed ? 2 : 1.5}
                    strokeDasharray={!isFixed && isAct ? '2.5 2' : 'none'} />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fill={isFixed ? '#fff' : isAct ? '#3b82f6' : '#94a3b8'}
                    fontSize={isAct ? 9 : 8} fontWeight={700}
                    style={{ pointerEvents: 'none' }}>
                    {dir}
                  </text>
                  {/* Lock indicator on fixed anchors — small filled square */}
                  {isFixed && (
                    <rect x={pos.x - 3} y={pos.y + 11} width={6} height={5}
                      rx={1} fill="#046BD2" style={{ pointerEvents: 'none' }} />
                  )}
                </g>
              );
            })}

            {/* ── Anchor buttons — TO device ────────────────────────── */}
            {isSel && !cableMode && ANCHORS.map(dir => {
              const pos     = getAnchorPoint({ x: tp.x, y: tp.y }, tp.R, dir);
              const isAct   = dir === aTo;
              const isFixed = conn.anchorTo === dir;
              return (
                <g key={'at_' + dir} style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const newVal = isFixed ? undefined : dir;
                    updateFloor(f => ({
                      ...f, connections: f.connections.map(c =>
                        c.id === conn.id ? { ...c, anchorTo: newVal, waypoints: undefined } : c)
                    }));
                  }}>
                  <circle cx={pos.x} cy={pos.y}
                    r={isAct ? 9 : 6}
                    fill={isFixed ? '#046BD2' : isAct ? '#eff6ff' : '#f8fafc'}
                    stroke={isFixed ? '#fff' : isAct ? '#3b82f6' : '#94a3b8'}
                    strokeWidth={isFixed ? 2 : 1.5}
                    strokeDasharray={!isFixed && isAct ? '2.5 2' : 'none'} />
                  <text x={pos.x} y={pos.y} textAnchor="middle" dominantBaseline="central"
                    fill={isFixed ? '#fff' : isAct ? '#3b82f6' : '#94a3b8'}
                    fontSize={isAct ? 9 : 8} fontWeight={700}
                    style={{ pointerEvents: 'none' }}>
                    {dir}
                  </text>
                  {isFixed && (
                    <rect x={pos.x - 3} y={pos.y + 11} width={6} height={5}
                      rx={1} fill="#046BD2" style={{ pointerEvents: 'none' }} />
                  )}
                </g>
              );
            })}

            {/* ── Reset routing pill — shown when custom waypoints exist ── */}
            {isSel && hasWps && (
              <g style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  updateConnWaypoints(conn.id, undefined);
                }}>
                <rect x={labelX - 38} y={labelY + 6} width={76} height={20}
                  rx={10} fill="#fff" stroke="#e2e8f0" strokeWidth={1}
                  filter="drop-shadow(0 1px 3px rgba(0,0,0,0.12))" />
                <text x={labelX} y={labelY + 16} textAnchor="middle" dominantBaseline="central"
                  fill="#64748b" fontSize={9} fontWeight={600} style={{ pointerEvents: 'none' }}>
                  ↺ resetar rota
                </text>
              </g>
            )}
          </g>
        );
      })}
    </>
  );
});

export default ConnectionsLayer;
