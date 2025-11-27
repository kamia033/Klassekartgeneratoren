import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string, subType?: any) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, onClose, onSelect }) => {
  const { showZones } = useApp();
  const [showSubMenu, setShowSubMenu] = useState(false);

  if (!visible) return null;

  return (
    <>
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: 999 
      }} 
      onClick={onClose} 
    />
    <div 
      id="contextMenu" 
      style={{ 
        display: 'block', 
        left: x, 
        top: y, 
        position: 'fixed', // Changed to fixed to work better with scrolling/layout
        zIndex: 1000, 
        backgroundColor: 'white', 
        border: '1px solid #ccc', 
        borderRadius: '4px', 
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)' 
      }}
    >
      <ul style={{ listStyle: 'none', margin: 0, padding: '5px 0' }}>
        <li 
            style={{ padding: '8px 12px', cursor: 'pointer' }} 
            onClick={() => { onSelect('desk'); onClose(); }}
            className="context-menu-item"
        >
            Elevpult
        </li>
        <li 
            style={{ padding: '8px 12px', cursor: 'pointer' }} 
            onClick={() => { onSelect('merkelapp'); onClose(); }}
            className="context-menu-item"
        >
            Merkelapp
        </li>
        {showZones && (
            <li 
                style={{ padding: '8px 12px', cursor: 'pointer' }} 
                onClick={() => { onSelect('zone'); onClose(); }}
                className="context-menu-item"
            >
                Sone
            </li>
        )}
        <li 
            style={{ padding: '8px 12px', cursor: 'pointer', position: 'relative' }}
            onMouseEnter={() => setShowSubMenu(true)}
            onMouseLeave={() => setShowSubMenu(false)}
            className="context-menu-item"
        >
            Rundbord ▶
            {showSubMenu && (
                <ul 
                    style={{
                        display: 'block',
                        position: 'absolute',
                        left: '100%',
                        top: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        listStyle: 'none',
                        padding: '5px 0',
                        width: '100px',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {[0, 2, 3, 4, 5].map(seats => (
                        <li 
                            key={seats}
                            style={{ padding: '8px 12px', cursor: 'pointer' }}
                            onClick={(e) => { 
                                e.stopPropagation();
                                onSelect('roundtable', seats); 
                                onClose(); 
                            }}
                            className="context-menu-item"
                        >
                            {seats === 0 ? 'ingen' : `${seats} seter`}
                        </li>
                    ))}
                </ul>
            )}
        </li>
      </ul>
    </div>
    </>
  );
};

export default ContextMenu;
