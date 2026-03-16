import { useState } from 'react';
import { uid } from '@/lib/helpers';

/**
 * Hook for clipboard (copy/paste/duplicate), align/distribute, spread, selectByType.
 */
export function useDeviceActions({ devices, connections, multiSelect, selectedDevice, setMultiSelect, setSelectedDevice, updateFloor, snap, getDevR }) {
  const [clipboard, setClipboard] = useState(null);

  const copySelected = () => {
    const ids = multiSelect.size > 0 ? [...multiSelect] : (selectedDevice ? [selectedDevice] : []);
    if (!ids.length) return;
    const devs = ids.map(id => devices.find(d => d.id === id)).filter(Boolean);
    const minX = Math.min(...devs.map(d => d.x)), minY = Math.min(...devs.map(d => d.y));
    setClipboard({ devices: devs.map(d => ({ ...d, _offX: d.x - minX, _offY: d.y - minY })) });
  };

  const pasteClipboard = (px, py) => {
    if (!clipboard?.devices?.length) return;
    const baseX = px || 200, baseY = py || 200;
    const newIds = [];
    const idMap = {};
    clipboard.devices.forEach(d => {
      const nid = uid();
      idMap[d.id] = nid;
      newIds.push(nid);
    });
    updateFloor(f => {
      const newDevs = clipboard.devices.map(d => ({
        ...d, id: idMap[d.id], x: snap(baseX + d._offX), y: snap(baseY + d._offY),
        envId: null, quadroId: undefined, rackId: undefined
      }));
      const newConns = connections
        .filter(c => idMap[c.from] && idMap[c.to])
        .map(c => ({ ...c, id: uid(), from: idMap[c.from], to: idMap[c.to] }));
      return { ...f, devices: [...f.devices, ...newDevs], connections: [...(f.connections || []), ...newConns] };
    });
    setMultiSelect(new Set(newIds));
    setSelectedDevice(null);
  };

  const duplicateSelected = () => {
    const ids = multiSelect.size > 0 ? [...multiSelect] : (selectedDevice ? [selectedDevice] : []);
    if (!ids.length) return;
    const devs = ids.map(id => devices.find(d => d.id === id)).filter(Boolean);
    if (!devs.length) return;
    const minX = Math.min(...devs.map(d => d.x));
    const minY = Math.min(...devs.map(d => d.y));
    const baseX = minX + 40, baseY = minY + 40;
    const idMap = {};
    const newIds = [];
    devs.forEach(d => { const nid = uid(); idMap[d.id] = nid; newIds.push(nid); });
    updateFloor(f => {
      const newDevs = devs.map(d => ({
        ...d, id: idMap[d.id], x: snap(baseX + (d.x - minX)), y: snap(baseY + (d.y - minY)),
        envId: null, quadroId: undefined, rackId: undefined
      }));
      const newConns = connections
        .filter(c => idMap[c.from] && idMap[c.to])
        .map(c => ({ ...c, id: uid(), from: idMap[c.from], to: idMap[c.to] }));
      return { ...f, devices: [...f.devices, ...newDevs], connections: [...(f.connections || []), ...newConns] };
    });
    setMultiSelect(new Set(newIds));
    setSelectedDevice(null);
  };

  const getSelectedDevs = () => {
    const ids = [...multiSelect];
    return ids.map(id => devices.find(d => d.id === id)).filter(Boolean);
  };

  const alignDevices = (axis) => {
    const devs = getSelectedDevs(); if (devs.length < 2) return;
    const centers = devs.map(d => ({ id: d.id, cx: d.x + getDevR(d), cy: d.y + getDevR(d), r: getDevR(d) }));
    let target;
    if (axis === 'left') target = Math.min(...centers.map(c => c.cx - c.r));
    else if (axis === 'right') target = Math.max(...centers.map(c => c.cx + c.r));
    else if (axis === 'centerH') { const s = centers.reduce((a, c) => a + c.cx, 0) / centers.length; target = s; }
    else if (axis === 'top') target = Math.min(...centers.map(c => c.cy - c.r));
    else if (axis === 'bottom') target = Math.max(...centers.map(c => c.cy + c.r));
    else if (axis === 'centerV') { const s = centers.reduce((a, c) => a + c.cy, 0) / centers.length; target = s; }
    updateFloor(f => ({
      ...f, devices: f.devices.map(d => {
        if (!multiSelect.has(d.id)) return d;
        const r = getDevR(d);
        if (axis === 'left') return { ...d, x: target };
        if (axis === 'right') return { ...d, x: target - 2 * r };
        if (axis === 'centerH') return { ...d, x: target - r };
        if (axis === 'top') return { ...d, y: target };
        if (axis === 'bottom') return { ...d, y: target - 2 * r };
        if (axis === 'centerV') return { ...d, y: target - r };
        return d;
      })
    }));
  };

  const distributeDevices = (dir) => {
    const devs = getSelectedDevs(); if (devs.length < 3) return;
    const sorted = [...devs].sort((a, b) => dir === 'h' ? a.x - b.x : a.y - b.y);
    const first = sorted[0], last = sorted[sorted.length - 1];
    const totalSpan = dir === 'h' ? (last.x - first.x) : (last.y - first.y);
    const step = totalSpan / (sorted.length - 1);
    const updates = {};
    sorted.forEach((d, i) => {
      if (dir === 'h') updates[d.id] = { x: snap(first.x + step * i) };
      else updates[d.id] = { y: snap(first.y + step * i) };
    });
    updateFloor(f => ({ ...f, devices: f.devices.map(d => updates[d.id] ? { ...d, ...updates[d.id] } : d) }));
  };

  const spreadDevices = () => {
    const ids = multiSelect.size > 1 ? [...multiSelect] : (selectedDevice ? devices.filter(d => {
      const sel = devices.find(dd => dd.id === selectedDevice);
      if (!sel) return false;
      const dist = Math.sqrt((d.x - sel.x) ** 2 + (d.y - sel.y) ** 2);
      return dist < 60 && d.id !== selectedDevice;
    }).map(d => d.id).concat([selectedDevice]) : []);
    if (ids.length < 2) return;
    const devs = ids.map(id => devices.find(d => d.id === id)).filter(Boolean);
    const cx = devs.reduce((s, d) => s + d.x, 0) / devs.length;
    const cy = devs.reduce((s, d) => s + d.y, 0) / devs.length;
    const radius = Math.max(60, devs.length * 25);
    const updates = {};
    devs.forEach((d, i) => {
      const angle = (i / devs.length) * 2 * Math.PI - Math.PI / 2;
      updates[d.id] = { x: snap(cx + radius * Math.cos(angle)), y: snap(cy + radius * Math.sin(angle)) };
    });
    updateFloor(f => ({ ...f, devices: f.devices.map(d => updates[d.id] ? { ...d, ...updates[d.id] } : d) }));
  };

  const selectByType = (deviceKey) => {
    const ids = devices.filter(d => d.key === deviceKey).map(d => d.id);
    setMultiSelect(new Set(ids));
    setSelectedDevice(null);
  };

  return {
    clipboard, copySelected, pasteClipboard, duplicateSelected,
    alignDevices, distributeDevices, spreadDevices, selectByType
  };
}
