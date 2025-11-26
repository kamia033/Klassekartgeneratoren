import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import '../Groups.css'; // Reuse existing Groups.css
import diceIcon from '../../../assets/dice.svg';

const GroupControls: React.FC = () => {
    const { students, absentStudents, setGeneratedGroups, setIsAnimating } = useApp();
    const { addToast } = useToast();

    const [groupSize, setGroupSize] = useState(3);
    const [groupCount, setGroupCount] = useState(3);
    const [keepExtraSeparate, setKeepExtraSeparate] = useState(false);
    const [selectLeaders, setSelectLeaders] = useState(false);
    const [showAnimation, setShowAnimation] = useState(true);

    // Update counts when students change
    useEffect(() => {
        const presentCount = students.filter(s => !absentStudents.includes(s)).length;
        if (presentCount > 0) {
            // Default to group size 3
            // Logic: floor(total / 3)
            const calculatedCount = Math.floor(presentCount / 3);
            setGroupCount(Math.max(1, calculatedCount));
            setGroupSize(3);
        }
    }, [students, absentStudents]);

    const adjustGroupSize = (delta: number) => {
        const newVal = Math.max(2, Math.min(10, groupSize + delta));
        setGroupSize(newVal);
        
        const presentCount = students.filter(s => !absentStudents.includes(s)).length;
        if (presentCount > 0) {
            // Use floor to match generation logic
            const newCount = Math.floor(presentCount / newVal);
            setGroupCount(Math.max(1, newCount));
        }
    };

    const adjustGroupCount = (delta: number) => {
        const targetCount = Math.max(1, Math.min(20, groupCount + delta));
        
        const presentCount = students.filter(s => !absentStudents.includes(s)).length;
        if (presentCount > 0) {
            // Calculate what size would give us approx this count
            const newSize = Math.round(presentCount / targetCount);
            const validSize = Math.max(2, newSize);
            setGroupSize(validSize);
            
            // Recalculate count based on this new size to be honest about what will be generated
            const actualCount = Math.floor(presentCount / validSize);
            setGroupCount(Math.max(1, actualCount));
        } else {
            setGroupCount(targetCount);
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

        // Calculate groups based on SIZE, not count
        // But respect the user's choice if they manually adjusted count?
        // The user wants to follow settings.
        // If we use groupSize as the primary driver:
        let numGroups = Math.floor(shuffled.length / groupSize);
        if (numGroups === 0) numGroups = 1;
        
        // If keepExtraSeparate is true, we make groups of exactly 'groupSize', and put the rest in a new group.
        if (keepExtraSeparate) {
            numGroups = Math.ceil(shuffled.length / groupSize);
        }

        const baseSize = groupSize; // Use the requested size as base
        
        // If we are NOT keeping extra separate, we need to distribute the remainder.
        // But wait, if we use floor(total / size), we get the number of full groups.
        // Example: 10 students, size 4. floor(10/4) = 2 groups.
        // Remainder is 2.
        // If we distribute remainder (2) over the 2 groups, they become size 5.
        // This matches the request: "Resten kan distriuberes på de første gruppene,slik at noen av de første gruppene har fem medlemmer"

        let currentIndex = 0;

        for (let i = 0; i < numGroups; i++) {
            let size = baseSize;
            
            if (keepExtraSeparate) {
                // Strict sizing logic
                size = groupSize;
                // The last group takes whatever is left if we are at the end
                if (currentIndex + size > shuffled.length) {
                    size = shuffled.length - currentIndex;
                }
            } else {
                // Distribute extra students evenly
                // We need to recalculate 'extra' based on the actual number of groups we decided on (floor)
                const remainder = shuffled.length - (numGroups * baseSize);
                if (i < remainder) {
                    size++;
                }
            }
            
            if (size === 0) continue;

            const groupMembers = shuffled.slice(currentIndex, currentIndex + size);
            currentIndex += size;

            let leader: string | undefined;
            if (selectLeaders && groupMembers.length > 0) {
                leader = groupMembers[Math.floor(Math.random() * groupMembers.length)];
            }

            groups.push({ members: groupMembers, leader });
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
            <button id="generateButton" onClick={generateGroups} >
                <div>
                    <img src={diceIcon} alt="Dice" />
                    <span>Generer grupper</span>
                </div>
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
