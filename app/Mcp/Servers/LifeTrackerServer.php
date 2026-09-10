<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\Exercise\LogExerciseTool;
use App\Mcp\Tools\Habit\CompleteHabitTool;
use App\Mcp\Tools\Habit\ListHabitsTool;
use App\Mcp\Tools\Health\ListHealthEventsTool;
use App\Mcp\Tools\Health\LogHealthEventTool;
use App\Mcp\Tools\Health\LogHealthFollowUpTool;
use App\Mcp\Tools\Health\MarkHealthRecoveryTool;
use App\Mcp\Tools\Mood\LogEnergyEntryTool;
use App\Mcp\Tools\Mood\LogMoodEntryTool;
use App\Mcp\Tools\Relationship\AddContactAliasTool;
use App\Mcp\Tools\Relationship\CreateContactTool;
use App\Mcp\Tools\Relationship\ListContactsTool;
use App\Mcp\Tools\Relationship\ListUpcomingBirthdaysTool;
use App\Mcp\Tools\Relationship\LogRelationshipEventTool;
use App\Mcp\Tools\Relationship\UpdateContactTool;
use App\Mcp\Tools\Shopping\AddShoppingItemTool;
use App\Mcp\Tools\Shopping\ListShoppingItemsTool;
use App\Mcp\Tools\Shopping\RemoveShoppingItemTool;
use App\Mcp\Tools\Shopping\UpdateShoppingItemTool;
use App\Mcp\Tools\Task\CompleteTaskTool;
use App\Mcp\Tools\Task\CreateTaskTool;
use App\Mcp\Tools\Task\ListTasksTool;
use App\Mcp\Tools\Vehicle\ListVehiclesTool;
use App\Mcp\Tools\Vehicle\LogVehicleFillupTool;
use App\Mcp\Tools\Water\LogWaterIntakeTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Life Tracker')]
#[Version('0.3.0')]
#[Instructions('Crea y completa tareas (incluyendo tareas recurrentes), hábitos y eventos de salud del usuario autenticado en Life Tracker, incluyendo seguimiento de evolución y recuperación. También gestiona sus contactos y relaciones -- cumpleaños, alias y eventos importantes --, la lista de compras, su ánimo y energía, el ejercicio, la hidratación, y el repostaje y rendimiento de sus vehículos. Todas las acciones quedan restringidas a los datos de ese usuario.')]
class LifeTrackerServer extends Server
{
    protected array $tools = [
        CreateTaskTool::class,
        CompleteTaskTool::class,
        ListTasksTool::class,
        CompleteHabitTool::class,
        ListHabitsTool::class,
        LogHealthEventTool::class,
        ListHealthEventsTool::class,
        LogHealthFollowUpTool::class,
        MarkHealthRecoveryTool::class,
        CreateContactTool::class,
        UpdateContactTool::class,
        ListContactsTool::class,
        LogRelationshipEventTool::class,
        ListUpcomingBirthdaysTool::class,
        AddContactAliasTool::class,
        LogVehicleFillupTool::class,
        ListVehiclesTool::class,
        AddShoppingItemTool::class,
        UpdateShoppingItemTool::class,
        RemoveShoppingItemTool::class,
        ListShoppingItemsTool::class,
        LogMoodEntryTool::class,
        LogEnergyEntryTool::class,
        LogExerciseTool::class,
        LogWaterIntakeTool::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
