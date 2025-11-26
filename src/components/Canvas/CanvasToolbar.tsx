import React from 'react';
import './CanvasToolbar.css';

interface CanvasToolbarProps {
  scale: number;
  setScale: (scale: number) => void;
  onFullscreen: () => void;
  onCopy?: () => void;
  onDownload?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ scale, setScale, onFullscreen, onCopy, onDownload }) => {
  return (
    <div className="canvas-toolbar">
      <span>Zoom:</span>
      <input 
        type="range" 
        min="0.5" 
        max="3" 
        step="0.1" 
        value={scale} 
        onChange={(e) => setScale(parseFloat(e.target.value))} 
      />
      <div className="separator"></div>
      <button onClick={onFullscreen} title="Fullskjerm">⛶</button>
      {onCopy && <button onClick={onCopy} title="Kopier til utklippstavle">📋</button>}
      {onDownload && <button onClick={onDownload} title="Last ned bilde">💾</button>}
    </div>
  );
};

export default CanvasToolbar;
