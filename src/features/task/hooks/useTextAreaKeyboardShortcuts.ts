import { useCallback } from 'react';

interface UseTextAreaKeyboardShortcutsProps {
  textAreaRef: React.RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (value: string) => void;
}

export const useTextAreaKeyboardShortcuts = ({ textAreaRef, value, onChange }: UseTextAreaKeyboardShortcutsProps) => {
  
  const moveLineUp = useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const lines = value.split('\n');
    
    // Find current line
    let currentPos = 0;
    let currentLineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length + 1 > selectionStart) {
        currentLineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1;
    }
    
    // Can't move up if already at first line
    if (currentLineIndex === 0) return;
    
    // Swap lines
    const temp = lines[currentLineIndex];
    lines[currentLineIndex] = lines[currentLineIndex - 1];
    lines[currentLineIndex - 1] = temp;
    
    const newValue = lines.join('\n');
    onChange(newValue);
    
    // Restore cursor position (move up one line)
    setTimeout(() => {
      const prevLineLength = lines[currentLineIndex - 1].length;
      const cursorOffset = selectionStart - currentPos;
      const newStartPos = currentPos - prevLineLength - 1 + cursorOffset;
      const newEndPos = selectionEnd - currentPos + newStartPos;
      
      textarea.setSelectionRange(Math.max(0, newStartPos), Math.max(0, newEndPos));
      textarea.focus();
    }, 0);
  }, [textAreaRef, value, onChange]);

  const moveLineDown = useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const lines = value.split('\n');
    
    // Find current line
    let currentPos = 0;
    let currentLineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length + 1 > selectionStart) {
        currentLineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1;
    }
    
    // Can't move down if already at last line
    if (currentLineIndex === lines.length - 1) return;
    
    // Swap lines
    const temp = lines[currentLineIndex];
    lines[currentLineIndex] = lines[currentLineIndex + 1];
    lines[currentLineIndex + 1] = temp;
    
    const newValue = lines.join('\n');
    onChange(newValue);
    
    // Restore cursor position (move down one line)
    setTimeout(() => {
      const nextLineLength = lines[currentLineIndex + 1].length;
      const cursorOffset = selectionStart - currentPos;
      const newStartPos = currentPos + nextLineLength + 1 + cursorOffset;
      const newEndPos = selectionEnd - currentPos + newStartPos;
      
      textarea.setSelectionRange(newStartPos, newEndPos);
      textarea.focus();
    }, 0);
  }, [textAreaRef, value, onChange]);

  const toggleCheckboxLine = useCallback(() => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;
    const lines = value.split('\n');
    
    // Find current line
    let currentPos = 0;
    let currentLineIndex = 0;
    
    for (let i = 0; i < lines.length; i++) {
      if (currentPos + lines[i].length + 1 > selectionStart) {
        currentLineIndex = i;
        break;
      }
      currentPos += lines[i].length + 1;
    }
    
    const currentLine = lines[currentLineIndex];
    let newLine = currentLine;
    
    // Check if line has unchecked checkbox
    if (currentLine.match(/^\s*-\s*\[\s*\]\s*/)) {
      // Change to checked
      newLine = currentLine.replace(/^\s*-\s*\[\s*\]\s*/, '- [x] ');
    }
    // Check if line has checked checkbox  
    else if (currentLine.match(/^\s*-\s*\[x\]\s*/i)) {
      // Change to unchecked
      newLine = currentLine.replace(/^\s*-\s*\[x\]\s*/i, '- [ ] ');
    }
    // No checkbox, add unchecked checkbox
    else {
      // Add to beginning of line, preserving leading whitespace
      const leadingWhitespace = currentLine.match(/^\s*/)?.[0] || '';
      const restOfLine = currentLine.slice(leadingWhitespace.length);
      newLine = leadingWhitespace + '- [ ] ' + restOfLine;
    }
    
    lines[currentLineIndex] = newLine;
    const newValue = lines.join('\n');
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      const lengthDiff = newLine.length - currentLine.length;
      const newSelectionStart = selectionStart + (selectionStart > currentPos ? lengthDiff : 0);
      const newSelectionEnd = selectionEnd + lengthDiff;
      
      textarea.setSelectionRange(newSelectionStart, newSelectionEnd);
      textarea.focus();
    }, 0);
  }, [textAreaRef, value, onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Alt + Arrow Up: Move line up
    if (event.altKey && event.key === 'ArrowUp') {
      event.preventDefault();
      moveLineUp();
      return;
    }
    
    // Alt + Arrow Down: Move line down
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      moveLineDown();
      return;
    }
    
    // Ctrl + L: Toggle checkbox
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      toggleCheckboxLine();
      return;
    }
  }, [moveLineUp, moveLineDown, toggleCheckboxLine]);

  return {
    handleKeyDown,
    moveLineUp,
    moveLineDown,
    toggleCheckboxLine
  };
};