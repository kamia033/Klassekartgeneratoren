import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import './StudentList.css';

interface StudentListProps {
  // No props needed if we use context and local state here
}

const StudentList: React.FC<StudentListProps> = () => {
  const { students, setStudents, absentStudents, setAbsentStudents } = useApp();
  const [studentInput, setStudentInput] = useState(students.join('\n'));
  const [isEditingList, setIsEditingList] = useState(false);

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
                <div className="student-list-with-checkboxes" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white' }}>
                    {students.map((student, index) => (
                        <div key={index} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                            <input 
                                type="checkbox" 
                                id={`student-checkbox-${index}`}
                                checked={!absentStudents.includes(student)}
                                onChange={() => toggleAbsent(student)}
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor={`student-checkbox-${index}`} style={{ cursor: 'pointer', textDecoration: absentStudents.includes(student) ? 'line-through' : 'none', color: absentStudents.includes(student) ? '#999' : 'inherit' }}>
                                {student}
                            </label>
                        </div>
                    ))}
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
