import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import CanvasGrid from '../Canvas/CanvasGrid';
import CanvasToolbar from '../Canvas/CanvasToolbar';
import './LeftPanel.css';
import './Groups.css';

const LeftPanel: React.FC = () => {
  const { activeTab, generatedGroups, isAnimating, setIsAnimating, currentClass, groupScale, setGroupScale } = useApp();
  const [cellSize] = useState(40);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const groupsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
      if (isAnimating && generatedGroups.length > 0) {
          const totalDuration = generatedGroups.length * 100 + 500;
          const timer = setTimeout(() => {
              setIsAnimating(false);
          }, totalDuration);
          return () => clearTimeout(timer);
      }
  }, [isAnimating, generatedGroups, setIsAnimating]);

  const getGroupColor = (index: number) => {
      const colors = [
          '#FFE5E5', '#E5F3FF', '#E5FFE5', '#FFFAE5', '#F0E5FF',
          '#FFE5F0', '#E5FFFF', '#FFE5CC', '#E5E5FF', '#F5FFE5',
          '#FFCCE5', '#E5FFCC', '#CCE5FF', '#FFCC99', '#CCFFCC'
      ];
      return colors[index % colors.length];
  };

  const handleGroupsFullscreen = () => {
      if (!groupsContainerRef.current) return;
      if (!document.fullscreenElement) {
          groupsContainerRef.current.requestFullscreen().catch(err => {
              console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
          });
      } else {
          document.exitFullscreen();
      }
  };

  return (
    <div className="left-panel">
      <div id="canvas-container">
        
        {activeTab === 'kart' && (
            <div className="scroll-wrapper">
                {currentClass ? (
                    <CanvasGrid width={1500} height={1000} cellSize={cellSize} />
                ) : (
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        height: '100%', 
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ marginBottom: '10px' }}>Ingen klasse valgt</h2>
                        <p>Velg eller opprett en klasse i menyen til høyre for å lage klassekart.</p>
                    </div>
                )}
            </div>
        )}
        
        {activeTab === 'grupper' && (
            <div ref={groupsContainerRef} id="groups-container-react" className="scroll-wrapper" style={{ 
                backgroundColor: '#f7f9fc',
                display: 'block',
                boxSizing: 'border-box',
                position: 'relative'
            }}>
                <div id="groups-visual-content" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: isFullscreen ? 'repeat(auto-fill, minmax(350px, 1fr))' : `repeat(auto-fill, minmax(${220 * (groupScale || 1)}px, 1fr))`, 
                    gap: isFullscreen ? '25px' : '15px', 
                    padding: isFullscreen ? '50px' : '30px 10px 80px 10px',
                    alignItems: 'start',
                    width: '100%',
                    boxSizing: 'border-box'
                }}>
                    {generatedGroups.map((group, index) => {
                        const members = group.leader 
                            ? [group.leader, ...group.members.filter(m => m !== group.leader)]
                            : group.members;

                        return (
                        <div key={index} className="group-card" style={{ 
                            backgroundColor: 'white',
                            borderTop: `4px solid ${getGroupColor(index)}`,
                            padding: '0', 
                            borderRadius: '8px', 
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
                            minWidth: '0', // Allow grid to control width
                            overflow: 'hidden',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            animation: isAnimating ? `fadeInUp 0.5s ease forwards ${index * 0.1}s` : 'none',
                            opacity: isAnimating ? 0 : 1,
                            transform: isAnimating ? 'translateY(20px)' : 'none'
                        }}>
                            <div className="group-header" style={{ 
                                fontWeight: '600', 
                                padding: isFullscreen ? '18px 22px' : `${12 * (groupScale || 1)}px ${15 * (groupScale || 1)}px`,
                                backgroundColor: getGroupColor(index),
                                color: '#333',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                fontSize: isFullscreen ? '24px' : `${18 * (groupScale || 1)}px`
                            }}>
                                <span>Gruppe {index + 1}</span>
                            </div>
                            <ul className="group-students-list" style={{ listStyle: 'none', padding: `${10 * (groupScale || 1)}px 0`, margin: 0 }}>
                                {members.map((student, sIndex) => (
                                    <li key={sIndex} className="group-student-item" style={{ 
                                        padding: isFullscreen ? '12px 20px' : `${8 * (groupScale || 1)}px ${15 * (groupScale || 1)}px`, 
                                        borderBottom: sIndex < members.length - 1 ? '1px solid #f0f0f0' : 'none',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        fontSize: isFullscreen ? '20px' : `${16 * (groupScale || 1)}px`
                                    }}>
                                        <span>{student}</span>
                                        {group.leader === student && <span title="Gruppeleder" style={{ marginLeft: '8px' }}>👑</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                    })}
                    <style>{`
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                    {generatedGroups.length === 0 && (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#666', marginTop: '50px' }}>
                            <p>Ingen grupper generert ennå.</p>
                            <p>Bruk kontrollpanelet til høyre for å generere grupper.</p>
                        </div>
                    )}
                </div>
                <CanvasToolbar 
                    scale={groupScale || 1}
                    setScale={setGroupScale}
                    onFullscreen={handleGroupsFullscreen}
                />
            </div>
        )}


      </div>
    </div>
  );
};

export default LeftPanel;
