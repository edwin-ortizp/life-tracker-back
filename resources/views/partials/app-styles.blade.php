@if (app()->environment('local') && is_file(public_path('hot')))
    @vite('resources/css/app.css')
@else
    <link rel="stylesheet" href="{{ asset('css/app.css') }}?v={{ filemtime(public_path('css/app.css')) }}">
@endif
