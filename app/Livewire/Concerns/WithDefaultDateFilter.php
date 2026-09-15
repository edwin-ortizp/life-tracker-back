<?php

namespace App\Livewire\Concerns;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Livewire\Attributes\Url;

/**
 * Filtro de fecha aplicado por defecto en las tablas de registro diario.
 * La tabla inicia filtrada por el día seleccionado (HasUrlDate) y lo muestra como chip
 * en la franja de filtros aplicados; al quitarlo se listan todos los registros paginados.
 * Las métricas del día no dependen de este filtro.
 */
trait WithDefaultDateFilter
{
    #[Url(as: 'scope', history: true, except: 'day')]
    public string $dateScope = 'day';

    protected function applyDateScope(Builder $query, string $column = 'date'): Builder
    {
        return $this->dateScope === 'all' ? $query : $query->whereDate($column, $this->selectedDate);
    }

    protected function setDateScope(string $scope): void
    {
        $this->dateScope = in_array($scope, ['day', 'all'], true) ? $scope : 'day';
    }

    protected function selectedDayLabel(): string
    {
        $date = Carbon::parse($this->selectedDate);

        return $date->isToday() ? 'Hoy' : ucfirst($date->translatedFormat('j \d\e F \d\e Y'));
    }

    /**
     * @return array<string, string>
     */
    protected function dateScopeOptions(): array
    {
        return ['day' => $this->selectedDayLabel(), 'all' => 'Todas las fechas'];
    }

    /**
     * @return list<array{key: string, value: ?string, label: string, icon: string}>
     */
    protected function dateFilterChips(): array
    {
        if ($this->dateScope === 'all') {
            return [];
        }

        return [['key' => 'date', 'value' => null, 'label' => 'Fecha: '.$this->selectedDayLabel(), 'icon' => 'bi-calendar-event']];
    }
}
