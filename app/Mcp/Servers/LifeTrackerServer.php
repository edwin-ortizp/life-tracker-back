<?php

namespace App\Mcp\Servers;

use App\Mcp\Tools\Context\GetHealthContextTool;
use App\Mcp\Tools\Context\GetPersonContextTool;
use App\Mcp\Tools\Context\GetRecentActivityTool;
use App\Mcp\Tools\Exercise\ListExerciseSessionsTool;
use App\Mcp\Tools\Exercise\LogExerciseTool;
use App\Mcp\Tools\Focus\ListFocusSessionsTool;
use App\Mcp\Tools\Focus\LogFocusSessionTool;
use App\Mcp\Tools\Goal\CreateGoalTool;
use App\Mcp\Tools\Goal\ListGoalsTool;
use App\Mcp\Tools\Goal\LogGoalProgressTool;
use App\Mcp\Tools\Goal\UpdateGoalTool;
use App\Mcp\Tools\Habit\CompleteHabitTool;
use App\Mcp\Tools\Habit\ListHabitsTool;
use App\Mcp\Tools\Health\ListHealthEventsTool;
use App\Mcp\Tools\Health\LogHealthEventTool;
use App\Mcp\Tools\Health\LogHealthFollowUpTool;
use App\Mcp\Tools\Health\MarkHealthRecoveryTool;
use App\Mcp\Tools\Health\UpdateHealthEventTool;
use App\Mcp\Tools\Journal\ListJournalEntriesTool;
use App\Mcp\Tools\Journal\WriteJournalEntryTool;
use App\Mcp\Tools\Meal\CreateRecipeTool;
use App\Mcp\Tools\Meal\ListMealPlanTool;
use App\Mcp\Tools\Meal\ListRecipesTool;
use App\Mcp\Tools\Meal\PlanMealTool;
use App\Mcp\Tools\Mood\ListEnergyEntriesTool;
use App\Mcp\Tools\Mood\ListMoodEntriesTool;
use App\Mcp\Tools\Mood\LogEnergyEntryTool;
use App\Mcp\Tools\Mood\LogMoodEntryTool;
use App\Mcp\Tools\NegativeHabit\ListNegativeHabitsTool;
use App\Mcp\Tools\NegativeHabit\LogNegativeHabitTool;
use App\Mcp\Tools\Plan\CreatePlanTool;
use App\Mcp\Tools\Plan\ListPlansTool;
use App\Mcp\Tools\Plan\ListPlanVisitsTool;
use App\Mcp\Tools\Plan\RecordPlanVisitTool;
use App\Mcp\Tools\Plan\UpdatePlanTool;
use App\Mcp\Tools\Relationship\AddContactAliasTool;
use App\Mcp\Tools\Relationship\AddContactMethodTool;
use App\Mcp\Tools\Relationship\CreateContactTool;
use App\Mcp\Tools\Relationship\ListCirclesTool;
use App\Mcp\Tools\Relationship\ListContactsTool;
use App\Mcp\Tools\Relationship\ListRelationshipEventsTool;
use App\Mcp\Tools\Relationship\ListUpcomingBirthdaysTool;
use App\Mcp\Tools\Relationship\LogRelationshipEventTool;
use App\Mcp\Tools\Relationship\RemoveContactMethodTool;
use App\Mcp\Tools\Relationship\UpdateContactTool;
use App\Mcp\Tools\Shopping\AddShoppingItemTool;
use App\Mcp\Tools\Shopping\ListShoppingItemsTool;
use App\Mcp\Tools\Shopping\RemoveShoppingItemTool;
use App\Mcp\Tools\Shopping\UpdateShoppingItemTool;
use App\Mcp\Tools\Task\CompleteTaskTool;
use App\Mcp\Tools\Task\CreateTaskTool;
use App\Mcp\Tools\Task\GetTaskTool;
use App\Mcp\Tools\Task\LinkTaskTool;
use App\Mcp\Tools\Task\ListTaskCategoriesTool;
use App\Mcp\Tools\Task\ListTasksTool;
use App\Mcp\Tools\Task\ManageTaskCategoryTool;
use App\Mcp\Tools\Task\UpdateTaskTool;
use App\Mcp\Tools\Vehicle\ListVehicleFillupsTool;
use App\Mcp\Tools\Vehicle\ListVehiclesTool;
use App\Mcp\Tools\Vehicle\LogVehicleExpenseTool;
use App\Mcp\Tools\Vehicle\LogVehicleFillupTool;
use App\Mcp\Tools\Water\ListWaterIntakeTool;
use App\Mcp\Tools\Water\LogWaterIntakeTool;
use Laravel\Mcp\Server;
use Laravel\Mcp\Server\Attributes\Instructions;
use Laravel\Mcp\Server\Attributes\Name;
use Laravel\Mcp\Server\Attributes\Version;

#[Name('Life Tracker')]
#[Version('0.8.0')]
#[Instructions(<<<'TXT'
Life Tracker es la fuente de verdad de la vida personal del usuario: personas y relaciones, planes y lugares, salud, ánimo, energía, ejercicio, hidratación, hábitos (positivos y negativos), metas, diario, comidas y recetas, tiempo de foco, tareas, compras y vehículos. Úsalo como contexto para responder con su historia real, no solo cuando pida registrar o consultar algo. Todo queda restringido a los datos del usuario autenticado.

## Cuándo consultar
Consulta si un dato de Life Tracker cambiaría tu respuesta. Señales:
- Menciona a una persona por nombre, apodo o alias, un lugar o plan, un vehículo o un proyecto o categoría de trabajo.
- Habla de su cuerpo o su salud en primera persona, o de cómo se ha sentido (ánimo, energía, estrés).
- Pide planear o recomendar algo donde su historial importa (salidas, regalos, rutinas).
- Usa lenguaje de continuidad: "otra vez", "de nuevo", "la última vez", "¿cómo voy con…?", "¿qué tengo pendiente?".
No consultes para preguntas generales que no dependen de su vida, si el dato ya está en la conversación, o si solo adornaría la respuesta. Si solo se está desahogando, primero escucha.

## Qué herramienta usar
- Una persona → get-person-context-tool (ficha, visitas, planes pendientes, eventos, ánimo y tareas en una llamada).
- Un síntoma, dolor, cita o examen → get-health-context-tool con palabras clave en "search" y la zona del cuerpo si aplica.
- "¿Cómo me fue?", resumen del día o la semana → get-recent-activity-tool.
- Recomendar planes → list-plans-tool (círculo, persona, ciudad, not_visited) + list-plan-visits-tool para no repetir lo reciente.
- Trabajo y pendientes → list-tasks-tool por categoría o con updated_since; get-task-tool solo para la tarea en foco.
- Metas, propósitos o progreso → list-goals-tool (con goal_id o title para el detalle).
- Comida, qué cocinar o el mercado de la semana → list-meal-plan-tool y list-recipes-tool.
- Algo que intenta dejar o una recaída → list-negative-habits-tool, sin juzgar.
- Productividad u horas de foco → list-focus-sessions-tool.
- Ánimo, energía, ejercicio, agua, hábitos, vehículos → sus list-*-tool, con fechas acotadas.
- El diario (list-journal-entries-tool) es lo más íntimo: léelo solo si la conversación lo pide o se trata de cómo ha estado; empieza por los resúmenes.

## Profundidad
1. Un dato concreto: una llamada filtrada.
2. Una persona, problema o plan: la herramienta de contexto en depth=brief (1-3 llamadas).
3. Una decisión que cruza módulos: hasta 4-6 llamadas.
Amplía solo si queda una pregunta abierta que otro módulo responde, y detente cuando más datos ya no cambiarían la respuesta. Prefiere filtros (fechas, persona, tipo, búsqueda) a traer todo; usa depth=full solo si brief no alcanza.

## Personas
Los nombres se resuelven primero por alias o apodo exacto, luego por inicio de palabra y por último por coincidencia parcial. Si hay varios candidatos, reintenta con el contact_id que trae el error en lugar de preguntar, salvo que de verdad sea ambiguo.

## Privacidad y tono
Los eventos de salud y de personas marcados como sensibles se omiten por defecto; pide include_sensitive=true solo cuando el tema actual los necesite y no los menciones fuera de ese contexto. Integra en la respuesta solo lo que cambia la conclusión, sin enumerar lo que consultaste. Si un dato parece desactualizado (un malestar abierto hace semanas, un plan con fecha vencida), pregúntalo en una línea en lugar de asumirlo.

## Al escribir
Antes de crear un contacto, plan, tarea, meta, receta o evento, busca si ya existe para no duplicarlo. Escribe en el diario solo cuando el usuario lo pida y con sus palabras. Si el usuario no pidió registrar algo de forma explícita, confirma en una línea lo que vas a guardar. Vincula con link-task-tool las tareas que nacen de una persona o de un evento de salud.
TXT)]
class LifeTrackerServer extends Server
{
    protected array $tools = [
        CreateTaskTool::class,
        CompleteTaskTool::class,
        ListTasksTool::class,
        GetTaskTool::class,
        UpdateTaskTool::class,
        ListTaskCategoriesTool::class,
        LinkTaskTool::class,
        ManageTaskCategoryTool::class,
        CompleteHabitTool::class,
        ListHabitsTool::class,
        LogHealthEventTool::class,
        ListHealthEventsTool::class,
        LogHealthFollowUpTool::class,
        MarkHealthRecoveryTool::class,
        UpdateHealthEventTool::class,
        GetHealthContextTool::class,
        CreateContactTool::class,
        UpdateContactTool::class,
        ListContactsTool::class,
        LogRelationshipEventTool::class,
        ListRelationshipEventsTool::class,
        GetPersonContextTool::class,
        ListUpcomingBirthdaysTool::class,
        AddContactAliasTool::class,
        AddContactMethodTool::class,
        RemoveContactMethodTool::class,
        ListCirclesTool::class,
        CreatePlanTool::class,
        UpdatePlanTool::class,
        ListPlansTool::class,
        RecordPlanVisitTool::class,
        ListPlanVisitsTool::class,
        LogVehicleFillupTool::class,
        ListVehiclesTool::class,
        ListVehicleFillupsTool::class,
        LogVehicleExpenseTool::class,
        AddShoppingItemTool::class,
        UpdateShoppingItemTool::class,
        RemoveShoppingItemTool::class,
        ListShoppingItemsTool::class,
        LogMoodEntryTool::class,
        LogEnergyEntryTool::class,
        ListMoodEntriesTool::class,
        ListEnergyEntriesTool::class,
        LogExerciseTool::class,
        ListExerciseSessionsTool::class,
        LogWaterIntakeTool::class,
        ListWaterIntakeTool::class,
        GetRecentActivityTool::class,
        ListGoalsTool::class,
        CreateGoalTool::class,
        UpdateGoalTool::class,
        LogGoalProgressTool::class,
        ListJournalEntriesTool::class,
        WriteJournalEntryTool::class,
        ListMealPlanTool::class,
        PlanMealTool::class,
        ListRecipesTool::class,
        CreateRecipeTool::class,
        ListNegativeHabitsTool::class,
        LogNegativeHabitTool::class,
        ListFocusSessionsTool::class,
        LogFocusSessionTool::class,
    ];

    protected array $resources = [
        //
    ];

    protected array $prompts = [
        //
    ];
}
