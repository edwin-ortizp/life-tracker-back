<?php

namespace App\CalDav;

use Illuminate\Support\Facades\Auth;
use Sabre\DAV\PropPatch;
use Sabre\DAVACL\PrincipalBackend\AbstractBackend;

class PrincipalBackend extends AbstractBackend
{
    public function getPrincipalsByPrefix($prefixPath): array
    {
        if ($prefixPath !== 'principals' || ! Auth::check()) {
            return [];
        }

        return [$this->principal()];
    }

    public function getPrincipalByPath($path): ?array
    {
        if (! Auth::check() || $path !== 'principals/'.Auth::user()->email) {
            return null;
        }

        return $this->principal();
    }

    public function updatePrincipal($path, PropPatch $propPatch): void {}

    public function searchPrincipals($prefixPath, array $searchProperties, $test = 'allof'): array
    {
        if (! Auth::check() || $prefixPath !== 'principals') {
            return [];
        }

        $email = Auth::user()->email;
        foreach ($searchProperties as $property => $value) {
            if ($property === '{http://sabredav.org/ns}email-address' && strcasecmp($email, (string) $value) === 0) {
                return ['principals/'.$email];
            }
        }

        return [];
    }

    public function getGroupMemberSet($principal): array
    {
        return [];
    }

    public function getGroupMembership($principal): array
    {
        return [];
    }

    public function setGroupMemberSet($principal, array $members): void {}

    private function principal(): array
    {
        $user = Auth::user();

        return [
            'uri' => 'principals/'.$user->email,
            '{DAV:}displayname' => $user->full_name ?: $user->name,
            '{http://sabredav.org/ns}email-address' => $user->email,
        ];
    }
}
