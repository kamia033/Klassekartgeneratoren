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
  children?: React.ReactNode;
}

const ClassControls: React.FC<ClassControlsProps> = ({ savedClasses, loadClass, createClass, deleteClass, children }) => {
  const { currentClass } = useApp();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="save-section">
      <div className="class-row">
        <div className="dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <div className="dropdown-selected">{currentClass || "Klasse"}</div>
          {isDropdownOpen && (
            <ul className="dropdown-options" style={{ display: 'block' }}>
              {savedClasses.map(className => (
                <li key={className} onClick={(e) => { e.stopPropagation(); loadClass(className); setIsDropdownOpen(false); }}>{className}</li>
              ))}
            </ul>
          )}
        </div>
        <button className="class-icon-button" onClick={createClass} title="Opprett klasse">
          <img src={addIcon} alt="Opprett klasse" />
        </button>
        <button className="class-icon-button" onClick={deleteClass} title="Slett klasse">
          <img src={deleteIcon} alt="Slett klasse" />
        </button>
      </div>
      {children}
    </div>
  );
};

export default ClassControls;
