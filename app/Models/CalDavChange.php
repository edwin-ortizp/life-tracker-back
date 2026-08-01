<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CalDavChange extends Model
{
    protected $table = 'caldav_changes';

    protected $fillable = ['user_id', 'task_id', 'uri', 'operation'];
}
