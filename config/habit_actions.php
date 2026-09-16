<?php

use App\Support\Habits\Actions\CreateTaskAction;
use App\Support\Habits\Actions\LogEnergyEntryAction;
use App\Support\Habits\Actions\LogExerciseAction;
use App\Support\Habits\Actions\LogHealthEventAction;
use App\Support\Habits\Actions\LogMoodEntryAction;
use App\Support\Habits\Actions\LogRelationshipEventAction;
use App\Support\Habits\Actions\LogWaterIntakeAction;

/*
|--------------------------------------------------------------------------
| Acciones al completar un hábito
|--------------------------------------------------------------------------
|
| Cada entrada es una subclase de App\Support\Habits\HabitAction. Aparecen en
| el selector «Módulo relacionado» de los ajustes de hábitos agrupadas por el
| módulo que declaran, y se ejecutan al marcar el hábito como completado.
|
| Para conectar un módulo nuevo basta con crear la clase y añadirla aquí.
|
*/

return [
    'actions' => [
        LogWaterIntakeAction::class,
        LogExerciseAction::class,
        LogMoodEntryAction::class,
        LogEnergyEntryAction::class,
        LogRelationshipEventAction::class,
        CreateTaskAction::class,
        LogHealthEventAction::class,
    ],
];
