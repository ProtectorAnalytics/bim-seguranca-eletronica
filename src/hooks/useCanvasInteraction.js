import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook for canvas zoom, pan, and panning interactions.
 * @param {React.RefObject} canvasRef - ref to the .canvas-area element (for focal-point zoom)
 */
export function useCanvasInteraction(canvasRef) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const prevToolRef = useRef(null);

  // Refs to always-current values — avoids stale closure in RAF callbacks
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const rafPanRef = useRef(null);
  const pendingPanRef = useRef(null);

  // Keep refs in sync with state
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Focal-point zoom: keeps the point under the cursor fixed while zooming
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const el = canvasRef?.current;
    if (!el) {
      // Fallback without focal point
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.max(0.3, Math.min(3, z + delta)));
      return;
    }

    const rect = el.getBoundingClientRect();
    const currentZoom = zoomRef.current;
    const currentPan = panRef.current;

    // Mouse position relative to container (screen-space)
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Same point in canvas-space (invariant we want to preserve)
    const mouseCanvasX = (mouseX - currentPan.x) / currentZoom;
    const mouseCanvasY = (mouseY - currentPan.y) / currentZoom;

    // New zoom (10% per scroll step)
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.3, Math.min(3, currentZoom * factor));

    // New pan that keeps mouseCanvas point under the cursor
    const newPanX = mouseX - mouseCanvasX * newZoom;
    const newPanY = mouseY - mouseCanvasY * newZoom;

    zoomRef.current = newZoom;
    panRef.current = { x: newPanX, y: newPanY };
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [canvasRef]);

  // Pan drag handlers with RAF throttle for smooth 60fps
  useEffect(() => {
    const onMove = (e) => {
      if (!isPanningRef.current) return;

      pendingPanRef.current = {
        x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
      };

      if (!rafPanRef.current) {
        rafPanRef.current = requestAnimationFrame(() => {
          rafPanRef.current = null;
          if (pendingPanRef.current) {
            const p = pendingPanRef.current;
            pendingPanRef.current = null;
            panRef.current = p;
            setPan(p);
          }
        });
      }
    };

    const onUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
      }
      if (rafPanRef.current) {
        cancelAnimationFrame(rafPanRef.current);
        rafPanRef.current = null;
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafPanRef.current) cancelAnimationFrame(rafPanRef.current);
    };
  }, []);

  const startPan = (clientX, clientY) => {
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = { x: clientX, y: clientY, panX: panRef.current.x, panY: panRef.current.y };
  };

  const resetView = () => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return {
    zoom, setZoom, pan, setPan,
    isPanning, setIsPanning, isPanningRef, panStartRef, prevToolRef,
    zoomRef, panRef,
    handleWheel, startPan, resetView,
  };
}
