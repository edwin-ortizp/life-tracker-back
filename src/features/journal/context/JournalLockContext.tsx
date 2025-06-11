import React, { createContext, useContext, useState } from 'react';

interface JournalLockContextValue {
  isUnlocked: boolean;
  setUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
}

const defaultValue: JournalLockContextValue = {
  isUnlocked: false,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setUnlocked: () => {}
};

const JournalLockContext = createContext<JournalLockContextValue>(defaultValue);

export const JournalLockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isUnlocked, setUnlocked] = useState(false);
  return (
    <JournalLockContext.Provider value={{ isUnlocked, setUnlocked }}>
      {children}
    </JournalLockContext.Provider>
  );
};

export const useJournalLock = () => useContext(JournalLockContext);
