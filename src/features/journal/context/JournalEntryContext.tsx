import React, { createContext, useContext, useState } from 'react';

interface JournalEntryContextValue {
  entry: string;
  setEntry: React.Dispatch<React.SetStateAction<string>>;
}

const JournalEntryContext = createContext<JournalEntryContextValue | undefined>(undefined);

export const JournalEntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entry, setEntry] = useState('');
  return (
    <JournalEntryContext.Provider value={{ entry, setEntry }}>
      {children}
    </JournalEntryContext.Provider>
  );
};

export const useJournalEntry = () => {
  const context = useContext(JournalEntryContext);
  if (!context) {
    throw new Error('useJournalEntry must be used within JournalEntryProvider');
  }
  return context;
};
