import React from 'react';
import { useApp } from '../../../context/AppContext';
import './MapSwitcher.css';

const MapSwitcher: React.FC = () => {
  const { canvasItems, setCanvasItems, secondaryMapItems, setSecondaryMapItems, currentMapIndex, setCurrentMapIndex } = useApp();

  const switchMap = (index: number) => {
      if (index === currentMapIndex) return;

      const currentItems = [...canvasItems];
      const otherItems = [...secondaryMapItems];

      setSecondaryMapItems(currentItems);
      setCanvasItems(otherItems);
      setCurrentMapIndex(index);
  };

  return (
    <div className="map-switcher">
      <button
        type="button"
        className={currentMapIndex === 0 ? 'map-switcher-button active' : 'map-switcher-button'}
        onClick={() => switchMap(0)}
      >
        Klassekart 1
      </button>
      <button
        type="button"
        className={currentMapIndex === 1 ? 'map-switcher-button active' : 'map-switcher-button'}
        onClick={() => switchMap(1)}
      >
        Klassekart 2
      </button>
    </div>
  );
};

export default MapSwitcher;
