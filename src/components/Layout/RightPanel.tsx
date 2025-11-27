import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import ClassControls from './RightPanelParts/ClassControls';
import StudentList from './RightPanelParts/StudentList';
import GroupControls from './RightPanelParts/GroupControls';
import MapControls from './RightPanelParts/MapControls';
import './RightPanel.css';
import './Groups.css';
import './Roles.css';
import './Colors.css';

import groupIcon from '../../assets/group.svg';
import pinicon from '../../assets/pin.svg';

interface RightPanelProps {
    onTriggerError?: () => void;
}

const RightPanel: React.FC<RightPanelProps> = () => {
  const { activeTab, setActiveTab, students, canvasItems, setCanvasItems, secondaryMapItems, setSecondaryMapItems, currentMapIndex, currentClass, setCurrentClass, setStudents, mode, setMode, studentZoneAssignments, setStudentZoneAssignments, showZones, setShowZones, absentStudents, setAbsentStudents, uniformTextSize, setUniformTextSize, studentConstraints, setStudentConstraints } = useApp();
  const { addToast } = useToast();
  const [savedClasses, setSavedClasses] = useState<string[]>([]);

  useEffect(() => {
      const classes = JSON.parse(localStorage.getItem('classes') || '{}');
      setSavedClasses(Object.keys(classes));
  }, []);

  const loadClass = (className: string) => {
      const classes = JSON.parse(localStorage.getItem('classes') || '{}');
      if (classes[className]) {
          setStudents(classes[className].students || []);
          setCanvasItems(classes[className].canvasItems || []);
          setSecondaryMapItems(classes[className].canvasItems2 || []);
          setStudentZoneAssignments(classes[className].studentZoneAssignments || {});
          setAbsentStudents([]); // Always reset absent students on load
          setUniformTextSize(classes[className].uniformTextSize || false);
          setStudentConstraints(classes[className].studentConstraints || {});
          setCurrentClass(className);
          setShowZones(false);
          addToast(`Lastet klasse: ${className}`, 'success');
      }
  };

  const createClass = () => {
      const name = prompt('Navn på ny klasse:');
      if (name) {
          const classes = JSON.parse(localStorage.getItem('classes') || '{}');
          if (classes[name]) {
              alert('En klasse med dette navnet finnes allerede!');
              return;
          }
          classes[name] = { students: [], canvasItems: [], studentZoneAssignments: {}, absentStudents: [], uniformTextSize: false, studentConstraints: {} };
          localStorage.setItem('classes', JSON.stringify(classes));
          setSavedClasses(Object.keys(classes));
          setCurrentClass(name);
          setStudents([]);
          setCanvasItems([]);
          setSecondaryMapItems([]);
          setStudentZoneAssignments({});
          setAbsentStudents([]);
          setUniformTextSize(false);
          setStudentConstraints({});
          setShowZones(false);
          
          // Reset scroll position
          const scrollWrapper = document.querySelector('.scroll-wrapper');
          if (scrollWrapper) {
              scrollWrapper.scrollTop = 0;
              scrollWrapper.scrollLeft = 0;
          }
          
          addToast(`Opprettet klasse: ${name}`, 'success');
      }
  };

  const deleteClass = () => {
      if (!currentClass) return;
      if (confirm(`Er du sikker på at du vil slette klassen "${currentClass}"?`)) {
          const classes = JSON.parse(localStorage.getItem('classes') || '{}');
          delete classes[currentClass];
          localStorage.setItem('classes', JSON.stringify(classes));
          setSavedClasses(Object.keys(classes));
          setCurrentClass('');
          setStudents([]);
          setStudentZoneAssignments({});
          setAbsentStudents([]);
          setStudentConstraints({});
          addToast('Klasse slettet', 'success');
      }
  };

  // Auto-save when data changes
  useEffect(() => {
      if (currentClass) {
          const classes = JSON.parse(localStorage.getItem('classes') || '{}');
          
          // Determine which map is which based on current index
          const map1 = currentMapIndex === 0 ? canvasItems : secondaryMapItems;
          const map2 = currentMapIndex === 1 ? canvasItems : secondaryMapItems;

          classes[currentClass] = {
              students,
              canvasItems: map1,
              canvasItems2: map2,
              studentZoneAssignments,
              absentStudents,
              uniformTextSize,
              studentConstraints
          };
          localStorage.setItem('classes', JSON.stringify(classes));
      }
  }, [students, canvasItems, secondaryMapItems, currentClass, currentMapIndex, studentZoneAssignments, absentStudents, uniformTextSize, studentConstraints]);

  return (
    <div className="controls">
      {/* Tab Navigation */}
      <div className="tab-content active">
        <div className="tab-navigation">
          <div className="mode-selector">
            <button 
                id="klassekart-btn" 
                className={activeTab === 'kart' ? 'active-tab' : ''}
                onClick={() => setActiveTab('kart')}
            >   <img src={pinicon} style={{ height: '30px', width: '30px' }} alt="Pin" />
                <span>Kart</span>
            </button>
            <button 
                id="grupper-btn" 
                className={activeTab === 'grupper' ? 'active-tab' : ''}
                onClick={() => setActiveTab('grupper')}
            >
                <img src={groupIcon} style={{ height: '30px', width: '30px' }} alt="Group" />
                <span>Grupper</span>
            </button>
          </div>
        </div>

        {activeTab === 'kart' && (
          <div id="mode-slider" className="save-section">
            <button id="mode-box" onClick={() => setMode(mode === 'window' ? 'fullscreen' : 'window')}>
              <div id="active-mode" className="mode-button" style={mode === 'window' ? { backgroundColor: '#dbdbdb' } : {}}>Vindu</div>
              <div id="inactive-mode" className="mode-button" style={mode === 'fullscreen' ? { backgroundColor: '#dbdbdb' } : {}}>Fullskjerm</div>
            </button>
          </div>
        )}

        <ClassControls 
            savedClasses={savedClasses} 
            loadClass={loadClass} 
            createClass={createClass} 
            deleteClass={deleteClass} 
        />

        <StudentList />

        {activeTab === 'kart' && <MapControls />}
        {activeTab === 'grupper' && <GroupControls />}

        <div style={{ margin: '10px 0', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                    type="checkbox" 
                    checked={showZones} 
                    onChange={(e) => setShowZones(e.target.checked)}
                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px' }}>Vis avansert</span>
            </label>
        </div>
        
      </div>
    </div>
  );
};

export default RightPanel;
