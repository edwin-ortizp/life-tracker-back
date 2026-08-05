<?php

namespace App\Support;

use App\Models\MoodState;
use App\Models\User;
use Illuminate\Validation\Rule;

/**
 * Every write the settings page performs on the personal catalog. Editing an emotion
 * never rewrites the snapshots already stored in `mood_entries`: a past entry keeps the
 * emoji, word and valence it had the moment it was logged.
 */
class MoodCatalog
{
    public function __construct(private readonly MoodCatalogRestorer $restorer) {}

    /**
     * Shared by the create and the edit form so both reject the same input.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(User $user, ?string $ignoreId = null): array
    {
        return [
            'emoji' => ['required', 'string', 'max:8', 'not_regex:/[a-zA-Z0-9]/'],
            'text' => [
                'required', 'string', 'max:60',
                Rule::unique('mood_states', 'text')
                    ->where(fn ($query) => $query->where('user_id', $user->id))
                    ->ignore($ignoreId),
            ],
            'category' => ['required', Rule::in(DefaultMoodStates::categories())],
            'value' => ['required', 'integer', 'between:1,10'],
        ];
    }

    /** @param  array{emoji: string, text: string, category: string, value: int}  $data */
    public function create(User $user, array $data): MoodState
    {
        return MoodState::create([
            'user_id' => $user->id,
            'emoji' => trim($data['emoji']),
            'text' => trim($data['text']),
            'category' => $data['category'],
            'value' => (int) $data['value'],
            'default_key' => null,
            'is_active' => true,
            'is_pinned' => false,
            'sort_order' => 0,
        ]);
    }

    /**
     * Only the catalog entry changes; a default keeps its key so Restaurar still
     * recognizes it after a rename.
     *
     * @param  array{emoji: string, text: string, category: string, value: int}  $data
     */
    public function update(MoodState $state, array $data): void
    {
        $state->update([
            'emoji' => trim($data['emoji']),
            'text' => trim($data['text']),
            'category' => $data['category'],
            'value' => (int) $data['value'],
        ]);
    }

    /** Deactivating keeps the pin, so reactivating restores the position the user chose. */
    public function setActive(MoodState $state, bool $active): void
    {
        $state->update(['is_active' => $active]);
    }

    public function togglePin(MoodState $state): void
    {
        if ($state->is_pinned) {
            $state->update(['is_pinned' => false, 'sort_order' => 0]);

            return;
        }

        $last = (int) $this->pinned($state->user_id)->max('sort_order');

        $state->update(['is_pinned' => true, 'sort_order' => $last + 1]);
    }

    /** Swap a pinned emotion with its neighbour; -1 moves it towards the first slot. */
    public function move(MoodState $state, int $direction): void
    {
        if (! $state->is_pinned) {
            return;
        }

        $neighbour = $this->pinned($state->user_id)
            ->whereKeyNot($state->id)
            ->when(
                $direction < 0,
                fn ($query) => $query->where('sort_order', '<', $state->sort_order)->orderByDesc('sort_order'),
                fn ($query) => $query->where('sort_order', '>', $state->sort_order)->orderBy('sort_order')
            )
            ->first();

        if (! $neighbour) {
            return;
        }

        $position = $state->sort_order;
        $state->update(['sort_order' => $neighbour->sort_order]);
        $neighbour->update(['sort_order' => $position]);
    }

    /**
     * Permanent removal is reserved for custom emotions nobody ever logged. Everything
     * else is deactivated instead, so no historical entry is ever orphaned.
     */
    public function delete(MoodState $state): bool
    {
        if (! $state->isDeletable()) {
            return false;
        }

        $state->delete();

        return true;
    }

    /** @return array{created: int, reactivated: int} */
    public function restore(User $user): array
    {
        return $this->restorer->syncDefaults($user, reactivate: true);
    }

    private function pinned(int $userId)
    {
        return MoodState::withoutGlobalScopes()->where('user_id', $userId)->where('is_pinned', true);
    }
}
