@if (app()->environment('local') && is_file(public_path('hot')))
    @vite('resources/css/app.css')
@else
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
@endif
