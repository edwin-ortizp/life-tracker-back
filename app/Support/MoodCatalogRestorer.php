<?php

namespace App\Support;

use App\Models\MoodState;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

/**
 * The single meaning of "complete this catalog", shared by account registration, the
 * corrective migration and the manual Restaurar action. It only ever adds or reactivates:
 * visible fields the user edited and custom emotions are never touched.
 */
class MoodCatalogRestorer
{
    /**
     * @param  bool  $reactivate  Restaurar also brings back defaults the user turned off;
     *                            plain initialization respects that decision.
     * @return array{created: int, reactivated: int}
     */
    public function syncDefaults(User $user, bool $reactivate = false): array
    {
        $this->adoptRecognizableDefaults($user);

        $known = $this->states($user)->pluck('default_key')->filter()->all();
        $created = 0;

        foreach (DefaultMoodStates::all() as $definition) {
            if (in_array($definition['key'], $known, true)) {
                continue;
            }

            $this->create($user, $definition);
            $created++;
        }

        $reactivated = $reactivate ? $this->reactivateDefaults($user) : 0;

        return ['created' => $created, 'reactivated' => $reactivated];
    }

    /**
     * Claim the defaults an account already has. `(user_id, text)` is unique, so a text
     * match is unambiguous; anything else stays custom rather than being guessed at.
     */
    private function adoptRecognizableDefaults(User $user): void
    {
        $taken = $this->states($user)->pluck('default_key')->filter()->all();
        $unkeyed = $this->states($user)->whereNull('default_key')->keyBy('text');

        foreach (DefaultMoodStates::all() as $definition) {
            if (in_array($definition['key'], $taken, true)) {
                continue;
            }

            $match = $unkeyed->get($definition['text']);

            if (! $match) {
                continue;
            }

            $this->query($user)->whereKey($match->id)->update(['default_key' => $definition['key']]);
            $taken[] = $definition['key'];
        }
    }

    private function reactivateDefaults(User $user): int
    {
        return $this->query($user)
            ->whereNotNull('default_key')
            ->where('is_active', false)
            ->update(['is_active' => true]);
    }

    /** @param  array<string, mixed>  $definition */
    private function create(User $user, array $definition): void
    {
        $this->query($user)->create([
            'user_id' => $user->id,
            'default_key' => $definition['key'],
            'emoji' => $definition['emoji'],
            'text' => $definition['text'],
            'value' => $definition['value'],
            'category' => $definition['category'],
            'is_active' => true,
            'is_pinned' => false,
            'sort_order' => 0,
        ]);
    }

    /** @return Collection<int, MoodState> */
    private function states(User $user): Collection
    {
        return $this->query($user)->get(['id', 'text', 'default_key']);
    }

    /** Runs outside the auth scope so migrations can repair every account. */
    private function query(User $user)
    {
        return MoodState::withoutGlobalScopes()->where('user_id', $user->id);
    }
}
