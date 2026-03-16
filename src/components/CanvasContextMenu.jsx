import { useEffect, useRef } from 'react';
import {
  Copy,
  Clipboard,
  Trash2,
  MousePointer2,
  Maximize2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  ArrowRightLeft,
  ArrowUpDown,
} from 'lucide-react';

const menuStyle = {
  position: 'fixed',
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(0,0,0,.15)',
  padding: '4px 0',
  minWidth: 200,
  zIndex: 9999,
  fontFamily: 'Inter, sans-serif',
  fontSize: 11,
  color: '#1a1a1a',
  userSelect: 'none',
};

const itemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  cursor: 'pointer',
  background: 'transparent',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  color: 'inherit',
};

const _itemHoverStyle = {
  ...itemStyle,
  background: '#F0F5FA',
};

const shortcutStyle = {
  marginLeft: 'auto',
  color: '#94a3b8',
  fontSize: 10,
};

const dividerStyle = {
  height: 1,
  background: '#E2E8F0',
  margin: '4px 0',
};

const disabledStyle = {
  opacity: 0.4,
  pointerEvents: 'none',
};

function MenuItem({ icon: Icon, label, shortcut, onClick, disabled }) {
  const ref = useRef(null);

  return (
    <button
      ref={ref}
      style={{
        ...itemStyle,
        ...(disabled ? disabledStyle : {}),
      }}
      onMouseEnter={() => {
        if (!disabled && ref.current) ref.current.style.background = '#F0F5FA';
      }}
      onMouseLeave={() => {
        if (ref.current) ref.current.style.background = 'transparent';
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && onClick) onClick();
      }}
    >
      {Icon && <Icon size={14} />}
      <span>{label}</span>
      {shortcut && <span style={shortcutStyle}>{shortcut}</span>}
    </button>
  );
}

function Divider() {
  return <div style={dividerStyle} />;
}

export default function CanvasContextMenu({
  x,
  y,
  target,
  multiSelectCount,
  onClose,
  onCopy,
  onPaste,
  onDuplicate,
  onDelete,
  onSelectAll,
  onSelectByType,
  onAlignLeft,
  onAlignCenterH,
  onAlignRight,
  onAlignTop,
  onAlignCenterV,
  onAlignBottom,
  onDistributeH,
  onDistributeV,
  onSpread,
  hasClipboard,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Ajustar posição para não sair da tela
  const adjustedStyle = { ...menuStyle, left: x, top: y };

  return (
    <div ref={menuRef} style={adjustedStyle}>
      {/* Menu para dispositivo selecionado */}
      {target && (
        <>
          <MenuItem
            icon={Copy}
            label="Copiar"
            shortcut="Ctrl+C"
            onClick={onCopy}
          />
          <MenuItem
            icon={Copy}
            label="Duplicar"
            shortcut="Ctrl+D"
            onClick={onDuplicate}
          />
          <MenuItem
            icon={Trash2}
            label="Excluir"
            shortcut="Del"
            onClick={onDelete}
          />
          <Divider />
          <MenuItem
            icon={MousePointer2}
            label="Selecionar mesmo tipo"
            onClick={() => onSelectByType(target.key || target.type)}
          />
          <Divider />
        </>
      )}

      {/* Menu para canvas (sem dispositivo) */}
      {!target && (
        <>
          <MenuItem
            icon={Clipboard}
            label="Colar"
            shortcut="Ctrl+V"
            onClick={() => onPaste(x, y)}
            disabled={!hasClipboard}
          />
          <MenuItem
            icon={MousePointer2}
            label="Selecionar tudo"
            shortcut="Ctrl+A"
            onClick={onSelectAll}
          />
          <Divider />
        </>
      )}

      {/* Menu de alinhamento para multi-seleção */}
      {multiSelectCount > 1 && (
        <>
          <MenuItem
            icon={AlignLeft}
            label="Alinhar à esquerda"
            onClick={onAlignLeft}
          />
          <MenuItem
            icon={AlignCenter}
            label="Alinhar centro horizontal"
            onClick={onAlignCenterH}
          />
          <MenuItem
            icon={AlignRight}
            label="Alinhar à direita"
            onClick={onAlignRight}
          />
          <Divider />
          <MenuItem
            icon={AlignVerticalJustifyStart}
            label="Alinhar ao topo"
            onClick={onAlignTop}
          />
          <MenuItem
            icon={AlignVerticalJustifyCenter}
            label="Alinhar centro vertical"
            onClick={onAlignCenterV}
          />
          <MenuItem
            icon={AlignVerticalJustifyEnd}
            label="Alinhar abaixo"
            onClick={onAlignBottom}
          />
          <Divider />
          <MenuItem
            icon={ArrowRightLeft}
            label="Distribuir horizontalmente"
            onClick={onDistributeH}
          />
          <MenuItem
            icon={ArrowUpDown}
            label="Distribuir verticalmente"
            onClick={onDistributeV}
          />
          <Divider />
          <MenuItem
            icon={Maximize2}
            label="Organizar (espalhar)"
            onClick={onSpread}
          />
        </>
      )}
    </div>
  );
}
