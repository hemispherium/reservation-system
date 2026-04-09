<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\JsonResponse;

class CourseController extends Controller
{
    public function index(Shop $shop): JsonResponse
    {
        return response()->json($shop->courses()->where('is_active', true)->get());
    }
}
