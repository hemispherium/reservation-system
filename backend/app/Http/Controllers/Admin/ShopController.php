<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function index(): JsonResponse
    {
        $shops = Shop::with('images')->orderBy('id', 'desc')->get();
        return response()->json($shops);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'address'     => 'required|string|max:255',
            'phone'       => 'required|string|max:20',
        ]);

        $shop = Shop::create($validated);
        $shop->load('images');

        return response()->json($shop, 201);
    }

    public function show(Shop $shop): JsonResponse
    {
        $shop->load('images');
        return response()->json($shop);
    }

    public function update(Request $request, Shop $shop): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'address'     => 'required|string|max:255',
            'phone'       => 'required|string|max:20',
        ]);

        $shop->update($validated);
        $shop->load('images');

        return response()->json($shop);
    }

    public function destroy(Shop $shop): JsonResponse
    {
        $shop->delete();
        return response()->json(null, 204);
    }
}
