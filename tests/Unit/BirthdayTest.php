<?php

namespace Tests\Unit;

use App\Support\Birthday;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\TestCase;

class BirthdayTest extends TestCase
{
    public function test_an_impossible_day_and_month_combination_is_rejected(): void
    {
        $this->assertNull(Birthday::make(2, 30));
        $this->assertNull(Birthday::make(13, 1));
        $this->assertNull(Birthday::make(null, 12));
    }

    public function test_february_29_is_accepted_as_a_birthday(): void
    {
        $this->assertNotNull(Birthday::make(2, 29));
    }

    public function test_the_next_occurrence_crosses_into_the_following_year(): void
    {
        $birthday = Birthday::make(1, 8);

        $this->assertSame(
            '2027-01-08',
            $birthday->nextOccurrence(Carbon::parse('2026-12-20'))->toDateString()
        );
    }

    public function test_a_birthday_today_is_its_own_next_occurrence(): void
    {
        $birthday = Birthday::make(7, 12);
        $today = Carbon::parse('2026-07-12');

        $this->assertTrue($birthday->isToday($today));
        $this->assertSame('2026-07-12', $birthday->nextOccurrence($today)->toDateString());
        $this->assertSame(0, $birthday->daysUntil($today));
    }

    public function test_february_29_is_celebrated_on_february_28_in_common_years(): void
    {
        $birthday = Birthday::make(2, 29, 2000);

        $this->assertSame(
            '2027-02-28',
            $birthday->nextOccurrence(Carbon::parse('2026-06-01'))->toDateString()
        );
        $this->assertSame(
            '2028-02-29',
            $birthday->nextOccurrence(Carbon::parse('2027-06-01'))->toDateString()
        );
    }

    public function test_age_is_only_calculated_when_the_birth_year_is_known(): void
    {
        $withYear = Birthday::make(5, 17, 1990);
        $withoutYear = Birthday::make(5, 17);
        $reference = Carbon::parse('2026-08-04');

        $this->assertSame(37, $withYear->ageOnNextOccurrence($reference));
        $this->assertSame(36, $withYear->currentAge($reference));
        $this->assertNull($withoutYear->ageOnNextOccurrence($reference));
        $this->assertNull($withoutYear->currentAge($reference));
    }
}
