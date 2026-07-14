<?php

namespace App\Http\Controllers\Api;

use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalImportController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_key' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date_format:Y-m-d'],
            'summary' => ['required', 'string', 'max:10000'],
        ]);

        $user = $request->user();
        $existingImport = $user->journalEntries()->where('source_key', $data['source_key'])->first();

        if ($existingImport) {
            return response()->json(['status' => 'skipped', 'reason' => 'already_imported', 'id' => $existingImport->id]);
        }

        $entryForDate = $user->journalEntries()->whereDate('date', $data['date'])->first();

        if ($entryForDate) {
            return response()->json(['status' => 'skipped', 'reason' => 'journal_exists', 'id' => $entryForDate->id]);
        }

        $entry = $user->journalEntries()->create([
            'date' => $data['date'],
            'text' => $data['summary'],
            'display_time' => now()->format('H:i'),
            'source' => 'obsidian',
            'source_key' => $data['source_key'],
        ]);

        return response()->json(['status' => 'created', 'id' => $entry->id], 201);
    }
}
