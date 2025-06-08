import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLocalDateString } from '@/utils/dates';
import type { DailyMood } from '@/features/mood/types';
import type { Task } from '@/features/task/types';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const useExportMarkdownRange = () => {
  const { user } = useAuth();

  const exportRange = async (startDate: Date, endDate: Date) => {
    if (!user) return;

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    let content = `# Diario del ${format(start, 'dd MMMM yyyy', { locale: es })} al ${format(end, 'dd MMMM yyyy', { locale: es })}\n\n`;

    for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
      const dateStr = getLocalDateString(current);

      const journalRef = doc(db, 'journal', `${user.uid}_${dateStr}`);
      const journalSnap = await getDoc(journalRef);
      const journalText = journalSnap.exists() ? journalSnap.data().text || '' : '';

      const moodRef = doc(db, 'moods', `${user.uid}_${dateStr}`);
      const moodSnap = await getDoc(moodRef);
      const moodData = moodSnap.exists() ? (moodSnap.data() as DailyMood) : null;

      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid),
        where('completed', '==', true)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const completedTasks = tasksSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Task))
        .filter(task => {
          if (!task.createdAt?.seconds) return false;
          const taskDate = new Date(task.createdAt.seconds * 1000);
          return getLocalDateString(taskDate) === dateStr;
        });

      const heading = format(current, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
      content += `### ${capitalize(heading)}\n\n`;

      if (moodData?.moods && moodData.moods.length > 0) {
        content += `**Estados de ánimo:**\n`;
        moodData.moods.forEach(mood => {
          content += `- ${mood.time}: ${mood.emoji} ${mood.text}\n`;
        });
        content += `\n`;
      }

      if (completedTasks.length > 0) {
        content += `**Tareas completadas:**\n`;
        completedTasks.forEach(task => {
          content += `- ✅ ${task.title}${task.description ? ` - ${task.description}` : ''}\n`;
        });
        content += `\n`;
      }

      if (journalText.trim()) {
        content += `**Diario:**\n${journalText}\n\n`;
      } else if (!moodData?.moods?.length && !completedTasks.length) {
        content += `_Sin entradas para este día_\n\n`;
      }
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getLocalDateString(start)}_a_${getLocalDateString(end)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { exportRange };
};
