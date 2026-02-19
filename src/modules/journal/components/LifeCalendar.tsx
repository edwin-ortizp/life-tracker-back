import { useMemo, useState } from 'react';
import { startOfWeek } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useUserSettings } from '@/shared/hooks/useUserSettings';
import { useJournalWeeks } from '../controllers/useJournalWeeks.supabase';
import { getStartOfIsoWeek } from '@/shared/utils/isoWeek';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { useAuth } from '@/shared/hooks/useAuth';
import { JournalService } from '@/modules/journal/services';

const WEEKS_PER_YEAR = 53;
const CELL_SIZE = 14;
const CELL_GAP = 2;

export const LifeCalendar = () => {
  const navigate = useNavigate();
  const { settings } = useUserSettings();
  const { user } = useAuth();
  const [isRecalculating, setIsRecalculating] = useState(false);
  const birthDate = settings?.birthDate ? new Date(`${settings.birthDate}T00:00:00`) : null;
  const lifeExpectancyYears = settings?.lifeExpectancyYears ?? null;

  const startYear = useMemo(() => {
    if (!birthDate) return null;
    return birthDate.getFullYear();
  }, [birthDate]);

  const endYear = useMemo(() => {
    if (!birthDate || !lifeExpectancyYears || lifeExpectancyYears <= 0) return null;
    return birthDate.getFullYear() + lifeExpectancyYears - 1;
  }, [birthDate, lifeExpectancyYears]);

  const { entriesByWeek } = useJournalWeeks(startYear, endYear);

  const currentIsoYear = getISOWeekYear(new Date());
  const currentIsoWeek = getISOWeek(new Date());

  const handleRecalculateSummary = async () => {
    if (!user) return;
    setIsRecalculating(true);
    try {
      const { data, error: fetchError } = await JournalService.getEntryDates(user.id);

      if (fetchError) throw fetchError;

      const counts = new Map<string, number>();
      (data || []).forEach((row) => {
        if (!row.date) return;
        const entryDate = new Date(`${row.date}T00:00:00`);
        const isoYear = getISOWeekYear(entryDate);
        const isoWeek = getISOWeek(entryDate);
        const key = `${isoYear}-W${String(isoWeek).padStart(2, '0')}`;
        counts.set(key, (counts.get(key) || 0) + 1);
      });

      await JournalService.deleteWeeklySummary(user.id);

      const rows = Array.from(counts.entries()).map(([key, entries_count]) => {
        const [yearPart, weekPart] = key.split('-W');
        return {
          user_id: user.id,
          year: Number(yearPart),
          week: Number(weekPart),
          entries_count
        };
      });

      if (rows.length > 0) {
        const { error: upsertError } = await JournalService.upsertWeeklySummary(rows);
        if (upsertError) throw upsertError;
      }
    } finally {
      setIsRecalculating(false);
    }
  };

  const gridStyle = useMemo(() => {
    const minWidth = WEEKS_PER_YEAR * CELL_SIZE + (WEEKS_PER_YEAR - 1) * CELL_GAP;
    return {
      gridTemplateColumns: `repeat(${WEEKS_PER_YEAR}, ${CELL_SIZE}px)`,
      columnGap: `${CELL_GAP}px`,
      rowGap: `${CELL_GAP}px`,
      minWidth: `${minWidth}px`
    };
  }, []);

  const compactCellStyle = useMemo(
    () => ({
      width: CELL_SIZE,
      height: CELL_SIZE,
      minWidth: CELL_SIZE,
      minHeight: CELL_SIZE,
      maxWidth: CELL_SIZE,
      maxHeight: CELL_SIZE,
      padding: 0,
      lineHeight: 0
    }),
    []
  );

  if (!birthDate || !lifeExpectancyYears) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No se puede graficar: falta fecha de nacimiento o expectativa de vida en el perfil.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex justify-center">
      <div className="w-full max-w-fit">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Cada cuadro representa una semana. Filas: años de vida. Columnas: semanas del año.
        </div>
        <button
          className="text-xs px-3 py-1.5 rounded-md border border-muted-foreground/40 hover:bg-muted/20 transition"
          onClick={handleRecalculateSummary}
          disabled={isRecalculating}
        >
          {isRecalculating ? 'Recalculando...' : 'Recalcular resumen'}
        </button>
      </div>
      <div
        className="w-full overflow-x-auto overflow-y-visible scroll-container"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="space-y-2 min-w-max">
          <div className="flex items-center gap-2 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-1">
            <div className="w-12 text-[10px] text-muted-foreground text-right">Año</div>
            <div className="grid" style={gridStyle}>
              {Array.from({ length: WEEKS_PER_YEAR }, (_, colIndex) => (
                <div
                  key={`week-${colIndex + 1}`}
                  className="text-[8px] text-muted-foreground text-center"
                >
                  {colIndex + 1}
                </div>
              ))}
            </div>
            <div className="w-8 text-[10px] text-muted-foreground">Edad</div>
          </div>
          {Array.from({ length: lifeExpectancyYears }, (_, rowIndex) => {
            const year = (startYear ?? 0) + rowIndex;
            const ageLabel = rowIndex;
            return (
              <div key={year} className="flex items-center gap-2">
                <div className="w-12 text-[10px] text-muted-foreground text-right">
                  {year}
                </div>
                <div className="grid p-0.5" style={gridStyle}>
                  {Array.from({ length: WEEKS_PER_YEAR }, (_, colIndex) => {
                    const week = colIndex + 1;
                    const key = `${year}-W${String(week).padStart(2, '0')}`;
                    const weekStart = getStartOfIsoWeek(year, week);
                    const isBeforeBirth = birthDate ? weekStart < startOfWeek(birthDate, { weekStartsOn: 1 }) && year === birthDate.getFullYear() : false;
                    const isFuture = startOfWeek(weekStart, { weekStartsOn: 1 }) > startOfWeek(new Date(), { weekStartsOn: 1 });
                    const entriesCount = entriesByWeek.get(key) || 0;
                    const hasEntry = entriesCount > 0;
                    const isCurrent = year === currentIsoYear && week === currentIsoWeek;

                    const baseClasses = 'border';
                    const stateClasses = isBeforeBirth || isFuture
                      ? 'bg-transparent border-slate-500/40'
                      : hasEntry
                      ? 'bg-emerald-500/90 border-emerald-300/90'
                      : 'bg-slate-900/30 border-slate-500/60';
                    const highlightClasses = isCurrent ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900' : '';

                    return (
                      <button
                        key={`${year}-${week}`}
                        className={`${baseClasses} ${stateClasses} ${highlightClasses}`}
                        style={compactCellStyle}
                        onClick={() => navigate(`/journal/view/entries?week=${key}`)}
                        title={`${key} · ${weekStart.toLocaleDateString('es-ES')} - ${new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES')}`}
                        aria-label={`Semana ${key}`}
                      />
                    );
                  })}
                </div>
                <div className="w-8 text-[10px] text-muted-foreground">
                  {ageLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};

export default LifeCalendar;
