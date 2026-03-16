import { useEffect } from 'react';

/**
 * Hook for canvas keyboard shortcuts.
 */
export function useKeyboardShortcuts({
  selectedDevice, selectedConn, connections, devices, multiSelect, tool,
  undo, redo, deleteDevice, deleteConnection, updateConnWaypoints,
  setTool, setPendingDevice, setCableMode, setPortPopup, setSelectedConn,
  setMeasureStart, setMultiSelect, setCalibStart, setCalibEnd, setShowCalibModal,
  setSelectedQuadroId, setSelectedDevice: _setSelectedDevice,
  copySelected, pasteClipboard, duplicateSelected, setShowSearch,
  prevToolRef
}) {
  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      // Delete: remove selected device(s) or connection
      if (e.key === 'Delete') {
        if (multiSelect.size > 0) {
          multiSelect.forEach(id => deleteDevice(id));
          setMultiSelect(new Set());
        } else if (selectedDevice) deleteDevice(selectedDevice);
        else if (selectedConn) {
          const sc = connections.find(c => c.id === selectedConn);
          if (sc?.waypoints?.length) {
            updateConnWaypoints(selectedConn, undefined);
          } else {
            deleteConnection(selectedConn);
          }
        }
      }
      // Escape: cancel current action
      if (e.key === 'Escape') {
        if (prevToolRef.current !== null) prevToolRef.current = null;
        setTool('select'); setPendingDevice(null); setCableMode(null); setPortPopup(null);
        setSelectedConn(null); setMeasureStart(null); setMultiSelect(new Set());
        setCalibStart(null); setCalibEnd(null); setShowCalibModal(false); setSelectedQuadroId(null);
      }

      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey) {
        if (e.key === 'v' || e.key === 'V') { setTool('select'); setPendingDevice(null); setCableMode(null); setMeasureStart(null); }
        if (e.key === 'h' || e.key === 'H') { setTool('pan'); setPendingDevice(null); setCableMode(null); setMeasureStart(null); }
        // Space → temporary pan
        if (e.key === ' ' && !e.repeat && tool !== 'pan') {
          e.preventDefault();
          prevToolRef.current = tool;
          setTool('pan');
        }
      }

      // Ctrl shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') { e.preventDefault(); setMultiSelect(new Set(devices.map(d => d.id))); setTool('select'); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); window.print(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') { e.preventDefault(); copySelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') { e.preventDefault(); pasteClipboard(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') { e.preventDefault(); duplicateSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(s => !s); }
    };
    const keyupHandler = (e) => {
      if (e.key === ' ' && prevToolRef.current !== null) {
        setTool(prevToolRef.current);
        prevToolRef.current = null;
      }
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('keyup', keyupHandler);
    return () => { window.removeEventListener('keydown', handler); window.removeEventListener('keyup', keyupHandler); };
  }, [selectedDevice, selectedConn, connections, devices, multiSelect, tool]);
}
