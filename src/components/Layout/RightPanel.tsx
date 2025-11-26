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

const RightPanel: React.FC = () => {
  const { activeTab, setActiveTab, students, canvasItems, setCanvasItems, secondaryMapItems, setSecondaryMapItems, currentMapIndex, currentClass, setCurrentClass, setStudents, mode, setMode } = useApp();
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
          setCurrentClass(className);
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
          classes[name] = { students: [], canvasItems: [] };
          localStorage.setItem('classes', JSON.stringify(classes));
          setSavedClasses(Object.keys(classes));
          setCurrentClass(name);
          setStudents([]);
          setCanvasItems([]);
          setSecondaryMapItems([]);
          
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
              canvasItems2: map2
          };
          localStorage.setItem('classes', JSON.stringify(classes));
      }
  }, [students, canvasItems, secondaryMapItems, currentClass, currentMapIndex]);

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
            >
                📍 Kart
            </button>
            <button 
                id="grupper-btn" 
                className={activeTab === 'grupper' ? 'active-tab' : ''}
                onClick={() => setActiveTab('grupper')}
            >
                🧑‍🤝‍🧑 Grupper (beta)
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
        
      </div>
    </div>
  );
};

export default RightPanel;
