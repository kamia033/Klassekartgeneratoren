import React from 'react';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../context/ToastContext';
import type { Desk, RoundTable } from '../../../types';
import '../Colors.css';
import '../Groups.css';
import diceIcon from '../../../assets/dice.svg';

const MapControls: React.FC = () => {
  const { canvasItems, setCanvasItems, students, absentStudents, currentMapIndex, setCurrentMapIndex, secondaryMapItems, setSecondaryMapItems } = useApp();
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
      const shuffledStudents = [...presentStudents].sort(() => Math.random() - 0.5);
      
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
      
      if (seatsMap1 < shuffledStudents.length) {
          addToast(`Advarsel: Kart 1 mangler ${shuffledStudents.length - seatsMap1} plasser!`, 'error');
      }
      if (seatsMap2 < shuffledStudents.length) {
          addToast(`Advarsel: Kart 2 mangler ${shuffledStudents.length - seatsMap2} plasser!`, 'error');
      }

      // 1. Assign to Map 1 (Randomly)
      const assignToMapRandomly = (items: typeof canvasItems, studentList: string[]) => {
          let studentIndex = 0;
          return items.map(item => {
              if (item.type === 'desk') {
                  const desk = item as Desk;
                  if (desk.marked) return { ...desk, studentId: null };
                  return { ...desk, studentId: studentList[studentIndex++] || null };
              } else if (item.type === 'roundtable') {
                  const t = item as RoundTable;
                  const newIds = t.studentIds.map((_, i) => {
                      if (t.markedSeats[i]) return null;
                      return studentList[studentIndex++] || null;
                  });
                  return { ...t, studentIds: newIds };
              }
              return item;
          });
      };

      const newCanvasItems = assignToMapRandomly(canvasItems, shuffledStudents);
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

      if (splitGroups > 0) {
          addToast(`Advarsel: ${splitGroups} grupper måtte splittes i Kart 2.`, 'info');
      } else {
          addToast('Elever plassert! Grupperinger bevart.', 'success');
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
    </>
  );
};

export default MapControls;