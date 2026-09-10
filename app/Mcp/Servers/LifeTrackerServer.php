<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\Habit\CompleteHabitTool;
use App\Mcp\Tools\Habit\ListHabitsTool;
use App\Mcp\Tools\Health\ListHealthEventsTool;
use App\Mcp\Tools\Health\LogHealthEventTool;
use App\Mcp\Tools\Relationship\CreateContactTool;
use App\Mcp\Tools\Relationship\ListContactsTool;
use App\Mcp\Tools\Relationship\ListUpcomingBirthdaysTool;
use App\Mcp\Tools\Relationship\LogRelationshipEventTool;
use App\Mcp\Tools\Relationship\UpdateContactTool;
use App\Mcp\Tools\Task\CompleteTaskTool;
use App\Mcp\Tools\Task\CreateTaskTool;
use App\Mcp\Tools\Task\ListTasksTool;
use App\Mcp\Tools\Vehicle\ListVehiclesTool;
use App\Mcp\Tools\Vehicle\LogVehicleFillupTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Life Tracker')]
#[Version('0.2.0')]
#[Instructions('Crea y completa tareas (incluyendo tareas recurrentes), hábitos y eventos de salud del usuario autenticado en Life Tracker. También gestiona sus contactos y relaciones -- cumpleaños y eventos importantes -- y el repostaje y rendimiento de sus vehículos. Todas las acciones quedan restringidas a los datos de ese usuario.')]
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
        CreateContactTool::class,
        UpdateContactTool::class,
        ListContactsTool::class,
        LogRelationshipEventTool::class,
        ListUpcomingBirthdaysTool::class,
        LogVehicleFillupTool::class,
        ListVehiclesTool::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
