import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import type { CanvasItem, Desk, RoundTable } from '../../types';
import './RightPanel.css';
import './Groups.css';
import './Roles.css';
import './Colors.css';

const RightPanel: React.FC = () => {
  const { activeTab, setActiveTab, mode, setMode, students, setStudents, canvasItems, setCanvasItems, setGeneratedGroups, absentStudents, setAbsentStudents, setIsAnimating, secondaryMapItems, setSecondaryMapItems, currentMapIndex, setCurrentMapIndex, currentClass, setCurrentClass } = useApp();
  const { addToast } = useToast();
  const [studentInput, setStudentInput] = useState(students.join('\n'));
  const [savedClasses, setSavedClasses] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingList, setIsEditingList] = useState(false);
  
  // Groups Tab State
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(3);
  const [keepExtraSeparate, setKeepExtraSeparate] = useState(false);
  const [selectLeaders, setSelectLeaders] = useState(false);
  const [showAnimation, setShowAnimation] = useState(true);

  useEffect(() => {
      if (!isEditingList) {
          setStudentInput(students.join('\n'));
      }
  }, [students, isEditingList]);

  useEffect(() => {
      const classes = JSON.parse(localStorage.getItem('classes') || '{}');
      setSavedClasses(Object.keys(classes));
  }, []);

  const handleStudentInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setStudentInput(e.target.value);
      const newStudents = e.target.value.split('\n').filter(s => s.trim() !== '');
      setStudents(newStudents);
  };

  // Update studentInput when students array changes, but only if we're not currently editing
  // This prevents the cursor jumping or newline issues while typing
  useEffect(() => {
      if (!isEditingList) {
          setStudentInput(students.join('\n'));
      }
  }, [students, isEditingList]);

  const toggleAbsent = (student: string) => {
      if (absentStudents.includes(student)) {
          setAbsentStudents(absentStudents.filter(s => s !== student));
      } else {
          setAbsentStudents([...absentStudents, student]);
      }
  };

  const shuffleArray = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
  };

  const switchMap = (index: number) => {
      if (index === currentMapIndex) return;
      
      // Save current items to secondary storage
      const currentItems = [...canvasItems];
      const otherItems = [...secondaryMapItems];
      
      setSecondaryMapItems(currentItems);
      setCanvasItems(otherItems);
      setCurrentMapIndex(index);
  };

  const extractGroups = (items: CanvasItem[]) => {
      const groups: { id: string, slots: { itemIndex: number, seatIndex?: number }[], x: number, y: number }[] = [];
      const visited = new Set<string>();
      
      // 1. Desks (Connected Components)
      const desks = items.filter(i => i.type === 'desk') as Desk[];
      const deskMap = new Map<string, Desk>();
      desks.forEach(d => deskMap.set(`${d.gridX},${d.gridY}`, d));

      for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.type === 'desk' && !visited.has(item.id)) {
              const desk = item as Desk;
              const groupDesks: Desk[] = [];
              const stack = [desk];
              visited.add(desk.id);
              
              while (stack.length) {
                  const current = stack.pop()!;
                  groupDesks.push(current);
                  
                  const neighbors = [
                      { x: current.gridX + 1, y: current.gridY },
                      { x: current.gridX - 1, y: current.gridY },
                      { x: current.gridX, y: current.gridY + 1 },
                      { x: current.gridX, y: current.gridY - 1 }
                  ];
                  
                  for (const n of neighbors) {
                      const neighbor = deskMap.get(`${n.x},${n.y}`);
                      if (neighbor && !visited.has(neighbor.id)) {
                          visited.add(neighbor.id);
                          stack.push(neighbor);
                      }
                  }
              }
              
              // Sort desks in group by position (reading order)
              groupDesks.sort((a, b) => (a.gridY - b.gridY) || (a.gridX - b.gridX));
              
              const slots = groupDesks.map(d => ({
                  itemIndex: items.findIndex(it => it.id === d.id)
              }));
              
              const minX = Math.min(...groupDesks.map(d => d.gridX));
              const minY = Math.min(...groupDesks.map(d => d.gridY));
              
              groups.push({
                  id: groupDesks[0].id,
                  slots,
                  x: minX,
                  y: minY
              });
          } else if (item.type === 'roundtable') {
              const table = item as RoundTable;
              const slots = [];
              for (let s = 0; s < table.numSeats; s++) {
                  slots.push({ itemIndex: i, seatIndex: s });
              }
              groups.push({
                  id: table.id,
                  slots,
                  x: table.gridX,
                  y: table.gridY
              });
          }
      }
      
      // Sort groups by position (Top-Left to Bottom-Right)
      groups.sort((a, b) => (a.y - b.y) || (a.x - b.x));
      
      return groups;
  };

  const assignStudents = () => {
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      const shuffledStudents = shuffleArray([...presentStudents]);
      
      // 1. Assign to Current Map (Primary)
      const groups1 = extractGroups(canvasItems);
      const newCanvasItems = [...canvasItems];
      const studentClusters: string[][] = [];
      
      // Find all students currently in marked desks/seats in Map 1.
      const lockedStudents1 = new Set<string>();
      canvasItems.forEach(item => {
          if (item.type === 'desk' && (item as Desk).marked && (item as Desk).studentId) {
              lockedStudents1.add((item as Desk).studentId!);
          } else if (item.type === 'roundtable') {
              const t = item as RoundTable;
              t.markedSeats.forEach((marked, idx) => {
                  if (marked && t.studentIds[idx]) {
                      lockedStudents1.add(t.studentIds[idx]!);
                  }
              });
          }
      });
      
      // Filter these out from the pool for Map 1
      const studentsForMap1 = shuffledStudents.filter(s => !lockedStudents1.has(s));
      
      let studentIndex = 0;
      
      // Fill groups in Map 1 and record clusters
      for (const group of groups1) {
          const cluster: string[] = [];
          for (const slot of group.slots) {
              // Check if slot is locked (marked)
              const item = newCanvasItems[slot.itemIndex];
              let isLocked = false;
              
              if (item.type === 'desk') {
                  if ((item as Desk).marked) isLocked = true;
              } else if (item.type === 'roundtable') {
                  if ((item as RoundTable).markedSeats[slot.seatIndex!]) isLocked = true;
              }
              
              if (!isLocked) {
                  if (studentIndex < studentsForMap1.length) {
                      const student = studentsForMap1[studentIndex++];
                      cluster.push(student);
                      
                      // Update item
                      if (item.type === 'desk') {
                          newCanvasItems[slot.itemIndex] = { ...item, studentId: student } as Desk;
                      } else if (item.type === 'roundtable') {
                          const t = item as RoundTable;
                          const newIds = [...t.studentIds];
                          newIds[slot.seatIndex!] = student;
                          newCanvasItems[slot.itemIndex] = { ...t, studentIds: newIds };
                      }
                  } else {
                      // Clear slot if no student
                      if (item.type === 'desk') {
                          newCanvasItems[slot.itemIndex] = { ...item, studentId: null } as Desk;
                      } else if (item.type === 'roundtable') {
                          const t = item as RoundTable;
                          const newIds = [...t.studentIds];
                          newIds[slot.seatIndex!] = null;
                          newCanvasItems[slot.itemIndex] = { ...t, studentIds: newIds };
                      }
                  }
              }
          }
          if (cluster.length > 0) {
              studentClusters.push(cluster);
          }
      }
      
      setCanvasItems(newCanvasItems);

      // 2. Assign to Secondary Map (if exists)
      if (secondaryMapItems.length > 0) {
          const groups2 = extractGroups(secondaryMapItems);
          const newSecondaryItems = [...secondaryMapItems];
          
          // For Map 2:
          // We need to know which students are locked in Map 2.
          const lockedStudents2 = new Set<string>();
          secondaryMapItems.forEach(item => {
              if (item.type === 'desk' && (item as Desk).marked && (item as Desk).studentId) {
                  lockedStudents2.add((item as Desk).studentId!);
              } else if (item.type === 'roundtable') {
                  const t = item as RoundTable;
                  t.markedSeats.forEach((marked, idx) => {
                      if (marked && t.studentIds[idx]) {
                          lockedStudents2.add(t.studentIds[idx]!);
                      }
                  });
              }
          });
          
          // The clusters we formed in Map 1 contain students.
          // Some of these students might be locked in Map 2!
          // If a student in a cluster is locked in Map 2, they MUST be at their locked position.
          // So they cannot be part of the "movable cluster" for Map 2.
          // We should remove them from the cluster for Map 2 placement.
          
          const clustersForMap2 = studentClusters.map(cluster => 
              cluster.filter(s => !lockedStudents2.has(s))
          ).filter(c => c.length > 0);
          
          // Also, students who were locked in Map 1 (and thus not in clusters)
          // might need to be placed in Map 2 (if they are not locked in Map 2).
          const studentsLockedIn1ButNot2 = [...lockedStudents1].filter(s => !lockedStudents2.has(s));
          
          // We can treat these as single-student clusters or just a pool of extras.
          // Let's add them as single clusters for now, or append to existing clusters?
          // Probably just add as size-1 clusters to be placed.
          studentsLockedIn1ButNot2.forEach(s => clustersForMap2.push([s]));
          
          // Now place `clustersForMap2` into `groups2`.
          // Sort clusters by size (descending) to place large groups first.
          clustersForMap2.sort((a, b) => b.length - a.length);
          
          // We need to track available slots in `groups2`.
          // Filter out locked slots in `groups2`.
          const groups2Available = groups2.map(g => {
              const availableSlots = g.slots.filter(slot => {
                  const item = newSecondaryItems[slot.itemIndex];
                  if (item.type === 'desk') return !(item as Desk).marked;
                  if (item.type === 'roundtable') return !(item as RoundTable).markedSeats[slot.seatIndex!];
                  return true;
              });
              return { ...g, slots: availableSlots };
          }).filter(g => g.slots.length > 0);
          
          // Try to fit clusters
          for (const cluster of clustersForMap2) {
              // Find best fit group
              // 1. Capacity >= cluster size
              // 2. Smallest remaining capacity (tightest fit)
              // 3. Position (top-left preference)
              
              let bestGroupIndex = -1;
              let minWaste = Infinity;
              
              for (let i = 0; i < groups2Available.length; i++) {
                  const g = groups2Available[i];
                  if (g.slots.length >= cluster.length) {
                      const waste = g.slots.length - cluster.length;
                      if (waste < minWaste) {
                          minWaste = waste;
                          bestGroupIndex = i;
                      }
                  }
              }
              
              if (bestGroupIndex !== -1) {
                  // Place in this group
                  const group = groups2Available[bestGroupIndex];
                  for (const student of cluster) {
                      const slot = group.slots.shift()!; // Take slot
                      
                      // Update item
                      const item = newSecondaryItems[slot.itemIndex];
                      if (item.type === 'desk') {
                          newSecondaryItems[slot.itemIndex] = { ...item, studentId: student } as Desk;
                      } else if (item.type === 'roundtable') {
                          const t = item as RoundTable;
                          const newIds = [...t.studentIds];
                          newIds[slot.seatIndex!] = student;
                          newSecondaryItems[slot.itemIndex] = { ...t, studentIds: newIds };
                      }
                  }
              } else {
                  // No group fits the whole cluster.
                  // Split cluster and fill whatever is available.
                  for (const student of cluster) {
                      // Find first group with space
                      const group = groups2Available.find(g => g.slots.length > 0);
                      if (group) {
                          const slot = group.slots.shift()!;
                          const item = newSecondaryItems[slot.itemIndex];
                          if (item.type === 'desk') {
                              newSecondaryItems[slot.itemIndex] = { ...item, studentId: student } as Desk;
                          } else if (item.type === 'roundtable') {
                              const t = item as RoundTable;
                              const newIds = [...t.studentIds];
                              newIds[slot.seatIndex!] = student;
                              newSecondaryItems[slot.itemIndex] = { ...t, studentIds: newIds };
                          }
                      } else {
                          // No space left in Map 2!
                          // Student cannot be placed.
                      }
                  }
              }
          }
          
          // Clear remaining empty slots in Map 2 (that weren't locked)
          groups2Available.forEach(g => {
              g.slots.forEach(slot => {
                  const item = newSecondaryItems[slot.itemIndex];
                  if (item.type === 'desk') {
                      newSecondaryItems[slot.itemIndex] = { ...item, studentId: null } as Desk;
                  } else if (item.type === 'roundtable') {
                      const t = item as RoundTable;
                      const newIds = [...t.studentIds];
                      newIds[slot.seatIndex!] = null;
                      newSecondaryItems[slot.itemIndex] = { ...t, studentIds: newIds };
                  }
              });
          });
          
          setSecondaryMapItems(newSecondaryItems);
      }
  };

  const getDeskGroups = (items: CanvasItem[]) => {
    const desks = items.filter(item => item.type === 'desk') as Desk[];
    const visited = new Set<string>();
    const groups: Desk[][] = [];

    for (const desk of desks) {
      if (visited.has(desk.id)) continue;
      const group: Desk[] = [];
      const stack = [desk];
      while (stack.length) {
        const current = stack.pop()!;
        if (!visited.has(current.id)) {
          visited.add(current.id);
          group.push(current);
          for (const other of desks) {
            if (!visited.has(other.id)) {
              if ((other.gridX === current.gridX + 1 && other.gridY === current.gridY) ||
                  (other.gridX === current.gridX - 1 && other.gridY === current.gridY) ||
                  (other.gridY === current.gridY + 1 && other.gridX === current.gridX) ||
                  (other.gridY === current.gridY - 1 && other.gridX === current.gridX)) {
                stack.push(other);
              }
            }
          }
        }
      }
      groups.push(group);
    }
    return groups;
  };

  const sparkleItUp = (scheme: string) => {
      let palette: string[] = [];
      if (scheme === 'intense') {
          palette = ['#FF0000', '#FF8700', '#FFD300', '#DEFF0A', '#A1FF0A', '#0AFF99', '#0AEFFF', '#147DF5', '#580AFF', '#BE0AFF'];
      } else if (scheme === 'pastel') {
          palette = ["#FBF8CC", "#FDE4CF", "#FFCFD2", "#F1C0E8", "#CFBAF0", "#A3C4F3", "#90DBF4", "#8EECF5", "#98F5E1", "#B9FBC0"];
      } else if (scheme === 'pink') {
          palette = ["#ff0a54", "#ff477e", "#ff5c8a", "#ff7096", "#ff85a1", "#ff99ac", "#fbb1bd", "#f9bec7", "#f7cad0", "#fae0e4"];
      } else if (scheme === 'mindaro') {
          palette = ["#d9ed92", "#b5e48c", "#99d98c", "#76c893", "#52b69a", "#34a0a4", "#168aad", "#1a759f", "#1e6091", "#184e77"];
      }

      palette = palette.sort(() => Math.random() - 0.5);
      
      const groups = getDeskGroups(canvasItems);
      const newItems = [...canvasItems];

      groups.forEach((group, index) => {
          const color = palette[index % palette.length];
          group.forEach(desk => {
              const itemIndex = newItems.findIndex(i => i.id === desk.id);
              if (itemIndex !== -1) {
                  const item = newItems[itemIndex] as Desk;
                  newItems[itemIndex] = { ...item, color };
              }
          });
      });

      // Roundtables
      const roundtables = newItems.filter(item => item.type === 'roundtable') as RoundTable[];
      let availableColors = [...palette];
      roundtables.forEach(table => {
          if (availableColors.length === 0) availableColors = [...palette]; // Recycle colors if needed
          const color = availableColors.pop();
          const itemIndex = newItems.findIndex(i => i.id === table.id);
          if (itemIndex !== -1) {
              const item = newItems[itemIndex] as RoundTable;
              newItems[itemIndex] = { ...item, color: color || null };
          }
      });

      setCanvasItems(newItems);
  };



  const loadClass = (className: string) => {
      const classes = JSON.parse(localStorage.getItem('classes') || '{}');
      if (classes[className]) {
          const data = classes[className];
          setStudents(data.students || []);
          
          // Load Map 1 as active, Map 2 as secondary (default behavior)
          setCanvasItems(data.canvasItems || []);
          setSecondaryMapItems(data.canvasItems2 || []);
          setCurrentMapIndex(0);

          setCurrentClass(className);
          setGeneratedGroups([]); // Clear groups when loading new class
          addToast(`Lastet klasse '${className}'`, 'info');
      }
  };

  const createClass = () => {
      const name = prompt("Navn på ny klasse:");
      if (name) {
          const classes = JSON.parse(localStorage.getItem('classes') || '{}');
          if (classes[name]) {
              addToast("Klassen finnes allerede!", 'error');
              return;
          }
          classes[name] = { 
              students: [], 
              canvasItems: [], 
              canvasItems2: [] 
          };
          localStorage.setItem('classes', JSON.stringify(classes));
          setSavedClasses(Object.keys(classes));
          setCurrentClass(name);
          setStudents([]);
          setCanvasItems([]);
          setSecondaryMapItems([]);
          setCurrentMapIndex(0);
          setGeneratedGroups([]);
          addToast(`Opprettet ny klasse '${name}'`, 'success');
      }
  };

  const deleteClass = () => {
      if (!currentClass) return;
      if (confirm(`Slette klassen '${currentClass}'?`)) {
          const classes = JSON.parse(localStorage.getItem('classes') || '{}');
          delete classes[currentClass];
          localStorage.setItem('classes', JSON.stringify(classes));
          setSavedClasses(Object.keys(classes));
          setCurrentClass('');
          setStudents([]);
          setCanvasItems([]);
          setSecondaryMapItems([]);
          setCurrentMapIndex(0);
          setGeneratedGroups([]);
          addToast(`Slettet klasse '${currentClass}'`, 'info');
      }
  };

  const adjustGroupSize = (delta: number) => {
      const newVal = Math.max(2, Math.min(10, groupSize + delta));
      setGroupSize(newVal);
      if (students.length > 0) {
          const newCount = Math.floor(students.length / newVal);
          if (newCount > 0) setGroupCount(newCount);
      }
  };

  const adjustGroupCount = (delta: number) => {
      const newVal = Math.max(2, Math.min(15, groupCount + delta));
      setGroupCount(newVal);
      if (students.length > 0) {
          const newSize = Math.floor(students.length / newVal);
          if (newSize > 0) setGroupSize(Math.max(2, newSize));
      }
  };

  // Update group count/size when students change
  useEffect(() => {
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      if (presentStudents.length > 0) {
          // If we have a fixed group count, update size
          const newSize = Math.floor(presentStudents.length / groupCount);
          if (newSize > 0) setGroupSize(Math.max(2, newSize));
      }
  }, [students, absentStudents, groupCount]);

  const generateRandomGroups = () => {
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      if (presentStudents.length === 0) {
          addToast("Ingen elever å lage grupper av!", 'error');
          return;
      }

      const shuffled = shuffleArray([...presentStudents]);
      const groups: { members: string[], leader?: string }[] = [];
      
      const baseSize = Math.floor(shuffled.length / groupCount);
      const extra = shuffled.length % groupCount;
      
      let currentIndex = 0;
      
      for (let i = 0; i < groupCount; i++) {
          let size = baseSize;
          if (!keepExtraSeparate && i < extra) {
              size++;
          }
          
          const groupMembers = shuffled.slice(currentIndex, currentIndex + size);
          currentIndex += size;
          
          let leader: string | undefined;
          if (selectLeaders && groupMembers.length > 0) {
              leader = groupMembers[Math.floor(Math.random() * groupMembers.length)];
          }
          
          groups.push({ members: groupMembers, leader });
      }
      
      if (keepExtraSeparate && currentIndex < shuffled.length) {
          const remaining = shuffled.slice(currentIndex);
          let leader: string | undefined;
          if (selectLeaders && remaining.length > 0) {
              leader = remaining[Math.floor(Math.random() * remaining.length)];
          }
          groups.push({ members: remaining, leader });
      }

      if (showAnimation) {
          setIsAnimating(true);
          // Delay setting groups slightly to allow animation to start if needed, 
          // but actually we want the groups to be available for the animation component.
          // We'll set them immediately, and LeftPanel will handle the display.
          setGeneratedGroups(groups);
          // We don't turn off isAnimating here, LeftPanel will do it after animation completes.
      } else {
          setIsAnimating(false);
          setGeneratedGroups(groups);
      }
      
      addToast(`Genererte ${groups.length} grupper!`, 'success');
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
      <div className={activeTab === 'kart' ? 'tab-content active' : 'tab-content'}>
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

        <div id="mode-slider" className="save-section">
          <button id="mode-box" onClick={() => setMode(mode === 'window' ? 'fullscreen' : 'window')}>
            <div id="active-mode" className="mode-button" style={mode === 'window' ? { backgroundColor: '#dbdbdb' } : {}}>Vindu</div>
            <div id="inactive-mode" className="mode-button" style={mode === 'fullscreen' ? { backgroundColor: '#dbdbdb' } : {}}>Fullskjerm</div>
          </button>
        </div>

        <div className="save-section">
            <div className="dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="dropdown-selected">{currentClass || "🧑‍🏫 Velg klasse"}</div>
                {isDropdownOpen && (
                    <ul className="dropdown-options" style={{ display: 'block' }}>
                        {savedClasses.map(className => (
                            <li key={className} onClick={(e) => { e.stopPropagation(); loadClass(className); setIsDropdownOpen(false); }}>{className}</li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={createClass}>⭐ Opprett klasse</button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', gap: '4px' }}>
                <button onClick={deleteClass} style={{ backgroundColor: '#ff4444', color: 'white' }}>🗑️ Slett</button>
            </div>
        </div>

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

        <button onClick={assignStudents}>✨Plasser elever✨</button>
        
        <div style={{ display: 'flex', marginTop: '10px', border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden' }}>
            <button 
                onClick={() => switchMap(0)} 
                style={{ 
                    flex: 1, 
                    backgroundColor: currentMapIndex === 0 ? '#e0e0e0' : 'white', 
                    border: 'none', 
                    borderRadius: 0,
                    fontWeight: currentMapIndex === 0 ? 'bold' : 'normal',
                    padding: '8px'
                }}
            >
                Klassekart 1
            </button>
            <div style={{ width: '1px', backgroundColor: '#ccc' }}></div>
            <button 
                onClick={() => switchMap(1)} 
                style={{ 
                    flex: 1, 
                    backgroundColor: currentMapIndex === 1 ? '#e0e0e0' : 'white', 
                    border: 'none', 
                    borderRadius: 0,
                    fontWeight: currentMapIndex === 1 ? 'bold' : 'normal',
                    padding: '8px'
                }}
            >
                Klassekart 2
            </button>
        </div>

        {/* Color Picker */}
        <div className="color-picker" style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            <p id="color-headline">🎨 Farger</p>
            <div className="color-button-container" onClick={() => sparkleItUp('intense')}>
                {['#FF0000', '#FF8700', '#DEFF0A', '#A1FF0A', '#0AFF99', '#FFD300', '#0AEFFF', '#147DF5', '#580AFF', '#BE0AFF'].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('pastel')}>
                {["#FBF8CC", "#FDE4CF", "#FFCFD2", "#F1C0E8", "#CFBAF0", "#A3C4F3", "#90DBF4", "#8EECF5", "#98F5E1", "#B9FBC0"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('pink')}>
                {["#ff0a54", "#ff477e", "#ff5c8a", "#ff7096", "#ff85a1", "#ff99ac", "#fbb1bd", "#f9bec7", "#f7cad0", "#fae0e4"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
            <div className="color-button-container" onClick={() => sparkleItUp('mindaro')}>
                {["#d9ed92", "#b5e48c", "#99d98c", "#76c893", "#52b69a", "#34a0a4", "#168aad", "#1a759f", "#1e6091", "#184e77"].map(c => (
                    <div key={c} className="color-button" style={{ backgroundColor: c }}></div>
                ))}
            </div>
        </div>

      </div>
      
      {/* Groups Tab Content */}
      <div className={activeTab === 'grupper' ? 'tab-content active' : 'tab-content'}>
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

        <div className="save-section">
            <div className="dropdown" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="dropdown-selected">{currentClass || "🧑‍🏫 Velg klasse"}</div>
                {isDropdownOpen && (
                    <ul className="dropdown-options" style={{ display: 'block' }}>
                        {savedClasses.map(className => (
                            <li key={className} onClick={(e) => { e.stopPropagation(); loadClass(className); setIsDropdownOpen(false); }}>{className}</li>
                        ))}
                    </ul>
                )}
            </div>
            <button onClick={createClass}>⭐ Opprett klasse</button>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px', gap: '4px' }}>
                <button onClick={deleteClass} style={{ backgroundColor: '#ff4444', color: 'white' }}>🗑️ Slett</button>
            </div>
        </div>

        <div className="student-list-container">
            <div className="student-input-section">
                {isEditingList ? (
                    <textarea 
                        id="groupStudentList" 
                        placeholder="Skriv inn elevnavn (ett per linje)" 
                        value={studentInput}
                        onChange={handleStudentInputChange}
                        style={{ margin: 0, width: 'calc(100% - 20px)' }}
                    ></textarea>
                ) : (
                    <div className="student-list-with-checkboxes" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px', backgroundColor: 'white' }}>
                        {students.map((student, index) => (
                            <div key={index} className="checkbox-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                                <input 
                                    type="checkbox" 
                                    id={`group-student-checkbox-${index}`}
                                    checked={!absentStudents.includes(student)}
                                    onChange={() => toggleAbsent(student)}
                                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor={`group-student-checkbox-${index}`} style={{ cursor: 'pointer', textDecoration: absentStudents.includes(student) ? 'line-through' : 'none', color: absentStudents.includes(student) ? '#999' : 'inherit' }}>
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

        <div className="save-section">
            <button id="generateGroupsButton" onClick={generateRandomGroups}>🎲 Generer grupper</button>
            
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

            {/* Group Preview */}
            <div className="group-preview-container" style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                <div style={{ fontSize: '12px', marginBottom: '5px', fontWeight: 'bold', color: '#666' }}>Forhåndsvisning:</div>
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
      </div>
    </div>
  );
};

export default RightPanel;
