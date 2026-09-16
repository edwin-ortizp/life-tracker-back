<?php

namespace Tests\Feature\OAuth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Mcp\Server\Registrar;
use Tests\TestCase;

class OAuthDiscoveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_authorization_server_metadata_describes_the_flow_mcp_clients_need(): void
    {
        $this->getJson('/.well-known/oauth-authorization-server')
            ->assertOk()
            ->assertJsonPath('issuer', url('/'))
            ->assertJsonPath('authorization_endpoint', route('passport.authorizations.authorize'))
            ->assertJsonPath('token_endpoint', route('passport.token'))
            ->assertJsonPath('registration_endpoint', url('oauth/register'))
            ->assertJsonPath('response_types_supported', ['code'])
            // Sin S256 los clientes no pueden completar PKCE.
            ->assertJsonPath('code_challenge_methods_supported', ['S256'])
            ->assertJsonPath('grant_types_supported', ['authorization_code', 'refresh_token'])
            ->assertJsonPath('scopes_supported', [Registrar::OAUTH_SCOPE]);
    }

    public function test_the_protected_resource_metadata_points_back_at_this_server(): void
    {
        $this->getJson('/.well-known/oauth-protected-resource')
            ->assertOk()
            ->assertJsonPath('resource', url('/'))
            ->assertJsonPath('authorization_servers', [url('/')])
            ->assertJsonPath('scopes_supported', [Registrar::OAUTH_SCOPE]);
    }

    public function test_the_nested_variant_resolves_the_mcp_endpoint_path(): void
    {
        $this->getJson('/.well-known/oauth-protected-resource/life-tracker')
            ->assertOk()
            ->assertJsonPath('resource', url('/life-tracker'));
    }

    public function test_an_unauthenticated_mcp_call_advertises_where_to_discover_oauth(): void
    {
        $response = $this->postJson('/life-tracker', []);

        $response->assertUnauthorized();
        $this->assertStringContainsString(
            'resource_metadata="'.url('/.well-known/oauth-protected-resource/life-tracker').'"',
            $response->headers->get('WWW-Authenticate'),
        );
    }
}
