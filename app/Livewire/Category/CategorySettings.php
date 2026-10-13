<?php

namespace App\Livewire\Category;

use App\Models\UserCategory;
use App\Support\CategoryCatalog;
use Illuminate\Support\Str;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Locked;
use Livewire\Component;

#[Layout('layouts.app')]
class CategorySettings extends Component
{
    #[Locked]
    public string $domain;
    #[Locked]
    public ?string $editingId = null;
    public string $name = '';
    public string $parent_id = '';
    public string $search = '';
    public bool $showForm = false;
    public string $message = '';

    public function mount(string $domain): void
    {
        abort_unless(isset(CategoryCatalog::DOMAINS[$domain]), 404);
        $this->domain = $domain;
    }

    private function query()
    {
        return UserCategory::where('user_id', auth()->id())->where('domain', $this->domain);
    }

    public function openForm(?string $id = null): void
    {
        $this->resetValidation();
        $this->reset(['name', 'parent_id', 'editingId']);
        if ($id) {
            $category = $this->query()->findOrFail($id);
            $this->editingId = $category->id;
            $this->name = $category->name;
            $this->parent_id = $category->parent_id ?? '';
        }
        $this->showForm = true;
    }

    public function closeForm(): void
    {
        $this->showForm = false;
        $this->resetValidation();
    }

    public function save(): void
    {
        $this->name = trim($this->name);
        $this->validate([
            'name' => ['required', 'string', 'max:100'],
            'parent_id' => ['nullable', 'uuid'],
        ]);
        if ($this->query()->where('normalized_name', mb_strtolower($this->name))
            ->when($this->editingId, fn ($q) => $q->whereKeyNot($this->editingId))->exists()) {
            $this->addError('name', 'Ya tienes una categoría con ese nombre.');
            return;
        }
        $category = $this->editingId ? $this->query()->findOrFail($this->editingId) : new UserCategory([
            'user_id' => auth()->id(), 'domain' => $this->domain, 'key' => 'cat_'.Str::uuid(),
        ]);
        $category->fill(['name' => $this->name, 'parent_id' => $this->parent_id ?: null])->save();
        $this->message = 'Categoría guardada.';
        $this->closeForm();
    }

    public function delete(string $id): void
    {
        try {
            $this->query()->findOrFail($id)->delete();
            $this->message = 'Categoría eliminada.';
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->message = $e->validator->errors()->first();
        }
    }

    public function render()
    {
        $records = $this->query()->with('parent')->orderBy('name')->get();
        $ordered = $records->whereNull('parent_id')->flatMap(fn ($root) => collect([$root])->concat($records->where('parent_id', $root->id)));
        return view('livewire.category.category-settings', [
            'records' => $ordered->filter(fn ($c) => $this->search === '' || Str::contains(mb_strtolower($c->path_label), mb_strtolower($this->search))),
            'parents' => $this->editingId && $records->where('parent_id', $this->editingId)->isNotEmpty()
                ? [] : $records->whereNull('parent_id')->where('id', '!=', $this->editingId)->pluck('name', 'id')->all(),
            'module' => CategoryCatalog::DOMAINS[$this->domain][2],
            'label' => CategoryCatalog::DOMAINS[$this->domain][1],
        ]);
    }
}
