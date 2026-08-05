<?php

namespace App\Http\Controllers\Ui;

use App\Http\Controllers\Controller;
use App\Support\Ui\ComponentCatalog;
use App\Support\Ui\ScreenArchetype;
use Illuminate\View\View;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class CatalogController extends Controller
{
    public function index(): View
    {
        return view('ui.catalog.index', [
            'layers' => ComponentCatalog::byLayer(),
        ]);
    }

    public function show(string $component): View
    {
        if (! ComponentCatalog::has($component)) {
            throw new NotFoundHttpException("El catálogo no documenta el componente {$component}.");
        }

        return view('ui.catalog.show', [
            'entry' => ComponentCatalog::entry($component),
            'partial' => ComponentCatalog::examplePartial($component),
            'layers' => ComponentCatalog::byLayer(),
        ]);
    }

    /**
     * Pantalla representativa de un arquetipo, construida solo con fixtures.
     */
    public function archetype(string $archetype): View
    {
        if (! in_array($archetype, ScreenArchetype::ALL, true)) {
            throw new NotFoundHttpException("El arquetipo {$archetype} no está aprobado.");
        }

        return view("ui.catalog.archetypes.{$archetype}", [
            'archetype' => $archetype,
        ]);
    }
}
