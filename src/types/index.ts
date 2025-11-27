export type Student = {
  id: string;
  name: string;
};

export type Position = {
  x: number;
  y: number;
};

export type GridPosition = {
  gridX: number;
  gridY: number;
};

export type Desk = GridPosition & {
  id: string;
  type: 'desk';
  studentId: string | null;
  color: string | null;
  marked: boolean;
};

export type RoundTable = GridPosition & {
  id: string;
  type: 'roundtable';
  numSeats: number;
  studentIds: (string | null)[];
  markedSeats: boolean[];
  color: string | null;
};

export type Blackboard = Position & {
  id: string;
  type: 'blackboard';
  width: number;
  height: number;
  color: string;
};

export type Label = Position & {
  id: string;
  type: 'label';
  width: number;
  height: number;
  text: string;
  crossed: boolean;
  color?: string;
};

export type Zone = Position & {
  id: string;
  type: 'zone';
  width: number;
  height: number;
  name: string;
  color: string;
};

export type CanvasItem = Desk | RoundTable | Blackboard | Label | Zone;

export type ClassData = {
  name: string;
  students: string[]; // Just names for now as per original
  items: CanvasItem[];
};
