<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Shop;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index(Shop $shop): JsonResponse
    {
        return response()->json($shop->courses()->get());
    }

    public function store(Request $request, Shop $shop): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration'    => 'required|integer|min:10',
            'price'       => 'required|integer|min:0',
            'is_active'   => 'boolean',
            'sort_order'  => 'integer|min:0',
        ]);

        $data['sort_order'] ??= $shop->courses()->max('sort_order') + 1;
        $course = $shop->courses()->create($data);

        return response()->json($course, 201);
    }

    public function update(Request $request, Shop $shop, Course $course): JsonResponse
    {
        abort_if($course->shop_id !== $shop->id, 404);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'duration'    => 'sometimes|integer|min:10',
            'price'       => 'sometimes|integer|min:0',
            'is_active'   => 'sometimes|boolean',
            'sort_order'  => 'sometimes|integer|min:0',
        ]);

        $course->update($data);

        return response()->json($course);
    }

    public function destroy(Shop $shop, Course $course): JsonResponse
    {
        abort_if($course->shop_id !== $shop->id, 404);
        $course->delete();

        return response()->json(null, 204);
    }
}
