<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Shop;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShopStaffController extends Controller
{
    public function index(Shop $shop): JsonResponse
    {
        return response()->json(
            $shop->staff()->get()->map(fn($u) => $this->format($u))
        );
    }

    public function sync(Request $request, Shop $shop): JsonResponse
    {
        $request->validate([
            'user_ids'   => 'present|array',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $shop->staff()->sync($request->input('user_ids'));

        return response()->json(
            $shop->staff()->get()->map(fn($u) => $this->format($u))
        );
    }

    // staffロールのユーザー一覧（割り当て候補）
    public function staffUsers(): JsonResponse
    {
        return response()->json(
            User::role('staff')->get()->map(fn($u) => $this->format($u))
        );
    }

    private function format(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'email'             => $user->email,
            'profile_image_url' => $user->profile_image_url,
        ];
    }
}
