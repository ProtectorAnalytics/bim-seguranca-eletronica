// ====================================================================
// CABLE ROUTING — Anchor points, orthogonal routing, SVG path building
// ====================================================================

/** Cardinal anchor directions: N=top, E=right, S=bottom, W=left */
export const ANCHORS = ['N', 'E', 'S', 'W'];

/** Next anchor in cycle (for click-to-change) */
export const nextAnchor = (a) => ANCHORS[(ANCHORS.indexOf(a) + 1) % 4];

/**
 * getAnchorPoint — Compute x,y of an anchor on a device
 * @param {{x:number,y:number}} dev  device (top-left origin)
 * @param {number} R  device radius (half-width)
 * @param {'N'|'E'|'S'|'W'} anchor  cardinal direction
 * @returns {{x:number,y:number}}
 */
export function getAnchorPoint(dev, R, anchor) {
  const cx = dev.x + R;
  const cy = dev.y + R;
  switch (anchor) {
    case 'N': return { x: cx, y: cy - R };
    case 'E': return { x: cx + R, y: cy };
    case 'S': return { x: cx, y: cy + R };
    case 'W': return { x: cx - R, y: cy };
    default:  return { x: cx, y: cy };
  }
}

/**
 * bestAnchor — Auto-select the best anchor based on relative position
 * Picks the cardinal direction closest to the angle toward the target.
 */
export function bestAnchor(fromDev, fromR, toDev, toR) {
  const fcx = fromDev.x + fromR;
  const fcy = fromDev.y + fromR;
  const tcx = toDev.x + toR;
  const tcy = toDev.y + toR;
  const dx = tcx - fcx;
  const dy = tcy - fcy;
  // Pick the dominant direction
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'E' : 'W';
  }
  return dy > 0 ? 'S' : 'N';
}

/**
 * bestAnchorPair — Auto-select anchors for both endpoints
 * Returns [fromAnchor, toAnchor] that face each other logically.
 */
export function bestAnchorPair(fromDev, fromR, toDev, toR) {
  const fcx = fromDev.x + fromR;
  const fcy = fromDev.y + fromR;
  const tcx = toDev.x + toR;
  const tcy = toDev.y + toR;
  const dx = tcx - fcx;
  const dy = tcy - fcy;
  const adx = Math.abs(dx);
  const ady = Math.abs(dy);

  if (adx > ady) {
    // Horizontal dominant
    return dx > 0 ? ['E', 'W'] : ['W', 'E'];
  }
  // Vertical dominant
  return dy > 0 ? ['S', 'N'] : ['N', 'S'];
}

/**
 * autoOrthoRoute — Generate an orthogonal L/Z-route between two anchor points
 * Takes anchor directions into account for cleaner initial segments.
 */
export function autoOrthoRoute(x1, y1, x2, y2, anchorFrom, anchorTo) {
  const dx = x2 - x1, dy = y2 - y1;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);

  // Nearly aligned — straight line
  if (absDx < 8 && absDy < 8) {
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  }

  // If anchors exit on same axis, use L-route
  const hFrom = anchorFrom === 'E' || anchorFrom === 'W';
  const hTo = anchorTo === 'E' || anchorTo === 'W';

  if (hFrom && hTo) {
    // Both horizontal — Z-route with vertical middle
    const mx = (x1 + x2) / 2;
    return [{ x: x1, y: y1 }, { x: mx, y: y1 }, { x: mx, y: y2 }, { x: x2, y: y2 }];
  }
  if (!hFrom && !hTo) {
    // Both vertical — Z-route with horizontal middle
    const my = (y1 + y2) / 2;
    return [{ x: x1, y: y1 }, { x: x1, y: my }, { x: x2, y: my }, { x: x2, y: y2 }];
  }
  if (hFrom && !hTo) {
    // From exits H, To exits V — L-route
    return [{ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }];
  }
  // From exits V, To exits H — L-route
  return [{ x: x1, y: y1 }, { x: x1, y: y2 }, { x: x2, y: y2 }];
}

/**
 * buildOrthoPath — Build an SVG path string from a point array
 * Produces line segments with rounded corners (quadratic Bézier arcs).
 */
export function buildOrthoPath(pts, radius = 8) {
  if (pts.length < 2) return '';
  if (pts.length === 2) return `M${pts[0].x},${pts[0].y} L${pts[1].x},${pts[1].y}`;

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], curr = pts[i], next = pts[i + 1];
    const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x, dy2 = next.y - curr.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1) || 1;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1;
    const r = Math.min(radius, len1 / 2, len2 / 2);
    const bx = curr.x - dx1 / len1 * r, by = curr.y - dy1 / len1 * r;
    const ax = curr.x + dx2 / len2 * r, ay = curr.y + dy2 / len2 * r;
    d += ` L${bx},${by} Q${curr.x},${curr.y} ${ax},${ay}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}
