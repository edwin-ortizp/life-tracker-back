<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationMoodStateController
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            // Only what can still be logged; entries already imported stay readable
            // through their own snapshot, so deactivating never breaks history.
            'data' => $request->user()->moodStates()
                ->active()
                ->prioritized()
                ->get(['id', 'emoji', 'text', 'value', 'category']),
        ]);
    }
}
