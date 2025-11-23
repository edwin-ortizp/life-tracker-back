import { enableNetwork, waitForPendingWrites } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCallback } from 'react';

export const useResync = (label?: string) => {
  return useCallback(async () => {
    await enableNetwork(db);
    await waitForPendingWrites(db);
    if (import.meta.env.DEV && label) {
    }
  }, [label]);
};
