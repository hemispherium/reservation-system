<?php

namespace App\Models;

use Cloudinary\Cloudinary;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class ShopImage extends Model
{
    protected $appends = ['url'];

    protected $fillable = [
        'shop_id',
        'path',
        'sort_order',
    ];

    protected function url(): Attribute
    {
        return Attribute::get(function () {
            $cloudinary = app(Cloudinary::class);
            return (string) $cloudinary->image($this->path)->toUrl();
        });
    }

    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }
}
