<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Widen the profile and normalise the birthday into year, month and day
     * without inventing a birth year that the user never provided.
     */
    public function up(): void
    {
        Schema::table('relationships', function (Blueprint $table) {
            $table->string('pronouns')->nullable()->after('nickname');
            $table->string('occupation')->nullable()->after('pronouns');
            $table->string('organization')->nullable()->after('occupation');
            $table->string('address')->nullable()->after('organization');
            $table->string('photo_path')->nullable()->after('address');
            $table->text('general_notes')->nullable()->after('photo_path');
            $table->smallInteger('birthday_year')->nullable()->after('birthday_date');
            $table->integer('contact_frequency_days')->nullable()->after('next_contact_suggested_at');
        });

        foreach (DB::table('relationships')->whereNotNull('birthday_date')->cursor() as $relationship) {
            $birthday = \Illuminate\Support\Carbon::parse($relationship->birthday_date);

            DB::table('relationships')->where('id', $relationship->id)->update([
                'birthday_year' => (int) $birthday->year,
                'birthday_month' => $relationship->birthday_month ?? (int) $birthday->month,
                'birthday_day' => $relationship->birthday_day ?? (int) $birthday->day,
            ]);
        }

        Schema::table('relationships', function (Blueprint $table) {
            $table->index(['user_id', 'birthday_month', 'birthday_day'], 'rel_birthday_index');
        });
    }

    public function down(): void
    {
        Schema::table('relationships', function (Blueprint $table) {
            $table->dropIndex('rel_birthday_index');
            $table->dropColumn([
                'pronouns',
                'occupation',
                'organization',
                'address',
                'photo_path',
                'general_notes',
                'birthday_year',
                'contact_frequency_days',
            ]);
        });
    }
};
