<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Opcodes\LogViewer\Facades\LogViewer;
use Tests\TestCase;

class LogViewerTest extends TestCase
{
    private string $directory;

    protected function setUp(): void
    {
        parent::setUp();
        $name = 'log-viewer-test-'.bin2hex(random_bytes(6));
        $this->directory = storage_path('logs/'.$name);
        mkdir($this->directory, 0777, true);
        config(['log-viewer.allowed_emails' => ['admin@example.com'], 'log-viewer.include_files' => [$name.'/*.log']]);
        LogViewer::clearFileCache();
    }

    protected function tearDown(): void
    {
        \Illuminate\Support\Facades\File::deleteDirectory($this->directory);
        parent::tearDown();
    }

    private function signIn(string $email = 'admin@example.com'): void
    {
        $this->actingAs(new User(['email' => $email]));
    }

    public function test_guests_cannot_access_page_or_api(): void
    {
        $this->get('/log-viewer')->assertRedirect('/login');
        $this->getJson('/log-viewer/api/files')->assertUnauthorized();
        $this->deleteJson('/log-viewer/api/files/unknown')->assertUnauthorized();
    }

    public function test_access_is_restricted_in_local_and_production(): void
    {
        foreach (['local', 'production'] as $environment) {
            $this->app->instance('env', $environment);
            $this->signIn('other@example.com');
            $this->get('/log-viewer')->assertForbidden();
            $this->getJson('/log-viewer/api/files')->assertForbidden();
            $this->signIn(' ADMIN@example.com ');
            $this->get('/log-viewer')->assertOk()->assertHeader('Cache-Control', 'no-store, private');
            $this->getJson('/log-viewer/api/files')->assertOk();
        }
    }

    public function test_empty_allowlist_denies_all_operations(): void
    {
        $this->signIn();
        config(['log-viewer.allowed_emails' => []]);
        $this->get('/log-viewer')->assertForbidden();
        $this->getJson('/log-viewer/api/files')->assertForbidden();
        foreach (['viewLogViewer', 'downloadLogFile', 'downloadLogFolder', 'deleteLogFile', 'deleteLogFolder'] as $ability) {
            $this->assertFalse(Gate::allows($ability));
        }
    }

    public function test_authorized_user_can_read_download_and_delete_only_test_logs(): void
    {
        $path = $this->directory.'/integration.log';
        file_put_contents($path, "[2026-10-11 10:00:00] testing.ERROR: LogViewer integration marker\n");
        $this->signIn();
        $file = LogViewer::getFiles()->first();
        $this->assertNotNull($file);
        $identifier = $file->identifier;
        $this->getJson('/log-viewer/api/logs?'.http_build_query(['file' => $identifier]))
            ->assertOk()->assertSee('LogViewer integration marker');
        $url = $this->getJson('/log-viewer/api/files/'.$identifier.'/download/request')->assertOk()->json('url');
        $this->get($url)->assertOk();
        $this->signIn('other@example.com');
        $this->get($url)->assertForbidden();
        $this->deleteJson('/log-viewer/api/files/'.$identifier)->assertForbidden();
        $this->assertFileExists($path);
        $this->signIn();
        $this->deleteJson('/log-viewer/api/files/'.$identifier)->assertOk();
        $this->assertFileDoesNotExist($path);
    }

    public function test_deletion_requires_csrf_even_without_origin_headers(): void
    {
        $this->signIn();
        // Laravel normally skips CSRF in tests; enable the real middleware check.
        $this->app->instance('env', 'production');
        $this->deleteJson('/log-viewer/api/files/unknown')->assertStatus(419);
    }
}
