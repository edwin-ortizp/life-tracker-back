import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';

/**
 * Generate a unique 5-digit task code for a user
 * Range: 10000-99999 (90,000 possible codes per user)
 */
export async function generateTaskCode(userId: string): Promise<number> {
  const MIN_CODE = 10000;
  const MAX_CODE = 99999;
  
  // First, try sequential approach - find the highest existing code and increment
  const tasksRef = collection(db, 'tasks');
  const userTasksQuery = query(
    tasksRef,
    where('userId', '==', userId)
  );
  
  try {
    const querySnapshot = await getDocs(userTasksQuery);
    const existingCodes = new Set<number>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.taskCode && typeof data.taskCode === 'number') {
        existingCodes.add(data.taskCode);
      }
    });
    
    // If no existing codes, start with MIN_CODE
    if (existingCodes.size === 0) {
      return MIN_CODE;
    }
    
    // Find the next available sequential code
    const sortedCodes = Array.from(existingCodes).sort((a, b) => a - b);
    
    // Look for gaps in the sequence
    for (let i = 0; i < sortedCodes.length - 1; i++) {
      if (sortedCodes[i + 1] - sortedCodes[i] > 1) {
        return sortedCodes[i] + 1;
      }
    }
    
    // If no gaps, try incrementing the highest code
    const highestCode = Math.max(...sortedCodes);
    if (highestCode < MAX_CODE) {
      return highestCode + 1;
    }
    
    // If we've exhausted sequential codes, fall back to random generation
    return await generateRandomTaskCode(userId, existingCodes);
    
  } catch (error) {
    console.error('Error generating task code:', error);
    // Fallback to random generation on error
    return await generateRandomTaskCode(userId, new Set());
  }
}

/**
 * Generate a random task code when sequential generation fails
 */
async function generateRandomTaskCode(userId: string, existingCodes: Set<number>): Promise<number> {
  const MIN_CODE = 10000;
  const MAX_CODE = 99999;
  const MAX_ATTEMPTS = 10;
  
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const randomCode = Math.floor(Math.random() * (MAX_CODE - MIN_CODE + 1)) + MIN_CODE;
    
    if (!existingCodes.has(randomCode)) {
      // Double-check uniqueness with Firebase query
      const isUnique = await isTaskCodeUnique(userId, randomCode);
      if (isUnique) {
        return randomCode;
      }
    }
  }
  
  // If all attempts fail, throw an error
  throw new Error('Unable to generate unique task code after multiple attempts');
}

/**
 * Check if a task code is unique for a user
 */
export async function isTaskCodeUnique(userId: string, taskCode: number): Promise<boolean> {
  try {
    const tasksRef = collection(db, 'tasks');
    const codeQuery = query(
      tasksRef,
      where('userId', '==', userId),
      where('taskCode', '==', taskCode)
    );
    
    const querySnapshot = await getDocs(codeQuery);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking task code uniqueness:', error);
    return false;
  }
}

/**
 * Validate that a task code is within the valid range
 */
export function isValidTaskCode(taskCode: number): boolean {
  return Number.isInteger(taskCode) && taskCode >= 10000 && taskCode <= 99999;
}