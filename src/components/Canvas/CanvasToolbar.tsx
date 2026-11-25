import React from 'react';
import './CanvasToolbar.css';
import copyIcon from'../../assets/copy.svg';
import downloadIcon from '../../assets/download.svg';
import fullscreenIcon from '../../assets/fullscreen.svg';
import rewindIcon from '../../assets/rewind.svg';
import redoIcon from '../../assets/redo.svg';
import zoomInIcon from '../../assets/zoom-in.svg';
import zoomOutIcon from '../../assets/zoom-out.svg';

interface CanvasToolbarProps {
    scale: number;
    setScale: (scale: number) => void;
    onFullscreen: () => void;
    onCopy?: () => void;
    onDownload?: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
    onRedo?: () => void;
    canRedo?: boolean;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({ scale, setScale, onFullscreen, onCopy, onDownload, onUndo, canUndo, onRedo, canRedo }) => {
    return (
        <div className="canvas-toolbar">
            {(onUndo || onRedo) && (
                <div className="canvas-toolbar-history">
                    {onUndo && (
                        <button className="canvas-toolbar-redoundo" onClick={onUndo} disabled={!canUndo} title="Angre siste endring"><img src={rewindIcon} alt="Angre" /></button>
                    )}
                    {onRedo && (
                        <button className="canvas-toolbar-redoundo" onClick={onRedo} disabled={!canRedo} title="Gjør om siste angring"><img src={redoIcon} alt="Gjør om" /></button>
                    )}
                </div>
            )}
            <div className="canvas-toolbar-scale">
            <img 
                src={zoomOutIcon} 
                alt="Zoom Out" 
                onClick={() => setScale(Math.max(0.1, scale - 0.1))}
                style={{ cursor: 'pointer' }}
            />
            <input
                type="range"
                min="0.1"
                max="3"
                step="0.03"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
            />
            <img 
                src={zoomInIcon} 
                alt="Zoom In" 
                onClick={() => setScale(Math.min(3, scale + 0.1))}
                style={{ cursor: 'pointer' }}
            />
            </div>
            <div className="canvas-toolbar-exports">

                {<button onClick={onCopy} title="Kopier til utklippstavle"><img src={copyIcon} alt="Copy" />Kopier</button>}

                {onDownload && <button onClick={onDownload} title="Last ned bilde"><img src={downloadIcon} alt="Download" />Last ned</button>}
            </div>

            <button onClick={onFullscreen} title="Fullskjerm"><img src={fullscreenIcon} alt="Fullskjerm" />Fullskjerm</button>
        </div>
    );
};

export default CanvasToolbar;
