import React, { useState, useRef } from 'react';
import { Mic, Square } from 'lucide-react';
import { transcribeAudio } from '@/utils/ai';

interface JournalVoiceInputProps {
  onTranscription: (text: string) => void;
}

export const JournalVoiceInput: React.FC<JournalVoiceInputProps> = ({ onTranscription }) => {
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      chunksRef.current = [];
      try {
        const text = await transcribeAudio(blob);
        onTranscription(text);
      } catch (e) {
        console.error('Transcription error', e);
      }
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stop = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  return (
    <button
      type="button"
      onClick={recording ? stop : start}
      className="p-2 border rounded-md"
    >
      {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
};

export default JournalVoiceInput;
