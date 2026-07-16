@if (app()->environment('local') && is_file(public_path('hot')))
    @vite('resources/js/app.js')
@else
    <script type="module" src="{{ asset('js/app.js') }}"></script>
@endif
