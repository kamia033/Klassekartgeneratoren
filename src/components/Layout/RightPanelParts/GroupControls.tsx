import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import '../Groups.css'; // Reuse existing Groups.css
import diceIcon from '../../../assets/dice.svg';

const GroupControls: React.FC = () => {
    const { students, absentStudents, setGeneratedGroups, setIsAnimating, studentConstraints } = useApp();
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

        // We still shuffle students with same constraint count to ensure randomness
        // Actually, let's just shuffle first, then sort stable? No, sort is not stable usually.
        // Let's shuffle, then sort.
        const shuffled = [...presentStudents].sort(() => Math.random() - 0.5);
        shuffled.sort((a, b) => {
            const constraintsA = (studentConstraints[a] || []).length;
            const constraintsB = (studentConstraints[b] || []).length;
            return constraintsB - constraintsA;
        });

        const groups: { members: string[], leader?: string }[] = [];

        // Calculate groups based on SIZE, not count
        let numGroups = Math.floor(shuffled.length / groupSize);
        if (numGroups === 0) numGroups = 1;
        
        if (keepExtraSeparate) {
            numGroups = Math.ceil(shuffled.length / groupSize);
        }

        const baseSize = groupSize; 
        
        // Initialize groups with capacities
        const groupCapacities: number[] = [];
        for (let i = 0; i < numGroups; i++) {
            let size = baseSize;
            if (keepExtraSeparate) {
                size = groupSize;
                if (i === numGroups - 1) {
                    const remainder = shuffled.length % groupSize;
                    if (remainder > 0) size = remainder;
                }
            } else {
                const remainder = shuffled.length % baseSize;
                if (i < remainder) {
                    size = baseSize + 1;
                }
            }
            groupCapacities.push(size);
            groups.push({ members: [] });
        }

        // Greedy placement with constraints
        const unplaced: string[] = [];

        shuffled.forEach(student => {
            const constraints = studentConstraints[student] || [];
            
            // Find valid groups (not full, no conflicts)
            const validGroups = groups.map((g, i) => ({ group: g, index: i, capacity: groupCapacities[i] }))
                .filter(item => {
                    if (item.group.members.length >= item.capacity) return false;
                    // Check constraints
                    const hasConflict = item.group.members.some(member => 
                        constraints.includes(member) || (studentConstraints[member] || []).includes(student)
                    );
                    return !hasConflict;
                });

            if (validGroups.length > 0) {
                // Pick a random valid group to maintain some randomness
                const chosen = validGroups[Math.floor(Math.random() * validGroups.length)];
                chosen.group.members.push(student);
            } else {
                // No valid group found (either full or conflicts)
                // Try to find ANY group that is not full
                const nonFullGroups = groups.map((g, i) => ({ group: g, index: i, capacity: groupCapacities[i] }))
                    .filter(item => item.group.members.length < item.capacity);
                
                if (nonFullGroups.length > 0) {
                    // Pick one (maybe the one with fewest conflicts?)
                    // For now just pick random non-full
                    const chosen = nonFullGroups[Math.floor(Math.random() * nonFullGroups.length)];
                    chosen.group.members.push(student);
                    // Ideally we should warn here, but let's just do best effort
                } else {
                    // Should not happen if capacities sum to total
                    unplaced.push(student);
                }
            }
        });

        // If any unplaced (shouldn't happen), force them in somewhere
        unplaced.forEach(student => {
             groups[0].members.push(student);
        });

        // Shuffle members within each group to avoid constrained students always being first
        groups.forEach(group => {
            group.members.sort(() => Math.random() - 0.5);
        });

        if (selectLeaders) {
            groups.forEach(group => {
                if (group.members.length > 0) {
                    const leaderIndex = Math.floor(Math.random() * group.members.length);
                    group.leader = group.members[leaderIndex];
                }
            });
        }

        setGeneratedGroups(groups);
        if (showAnimation) {
            setIsAnimating(true);
        }
    };

    return (
        <div className="save-section">
            <button id="generateButton" onClick={generateGroups} style={{ marginBottom: '10px' }}>
                <div>
                    <img src={diceIcon} style={{ height: '30px', width: '30px' }} alt="Dice" />
                    <span>Generer grupper</span>
                </div>
            </button>

            <div className="group-controls-horizontal">
                <div className="group-control-item">
                    <label>Størrelse:</label>
                    <div className="group-size-controls">
                        <button className="adjust-button" onClick={() => adjustGroupSize(1)}>+</button>
                        <input type="number" value={groupSize} readOnly />
                        <button className="adjust-button" onClick={() => adjustGroupSize(-1)}>-</button>
                    </div>
                </div>

                <div className="group-control-item">
                    <label>Grupper:</label>
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
                    Vis animasjon
                </label>
            </div>
        </div>
    );
};

export default GroupControls;
