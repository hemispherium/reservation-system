<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\JsonResponse;

class ShopController extends Controller
{
    public function index(): JsonResponse
    {
        $shops = Shop::with('images')->orderBy('id')->get();
        return response()->json($shops);
    }

    public function show(Shop $shop): JsonResponse
    {
        $shop->load('images');
        return response()->json($shop);
    }

    public function staff(Shop $shop): JsonResponse
    {
        $staff = $shop->staff()->get()->map(fn($u) => ['id' => $u->id, 'name' => $u->name, 'profile_image_url' => $u->profile_image_url]);
        return response()->json($staff);
    }
}
