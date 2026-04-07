<?php

namespace App\Providers;

use Cloudinary\Cloudinary;
use Illuminate\Support\ServiceProvider;

class CloudinaryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(Cloudinary::class, function () {
            return new Cloudinary(env('CLOUDINARY_URL'));
        });
    }

    public function boot(): void
    {
        //
    }
}
