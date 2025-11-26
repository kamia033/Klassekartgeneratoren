import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import '../Groups.css'; // Reuse existing Groups.css

const GroupControls: React.FC = () => {
  const { students, absentStudents, setGeneratedGroups, setIsAnimating } = useApp();
  const { addToast } = useToast();
  
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(3);
  const [keepExtraSeparate, setKeepExtraSeparate] = useState(false);
  const [selectLeaders, setSelectLeaders] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  const adjustGroupSize = (delta: number) => {
      const newVal = Math.max(2, Math.min(10, groupSize + delta));
      setGroupSize(newVal);
      if (students.length > 0) {
          const newCount = Math.floor(students.length / newVal);
          if (newCount > 0) setGroupCount(newCount);
      }
  };

  const adjustGroupCount = (delta: number) => {
      const newVal = Math.max(2, Math.min(15, groupCount + delta));
      setGroupCount(newVal);
      if (students.length > 0) {
          const newSize = Math.floor(students.length / newVal);
          if (newSize > 0) setGroupSize(Math.max(2, newSize));
      }
  };

  const generateGroups = () => {
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      
      if (presentStudents.length === 0) {
          addToast('Ingen elever å fordele!', 'error');
          return;
      }

      // Shuffle students
      const shuffled = [...presentStudents].sort(() => Math.random() - 0.5);
      const groups: { members: string[], leader?: string }[] = [];
      
      // Calculate groups based on count
      const baseSize = Math.floor(shuffled.length / groupCount);
      const extra = shuffled.length % groupCount;
      
      let currentIndex = 0;
      
      for (let i = 0; i < groupCount; i++) {
          let size = baseSize;
          // Distribute extra students: if keepExtraSeparate is false, add one to each of the first 'extra' groups
          if (!keepExtraSeparate && i < extra) {
              size++;
          }
          
          const groupMembers = shuffled.slice(currentIndex, currentIndex + size);
          currentIndex += size;
          
          let leader: string | undefined;
          if (selectLeaders && groupMembers.length > 0) {
              leader = groupMembers[Math.floor(Math.random() * groupMembers.length)];
          }
          
          groups.push({ members: groupMembers, leader });
      }
      
      if (keepExtraSeparate && currentIndex < shuffled.length) {
          const remaining = shuffled.slice(currentIndex);
          let leader: string | undefined;
          if (selectLeaders && remaining.length > 0) {
              leader = remaining[Math.floor(Math.random() * remaining.length)];
          }
          groups.push({ members: remaining, leader });
      }

      if (showAnimation) {
          setIsAnimating(true);
          setGeneratedGroups(groups);
      } else {
          setIsAnimating(false);
          setGeneratedGroups(groups);
      }
      
      addToast(`Genererte ${groups.length} grupper!`, 'success');
  };

  return (
    <div className="save-section">
        <button onClick={generateGroups} style={{ backgroundColor: '#4CAF50', color: 'white', marginBottom: '10px' }}>
            🎲 Generer grupper
        </button>

        <div className="group-controls-horizontal">
            <div className="group-control-item">
                <label>Gruppestørrelse:</label>
                <div className="group-size-controls">
                    <button className="adjust-button" onClick={() => adjustGroupSize(1)}>+</button>
                    <input type="number" value={groupSize} readOnly />
                    <button className="adjust-button" onClick={() => adjustGroupSize(-1)}>-</button>
                </div>
            </div>
            
            <div className="group-control-item">
                <label>Antall grupper:</label>
                <div className="group-count-controls">
                    <button className="adjust-button" onClick={() => adjustGroupCount(1)}>+</button>
                    <input type="number" value={groupCount} readOnly />
                    <button className="adjust-button" onClick={() => adjustGroupCount(-1)}>-</button>
                </div>
            </div>
        </div>

        <div style={{ marginTop: '10px', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Forhåndsvisning:</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {(() => {
                    const presentStudents = students.filter(s => !absentStudents.includes(s));
                    if (presentStudents.length === 0) return <span style={{ fontSize: '12px', color: '#999' }}>Ingen elever</span>;
                    
                    const previews = [];
                    const baseSize = Math.floor(presentStudents.length / groupCount);
                    const extra = presentStudents.length % groupCount;
                    
                    for (let i = 0; i < groupCount; i++) {
                        let size = baseSize;
                        if (!keepExtraSeparate && i < extra) size++;
                        previews.push(
                            <div key={i} style={{ 
                                width: '30px', 
                                height: '30px', 
                                backgroundColor: '#e0e0e0', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#555'
                            }}>
                                {size}
                            </div>
                        );
                    }
                    
                    if (keepExtraSeparate && extra > 0) {
                        previews.push(
                            <div key="extra" style={{ 
                                width: '30px', 
                                height: '30px', 
                                backgroundColor: '#ffe0b2', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                color: '#e65100',
                                border: '1px dashed #f57c00'
                            }}>
                                {extra}
                            </div>
                        );
                    }
                    return previews;
                })()}
            </div>
        </div>

        <div className="group-options">
            <label>
                <input type="checkbox" checked={keepExtraSeparate} onChange={(e) => setKeepExtraSeparate(e.target.checked)} />
                Hold ekstra elever separat
            </label>
            <label>
                <input type="checkbox" checked={selectLeaders} onChange={(e) => setSelectLeaders(e.target.checked)} />
                Velg gruppeleder
            </label>
            <label>
                <input type="checkbox" checked={showAnimation} onChange={(e) => setShowAnimation(e.target.checked)} />
                ✨ Vis animasjon
            </label>
        </div>
    </div>
  );
};

export default GroupControls;
