export interface JournalEntry {
  userId: string;
  text: string;
  date: string;
  lastUpdated: Date;
  displayTime: string;
}

export interface JournalProps {
  selectedDate: Date;
}

export interface JournalData {
  entry: string;
  setEntry: (value: string) => void;
  status: string;
  error: string | null;
  saveEntry: (text: string) => Promise<void>;
  lastUpdated?: string;
}