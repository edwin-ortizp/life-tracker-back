<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\MorphToMany;

class HealthEvent extends Model
{
    use BelongsToUser, HasUuids;

    public const TYPES = [
        'appointment' => 'Cita médica',
        'checkup' => 'Chequeo o examen',
        'procedure' => 'Procedimiento o cirugía',
        'symptom' => 'Síntoma',
        'illness' => 'Enfermedad',
        'vaccination' => 'Vacuna',
    ];

    public const SCHEDULED_TYPES = ['appointment', 'checkup', 'procedure'];

    public const BODY_AREAS = [
        'head' => 'Cabeza',
        'eyes_face' => 'Ojos y cara',
        'mouth_throat' => 'Boca y garganta',
        'neck' => 'Cuello',
        'chest' => 'Pecho',
        'abdomen' => 'Abdomen',
        'back' => 'Espalda',
        'shoulders' => 'Hombros',
        'arms' => 'Brazos',
        'hands' => 'Manos y muñecas',
        'hips_pelvis' => 'Cadera y pelvis',
        'legs' => 'Piernas',
        'knees' => 'Rodillas',
        'feet_ankles' => 'Pies y tobillos',
        'skin' => 'Piel',
        'whole_body' => 'Todo el cuerpo',
        'other' => 'Otra zona',
    ];

    public const COMMON_ILLNESSES = [
        'common_cold' => 'Resfriado común',
        'flu' => 'Gripe',
        'covid_19' => 'COVID-19',
        'allergy' => 'Alergia',
        'migraine' => 'Migraña',
        'gastroenteritis' => 'Gastroenteritis',
        'food_poisoning' => 'Intoxicación alimentaria',
        'urinary_infection' => 'Infección urinaria',
        'other' => 'Otra enfermedad',
    ];

    protected $fillable = ['type', 'title', 'event_date', 'end_date', 'notes', 'details'];

    protected function casts(): array
    {
        return ['event_date' => 'date', 'end_date' => 'date', 'details' => 'array'];
    }

    protected static function booted(): void
    {
        static::deleting(fn (self $event) => $event->taskAssociations()->delete());
    }

    public function taskAssociations(): MorphMany
    {
        return $this->morphMany(TaskAssociation::class, 'target');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(HealthLog::class)->orderBy('date');
    }

    public function tasks(): MorphToMany
    {
        return $this->morphToMany(Task::class, 'target', 'task_associations', 'target_id', 'task_id')
            ->withTimestamps();
    }

    public function scheduledTask(): ?Task
    {
        return $this->tasks()->orderBy('tasks.created_at')->first();
    }

    public static function bodyAreaLabel(?string $area, ?string $customArea = null): ?string
    {
        return $area === 'other' ? ($customArea ?: self::BODY_AREAS['other']) : (self::BODY_AREAS[$area] ?? $area);
    }

    public static function illnessLabel(?string $condition, ?string $customCondition = null): ?string
    {
        return $condition === 'other' ? ($customCondition ?: self::COMMON_ILLNESSES['other']) : (self::COMMON_ILLNESSES[$condition] ?? $condition);
    }
}
