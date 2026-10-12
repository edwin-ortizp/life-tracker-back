<?php
namespace App\Models;
use App\Models\Traits\BelongsToUser;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
class PlanCategory extends Model
{
    use BelongsToUser, HasUuids;
    protected $fillable = ['user_id', 'name', 'icon', 'normalized_name'];
    public static function normalized(string $name): string { return Str::lower(preg_replace('/\s+/u', ' ', trim($name))); }
    public function plans(): HasMany { return $this->hasMany(Plan::class); }
    protected static function booted(): void {
        static::saving(function (self $category) { $category->name = preg_replace('/\s+/u', ' ', trim($category->name)); $category->normalized_name = self::normalized($category->name); });
        static::updated(function (self $category) { if ($category->wasChanged('name')) Plan::withoutGlobalScopes()->where('user_id', $category->user_id)->where('plan_category_id', $category->id)->update(['category' => $category->name]); });
    }
}
