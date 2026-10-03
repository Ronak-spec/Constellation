export type StarCategory = 'Work' | 'Chores' | 'Connection' | 'Rest' | 'Joy' | 'Scroll';

export interface StarEntry {
  id: string;
  activity: string;
  mins: number;
  cat: StarCategory;
  time: string;
  x?: number;
  y?: number;
}

export interface UnlitTask {
  id: string;
  text: string;
  cat: StarCategory;
  createdAt: number;
  fromUnderstory?: boolean;
  x?: number;
  y?: number;
}

export interface MeteorSub {
  id: string;
  name: string;
  cost: number;
  kept: boolean;
}

export interface ArchivedNight {
  date: string;
  name: string;
  entries: StarEntry[];
}

export interface UnderstoryNode {
  id: string;
  text: string;
  ts?: number;
  isGhost?: boolean;
  isOwn?: boolean;
}

export interface UnderstoryThread {
  from: string;
  to: string;
}

export interface ConstellationState {
  birthYear: number;
  lifeExp: number;
  wage: number;
  entries: StarEntry[];
  tasks: UnlitTask[];
  subs: MeteorSub[];
  archive: ArchivedNight[];
  usOwn: { id: string; text: string; ts: number }[];
  usThreads: UnderstoryThread[];
  usGhosts: { id: string; text: string }[] | null;
  lastDate: string;
}

export const CAT_COLORS: Record<StarCategory, string> = {
  Work: '#A9C0F0',
  Chores: '#A9C0F0',
  Connection: '#F2C572',
  Rest: '#F2C572',
  Joy: '#F2C572',
  Scroll: '#E0654A',
};

export const CONST_NAMES: Record<string, string> = {
  Work: 'The Laborer',
  Chores: 'The Laborer',
  Connection: 'The Gathering',
  Rest: 'The Quiet Hours',
  Joy: 'The Brightener',
  Scroll: 'The Flicker',
};
