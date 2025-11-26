import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import type { Desk, RoundTable } from '../../../types';
import '../Colors.css';

const MapControls: React.FC = () => {
  const { canvasItems, setCanvasItems, students, absentStudents, currentMapIndex, setCurrentMapIndex, secondaryMapItems, setSecondaryMapItems } = useApp();
  const { addToast } = useToast();

  const sparkleItUp = (scheme: string) => {
      let palette: string[] = [];
      if (scheme === 'intense') {
          palette = ['#FF0000', '#FF8700', '#FFD300', '#DEFF0A', '#A1FF0A', '#0AFF99', '#0AEFFF', '#147DF5', '#580AFF', '#BE0AFF'];
      } else if (scheme === 'pastel') {
          palette = ["#FBF8CC", "#FDE4CF", "#FFCFD2", "#F1C0E8", "#CFBAF0", "#A3C4F3", "#90DBF4", "#8EECF5", "#98F5E1", "#B9FBC0"];
      } else if (scheme === 'pink') {
          palette = ["#ff0a54", "#ff477e", "#ff5c8a", "#ff7096", "#ff85a1", "#ff99ac", "#fbb1bd", "#f9bec7", "#f7cad0", "#fae0e4"];
      } else if (scheme === 'mindaro') {
          palette = ["#d9ed92", "#b5e48c", "#99d98c", "#76c893", "#52b69a", "#34a0a4", "#168aad", "#1a759f", "#1e6091", "#184e77"];
      }

      palette = palette.sort(() => Math.random() - 0.5);
      
      // Simple coloring logic for now - can be expanded to match original if needed
      const newItems = [...canvasItems];
      let colorIndex = 0;
      
      newItems.forEach(item => {
          if (item.type === 'desk') {
             (item as Desk).color = palette[colorIndex % palette.length];
             colorIndex++;
          } else if (item.type === 'roundtable') {
             (item as RoundTable).color = palette[colorIndex % palette.length];
             colorIndex++;
          }
      });

      setCanvasItems(newItems);
  };

  const assignStudents = () => {
      // Simplified assignment logic to match the new structure but keep the button
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      const shuffledStudents = [...presentStudents].sort(() => Math.random() - 0.5);
      
      let studentIndex = 0;
      const newItems = canvasItems.map(item => {
          if (item.type === 'desk') {
              return { ...item, studentId: shuffledStudents[studentIndex++] || null };
          } else if (item.type === 'roundtable') {
              const t = item as RoundTable;
              const newIds = t.studentIds.map(() => shuffledStudents[studentIndex++] || null);
              return { ...t, studentIds: newIds };
          }
          return item;
      });
      
      setCanvasItems(newItems);
      addToast('Elever plassert!', 'success');
  };

  const switchMap = (index: number) => {
      if (index === currentMapIndex) return;
      
      const currentItems = [...canvasItems];
      const otherItems = [...secondaryMapItems];
      
      setSecondaryMapItems(currentItems);
      setCanvasItems(otherItems);
      setCurrentMapIndex(index);
  };

  return (
    <>
        <button onClick={assignStudents}>✨Plasser elever✨</button>
        
        <div style={{ display: 'flex', marginTop: '10px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <button 
                onClick={() => switchMap(0)} 
                style={{ 
                    flex: 1, 
                    backgroundColor: currentMapIndex === 0 ? '#e0e0e0' : 'white', 
                    border: 'none', 
                    borderRadius: 0,
                    fontWeight: currentMapIndex === 0 ? 'bold' : 'normal',
                    padding: '8px'
                }}
            >
                Klassekart 1
            </button>
            <div style={{ width: '1px', backgroundColor: '#ccc' }}></div>
            <button 
                onClick={() => switchMap(1)} 
                style={{ 
                    flex: 1, 
                    backgroundColor: currentMapIndex === 1 ? '#e0e0e0' : 'white', 
                    border: 'none', 
                    borderRadius: 0,
                    fontWeight: currentMapIndex === 1 ? 'bold' : 'normal',
                    padding: '8px'
                }}
            >
                Klassekart 2
            </button>
        </div>

        {/* Color Picker */}
        <div className="color-picker" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            <p id="color-headline">🎨 Farger</p>
            <div className="color-button-container" onClick={() => sparkleItUp('intense')}>
                {['#FF0000', '#FF8700', '#DEFF0A', '#A1FF0A', '#0AFF99', '#FFD300', '#0AEFFF', '#147DF5', '#580AFF', '#BE0AFF'].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('pastel')}>
                {["#FBF8CC", "#FDE4CF", "#FFCFD2", "#F1C0E8", "#CFBAF0", "#A3C4F3", "#90DBF4", "#8EECF5", "#98F5E1", "#B9FBC0"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('pink')}>
                {["#ff0a54", "#ff477e", "#ff5c8a", "#ff7096", "#ff85a1", "#ff99ac", "#fbb1bd", "#f9bec7", "#f7cad0", "#fae0e4"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('mindaro')}>
                {["#d9ed92", "#b5e48c", "#99d98c", "#76c893", "#52b69a", "#34a0a4", "#168aad", "#1a759f", "#1e6091", "#184e77"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
        </div>
    </>
  );
};

export default MapControls;