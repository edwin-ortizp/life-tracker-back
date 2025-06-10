import React, { createContext, useContext, useState } from 'react';

interface JournalEntryContextValue {
  entry: string;
  setEntry: React.Dispatch<React.SetStateAction<string>>;
}

const defaultContext: JournalEntryContextValue = {
  entry: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setEntry: () => {}
};

const JournalEntryContext = createContext<JournalEntryContextValue>(defaultContext);

export const JournalEntryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [entry, setEntry] = useState('');
  return (
    <JournalEntryContext.Provider value={{ entry, setEntry }}>
      {children}
    </JournalEntryContext.Provider>
  );
};

export const useJournalEntry = () => useContext(JournalEntryContext);
