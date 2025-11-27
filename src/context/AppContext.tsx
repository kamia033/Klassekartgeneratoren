import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { CanvasItem } from '../types';

interface Group {
  members: string[];
  leader?: string;
}

interface AppContextType {
  students: string[];
  setStudents: (students: string[]) => void;
  canvasItems: CanvasItem[];
  setCanvasItems: (items: CanvasItem[]) => void;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<string[]>([]);
  const [canvasItems, setCanvasItems] = useState<CanvasItem[]>([]);
  const [currentClass, setCurrentClass] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'kart' | 'grupper'>('kart');
  const [mode, setMode] = useState<'window' | 'fullscreen'>('window');
  const [generatedGroups, setGeneratedGroups] = useState<Group[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [absentStudents, setAbsentStudents] = useState<string[]>([]);
  const [secondaryMapItems, setSecondaryMapItems] = useState<CanvasItem[]>([]);
  const [currentMapIndex, setCurrentMapIndex] = useState<number>(0);
  const [groupScale, setGroupScale] = useState<number>(1);
  const [uniformTextSize, setUniformTextSize] = useState<boolean>(false);
  const [studentZoneAssignments, setStudentZoneAssignments] = useState<Record<string, string[]>>({});
  const [showZones, setShowZones] = useState<boolean>(false);

  return (
    <AppContext.Provider
      value={{
        students,
        setStudents,
        canvasItems,
        setCanvasItems,
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
