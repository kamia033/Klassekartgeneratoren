import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import type { Zone } from '../../../types';
import './StudentList.css';
import gearIcon from '../../../assets/gear.svg'; // Assuming you have a gear icon or I can use a unicode char for now

interface StudentListProps {
  // No props needed if we use context and local state here
}

const StudentList: React.FC<StudentListProps> = () => {
  const { students, setStudents, absentStudents, setAbsentStudents, canvasItems, studentZoneAssignments, setStudentZoneAssignments, showZones, studentConstraints, setStudentConstraints } = useApp();
  const [studentInput, setStudentInput] = useState(students.join('\n'));
  const [isEditingList, setIsEditingList] = useState(false);
  const [activeStudentMenu, setActiveStudentMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{top: number, right: number} | null>(null);

  const openMenu = (e: React.MouseEvent, student: string) => {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      setMenuPosition({
          top: rect.bottom + 5,
          right: window.innerWidth - rect.right
      });
      setActiveStudentMenu(student);
  };

  const closeMenu = () => {
      setActiveStudentMenu(null);
      setMenuPosition(null);
  };

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

  const toggleStudentConstraint = (student: string, otherStudent: string) => {
      const currentConstraints = studentConstraints[student] || [];
      const otherConstraints = studentConstraints[otherStudent] || [];
      
      let newConstraints: string[];
      let newOtherConstraints: string[];

      if (currentConstraints.includes(otherStudent)) {
          newConstraints = currentConstraints.filter(s => s !== otherStudent);
          newOtherConstraints = otherConstraints.filter(s => s !== student);
      } else {
          newConstraints = [...currentConstraints, otherStudent];
          newOtherConstraints = otherConstraints.includes(student) ? otherConstraints : [...otherConstraints, student];
      }

      setStudentConstraints({
          ...studentConstraints,
          [student]: newConstraints,
          [otherStudent]: newOtherConstraints
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
                                <label htmlFor={`student-checkbox-${index}`} style={{ cursor: 'pointer', textDecoration: absentStudents.includes(student) ? 'line-through' : 'none', color: absentStudents.includes(student) ? '#999' : 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 0, maxWidth: '120px', marginRight: '4px' }}>
                                    {student}
                                </label>
                                <div className="hide-scrollbar" style={{ display: 'flex', gap: '4px', overflowX: 'auto', whiteSpace: 'nowrap', minWidth: 0, flex: 1, alignItems: 'center' }}>
                                    {showZones && assignedZones.length > 0 && (
                                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                            {assignedZones.map(z => (
                                                <span key={z.id} style={{ 
                                                    fontSize: '10px', 
                                                    backgroundColor: z.color, 
                                                    padding: '2px 4px', 
                                                    borderRadius: '4px',
                                                    opacity: 0.8,
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {z.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    {showZones && (studentConstraints[student] || []).length > 0 && (
                                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                            {(studentConstraints[student] || []).map(constrainedStudent => (
                                                <span key={constrainedStudent} style={{ 
                                                    fontSize: '10px', 
                                                    backgroundColor: '#ffebee', 
                                                    color: '#c62828',
                                                    padding: '2px 4px', 
                                                    borderRadius: '4px',
                                                    opacity: 0.8,
                                                    border: '1px solid #ffcdd2',
                                                    whiteSpace: 'nowrap'
                                                }} title={`Unngå ${constrainedStudent}`}>
                                                    🚫 {constrainedStudent}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {showZones && (
                                <button 
                                    onClick={(e) => openMenu(e, student)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', padding: '0 4px', marginLeft: 'auto', display: 'flex', alignItems: 'center', flexShrink: 0, width: 'auto' }}
                                    title="Velg soner"
                                >
                                    <img src={gearIcon} alt="Gear" style={{ width: '20px', height: '20px' }} />
                                </button>
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

        {activeStudentMenu && (
            <div 
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} 
                onClick={closeMenu}
            />
        )}

        {activeStudentMenu && menuPosition && (
            <div style={{
                position: 'fixed',
                top: menuPosition.top,
                right: menuPosition.right,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                zIndex: 1000,
                minWidth: '200px',
                maxHeight: '300px',
                overflowY: 'auto'
            }}>
                <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '12px', backgroundColor: '#f9f9f9' }}>
                    Innstillinger for {activeStudentMenu}
                </div>
                
                <div style={{ padding: '4px 8px', borderBottom: '1px solid #eee', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>Velg soner</div>
                {zones.map(zone => {
                    const assignedZoneIds = studentZoneAssignments[activeStudentMenu] || [];
                    const isAssigned = assignedZoneIds.includes(zone.id);
                    return (
                        <div 
                            key={zone.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleZoneAssignment(activeStudentMenu, zone.id);
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

                <div style={{ padding: '4px 8px', borderBottom: '1px solid #eee', borderTop: '1px solid #eee', fontWeight: 'bold', fontSize: '12px', marginTop: '4px' }}>Grupper (unngå)</div>
                <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                        {(studentConstraints[activeStudentMenu] || []).map(constrainedStudent => (
                            <span key={constrainedStudent} style={{ 
                                backgroundColor: '#ffebee', 
                                color: '#c62828', 
                                padding: '2px 6px', 
                                borderRadius: '12px', 
                                fontSize: '11px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '4px' 
                            }}>
                                {constrainedStudent}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleStudentConstraint(activeStudentMenu, constrainedStudent);
                                    }}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        cursor: 'pointer', 
                                        padding: 0, 
                                        fontSize: '10px', 
                                        color: '#c62828',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    ✕
                                </button>
                            </span>
                        ))}
                        {(studentConstraints[activeStudentMenu] || []).length === 0 && (
                            <span style={{ color: '#999', fontSize: '11px', fontStyle: 'italic' }}>Ingen begrensninger</span>
                        )}
                    </div>
                    
                    <select 
                        onChange={(e) => {
                            if (e.target.value) {
                                toggleStudentConstraint(activeStudentMenu, e.target.value);
                                e.target.value = ""; // Reset select
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: '100%', padding: '4px', fontSize: '12px', borderRadius: '4px', border: '1px solid #ccc' }}
                        defaultValue=""
                    >
                        <option value="" disabled>Legg til elev...</option>
                        {students
                            .filter(s => s !== activeStudentMenu && !(studentConstraints[activeStudentMenu] || []).includes(s))
                            .map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))
                        }
                    </select>
                </div>
            </div>
        )}
    </div>
  );
};

export default StudentList;
