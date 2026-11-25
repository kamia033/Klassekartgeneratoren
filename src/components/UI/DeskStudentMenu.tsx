import React from 'react';
import './ContextMenu.css';

const iconProps = {
  width: 14,
  height: 14,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const PencilIcon = () => (
  <svg {...iconProps}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const SwapIcon = () => (
  <svg {...iconProps}>
    <path d="M7 4 3 8l4 4" />
    <path d="M3 8h13" />
    <path d="m17 20 4-4-4-4" />
    <path d="M21 16H8" />
  </svg>
);

const sectionHeaderStyle: React.CSSProperties = {
  padding: '6px 12px',
  color: '#666',
  fontSize: '0.8em',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  borderTop: '1px solid #eee',
};

const itemStyle: React.CSSProperties = {
  padding: '8px 12px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

interface DeskStudentMenuProps {
  x: number;
  y: number;
  currentName: string | null;
  options: { name: string; seated: boolean }[];
  onRename: () => void;
  onReplace: (name: string) => void;
  onClose: () => void;
}

const DeskStudentMenu: React.FC<DeskStudentMenuProps> = ({ x, y, currentName, options, onRename, onReplace, onClose }) => {
  return (
    <>
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }}
        onClick={onClose}
      />
      <div
        id="contextMenu"
        style={{
          display: 'block',
          left: x,
          top: y,
          position: 'fixed',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
          minWidth: '180px'
        }}
      >
        <ul style={{ listStyle: 'none', margin: 0, padding: '5px 0' }}>
          {currentName && (
            <li
              style={itemStyle}
              className="context-menu-item"
              onClick={() => { onRename(); onClose(); }}
            >
              <PencilIcon />
              <span>Endre navn på «{currentName}»</span>
            </li>
          )}
          <li style={sectionHeaderStyle}>
            {currentName ? 'Bytt ut med' : 'Velg elev'}
          </li>
          <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
            {options.length === 0 && (
              <li style={{ padding: '8px 12px', color: '#999', fontStyle: 'italic' }}>Ingen andre elever</li>
            )}
            {options.map(option => (
              <li
                key={option.name}
                style={itemStyle}
                className="context-menu-item"
                onClick={() => { onReplace(option.name); onClose(); }}
              >
                <span style={{ flex: 1 }}>{option.name}</span>
                {option.seated && (
                  <span
                    title="Bytter plass med eleven som sitter her nå"
                    aria-label="Bytter plass"
                    style={{ color: '#1976d2', display: 'inline-flex' }}
                  >
                    <SwapIcon />
                  </span>
                )}
              </li>
            ))}
          </div>
        </ul>
      </div>
    </>
  );
};

export default DeskStudentMenu;
