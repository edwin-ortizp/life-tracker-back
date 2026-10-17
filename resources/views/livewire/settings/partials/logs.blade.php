@php($logsAvailable = $logs['available'] && \Illuminate\Support\Facades\Gate::allows('viewLogViewer'))

<x-ui.section title="Logs de la aplicación"
              description="Revisa los errores y eventos que MiSo registra en el servidor."
              :level="2">
    @if ($logsAvailable)
        <x-ui.card variant="outlined" icon="bi-journal-text" iconTone="secondary">
            <dl class="md-context-list">
                <div><dt>Carpeta</dt><dd class="md-secret__value">{{ $logs['path'] }}</dd></div>
                <div><dt>Archivo principal</dt><dd>{{ $logs['file'] ?? 'Todavía no se ha creado' }}</dd></div>
                @if ($logs['size'] !== null)
                    <div><dt>Tamaño</dt><dd>{{ \Illuminate\Support\Number::fileSize($logs['size']) }}</dd></div>
                @endif
                @if ($logs['modifiedAt'])
                    <div><dt>Última escritura</dt><dd>{{ $logs['modifiedAt']->diffForHumans() }}</dd></div>
                @endif
                @if ($logs['version'])
                    <div><dt>Versión del visor</dt><dd>{{ $logs['version'] }}</dd></div>
                @endif
            </dl>

            <p class="md-body-small">
                El visor muestra los logs de toda la aplicación, no solo los tuyos. Puedes buscar, filtrar, descargar y
                eliminar archivos; eliminar un archivo borra sus registros.
            </p>

            <x-slot:actions>
                <x-ui.action variant="filled" icon="bi-journal-text" :href="route('log-viewer.index')">
                    Abrir visor de logs
                </x-ui.action>
            </x-slot:actions>
        </x-ui.card>
    @else
        <x-ui.card variant="outlined" icon="bi-journal-text" iconTone="secondary">
            <p class="md-body-small">
                El visor de logs no está disponible para tu cuenta. Agrega tu correo a
                <code>LOG_VIEWER_ALLOWED_EMAILS</code> en el archivo <code>.env</code> y ejecuta
                <code>php artisan config:clear</code>.
            </p>
        </x-ui.card>
    @endif
</x-ui.section>
