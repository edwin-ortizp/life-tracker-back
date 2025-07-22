import { useEffect, useCallback } from 'react';

interface UseTaskKeyboardShortcutsProps {
  openCreateModal: (dueDate?: Date | null, isPrivate?: boolean) => void;
  onSave?: () => void;
  isModalOpen?: boolean;
}

export const useTaskKeyboardShortcuts = ({ 
  openCreateModal, 
  onSave, 
  isModalOpen = false 
}: UseTaskKeyboardShortcutsProps) => {
  
  const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
    // Only handle shortcuts if we're not in an input/textarea (except for modal-specific ones)
    const activeElement = document.activeElement;
    const isInInput = activeElement instanceof HTMLInputElement || 
                     activeElement instanceof HTMLTextAreaElement ||
                     activeElement instanceof HTMLSelectElement ||
                     activeElement?.getAttribute('contenteditable') === 'true';
    
    // Ctrl + N: Create new task (works globally in task module)
    if (event.ctrlKey && event.key === 'n' && !isInInput) {
      event.preventDefault();
      event.stopPropagation();
      openCreateModal();
      return;
    }
    
    // Ctrl + S: Save current task (only when modal is open)
    if (event.ctrlKey && event.key === 's' && isModalOpen && onSave) {
      event.preventDefault();
      event.stopPropagation();
      onSave();
      return;
    }
  }, [openCreateModal, onSave, isModalOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [handleGlobalKeyDown]);

  return {
    // Expose functions if needed for manual triggering
    openCreateModal
  };
};