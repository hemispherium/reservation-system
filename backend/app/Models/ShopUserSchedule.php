<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopUserSchedule extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'shop_id',
        'user_id',
        'date',
        'start_time',
        'end_time',
        'is_day_off',
    ];

    protected $casts = [
        'is_day_off' => 'boolean',
        'date'       => 'date:Y-m-d',
    ];
}
