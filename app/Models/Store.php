<?php

namespace App\Models;

use App\Models\Traits\BelongsToUser;
use App\Services\Meal\CatalogNames;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Store extends Model
{
    use BelongsToUser, HasUuids;

    protected $fillable = ['name', 'normalized_name'];

    protected static function booted(): void
    {
        static::saving(fn (Store $store) => $store->normalized_name = CatalogNames::normalize($store->name));
    }

    public function prices()
    {
        return $this->hasMany(ShoppingItemPrice::class);
    }

    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /** Une esta tienda a otra: sus precios y marcas blancas pasan a la destino y esta se elimina. */
    public function mergeInto(Store $target): void
    {
        DB::transaction(function () use ($target) {
            abort_unless(auth()->id() && $this->user_id === auth()->id() && $target->user_id === auth()->id(), 403);
            $references = Purchase::where('store_id', $this->id)->whereNotNull('ticket_reference')->pluck('ticket_reference');
            if (Purchase::where('store_id', $target->id)->whereIn('ticket_reference', $references)->exists()) {
                throw ValidationException::withMessages(['store' => 'Las tiendas tienen referencias de ticket repetidas; corrígelas antes de fusionar.']);
            }
            Purchase::where('store_id', $this->id)->update(['store_id' => $target->id]);
            $this->prices()->update(['store_id' => $target->id]);
            Brand::where('store_id', $this->id)->update(['store_id' => $target->id]);
            $this->delete();
        });
    }
}
