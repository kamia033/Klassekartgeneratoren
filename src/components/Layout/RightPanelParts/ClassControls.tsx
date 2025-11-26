import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import './ClassControls.css';

interface ClassControlsProps {
  savedClasses: string[];
  loadClass: (className: string) => void;
  createClass: () => void;
  deleteClass: () => void;
}

const ClassControls: React.FC<ClassControlsProps> = ({ savedClasses, loadClass, createClass, deleteClass }) => {
  const { currentClass } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="save-section">
          <div className="dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <div className="dropdown-selected">{currentClass || "🧑‍🏫 Velg klasse"}</div>
              {isDropdownOpen && (
                  <ul className="dropdown-options" style={{ display: 'block' }}>
                      {savedClasses.map(className => (
                          <li key={className} onClick={(e) => { e.stopPropagation(); loadClass(className); setIsDropdownOpen(false); }}>{className}</li>
                      ))}
                  </ul>
              )}
          </div>
          <button onClick={createClass}>⭐ Opprett klasse</button>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', gap: '4px' }}>
              <button onClick={deleteClass} style={{ backgroundColor: '#ff4444', color: 'white' }}>🗑️ Slett</button>
          </div>
      </div>
  );
};

export default ClassControls;
