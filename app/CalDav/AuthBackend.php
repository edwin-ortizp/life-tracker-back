<?php

namespace App\CalDav;

use App\Models\IntegrationToken;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Sabre\DAV\Auth\Backend\AbstractBasic;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;

class AuthBackend extends AbstractBasic
{
    protected $realm = 'Life Tracker CalDAV';

    public function check(RequestInterface $request, ResponseInterface $response): array
    {
        [$authenticated, $reason] = parent::check($request, $response);

        return $authenticated ? [true, 'principals/'.Auth::user()->email] : [false, $reason];
    }

    protected function validateUserPass($username, $password): bool
    {
        if (! is_string($password) || ! str_starts_with($password, IntegrationToken::CALDAV_PREFIX)) {
            return false;
        }

        $user = User::query()->whereRaw('LOWER(email) = ?', [mb_strtolower((string) $username)])->first();
        if (! $user) {
            return false;
        }

        $token = IntegrationToken::query()
            ->where('user_id', $user->id)
            ->where('purpose', 'caldav')
            ->where('token_hash', hash('sha256', $password))
            ->whereNull('revoked_at')
            ->first();
        if (! $token) {
            return false;
        }

        $token->forceFill(['last_used_at' => now()])->save();
        Auth::setUser($user);

        return true;
    }
}
