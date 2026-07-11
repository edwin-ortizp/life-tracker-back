import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, BookOpen, CheckSquare, Droplet, Dumbbell, RefreshCw, Smile } from 'lucide-react';
import { paths } from '@/core/routes/paths';
import PageLayout from '@/shared/components/PageLayout';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { MoodChart } from '@/modules/statistics/components/MoodChart';
import { useStatisticsController } from '@/modules/statistics/controllers/useStatisticsController';

const formatNumber = (value: number) => new Intl.NumberFormat('es-ES').format(value);

const StatisticsPage: React.FC = () => {
  const { data, status, error, reload } = useStatisticsController();

  return (
    <PageLayout>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Estadisticas</h1>
          <p className="text-sm text-muted-foreground">Resumen de los ultimos 7 dias (incluyendo hoy).</p>
        </div>
        <Button onClick={reload} variant="outline" disabled={status === 'loading'}>
          <RefreshCw className={`mr-2 h-4 w-4 ${status === 'loading' ? 'animate-spin' : ''}`} />
          Recargar
        </Button>
      </div>

      {status === 'error' && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6 text-sm text-red-700">
            {error || 'Error cargando estadisticas'}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Droplet className="h-4 w-4" /> Agua (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumber(data.summary.waterMl)} ml</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Ejercicio (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{formatNumber(data.summary.exerciseCalories)} kcal</p>
            <p className="text-sm text-muted-foreground">{data.summary.exerciseCount} sesiones</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Smile className="h-4 w-4" /> Estado de animo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.summary.moodAverage.toFixed(1)} / 10</p>
            <p className="text-sm text-muted-foreground">{data.summary.moodEntries} registros en 7 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Diario (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.summary.journalEntries}</p>
            <p className="text-sm text-muted-foreground">entradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Habitos (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.summary.habitWeeklyCompletionPct.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">
              {data.summary.habitWeeklyCompleted}/{data.summary.habitWeeklyTotal} completados
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Activity className="h-4 w-4" /> Tendencia de animo (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {data.moodTrend.length > 0 ? (
            <MoodChart data={data.moodTrend.map((point) => ({ label: point.label, value: point.value }))} className="h-36" />
          ) : (
            <p className="text-sm text-muted-foreground">No hay datos suficientes para graficar.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Accesos rapidos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Button asChild variant="outline"><Link to={paths.water.view('weekly')}>Ver hidratacion</Link></Button>
          <Button asChild variant="outline"><Link to={paths.exercise.view('calendar')}>Ver ejercicio</Link></Button>
          <Button asChild variant="outline"><Link to={paths.mood.view('tracker')}>Ver estado de animo</Link></Button>
          <Button asChild variant="outline"><Link to={paths.journal.view('entries')}>Ver diario</Link></Button>
        </CardContent>
      </Card>
    </PageLayout>
  );
};

export default StatisticsPage;
