import { useState, useEffect, useRef } from 'react';

/**
 * Hook for canvas zoom, pan, and panning interactions.
 */
export function useCanvasInteraction() {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const prevToolRef = useRef(null);

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.max(0.3, Math.min(3, z + delta)));
  };

  // Pan drag handlers (middle-click, hand tool, space+drag)
  useEffect(() => {
    const onMove = (e) => {
      if (!isPanningRef.current) return;
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({ x: panStartRef.current.panX + dx, y: panStartRef.current.panY + dy });
    };
    const onUp = () => {
      if (isPanningRef.current) {
        isPanningRef.current = false;
        setIsPanning(false);
      }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  const startPan = (clientX, clientY) => {
    isPanningRef.current = true;
    setIsPanning(true);
    panStartRef.current = { x: clientX, y: clientY, panX: pan.x, panY: pan.y };
  };

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  return {
    zoom, setZoom, pan, setPan,
    isPanning, setIsPanning, isPanningRef, panStartRef, prevToolRef,
    handleWheel, startPan, resetView
  };
}
