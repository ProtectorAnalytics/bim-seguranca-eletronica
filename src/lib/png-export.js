// ====================================================================
// PNG EXPORT — BIM Protector
// Captura a planta do canvas como imagem PNG via html2canvas
// ====================================================================

/**
 * Exporta a planta do canvas como PNG
 * @param {Object} opts
 * @param {string} opts.projectName  — Nome do projeto
 * @param {string} opts.floorName    — Nome do pavimento ativo
 * @param {boolean} opts.whiteBg     — true = fundo branco, false = dark original
 * @returns {Promise<{fileName:string}>}
 */
export async function exportCanvasPNG({ projectName = 'projeto', floorName = '', whiteBg = false } = {}) {
  // Lazy load html2canvas (code-splitting)
  const html2canvasModule = await import('html2canvas');
  const html2canvas = html2canvasModule.default || html2canvasModule;

  // Captura o elemento do canvas
  const canvasEl = document.querySelector('.canvas-transform') || document.querySelector('.canvas-area');
  if (!canvasEl) throw new Error('Canvas não encontrado (.canvas-transform / .canvas-area)');

  // Esconde overlays e controles durante a captura
  const hideSelectors = ['.modal-overlay', '.canvas-controls', '.scale-indicator', '.minimap', '.toolbar'];
  const hidden = [];
  hideSelectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(el => {
      if (el.style.display !== 'none') {
        hidden.push({ el, prev: el.style.display });
        el.style.display = 'none';
      }
    });
  });

  // Esconde seleção visual (halo azul em dispositivos selecionados)
  const selectedEls = document.querySelectorAll('[data-selected="true"]');
  selectedEls.forEach(el => el.setAttribute('data-selected', 'false'));

  try {
    const canvas = await html2canvas(canvasEl, {
      scale: 2,
      backgroundColor: whiteBg ? '#ffffff' : '#1e293b',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    // Gera download
    const safeName = (projectName || 'projeto').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
    const safeFloor = (floorName || '').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 20);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `BIM_${safeName}${safeFloor ? '_' + safeFloor : ''}_${dateStr}.png`;

    // Download via blob para melhor performance
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');

    return { fileName };
  } finally {
    // Restaura tudo que foi escondido
    hidden.forEach(({ el, prev }) => { el.style.display = prev; });
    selectedEls.forEach(el => el.setAttribute('data-selected', 'true'));
  }
}
