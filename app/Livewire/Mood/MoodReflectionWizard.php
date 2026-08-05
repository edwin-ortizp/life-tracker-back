<?php

namespace App\Livewire\Mood;

use App\Models\MoodEntry;
use App\Models\MoodReflection;
use App\Support\ReflectionSteps;
use Livewire\Component;

/**
 * A voluntary, resumable thought record. Every question is fixed in code, every answer
 * is optional, and the wizard never interprets, classifies or concludes anything.
 */
class MoodReflectionWizard extends Component
{
    public string $entryId;

    public string $step = ReflectionSteps::SITUATION;

    public string $answer = '';

    public ?int $scaleAnswer = null;

    public bool $showSummary = false;

    public bool $showScope = false;

    public function mount(string $entryId): void
    {
        $entry = MoodEntry::with('reflection')->findOrFail($entryId);
        $this->entryId = $entry->id;

        $reflection = $this->reflection();

        if ($reflection->isCompleted()) {
            $this->showSummary = true;
            $this->step = ReflectionSteps::last();

            return;
        }

        // Resume where the draft was left, or start at the beginning.
        $this->step = ReflectionSteps::exists($reflection->current_step)
            ? $reflection->current_step
            : ReflectionSteps::first();

        $this->loadAnswer();
    }

    public function continue(): void
    {
        $this->persistAnswer();
        $this->advance();
    }

    /** Skipping stores nothing for this step and moves on exactly like Continuar. */
    public function skip(): void
    {
        $this->advance();
    }

    public function back(): void
    {
        $previous = ReflectionSteps::previous($this->step);

        if (! $previous) {
            return;
        }

        $this->persistAnswer();
        $this->step = $previous;
        $this->reflection()->update(['current_step' => $this->step]);
        $this->loadAnswer();
    }

    public function finishForNow(): void
    {
        $this->persistAnswer();
        $this->reflection()->update(['status' => MoodReflection::STATUS_DRAFT, 'current_step' => $this->step]);
        $this->dispatch('reflection-closed');
    }

    public function complete(): void
    {
        $this->persistAnswer();

        $this->reflection()->update([
            'status' => MoodReflection::STATUS_COMPLETED,
            'current_step' => null,
            'completed_at' => now(),
        ]);

        $this->showSummary = true;
    }

    public function reopen(): void
    {
        $this->reflection()->update([
            'status' => MoodReflection::STATUS_DRAFT,
            'completed_at' => null,
            'current_step' => ReflectionSteps::first(),
        ]);

        $this->showSummary = false;
        $this->step = ReflectionSteps::first();
        $this->loadAnswer();
    }

    /** Restarting clears only the reflection; the entry and its context stay. */
    public function restart(): void
    {
        $this->reflection()->delete();

        $this->showSummary = false;
        $this->step = ReflectionSteps::first();
        $this->answer = '';
        $this->scaleAnswer = null;
        $this->loadAnswer();
    }

    public function close(): void
    {
        $this->dispatch('reflection-closed');
    }

    public function toggleScope(): void
    {
        $this->showScope = ! $this->showScope;
    }

    public function setScaleAnswer(int $value): void
    {
        $this->scaleAnswer = $this->scaleAnswer === $value ? null : $value;
    }

    public function render()
    {
        $reflection = $this->reflection();

        return view('livewire.mood.mood-reflection-wizard', [
            'entry' => $reflection->moodEntry,
            'reflection' => $reflection,
            'definition' => ReflectionSteps::get($this->step),
            'position' => ReflectionSteps::position($this->step),
            'total' => ReflectionSteps::total(),
            'isLastStep' => ReflectionSteps::isLast($this->step),
            'answers' => $reflection->answeredSteps(),
        ]);
    }

    /** The reflection for this entry, created on first use. */
    private function reflection(): MoodReflection
    {
        $entry = MoodEntry::findOrFail($this->entryId);

        return MoodReflection::firstOrCreate(
            ['mood_entry_id' => $entry->id],
            ['user_id' => $entry->user_id, 'current_step' => ReflectionSteps::first()],
        );
    }

    private function advance(): void
    {
        $next = ReflectionSteps::next($this->step);

        if (! $next) {
            $this->complete();

            return;
        }

        $this->step = $next;
        $this->reflection()->update(['current_step' => $this->step]);
        $this->loadAnswer();
    }

    private function loadAnswer(): void
    {
        $definition = ReflectionSteps::get($this->step);
        $reflection = $this->reflection();

        $value = $definition['on'] === 'entry'
            ? $reflection->moodEntry?->{$definition['field']}
            : $reflection->{$definition['field']};

        if ($definition['type'] === 'scale') {
            $this->scaleAnswer = $value === null ? null : (int) $value;
            $this->answer = '';

            return;
        }

        $this->answer = (string) ($value ?? '');
        $this->scaleAnswer = null;
    }

    /** Autosave: each move stores the current field and the step to resume from. */
    private function persistAnswer(): void
    {
        $definition = ReflectionSteps::get($this->step);
        $reflection = $this->reflection();

        if ($definition['type'] === 'scale') {
            $value = $this->scaleAnswer !== null && $this->scaleAnswer >= 1 && $this->scaleAnswer <= 5
                ? $this->scaleAnswer
                : null;
        } else {
            $value = trim($this->answer) ?: null;

            if ($value !== null) {
                $value = mb_substr($value, 0, 5000);
            }
        }

        if ($definition['on'] === 'entry') {
            $reflection->moodEntry?->update([$definition['field'] => $value]);

            return;
        }

        $reflection->update([$definition['field'] => $value]);
    }
}
