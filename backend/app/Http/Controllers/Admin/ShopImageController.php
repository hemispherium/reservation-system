<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\ShopImage;
use Cloudinary\Cloudinary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopImageController extends Controller
{
    public function __construct(private Cloudinary $cloudinary) {}

    public function store(Request $request, Shop $shop): JsonResponse
    {
        $request->validate([
            'images'   => 'required|array',
            'images.*' => 'required|image|max:5120',
        ]);

        $nextOrder = $shop->images()->max('sort_order') + 1;
        $created = [];

        foreach ($request->file('images') as $file) {
            $result = $this->cloudinary->uploadApi()->upload(
                $file->getRealPath(),
                ['folder' => "reservation_system/" . config('app.env') . "/shops/{$shop->id}"]
            );

            $created[] = $shop->images()->create([
                'path'       => $result['public_id'],
                'sort_order' => $nextOrder++,
            ]);
        }

        return response()->json($created, 201);
    }

    public function destroy(Shop $shop, ShopImage $image): JsonResponse
    {
        abort_if($image->shop_id !== $shop->id, 404);
        $this->cloudinary->uploadApi()->destroy($image->path);
        $image->delete();

        return response()->json(null, 204);
    }

    public function reorder(Request $request, Shop $shop): JsonResponse
    {
        $request->validate([
            'order'   => 'required|array',
            'order.*' => 'required|integer',
        ]);

        foreach ($request->input('order') as $sortOrder => $imageId) {
            $shop->images()->where('id', $imageId)->update(['sort_order' => $sortOrder]);
        }

        return response()->json($shop->images()->orderBy('sort_order')->get());
    }
}
