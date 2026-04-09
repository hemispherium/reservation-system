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

    public function staff()
    {
        return $this->belongsToMany(User::class);
    }

    public function schedules()
    {
        return $this->hasMany(ShopUserSchedule::class);
    }

    public function courses()
    {
        return $this->hasMany(Course::class)->orderBy('sort_order');
    }
}
