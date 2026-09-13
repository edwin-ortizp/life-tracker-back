<?php

namespace Tests\Feature;

use App\Actions\SeedDefaultCircles;
use App\Models\Circle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DefaultCirclesTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_new_user_starts_with_the_default_circles(): void
    {
        $user = User::factory()->create();

        $this->assertSame(
            SeedDefaultCircles::NAMES,
            Circle::withoutGlobalScopes()->where('user_id', $user->id)->orderBy('sort_order')->pluck('name')->all(),
        );
    }

    public function test_seeding_again_does_not_duplicate_circles(): void
    {
        $user = User::factory()->create();

        SeedDefaultCircles::for($user);

        $this->assertSame(count(SeedDefaultCircles::NAMES), Circle::withoutGlobalScopes()->where('user_id', $user->id)->count());
    }
}
