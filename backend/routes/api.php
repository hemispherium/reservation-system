<?php

use App\Http\Controllers\Admin\ShopController as AdminShopController;
use App\Http\Controllers\Admin\ShopImageController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

Route::get('shops', [ShopController::class, 'index']);
Route::get('shops/{shop}', [ShopController::class, 'show']);

Route::prefix('admin')->group(function () {
    Route::apiResource('shops', AdminShopController::class);
    Route::post('shops/{shop}/images', [ShopImageController::class, 'store']);
    Route::delete('shops/{shop}/images/{image}', [ShopImageController::class, 'destroy']);
    Route::patch('shops/{shop}/images/reorder', [ShopImageController::class, 'reorder']);
});
