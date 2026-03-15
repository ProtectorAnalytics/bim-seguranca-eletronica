// ====================================================================
// CABLE ROUTING v2 — Professional orthogonal routing with exit stubs
// Inspired by draw.io / Visio cable routing standards
// ====================================================================

/** Cardinal anchor directions: N=top, E=right, S=bottom, W=left */
export const ANCHORS = ['N', 'E', 'S', 'W'];

/** Next anchor in cycle (for click-to-change) */
export const nextAnchor = (a) => ANCHORS[(ANCHORS.indexOf(a) + 1) % 4];

/** Minimum exit stub length — cable extends straight out before turning */
const STUB = 20;

/** Direction vectors for each anchor */
const DIR = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

/** Opposite anchor */
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };

/**
 * getAnchorPoint — Compute x,y of an anchor on a device border
 * @param {{x:number,y:number}} dev  device position (top-left origin)
 * @param {number} R  device radius (half icon size)
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
 * bestAnchor — Auto-select the best anchor from one device toward another
 */
export function bestAnchor(fromDev, fromR, toDev, toR) {
  const fcx = fromDev.x + fromR;
  const fcy = fromDev.y + fromR;
  const tcx = toDev.x + toR;
  const tcy = toDev.y + toR;
  const dx = tcx - fcx;
  const dy = tcy - fcy;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? 'E' : 'W';
  }
  return dy > 0 ? 'S' : 'N';
}

/**
 * bestAnchorPair — Auto-select anchors for both endpoints
 * Returns [fromAnchor, toAnchor] that face each other logically.
 * Considers relative position to pick the most natural exit/entry.
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

  // If devices are very close, use facing anchors
  if (adx < 5 && ady < 5) return ['E', 'W'];

  if (adx > ady) {
    return dx > 0 ? ['E', 'W'] : ['W', 'E'];
  }
  return dy > 0 ? ['S', 'N'] : ['N', 'S'];
}

/**
 * autoOrthoRoute — Generate a clean orthogonal route with exit stubs
 *
 * Strategy: Each endpoint gets a mandatory exit stub (straight segment
 * in the anchor direction). Then the two stubs are connected with at
 * most one or two intermediate segments, producing routes like:
 *   ╶──┐       (L-shape)
 *      └──╴
 *   ╶──┐       (Z-shape)
 *      │
 *      └──╴
 *
 * This ensures cables always visually "leave" and "arrive" at the device
 * perpendicular to its border, matching professional CAD tools.
 */
export function autoOrthoRoute(x1, y1, x2, y2, anchorFrom, anchorTo) {
  // Exit stub endpoints
  const dF = DIR[anchorFrom] || DIR.E;
  const dT = DIR[anchorTo] || DIR.W;
  const stub = STUB;

  const sx1 = x1 + dF.x * stub;
  const sy1 = y1 + dF.y * stub;
  const sx2 = x2 + dT.x * stub;
  const sy2 = y2 + dT.y * stub;

  const hFrom = anchorFrom === 'E' || anchorFrom === 'W';
  const hTo = anchorTo === 'E' || anchorTo === 'W';

  // Nearly aligned stubs — direct connection
  const dsx = Math.abs(sx2 - sx1);
  const dsy = Math.abs(sy2 - sy1);
  if (dsx < 4 && dsy < 4) {
    return [{ x: x1, y: y1 }, { x: sx1, y: sy1 }, { x: sx2, y: sy2 }, { x: x2, y: y2 }];
  }

  // Same axis stubs (H-H or V-V): connect via Z-route through midpoint
  if (hFrom && hTo) {
    // Both horizontal exit — Z-route
    if (Math.abs(sy1 - sy2) < 4) {
      // Same Y — straight line through stubs
      return [{ x: x1, y: y1 }, { x: sx1, y: sy1 }, { x: sx2, y: sy2 }, { x: x2, y: y2 }];
    }
    const mx = (sx1 + sx2) / 2;
    return [
      { x: x1, y: y1 }, { x: sx1, y: sy1 },
      { x: mx, y: sy1 }, { x: mx, y: sy2 },
      { x: sx2, y: sy2 }, { x: x2, y: y2 }
    ];
  }

  if (!hFrom && !hTo) {
    // Both vertical exit — Z-route
    if (Math.abs(sx1 - sx2) < 4) {
      return [{ x: x1, y: y1 }, { x: sx1, y: sy1 }, { x: sx2, y: sy2 }, { x: x2, y: y2 }];
    }
    const my = (sy1 + sy2) / 2;
    return [
      { x: x1, y: y1 }, { x: sx1, y: sy1 },
      { x: sx1, y: my }, { x: sx2, y: my },
      { x: sx2, y: sy2 }, { x: x2, y: y2 }
    ];
  }

  // Mixed axes (H-V or V-H): L-route connecting stubs
  if (hFrom && !hTo) {
    // From exits horizontally, To exits vertically — meet at corner
    return [
      { x: x1, y: y1 }, { x: sx1, y: sy1 },
      { x: sx2, y: sy1 },
      { x: sx2, y: sy2 }, { x: x2, y: y2 }
    ];
  }
  // V-H: From exits vertically, To exits horizontally
  return [
    { x: x1, y: y1 }, { x: sx1, y: sy1 },
    { x: sx1, y: sy2 },
    { x: sx2, y: sy2 }, { x: x2, y: y2 }
  ];
}

/**
 * buildOrthoPath — Build SVG path with rounded corners (quadratic Bézier)
 * Produces clean, professional-looking cable paths.
 */
export function buildOrthoPath(pts, radius = 10) {
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

    // Check if direction actually changes (skip if collinear)
    const cross = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(cross) < 0.5) {
      // Collinear — just draw a line to the point
      d += ` L${curr.x},${curr.y}`;
      continue;
    }

    const bx = curr.x - dx1 / len1 * r, by = curr.y - dy1 / len1 * r;
    const ax = curr.x + dx2 / len2 * r, ay = curr.y + dy2 / len2 * r;
    d += ` L${bx},${by} Q${curr.x},${curr.y} ${ax},${ay}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}

/**
 * getStubPoint — Get the exit stub endpoint for an anchor
 * Used for rendering anchor arrows/indicators
 */
export function getStubPoint(anchorPt, anchor, length = STUB) {
  const d = DIR[anchor] || DIR.E;
  return { x: anchorPt.x + d.x * length, y: anchorPt.y + d.y * length };
}
