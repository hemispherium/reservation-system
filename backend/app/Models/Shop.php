<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    protected $fillable = [
        'name',
        'description',
        'address',
        'phone',
    ];

    public function images()
    {
        return $this->hasMany(ShopImage::class)->orderBy('sort_order');
    }
}
