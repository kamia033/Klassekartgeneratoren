import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import type { Zone } from '../../../types';
import './StudentList.css';
import gearIcon from '../../../assets/gear.svg'; // Assuming you have a gear icon or I can use a unicode char for now

interface StudentListProps {
  // No props needed if we use context and local state here
}

const StudentList: React.FC<StudentListProps> = () => {
  const { students, setStudents, absentStudents, setAbsentStudents, canvasItems, studentZoneAssignments, setStudentZoneAssignments, showZones } = useApp();
  const [studentInput, setStudentInput] = useState(students.join('\n'));
  const [isEditingList, setIsEditingList] = useState(false);
  const [activeStudentMenu, setActiveStudentMenu] = useState<string | null>(null);

  const zones = canvasItems.filter(item => item.type === 'zone') as Zone[];

  useEffect(() => {
      if (!isEditingList) {
          setStudentInput(students.join('\n'));
      }
  }, [students, isEditingList]);

  const handleStudentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setStudentInput(e.target.value);
      const newStudents = e.target.value.split('\n').filter(s => s.trim() !== '');
      setStudents(newStudents);
  };

  const toggleAbsent = (student: string) => {
      if (absentStudents.includes(student)) {
          setAbsentStudents(absentStudents.filter(s => s !== student));
      } else {
          setAbsentStudents([...absentStudents, student]);
      }
  };

  const toggleZoneAssignment = (student: string, zoneId: string) => {
      const currentAssignments = studentZoneAssignments[student] || [];
      let newAssignments: string[];
      
      if (currentAssignments.includes(zoneId)) {
          newAssignments = currentAssignments.filter(id => id !== zoneId);
      } else {
          newAssignments = [...currentAssignments, zoneId];
      }

      setStudentZoneAssignments({
          ...studentZoneAssignments,
          [student]: newAssignments
      });
  };

  return (
    <div className="student-list-container">
        <div className="student-input-section">
            {isEditingList ? (
                <textarea 
                    id="studentList" 
                    placeholder="Skriv inn elevnavn (ett per linje)" 
                    value={studentInput}
                    onChange={handleStudentInputChange}
                ></textarea>
            ) : (
                <div className="student-list-with-checkboxes" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white', width: '100%' }}>
                    {students.map((student, index) => {
                        const assignedZoneIds = studentZoneAssignments ? (studentZoneAssignments[student] || []) : [];
                        const assignedZones = zones.filter(z => assignedZoneIds.includes(z.id));
                        
                        return (
                        <div id={`student-item-${index}`} key={index}  className="checkbox-item-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', position: 'relative', width: '100%' }}>
                            <div className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                                <input 
                                    type="checkbox" 
                                    id={`student-checkbox-${index}`}
                                    checked={!absentStudents.includes(student)}
                                    onChange={() => toggleAbsent(student)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                                />
                                <label htmlFor={`student-checkbox-${index}`} style={{ cursor: 'pointer', textDecoration: absentStudents.includes(student) ? 'line-through' : 'none', color: absentStudents.includes(student) ? '#999' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {student}
                                </label>
                                {showZones && assignedZones.length > 0 && (
                                    <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                        {assignedZones.map(z => (
                                            <span key={z.id} style={{ 
                                                fontSize: '10px', 
                                                backgroundColor: z.color, 
                                                padding: '2px 4px', 
                                                borderRadius: '4px',
                                                opacity: 0.8
                                            }}>
                                                {z.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {showZones && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setActiveStudentMenu(activeStudentMenu === student ? null : student); }}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, width: 'auto' }}
                                    title="Velg soner"
                                >
                                    <img src={gearIcon} alt="Gear" style={{ width: '20px', height: '20px' }} />
                                </button>
                            )}

                            {activeStudentMenu === student && (
                                <div style={{
                                    position: 'absolute',
                                    right: '0',
                                    top: '100%',
                                    backgroundColor: 'white',
                                    border: '1px solid #ccc',
                                    borderRadius: '4px',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                    zIndex: 100,
                                    minWidth: '150px'
                                }}>
                                    <div style={{ padding: '4px 8px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '12px' }}>Velg soner</div>
                                    {zones.map(zone => {
                                        const isAssigned = assignedZoneIds.includes(zone.id);
                                        return (
                                            <div 
                                                key={zone.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleZoneAssignment(student, zone.id);
                                                }}
                                                style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            >
                                                <input 
                                                    type="checkbox" 
                                                    checked={isAssigned} 
                                                    readOnly 
                                                    style={{ pointerEvents: 'none' }}
                                                />
                                                <div style={{ width: '10px', height: '10px', backgroundColor: zone.color, borderRadius: '50%' }}></div>
                                                {zone.name}
                                            </div>
                                        );
                                    })}
                                    {zones.length === 0 && (
                                        <div style={{ padding: '6px 12px', color: '#999', fontSize: '12px', fontStyle: 'italic' }}>Ingen soner laget</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )})}
                    {students.length === 0 && <p style={{ color: '#999', fontStyle: 'italic' }}>Ingen elever lagt til.</p>}
                </div>
            )}
            <div className="student-input-controls" style={{ marginTop: '5px' }}>
                <button 
                    onClick={() => setIsEditingList(!isEditingList)} 
                    style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                    {isEditingList ? '☑️ Velg elever' : '📝 Rediger liste'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default StudentList;
