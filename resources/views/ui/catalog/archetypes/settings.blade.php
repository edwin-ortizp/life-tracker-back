<x-layouts.catalog-screen title="Arquetipo de configuración">
    <x-module-shell module="settings" title="Ajustes" subtitle="Preferencias transversales" archetype="settings">
        <x-slot:actions>
            <x-ui.action variant="filled" icon="bi-check2">Guardar cambios</x-ui.action>
        </x-slot:actions>

        <x-ui.section title="Perfil" description="Cómo te identificamos dentro de la aplicación.">
            <x-ui.field name="displayName" label="Nombre visible" value="Persona usuaria" help="Aparece en los saludos del inicio." />
            <x-ui.select name="startModule" label="Módulo inicial" :options="[
                'home' => 'Inicio',
                'tasks' => 'Tareas',
                'water' => 'Hidratación',
            ]" selected="home" />
        </x-ui.section>

        <x-ui.section title="Preferencias" description="Ajustes que afectan a toda la interfaz." :level="3">
            <x-ui.textarea name="notes" label="Notas personales" rows="3" help="Solo tú las ves." />
        </x-ui.section>

        <x-ui.section title="Zona de riesgo" :level="3">
            <x-ui.card variant="outlined">
                <p class="md-body-small">Eliminar la cuenta borra todos los registros de forma permanente.</p>

                <x-slot:actions>
                    <x-ui.destructive-action label="Eliminar la cuenta" action="deleteAccount" variant="outlined"
                                             message="Se eliminan todos tus registros de forma permanente." />
                </x-slot:actions>
            </x-ui.card>
        </x-ui.section>
    </x-module-shell>
</x-layouts.catalog-screen>
