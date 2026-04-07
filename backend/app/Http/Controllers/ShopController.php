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
}
