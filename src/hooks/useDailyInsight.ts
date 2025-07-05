import { useState, useEffect, useCallback } from 'react';
import { getLocalDateString } from '@/utils/dates';
import { generateDailyInsight } from '@/services/insightGenerator';
import { useAuth } from '@/hooks/useAuth';

export interface DailyInsight {
  content: string;
  quickAction?: string;
  generatedAt: string;
  date: string;
  isValid: boolean;
  prompt?: string;
}

interface UseDailyInsightReturn {
  insight: DailyInsight | null;
  loading: boolean;
  error: string | null;
  regenerateInsight: () => Promise<void>;
  lastPrompt?: string;
}

const CACHE_KEY = 'daily_insight';
const INSIGHT_GENERATION_HOUR = 5; // 5 AM Colombia time

export const useDailyInsight = (date: Date): UseDailyInsightReturn => {
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const dateStr = getLocalDateString(date);

  // Check if we need to generate a new insight
  const shouldGenerateNewInsight = useCallback((cachedInsight: DailyInsight | null): boolean => {
    if (!cachedInsight) return true;
    
    // If it's for a different date
    if (cachedInsight.date !== dateStr) return true;
    
    // If it's not valid anymore
    if (!cachedInsight.isValid) return true;
    
    // Check if it was generated today and if it's past 5 AM
    const generatedDate = new Date(cachedInsight.generatedAt);
    const now = new Date();
    const todayAt5AM = new Date();
    todayAt5AM.setHours(INSIGHT_GENERATION_HOUR, 0, 0, 0);
    
    // If it's past 5 AM and the insight is from yesterday, generate new one
    if (now >= todayAt5AM && generatedDate < todayAt5AM) {
      return true;
    }
    
    return false;
  }, [dateStr]);

  // Load cached insight from localStorage
  const loadCachedInsight = useCallback((): DailyInsight | null => {
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${dateStr}`);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached) as DailyInsight;
      
      // Validate the cached insight
      if (!parsed.content || !parsed.generatedAt || !parsed.date) {
        return null;
      }
      
      return parsed;
    } catch (error) {
      console.error('Error loading cached insight:', error);
      return null;
    }
  }, [dateStr]);

  // Save insight to localStorage
  const saveInsightToCache = useCallback((newInsight: DailyInsight) => {
    try {
      localStorage.setItem(`${CACHE_KEY}_${dateStr}`, JSON.stringify(newInsight));
    } catch (error) {
      console.error('Error saving insight to cache:', error);
    }
  }, [dateStr]);

  // Generate new insight
  const generateNewInsight = useCallback(async (): Promise<DailyInsight | null> => {
    if (!user) {
      setError('Usuario no autenticado');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const generatedContent = await generateDailyInsight(date, user.uid);
      
      if (!generatedContent) {
        throw new Error('No se pudo generar el insight');
      }

      const newInsight: DailyInsight = {
        content: generatedContent.content,
        quickAction: generatedContent.quickAction,
        generatedAt: new Date().toISOString(),
        date: dateStr,
        isValid: true,
        prompt: generatedContent.prompt
      };

      saveInsightToCache(newInsight);
      return newInsight;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error generating insight:', err);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [date, dateStr, saveInsightToCache, user]);

  // Force regenerate insight
  const regenerateInsight = useCallback(async (): Promise<void> => {
    const newInsight = await generateNewInsight();
    if (newInsight) {
      setInsight(newInsight);
    }
  }, [generateNewInsight]);

  // Load or generate insight on mount/date change
  useEffect(() => {
    const loadInsight = async () => {
      // First, try to load from cache
      const cachedInsight = loadCachedInsight();
      
      // Check if we need a new insight
      if (shouldGenerateNewInsight(cachedInsight)) {
        // Generate new insight
        const newInsight = await generateNewInsight();
        if (newInsight) {
          setInsight(newInsight);
        } else if (cachedInsight) {
          // If generation failed but we have cache, use it
          setInsight(cachedInsight);
        }
      } else if (cachedInsight) {
        // Use cached insight
        setInsight(cachedInsight);
      }
    };

    loadInsight();
  }, [dateStr, loadCachedInsight, shouldGenerateNewInsight, generateNewInsight]);

  // Auto-generate insight at 5 AM
  useEffect(() => {
    const checkForAutoGeneration = () => {
      const now = new Date();
      const todayAt5AM = new Date();
      todayAt5AM.setHours(INSIGHT_GENERATION_HOUR, 0, 0, 0);
      
      // If it's 5 AM or later and we haven't generated today's insight
      if (now >= todayAt5AM) {
        const cachedInsight = loadCachedInsight();
        if (shouldGenerateNewInsight(cachedInsight)) {
          regenerateInsight();
        }
      }
    };

    // Check immediately
    checkForAutoGeneration();

    // Set up interval to check every 15 minutes to reduce overhead
    const interval = setInterval(checkForAutoGeneration, 900000); // 15 minutos

    return () => clearInterval(interval);
  }, [dateStr, loadCachedInsight, shouldGenerateNewInsight, regenerateInsight]);

  return {
    insight,
    loading,
    error,
    regenerateInsight,
    lastPrompt: insight?.prompt
  };
};