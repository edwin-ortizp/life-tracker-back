<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'full_name',
        'avatar_url',
        'life_expectancy_years',
        'current_weight_kg',
        'height_cm',
        'birth_date',
        'activity_level',
        'daily_water_goal',
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'current_weight_kg' => 'decimal:2',
            'height_cm' => 'integer',
            'birth_date' => 'date',
            'daily_water_goal' => 'integer',
        ];
    }

    public function exerciseTypes()
    {
        return $this->hasMany(ExerciseType::class);
    }

    public function drinkTypes()
    {
        return $this->hasMany(DrinkType::class);
    }

    public function moodStates()
    {
        return $this->hasMany(MoodState::class);
    }

    public function habitCompletions()
    {
        return $this->hasMany(HabitCompletion::class);
    }

    public function habitDefinitions()
    {
        return $this->hasMany(HabitDefinition::class);
    }

    public function negativeHabitDefinitions()
    {
        return $this->hasMany(NegativeHabitDefinition::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function goals()
    {
        return $this->hasMany(Goal::class);
    }

    public function moodEntries()
    {
        return $this->hasMany(MoodEntry::class);
    }

    public function energyEntries()
    {
        return $this->hasMany(EnergyEntry::class);
    }

    public function drinkLogs()
    {
        return $this->hasMany(DrinkLog::class);
    }

    public function exerciseLogs()
    {
        return $this->hasMany(ExerciseLog::class);
    }

    public function pomodoroSessions()
    {
        return $this->hasMany(PomodoroSession::class);
    }

    public function journalEntries()
    {
        return $this->hasMany(JournalEntry::class);
    }

    public function integrationTokens()
    {
        return $this->hasMany(IntegrationToken::class);
    }

    public function shoppingItems()
    {
        return $this->hasMany(ShoppingItem::class);
    }

    public function recipes()
    {
        return $this->hasMany(Recipe::class);
    }

    public function mealPlanEntries()
    {
        return $this->hasMany(MealPlanEntry::class);
    }

    public function circles()
    {
        return $this->hasMany(Circle::class);
    }

    public function relationships()
    {
        return $this->hasMany(Relationship::class);
    }

    public function taskAssociations()
    {
        return $this->hasMany(TaskAssociation::class);
    }

    public function healthEvents()
    {
        return $this->hasMany(HealthEvent::class);
    }

    public function healthLogs()
    {
        return $this->hasMany(HealthLog::class);
    }

    public function vehicles()
    {
        return $this->hasMany(Vehicle::class);
    }
}
