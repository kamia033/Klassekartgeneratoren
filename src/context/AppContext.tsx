import React, { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import type { CanvasItem } from '../types';
import { useLocalStorageState } from '../hooks/useLocalStorageState';

interface Group {
  members: string[];
  leader?: string;
}

const MAX_UNDO_STEPS = 100;

interface AppContextType {
  students: string[];
  setStudents: (students: string[]) => void;
  canvasItems: CanvasItem[];
  setCanvasItems: (items: CanvasItem[]) => void;
  updateCanvasItemsLive: (items: CanvasItem[]) => void;
  recordCanvasHistory: () => void;
  undoCanvas: () => void;
  canUndo: boolean;
  redoCanvas: () => void;
  canRedo: boolean;
  renameStudent: (oldName: string, newName: string) => boolean;
  currentClass: string;
  setCurrentClass: (name: string) => void;
  activeTab: 'kart' | 'grupper';
  setActiveTab: (tab: 'kart' | 'grupper') => void;
  mode: 'window' | 'fullscreen';
  setMode: (mode: 'window' | 'fullscreen') => void;
  generatedGroups: Group[];
  setGeneratedGroups: (groups: Group[]) => void;
  isAnimating: boolean;
  setIsAnimating: (isAnimating: boolean) => void;
  absentStudents: string[];
  setAbsentStudents: (students: string[]) => void;
  secondaryMapItems: CanvasItem[];
  setSecondaryMapItems: (items: CanvasItem[]) => void;
  currentMapIndex: number;
  setCurrentMapIndex: (index: number) => void;
  groupScale: number;
  setGroupScale: (scale: number) => void;
  uniformTextSize: boolean;
  setUniformTextSize: (uniform: boolean) => void;
  studentZoneAssignments: Record<string, string[]>; // studentName -> zoneIds
  setStudentZoneAssignments: (assignments: Record<string, string[]>) => void;
  showZones: boolean;
  setShowZones: (show: boolean) => void;
  showChairs: boolean;
  setShowChairs: (show: boolean) => void;
  studentConstraints: Record<string, string[]>; // studentName -> list of studentNames to avoid
  setStudentConstraints: (constraints: Record<string, string[]>) => void;
  studentPairings: Record<string, string[]>; // studentName -> students to seat together
  setStudentPairings: (pairings: Record<string, string[]>) => void;
  animateSeating: boolean;
  setAnimateSeating: (animate: boolean) => void;
  seatingAnimationRequest: number;
  requestSeatingAnimation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<string[]>([]);
  const [canvasItems, setCanvasItemsState] = useState<CanvasItem[]>([]);
  const [undoStack, setUndoStack] = useState<CanvasItem[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasItem[][]>([]);
  const [currentClass, setCurrentClass] = useLocalStorageState<string>('klassekart-current-class', '');
  const [activeTab, setActiveTab] = useLocalStorageState<'kart' | 'grupper'>('klassekart-active-tab', 'kart');
  const [mode, setMode] = useLocalStorageState<'window' | 'fullscreen'>('klassekart-display-mode', 'window');
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<string[]>([]);
  const [secondaryMapItems, setSecondaryMapItems] = useState<CanvasItem[]>([]);
  const [currentMapIndex, setCurrentMapIndex] = useLocalStorageState<number>('klassekart-map-index', 0);
  const [groupScale, setGroupScale] = useLocalStorageState<number>('klassekart-group-scale', 1);
  const [uniformTextSize, setUniformTextSize] = useLocalStorageState<boolean>('klassekart-uniform-text-size', false);
  const [studentZoneAssignments, setStudentZoneAssignments] = useState<Record<string, string[]>>({});
  const [showZones, setShowZones] = useLocalStorageState<boolean>('klassekart-show-zones', false);
  const [showChairs, setShowChairs] = useLocalStorageState<boolean>('klassekart-show-chairs', false);
  const [studentConstraints, setStudentConstraints] = useState<Record<string, string[]>>({});
  const [studentPairings, setStudentPairings] = useState<Record<string, string[]>>({});
  const [animateSeating, setAnimateSeating] = useLocalStorageState<boolean>('klassekart-animate-seating', true);
  const [seatingAnimationRequest, setSeatingAnimationRequest] = useState(0);

  // Undo history only applies to the map currently shown, so it is reset when the class or map changes.
  useLayoutEffect(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, [currentClass, currentMapIndex]);

  // Generated groups belong to the class they were made for.
  useLayoutEffect(() => {
    setGeneratedGroups([]);
  }, [currentClass]);

  // A new change invalidates anything that was undone before it.
  const recordCanvasHistory = () => {
    setUndoStack(prev => [...prev.slice(-(MAX_UNDO_STEPS - 1)), canvasItems]);
    setRedoStack([]);
  };

  const setCanvasItems = (items: CanvasItem[]) => {
    if (items === canvasItems) return;
    recordCanvasHistory();
    setCanvasItemsState(items);
  };

  // Used for continuous changes (dragging/resizing) where history is recorded once at the start.
  const updateCanvasItemsLive = (items: CanvasItem[]) => {
    setCanvasItemsState(items);
  };

  const undoCanvas = () => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, canvasItems]);
    setCanvasItemsState(undoStack[undoStack.length - 1]);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redoCanvas = () => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, canvasItems]);
    setCanvasItemsState(redoStack[redoStack.length - 1]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Renames a student everywhere the name is stored. Returns false if the name is empty or already taken.
  const renameStudent = (oldName: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return false;
    if (students.includes(trimmed)) return false;

    const rename = (name: string | null | undefined): string | null => (name === oldName ? trimmed : (name ?? null));
    const renameItems = (items: CanvasItem[]) => items.map(item => {
      if (item.type === 'desk') return { ...item, studentId: rename(item.studentId) };
      if (item.type === 'roundtable') return { ...item, studentIds: item.studentIds.map(rename) };
      return item;
    });

    setStudents(students.map(s => (s === oldName ? trimmed : s)));
    setAbsentStudents(absentStudents.map(s => (s === oldName ? trimmed : s)));
    setSecondaryMapItems(renameItems(secondaryMapItems));
    setCanvasItems(renameItems(canvasItems));

    const renameKey = <T,>(record: Record<string, T>) => {
      const result: Record<string, T> = {};
      for (const [key, value] of Object.entries(record)) {
        result[key === oldName ? trimmed : key] = value;
      }
      return result;
    };
    setStudentZoneAssignments(renameKey(studentZoneAssignments));
    const constraints = renameKey(studentConstraints);
    for (const key of Object.keys(constraints)) {
      constraints[key] = constraints[key].map(s => (s === oldName ? trimmed : s));
    }
    setStudentConstraints(constraints);
    const pairings = renameKey(studentPairings);
    for (const key of Object.keys(pairings)) {
      pairings[key] = pairings[key].map(s => (s === oldName ? trimmed : s));
    }
    setStudentPairings(pairings);
    return true;
  };

  return (
    <AppContext.Provider
      value={{
        students,
        setStudents,
        canvasItems,
        setCanvasItems,
        updateCanvasItemsLive,
        recordCanvasHistory,
        undoCanvas,
        canUndo: undoStack.length > 0,
        redoCanvas,
        canRedo: redoStack.length > 0,
        renameStudent,
        currentClass,
        setCurrentClass,
        activeTab,
        setActiveTab,
        mode,
        setMode,
        generatedGroups,
        setGeneratedGroups,
        isAnimating,
        setIsAnimating,
        absentStudents,
        setAbsentStudents,
        secondaryMapItems,
        setSecondaryMapItems,
        currentMapIndex,
        setCurrentMapIndex,
        groupScale,
        setGroupScale,
        uniformTextSize,
        setUniformTextSize,
        studentZoneAssignments,
        setStudentZoneAssignments,
        showZones,
        setShowZones,
        showChairs,
        setShowChairs,
        studentConstraints,
        setStudentConstraints,
        studentPairings,
        setStudentPairings,
        animateSeating,
        setAnimateSeating,
        seatingAnimationRequest,
        requestSeatingAnimation: () => setSeatingAnimationRequest(request => request + 1),
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
