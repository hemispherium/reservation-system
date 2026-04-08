<?php

use App\Http\Controllers\Admin\ShopController as AdminShopController;
use App\Http\Controllers\Admin\ShopImageController;
use App\Http\Controllers\Admin\ShopStaffController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\UserImageController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ShopController;
use Illuminate\Support\Facades\Route;

// 公開ルート
Route::get('shops', [ShopController::class, 'index']);
Route::get('shops/{shop}', [ShopController::class, 'show']);
Route::get('shops/{shop}/staff', [ShopController::class, 'staff']);

// 認証ルート
Route::post('auth/register', [AuthController::class, 'register']);
Route::post('auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);
});

// 管理ルート（認証必須）
Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
    // 店舗管理（admin・staff 共通）
    Route::apiResource('shops', AdminShopController::class);
    Route::post('shops/{shop}/images', [ShopImageController::class, 'store']);
    Route::delete('shops/{shop}/images/{image}', [ShopImageController::class, 'destroy']);
    Route::patch('shops/{shop}/images/reorder', [ShopImageController::class, 'reorder']);
    Route::get('shops/{shop}/staff', [ShopStaffController::class, 'index']);
    Route::put('shops/{shop}/staff', [ShopStaffController::class, 'sync']);
    Route::get('staff-users', [ShopStaffController::class, 'staffUsers']);

    // ユーザー管理（admin のみ）
    Route::middleware('role:admin')->group(function () {
        Route::get('roles', [UserController::class, 'roles']);
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/image', [UserImageController::class, 'update']);
        Route::delete('users/{user}/image', [UserImageController::class, 'destroy']);
    });
});
