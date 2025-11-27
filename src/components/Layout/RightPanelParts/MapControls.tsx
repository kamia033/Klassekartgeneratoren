import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import type { Desk, RoundTable, Zone } from '../../../types';
import '../Colors.css';
import '../Groups.css';
import diceIcon from '../../../assets/dice.svg';

const MapControls: React.FC = () => {
  const { canvasItems, setCanvasItems, students, absentStudents, currentMapIndex, setCurrentMapIndex, secondaryMapItems, setSecondaryMapItems, uniformTextSize, setUniformTextSize, studentZoneAssignments, showZones, setShowZones, studentConstraints } = useApp();
  const { addToast } = useToast();

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
      
      const newItems = [...canvasItems];
      
      // Grouping logic for desks
      const desks = newItems.filter(item => item.type === 'desk') as Desk[];
      const visited = new Set<string>();
      let groupColorIndex = 0;

      const areAdjacent = (d1: Desk, d2: Desk) => {
          const dx = Math.abs(d1.gridX - d2.gridX);
          const dy = Math.abs(d1.gridY - d2.gridY);
          // Check for 8-way connectivity (including diagonals)
          return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
      };

      desks.forEach(desk => {
          if (visited.has(desk.id)) return;

          const queue = [desk];
          visited.add(desk.id);
          const group = [desk];

          while (queue.length > 0) {
              const current = queue.shift()!;
              desks.forEach(other => {
                  if (!visited.has(other.id) && areAdjacent(current, other)) {
                      visited.add(other.id);
                      queue.push(other);
                      group.push(other);
                  }
              });
          }

          const color = palette[groupColorIndex % palette.length];
          group.forEach(d => d.color = color);
          groupColorIndex++;
      });
      
      // Color roundtables individually
      newItems.forEach(item => {
          if (item.type === 'roundtable') {
             (item as RoundTable).color = palette[groupColorIndex % palette.length];
             groupColorIndex++;
          }
      });

      setCanvasItems(newItems);
  };

  const assignStudents = () => {
      const presentStudents = students.filter(s => !absentStudents.includes(s));
      
      // Helper to get available seats count
      const getAvailableSeats = (items: typeof canvasItems) => {
          let count = 0;
          items.forEach(item => {
              if (item.type === 'desk' && !(item as Desk).marked) count++;
              if (item.type === 'roundtable') {
                  (item as RoundTable).markedSeats.forEach(marked => {
                      if (!marked) count++;
                  });
              }
          });
          return count;
      };

      // Check if we can fit everyone
      const seatsMap1 = getAvailableSeats(canvasItems);
      const seatsMap2 = getAvailableSeats(secondaryMapItems);
      
      if (seatsMap2 > 0 && seatsMap2 < presentStudents.length) {
          addToast(`Advarsel: Kart 2 mangler ${presentStudents.length - seatsMap2} plasser!`, 'error');
      }

      // 1. Assign to Map 1 (With Zones)
      const assignToMapWithZones = (items: typeof canvasItems, allStudents: string[]) => {
          const cellSize = 40;
          const zones = items.filter(i => i.type === 'zone') as Zone[];
          
          // Pre-process locked students
          const assignments = new Map<string, string>(); // seatKey -> studentId
          const lockedStudents = new Set<string>();

          items.forEach(item => {
              if (item.type === 'desk') {
                  const desk = item as Desk;
                  if (desk.locked && desk.studentId && allStudents.includes(desk.studentId)) {
                      assignments.set(`${desk.id}-desk`, desk.studentId);
                      lockedStudents.add(desk.studentId);
                  }
              } else if (item.type === 'roundtable') {
                  const rt = item as RoundTable;
                  if (rt.lockedSeats) {
                      rt.lockedSeats.forEach((locked, idx) => {
                          const sId = rt.studentIds[idx];
                          if (locked && sId && allStudents.includes(sId)) {
                              assignments.set(`${rt.id}-${idx}`, sId);
                              lockedStudents.add(sId);
                          }
                      });
                  }
              }
          });

          const studentsToAssign = allStudents.filter(s => !lockedStudents.has(s));

          // Map students to zones
          const zoneStudents: Record<string, string[]> = {};
          const unassignedStudents: string[] = [];

          studentsToAssign.forEach(s => {
              const assignedZoneIds = studentZoneAssignments ? (studentZoneAssignments[s] || []) : [];
              // Filter out invalid zones
              const validZoneIds = assignedZoneIds.filter(id => zones.some(z => z.id === id));
              
              if (validZoneIds.length > 0) {
                  // If student has multiple zones, pick one randomly for this placement
                  const randomZoneId = validZoneIds[Math.floor(Math.random() * validZoneIds.length)];
                  if (!zoneStudents[randomZoneId]) zoneStudents[randomZoneId] = [];
                  zoneStudents[randomZoneId].push(s);
              } else {
                  unassignedStudents.push(s);
              }
          });

          // Shuffle all lists
          Object.keys(zoneStudents).forEach(k => {
              zoneStudents[k] = zoneStudents[k].sort(() => Math.random() - 0.5);
          });
          const shuffledUnassigned = unassignedStudents.sort(() => Math.random() - 0.5);

          // Identify seats and their zones
          type SeatLocation = {
              itemId: string;
              seatIndex?: number; // for roundtables
              zoneId: string | null;
          };

          const seats: SeatLocation[] = [];

          items.forEach(item => {
              if (item.type === 'desk') {
                  const desk = item as Desk;
                  if (!desk.marked) {
                      // Check if desk is in a zone
                      const deskX = desk.gridX * cellSize;
                      const deskY = desk.gridY * cellSize;
                      // Center of desk
                      const cx = deskX + cellSize / 2;
                      const cy = deskY + cellSize / 2;

                      const zone = zones.find(z => 
                          cx >= z.x && cx <= z.x + z.width &&
                          cy >= z.y && cy <= z.y + z.height
                      );
                      
                      seats.push({ itemId: desk.id, zoneId: zone ? zone.id : null });
                  }
              } else if (item.type === 'roundtable') {
                  const rt = item as RoundTable;
                  // Check if roundtable is in a zone (center of table)
                  const rtX = rt.gridX * cellSize;
                  const rtY = rt.gridY * cellSize;
                  const cx = rtX + cellSize; // 2x2 grid, so center is +1 cell
                  const cy = rtY + cellSize;

                  const zone = zones.find(z => 
                      cx >= z.x && cx <= z.x + z.width &&
                      cy >= z.y && cy <= z.y + z.height
                  );

                  rt.markedSeats.forEach((marked, idx) => {
                      if (!marked) {
                          seats.push({ itemId: rt.id, seatIndex: idx, zoneId: zone ? zone.id : null });
                      }
                  });
              }
          });

          // Assign students to seats
          // assignments map is already initialized and pre-filled with locked students
          const getSeatKey = (s: SeatLocation) => `${s.itemId}-${s.seatIndex ?? 'desk'}`;

          // Helper to check constraints
          const hasConflict = (student: string, seat: SeatLocation, currentAssignments: Map<string, string>) => {
              const constraints = studentConstraints[student] || [];
              if (constraints.length === 0) return false;

              // Find neighbors of this seat
              const neighbors: string[] = [];
              
              if (seat.seatIndex !== undefined) {
                  // Roundtable: check other seats at same table
                  const tableSeats = seats.filter(s => s.itemId === seat.itemId && s.seatIndex !== seat.seatIndex);
                  tableSeats.forEach(s => {
                      const neighborId = currentAssignments.get(getSeatKey(s));
                      if (neighborId) neighbors.push(neighborId);
                  });
              } else {
                  // Desk: check adjacent desks
                  const currentDesk = items.find(i => i.id === seat.itemId) as Desk;
                  if (currentDesk) {
                      const adjacentDesks = items.filter(i => {
                          if (i.type !== 'desk' || i.id === currentDesk.id) return false;
                          const d = i as Desk;
                          const dx = Math.abs(d.gridX - currentDesk.gridX);
                          const dy = Math.abs(d.gridY - currentDesk.gridY);
                          return dx <= 1 && dy <= 1;
                      }) as Desk[];
                      
                      adjacentDesks.forEach(d => {
                          const key = `${d.id}-desk`;
                          const neighborId = currentAssignments.get(key);
                          if (neighborId) neighbors.push(neighborId);
                      });
                  }
              }

              return neighbors.some(neighbor => 
                  constraints.includes(neighbor) || (studentConstraints[neighbor] || []).includes(student)
              );
          };

          // Greedy assignment with constraints
          const assignGreedy = (studentsToAssign: string[], availableSeats: SeatLocation[]) => {
              // Sort students by constraint count (hardest first)
              const sortedStudents = [...studentsToAssign].sort((a, b) => {
                  const cA = (studentConstraints[a] || []).length;
                  const cB = (studentConstraints[b] || []).length;
                  return cB - cA;
              });

              // Shuffle seats to ensure randomness in placement
              const shuffledSeats = [...availableSeats].sort(() => Math.random() - 0.5);
              
              const unassigned: string[] = [];

              sortedStudents.forEach(student => {
                  // Find a valid seat
                  const validSeatIndex = shuffledSeats.findIndex(seat => 
                      !assignments.has(getSeatKey(seat)) && !hasConflict(student, seat, assignments)
                  );

                  if (validSeatIndex !== -1) {
                      const seat = shuffledSeats[validSeatIndex];
                      assignments.set(getSeatKey(seat), student);
                      // Remove seat from available pool for efficiency? 
                      // Actually we check assignments.has() so it's fine.
                  } else {
                      // No valid seat found (conflict-free). 
                      // Try to find ANY empty seat
                      const emptySeatIndex = shuffledSeats.findIndex(seat => !assignments.has(getSeatKey(seat)));
                      if (emptySeatIndex !== -1) {
                          const seat = shuffledSeats[emptySeatIndex];
                          assignments.set(getSeatKey(seat), student);
                          // addToast(`Kunne ikke oppfylle alle ønsker for ${student}`, 'warning');
                      } else {
                          unassigned.push(student);
                      }
                  }
              });
              return unassigned;
          };

          // 1. Fill Zones
          Object.entries(zoneStudents).forEach(([zoneId, students]) => {
              const zoneSeats = seats.filter(s => s.zoneId === zoneId);
              const leftOver = assignGreedy(students, zoneSeats);
              
              if (leftOver.length > 0) {
                  const zoneName = zones.find(z => z.id === zoneId)?.name || 'Ukjent sone';
                  addToast(`${leftOver.length} elever fikk ikke plass i ${zoneName}`, 'error');
                  leftOver.forEach(s => shuffledUnassigned.push(s));
              }
          });

          // 2. Fill remaining seats with unassigned students
          const usedSeats = new Set(assignments.keys());
          const remainingSeats = seats.filter(s => !usedSeats.has(getSeatKey(s)));
          
          const reallyUnassigned = assignGreedy(shuffledUnassigned, remainingSeats);
          
          if (reallyUnassigned.length > 0) {
              addToast(`${reallyUnassigned.length} elever fikk ikke plass på kartet`, 'error');
          }

          // Apply assignments to items
          return items.map(item => {
              if (item.type === 'desk') {
                  const key = `${item.id}-desk`;
                  if (assignments.has(key)) {
                      return { ...item, studentId: assignments.get(key) || null };
                  } else if (!(item as Desk).marked) {
                      return { ...item, studentId: null };
                  }
                  return item;
              } else if (item.type === 'roundtable') {
                  const rt = item as RoundTable;
                  const finalIds = rt.studentIds.map((_, idx) => {
                      if (rt.markedSeats[idx]) return null;
                      const key = `${item.id}-${idx}`;
                      return assignments.get(key) || null;
                  });
                  return { ...rt, studentIds: finalIds };
              }
              return item;
          });
      };

      const newCanvasItems = assignToMapWithZones(canvasItems, presentStudents);
      setCanvasItems(newCanvasItems);

      // 2. Extract Groups from Map 1
      const studentGroups: string[][] = [];
      
      // 2a. Roundtables
      newCanvasItems.forEach(item => {
          if (item.type === 'roundtable') {
              const t = item as RoundTable;
              const group = t.studentIds.filter(id => id !== null) as string[];
              if (group.length > 0) studentGroups.push(group);
          }
      });

      // 2b. Desks (Connected Components)
      const desks = newCanvasItems.filter(item => item.type === 'desk' && (item as Desk).studentId) as Desk[];
      const visited = new Set<string>();
      
      const areAdjacent = (d1: Desk, d2: Desk) => {
          const dx = Math.abs(d1.gridX - d2.gridX);
          const dy = Math.abs(d1.gridY - d2.gridY);
          return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
      };

      desks.forEach(desk => {
          if (visited.has(desk.id)) return;
          
          const queue = [desk];
          visited.add(desk.id);
          const group: string[] = [desk.studentId!];

          while (queue.length > 0) {
              const current = queue.shift()!;
              desks.forEach(other => {
                  if (!visited.has(other.id) && areAdjacent(current, other)) {
                      visited.add(other.id);
                      queue.push(other);
                      group.push(other.studentId!);
                  }
              });
          }
          studentGroups.push(group);
      });

      // 3. Identify Seat Clusters in Map 2
      type SeatRef = { itemId: string, seatIndex?: number };
      type SeatCluster = { seats: SeatRef[], capacity: number };
      const seatClusters: SeatCluster[] = [];

      // 3a. Roundtables in Map 2
      secondaryMapItems.forEach(item => {
          if (item.type === 'roundtable') {
              const t = item as RoundTable;
              const seats: SeatRef[] = [];
              t.studentIds.forEach((_, i) => {
                  if (!t.markedSeats[i]) {
                      seats.push({ itemId: t.id, seatIndex: i });
                  }
              });
              if (seats.length > 0) {
                  seatClusters.push({ seats, capacity: seats.length });
              }
          }
      });

      // 3b. Desks in Map 2
      const map2Desks = secondaryMapItems.filter(item => item.type === 'desk' && !(item as Desk).marked) as Desk[];
      const visitedMap2 = new Set<string>();

      map2Desks.forEach(desk => {
          if (visitedMap2.has(desk.id)) return;
          
          const queue = [desk];
          visitedMap2.add(desk.id);
          const seats: SeatRef[] = [{ itemId: desk.id }];

          while (queue.length > 0) {
              const current = queue.shift()!;
              map2Desks.forEach(other => {
                  if (!visitedMap2.has(other.id) && areAdjacent(current, other)) {
                      visitedMap2.add(other.id);
                      queue.push(other);
                      seats.push({ itemId: other.id });
                  }
              });
          }
          seatClusters.push({ seats, capacity: seats.length });
      });

      // 4. Match Groups to Clusters
      studentGroups.sort((a, b) => b.length - a.length);
      
      const assignedMap2 = new Map<string, string | null>();
      const assignedMap2RT = new Map<string, (string | null)[]>();

      secondaryMapItems.forEach(item => {
          if (item.type === 'desk') assignedMap2.set(item.id, null);
          if (item.type === 'roundtable') assignedMap2RT.set(item.id, new Array((item as RoundTable).numSeats).fill(null));
      });

      let splitGroups = 0;
      const unassignedStudents: string[] = [];

      studentGroups.forEach(group => {
          const validClusters = seatClusters.filter(c => c.seats.length >= group.length);
          let targetCluster: SeatCluster | null = null;

          if (validClusters.length > 0) {
              validClusters.sort((a, b) => a.seats.length - b.seats.length);
              targetCluster = validClusters[0];
          } else {
              const availableClusters = seatClusters.filter(c => c.seats.length > 0);
              availableClusters.sort((a, b) => b.seats.length - a.seats.length);
              if (availableClusters.length > 0) {
                  targetCluster = availableClusters[0];
              }
              splitGroups++;
          }

          if (targetCluster) {
              const seatsToFill = Math.min(group.length, targetCluster.seats.length);
              const studentsToPlace = group.slice(0, seatsToFill);
              const remainingStudents = group.slice(seatsToFill);
              
              studentsToPlace.forEach((studentId, i) => {
                  const seat = targetCluster!.seats[i];
                  if (seat.seatIndex !== undefined) {
                      const currentArr = assignedMap2RT.get(seat.itemId)!;
                      currentArr[seat.seatIndex] = studentId;
                      assignedMap2RT.set(seat.itemId, currentArr);
                  } else {
                      assignedMap2.set(seat.itemId, studentId);
                  }
              });

              targetCluster.seats.splice(0, seatsToFill);
              
              if (remainingStudents.length > 0) {
                  unassignedStudents.push(...remainingStudents);
              }
          } else {
              unassignedStudents.push(...group);
          }
      });

      // 5. Fill remaining gaps
      if (unassignedStudents.length > 0) {
          const allRemainingSeats: SeatRef[] = [];
          seatClusters.forEach(c => allRemainingSeats.push(...c.seats));
          
          unassignedStudents.forEach((studentId, i) => {
              if (i < allRemainingSeats.length) {
                  const seat = allRemainingSeats[i];
                  if (seat.seatIndex !== undefined) {
                      const currentArr = assignedMap2RT.get(seat.itemId)!;
                      currentArr[seat.seatIndex] = studentId;
                  } else {
                      assignedMap2.set(seat.itemId, studentId);
                  }
              }
          });
      }

      // 6. Reconstruct Map 2 Items
      const finalMap2Items = secondaryMapItems.map(item => {
          if (item.type === 'desk') {
              return { ...item, studentId: assignedMap2.get(item.id) || null };
          } else if (item.type === 'roundtable') {
              return { ...item, studentIds: assignedMap2RT.get(item.id) || new Array((item as RoundTable).numSeats).fill(null) };
          }
          return item;
      });

      setSecondaryMapItems(finalMap2Items);

      // Check if Map 2 actually has any seats
      const map2HasSeats = secondaryMapItems.some(item => 
          (item.type === 'desk' && !(item as Desk).marked) || 
          (item.type === 'roundtable' && (item as RoundTable).markedSeats.some(m => !m))
      );

      if (map2HasSeats) {
          if (splitGroups > 0) {
              addToast(`Advarsel: ${splitGroups} grupper måtte splittes i Kart 2.`, 'info');
          }
      }
  };

  const switchMap = (index: number) => {
      if (index === currentMapIndex) return;
      
      const currentItems = [...canvasItems];
      const otherItems = [...secondaryMapItems];
      
      setSecondaryMapItems(currentItems);
      setCanvasItems(otherItems);
      setCurrentMapIndex(index);
  };

  return (
    <>
        
            <button id="assignStudentsButton" onClick={assignStudents}>
                <div>
                    <img src={diceIcon} style={{ height: '30px', width: '30px' }} alt="Dice" />
                    <span>Plasser elever</span>
                </div>
            </button>
       
        
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

        <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '8px' }}>
                <input 
                    type="checkbox" 
                    checked={uniformTextSize} 
                    onChange={(e) => setUniformTextSize(e.target.checked)}
                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px' }}>Samme tekststørrelse på alle</span>
            </label>
        </div>
    </>
  );
};

export default MapControls;