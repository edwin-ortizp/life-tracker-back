<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('relationships', function (Blueprint $table) {
            $table->string('city', 120)->nullable()->after('address');
            $table->string('document_type', 16)->nullable()->after('city');
            // Encrypted by the model cast: the column holds ciphertext, never the plain number.
            $table->text('document_number')->nullable()->after('document_type');
        });
    }

    public function down(): void
    {
        Schema::table('relationships', function (Blueprint $table) {
            $table->dropColumn(['city', 'document_type', 'document_number']);
        });
    }
};
