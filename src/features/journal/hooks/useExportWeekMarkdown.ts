import { useAuth } from '@/hooks/useAuth';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { startOfWeek } from 'date-fns';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getLocalDateString } from '@/utils/dates';

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export const useExportWeekMarkdown = () => {
  const { user } = useAuth();

  const exportWeek = async (date: Date = new Date()) => {
    if (!user) return;

    const startDate = startOfWeek(date, { weekStartsOn: 1 });

    let content = `# Diario Semana ${format(startDate, 'dd MMMM yyyy', { locale: es })}\n\n`;

    for (let i = 0; i < 7; i++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + i);
      const dateStr = getLocalDateString(current);
      const ref = doc(db, 'journal', `${user.uid}_${dateStr}`);
      const snap = await getDoc(ref);
      const text = snap.exists() ? snap.data().text || '' : '';
      const heading = format(current, "EEEE, d 'de' MMMM", { locale: es });
      content += `### ${capitalize(heading)}\n${text}\n\n`;
    }

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getLocalDateString(startDate)}_semana.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return { exportWeek };
};
