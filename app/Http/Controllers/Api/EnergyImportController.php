<?php

namespace App\Http\Controllers\Api;

use App\Models\EnergyEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnergyImportController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_key' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'level' => ['required', 'integer', 'between:1,5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $existingImport = $user->energyEntries()->where('source_key', $data['source_key'])->first();

        if ($existingImport) {
            return response()->json(['status' => 'skipped', 'reason' => 'already_imported', 'id' => $existingImport->id]);
        }

        $recordedAt = Carbon::createFromFormat('Y-m-d H:i', $data['date'].' '.$data['time'], config('app.timezone'));
        $entry = $user->energyEntries()->create([
            'date' => $data['date'],
            'level' => $data['level'],
            'time' => $data['time'],
            'timestamp' => $recordedAt->timestamp,
            'comment' => $data['comment'] ?? null,
            'source' => 'obsidian',
            'source_key' => $data['source_key'],
        ]);

        return response()->json(['status' => 'created', 'id' => $entry->id], 201);
    }
}
