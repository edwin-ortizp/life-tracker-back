<?php

namespace App\Http\Controllers\Api;

use App\Models\MoodEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MoodImportController
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'source_key' => ['required', 'string', 'max:255'],
            'date' => ['required', 'date_format:Y-m-d'],
            'time' => ['required', 'date_format:H:i'],
            'mood_state_id' => ['required', 'uuid'],
        ]);

        $user = $request->user();
        $existingImport = $user->moodEntries()->where('source_key', $data['source_key'])->first();

        if ($existingImport) {
            return response()->json(['status' => 'skipped', 'reason' => 'already_imported', 'id' => $existingImport->id]);
        }

        $moodState = $user->moodStates()->find($data['mood_state_id']);

        if (!$moodState) {
            return response()->json(['message' => 'El estado de ánimo no pertenece a este usuario.'], 422);
        }

        $recordedAt = Carbon::createFromFormat('Y-m-d H:i', $data['date'].' '.$data['time'], config('app.timezone'));
        $entry = $user->moodEntries()->create([
            'date' => $data['date'],
            'emoji' => $moodState->emoji,
            'text' => $moodState->text,
            'value' => $moodState->value,
            'time' => $data['time'],
            'timestamp' => $recordedAt->timestamp,
            'mood_state_id' => $moodState->id,
            'source' => 'obsidian',
            'source_key' => $data['source_key'],
        ]);

        return response()->json(['status' => 'created', 'id' => $entry->id], 201);
    }
}
