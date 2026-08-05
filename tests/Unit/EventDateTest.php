<?php

namespace Tests\Unit;

use App\Support\EventDate;
use Illuminate\Support\Carbon;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class EventDateTest extends TestCase
{
    public function test_an_exact_day_uses_the_same_start_and_end(): void
    {
        $date = EventDate::fromInput(EventDate::DAY, date: '2026-11-14');

        $this->assertSame('2026-11-14', $date->startsOn->toDateString());
        $this->assertSame('2026-11-14', $date->endsOn->toDateString());
        $this->assertSame('14 de noviembre de 2026', $date->label());
    }

    public function test_a_month_spans_the_whole_month_but_is_shown_without_a_day(): void
    {
        $date = EventDate::fromInput(EventDate::MONTH, year: 2026, month: 11);

        $this->assertSame('2026-11-01', $date->startsOn->toDateString());
        $this->assertSame('2026-11-30', $date->endsOn->toDateString());
        $this->assertSame('noviembre de 2026', $date->label());
    }

    public function test_a_year_spans_the_whole_year_but_is_shown_as_a_year(): void
    {
        $date = EventDate::fromInput(EventDate::YEAR, year: 2019);

        $this->assertSame('2019-01-01', $date->startsOn->toDateString());
        $this->assertSame('2019-12-31', $date->endsOn->toDateString());
        $this->assertSame('2019', $date->label());
    }

    public function test_a_range_keeps_its_own_bounds(): void
    {
        $date = EventDate::fromInput(EventDate::RANGE, startsOn: '2026-06-01', endsOn: '2026-06-15');

        $this->assertSame(EventDate::RANGE, $date->precision);
        $this->assertSame('2026-06-01', $date->startsOn->toDateString());
        $this->assertSame('2026-06-15', $date->endsOn->toDateString());
        $this->assertSame('1 – 15 de junio de 2026', $date->label());
    }

    public function test_an_inverted_range_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        EventDate::fromInput(EventDate::RANGE, startsOn: '2026-06-15', endsOn: '2026-06-01');
    }

    public function test_a_month_without_a_year_is_rejected(): void
    {
        $this->expectException(InvalidArgumentException::class);

        EventDate::fromInput(EventDate::MONTH, month: 11);
    }

    public function test_persisted_attributes_keep_the_declared_precision(): void
    {
        $attributes = EventDate::fromInput(EventDate::MONTH, year: 2026, month: 2)->toAttributes();

        $this->assertSame([
            'date_precision' => 'month',
            'starts_on' => '2026-02-01',
            'ends_on' => '2026-02-28',
            'event_date' => '2026-02-01',
        ], $attributes);
    }

    public function test_a_window_is_upcoming_until_its_last_day_has_passed(): void
    {
        $date = EventDate::fromInput(EventDate::RANGE, startsOn: '2026-06-01', endsOn: '2026-06-15');

        $this->assertTrue($date->isUpcoming(Carbon::parse('2026-06-15')));
        $this->assertFalse($date->isUpcoming(Carbon::parse('2026-06-16')));
    }
}
