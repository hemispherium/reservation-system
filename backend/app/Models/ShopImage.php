<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShopImage extends Model
{
    protected $fillable = [
        'shop_id',
        'path',
        'sort_order',
    ];

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
