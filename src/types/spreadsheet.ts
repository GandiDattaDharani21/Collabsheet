import { Timestamp } from 'firebase/firestore';

export interface SpreadsheetDocument {
  id: string;
  title: string;
  author: string;
  lastModifiedBy?: string;
  lastModified: Timestamp;
  createdAt: Timestamp;
  sheets?: string[]; // List of sheet names
  theme?: string;
}

export interface CellData {
  id: string;
  value: string | number;
  formula: string | null;
  updatedBy: string;
  updatedAt: Timestamp;
  style?: {
    bold?: boolean;
    italic?: boolean;
    color?: string;
    backgroundColor?: string;
    fontSize?: number;
    textAlign?: 'left' | 'center' | 'right';
  };
}

export interface PresenceData {
  userId: string;
  name: string;
  color: string;
  lastActive: Timestamp;
  selection: string | null;
}

export interface SheetSettings {
  columnWidths: Record<string, number>;
  rowHeights: Record<string, number>;
  columnOrder: number[];
  rowOrder: number[];
}

export interface GridDimensions {
  columnWidths: Record<string, number>;
  rowHeights: Record<number, number>;
}

export interface ColumnResize {
  columnId: string;
  width: number;
}

export interface RowResize {
  rowId: number;
  height: number;
}
