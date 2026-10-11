<?php

use App\Http\Middleware\PreventLogViewerCaching;
use Opcodes\LogViewer\Http\Middleware\AuthorizeLogViewer;

return [
    'enabled' => env('LOG_VIEWER_ENABLED', true),
    'route_path' => 'log-viewer',
    'require_auth_in_production' => true,
    'allowed_emails' => array_values(array_filter(array_map(
        static fn (string $email): string => strtolower(trim($email)),
        explode(',', (string) env('LOG_VIEWER_ALLOWED_EMAILS', '')),
    ))),
    'middleware' => [PreventLogViewerCaching::class, 'web', 'auth', AuthorizeLogViewer::class],
    'api_middleware' => [PreventLogViewerCaching::class, 'web', 'auth', AuthorizeLogViewer::class],
    'include_files' => ['*.log', '**/*.log'],
    'back_to_system_url' => '/',
    'back_to_system_label' => 'Volver a Life Tracker',
];
