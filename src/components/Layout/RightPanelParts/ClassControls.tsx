import React, { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import './ClassControls.css';
import deleteIcon from '../../../assets/delete.svg';
import addIcon from '../../../assets/add.svg';

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
        <div className="dropdown-selected">{currentClass || "Velg klasse"}</div>
        {isDropdownOpen && (
          <ul className="dropdown-options" style={{ display: 'block' }}>
            {savedClasses.map(className => (
              <li key={className} onClick={(e) => { e.stopPropagation(); loadClass(className); setIsDropdownOpen(false); }}>{className}</li>
            ))}
          </ul>
        )}
      </div>
      <div id="createAndDeleteButtons">
        <button onClick={createClass}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <img src={addIcon} alt="Add" /><span>Opprett klasse</span>
          </div>
          </button>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
          <button onClick={deleteClass} ><img src={deleteIcon} alt="Delete" /></button>
        </div>
      </div>
    </div>
  );
};

export default ClassControls;
