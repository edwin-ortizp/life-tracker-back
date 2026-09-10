<?php

use App\Mcp\Servers\LifeTrackerServer;
use Laravel\Mcp\Facades\Mcp;

Mcp::web('life-tracker', LifeTrackerServer::class)
    ->middleware(['integration.token', 'throttle:60,1']);
