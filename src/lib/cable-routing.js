// ====================================================================
// CABLE ROUTING — Orthogonal route generation and SVG path building
// Extracted from ProjectApp.jsx for clarity and reuse
// ====================================================================

/**
 * autoOrthoRoute — Generate an orthogonal Z-route from (x1,y1) to (x2,y2)
 *
 * If the points are nearly aligned (H or V), returns a straight line.
 * Otherwise produces a Z-shaped route through the horizontal midpoint.
 *
 * @returns {Array<{x:number,y:number}>} ordered point array
 */
export function autoOrthoRoute(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const absDx = Math.abs(dx), absDy = Math.abs(dy);
  if (absDx < 5 || absDy < 5) {
    // Nearly aligned — straight line
    return [{ x: x1, y: y1 }, { x: x2, y: y2 }];
  }
  // Z-route through midpoint: horizontal → vertical → horizontal
  const mx = (x1 + x2) / 2;
  return [{ x: x1, y: y1 }, { x: mx, y: y1 }, { x: mx, y: y2 }, { x: x2, y: y2 }];
}

/**
 * buildOrthoPath — Build an SVG path string from a point array
 *
 * Produces line segments with rounded corners (quadratic Bézier arcs)
 * at every bend. The radius is clamped so it never exceeds half the
 * length of the adjacent segments.
 *
 * @param {Array<{x:number,y:number}>} pts  ordered points
 * @param {number} radius  maximum corner radius (px)
 * @returns {string} SVG "d" attribute
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
    // Points before and after the corner
    const bx = curr.x - dx1 / len1 * r, by = curr.y - dy1 / len1 * r;
    const ax = curr.x + dx2 / len2 * r, ay = curr.y + dy2 / len2 * r;
    d += ` L${bx},${by} Q${curr.x},${curr.y} ${ax},${ay}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}
