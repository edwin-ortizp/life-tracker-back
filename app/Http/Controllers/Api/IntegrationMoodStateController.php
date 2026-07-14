<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IntegrationMoodStateController
{
    public function index(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $request->user()->moodStates()
                ->orderByDesc('value')
                ->orderBy('text')
                ->get(['id', 'emoji', 'text', 'value', 'category']),
        ]);
    }
}
